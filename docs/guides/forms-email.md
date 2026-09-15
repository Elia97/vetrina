# Form

Convenzioni stabilite dallo stack dei form dietro un'azione — il form di contatto è il riferimento.
Rimandi: `ui-components.md` (le primitive Field e Select), `seo.md` (i meta a livello di pagina).

## Architettura a strati (una competenza per modulo)

| Strato | File | Possiede |
|---|---|---|
| Schema | `src/lib/contact.ts` | il contratto zod, condiviso client e server |
| Azione | `src/actions/index.ts` | orchestrazione, guardie anti-abuso, politica d'errore |
| Fornitore | `src/lib/vendor/brevo.ts` | client HTTP, risultato come valore, gestione della chiave (condiviso) |
| Email | `src/emails/contact.ts` | rendering HTML, escaping, testi |
| Interfaccia | `src/components/contact/*.astro` | markup, chiavi i18n, accessibilità |
| Comportamento | `contact-form-behavior.ts` | da FormData a payload tipizzato (`buildPayload`) |
| Binder | `src/components/forms/action-submit.ts` | ciclo di invio, feedback, aggancio multi-istanza (condiviso) |
| Errori di campo | `src/components/forms/field-errors.ts` | slot d'errore per campo, `aria-invalid`, focus (condiviso) |
| Honeypot | `src/lib/forms/honeypot.ts` e `honeypot-schema.ts` | nome del campo esca e predicato, e la sua forma zod (condivisi) |

Gli strati si parlano attraverso interfacce strette: `ContactPayload` deriva dall'azione
(`Parameters<typeof actions.contact>[0]`), quindi una modifica allo schema si propaga al client al
momento del type-check.

## Validazione

- Un solo schema zod (`contactSchema`) è il contratto: l'azione lo valida lato server a prescindere
  da qualunque `required` lato client.
- Il consenso GDPR è `z.literal(true)`: una casella esplicita, mai pre-spuntata, con il link alla
  privacy dentro l'etichetta (`contact-consent-field.astro`).
- I limiti dei campi rispecchiano i `maxlength` dell'interfaccia: vanno tenuti allineati. Il `254`
  sull'email è il limite di indirizzo dell'RFC 5321, non un numero tondo.
- `z` viene da `astro/zod`, non da `astro:content`: solo il primo esporta il namespace di tipi che
  `z.infer` legge.
- Il testo facoltativo è `.default('')`, mai `.optional()`: sotto `exactOptionalPropertyTypes` una
  proprietà assente e una facoltativa non sono intercambiabili, e i template email verificano che il
  valore non sia vuoto.
- Ogni schema di azione include `honeypotShape` (vedi Protezione dagli abusi): l'esca è parte del
  contratto, non qualcosa che l'handler legge dal corpo grezzo.
- **[HARD] Con `accept: 'form'` un input vuoto arriva come `null`, non come `''`.** Ogni campo di uno
  schema condiviso col client ha quindi bisogno di un `z.preprocess` che lo normalizzi — e saltarlo
  sull'**honeypot** scarta in silenzio invii legittimi, perché `.catch()` legge quel `null` come
  un'esca riempita.
- **`security.actionBodySizeLimit` è 1 MB di default.** Un'azione che accetta un file deve alzarlo
  in `astro.config.mjs`, altrimenti Astro risponde `CONTENT_TOO_LARGE` (413) prima ancora che
  l'handler parta.

**[HARD] Ogni messaggio viene dal dizionario.** Gli errori di zod sono in inglese («Invalid email») e
arrivano all'utente tali e quali: `applyFieldErrors()` li stampa dritti negli slot dei campi. I
campi si costruiscono da `src/lib/forms/form-fields.ts` (`requiredText`, `emailField`,
`consentField`), che portano messaggi `error:` risolti tramite `useTranslations()`;
`form-fields.test.ts` verifica ciascuno contro il dizionario, così un campo non può ricadere in
silenzio sul messaggio di default.

Lo schema sta a livello di modulo, fuori da ogni richiesta, quindi i messaggi si risolvono nella
**lingua di default**. Una seconda lingua significa costruire lo schema dentro l'handler
dell'azione, dove `Astro.currentLocale` è noto.

**[HARD] `required` nel markup significa obbligatorio nello schema.** Il form è `novalidate`, perché
altrimenti i fumetti del browser segnalerebbero il primo campo non valido con parole e stile propri,
prima dello schema, senza impostare `aria-invalid` né riempire uno slot. Questo rende lo schema
l'unico controllo che gira davvero: un campo marcato `required` ma con default `''` accetta un invio
vuoto da qualunque cosa che non sia un browser. `form-fields.test.ts` fissa quella parità campo per
campo.

## Politica d'errore (rumorosa dove conta)

La politica si sceglie dalla **forma** dell'azione:

- **A ventaglio** (più chiamate al fornitore, alcune best-effort): si fallisce rumorosamente
  **solo** sulla chiamata che perderebbe il dato. Nel contatto, se fallisce la **notifica al
  titolare** il contatto è perso → `ActionError` (che diventa lo stato d'errore del form); risposta
  automatica e inserimento nel CRM sono best-effort, si registrano con `console.error` e non
  arrivano mai all'utente.
- **A chiamata singola**: l'unica risposta dell'azione *è* l'esito, e non c'è niente da tenere
  best-effort. La politica si inverte e si fallisce rumorosamente subito: un risultato non `ok` →
  `ActionError`, senza inghiottire niente.
- **[HARD] Fallire rumorosamente non basta da solo: il payload va messo per iscritto.** L'unico
  recapito dell'invio è il fornitore, quindi il guasto che fa scattare l'`ActionError` è esattamente
  quello che lo distrugge. L'handler registra `[contact] lead-recovery` con l'input già validato
  prima di sollevare l'errore; tieni quella riga in ogni azione che aggiungi, e cercala nei log di
  runtime dopo un disservizio. Porta quello che serve a ricontattare chi ha scritto, cioè nome,
  cognome ed email, e del messaggio solo la lunghezza, che basta a distinguere un contatto vero da
  uno vuoto: il testo libero è la parte che fa della riga un problema di GDPR. La proiezione è
  `leadRecoveryRecord()` in `src/lib/contact.ts`; un progetto che vuole il payload intero registra
  `input` e lo dichiara nella sua informativa.
- Rate limiting: `rateLimit('contact:' + clientAddress)`, una finestra scorrevole in memoria (5 ogni
  60 secondi), per istanza. Ogni form ha il **suo prefisso di ambito** (`'<nome>:' + clientAddress`)
  così le finestre restano indipendenti. Si azzera agli avvii a freddo e non è condivisa fra le
  istanze serverless: è uno strato anti-abuso di base, non una quota vera. Per una quota vera la
  strada è uno store condiviso fra le istanze (per esempio un servizio chiave-valore gestito).

## Protezione dagli abusi

L'azione è pubblica e non autenticata, quindi le guardie stanno nell'handler **dalla più economica**:
quella che costa una chiamata di rete gira solo per un invio che sembra già umano.

1. **Honeypot** — `HONEYPOT_FIELD` (`website`) in `src/lib/forms/honeypot.ts`. Lo schema *accetta*
   l'esca riempita invece di rifiutarla: un errore di validazione direbbe al bot quale campo lo ha
   tradito. Riempita → `console.warn` e `{ ok: true }`, senza nessuna chiamata al fornitore. Un solo
   nome condiviso dalla forma dello schema (`honeypotShape`), dall'input nascosto
   (`src/components/forms/honeypot-field.astro` — `sr-only`, `aria-hidden`, `tabindex="-1"`,
   `autocomplete="off"`) e da ogni `buildPayload`: si importa la costante, non si riscrive mai la
   stringa.
2. **Rate limit** — la finestra in memoria qui sopra.
3. **Controllo bot** — Vercel BotID Basic (gratuito su ogni piano, invisibile, senza sfide visibili).
   Tre pezzi che devono restare allineati: i rewrite in `vercel.json` (proxy di stessa origine per lo
   script della sfida, presidiato da `src/vercel-botid.test.ts`), `initFormBotId()`
   (`src/components/forms/botid.ts`) che dichiara `/_actions/contact`, e `checkBotId()` nell'handler.
   **Un percorso che manca dall'elenco lato client viene letto sempre come bot lato server.**

Regole che vale la pena tenere in un progetto:

- **`honeypot.ts` e `honeypot-schema.ts` restano due moduli.** Il comportamento del form importa la
  costante lato client, e una chiamata `z.…()` a livello di modulo non è eliminabile dal tree
  shaking: fonderli spedisce tutto Zod (~12 KB gzip) a ogni pagina con un form. `pnpm perf:bundle`
  ci fallisce sopra — misurato, `/contatti` passa da 9,8 a 22,1 KB.
- **Entrambe le metà di BotID sono dietro `import.meta.env.PROD`**: lo script della sfida è servito
  da un rewrite di `vercel.json` che `astro dev` non legge mai, quindi inizializzarlo in locale
  lascerebbe ogni POST dell'azione in attesa su un 404.
- **Si inizializza dov'è il form, non nel layout.** `initFormBotId()` gira dallo script di
  `contact-form.astro`, così solo una rotta che può inviare paga il client della sfida (+2,1 KB gzip
  su `/contatti`, niente altrove). Un form presente su tutto il sito — una newsletter nel footer — è
  il caso in cui invece conviene spostarlo nel layout.
- **Due modi di fallire, entrambi a favore del contatto.** Se `checkBotId()` solleva un errore si
  fallisce verso l'aperto (si registra e si prosegue): una guardia che si rompe non deve mai costare
  un contatto. Se invece il verdetto è «bot», decide `BOTID_ENFORCE`: non impostata o falsa
  **osserva** (verdetto registrato, invio che prosegue), vera **rifiuta** con un `ActionError`
  invece di fingere successo, così all'utente restano telefono ed email come alternativa. È
  l'opposto dell'honeypot, il cui valore sta tutto nel silenzio: lì il mittente è certamente un bot,
  qui potrebbe essere una persona.
- **Prima si osserva, poi si applica.** Il flag arriva a `false` di proposito: un falso positivo è
  invisibile — un contatto che semplicemente non arriva — quindi l'applicazione aspetta di aver
  visto un invio da browser vero passare su un deploy. Il percorso di promozione non richiede
  modifiche al codice: si guardano i log della funzione cercando `bot detected — observe mode` su
  invii che sai essere umani, e quando restano puliti si imposta `BOTID_ENFORCE=true` (Plain, **mai**
  Sensitive) nel provider di deploy e si rideploya. La classificazione gira comunque: il flag decide
  solo la conseguenza.
- BotID legge la richiesta dal contesto di Vercel: non c'è niente da passargli a mano.
- Scalata senza modifiche al codice: **Deep Analysis** dal pannello Vercel (Firewall → Rules; piano
  Pro, a pagamento per chiamata a `checkBotId()`). Resta aperto nel template un rate limit durevole:
  la finestra in memoria è l'unica quota per IP.

## Il contratto col fornitore email

- `BrevoResult = { ok: true } | { ok: false, error }`: il fallimento è un **valore**, non un'eccezione,
  e solo l'azione decide cos'è fatale.
- **Il successo di un fornitore non è sempre il 2xx che ti aspetti.** Brevo risponde **204** per un
  indirizzo già in lista: è idempotenza, non un errore, e l'azione restituisce `{ ok: true }` invece
  di duplicare un contatto. Leggi la tabella degli stati del fornitore prima di mappare le sue
  risposte.
- Il limite di frequenza dell'account Brevo è di circa 30 richieste al secondo: non va mai raggiunto
  con una raffica da SSR.
- Se manca `BREVO_API_KEY`: **in sviluppo non fa niente ma lo dice** (`console.warn`, il form
  «riesce»), **in produzione rifiuta** (un errore esplicito invece di un contatto perso in
  silenzio). Questo comportamento va tenuto per qualunque fornitore lo sostituisca.
- **Gli id facoltativi di integrazione seguono la stessa politica della chiave.** Un valore di
  configurazione facoltativo (l'id di una lista, l'id di un template) lasciato vuoto → in sviluppo
  non fa niente ma lo dice (`console.warn`, il form «riesce», risultato
  `{ ok: true, skipped: true }`), **in produzione rifiuta** (errore esplicito). È quello che permette
  di spedire una funzionalità **dietro un gate** — mergiata e collegata, dormiente finché non
  esistono le credenziali vere — senza rischiare un invio perso in silenzio in produzione.
- Mittente e destinatario vengono dall'ambiente (`CONTACT_FROM_EMAIL`, `CONTACT_FROM_NAME`,
  `CONTACT_TO_EMAIL` — schema in `astro.config.mjs`, elenco in `.env.example`). Verifica DKIM, SPF e
  DMARC del dominio mittente prima del go-live.
- **[HARD] Il destinatario di una notifica interna si decide lato server: ambiente o contenuto, mai
  input del client.** Un'azione che spedisce a qualunque indirizzo arrivi nel payload è un **open
  relay** che gira su un dominio di invio verificato: costa al dominio la sua reputazione, e mentre
  succede niente nell'applicazione sembra rotto. L'unico indirizzo che può venire dal payload è
  quello di chi ha scritto, su una risposta automatica indirizzata a lui — e a nessun altro,
  `cc` e `bcc` compresi.
- Le stringhe di errore portano l'endpoint, lo stato e i **primi 300 caratteri** del corpo:
  abbastanza per nominare un attributo rifiutato, abbastanza poco da non riversare la pagina HTML
  d'errore di un fornitore nei log della funzione.

## Rendering delle email

- Stringhe HTML semplici: layout a tabella e stili inline, perché i client email ignorano i fogli di
  stile. Palette di grigi neutri, da ristilare per progetto se serve.
- **Ogni** valore fornito dall'utente passa da `escapeHtml` prima dell'interpolazione.
  `detailRow(label, value)` salta i valori vuoti.
- `escapeHtml` sostituisce attraverso una **funzione**, mai una stringa di sostituzione: in una
  stringa, `$&` e `$1` sono pattern di sostituzione, quindi un valore utente che ne contenesse uno
  verrebbe riespanso dopo l'escaping.
- I testi sono nella lingua di default del sito, e l'oggetto porta `SITE.name`.

## Convenzioni dell'interfaccia dei form

- Il ciclo di invio vive **una volta sola** nel binder condiviso
  (`createActionFormBinding({ formSelector, buildPayload, submit })`,
  `src/components/forms/action-submit.ts`): il modulo di un singolo form fornisce solo un
  `formSelector`, un `buildPayload` e l'azione. Il binder abilita il bottone di invio quando
  aggancia il form, lo disabilita e ne cambia l'etichetta durante l'attesa (`data-i18n-sending` e
  `data-i18n-submit` sul form — i moduli di comportamento non portano stringhe), commuta i
  paragrafi `[data-form-success]` e `[data-form-error]` (`role="status"` e `role="alert"`), e
  chiama `form.reset()` in caso di successo. Non reimplementarlo mai per singolo form.
- **Multi-istanza per default**: il binder aggancia **ogni** form corrispondente con
  `querySelectorAll` e resta idempotente attraverso le view transition. Quando lo stesso form viene
  reso più di una volta nella stessa pagina, si passa una prop `idPrefix` per dare uno spazio dei
  nomi agli id di etichette e aria, così le istanze non collidono — gli attributi `name` restano
  identici, perché hanno come ambito il singolo `<form>`.
- I campi compongono le primitive `Field` con **etichette visibili**, che è il default accessibile
  (un progetto può passare a `sr-only` più placeholder come scelta estetica).
- **[HARD] Senza JavaScript il form non invia niente, e non mette niente nell'URL.** L'invio è una
  chiamata a un'Astro Action (`accept: 'json'`) da una pagina prerenderizzata, quindi non c'è un
  ripiego con `action=`, e il markup si difende da solo in tre pezzi:
  - il pulsante di invio arriva `disabled` e lo abilita il binder: finché lo script non gira il form
    non parte nemmeno con Invio, perché la specifica HTML esclude l'invio implicito quando il
    pulsante predefinito è disabilitato;
  - il form è `method="post"`: un invio partito comunque porta i campi nel corpo della richiesta,
    non nella query string che finisce nei log, nel referrer e nella cronologia;
  - un `<noscript>` rimanda ai recapiti della pagina.

  `markup-contract.test.ts` rende `contact-form.astro` e fissa tutti e tre. L'azione impone comunque
  tutto lato server, quindi un ripiego senza JS si può aggiungere senza cambiare il contratto.

### La superficie di validazione

Un errore zod arriva come `error.fields`, con chiave sul campo dello schema. Atterra sul campo, non
in una riga di riepilogo:

- ogni controllo sta accanto a un `<FieldError field="<chiave dello schema>" />` e ci punta con un
  `aria-describedby` **statico** (`fieldErrorId()` costruisce l'id a entrambi i capi, così non
  possono divergere). Lo slot si rende vuoto, e un elemento vuoto non contribuisce nessuna
  descrizione: il riferimento resta inerte finché non c'è un messaggio;
- `applyFieldErrors` scrive il primo messaggio per campo e gira `aria-invalid`; poi
  `focusFirstInvalid` sposta il focus sul primo controllo non valido **nell'ordine del DOM**, non
  nell'ordine delle chiavi di `error.fields`, che manderebbe il focus all'indietro oltre un campo
  che l'utente non ha ancora raggiunto;
- l'avviso `[data-form-error]` parla **solo** per i messaggi che non hanno uno slot in cui atterrare.
  Ripetere lì quello che un campo porta già farebbe annunciare due volte la stessa cosa a un lettore
  di schermo;
- lo slot usa `empty:sr-only`, mai `hidden` o `display:none`: nascosto in quel modo esce
  dall'albero di accessibilità e l'`aria-describedby` punta nel vuoto;
- gli errori dell'honeypot si scartano e non si rendono mai: uno slot direbbe a un bot qual è quel
  campo;
- `markup-contract.test.ts` presidia l'accoppiamento. Niente di tutto questo è verificato a compile
  time (`field` è una stringa qualunque), quindi uno slot rinominato o mancante degraderebbe solo a
  runtime, in silenzio, in un messaggio a livello di form. Il test rende i campi attraverso la
  Container API e confronta gli slot con le chiavi dello schema — **resi, non cercati col grep**: i
  nomi esistono davvero solo dopo che i componenti hanno girato, e un `aria-describedby` che punta
  nel vuoto nel sorgente è invisibile.

## Testare le azioni

L'orchestrazione è il punto in cui una regressione resta silenziosa — ogni dipendenza può essere
verde mentre l'ordine delle guardie o la politica d'errore sono invertiti — quindi è coperta in
`src/actions/{contact,guards}.test.ts`, un file per area (Biome limita i file a 200 righe). Le
fixture condivise e i mock di fornitore e BotID stanno in `test/helpers/actions.ts`.

- **Gli handler sono esportati per nome** (`handleContact`) e passati a `defineAction`, così i test
  guidano l'orchestrazione vera senza il wrapper dell'azione. `ActionContext` restringe quello che
  leggono dal contesto al solo `clientAddress`: tieni ogni azione nuova su quella forma invece di
  ricorrere all'`ActionAPIContext` di Astro.
- **Si simula il fornitore, non fetch**: `vi.mock('@/lib/vendor/brevo', …)` restituisce direttamente
  dei `BrevoResult`, con chiave sui `tags` dell'email, così i test non fissano l'ordine di
  `Promise.all`.
- **L'ambiente si guida dagli stub**: `test/stubs/astro-env-server.ts` rispecchia lo schema di
  `astro.config.mjs` leggendo da `process.env` al momento dell'import — da cui la sequenza `stubEnv`
  → `resetModules` → nuovo import, incapsulata in `importActions()`. `vi.stubEnv('PROD', true)`
  arriva a `import.meta.env.PROD` dentro il modulo importato, ed è quello che rende testabili i rami
  che esistono solo in produzione. Il nuovo import consegna anche a ogni test una finestra di rate
  limit pulita, dato che la finestra scorrevole è stato a livello di modulo.
- **`test/stubs/astro-actions.ts`** porta `isInputError` (preso parola per parola da Astro, per il
  binder lato client) più un `ActionError` rispecchiato e un `defineAction` identità. Poiché
  `resetModules` ricrea quello stub, la classe sollevata non è mai quella che un file di test aveva
  importato: si verifica su `type` e `code`, mai con `instanceof` (`rejectionOf` nell'helper fa
  esattamente questo).
- **Cosa fissano i test** (da rileggere prima di toccare un handler): la politica d'errore e
  l'ordine delle guardie qui sopra, più `TOO_MANY_REQUESTS` al sesto invio con finestre indipendenti
  per indirizzo, e `FORBIDDEN` quando BotID applica il verdetto.

## Estendere

### Un campo nuovo sul form di contatto

1. Aggiungilo a `contactSchema`, limiti compresi.
2. Rendilo nel componente `contact-*.astro` giusto (con le chiavi i18n), col suo
   `aria-describedby={fieldErrorId('<nome>')}` e un `<FieldError field="<nome>" />` fratello:
   `markup-contract.test.ts` fallisce senza.
3. Raccoglilo in `buildPayload` (`contact-form-behavior.ts`).
4. Mostralo nell'email di notifica (`detailRow` in `emails/contact.ts`).
5. Salvalo se serve (`contactAttributes` → colonne del CRM).
6. Estendi la fixture in `test/helpers/actions.ts`: `ContactRequest` ha una chiave in più, quindi i
   test dell'azione smettono di passare il type-check finché non c'è.

### Un form nuovo dietro un'azione

1. **Schema** in un suo `src/lib/<nome>.ts` (zod, condiviso client e server), che include
   `honeypotShape`. Un campo nascosto che il visitatore non vede prende `.catch(<ripiego>)`, non
   `.default()`: un valore inatteso si converte invece di far rifiutare l'invio, così un visitatore
   su un bundle vecchio in cache passa comunque.
2. **Azione** in `src/actions/index.ts`: un handler esportato `handle<Nome>` passato a
   `defineAction({ accept: 'json', input, handler })`; le guardie girano nello stesso ordine
   (honeypot → rate limit sotto il **proprio prefisso di ambito** → `assertNotBot`); la politica
   d'errore si sceglie dalla forma — una chiamata fatale → si fallisce rumorosamente sul suo
   risultato; a ventaglio → si fallisce solo sulla chiamata che perderebbe il dato. Registra
   `/_actions/<nome>` in `PROTECTED_ACTIONS` (`src/components/forms/botid.ts`), altrimenti il
   controllo legge ogni invio come un bot.
3. **Fornitore**: riusa una funzione di `src/lib/vendor/brevo.ts` (risultato come valore) o aggiungi
   un modulo fornitore fratello, tenendo la politica «in sviluppo non fa niente ma lo dice, in
   produzione rifiuta» quando manca la configurazione — chiave API e id facoltativi allo stesso
   modo.
4. **Interfaccia** in `src/components/<nome>/*.astro`: il contratto di presentazione fatto di
   `data-*` — il marcatore del form, le etichette `data-i18n-*` e i paragrafi
   `[data-form-success|error]` — più `<HoneypotField />`, un `<FieldError>` per chiave dello schema,
   e il form `method="post"` con il pulsante di invio `disabled` nel markup.
5. **Comportamento** in `src/components/<nome>/<nome>-form-behavior.ts`: un solo
   `createActionFormBinding({ formSelector, buildPayload, submit })` — si riusa il binder condiviso,
   non si reimplementa il ciclo di invio. `buildPayload` fa passare `HONEYPOT_FIELD`.
6. **Test**: un caso di `markup-contract` per gli slot del form nuovo, e
   `src/actions/<nome>.test.ts` per la sua politica d'errore. Le guardie sono già coperte una volta
   in `guards.test.ts` e non vanno ripetute form per form.

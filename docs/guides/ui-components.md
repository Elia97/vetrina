# Componenti di interfaccia

Convenzioni stabilite dallo scaffold di base (token di design, arredo di pagina). Rimandi:
`rendering-performance.md` (ciclo di vita di animazioni e rivelazioni), `seo.md` (il contratto della
head).

## Token di design

- `src/styles/tokens.css` — primitive oklch grezze, la scala di impilamento e `--radius`. **È il
  primo file da toccare quando si fa il rebranding di un progetto**, e di solito basta lui: la rampa
  `--brand-*` regge `--primary`, `--accent` e `--ring`, che si appoggiano a lei e non a
  `--neutral-*`, quindi dare a un cliente il suo colore non chiede di modificare `light.css` o
  `dark.css`. Arriva coi valori neutri, quindi l'aspetto di default è acromatico: si sostituiscono i
  gradini, non i ruoli. Quando il design chiede un altro ruolo, come un primario che non è il
  gradino scuro della rampa o un fondo bianco al posto del quasi bianco, un derivato sposta quel
  ruolo su un altro gradino in `light.css` e `dark.css`, e le chiavi restano quelle. Non serve un
  foglio a parte: `src/styles/contrast.test.ts` legge proprio quei due fogli, e verifica le coppie
  anche dopo lo spostamento. I nomi dei token seguono il gradino della scala Tailwind che contengono
  (`--neutral-700` è il valore neutral-700 di Tailwind; un gradino etichettato male è un difetto,
  non una scelta di gusto).
- **I ruoli di stato hanno due gradini, e così il loro primo piano.** `destructive`, `success` e
  `warning` sono ciascuno un gradino più scuro per il tema chiaro e uno più chiaro per lo scuro,
  perché nessun valore singolo supera 4,5:1 su entrambi — e dato che lo stesso token è sia testo
  (`text-destructive`) sia riempimento (`bg-destructive`), il tema scuro gira il suo primo piano su
  uno scuro. I gradini di `destructive`, `red-700` e `red-400`, reggono 4,5:1 anche sul riempimento
  dell'hover, che lo avvicina al fondo. `src/styles/contrast.test.ts` verifica ogni coppia.
- **Le `z-*` vengono dalla scala in `tokens.css`**, non da un numero che è capitato di far
  funzionare: `--z-raised` < `--z-dropdown` < `--z-header` < `--z-overlay` < `--z-skip-link`. Un
  overlay nuovo si colloca leggendola, e si raggiunge attraverso le utility `z-*` nominate in
  `globals.css`, mai con uno `z-[…]` arbitrario. La scala ordina solo elementi fratelli: **qualunque
  `z-*` su un contenitore intermedio apre un contesto di impilamento**, e un popover al suo interno
  non potrà mai salire sopra qualcosa che sta fuori, qualunque numero porti. Quando un overlay
  finisce sotto l'header, cerca uno `z-*` su un antenato prima di alzare quello dell'overlay.
- **Tempi e curve sono token come i colori**, e `tokens.css` è l'unico foglio a cui è permesso
  scriverne uno per esteso: `--ease-emphasized` e `--duration-slower` stanno lì, e i fogli degli
  effetti li consumano. `src/styles/motion.test.ts` lo verifica: un `cubic-bezier(` o una durata
  letterale dentro una `transition` o una `animation` ci fallisce. Un fallback `var(--x, 0.08s)` è
  esente, perché è il default di una singola istanza e non un tempo del sistema. Un progetto che
  aggiunge altri gradini li nomina sugli stessi due assi; dichiararli in `@theme` invece che in
  `:root` genera anche la utility `ease-*` corrispondente, cosa che `:root` non fa.
- **La tipografia di controlli, etichette e badge è un token come i colori.** `tokens.css` porta tre
  ruoli, `--control-*` per `Button`, `--label-*` per `Label` di `field/` e `--badge-*` per `Badge`,
  ciascuno con `font-family`, `font-weight`, `text-transform` e `letter-spacing`
  (`--control-font-family`, `--label-letter-spacing` e così via). Le primitive li leggono attraverso
  le utility `type-control`, `type-label` e `type-badge` di `typography.css`, e nella classe non
  scrivono né la famiglia, né il peso, né il maiuscolo, né la spaziatura. I default rifanno la
  tipografia di prima: il peso è 500 e il resto è `inherit`, cioè arriva dall'antenato, tranne il
  maiuscolo dei controlli, che è `none` perché il browser non lo fa ereditare a un `<button>`; così
  vale anche per `<Button as="a">`. Badge ed etichette partono dagli stessi valori, ma ciascuno nei
  suoi token: cambiare `--label-*` non tocca i badge, e un design che li vuole diversi cambia
  `--badge-*`. Una parte del sito che vuole bottoni, etichette o badge diversi riassegna i token su
  un suo antenato, e cambia quello che sta sotto e niente fuori:

  ```css
  .back-office {
    --control-font-family: var(--font-stack-condensed);
    --control-text-transform: uppercase;
    --control-letter-spacing: 0.04em;
  }
  ```

  Dentro una parte riassegnata `inherit` non toglie il valore, riprende quello dell'antenato: per
  tornare al testo normale si scrive `none` o `normal`. `src/styles/typography.test.ts` verifica che
  ogni token esista, che le utility li leggano tutti e che le primitive non scrivano una tipografia
  loro.
- **Titoli ed eyebrow hanno la tipografia nei token, sugli stessi quattro assi.** `--heading-*` vale
  per `Heading` e `--eyebrow-*` per `SectionLabel`. I titoli hanno tre fasce, ciascuna con la sua
  utility:
  - `type-heading-display` per `display`, con una spaziatura sua, `--heading-display-letter-spacing`,
    che di default è quella di `tracking-tight`;
  - `type-heading` per `h1` e `h2`;
  - `type-heading-minor` per `h3` e `h4`, con un peso suo, `--heading-minor-font-weight`.

  Ogni fascia scrive tutte e quattro le proprietà. Un'utility con una proprietà sola esce dopo le
  classi di Tailwind, e vincerebbe su un `font-bold` passato da fuori. La famiglia di default è
  `--font-display`, quella dei webfont registrati. I corpi restano nelle varianti di
  `headingVariants`: sono responsivi, e un design che li cambia cambia la variante.

  L'eyebrow prende il colore da `--eyebrow-color`, che sta in `light.css` e in `dark.css` perché
  nomina `--primary`. Sopra una foto nessun colore del testo regge da solo, e lì si accende il fondo:
  `--eyebrow-background`, `--eyebrow-padding` ed `--eyebrow-radius`, spenti di default. Misurato in
  Chromium sopra la velatura dell'hero con immagine e una foto bianca, il primario della base regge
  5,03:1, mentre un primario arancio scende sotto 2:1. Il segno davanti all'etichetta è lo slot
  `marker` di `SectionLabel`, e il punto pulsante è il suo ripiego.

  Un derivato con i titoli in maiuscolo, l'eyebrow condensato e il fondo sopra la foto riassegna:

  ```css
  :root {
    --heading-font-weight: 700;
    --heading-minor-font-weight: 600;
    --heading-text-transform: uppercase;
    --heading-display-letter-spacing: normal;
    --eyebrow-font-family: var(--font-stack-condensed);
    --eyebrow-text-transform: uppercase;
    --eyebrow-letter-spacing: 0.12em;
  }
  .dark {
    --eyebrow-background: var(--background);
    --eyebrow-padding: 0.25rem 0.75rem;
    --eyebrow-radius: 9999px;
  }
  ```

  Il blocco `.dark` copre l'hero con immagine, che è un'isola scura. La barra al posto del punto si
  passa nello slot: `<span slot="marker" aria-hidden="true" class="h-0.5 w-6 bg-current"></span>`.
  `src/styles/typography.test.ts` e `src/components/ui/section-label.test.ts` verificano token,
  utility e primitive.
- **Anche misure, contorno, hover e focus dei controlli sono token.** `tokens.css` porta le misure:
  - altezza e corpo di ogni taglia di `Button`, da `--control-sm-height` e `--control-sm-font-size`
    fino a `--control-xl-*`;
  - lo spessore del contorno di `outline`, `--control-outline-border-width`;
  - l'hover di `default` e `destructive`, `--control-hover-mix`;
  - il distacco dell'anello del focus sulle varianti piene, `--control-ring-offset`;
  - altezza e corpo dei campi, `--field-height` e `--field-font-size`, per `Input`, `Textarea` e
    `Select` con la sua lista.

  Le primitive leggono questi token con le utility di `globals.css`:
  - `control-sm` … `control-xl` per le taglie e per i loro gemelli `icon-*`;
  - `field-text` per il corpo dei campi;
  - `bg-hover-<ruolo>` per l'hover.

  I token che nominano un ruolo stanno invece accanto ai ruoli, in `light.css` e in `dark.css`:
  - il colore del contorno di `outline`, `--control-outline-border-color`, su `--border`;
  - l'ombra del focus dei campi, `--field-focus-shadow`, che è l'anello di 2px su `--ring`;
  - il colore del bordo al focus, `--field-focus-border-color`, su `--input`, quindi fermo.

  Il tema scuro li ripete con lo stesso valore. Un token si risolve dove è dichiarato, e senza la
  ripetizione un'isola `.dark`, come il banner, erediterebbe quello calcolato sul tema chiaro.

  `--control-hover-mix` è il colore e la quota che l'hover mescola al riempimento: il default,
  `transparent 10%`, è il riempimento al 90%, e `black 11%` lo scurisce. Sotto Safari 16.2 l'hover
  non cambia il fondo, perché lì `color-mix()` non c'è (vedi `mix:` in § Modi di dire).

  Chromium arrotonda per difetto lo spessore di un bordo, e 1,5px diventa 1px. Per questo il
  contorno di `outline` è un bordo di 1px, e quello che supera il pixel lo dipinge un'ombra interna
  dello stesso colore. Il focus dei campi ottiene lo stesso effetto con `--field-focus-shadow`.

  Il distacco si dipinge con `--background`, come ogni offset di ring, e su una foto o un gradiente
  fa da alone (§ Modi di dire). Per questo è spento, e si accende dove l'anello si confonde con il
  riempimento.

  Un progetto vuole il bottone grande più alto, il contorno nel colore del testo, l'hover che
  scurisce e il focus dei campi sul bordo. Riassegna i token in un foglio che segue quelli dei temi:

  ```css
  :root {
    --control-lg-height: 3.25rem;
    --control-lg-font-size: 1.0625rem;
    --control-outline-border-width: 1.5px;
    --control-hover-mix: black 11%;
    --control-ring-offset: 2px;
    --field-height: 3rem;
  }
  :root,
  .dark {
    --control-outline-border-color: var(--foreground);
    --field-focus-shadow: inset 0 0 0 0.5px var(--foreground);
    --field-focus-border-color: var(--foreground);
  }
  .dark {
    --control-hover-mix: white 10%;
  }
  ```

  L'ultimo blocco c'è perché, dove il primo piano è scuro, la miscela col nero abbassa il contrasto
  dell'hover. `src/styles/controls.test.ts` verifica tre cose:
  - che ogni token stia nel suo foglio;
  - che le utility li leggano;
  - che le primitive non scrivano misure, hover o focus loro.
- `src/styles/light.css` e `dark.css` — la mappatura dei ruoli semantici (nomi shadcn:
  `--background`, `--primary`, `--destructive`, …). **Queste chiavi non si rinominano mai**: i
  componenti e le utility le danno per assodate. Il tema scuro sovrascrive le stesse chiavi sotto
  `.dark`.
- `src/styles/globals.css` — l'orchestratore: la catena di `@import`, `@custom-variant dark` (nella
  forma ufficiale v4 `&:where(.dark, .dark *)`), il rimappaggio `@theme inline` verso le utility, il
  layer di base e il CSS delle animazioni.
- `src/styles/typography.css` — le utility `type-*` dei ruoli tipografici, ciascuna sui quattro
  token del suo ruolo in `tokens.css`. La importa `globals.css`.

I token dei gradienti seguono la stessa logica di livello — il livello È la decisione sul tema. Un
gradiente che deve reagire al tema vive in `light.css` e `dark.css` con una sovrascrittura per lo
scuro; un gradiente FISSO fra i temi per decisione esplicita di prodotto vive in `tokens.css` senza
sovrascrittura. Entrambi si consumano con la sintassi a proprietà arbitraria di Tailwind
`bg-(image:--nome-gradiente)`: il cast `image:` è obbligatorio, perché un gradiente è una
`background-image` e non un colore.

Biome interpreta le direttive Tailwind grazie a `css.parser.tailwindDirectives` in `biome.json`: non
toglierlo, senza quello `@theme` e `@apply` non si leggono.

**[HARD] In un file `.astro` Biome arriva solo al frontmatter.** La parte di template esce byte per
byte come è scritta, con tre conseguenze che vale la pena conoscere prima di fidarsi di un
`pnpm run ci` verde: l'ordine delle classi Tailwind viene ordinato in automatico solo dentro `cn` e
`cva` e nei `.tsx`, quindi nel markup `.astro` l'ordine è affar tuo (e riordinarlo a mano altrove è
puro rumore nel diff); le regole di accessibilità non vedono mai quel markup, quindi un `<img>`
senza `alt` passa il gate — a prenderlo sono `astro check` e un audit Lighthouse; e nemmeno le
regole sul numero di righe contano quei file.

## Tema scuro

- Il tema è la classe `.dark` su `<html>`, commutata da `src/components/head/theme-script.astro`
  (inline anti-FOUC nell'`<head>`, gestore di click delegato su `[data-theme-toggle]`, riapplicato
  su `astro:after-swap`).
- Entrambi i temi dichiarano `color-scheme`, così l'interfaccia nativa (controlli di form, barre di
  scorrimento) segue il tema.
- I bottoni di commutazione portano `aria-pressed`, sincronizzato dallo script del tema: un
  interruttore nuovo ha bisogno solo dell'attributo `data-theme-toggle` più un `aria-pressed="false"`
  iniziale.
- I due meta `theme-color` (`head/icons.astro`) arrivano con una media query
  `prefers-color-scheme`, che è il default corretto senza JavaScript ma ignora l'interruttore. Lo
  script gira `media` fra `all` e `not all`, così la chrome del browser segue il tema applicato.
  Rigira su `DOMContentLoaded` per una ragione: su un caricamento a freddo lo script inline gira
  nell'`<head>` *prima* che il parser arrivi a quei meta, quindi la prima passata non trova niente
  da sincronizzare e la chrome continuerebbe a seguire la preferenza di sistema.

## Contrasto su sfondi compositi

**Sopra un gradiente, un pannello smerigliato o una foto, il testo non prende opacità: prende un
token pieno.** Un'alfa che si legge bene sopra la tappa più scura crolla su quella più chiara: lo
stesso `white/55` può passare da circa 6:1 a circa 2,3:1 lungo un solo gradiente, e nessuna alfa
sotto l'opacità piena recupera 4,5:1 all'estremo chiaro.

Lighthouse non lo prende. Non compone l'alfa sopra un gradiente o un'immagine, quindi la pagina
risulta pulita all'audit mentre in pratica viola la WCAG 1.4.3. Se un progetto introduce sfondi
compositi, il contratto deve vivere in un test unitario che calcola luminanza relativa → alfa sopra
→ rapporto per ogni coppia, verificato contro la tappa **peggiore**, non contro la media.

- **I bordi possono restare in alfa** — un bordo pieno trasforma un campo in una scatola riempita —
  ma si dimensionano contro il 3:1 della WCAG 1.4.11 su *entrambi* i lati: il riempimento dentro e
  lo sfondo fuori.
- **Le coppie di token piatti quel test ce l'hanno già**: `src/styles/contrast.test.ts` legge
  `tokens.css`, `light.css` e `dark.css` e verifica ogni coppia primo piano/sfondo a 4,5:1 e ogni
  confine di controllo a 3:1, in entrambi i temi. Verifica anche il primo piano di `default` e
  `destructive` sul riempimento dell'hover, mescolato con `--control-hover-mix` e composto sul fondo
  e sulla card come lo compone il browser. Un rebranding che ne porta una sotto il pavimento
  ci fallisce. Due conseguenze da conoscere prima di «riordinarli» rimettendoli insieme: `--border`
  e `--input` sono token diversi di proposito (un divisorio contro il confine di un controllo), e
  `--destructive` ha bisogno di un gradino più chiaro nel tema scuro **con il primo piano girato su
  uno scuro**, perché lo stesso token è testo (`text-destructive`) e riempimento
  (`bg-destructive`).
- **L'unica deroga è il testo grande** (≥24px, o ≥18,7px in grassetto), dove la 1.4.3 chiede 3:1
  invece di 4,5:1 — e solo dove il pavimento è verificato contro la tappa peggiore. Sotto quella
  dimensione la deroga non esiste.
- Un titolo con gradiente in `bg-clip-text` è il caso legittimo per l'alfa: lì la trasparenza *è*
  l'effetto, e un token pieno lo cancellerebbe.

## Contenuti dell'arredo

La struttura di header, footer e skip-link viene da `src/lib/site.ts` (`SITE`): nav, CTA, link
legali, social. I testi NON stanno lì: le voci portano chiavi di dizionario i18n risolte tramite
`useTranslations(Astro.currentLocale)` (`src/i18n/strings/<lingua>.ts`). Nessuna etichetta fissa nei
componenti; i link interni passano da `localizedHref()` così si localizzano insieme al sito. Anche
le CTA dei contenuti (l'hero, `cta-banner`, le sezioni di `gen:section`) si localizzano, con
`ctaHref()`: un percorso che comincia con `/` prende il prefisso della lingua, un'ancora o un URL
esterno restano come sono.

L'identità legale viene invece da `src/lib/company.ts` (`COMPANY`): la riga in fondo al footer porta
ragione sociale, sede e partita IVA, e i recapiti di `/contatti` portano telefono, email e sede.
L'indirizzo in una riga lo rende `src/components/layout/company-address.astro` in entrambi i posti.
Il telefono sta in E.164 in `phone`, per `tel:` e per il JSON-LD, e nella forma che si legge in
`phoneDisplay`.

Il controllo delle preferenze cookie del footer è un `<button type="button" aria-haspopup="dialog">`:
apre il pannello della CMP, non porta a una pagina.

## Modi di dire di Tailwind v4 (non tornare alle abitudini della v3)

- **Mai `outline-none`.** Un `ring` è una box-shadow, e le box-shadow spariscono in modalità
  forced-colors: lì `outline-none` lascia un controllo senza nessun indicatore di focus.
  `focus-visible:outline-hidden` tiene un contorno *trasparente* che il contrasto elevato di Windows
  ridipinge, ed è il motivo per cui ogni stile di focus nelle primitive accoppia i due.
- **Preferisci `outline` a `ring` per tutto ciò che non è un controllo di form.** Un contorno sta
  nello spazio vuoto e mostra lo sfondo vero; un offset di ring deve indovinare un colore di sfondo
  che il componente non può conoscere, e lo sbaglia nel momento in cui il controllo finisce su un
  gradiente o su una fascia colorata. `.focus-ring` (`globals.css`) è la utility basata su contorno
  per i focusabili personalizzati. Le primitive tengono un anello, `focus-visible:ring-2 ring-ring`
  nei bottoni e `--field-focus-shadow` nei campi, perché lì lo stile di focus funge anche da alone
  attorno al bordo del campo: è un uso legittimo, non un residuo.
- Proprietà logiche sull'asse inline (`start-4`, `ms-*`): il template è pronto per l'i18n e deve
  sopravvivere a una lingua da destra a sinistra.
- `overflow-wrap: anywhere`, non `break-word`, quando una parola lunga non deve far esplodere una
  traccia flex o grid: solo `anywhere` abbassa la dimensione *minima* di contenuto della scatola,
  che è quella su cui la traccia viene misurata.
- `min-h-svh` per i gusci a viewport intero (stabile su mobile; `dvh` scatta durante lo scroll, e
  `100vh` deborda sotto la barra degli indirizzi espansa).
- Nomi di utility attuali: `backdrop-blur-sm` (il `backdrop-blur` nudo è l'alias di compatibilità v3,
  deprecato).
- Le utility numeriche sono dinamiche in v4 (`z-100` compila senza configurazione).
- **Una tinta di sfondo sotto il 50% su un ruolo si scrive con `mix:`**, come
  `mix:bg-foreground/10`. I ruoli puntano a variabili che il tema scuro ridefinisce, quindi dove
  `color-mix()` manca, sotto Safari 16.2, Tailwind ripiega sul ruolo pieno: il fondo al 10% di
  `foreground` diventa il colore del testo. Dentro `mix:` la regola sta in `@supports`, e lì la tinta
  sparisce; dal 50% in su il pieno è l'approssimazione giusta. Le regole `mix:` escono dopo ogni variante di
  Tailwind e dopo le classi senza variante, quindi uno stato che deve restare pieno esclude la tinta
  (`not-aria-pressed:hover:mix:…`); per la stessa ragione una classe di sfondo passata da fuori a
  una primitiva non la batte, e tailwind-merge non la toglie: si passa anche con `mix:` davanti. Una
  tinta sotto il 50% senza `mix:` fa fallire `src/styles/surface-tints.test.ts`.
- **Le classi vengono solo da `src/`**: `globals.css` importa Tailwind con `source("..")`. Senza, il
  rilevamento automatico legge ogni file che git non ignora, e le parole delle guide, di `CLAUDE.md`
  o di `astro.config.mjs` diventano regole del CSS costruito che nessun componente usa. Una classe
  che vive in un file fuori da `src/` si dichiara con `@source` in `globals.css`.

## Pattern di accessibilità nell'arredo

- `src/components/layout/skip-link.astro`: è il primo elemento focusabile e punta a
  `<main id="main-content" tabindex="-1">` (è il tabindex a far muovere davvero il focus). Nascosto
  con `sr-only` e ripristinato con utility prefissate `focus:` — ricorda che `not-sr-only` azzera il
  padding, quindi anche il padding va prefissato con `focus:`.
- **La voce della pagina corrente porta `aria-current`** nelle tre `<nav>` dell'arredo (header,
  nav mobile, link legali del footer): `page` sulla voce della pagina aperta, `true` su quella
  della sezione quando si è in una sua sottopagina, e `/` non è mai una sezione. È lo schema del
  Service navigation di GOV.UK. Le tre rendono ogni voce con `src/components/layout/nav-link.astro`,
  che localizza l'`href` e calcola il valore con `ariaCurrent()` in `src/i18n/path.ts`, confrontando
  l'`href` della voce con il percorso corrente riportato alla lingua di default.
- **Lo stile della voce corrente sta sull'attributo**, non su una classe calcolata nel markup: la
  variante `aria-[current]:` di Tailwind v4 genera il selettore `[aria-current]`, che copre `page` e
  `true`, e dà sottolineatura e colore pieno del testo. Sulle altre voci `ariaCurrent()` restituisce
  `undefined`, che omette l'attributo: Astro rende un `false` come `aria-current="false"`, e il
  selettore prende anche quello.
- **Il selettore di lingua** (`src/components/layout/language-switcher.astro`) sta nell'header e
  nella nav mobile, e compare solo quando la pagina esiste in almeno due lingue. La lingua corrente
  è testo con `aria-current="true"`, le altre sono link con `lang` e `hreflang`, e ogni nome è
  scritto nella lingua che nomina (`localeName()` in `src/i18n/locales.ts`). Una pagina che tiene
  fuori dal prefetch le sue versioni nelle altre lingue passa `languagePrefetch={false}` a
  `MainLayout`, che lo porta ai due selettori come `data-astro-prefetch="false"` su ogni link.
- I glifi delle icone sono `aria-hidden` con l'etichetta sul controllo; il selettore di variazione
  testuale (`&#xFE0E;`) va sui codepoint che WebKit renderebbe come emoji.
- Mattoni per gli overlay (per menu e dialog che un progetto aggiunge):
  `lib/overlay/trap-focus.ts` (`cycleFocus`, da chiamare dal keydown del contenitore, con il Tab che
  cicla a entrambi i capi) e `lib/overlay/scroll-lock.ts` (`lockScroll` e `unlockScroll` con
  conteggio dei riferimenti; `resetScrollLock()` su `astro:after-swap`, così i blocchi non si
  trascinano fra le view transition).
- **[HARD] Ogni `focus()` programmatico prende `{ preventScroll: true }`.** Il browser porta in vista
  l'elemento che riceve il focus: aprire un pannello fa scorrere il suo stesso contenitore, e
  ripristinare il focus alla chiusura fa saltare la pagina dove sta l'elemento precedente — che,
  dopo un qualsiasi scorrimento, è fuori schermo. Lo fanno sia `route-focus.ts` sia `mobile-nav.ts`.
- **L'interruttore di un overlay si aggancia a `click`, non a `pointerup`.** Sul touch il
  `pointerup` scatta per primo e il `click` che segue atterra su qualunque cosa si trovi ora sotto
  il dito, riaprendo quello che si era appena chiuso.
- **Un `<dialog>` a schermo intero è il proprio sfondo, per quanto riguarda il bersaglio
  dell'evento.** L'elemento dialog riempie il viewport, quindi un click fuori dal contenuto ha come
  bersaglio il *dialog*, mai `::backdrop`: si confronta col rettangolo del contenuto invece di
  verificare se il bersaglio è lo sfondo.
- **Un `<video>` con la sorgente ancora attaccata continua a bufferizzare dopo la chiusura
  dell'overlay.** Va staccata (o messo in pausa e svuotato `src`) alla chiusura, altrimenti un
  lightbox chiuso continua a scaricare byte.
- **Il focus dopo una navigazione lato client** (`lib/a11y/route-focus.ts`, agganciato una volta nel
  layout). `<ClientRouter />` ripristina il focus solo dentro i sottoalberi
  `[data-astro-transition-persist]`, e il template non ne ha, quindi senza questo ogni navigazione
  butta il focus su `<body>` (WCAG 2.4.3). L'eccezione per l'hash e il motivo per cui non usa
  `createMotionBinding` sono documentati accanto al binder.

## Scorrimento morbido (quando un progetto lo aggiunge)

Il template non porta nessuna libreria di scroll. Tre progetti hanno aggiunto la stessa — `lenis`, su
`^1.3` — arrivando ognuno allo stesso wrapper attorno a `createMotionBinding` e
`prefersReducedMotion`, che qui ci sono già. Quello che hanno dovuto scoprire:

- **La pulizia è vuota di proposito.** L'istanza deve sopravvivere a una view transition:
  distruggerla su `astro:before-swap` lascia la pagina successiva a scorrere in modo nativo per i
  fotogrammi che precedono il setup, e si legge come uno scatto a ogni navigazione. Quello che fa il
  setup, invece, è chiamare `resize()` quando un'istanza è già in esecuzione, perché il documento
  sotto è cambiato.
- **Il ciclo `raf` si ferma da solo** tornando senza riprogrammarsi quando l'istanza non c'è più. Un
  ciclo che continua a chiamare `raf()` su un'istanza distrutta è la perdita tipica qui, e costa il
  lavoro di un fotogramma a ogni tick per tutto il resto della sessione.
- **[HARD] Il reduced motion deve distruggere, non saltare.** Onorare la preferenza al momento del
  setup non basta: la media query può cambiare a pagina aperta, e l'ascoltatore deve smontare
  l'istanza e ricostruirla al ritorno. Una libreria di scorrimento morbido che continua a girare
  sotto `prefers-reduced-motion: reduce` è un difetto di accessibilità che nessun gate qui prende.
- Si impossessa dello scorrimento a livello globale, quindi `scroll-behavior: smooth` nel CSS e
  qualunque `scrollIntoView({ behavior: 'smooth' })` smettono di essere ciò che muove la pagina:
  vanno instradati attraverso l'istanza invece di lasciarli entrambi in gioco.

## View transition nominate (quando un progetto le aggiunge)

Il template porta `<ClientRouter />` col suo dissolvenza incrociata di default e **nessun gruppo
nominato**. Nel momento in cui un progetto comincia a nominare elementi, ognuna delle regole qui
sotto è un guasto che è più facile ereditare che riscoprire.

**Superfici e testo sono due comportamenti, non uno.**

- Le *superfici* (fasce, card, copertine) fanno dissolvenza incrociata **simultanea e
  complementare** mentre si trasformano: stessa durata, stessa curva, keyframe opposti, così le due
  opacità sommano sempre a 1. Mettere le dissolvenze in sequenza (prima esce la vecchia, *poi* entra
  la nuova) riapre il lampo bianco. La dissolvenza non è decorazione: nasconde il fatto che due
  istantanee di proporzioni diverse non possono allinearsi mentre il gruppo interpola, e senza di
  lei il ridimensionamento si legge come uno strappo.
- *Testo e arredo* **non** devono fare dissolvenza incrociata: il vecchio si scarta al primo
  fotogramma, il nuovo è opaco dal primo fotogramma. Incrociare il testo stampa due titoli *diversi*
  uno sopra l'altro. Il titolo di una fascia salta anche la trasformazione geometrica: deve atterrare
  al suo posto, non arrivare in volo da dove stava nella pagina precedente.
- Conseguenza: **una fascia nuova si divide in due gruppi**, uno per la superficie e uno per il
  contenitore del testo. Tenerli in un gruppo solo è ciò che produce il doppio titolo sbavato.

Regole che evitano che si rompa:

- **Un `view-transition-name` duplicato in una pagina invalida l'intera transizione.** I nomi per
  slug sono sicuri solo finché ogni slug compare una volta: un elenco di «contenuti correlati» deve
  escludere quello corrente.
- **Dichiara l'impilamento, non ereditarlo.** L'ordine di disegno ricade sul DOM catturato, che non
  è confrontabile fra due pagine diverse: una fascia a tutta larghezza finisce sopra proprio ciò che
  ci sta volando dentro. Si ordina dal basso: radice, superfici delle fasce, tutto ciò che viaggia da
  una pagina all'altra, testo delle fasce, arredo.
- **Proteggi gli elementi nominati che sono fuori schermo.** Lasciando una pagina già scorsa, un
  elemento nominato viene catturato fuori vista e il suo gruppo lo fa scivolare dentro sulla pagina
  nuova. Il nome si toglie su `astro:before-preparation` per gli elementi fuori dal viewport.
- **Solo nomi statici, mai elenchi per slug nel CSS.** Un nome per slug non può portare un
  comportamento nel foglio di stile. Per un titolo che vola, si assegna un solo nome statico al
  momento del click, e solo alla sorgente cliccata.
- **`transition:persist` non è l'alternativa per l'arredo.** Un header che cambia classi da una
  pagina all'altra terrebbe il disegno della pagina precedente. Nemmeno
  `transition:animate="none"` di Astro aiuta: emette dentro `@layer astro`, che perde contro i
  selettori jolly non stratificati.

## Primitive di interfaccia (`src/components/ui/`)

File `.astro` nativi che usano le varianti di `cva` più `cn()` (`src/lib/utils.ts`, clsx e
tailwind-merge): la forma dell'API di shadcn senza il runtime React o Radix.

- Le varianti si esportano dal frontmatter del componente
  (`import Button, { buttonVariants } from '@/components/ui/button.astro'`) per il caso raro in cui
  servano solo le classi.
- Il polimorfismo sostituisce l'`asChild` di Radix: `<Button as="a" href=...>`. L'unione di `as` è
  esplicita (`'button' | 'a'`) invece dell'helper generico `Polymorphic` di Astro, perché
  `astro check` (0.9.x) non risolve le Props generiche nei punti di chiamata: non tornare indietro
  senza aver verificato che sia stato corretto.
- Le famiglie composte vivono in una cartella con un barrel (`ui/card/{card,header,…}.astro` più
  `index.ts`), così il consumo è una riga in forma shadcn:
  `import { Card, CardHeader } from '@/components/ui/card'`. La tipizzazione delle Props sopravvive
  alla riesportazione dal `.ts` (verificato con `astro check`). Le primitive semplici restano file
  piatti.
- Primitive composte (mattoncini senza opinioni, dove la struttura è di chi chiama) contro slot
  nominati (layout fisso, dove la struttura è del componente): le primitive usano le prime, e gli
  slot nominati sono il posto delle sezioni di pagina con un'opinione.
- Ogni primitiva accetta una sovrascrittura `class`, fusa per ultima da `cn()`: chi chiama può
  ristilare senza forkare la primitiva.
- Le primitive nuove seguono la stessa ricetta; le stringhe delle varianti restano su token
  semantici (mai valori grezzi di palette) e su `focus-visible:outline-hidden` (vedi i modi di dire
  qui sopra).
- Il layout vive solo in `Container` e `Section`, mai scritto a mano: le sezioni di pagina compongono
  `<Section><Container>…</Container></Section>`, e i template dei generatori devono emettere quella
  forma. Entrambe le primitive documentano nelle proprie intestazioni la ragione di larghezze e
  ritmo, e la via d'uscita del raro blocco più stretto con un `max-w-*` annidato.
- I titoli di pagina e di sezione sono `<Heading as size>`, mai un `<h1>`…`<h6>` con classi
  tipografiche scritte a mano, e i template dei generatori emettono quella forma: `as` dà il livello
  nel documento, `size` la taglia nella scala. Il colore non sta nelle varianti e si eredita, e una
  taglia che manca diventa una variante di `headingVariants`. Famiglia, peso, maiuscolo e spaziatura
  vengono dai token di § Token di design, i corpi dalle varianti. I documenti iubenda arrivano da
  `set:html` e non possono usare il componente: `src/components/legal/legal-doc.astro` dà ai loro
  `h1` e `h2` le classi delle taglie `h1` e `h3`, e `src/components/legal/legal-doc.test.ts`
  fallisce se le due divergono.
- `SectionLabel` è l'eyebrow sopra un titolo. Tipografia, colore e fondo vengono dai token di
  § Token di design, e il segno davanti all'etichetta si cambia con lo slot `marker`.
- Le dimensioni dei bottoni sono una sola scala a taglie, `sm/md/lg/xl` più i gemelli quadrati
  `icon-*` (`md` è il default, e non esiste una chiave `default` per la dimensione; i nomi delle
  varianti invece il `default` di shadcn lo mantengono). Altezza e corpo di ogni taglia vengono dai
  token (§ Token di design), e un gemello `icon-*` ha per lato l'altezza della sua taglia. Oltre
  l'insieme shadcn: `variant="soft"` è un controllo riempito a bassa enfasi (solo token semantici,
  NESSUN colore di testo incorporato — un'icona o un glifo social eredita `currentColor`), e un asse
  `shape` (`default`/`pill`) cambia solo il raggio della scatola (`pill` è `rounded-full`).
- Ogni variante di `Button` porta `border border-transparent`, tranne `outline`, che ha il suo
  bordo, e `link`. Con i contrasti forzati il browser toglie il fondo dell'autore e ridipinge il
  bordo con il colore del testo, così un bottone pieno, o un `ghost` dell'header, resta una scatola
  invece di diventare testo. Il bordo sta dentro l'altezza della taglia e allarga di 2 px solo i
  bottoni di testo; lo presidia `src/styles/controls.test.ts`.
- I campi di form compongono la famiglia `Field` (`ui/field/`: `Field`, `FieldLabel`, `FieldContent`
  e `FieldError`, con orientamento verticale o orizzontale) attorno ai controlli piatti
  (`input.astro`, `textarea.astro`, `select.astro`). `FieldError` è l'unica parte con un
  comportamento attaccato: il suo contratto e il test che lo presidia stanno in `forms-email.md` §
  La superficie di validazione. `FieldLabel` è flex: un'etichetta che è una frase con un link, come
  quella del consenso, gli passa `block`, e lo spazio prima del link si scrive `{' '}`, perché
  `compressHTML` toglie quello fra un'espressione e un tag anche sulla stessa riga.
- `Alert` non porta nessun `role` di suo. `role="alert"` è una live region assertiva: interrompe
  quello che lo screen reader sta dicendo, e su un avviso presente al caricamento alcuni lo
  annunciano prima del titolo della pagina. Si passa `role="alert"` per un errore che compare in
  risposta a un'azione, `role="status"` per un esito che non deve interrompere, e nessuno dei due
  per il contenuto statico. Il ruolo va su un elemento che è già nella pagina quando il messaggio
  cambia, come i paragrafi di esito del form (`forms-email.md` § Convenzioni dell'interfaccia dei
  form).
- `Alert` ha cinque varianti. `default` e `muted` sono avvisi neutri; `destructive`, `success` e
  `warning` sono messaggi di stato con un disegno solo: fondo `muted`, testo nel colore normale,
  bordo e icona nel colore dello stato. Anche `AlertDescription`, che altrove è `muted-foreground`,
  lì passa al colore normale, perché su `muted` quel grigio non regge 4,5:1 nel tema chiaro. Un'icona
  messa come primo figlio prende una colonna sua, accanto a titolo e descrizione. La forma viene da
  tre token di `tokens.css`, letti dalla utility `alert-shape`: `--alert-border-width` per i lati,
  `--alert-border-start-width` per il lato iniziale e `--alert-radius`. I default rifanno il bordo
  pieno e il raggio di sempre, e `muted` tiene il suo raggio di 2px più piccolo. Un messaggio con la
  sola barra sul lato iniziale si ottiene con tre righe:

  ```css
  :root {
    --alert-border-width: 0;
    --alert-border-start-width: 3px;
    --alert-radius: 0;
  }
  ```

  `src/styles/contrast.test.ts` verifica testo, bordo e icona delle varianti di stato sul loro fondo.
- `Breadcrumb` (`ui/breadcrumb/`) rende un percorso di voci `{ name, url }`, le stesse che
  `buildBreadcrumbList()` trasforma in JSON-LD: la pagina costruisce l'elenco una volta e lo passa a
  entrambi. È una `<nav>` con l'etichetta del dizionario e un `<ol>`; ogni voce è un link, l'ultima
  porta `aria-current="page"`, e i separatori sono icone `aria-hidden`. Con `prefetch={false}` ogni
  link porta `data-astro-prefetch="false"`, che Astro legge solo sul link e non su un antenato: serve
  a una parte del sito che tiene fuori dal prefetch le sue pagine rese a richiesta.
- `Select` è la primitiva di riferimento per il miglioramento progressivo: il `<select>` nativo si
  rende per primo e resta la fonte di verità verso il form; lo strato di script
  (`select-behavior.ts`) inserisce un trigger e una listbox stilati (focus rotante,
  `aria-expanded` e `aria-selected`, Escape, Tab e click fuori) e ridispaccia `change`
  sull'elemento nativo. Il valore iniziale si passa con la prop `value`, che segna l'opzione nel
  `<select>` nativo e nell'etichetta del trigger; un valore che nessuna opzione porta lascia il
  placeholder. Le primitive con stato nuove seguono questa forma: prima la linea di base senza
  JavaScript, poi il comportamento in un `*-behavior.ts` fratello agganciato con
  `createMotionBinding` (vedi `rendering-performance.md`).
- `setupSelects` attiva le radici `[data-select-root]` presenti al caricamento e a ogni
  `astro:page-load`. Una radice aggiunta dopo, come una riga nuova di una griglia, resta il
  `<select>` nativo finché non la si passa a `setupSelect(root)` di `select-behavior.ts`. Una radice
  già attiva viene saltata, e la pulizia su `astro:before-swap` copre anche quelle attivate così.
- Il trigger di `Select` è un `<button>` con `role="combobox"`, lo schema «select-only combobox»
  delle APG. Prende il nome dalla `<label for>` oppure da `aria-label` o `aria-labelledby`, che
  all'attivazione passano dal `<select>` nativo al trigger insieme a `id` e `aria-describedby`.
  Espone come valore il testo che mostra, e `aria-required` del nativo.
- In un form senza `novalidate`, un `Select` obbligatorio rimasto vuoto non può avere il fumetto del
  browser, perché il nativo è nascosto. All'invio il trigger prende `aria-invalid`, con il bordo
  `--destructive`, e prende il focus se è il primo campo non valido (`select-validity.ts`). Un
  messaggio scritto resta compito degli slot d'errore di un form `novalidate`, che segnano il
  trigger e gli portano il focus allo stesso modo (`forms-email.md` § La superficie di validazione).
- Le icone vengono da `@lucide/astro` (SVG in fase di build, zero JS lato client): `stroke-width={1}`
  di default, dimensione con Tailwind (`size-4`, `size-5`), `aria-hidden` per default e l'etichetta
  accessibile sul controllo.

Se un progetto ha davvero bisogno di un componente con stato (Dialog, Calendar, …), le trappole
delle isole stanno in `ARCHITECTURE.md`.

## Pattern di layout delle sezioni di pagina

### Fasce a tutta pagina — uscire da `Container`

Alcune fasce devono coprire (quasi) tutto il viewport invece della larghezza di `Container`
agganciata ai breakpoint (un banner di chiamata all'azione a tutta larghezza, un footer). Si
avvolgono in `<Section spacing="none">` (o in un landmark nudo come `<footer>`) **senza**
`Container`, che altrimenti le limiterebbe alla larghezza agganciata vanificando l'intento. È
l'inverso della nota sul «raro blocco più stretto» fra le primitive: lì si annida un contenitore
`max-w-*` per stringere, qui si toglie Container per allargare. La fascia possiede la larghezza del
proprio contenuto dall'interno (padding interno o un `container mx-auto` annidato); una card
`rounded-* overflow-hidden` ritaglia il suo gradiente o la sua immagine di sfondo sul raggio.

### L'header sopra l'hero — `heroOverlay` e `overlayChrome`

Due props di `src/layouts/main.astro` mettono l'header sopra un hero a tutta altezza, su un'immagine
o un video:

- `heroOverlay` rende l'header `absolute` invece di `sticky`, senza bordo, fondo né sfocatura, e la
  prima sezione comincia dal bordo alto della pagina, sotto di lui;
- `overlayChrome="light"`, che ha effetto solo insieme a `heroOverlay`, rende bianchi marchio, link
  e controlli per un fondo scuro; con `auto`, il default, restano i colori del tema.

Si accendono dalla pagina, `<MainLayout heroOverlay overlayChrome="light">`, e portano tre fatti:

- `scroll-pt-20`, che `main.astro` passa all'`<html>` di `document.astro`, è tarato sull'header
  appiccicato: con `heroOverlay` l'header non segue lo scorrimento, ma gli ancoraggi atterrano
  comunque 80px sotto il bordo;
- `transition:name="site-header"` in `header.astro` lega l'header delle pagine con e senza overlay:
  la view transition li tratta come lo stesso elemento e anima il passaggio dall'uno all'altro;
- `src/pages/index.astro` non lo accende, benché l'hero di `src/components/homepage/hero.astro` sia
  `min-h-svh`.

### Gusci condivisi con un'opinione, contro le primitive di `ui/`

Quando lo stesso layout con uno sfondo decorativo si ripete su più pagine, si estrae un guscio di
primo livello (`src/components/*.astro`) invece di ricopiare il markup. Un guscio è
un'impalcatura con un'opinione (struttura fissa più uno slot), **non** una primitiva di `ui/`: il
guscio possiede quello che è identico (sfondo decorativo, struttura fissa), e chi lo consuma tiene
nello slot o in un proprio contenitore esterno quello che è specifico della pagina (contenuti, nomi
di transizione, agganci di layout). È la metà «slot nominati» della divisione fra primitive qui
sopra: si ricorre a un guscio proprio quando la struttura è fissa e condivisa, e a una primitiva
composta di `ui/` quando la struttura deve essere di chi chiama.

### Icone di marchi e social — non stanno in `@lucide/astro`

`@lucide/astro` non porta nessun glifo di marchio o social (LinkedIn, X, …). Si mette inline il path
grezzo `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">` parola per parola — mai
sostituendolo con un'icona generica di ripiego — e l'etichetta accessibile va sul link che lo
contiene (`aria-label`), non sul glifo `aria-hidden`. Ogni rete vuole il suo path: non condividere un
segnaposto fra reti diverse. Si ospita in uno slot `<Button as="a" variant="soft" size="icon-*">`
invece che in un `<a>` costruito a mano.

### Gusci di presentazione — contenuti o backend ancora da fare

Una sezione può arrivare col suo layout definitivo prima che esistano il backend o i testi veri. Il
segnaposto va reso inequivocabilmente inerte invece di fingere un controllo che funziona:

- un form non collegato usa `type="button"` (mai `type="submit"`), così non può inviare niente;
- un'immagine puramente decorativa (per esempio un logotipo che ripete il testo accanto) prende
  `alt=""`, così le tecnologie assistive la saltano;
- lascia un commento che punti alla milestone o alla decisione che collegherà il guscio, così non lo
  si scambia per lavoro finito.

### Ancorare il contenuto in colonne di altezza diversa

In una fascia a più colonne le cui colonne portano quantità diverse di contenuto, ogni colonna
diventa un `flex flex-col` e il suo blocco finale (per esempio una riga legale o di copyright) si
spinge in basso con `lg:mt-auto` (più un `lg:pt-*` per uno spazio minimo). I blocchi finali si
allineano così fra le colonne a prescindere dall'altezza del corpo sopra di loro. Il gate a `lg:`
serve perché su mobile, con le colonne impilate, il flusso naturale resti quello.

### Espansione accessibile (card che si aprono)

Senza framework. Si usa `aria-expanded`, perché questa è un'espansione, NON `aria-pressed`, che è lo
stato di un bottone a due posizioni. Quando più d'una può essere aperta insieme, ogni interruttore è
una tappa di tabulazione a sé: niente tabindex rotante.

- **Non avvolgere una card semantica in un `<button>`.** Un bottone appiattisce il proprio
  sottoalbero (i discendenti diventano di presentazione), quindi un `<h3>` interno, il suo ruolo e
  il suo testo perdono semantica — il titolo sparisce dal rotore, e con un `aria-label` sul bottone
  il testo dei discendenti non viene annunciato affatto. La card sembra giusta ed è muta per le
  tecnologie assistive.
- **Correzione: bottone trasparente steso sopra.** La card resta un contenitore semantico
  (`<article>` più un vero `<h3>` più il corpo) e sopra si mette un
  `<button class="absolute inset-0 …">` trasparente per l'area cliccabile intera. Il contenuto resta
  esposto alle tecnologie assistive; il bottone porta `aria-expanded`, `aria-controls` (che punta
  alla regione espandibile con il suo `id`) e un'etichetta `sr-only`. Poiché il bottone È la scatola
  della card, il suo anello di focus disegna il contorno della card: la stessa esperienza «tutta la
  card è cliccabile» senza l'appiattimento.
- **I visivi si guidano da un attributo dato.** Un `data-active` (o simile) sul contenitore guida i
  visivi aperto/chiuso attraverso le varianti `group-data-*`; un click lo gira insieme
  all'`aria-expanded` dell'interruttore, in coppia.
- **Contrasto sugli stati aperti riempiti.** Il testo che atterra su una superficie riempita e satura
  deve usare il token di primo piano a piena opacità: un primo piano ad alfa ridotta (`/80`) sopra un
  riempimento saturo scende sotto il pavimento AA di 4,5:1.
- **`min-h-0` quando si ritaglia un figlio flex.** Un elemento flex ha `min-height:auto` di default e
  si rifiuta di rimpicciolirsi sotto il proprio contenuto; `min-h-0` è obbligatorio su qualunque
  figlio flex che debba ritagliare con `overflow-hidden` (per esempio una finestra di dettaglio ad
  altezza fissa).
- **Linea di base senza JavaScript.** Lo stato prima dello script dev'essere sostanziale: si
  consegnano le sezioni aperte, oppure si fa in modo che lo stato chiuso sia già un riassunto
  completo e non un'anteprima troncata, così niente di essenziale dipende dall'interruttore. Il
  comportamento si aggancia con lo stesso ciclo di vita delle primitive con stato — un
  `*-behavior.ts` fratello più `createMotionBinding`, agganciato una volta e smontato allo scambio
  della view transition. Questa è interazione essenziale: NON metterla dietro il reduced motion.

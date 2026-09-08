Template Astro riutilizzabile (uso personale e freelance). Le regole sotto `[HARD]` non si negoziano: non si aggirano per comodità, nemmeno quando sembrano bloccare un compito.

## Da dove si comincia

Questo file sta sempre in contesto, quindi resta corto: porta i vincoli e l'instradamento, non le
spiegazioni. Prima di aprire qualunque cosa passa da **`docs/TASK-CONTEXT.md`**, che per ogni
compito dice cosa leggere in che ordine — e soprattutto **cosa saltare**.

## Stack e convenzioni

- **Gestore di pacchetti**: solo pnpm via corepack — la versione è fissata in `packageManager` (`package.json`). Niente npm o yarn, niente installazioni globali. A fermare `yarn` è lo shim di corepack; **niente ferma `npm install`** — corepack non fa shim di npm, e npm ignora `package-manager-strict` in `.npmrc` («Unknown project config»). Il divieto di npm è una convenzione da rispettare, non un guardrail che scatta.
- **Node**: versione fissata in `.nvmrc` — si rispetta, non si assume un'altra.
- **Formatter e linter**: solo Biome (`biome.json`), niente ESLint o Prettier. Stile: 2 spazi, apici singoli, niente punto e virgola, virgola finale.
- **TypeScript**: `astro/tsconfigs/strictest`. Se `noUncheckedIndexedAccess` o `exactOptionalPropertyTypes` segnalano un errore, si corregge il codice — non si allenta la configurazione per farlo sparire.
- **Rendering**: `output: "static"`, quindi le pagine sono prerenderizzate. Una pagina che ha bisogno di dati per richiesta si sfila con `export const prerender = false` esplicito nel frontmatter. Il server viene dall'adapter, non da questa impostazione: azioni e rotte on-demand funzionano in entrambi i casi.
- **Deploy**: Vercel, tramite `@astrojs/vercel`.
- **Leggere l'albero**: `docs/ARCHITECTURE.md` § Struttura del repository, che etichetta ogni percorso come `machinery` / `config` / `chrome` / `seed` / `example`. La machinery si tocca per correggere un difetto, non per riordinare; il pattern `example` si estende invece di inventarne un secondo; un percorso `seed` non si cancella, perché i generatori ci scrivono dentro.

## Commenti [HARD]

**Il default è non scriverne.** Nomi buoni, funzioni corte e tipi espliciti reggono da soli quasi tutto il codice, e ogni commento è una cosa in più che invecchia. Si commenta nei **casi particolari**, che sono questi e nessun altro:

- una **stranezza di un fornitore** che il codice non può rivelare (un 204 che significa successo, un campo che l'API accetta e ignora);
- un **invariante che il linguaggio non esprime**: un ordine di chiamata obbligatorio, un valore che è un contratto con qualcosa di esterno, un accoppiamento fra due file che i tipi non tengono;
- **da dove viene una costante**, quando non è arbitraria — misurata, imposta da una specifica, derivata da un'altra misura. Non cosa rappresenta: quello è il nome;
- un **aggiramento di un bug esterno**, con il link alla issue a monte;
- una **trappola silenziosa**, dove sbagliare non solleva nessun errore e cambia solo il comportamento (sicurezza, GDPR, SEO).

**L'elenco è chiuso** e non si estende per analogia. «Spiegare la scelta di progetto» e «aiutare chi legge dopo» non sono voci: una ragione che il codice già mostra non è un fatto da scrivere.

**Il test, su ogni commento**: porta un fatto che potresti andare a verificare **fuori da questo file** — la documentazione di un fornitore, un numero misurato, il comportamento di un browser, una riga precisa di un altro modulo? Se sì resta, se no va via per quanto sia scritto bene.

**Un'API che si comporta come è documentata non è una stranezza.** `querySelectorAll` che prende i discendenti, `cloneNode(true)` che copia i figli: è semantica documentata, chi legge la conosce o la cerca in un minuto. Una stranezza è la piattaforma che fa l'**opposto** di quello che la documentazione o il buon senso promettono: Safari che rifiuta `play()` su un video non muto, Firefox che non espone `wheelDeltaY`, un `focus()` che fa scorrere il contenitore.

Altre tre trappole ricorrenti. Se stai spiegando cos'è un identificatore, **manca il nome**: si rinomina, non si commenta. Se un test già regge il vincolo, il commento è **prosa che ripete un test**: uno dei due fallisce quando il codice si muove, l'altro no. E le **previsioni sul nostro codice** non sono fatti: «senza questo il layout si rompe» è un'inferenza che invecchia, e il segnale è il condizionale.

**Un commento non sostituisce il codice condiviso.** Se dice «tieni questo uguale a quello», quel vincolo va nel codice: un componente condiviso, una costante importata, un token, al limite un test che fallisce quando i due divergono. In prosa non lega nessuno, non lo esegue niente, e il giorno in cui le copie divergono resta lì ad affermare una cosa falsa. Un accoppiamento si dichiara solo quando è **inevitabile**, e si nomina con precisione: file e simbolo, non «come nell'altra pagina».

**Tutto ciò che è provvisorio è un `TODO`**, non una didascalia: dice **cosa fare e dove**, altrimenti è rumore con un'etichetta. Vale anche per una duplicazione che non puoi centralizzare subito.

**Forma**: al presente, sul codice com'è adesso. Mai narrare la modifica («prima era», «ora invece», «non più», «rimosso in #NN», «sostituisce»), ripetere quello che il codice fa, riscrivere il messaggio di commit, mettere banner e separatori, o JSDoc su firme già leggibili. **Una riga, due al massimo** — che è un tetto, non un obiettivo: di più non è un commento ma documentazione, e va in `docs/` con il codice che ci punta.

**Si tengono sempre**, perché toglierli cambia il comportamento: `biome-ignore`, `@ts-*`, `/// <reference …>`, `@vitest-environment`, `@public` (fallow), `TODO`/`FIXME`, i marcatori `[HARD]`, gli shebang.

Vale ovunque, **test, configurazioni e workflow compresi**: è lì che la deriva passa inosservata. La storia sta in `git log` e in `docs/DECISIONS.md`, ed è lì che si va a cercarla: `git log -S`, `git blame`.

**Prima di consegnare, ripassa il tuo diff** e togli i commenti che non passano il test, compresi quelli che ha scritto per te un agente verticale. `pnpm run check:comments` passa **tutto l'albero**, tracciato e non, perché il debito di ieri conta quanto quello di oggi; `--diff [base]` lo restringe al branch corrente, che è l'ambito di una PR. Legge **la forma, non l'utilità**: un commento corto, inutile e al presente lo passa verde. Una passata verde non è il permesso di tenerlo.

## Come si lavora [HARD]

- Commit: Conventional Commits, verificati da commitlint sull'hook `commit-msg` di lefthook (`tipo(ambito): oggetto`). Un commit fuori formato viene rifiutato dall'hook: non si aggira con `--no-verify`.
- **Quello che deve arrivare in produzione ha bisogno di un tipo rilasciabile** — release-please alza la versione solo sui tipi che `changelog-sections` lascia visibili in `release-please-config.json` (`feat` la minor; `fix`, `perf`, `revert`, `refactor` la patch), e la produzione esce da un tag di release. Una modifica atterrata con un tipo nascosto — `docs`, `chore`, `ci`, `test`, `build`, `style` — resta su `main` non pubblicata: gli aggiornamenti npm di dependabot sono `chore(deps)` (`.github/dependabot.yml`) proprio per questo, così una dipendenza aggiornata viaggia col primo commit rilasciabile invece di tagliare una release per sé. Le modifiche ai contenuti sono quindi `fix(content): …`. Su una PR conta il **titolo**, non i commit: con lo squash-merge il titolo diventa il messaggio.
- Una issue GitHub = una PR = un commit squash su `main`: branch `<tipo>/<N>-<slug>`, titolo Conventional, `Closes #N` nel corpo — e il corpo sempre via `--body-file` da `.claude/plans/pr-<N>-<slug>.body.md` (non tracciato), sulla struttura di `.github/PULL_REQUEST_TEMPLATE.md`. Mai force-push, e mai committare, pushare o aprire una PR senza il via esplicito dell'utente.
- Prima di considerare finito un compito gira `pnpm run ci` (Biome, type-check, confini, lingua, rimandi, roadmap, commenti, test, complessità; non modifica file) e deve passare pulito, poi leggi `pnpm run review`, che non blocca ed esce sempre 0. **`pnpm run ci`, mai `pnpm ci`**: il secondo collide con il builtin di compatibilità npm di pnpm ed esegue un'installazione frozen, quindi esce 0 senza aver eseguito nessun gate.
- **Il diff va mostrato e approvato prima di ogni commit**, uno alla volta, con tre righe in testa: cosa contiene, dove hai un dubbio, cosa non serve guardare. Si committa in modo capillare, una cosa per commit. I messaggi sono in italiano, conventional, **senza footer di Claude**.
- L'hook `pre-commit` riformatta i file in stage con Biome: è normale che vengano riscritti al momento del commit, non è un errore.
- `docs/PROJECT.md` è il brief del cliente con le sue parole: non si modifica di iniziativa, si aggiorna solo con nuovo input esplicito del cliente.

## Pianificazione e agenti verticali

- Il lavoro si pianifica in `docs/ROADMAP.md` (registro delle milestone e dei loro sotto-task, con il riferimento alle issue GitHub e le giornate per milestone) e in `docs/DECISIONS.md` (decisioni aperte, informative: non bloccano il seeding di una milestone).
- **Prima del piano viene la stima.** `docs/ESTIMATE.md` e `docs/MEETING-*.md` sono **non tracciati per scelta** (`.gitignore`) e **derivati da `docs/ROADMAP.md`**, mai scritti prima: se i due non concordano su un numero, ha ragione la roadmap. I blueprint stanno in `docs/proposal-templates/`. Il materiale del cliente resta tracciato sotto `docs/sources/`.
- **[HARD] Nessuna issue esiste prima che il lavoro sia approvato.** `/milestone` mostra in anteprima ogni issue in modalità piano: su un piano che il cliente non ha firmato, quell'anteprima *è* il deliverable. Dopo l'approvazione si seeda una milestone alla volta, perché una milestone seedata è un piano congelato e quelle lontane si muovono ancora.
- **La milestone come insieme**: `/milestone <nome-template>|<N>|backlog` ha due modalità, e le decide lo stato della milestone invece di un flag. **In semina** trasforma un template di `docs/milestone-templates/*.md` (o una sezione scritta a mano in `docs/ROADMAP.md`) in una Milestone GitHub nativa più una issue per sotto-task; **in rilettura**, su una milestone già seminata, ricalcola l'ordine su ciò che nel frattempo è atterrato. In tutti e due i casi passa da `/drift` **prima**, e da lì torna con l'insieme già corretto. La modalità piano mostra tutto prima, e una sola approvazione copre il lotto. Non scrive mai codice applicativo, non crea branch, non committa.
- **Le decisioni a monte**: `/decisions` sta prima della roadmap e mette sotto torchio un piano finché non resta niente di assunto in silenzio — mappa i bivi come un albero e chiede in blocco quelli allo stesso livello. Non implementa niente e non committa.
- **La verifica contro il codice è un comando suo**: `/drift <issue>|<milestone>|<sezione>` confronta quello che è scritto con quello che è, e scrive le conclusioni dove chi implementa le leggerà — nella roadmap se la issue non esiste ancora, in un blocco `## Aggiornamento` in coda al corpo se esiste. Ci passano `/milestone` e `/pr`, e si invoca da solo quando una milestone è ferma da settimane. Sta fuori dai due perché serviva a entrambi, e scritta due volte sarebbe già andata alla deriva.
- **L'ordine deciso alla semina è un'ipotesi**: rilanciare `/milestone <N>` dopo che qualche PR è atterrata costa un minuto ed è previsto.
- **Implementazione**: `/pr <numero-issue>` implementa una singola issue dall'inizio alla fine (branch → agenti verticali → gate di qualità → corpo della PR con `Closes #N`) — una issue = una PR = un commit squash. Legge il blocco `## Aggiornamento` della issue, quando c'è, e le dipendenze dichiarate in `docs/ROADMAP.md`. Non committa, non pusha e non apre PR di sua iniziativa.
- **Un agente verticale per dominio** (`.claude/agents/`). Quali sono, su quali percorsi lavorano e quale guida leggono sta in **`docs/ARCHITECTURE.md` § I domini**, che è l'unico posto in cui quella tabella vive: `/milestone` e `/pr` la leggono da lì. Fuori dalla tabella c'è `comments-agent`, che è trasversale e non un dominio: `/pr` lo passa sul diff prima del gate, e su richiesta controlla l'intero albero. Il ruolo — implementare o rivedere — si decide nel prompt di invocazione, non con file di agente separati.
- **Il giro di pulizia**: `/sweep` guarda la terza categoria, quella che i gate non hanno né passato né bocciato — le esclusioni dichiarate, i `TODO` invecchiati, i file locali finiti in un commit, gli avvisi datati nei documenti. Non blocca e non committa: propone, e l'esito più frequente è «niente da fare».
- I blueprint riutilizzabili delle milestone stanno in `docs/milestone-templates/*.md`, con lo stesso stato di «stabile, riutilizzabile fra progetti» di `docs/guides/*.md`.

## Lingua [HARD]

**Codice e identificatori in inglese, commenti e documentazione in italiano.** Vale per i messaggi di commit, i nomi dei test e i documenti in `docs/`. `pnpm run check:language` lo verifica sui file con prosa e fa parte del gate.

L'italiano si scrive per intero: accenti e apostrofi al loro posto, mai sostituiti da equivalenti ASCII. Attenzione agli apostrofi dentro le stringhe delimitate da apici singoli — è l'inciampo più frequente, e la risposta sono i doppi apici.

Tre categorie restano fuori dal gate, e ognuna per una ragione sua: le fonti del cliente sotto `docs/sources/`, che sono materiale altrui; il `CHANGELOG.md`, che lo genera release-please in inglese; e i dizionari di `src/i18n/strings/`, che sono copy per l'utente nelle lingue del sito — è il solo posto sotto il codice dove non deve leggersi italiano.

Il gate giudica per frequenza di parole funzione, quindi un file troppo corto per portare il segnale — un indice, un sorgente senza commenti — resta indeciso invece che indovinato.

## Orchestrazione multi-agente [HARD]

Regole di contenimento per l'orchestrazione multi-agente (strumento Workflow, fan-out di agenti). Valgono sopra ogni modalità di sessione, ultracode compresa: una modalità non autorizza mai una spesa oltre queste soglie.

- **Proporzionalità, misurata prima.** Prima di qualunque orchestrazione si misura la superficie (`git diff --stat` per una review, una stima equivalente altrimenti):
  - **Piccola** (< ~150 righe cambiate): niente workflow e niente review multi-agente — il gate sono `pnpm run ci` e `pnpm run build`.
  - **Media** (~150–400 righe): al massimo **un** agente revisore, senza fan-out.
  - **Grande** (> ~400 righe), o un diff medio che tocca un'area a rischio (`src/actions/**`, `src/emails/**`, `src/middleware.ts`, `vercel.json`, configurazione di ambiente o deploy): è ammesso un workflow compatto entro i limiti qui sotto.
- **Limiti invalicabili**: massimo 6 agenti per workflow, un verificatore per ritrovamento, niente collegi che votano. Superare un limite si chiede prima, con una stima di costo.
- **Annuncia, poi rendiconta**: dichiara quanti agenti e cosa fa ciascuno prima di lanciarli; a valle riporta il numero reale e i token spesi.
- `/pr` non aggiunge mai un workflow di review da sé: lo sbloccano solo le soglie qui sopra, o l'utente che lo chiede in quella sessione.

## Stato del lavoro

`.claude/plans/stato.md` (non tracciato) tiene le decisioni prese con l'utente e cosa resta da fare.
**Va riletto dopo ogni compattazione o `/clear`**, prima di riprendere: questo file è sempre in
contesto, quello no. Si aggiorna quando una decisione cambia, non a ogni passo — è la rete di
sicurezza, non un diario.

## Istruzioni di compattazione

Una compattazione riscrive la conversazione: quello che non finisce nel riassunto è perso, e non
tutto costa uguale ricostruirlo.

**Tieni**, in quest'ordine di importanza:

- **le decisioni prese con l'utente, con il loro perché** — soprattutto quelle che derogano a una
  specifica, a un default o a una raccomandazione. Non stanno nel codice e nessuna rilettura le
  recupera. Per esempio: quale versione di una dipendenza e perché non l'ultima, quale regola è
  stata alzata o abbassata, cosa si è deciso di non fare;
- **le correzioni ricevute, con la ragione** — sono la parte di contesto che il codice non dice e
  che, persa, fa rifare lo stesso errore;
- **i vincoli scoperti indagando** su macchina, dipendenze o strumenti: sono costati una verifica, e
  ripartire senza li fa ripetere;
- **lo stato del lavoro**: cosa è committato, cosa è in corso, cosa resta;
- **i numeri misurati** su cui poggia una scelta, non l'output da cui vengono.

**Butta**:

- l'output dei comandi andati a buon fine, e i gate già verdi;
- le esplorazioni concluse e i tentativi scartati, tenendo solo l'esito;
- il contenuto dei file: si rileggono quando servono;
- la cronaca di come si è arrivati a una decisione, una volta che la decisione è registrata.

La storia lunga sta in `git log`, che i messaggi di commit tengono leggibile apposta: quando un
fatto è già scritto lì, nel riassunto basta il riferimento.

## Sviluppo

Server di sviluppo: `astro dev --background`, gestito con `astro dev stop` / `astro dev status` / `astro dev logs`.

## Documentazione

Documentazione Astro: https://docs.astro.build — si consulta prima di toccare routing e middleware, componenti, isole di framework, content collection, stili Tailwind o i18n.

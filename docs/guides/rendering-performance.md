# Rendering e prestazioni

## Politica di rendering

- **`client:idle`, non `client:visible`, per tutto ciò che monta dentro un portale.** Un dialog
  chiuso rende un portale vuoto — un nodo di dimensione zero — e l'IntersectionObserver di
  `client:visible` può non scattare mai su di lui.
- Le view transition sono attive: `<ClientRouter />` nell'`<head>` del layout, che è la posizione
  documentata perché emette dei meta tag. Conseguenze per gli script: quelli inline non rigirano
  alla navigazione (si ascolta `astro:after-swap`, come fa lo script del tema), e quelli a modulo
  girano una volta per modulo, non per pagina.
- **[HARD] Tutto ciò che emette un custom element va nel `<body>`, mai nell'`<head>`** — il caso
  tipico sono Vercel Analytics e Speed Insights (`<vercel-analytics>`,
  `<vercel-speed-insights>`). Un custom element nell'head non è valido, quindi il parser chiude
  l'head in quel punto: il `<link>` del foglio di stile finisce nel body e viene ricreato da zero a
  ogni view transition, che è un lampo di contenuto senza stile a ogni navigazione.

### Il costo di `<ClientRouter />`

Misure sul build del template con Astro 7.2.7, in byte gzip come li conta
`scripts/bundle-budget.mjs`:

- **Il chunk del router pesa 4.762 byte**, 13.922 non compressi: circa due terzi della chiusura
  statica di `/`, 7.104 byte, che `pnpm run perf:bundle` stampa come 6,9 KB. Il resto sono
  `prefetch` (1.153), `mobile-nav` (941), `binding` (137), `page` (67) e `client` (44).
- **Il prefetch si conta a parte.** Il router lo importa, ma lo importa anche l'ingresso `page` che
  Astro aggiunge a ogni pagina quando `astro.config.mjs` accende `prefetch`: togliere il router
  toglie il suo chunk, e il prefetch resta finché resta quella configurazione.
- **Ogni pagina porta anche due `<style>` inline**, per `transition:name` su `site-header`
  (`src/components/layout/header.astro`) e su `site-footer` (`src/components/layout/footer.astro`):
  2.347 byte non compressi ciascuno, 317 e 318 gzip. Vengono da quegli attributi, non dal router:
  restano finché restano gli attributi, e stanno nell'HTML, dove nessuno dei due budget guarda.

Quattro regole del template esistono per il router, e senza di lui smettono di servire. Nessuna
porta `[HARD]`:

- **il focus dopo lo scambio** — `src/lib/a11y/route-focus.ts`, `ui-components.md` § Pattern di
  accessibilità nell'arredo;
- **l'idempotenza del setup** — `src/lib/motion/binding.ts`, § Sistema di animazione
  (`src/lib/motion/`) qui sotto;
- **l'unione degli hash CSP fra le pagine** — `src/lib/csp/integration.ts`, `deploy-ops.md`
  § Content-Security-Policy;
- **gli script inline che non rigirano** e ascoltano `astro:after-swap` —
  `src/components/head/js-flag.astro` e `src/components/head/theme-script.astro`, e la voce sulle
  view transition qui sopra.

## Budget di bundle (`scripts/bundle-budget.mjs`)

`pnpm perf:bundle`, che la CI lancia subito dopo la build. Attraversa `dist/client` e per ogni rotta
emessa misura la **chiusura statica** — i chunk che la pagina raggiunge seguendo solo gli archi
`import` — in byte gzip, e la confronta col budget della rotta. Un'uscita con codice 1 fa fallire il
job.

- **Statica, non totale.** Un chunk raggiungibile solo tramite `await import()` viene riportato
  nella colonna `DEFERRED` e non costa niente al budget: si carica dopo il paint, dietro una guardia
  a runtime. Spostare una dipendenza pesante dietro un import dinamico è quindi il modo standard per
  rientrare nel budget.
- **Il default è 20 KB gzip**, circa una volta e mezza la rotta più pesante di partenza
  (`/contatti`, 13,4 KB: router, prefetch, nav mobile e form di contatto). È tarato per prendere
  una *dipendenza* che entra nel percorso critico, non i singoli KB.
- **Una classe di rotte più pesante** si mette prima del default in `BUDGETS`
  (`scripts/lib/bundle-budget.ts`) con il suo `matches`: vince la prima corrispondenza. Una pagina
  che monta una libreria di animazione sta lì, e non in un default globale alzato, così il resto del
  sito tiene il budget stretto.
- **Le rotte attese si leggono da `src/pages`**, non si elencano a mano: una pagina prerenderizzata
  che non emette HTML fa fallire il gate, e anche un `dist/client` vuoto lo fa fallire. Senza quello
  i controlli per rotta fallirebbero verso l'aperto — iterano sulle pagine emesse, quindi non
  misurare niente passerebbe.
- **Il foglio di stile ha un budget suo**, verificato una volta sola invece che per rotta: è un file
  condiviso, e addebitarlo a ogni pagina farebbe sembrare che ciascuna lo paghi. Sta nel gate perché
  è insieme l'asset più pesante consegnato e l'unico che blocca il rendering: l'output di Tailwind
  cresce una utility alla volta, quindi un progetto scivola verso l'alto senza che nessuna singola
  modifica sembri costosa.
- **Le pagine che si sfilano con `prerender = false`** sono fuori dal budget per costruzione (non
  c'è HTML da misurare) e compaiono in una `NOTE`, non fra i fallimenti. È il prerendering come
  default a tenere piccolo quel buco: una pagina che semplicemente si dimentica di dichiarare
  qualcosa resta misurata.

### Cosa il budget non vede

Misura i chunk emessi, quindi tutto ciò che non diventa mai un chunk gli è invisibile. Non è un buco
da tappare — è la forma della misura, e vale la pena conoscerla prima di leggere un rapporto verde
come «questa pagina è leggera»:

- **gli script `is:inline`.** Lo script del tema è inline in ogni pagina e Astro lo passa
  **tale e quale**: non impacchettato, non minificato, commenti compresi. Costa byte a ogni risposta
  HTML e non compare in nessuno dei numeri. Tienilo corto, e nel corpo di uno script `is:inline` non
  scrivere commenti: un fatto che serve va nel frontmatter o in un `{/* … */}` sopra lo script, che
  non arrivano nell'HTML;
- **il CSS.** Il budget riguarda solo il JavaScript lato client;
- **immagini e font.** Lì il peso lo governano `astro:assets` e l'API dei font, non questo.

### Tenere un modulo condiviso sicuro per il client

L'unica regressione che il budget prende in modo affidabile: un modulo importato da uno script
client che si tira dietro una libreria pesante. Una chiamata a livello di modulo come `z.string()`
**non** è eliminabile dal tree shaking — importare una sola costante da quel file spedisce l'intera
libreria.

L'esempio svolto è l'honeypot, diviso fra `src/lib/forms/honeypot.ts` (costante e predicato, zero
import) e `honeypot-schema.ts` (la forma zod). Rimetterli insieme è stato misurato: `/contatti` da
9,8 a 22,1 KB gzip, budget fallito.

La regola che ne segue: **un modulo importato da uno script client può contenere costanti, tipi e
funzioni pure, ma nessuna chiamata a una dipendenza a livello di modulo.** Quando serve un nome
condiviso da entrambe le parti, si divide il file, non il nome.

## Audit Lighthouse

`output: 'static'` e `trailingSlash: 'never'` sono ciò che rende sensato un audit locale:
`dist/client` servito piatto è byte per byte quello che serve la CDN. Una pagina sfilata con
`prerender = false` non lo è, e compare come `NOTE` nel rapporto del budget di bundle.

- `pnpm run lhci:local` fa tutto il giro: costruisce con `VERCEL_ENV=production`, si rifiuta di
  proseguire se `robots.txt` non dice `Allow: /`, serve `dist/lh-prod/client` piatto, trova un
  Chrome per Linux e stampa il punteggio mediano per URL. Non aggiunge niente alle dipendenze:
  `@lhci/cli` e `serve` passano da `pnpm dlx`.
- In CI, `.github/workflows/lighthouse.yml` afferma quello che dice `.lighthouserc.json`:
  settimanale sul branch di default, e su una PR solo quando porta la label `lighthouse`.
  `continue-on-error: true` di proposito — è informativo, mai un gate, perché i numeri di un runner
  condiviso si muovono da soli.
- **[HARD] Il rapporto della CI viene caricato su `temporary-public-storage`**, il bucket pubblico
  di Google: chiunque abbia l'URL lo legge, e dentro c'è uno screenshot della pagina. Innocuo per un
  sito vetrina pubblico, sbagliato per qualsiasi cosa dietro deployment protection — lì si mette
  `upload.target` a `filesystem`.

- **`astro preview` non funziona con l'adapter Vercel** («does not support the preview command»), ed
  è il motivo per cui la build viene servita da un server statico qualunque. Non ricorrere nemmeno
  allo `staticDistDir` di LHCI: serve attraverso `express.static`, che fa un 301 da `/pagina` a
  `/pagina/` e inquina l'audit `redirects` su un sito con `trailingSlash: 'never'`.
- **[HARD] Sotto WSL, fissa un Chrome per Linux.** `chrome-launcher` trova il Chrome *di Windows*
  attraverso l'interoperabilità e lo preferisce; quel binario legge una user-data-dir Linux come un
  percorso UNC, non risolve `%LOCALAPPDATA%` (da cui percorsi tipo
  `undefined:\Users\undefined\...`), non prende nessun lock e muore con «Unable to connect to
  Chrome», lasciando dietro cartelle con dei backslash nel nome che poi fanno inciampare `biome ci`.
  L'indizio nel log è un riferimento a `crashpad\...\file_io_win.cc`. Valida il binario con
  `--version` prima di usarlo: una cache può contenere build per un'altra architettura (un binario
  puppeteer `linux_arm-*` è x86-64, e su aarch64 fallisce con `Exec format error`).
- **Non lasciare che Lighthouse generi processi sotto WSL.** Un `pnpm` lanciato da lui eredita quel
  `LOCALAPPDATA` fasullo; corepack lo usa come radice della propria cache anche su Linux, non trova
  pnpm, prova a riscaricarlo sotto `/mnt/undefined/...` e muore con `EACCES`. Avvia tu il server e
  passa a Lighthouse una configurazione senza `startServerCommand`: passare `--collect.url` da riga
  di comando *non* disattiva quello nel file di configurazione.
- **Il punteggio è un limite superiore, non un numero di campo.** Il server locale non manda
  compressione, non c'è CDN e non ci sono le intestazioni di `vercel.json`, e con le variabili di
  tracciamento non impostate non si caricano né il CMP né GTM. Va letto come segnale di regressione
  rispetto al giro precedente.
- Il preset di default emula il **mobile**, che è il viewport da cui dipendono quasi tutte le
  questioni di LCP.
- Per identificare l'elemento LCP serve il rapporto JSON: il terminale stampa solo i punteggi. L'id
  dell'audit è **`lcp-discovery-insight`** (frammento dell'elemento più
  `requestDiscoverable`/`eagerlyLoaded`/`priorityHinted`); ha sostituito
  `largest-contentful-paint-element` in Lighthouse 13, e chiedere il vecchio id con `--only-audits`
  restituisce un rapporto in cui **manca in silenzio**.

## Resource hint

Il template emette hint per una cosa sola: le origini di consenso e analytics, da dentro il gate di
`getTrackingConfig()` (`src/components/head/tracking.astro`), così un progetto senza tracciamento
non ne emette nessuno. Regole per aggiungerne altri:

- **`preconnect` solo per origini caricate senza condizioni.** Apre TCP e TLS in anticipo; su
  un'origine che potrebbe non essere mai contattata è un socket sprecato. Il CMP rientra senza
  dubbi: si carica su ogni pagina, prima del consenso per definizione.
- **`dns-prefetch` per le origini dietro il consenso.** **[HARD]** Un `preconnect` a
  `www.googletagmanager.com` manda l'SNI e l'IP del visitatore a Google *prima* del consenso, il che
  rompe l'invariante per cui esiste tutto il gate (`deploy-ops.md` § Tracciamento e Consent Mode
  v2). `dns-prefetch` interroga solo il resolver del visitatore, quindi la risoluzione è calda senza
  nessun contatto con terzi.
- **Dove sta il gate lo decide l'origine, non il fornitore.** Qualcosa che viene contattato a
  prescindere dal consenso — una CDN di immagini, per dire — deve avere il suo hint *fuori* dal gate
  del tracciamento, altrimenti mancherebbe in sviluppo e su ogni preview senza quelle variabili
  d'ambiente, che è esattamente dove quell'origine viene comunque contattata.
- **Mai `crossorigin` su un hint per una richiesta non CORS.** Apre una connessione *anonima* che un
  semplice `<script src>` non riuserà: due socket, zero guadagno. Riservalo ai font e alle `fetch`
  CORS.
- Accompagna ogni `preconnect` con un `dns-prefetch` sulla stessa origine, come ripiego per i
  browser che ignorano il primo; quelli che li supportano entrambi scartano il doppione.
- Gli hint non richiedono una voce nella CSP (`default-src` non li governa), ma ci si aspetta che
  l'origine sia comunque nella policy, dato che prima o poi da lì si carica qualcosa.

## Sistema di animazione (`src/lib/motion/`)

- `index.ts` è l'UNICO punto di import per chi consuma (`@/lib/motion`); i moduli interni importano
  direttamente i fratelli, mai il barrel (rischio di ciclo).
- **[HARD]** `prefers-reduced-motion: reduce` disattiva TUTTE le animazioni. Le guardie
  (`prefersReducedMotion()`, `isDesktopViewport()`, `hasFinePointer()`) sono sicure in SSR, e
  `prefersReducedMotion()` è la prima riga di ogni impostazione di animazione.
- Convenzione sul comportamento lato client: ogni componente interattivo tiene la sua logica in un
  modulo `.ts` fratello (`select-behavior.ts`, `lib/motion/reveal.ts`, …) che esporta
  `bindX = createMotionBinding(setup, cleanup)`; lo script del file `.astro` fa solo
  `import { bindX } … bindX()`. Tiene il markup sottile, garantisce la pulizia e rende la logica
  testabile a unità (vitest e happy-dom).
- `createMotionBinding(setup, cleanup)` è il contratto di ciclo di vita per gli effetti per
  componente con `<ClientRouter />`:
  - `setup` gira subito **e** `astro:page-load` scatta anche al caricamento iniziale, quindi su un
    caricamento a freddo può girare due volte e **deve essere idempotente**;
  - `cleanup` gira su `astro:before-swap` (osservatori e cicli rAF si smontano prima dello scambio
    del DOM, altrimenti perdono memoria da una navigazione all'altra);
  - gli ascoltatori si registrano esattamente una volta anche se lo script del componente rigira.

## Rivelazione allo scroll (`src/lib/motion/reveal.ts` e `src/components/ui/reveal.astro`)

- Guidata dagli attributi: l'IntersectionObserver gira `data-reveal-ready`, e la transizione è CSS
  puro in `globals.css`, con un doppio gate su `html.js` (senza JS il contenuto è visibile; la
  classe la mette prima del paint `src/components/head/js-flag.astro`, di proposito separato dallo
  script del tema) e su `@media (prefers-reduced-motion: no-preference)` (con reduce resta statico).
- Due osservatori: il primo usa `rootMargin '0px 0px -15% 0px'`; gli elementi che non possono mai
  attraversare quel confine ristretto (l'ultimo 15% circa della pagina al massimo scroll) passano a
  un ripiego senza margine — senza, resterebbero nascosti per sempre.
- **Variante a cascata, senza il componente contenitore**: `data-reveal-stagger` su un contenitore
  più `style="--i: {indice}"` su ogni figlio li fa entrare in sequenza; `--reveal-stagger`
  sovrascrive il passo di 0,08s. Stesso doppio gate e stessi osservatori: il contenitore prende
  `data-reveal-ready`, i figli ereditano il ritardo.
- **[HARD] Dentro `<ul>`, `<ol>` e `<dl>` la variante a cascata è l'unica forma ammissibile.**
  `<Reveal>` rende un `<div>`, e un `<div>` fra una lista e i suoi `<li>` rompe la semantica della
  lista: le tecnologie assistive smettono di annunciare il numero di voci.
- Per estendere le animazioni: si costruisce su `createMotionBinding` e sulle guardie, tenendo lo
  stato iniziale del CSS dietro lo stesso gate. Nello scaffold di base non c'è nessuna libreria di
  animazione.

## Animazioni: effetti una tantum ed effetti continui

- Un effetto **una tantum** (una rivelazione) è irreversibile una volta scattato: il suo ascoltatore
  del cambio di `prefers-reduced-motion` deve solo mettere un gate sulle impostazioni *future*, e
  non armare rivelazioni che non sono ancora avvenute. Deve però riarmarle quando «reduce» si
  spegne a metà sessione, altrimenti il gate CSS nasconde contenuto che nessun osservatore rivelerà
  mai.
- Un effetto **continuo o vivo** (un pinning allo scroll, una parallasse, un ciclo rAF in esecuzione)
  ha bisogno di un gate **bidirezionale**: l'ascoltatore smonta l'effetto in diretta se l'utente
  accende «reduce» a metà sessione, e lo ricollega se lo spegne — non basta un gate sulle
  impostazioni future. **[HARD]** «reduce» disattiva TUTTE le animazioni, comprese quelle già in
  corso.
- `cleanup` deve distruggere qualunque cosa la libreria di terze parti abbia creato (osservatori,
  cicli rAF, controller di scroll): il contratto della binding garantisce che la pulizia venga
  eseguita, non che la libreria si sia smontata da sola.
- **Testare**: quando un effetto dipende da layout, rAF o geometrie vere (che happy-dom non può
  fornire), si simula la libreria di terze parti invece dei moduli interni e si verifica il
  contratto del ciclo di vita contro il numero di chiamate — creato al setup, ucciso o distrutto al
  cleanup, idempotente, bidirezionale sul reduced motion — non il risultato visivo.

## Immagini

Le immagini locali vivono in `src/assets/**` e passano da `astro:assets`
(`import { Image } from 'astro:assets'`); quelle guidate dai contenuti si riferiscono a un campo di
schema `image()`. L'ottimizzazione la fa il servizio Sharp di default di Astro: le pagine
prerenderizzate emettono in **fase di build** varianti responsive già generate in
`dist/client/_astro/`, servite come file statici.

- **`sharp` sta in `dependencies`, non in `devDependencies`.** Una pagina `prerender = false` che
  rende `<Image>` non ha varianti di build: le chiede a `/_image`, che gira nella funzione `_render`
  e carica `sharp` a runtime. Il pacchetto nativo entra nella funzione solo se il build lo risolve
  dalla radice del progetto; come semplice dipendenza opzionale di astro resta fuori.

- Di proposito NON si usa `imageService: true` dell'adapter Vercel: le varianti statiche generate in
  build tengono il template portabile su host diversi da Vercel e fuori dalla quota di runtime della
  sua Image Optimization. Nel momento in cui un progetto lo accende cambiano quattro cose, tutte
  silenziose: in build non viene più emessa nessuna variante (il sorgente viene copiato byte per
  byte e `<Image>` emette `/_vercel/image?url=…` risolto per richiesta); **`format` smette di
  entrare nell'URL** — Vercel sceglie AVIF o WebP dall'header `Accept`, quindi un `<picture>` con un
  `srcset` AVIF e uno WebP emette due sorgenti identiche; **`quality` torna a 100** se non passata;
  e **`widths` viene filtrato contro l'elenco dell'adapter**, non arrotondato ad esso — `[640, 1024,
  1600, 2400]` sopravvive come `[640]`, lasciando un lightbox a schermo intero con una sola sorgente
  da 640w, senza che niente fallisca.
- **Un host remoto vuole l'allowlist giusta per la strada che prende.** Attraverso `<Image>` e
  `getImage()` va in `image.remotePatterns`; se lì manca, `inferRemoteSize` solleva un errore *dopo*
  che le intestazioni sono già partite e la pagina risponde **200 con il corpo vuoto**. Un host
  servito da un `<img>` grezzo non tocca mai il servizio immagini e va invece nell'`img-src` della
  CSP.
- **Asset locali o CDN remoto è una scelta di progetto, e sposta il lavoro.** Con gli asset locali
  trasforma `sharp`, in build o in `/_image`. Con un CDN che trasforma le immagini, come Cloudinary,
  l'URL lo compone un costruttore di URL del progetto e la pagina rende un `<img>` grezzo: `sharp`
  non lavora, l'host va nell'`img-src` di `src/lib/csp/directives.ts`, e trasformazioni, banda e
  quota stanno nel piano del CDN.
- Scrivi `<Image>` con `widths` e `sizes` espliciti (e una `quality` bassa per le foto), così la
  build emette un srcset della dimensione giusta. L'immagine che fa da LCP prende `priority`, che in
  Astro 7 imposta `loading="eager"`, `decoding="sync"` e `fetchpriority="high"`; le altre restano sul
  caricamento pigro di default.
- Passa sempre un `alt` che dica qualcosa; la stringa vuota solo per le immagini puramente
  decorative. Un'immagine guidata dai contenuti è `imageSchema(image)` di
  `src/lib/schemas/common.ts`, cioè `{ src, alt }`, resa con `alt={image.alt}`. Uno sfondo dietro un
  titolo che dice già la cosa è `backgroundSchema(image)`, `{ src }` senza alt, reso con `alt=""`:
  è lo sfondo facoltativo dell'hero.
- **Un elenco di immagini di contenuto è `z.array(imageSchema(image))`, mai `array<string>`.** Nel
  momento in cui l'alt non ha un posto dove stare nello schema, se lo inventa il markup — e un alt
  scritto in un componente è la stessa frase su ogni voce.
- `imageSchema` tipizza l'alt `z.string()` **senza** `.min(1)`: un alt vuoto è la risposta giusta per
  un'immagine decorativa (che prende anche `aria-hidden`), e il punto è costringere chi scrive a
  scegliere. Dentro una stessa galleria ogni alt dev'essere **distinto**: sia i lettori di schermo sia
  Google Immagini li leggono come una lista.

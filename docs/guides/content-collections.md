# Content collection

## Scegliere l'archetipo

Tre forme, e si sceglie dalla struttura del contenuto, non dal suo argomento.

- **Singleton diviso in sezioni** — una pagina sola costruita da blocchi eterogenei. Lo schema è una
  `z.discriminatedUnion` su un campo `section`, un file per sezione, dietro una funzione di accesso
  dedicata (`getXSections(locale?)`) che assembla la pagina. Il pattern della homepage qui sotto è
  il riferimento: si replica parola per parola.
- **Piatta a schema condiviso** — molte voci che condividono UNA sola forma di schema, ognuna una
  pagina o un record completo. Si leggono direttamente (`getCollection` per il listing, `getEntry`
  per una sola), con chiave sul `generateId` del file (lo slug); nessuno strato di accesso ai dati.
- **Documento** (`gen:collection` in modalità documento) — l'unica forma con un `body` renderizzabile
  (MDX o MD). Il frontmatter è uno schema piatto come nella forma a schema condiviso; il corpo si
  rende con `render(entry)` → `<Content />`.

Regola di decisione: si tira in ballo una **collection dedicata solo quando ci sono molte voci
intercambiabili**. Un blocco fisso e unico su una pagina singleton è una **sezione**, non una
collection: non montarne una per lui.

## Homepage: singleton diviso in sezioni

- Un `.yml` per sezione sotto `src/content/homepage/` (forma DATI: solo `entry.data`, nessun corpo
  renderizzabile). Lo schema è una `z.discriminatedUnion` sul campo `section`
  (`src/lib/schemas/homepage/index.ts`), un file di schema per sezione (`hero.ts`, …), e le
  primitive condivise in `src/lib/schemas/common.ts`.
- L'accesso passa SOLO da `getHomepageSections(locale?)` in `src/lib/homepage.ts`, mai da
  `getCollection('homepage')` chiamato direttamente da una pagina. La catena della fonte unica è
  schema Zod → `CollectionEntry<'homepage'>['data']` → `HomepageSections` → Props del componente
  (`type Props = HomepageSections['hero']`), così una modifica allo schema si propaga ai tipi dei
  componenti senza una riga di duplicazione scritta a mano.
- I componenti di sezione vivono in `src/components/home/`, uno per sezione, e si agganciano in
  `src/pages/index.astro`.

## Disposizione per lingua (segue la decisione sul routing i18n nativo)

- Il contenuto nella lingua di default è PIATTO: `src/content/homepage/hero.yml` (id della voce:
  `hero`). Le lingue in più vanno in una sottocartella, `src/content/homepage/<lingua>/hero.yml`
  (per l'inglese l'id diventa `en/hero`). Aggiungere una lingua è puramente additivo: i file della lingua di default non si
  spostano mai.
- `getHomepageSections()` ricade su `DEFAULT_LOCALE` di `src/lib/site.ts`; dalle pagine si passa
  `Astro.currentLocale`.

## Il contratto del fallire rumorosamente

- Una sezione dichiarata nell'oggetto di ritorno di `getHomepageSections` ma senza il suo file di
  contenuto solleva un errore in fase di build (`pick()`), così un file dimenticato rompe la CI
  invece di spedire una pagina rotta. Lo stesso errore copre le sezioni duplicate dentro una lingua
  e i file della lingua di default finiti per sbaglio in una cartella di lingua.
- La garanzia in fase di build regge perché ogni consumatore di `getHomepageSections` è
  prerenderizzato (il default). Un consumatore che si fosse sfilato con `prerender = false`
  trasformerebbe questi errori in 500 a runtime: le rotte della homepage restano prerenderizzate.
- **Non togliere il `generateId` personalizzato della collection homepage**: quello di default
  slugifica i segmenti e onora una chiave `slug` nello YAML, il che fa atterrare il contenuto in
  silenzio nella lingua sbagliata (le ragioni sono fissate accanto al loader in
  `src/content.config.ts`). È specifico dell'archetipo e non una regola di casa: `gen:collection` lo
  emette per una collection **dati**, che può essere riletta per cartella di lingua, e lascia di
  proposito quello di default per una collection **documento**, il cui id diventa lo slug della
  rotta e che quindi *vuole* la slugificazione e uno `slug` nel frontmatter.
- **[HARD] Gli schemi di contenuto usano `z.strictObject`, mai `z.object`.** Un oggetto normale
  scarta le chiavi sconosciute, quindi un campo scritto male o rinominato sparisce dalla pagina con
  la build verde: è l'unico guasto di contenuto che gli errori qui sopra non prendono, ed è proprio
  quello che produce davvero chi scrive i contenuti senza essere tecnico. La strettezza sopravvive a
  `z.discriminatedUnion`, è fissata in `src/lib/schemas/homepage/hero.test.ts`, e i template di
  entrambi i generatori la emettono.
- **Trappola della cache locale (verificata)**: con lo store del content layer già caldo, cancellare
  un file di contenuto può NON far fallire una `pnpm run build` in locale, perché la voce vecchia
  arriva da `node_modules/.astro/data-store.json`. La CI è sempre fredda, quindi lì la garanzia
  regge. Se una build locale si comporta in modo sospetto dopo aver aggiunto o tolto file di
  contenuto, svuota `node_modules/.astro` (e `.astro/`).

## Collection piatte a schema condiviso

- Le sotto-sezioni oltre la prima e l'ultima si rendono **facoltative**, così una voce più leggera
  (per esempio una pagina indice che riusa solo il blocco d'apertura e la chiamata all'azione
  finale) valida contro lo stesso schema senza portarsi dietro blocchi centrali vuoti.
- Uno strato sottile di accesso ai dati si aggiunge **solo** quando entra in gioco un filtro di
  visibilità, e allora ci passano sia il listing sia il dettaglio (vedi *Regole di dominio
  testabili*).

## Collection di documenti (MDX e MD)

L'unico archetipo con un `body` renderizzabile. Si impalca con `gen:collection` in modalità
documento e poi si sistema a mano: il generatore fissa un glob `**/*.md` e una regex `generateId`
corrispondente.

- **MDX richiede modifiche in più.** Dopo la generazione, cambia il glob e la regex di `generateId`
  in `**/*.mdx` e `\.(mdx)$` dentro `content.config.ts`, e registra l'integrazione `@astrojs/mdx` in
  `astro.config.mjs`. Se l'integrazione manca, la build fallisce con un errore di **estensione non
  riconosciuta** e non con un errore di schema: non metterti a debuggare lo schema.
- **Rendere il corpo.** Su una rotta di dettaglio prerenderizzata (un `getStaticPaths` che enumera
  le voci), `const { Content } = await render(entry)` (`render` da `astro:content`, la Content Layer
  API) restituisce un `<Content />` per il corpo.
- **`{…}` in MDX è JavaScript.** Qualunque marcatore di redazione (un suggerimento di layout su un
  titolo, la dimensione di un'immagine, …) va in **testo semplice**, mai come `{.classe}`, che viene
  letto come espressione JS e rompe la build.
- **I plugin del processore e di rehype non si ricaricano a caldo.** Sono importati dalla
  configurazione (`markdown.processor: unified({ rehypePlugins: [...] })`, l'API non deprecata),
  quindi modificare un plugin locale richiede il **riavvio del server di sviluppo**: la pagina non
  riflette la modifica al salvataggio.
- **La bozza è un 404 gratis.** Se il filtro di visibilità (sotto) toglie le bozze da
  `getStaticPaths` in una build di produzione e non c'è nessun `fallback`, gli slug delle bozze non
  vengono mai generati e a servirli è il `404.astro` nativo di Astro. Zero codice di 404 scritto a
  mano: una rotta mai enumerata in produzione semplicemente non viene costruita. Lo stesso contratto
  copre la sitemap — vengono emesse solo le rotte prerenderizzate, quindi l'URL di una bozza non
  costruita non può trapelare (nessun `filter` necessario).

## Listing paginati (quando un progetto ne aggiunge uno)

Un archivio pagina con `paginate()` da `getStaticPaths`, e una faccetta (categoria, tag, anno) è
**un altro insieme di rotte generate**, mai un filtro lato client. Sotto `output: 'static'` niente
altro sopravvive alla paginazione: uno script che filtra la pagina corrente perde in silenzio le
voci della seconda pagina, e con loro tutto quello che sta oltre la prima esce dall'indice.

- **La prima pagina non ha segmento di pagina.** `[...page].astro` emette `/news`, mai `/news/1`, e
  il canonical deve seguirlo (`currentPage === 1` → il percorso nudo). Qualunque cosa legga le rotte
  come pattern deve ammettere il segmento finale **vuoto**: `scripts/lib/bundle-budget.ts` lo fa, e
  un test lo fissa, perché senza quello un archivio di una pagina sola verrebbe riportato come una
  rotta che non ha emesso niente.
- **Non annotare il tipo di ritorno.** Restituisci `paginate(...)` così com'è: `PaginateFunction`
  porta `page: Page<T>` più le tue prop fino ad `Astro.props`, e un'annotazione
  `GetStaticPathsResult` cancella entrambe — a quel punto la rotta vede `unknown`.
- **`page.url.prev` e `page.url.next` portano già il prefisso di lingua**, essendo costruiti dalla
  rotta in cui il file si trova: i link di paginazione non hanno bisogno di `localizedHref()`.
- **Un guscio, N rotte.** Indice e faccetta rendono la stessa pagina con una fetta diversa, quindi
  il markup vive in un componente solo e ogni file di rotta è un `getStaticPaths` più il montaggio.
  Le copie di una pagina di listing divergono.
- **Una faccetta genera solo i valori davvero in uso**, altrimenti il filtro offre link a pagine
  vuote; un valore per cui l'interfaccia non ha un'etichetta si scarta, non si stampa grezzo.
- Il miglioramento lato client (un feed infinito che accoda la pagina successiva) sta **sopra** le
  rotte generate e non le sostituisce mai: senza lo script lo stesso elemento resta un link vero, ed
  è quello che i crawler seguono.

## Regole di dominio testabili

Ogni predicato con dei rami (visibilità delle bozze, filtri legati all'ambiente, …) si **estrae in
un modulo puro** che riceve l'ambiente come parametro — `isPublished(entry, isProd)`, non una
funzione che legge `import.meta.env` al suo interno. Due proprietà lo rendono testabile:

- **riceve** l'ambiente, quindi un test fissa sia produzione sia sviluppo senza toccare i global;
- **non** importa `astro:content`, quindi il test lo importa direttamente senza nessuna collection
  da simulare — la stessa ragione per cui la logica SEO della head sta in un `.ts` normale accanto
  al componente `.astro`.

Ogni consumatore passa da **un solo** helper condiviso (filtro del listing, `getStaticPaths` del
dettaglio, tutto quello che sta a valle), così la regola non può divergere fra i punti di chiamata.

## Convenzioni sulla forma degli schemi

- **Campi guidati da stringa → schema lasco.** Per un campo che seleziona per nome un'opzione di un
  componente (`icon`, `variant`, …) si usa un `z.string()` semplice, mai `z.enum`. La mappa
  nome→valore e la sua type guard vivono nel **componente**; un valore sconosciuto degrada a un
  **nulla di fatto** (non rende niente, o rende un default), mai a un errore di build. Lo schema
  resta stabile mentre l'insieme delle opzioni evolve: aggiungere o rinominare un'opzione tocca solo
  la mappa del componente, e il contenuto rimasto sul nome vecchio fallisce in modo morbido.
- **Un bottone solo si annida sotto `action`, non sotto `cta`.** Un blocco già chiamato col suo
  scopo altrimenti si legge `cta.cta`; `action` toglie la balbuzie. Vale per qualunque blocco che
  avvolga una singola chiamata all'azione, in entrambi gli archetipi.

## La cucitura verso un CMS (decisione per progetto, ricerca di luglio 2026)

`getHomepageSections` è la cucitura dell'adapter: i componenti consumano SOLO il suo output
tipizzato, quindi un progetto può sostituire il backend dei contenuti reimplementando quella
funzione sola (un loader in fase di build, o una collection viva per avere freschezza in SSR) e la
catena Zod → Props resta intatta. Non incorporare un CMS nel template.

- Il cliente ha bisogno di modificare da solo QUESTI file: **Sveltia CMS** si sovrappone uno a uno a
  questa disposizione (file collection con schema per file;
  `omit_default_locale_from_file_path: true` è esattamente il nostro default piatto con
  sottocartelle di lingua). Una pagina statica `/admin` per progetto, licenza MIT, costo zero,
  nessuna ristrutturazione.
- Il cliente ha bisogno di flussi di approvazione o di modifica visuale: si valutano Sanity o
  Storyblok progetto per progetto (entrambi con SDK Astro ufficiali; l'editor visuale di Storyblok
  richiede SSR, che qui c'è già).

## Punti di iniezione dei generatori

Marcati con commenti `INJECTION POINT` e verificati dai generatori (che sollevano un errore, mai un
silenzioso nulla di fatto):

- `src/content.config.ts` — `gen:collection` (già presente). Il contratto è
  `export const collections = { … }`: **esportato** (Astro ignora in silenzio un oggetto non
  esportato) e inizializzato con un letterale. Duplicati e collisioni di identificatori (import o
  variabili) sollevano errori descrittivi in un pre-volo, prima che venga scritto un solo file. Il
  commento INJECTION POINT sta DENTRO il letterale: le istruzioni iniettate sopra la dichiarazione
  staccherebbero un commento in testa.
- `gen:section` (già presente) verifica tre punti di aggancio in un pre-volo, prima che venga
  scritto un solo file, e su ciascuno solleva un errore descrittivo:
  1. `src/lib/schemas/homepage/index.ts` — la chiamata `z.discriminatedUnion` dentro
     `homepageCollectionSchema`;
  2. `src/lib/homepage.ts` — il letterale dell'oggetto di ritorno di `getHomepageSections`;
  3. `src/pages/index.astro` — i marcatori `// @gen:home-imports` e `{/* @gen:home-sections */}`.
     **Il lato dell'inserimento è parte del contratto: si inserisce SOPRA il marcatore.** Verificato:
     inserendo sotto `@gen:home-imports`, l'`organizeImports` di Biome adotta il marcatore come
     trivia iniziale del nuovo import e lo sposta dentro il blocco ordinato.

  **L'opzione immagine.** Se la sezione porta un'immagine, lo schema riceve
  `{ image }: SchemaContext` e il campo `image: imageSchema(image)`, il contenuto punta a
  `src/assets/placeholder.jpg` e il componente rende un `<Image>`. Nell'unione la sezione entra come
  `<nome>SectionSchema(context)`: il contesto Astro lo passa alla funzione di schema della
  collection, e se la funzione non ha ancora il parametro il generatore glielo aggiunge.
- `gen:page` scrive le chiavi della pagina in ogni dizionario di `src/i18n/strings/`:
  `page.<nome>.title`, e per una pagina statica anche `page.<nome>.description`, che nasce
  `'<PAGE_DESCRIPTION>'` e che `check:placeholders` ferma al deploy. Le scrive in tutti perché
  `src/i18n/ui.ts` li tipizza sulle chiavi di `it.ts`, e una lingua a cui ne manca una fa fallire il
  type-check. Il pre-volo verifica che la pagina non esista, che ogni dizionario esporti
  `const <lingua> = { … } as const` e che nessuno abbia già le chiavi.

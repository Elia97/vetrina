# Deploy e operatività

Convenzioni per il deploy su Vercel, la pipeline di release e tutto ciò che vive in `vercel.json`.
Rimandi: `rendering-performance.md` (budget di bundle), `seo.md` (deploy di preview, politica degli
URL), `forms-email.md` (la politica sulle variabili d'ambiente per le chiavi dei fornitori).

**[HARD]** `astro dev` non legge `vercel.json`. Intestazioni, CSP, redirect e rewrite sono inerti in
locale e si possono verificare *soltanto* su un deploy vero. «In sviluppo funziona» non è una prova
di niente, in questo file.

## Modello di deploy

La produzione esce **solo da un tag di release**, mai da un push su `main`:

- `scripts/vercel-ignore-build.sh` arriva a Vercel da `ignoreCommand` in `vercel.json`, che
  sovrascrive l'*Ignored Build Step* delle impostazioni di progetto (documentazione Vercel,
  `project-configuration/vercel-json`). Il contratto è invertito: esce 0 (salta) su `main` e su
  `release-please--*`, esce 1 (procedi) su tutto il resto, quindi l'integrazione git produce solo
  deploy di **preview**. I branch di dependabot vengono tagliati ancora prima, da
  `git.deploymentEnabled`, sempre in `vercel.json`. Un salto compare nel pannello come **deployment
  annullato di 1s**, non come un deployment mancante: vale la pena saperlo prima di mettersi a
  cercare un deploy che non è mai avvenuto.
- **Il job di deploy non ci passa.** Il comando gira quando un deployment entra nello stato
  `BUILDING` su Vercel (documentazione Vercel, `project-configuration/project-settings`), mentre
  `deploy.yml` costruisce fuori da Vercel con `vercel build --prod` e carica l'artefatto già pronto
  con `vercel deploy --prebuilt` (documentazione Vercel, `cli/build`): la strada del tag non incontra
  mai questa regola.
- **I preview esistono dal primo push, la produzione no.** Ogni branch pushato ne riceve uno, ma
  prima del primo tag di release non esiste nessun deployment di produzione: vale la pena saperlo
  prima di promettere un link a un cliente.
- Il deploy di produzione è `.github/workflows/deploy.yml`: fa il checkout del **tag** rilasciato
  (non di quello che `main` punta in quel momento), poi `pnpm run check:placeholders` →
  `pnpm run ci` → `vercel pull --prod` → `pnpm run check:placeholders --env` → `vercel build --prod`
  → `vercel deploy --prebuilt --prod` → `pnpm smoke:prod`.
- **Ha due punti d'ingresso e una strada sola.** `release-please.yml` lo chiama su un tag nuovo;
  Actions → Deploy → *Run workflow* lo lancia a mano, e un input vuoto significa il tag più recente.
  Il bottone si usa quando la produzione va ricostruita senza una modifica al codice: un segreto
  ruotato, una policy iubenda ripubblicata, un ritorno a un tag più vecchio. Rifiuta un riferimento
  che non sia un tag, così un lancio a mano non può spedire in silenzio un branch.
- Il job è subordinato a `check-vercel-secrets`: se `VERCEL_TOKEN`, `VERCEL_ORG_ID` o
  `VERCEL_PROJECT_ID` non ci sono, emette un avviso e si salta — un progetto appena creato non fa
  mai fallire la CI solo perché non è ancora collegato a Vercel. I due id vengono dal collegamento
  locale sotto `.vercel/` (gitignored): da `project.json` dopo un `vercel link` normale, o da
  `repo.json` dopo `vercel link --repo`, dove gli stessi valori sono `projects[].orgId` e
  `projects[].id`.
- La CLI di Vercel è **fissata a una major** (`pnpm dlx vercel@59`) nel job `deploy`, e di quella
  major `pnpm dlx` prende già da sé l'ultima minor: il buco è il salto di major, che Dependabot non
  vede perché non guarda dentro `pnpm dlx`. Lo segnala `.github/workflows/vercel-cli.yml`,
  settimanale e lanciabile a mano, che confronta il pin con la versione pubblicata su npm e fallisce
  quando quella è più alta; `pnpm run check:vercel-cli` è lo stesso controllo in locale. La CLI
  installata sulle macchine di lavoro segue la stessa major del pin.

**Perché `RELEASE_PLEASE_TOKEN` è un secret a parte.** Una PR aperta con il `GITHUB_TOKEN` di default
non fa scattare i workflow — è la protezione anti-ricorsione di GitHub — quindi senza il PAT la
release PR non riceve mai un check `ci`. Il workflow ricade sul `GITHUB_TOKEN`, quindi funziona
comunque: solo che la release PR si merge senza essere stata verificata.

### Cosa fa il job di deploy, e perché

Ogni riga di `deploy.yml` si guadagna il suo posto:

- **`fetch-depth: 0`** sul checkout. Alla profondità di default `actions/checkout` non scarica nessun
  tag, e la risoluzione del tag qui sotto ne ha bisogno. La storia completa serve anche al sitemap:
  `lastmod` viene da `git log`, e in un clone shallow il build lo omette (`seo.md` § Sitemap e robots).
- **Il riferimento arriva alla shell tramite `env:`, mai con `${{ }}` dentro `run:`**: quella
  sostituzione è un'iniezione di script, e su un `workflow_dispatch` l'input lo controlla chi
  attacca.
- **`git checkout --detach` sul tag risolto**, non su `main`: senza, un commit mergiato fra la
  release e il deploy finirebbe spedito senza essere taggato.
- **`corepack enable` prima di `setup-node`**: la versione di pnpm viene da
  `package.json#packageManager` e quella di Node da `.nvmrc`. Non fissarle mai nel file del workflow,
  o il repo avrà due fonti di verità.
- **`environment: production`**, così GitHub registra i deployment e più avanti si possono aggiungere
  revisori obbligatori senza toccare il workflow.

`regions` in `vercel.json` è `fra1`, e merita una decisione consapevole per progetto: una build
emette una sola funzione `_render` raggiunta da `/_actions`, `/_image` e `/_server-islands`, quindi
la regione si fissa vicino al pubblico (lasciata vuota, Vercel usa `iad1`, Stati Uniti orientali).
Le pagine prerenderizzate non ne risentono: sono file statici serviti dalla CDN, qualunque sia la
regione della funzione.

## La catena dei gate

Cinque gate, e ognuno copre un momento che gli altri non coprono:

| Gate | Dove | Copre |
|---|---|---|
| il check obbligatorio `ci` | ruleset di `main`, da `scripts/bootstrap-github.sh` | tutto ciò che atterra su `main` |
| `pnpm run ci` | job `deploy`, sul tag | ciò che parte dal tag |
| `pnpm run check:placeholders` | job `deploy`, prima di `pnpm run ci` e dopo `vercel pull` | i segnaposto del template nei sorgenti e nell'ambiente di produzione |
| `pnpm perf:bundle` | `ci.yml`, dopo la build | il JavaScript client per rotta |
| `pnpm smoke:prod` | job `deploy`, dopo il deploy | ciò che il bordo serve davvero |

`pnpm run ci` ne contiene nove in fila, e l'ordine non è casuale: Biome con `--error-on-warnings`
(un avviso è un errore), il type-check, i confini di `.fallowrc.jsonc`, la lingua, i rimandi fra
documenti, la roadmap, i commenti, i test, e da ultimo la complessità — che gira per ultima perché
il suo punteggio CRAP legge la copertura che i test hanno appena scritto.

Due presidiano la documentazione invece del codice. **`check:routes`** verifica che ogni percorso e
ogni `§ Sezione` citati in un documento risolvano: un rimando morto non rompe niente, lo si scopre
seguendolo mesi dopo, e nel frattempo ha mandato qualcuno dalla parte sbagliata. Verifica anche i
rimandi fra comandi — `/<nome>` e la sua `Fase <N>` — che si rompono quando un comando viene
rinominato o le sue fasi rinumerate. Il nome lo controlla solo dove il vocabolario è chiuso, perché
una rotta del sito ha la stessa forma di un comando.
**`check:roadmap`** verifica che le giornate tornino — i subtotali di fase e il totale contro le
righe, e la tabella Status contro la testata di ogni sezione, che dicono lo stesso numero in due
posti.

**`check:comments`** legge la forma dei commenti, non la loro utilità. Fa fallire `pnpm run ci` su
un blocco con più di due righe di prosa e su un commento che racconta la modifica invece del codice
com'è («prima era», «non più», un `#NN`); con `--strict`, che `package.json` gli passa, anche su un
file di almeno 40 righe in cui i commenti superano il 15%. Un commento corto, inutile e al presente
passa pulito: quali commenti meritano il posto lo dice `metodo.md`, e resta un giudizio di chi scrive
e di chi rivede.

**`check:placeholders`** sta fuori da `pnpm run ci` di proposito: `ci.yml` gira anche sul template,
che dei segnaposto è fatto, e fallirebbe sempre. Nel job `deploy` gira due volte. Subito dopo
l'installazione legge `src/lib/site.ts`, `src/lib/company.ts` e i dizionari di `src/i18n/strings/`,
e ferma il deploy in pochi secondi su ogni segnaposto, con file e riga. Dopo `vercel pull` legge
l'ambiente di produzione e si ferma se `CONTACT_FROM_EMAIL`, `CONTACT_FROM_NAME` o
`CONTACT_TO_EMAIL` mancano o portano un segnaposto, perché allora varrebbero i default di
`astro.config.mjs`. Il redirect di `vercel.json` non lo guarda: lo lega già a `SITE.url`
`src/vercel-redirects.test.ts`, dentro `pnpm run ci`.

⚠️ **Restano due derivati senza gate, e per la stessa ragione.** La roadmap contro le issue di
GitHub vuole la rete, quindi vive dentro `/metodo:milestone` in rilettura e non nel gate. La stima sta nel
sistema, fuori dal repo, quindi su un clone pulito non esiste: un gate che la guardasse passerebbe in
CI per assenza, che è il modo peggiore di passare.

- **`pnpm run ci` sul tag non è ridondante.** `vercel build` è `astro build`: non verifica nessun
  tipo e non esegue nessun test.
- **I confini sono dentro `pnpm run ci`, non solo in CI.** Erano un gate remoto che falliva su un
  branch verde in locale: adesso spostare codice fra le zone di `.fallowrc.jsonc` si scopre subito.
  In `ci.yml` resta `fallow review`, che è informativo ed esce sempre 0.
- **`ci.yml` non salta niente su `pull_request`.** Il suo `paths-ignore` riguarda solo i push su
  `main`: il ruleset pretende il check, e un job saltato non riporta *nessuno* stato — quindi una PR
  che l'ha saltato resta appesa per sempre su «Expected — Waiting for status» invece di fallire.
- **Il ruleset imposta `strict_required_status_checks_policy: true`**: un branch deve essere
  aggiornato con `main` prima di poter essere mergiato. Senza, due PR verdi ognuna contro un `main`
  più vecchio atterrano entrambe e lasciano `main` rosso sulla loro combinazione. Il costo è un
  rebase per PR aperta ogni volta che `main` si muove, ed è il motivo per cui
  `.github/dependabot.yml` raggruppa ogni ecosistema in un'unica PR.
- **`perf:bundle` resta fuori dal job `deploy` per scelta, non per impossibilità.** `vercel build`
  emette `dist/client` come ogni `astro build` — il log di un deploy lo mostra: `[build] directory:
  /vercel/path0/dist/`, poi `[@astrojs/vercel] Copying static files to .vercel/output/static`.
  Misurare lì sarebbe però tardi: il budget di bundle è un gate di PR, e `ci.yml` lo lancia sulla
  build che ha appena fatto, dove una rotta fuori budget si ferma prima di diventare un tag.

**[HARD]** Su un progetto cliente il ruleset non lo scavalca nessuno: `bypass_actors` è vuoto,
amministratori compresi, e l'uscita d'emergenza è disattivarlo in Settings → Rules, cosa che il log
di audit registra. (`ADMIN_BYPASS=1` su `scripts/bootstrap-github.sh` rimette dentro il ruolo di
amministratore, ed esiste per un repo mantenuto a push diretti su `main` — questo template stesso —
mai per quello di un cliente.) release-please non ha bisogno di nessuna deroga: apre una PR come
tutti, e taglia il tag solo dopo il merge.

## `vercel.json` è l'unico posto per intestazioni, redirect e rewrite

Non se ne scrive mai niente a mano nel codice applicativo, e non si duplica quello che l'adapter già
genera (il redirect sullo slash finale che nasce da `trailingSlash` è uno di questi casi). La CSP è
l'unica eccezione, e va nella direzione opposta: tutto tranne `frame-ancestors` viene generato in
fase di build — vedi § Content-Security-Policy.

Anche `git.deploymentEnabled` vive qui, con `dependabot/**` a `false`: i branch di dependabot non
ricevono nessun deploy di preview. E `ignoreCommand`, che è il comando dell'Ignored Build Step —
vedi § Modello di deploy.

Poiché niente di tutto questo gira in locale, ogni regola è fissata da un test dichiarativo, che è
l'unico segnale disponibile prima del deploy:

| Test | Presidia |
|---|---|
| `src/vercel-headers.test.ts` | le sei intestazioni di sicurezza incondizionate, `frame-ancestors 'none'`, e che nessuna fra `default-src`, `script-src`, `style-src`, `connect-src` e `img-src` stia qui dentro |
| `src/vercel-robots.test.ts` | la regola di noindex su `*.vercel.app`, e che non corrisponda mai al dominio personalizzato |
| `src/vercel-botid.test.ts` | i rewrite del proxy BotID e la posizione della sovrascrittura di `X-Frame-Options` |
| `src/vercel-git.test.ts` | `ignoreCommand` e il suo script, più i branch che non ricevono deploy |
| `src/lib/csp/csp.test.ts` | ogni altra direttiva CSP — vedi § Content-Security-Policy |

L'ordine delle regole conta e i test lo codificano: **vince l'ultima regola di intestazione che
corrisponde**, quindi la sovrascrittura `SAMEORIGIN` per il percorso di BotID deve stare *dopo* il
`DENY` globale.

I deploy di preview sono in noindex per una regola di intestazione `has: host`, non per
`src/middleware.ts` — vedi `seo.md` § Deploy di preview.

**[HARD] Perché le intestazioni non possono stare nel middleware.** Nel `.vercel/output/config.json`
dell'adapter la rotta `handle: filesystem` precede ogni `dest: _render`: su una pagina
prerenderizzata non gira nessuna funzione, quindi un middleware che imposta `X-Frame-Options`,
`Referrer-Policy` o `X-Robots-Tag` non ne emette nessuna — in silenzio, e proprio sulle pagine che
compongono la maggior parte di un sito statico. L'opzione `staticHeaders` dell'adapter le
propagherebbe, ma il suo default è `false`. Dichiararle in `vercel.json`, come qui, aggira la
questione.

Collegato, ed è il motivo per cui questo template porta la propria integrazione CSP invece della
`security.csp` di Astro: Astro sceglie la destinazione della policy con
`cspDestination ?? (prerender ? 'meta' : 'header')`, quindi su una pagina prerenderizzata la policy
diventa un `<meta>`, che nessun middleware che riscriva una direttiva toccherà mai.

## Content-Security-Policy

La policy si **costruisce in fase di build, non si dichiara in `vercel.json`**. Due metà, divise da
quello che una CSP in `<meta>` può esprimere:

- `vercel.json` porta `frame-ancestors 'none'` e nient'altro: è l'unica direttiva che una CSP in
  `<meta>` ignora, quindi deve viaggiare come intestazione.
- Tutto il resto lo genera `cspIntegration()` (`src/lib/csp/integration.ts`), registrata in
  `astro.config.mjs`. Su `astro:build:done` calcola l'hash di ogni script inline eseguibile
  nell'output della build e inietta la policy come `<meta>` subito dopo `<meta charset>`: una CSP in
  meta governa solo quello che la segue, quindi deve precedere ogni script.

`script-src` porta quindi degli hash SHA-256 più `'self'`, e **mai** `'unsafe-inline'`
(`src/lib/csp/csp.test.ts`). Tre conseguenze che non si vedono leggendo un file solo:

- **Ogni pagina porta l'unione degli hash**, non i propri. `ClientRouter` scambia la `<head>`, non la
  policy, quindi la prima pagina caricata governa tutta la sessione: una policy per pagina si
  romperebbe alla seconda navigazione.
- **È coperto solo l'HTML prerenderizzato.** L'integrazione attraversa gli `.html` emessi; una rotta
  on-demand che restituisce HTML con uno script inline ha bisogno di una policy propria.
- **`style-src` tiene `'unsafe-inline'` di proposito.** È una regola del browser, non di Astro:
  **nel momento in cui su una direttiva compare un hash, `'unsafe-inline'` viene ignorato**. La
  `security.csp` nativa di Astro calcola l'hash anche degli stili, senza possibilità di sfilarsi
  (astro#14798), quindi adottarla lascerebbe senza stile ogni `<style>` con ambito — e ogni isola che
  scriva stili inline a runtime. Per questo la CSP qui la costruisce un'integrazione che calcola gli
  hash dei soli script.

La regola che decide se un fornitore tocca la CSP oppure no:

- **Fornitore solo lato server → nessuna modifica alla CSP.** Brevo viene chiamato da un'Astro Action
  sul server; niente di lui arriva al browser, quindi `connect-src` non c'entra. Aggiungere
  un'origine «per sicurezza» allarga la policy per niente.
- **Fornitore lato client → una direttiva per comportamento**, aggiunta esplicitamente. Meglio un
  host concreto, ma **[HARD] i caratteri jolly di GA4 su `connect-src` non sono roba da ripulire**.
  GA4 manda i suoi dati a un endpoint *regionale* scelto dalla geolocalizzazione del visitatore
  (`region1.analytics.google.com`, `region2…`), quindi fissarne uno funziona per chi sviluppa da lì e
  blocca in silenzio tutti quelli serviti da un altro. I nomi poi collidono:
  `region1.analytics.google.com` (l'endpoint attuale) **non** è `region1.google-analytics.com`
  (quello storico), e permettere solo il secondo lascia GA4 muto senza che niente fallisca lato
  server. Una CSP sbagliata non rompe nessuna build e nessun test: i rifiuti compaiono solo nella
  console del browser del visitatore.
- **Il consenso non entra nella decisione.** Un'origine contattata a prescindere da cosa sceglie il
  visitatore (una CDN di immagini, per dire) sta nella policy comunque. Il gate decide *quando* uno
  script gira, mai se la sua origine è permessa.

- **Aggiungere un fornitore significa modificare `src/lib/csp/directives.ts`**, mai `vercel.json`: si
  allarga la direttiva *specifica* che gli serve (`script-src`, `connect-src`, `img-src`,
  `frame-src`), mai `default-src`, e si aggiorna `src/lib/csp/csp.test.ts` nello stesso commit.
- Una voce mancante fallisce **in silenzio** in un modo che lo sviluppo locale non può mostrare:
  `astro dev` non legge mai `vercel.json`, e l'iniezione in fase di build gira solo su una build
  vera. Si deploya una preview e si guarda la console sia sul percorso di accettazione sia su quello
  di rifiuto prima di dire che è fatta.
- `'unsafe-eval'` è rifiutato, e qui non serve a niente.
- BotID **non** ha bisogno di nessuna voce nella CSP: la sua sfida passa da un proxy di stessa
  origine attraverso i rewrite di `vercel.json`, che è anche quello che tiene alla larga i blocca-
  pubblicità.
- **La policy dei preview apre la Vercel Toolbar; quella di produzione no.** Con
  `VERCEL_ENV === 'preview'` — la variabile che Vercel imposta solo sui deploy di preview —
  `buildCspContent()` aggiunge `https://vercel.live` alle direttive che la toolbar tocca (script,
  stili, immagini, font, `frame-src` e `connect-src`), più `wss://ws-us3.pusher.com` per il suo
  WebSocket e `assets.vercel.com` per i font. In produzione, in CI e in locale non entra niente di
  tutto questo, e il log del build lo dichiara: la riga `[csp-hashes]` porta «preview hosts» solo
  quando quel ramo è acceso.
- **Sempre sui preview, `manifest-src`.** Dietro la protezione del deployment Vercel riscrive il
  `<link rel="manifest">` verso `vercel.com/sso-api`, e `default-src 'self'` lo blocca: sul preview
  l'app non è installabile e la console riporta una violazione che in produzione non esiste.
- `frame-ancestors 'none'` e `X-Frame-Options: DENY` restano come sono: alla toolbar serve
  `frame-src`, cioè incorniciare la **propria** interfaccia dentro la pagina, non incorniciare la
  pagina. Un progetto che vuole la toolbar anche in produzione allarga la policy allo stesso modo,
  e lì la decisione su `frame-ancestors` va presa a parte.

## Tracciamento e Consent Mode v2

Spento se non configurato. `getTrackingConfig()` (`src/lib/analytics/tracking.ts`) restituisce `null`
se non ci sono **entrambi** `PUBLIC_GTM_ID` e `PUBLIC_IUBENDA_SITE_ID`: con `null` il layout non rende
nessun CMP, nessun tag e nessun cookie, che è come il template viene consegnato e come lo sviluppo
gira sempre.

**[HARD]** Prima che il visitatore acconsenta, a Google non arriva niente. L'ordine dentro
`src/components/head/tracking.astro` è normativo, non stilistico:

1. i default `is:inline` del Consent Mode — tutte e quattro le chiavi `denied`, più
   `wait_for_update: 500`, `ads_data_redaction` e `url_passthrough`. Deve essere la prima cosa che
   tocca `dataLayer`, altrimenti un tag può accodarsi prima dei default e girare senza restrizioni;
2. il blocco di configurazione inline, che pubblica gli id su `window`;
3. gli script a modulo, che registrano `bootstrapAnalytics()` sul gate e poi avviano il CMP. Il
   container GTM viene appeso **dentro** `onConsent('measurement')`, mai prima.

Conseguenze che vale la pena dichiarare apertamente:

- **[HARD]** Nessun iframe `<noscript>` di GTM. La seconda metà dello snippet standard carica il
  container senza condizioni, che è esattamente l'invariante qui sopra. Una checklist di un fornitore
  che lo chiede non basta a scavalcare questa regola.
- GA4 si configura **dentro il container GTM**, non nell'applicazione. Gli eventi nuovi sono push su
  `dataLayer` (`src/lib/analytics/data-layer.ts`) più configurazione lato GTM: aggiungere un tag non
  è una modifica al codice **finché quel tag non carica un host che la policy non permette** — la
  tabella è in fondo a questa sezione.
- La divisione ha un modo di fallire senza sintomi: l'applicazione manda un evento e il container non
  ascolta niente, quindi il tag non scatta mai e la build resta verde. `pnpm run analytics:verify`
  legge il `gtm.js` pubblico del container e segnala ogni evento che
  `src/lib/analytics/link-tracking.ts` manda senza un trigger dietro. Esce 0 con un avviso quando
  `PUBLIC_GTM_ID` non è impostato, quindi è sicuro in una pipeline prima che il container esista.
- Il Consent Mode è nella forma **base**, di proposito: quella avanzata manda ping senza cookie per
  la modellazione, e per produrre qualcosa vuole circa mille eventi al giorno su ciascun lato della
  divisione del consenso — traffico che un sito di queste dimensioni non ha.
- `mapPreferenceToConsentMode()` è a prova di errore per costruzione: tutto ciò che non è
  esplicitamente `true` diventa `denied`. Gli id di finalità `4` (misurazione) e `5` (marketing) sono
  la numerazione di iubenda: non rinumerarli.
- `consentOnContinuedBrowsing: false` **[HARD]**: lo scroll o la navigazione continuata non sono un
  consenso valido secondo le linee guida sui cookie del Garante del 2021.
  `floatingPreferencesButtonDisplay: false` è accettabile solo perché il consenso resta revocabile
  dal controllo `.iubenda-cs-preferences-link` nel footer. Se tieni il flag, tieni quel controllo.
- **I due link legali del banner puntano alle pagine del sito**, non ai documenti ospitati da
  iubenda: `buildCsConfiguration()` riceve `cookiePolicyUrl` e `privacyPolicyUrl` costruiti
  sull'origine corrente più il percorso che sta in `SITE.legal`, e `cookiePolicyInOtherWindow` li
  apre in una scheda nuova. Senza, la CMP apre la policy in un **iframe** verso `www.iubenda.com`:
  `frame-src` non lo permette, il pannello resta vuoto e a dirlo è solo la console (verificato il
  2026-09-16). iubenda chiede che la pagina collegata non usi cookie non tecnici — quella del
  template è statica e non ne usa.
- **Due cose le decide il pannello di iubenda, non questo codice.** Le finalità le porta la cookie
  policy: se dichiara solo cookie tecnici, `_iub.csPurposes` resta `[1]`, non c'è nessun consenso da
  chiedere e **non compare nessun banner**, per quanto il sito sia configurato bene. E su un piano
  senza «full customization» la CMP ignora parte della configurazione: con
  `csFeatures.full_customization` a `false` il bottone fluttuante delle preferenze resta acceso
  anche con `floatingPreferencesButtonDisplay: false`, e il testo del banner torna ai default. Su un
  piano che la comprende il flag funziona. Verificato il 2026-09-16.
- Si carica solo `iubenda_cs.js`: niente autoblocking, niente stub GPP. L'autoblocking aggiungerebbe
  una richiesta che blocca il parser e una seconda fonte di verità per un gate che l'applicazione già
  possiede.
- Accendere tutto questo **non richiede nessuna modifica alla CSP**: `src/lib/csp/directives.ts`
  porta già gli host di GTM e iubenda su ogni direttiva che toccano, ed entrambi gli avvii appendono
  il proprio script con `createElement('script').src` (`src/lib/analytics/bootstrap.ts`), che
  l'allowlist degli host copre — nessun hash è coinvolto. Un fornitore *oltre* questo insieme è una
  modifica a `directives.ts`, secondo le regole della § Content-Security-Policy qui sopra.

### Quali host chiede un tag aggiunto nel container

Il container è il punto in cui il cliente aggiunge tag **senza toccare il repository**, e ogni tag si
porta dietro le sue origini. Se non sono nella policy il tag non spara: nessun errore, nessuna
conversione, e niente che colleghi la cosa a un file che sta nel repo dello sviluppatore — di solito
passano settimane. **Quando il cliente chiede un tag nuovo, la CSP è la prima cosa da controllare.**

Le righe Google vengono dalla guida «Use Tag Manager with a Content Security Policy»
(`developers.google.com/tag-platform/security/guides/csp`, riletta il 2026-09-16); le ultime due sono
empiriche, da un progetto vivo.

| Tag aggiunto nel container | Host, e la direttiva che li vuole |
|---|---|
| GA4, funzioni pubblicitarie comprese | già in `directives.ts`: `*.google-analytics.com` e `*.analytics.google.com`, più `*.g.doubleclick.net` e `*.google.com` fra `img-src` e `connect-src` |
| Google Ads: conversioni, remarketing, conversion linker | `www.googleadservices.com`, `googleads.g.doubleclick.net` e `pagead2.googlesyndication.com` in `script-src`; gli stessi più `www.google.com` in `img-src` e `connect-src`; `ad.doubleclick.net` in `connect-src` |
| Floodlight | `ad.doubleclick.net`, `ade.googlesyndication.com` e `adservice.google.com` in `img-src`; `pagead2.googlesyndication.com`, `www.googleadservices.com`, `www.google.com` e `ad.doubleclick.net` in `connect-src`; con i beacon a script personalizzati, `<id>.fls.doubleclick.net` in `frame-src` |
| Modalità Anteprima del container | già nel ramo preview di `directives.ts`: `tagmanager.google.com`, `ssl.gstatic.com`, `www.gstatic.com`, `fonts.googleapis.com`, `fonts.gstatic.com` |
| CMP iubenda — non arriva dal container, ma vive nella stessa policy | già in `directives.ts`: `cdn.iubenda.com` serve il loader, il core e il pannello delle preferenze (`script-src`, `style-src`, `img-src`), `cs.iubenda.com` la configurazione del sito (`script-src`), e `*.iubenda.com` in `connect-src` copre la telemetria di `idb.iubenda.com` |
| Meta Pixel | `connect.facebook.net` in `script-src`; `www.facebook.com` in `img-src` e `connect-src` |
| Sortlist | `collector.sortlist.com` e `radar.sortlist.com`; quali direttive, lo dice la console al primo giro |

⚠️ **Il TLD nazionale si aggiunge a mano.** Google elenca `www.google.<TLD>` accanto a
`www.google.com`: è l'host che il browser del visitatore contatta nel suo paese, e in CSP il jolly
sul dominio di primo livello non esiste. Si aggiungono a uno a uno i TLD del pubblico del progetto
(`https://www.google.it` e simili).

La tabella copre i tag che si incontrano più spesso, non tutti. Per gli altri vale la procedura di
§ Content-Security-Policy: un preview, la console aperta sul percorso di accettazione e su quello di
rifiuto, e i rifiuti che compaiono solo lì.

## Ricostruire le pagine legali dopo una modifica alle policy

Le policy di privacy e cookie si scaricano da iubenda **in fase di build**
(`src/lib/legal/documents.ts`, pagine prerenderizzate). Una modifica fatta nel pannello iubenda è
quindi invisibile al sito vivo finché qualcuno non rideploya, e niente avverte nessuno che i due sono
andati alla deriva.

- Si pubblica la modifica su iubenda, poi si lancia un deploy di produzione (Actions → Deploy → *Run
  workflow*, senza bisogno di toccare il codice).
- **[HARD] Configurato significa obbligatorio.** Senza un id di policy le pagine dichiarano che il
  documento non è disponibile — è il default del template, e di proposito non è prosa legale
  segnaposto, che su una pagina viva si legge come una policy vera. Ma una volta che un id C'È, una
  build di produzione che non riesce a scaricare la policy **fallisce** invece di ricadere sul
  ripiego: quel ripiego porta un avviso visibile «bozza, non ancora rivista legalmente», e
  pubblicarlo al posto della policy vera di un cliente per un solo errore di rete passeggero non è
  una degradazione accettabile. Una build rossa per un iubenda instabile è l'esito economico: si
  rilancia il deploy. In sviluppo il ripiego resta, così una connessione ballerina non può fermare
  `astro dev`.
- **L'API dei documenti è una funzione a pagamento.** Sul piano gratuito
  `www.iubenda.com/api/privacy-policy/<id>/…/no-markup` risponde `403` con «To access this document
  via API please upgrade to a higher tier» (verificato il 2026-09-16), quindi con un id di policy
  impostato la regola qui sopra ferma ogni build di produzione, in locale come su un preview. Su un
  piano senza API l'id non si imposta e le pagine legali restano il ripiego.

## Salute e monitoraggio

`/api/health` (`src/pages/api/health.ts`) è l'endpoint di vitalità, l'URL da dare a un servizio di
monitoraggio. È **on-demand di proposito** (`prerender = false`): prerenderizzato, il suo `ts`
resterebbe fissato al momento della build e l'endpoint continuerebbe a rispondere 200 molto dopo che
il sito ha smesso di funzionare. `no-store` e `X-Robots-Tag: noindex` per la stessa ragione: un
controllo di vitalità in cache non è un controllo di vitalità.

Non c'è nessun monitoraggio degli errori e nessuna analitica oltre al container GTM dietro il
consenso. Sono omissioni volute in un template, non sviste: un progetto aggiunge quello che gli
serve.

## Dopo ogni release

`pnpm smoke:prod` gira da solo nel job `deploy` e lo fa fallire. Verifica le rotte servite, le
intestazioni di sicurezza, l'assenza di `X-Robots-Tag` sull'host di produzione, e che la sfida di
BotID passi davvero dal proxy.

**Le rotte non le elenca: le deriva.** `scripts/lib/routes.ts` legge `src/pages`, tiene le pagine
prerenderizzate e ci toglie le due eccezioni dichiarate — `/404` e `/500`, che rispondono con il
proprio stato e non 200. Alle pagine aggiunge le uscite che non nascono da un `.astro` e che nessuna
derivazione produrrebbe: `/robots.txt`, `/sitemap-index.xml`, `/site.webmanifest` e `/api/health`,
ognuna col content-type atteso. Una pagina nuova entra quindi da sola sia qui sia nell'audit
Lighthouse, e un'eccezione rimasta senza pagina fa fallire `scripts/lib/routes.test.ts`.

Interroga l'**apice**, non l'URL `*.vercel.app` che `vercel deploy` stampa. Per verificare altro si
passa un URL esplicito: `pnpm smoke:prod https://…`.

## Procedure

**Spedire una release** — si mergiano le PR di funzionalità (in squash, con titolo Conventional), poi
si merge la release PR che release-please tiene aperta. Il tag, la release GitHub e il deploy di
produzione seguono da soli; l'URL del deployment viene riportato nel log del job e registrato
sull'ambiente `production`. Si conferma con `pnpm smoke:prod` contro l'apice.

**Controllare una preview** — ogni branch pushato ne riceve una, tranne `main`, `release-please--*` e
`dependabot/**`, e non serve nessuna PR. Gli host di preview sono in noindex per la regola di
`vercel.json`; si conferma con `curl -sI https://<preview>.vercel.app/ | grep -i x-robots-tag`.

**Tornare indietro** — vedi sotto.

## Rollback

La produzione è viva e rotta:

1. pannello Vercel → Deployments → l'ultimo deployment **di produzione** noto come buono →
   *Promote to Production*. È la strada veloce e non cambia una riga di codice.
2. Si conferma con `pnpm smoke:prod` contro l'apice.
3. Poi si corregge in avanti su un branch. **Non** cancellare il tag guasto: release-please legge la
   storia dei tag, e toglierne uno desincronizza l'incremento di versione successivo. La correzione
   si spedisce come una nuova release patch.

La promozione riusa la vecchia build così com'è. Quando la correzione è *fuori* dal codice — una
variabile d'ambiente corretta, una policy ripubblicata — quella build va rifatta: Actions → Deploy →
*Run workflow*, indicando il tag da ricostruire. Stessi gate, quindi una ricostruzione non può
spedire qualcosa che la strada della release avrebbe preso.

## Variabili d'ambiente

- Ogni chiave è dichiarata in `astro.config.mjs` → `env.schema` con `context` e `access` espliciti, ed
  è documentata in `.env.example`. **[HARD]** `.env.example` porta i nomi delle chiavi e la loro
  ragione, mai valori reali; `.env` e `.env.local` sono gitignored e non devono mai finire in un
  rapporto, in un log o in un commit.
- `context: 'client'` (e per convenzione il prefisso `PUBLIC_`) significa che il valore viene
  **incorporato nel bundle**, quindi è pubblico per costruzione. Un segreto lì è una fuga di dati, a
  prescindere da come lo etichetta il provider di deploy.
- **Un `.env.local` con le `PUBLIC_*` del tracciamento fa fallire `pnpm run ci`.** I test dello stato
  spento leggono quelle chiavi dagli stub registrati in `vitest.config.ts` e si aspettano `null`: con
  una CMP configurata in locale diventano rossi quattro test fra `src/lib/analytics/tracking.test.ts`
  e `src/components/layout/footer.test.ts`. Si toglie il file prima di lanciare il gate.
- Il pattern ricorrente per tutto ciò che si appoggia a un fornitore: si dichiara `optional`, e poi
  quando manca **in sviluppo non fa niente ma lo dice, in produzione rifiuta esplicitamente**
  (`BREVO_API_KEY` è il riferimento). Il silenzio è il modo di fallire da evitare: un form che
  «riesce» perdendo il contatto è peggio di un errore.
- Su Vercel, le variabili che la build deve poter leggere si creano come **Plain**, non Sensitive: la
  build legge l'ambiente al momento del `vercel pull`, e lì un valore Sensitive non è disponibile
  (`BOTID_ENFORCE` è l'esempio vivo). Una variabile Sensitive non fallisce nemmeno rumorosamente:
  arriva come la stringa letterale `[SENSITIVE]`, ed è il motivo per cui gli id di iubenda si
  validano come numerici prima dell'uso (`src/lib/analytics/tracking.ts`,
  `src/lib/legal/documents.ts`) invece di essere infilati dentro l'URL di un'API. **`vercel env add`
  salva come Sensitive di default**, quindi si passa `--no-sensitive` e si conferma con un
  `vercel pull` prima di fidarsi, altrimenti la funzione deployata riceve `[SENSITIVE]` come chiave
  API.
- **[HARD] Quel guasto arriva in produzione e salta la preview.** Il job di release costruisce
  *fuori* da Vercel (`vercel pull` → `vercel build --prod`), quindi una `PUBLIC_*` Sensitive viene
  incorporata nel bundle come valore vuoto e la funzionalità che la legge smette di fare qualcosa in
  silenzio. Una preview la costruisce *Vercel*, che i valori veri ce li ha, quindi sembra tutto a
  posto: il difetto esiste solo dove nessuno sta guardando.
- **Un account senza accesso alla produzione riporta le variabili come assenti, non come vietate.** La
  CLI non elenca niente dove una variabile esiste eccome, quindi si controlla `vercel whoami` prima
  di concludere che ne manchi una.
- **Un URL del sito letto dall'ambiente prende `||`, non `??`.** Una stringa vuota è un valore, quindi
  `??` la lascia passare e Astro fa fallire la build con «Invalid URL»; `||` ricade sul valore
  letterale di ripiego.
- **Una cache di build pnpm parziale su Vercel si manifesta come instabilità inspiegabile**: una
  preview che fallisce con «Rollup failed to resolve tslib» e che un nuovo deploy sistema.
  `VERCEL_FORCE_NO_BUILD_CACHE` sul progetto è la cura brutale; una volta impostata, si lascia.
- I feature flag partono dal lato sicuro e si girano nel provider una volta verificati su un deploy
  vero: `BOTID_ENFORCE=false` arriva in sola osservazione perché un falso positivo costa un contatto
  in silenzio (il percorso di promozione sta in `forms-email.md` § Protezione dagli abusi).
- Secret del repo per la pipeline di release: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`,
  più `RELEASE_PLEASE_TOKEN` — ambiti e ragioni in il README del template, sezione «Secret di release». L'elenco
  completo lo stampa `scripts/bootstrap-github.sh` quando finisce.

## Flusso di release

- Conventional Commits, imposti da commitlint su un hook `commit-msg` di lefthook.
- Merge solo in squash, con il corpo del commit **vuoto**
  (`squash_merge_commit_message=BLANK`, impostato da `bootstrap-github.sh`). release-please legge
  anche le righe del corpo, quindi qualunque cosa vi resti rielenca la stessa modifica nel CHANGELOG.
- Conseguenza: un breaking change si marca con `!` nel **titolo della PR** (`feat(ui)!: …`). Un
  footer `BREAKING CHANGE:` non sopravvive mai allo squash.
- Stessa cosa per ogni altro footer di release-please: **una forzatura va in
  `release-please-config.json`, mai in un messaggio di commit**. Forzare una prima release sotto
  `1.0.0`, o fissare una versione successiva, è `release-as` in quel file — ed è appiccicoso, quindi
  richiede un commit successivo per toglierlo una volta uscita la release.
- Per la stessa ragione, `Closes #N` va nella descrizione della PR, non nel messaggio di commit.
- **[HARD] È `changelog-sections` a decidere quali tipi rilasciano.** Un tipo elencato lì *senza*
  `hidden: true` è rilasciabile: si guadagna una sezione nel changelog e taglia almeno una patch.
  `feat` alza la minor, e gli altri visibili — `fix`, `perf`, `revert`, `refactor` — alzano la patch.
  Quelli nascosti (`docs`, `style`, `chore`, `test`, `build`, `ci`) arrivano su `main` e si fermano
  lì.
- **Visibile e rilasciabile sono la stessa proprietà**, e release-please non offre nessun modo di
  avere l'una senza l'altra: un tipo si guadagna una sezione nel changelog *perché* taglia una
  release. `docs` è nascosto qui per questo motivo — una PR di sola documentazione taglierebbe
  altrimenti una patch e rideployerebbe la produzione con codice identico.
- La conseguenza morde anche nell'altra direzione. Una modifica che deve arrivare in produzione deve
  portare un tipo rilasciabile: mergiata come `chore` — o come `docs` — si ferma su `main` senza
  nessun sintomo, con la CI verde e la PR mergiata mentre la produzione serve ancora la build
  vecchia. È il motivo per cui le modifiche ai contenuti sono `fix(content)`. Dependabot sta di
  proposito dall'altra parte della linea: i suoi aggiornamenti sono `chore(deps)`, quindi una
  dipendenza aggiornata viaggia col primo commit rilasciabile — e una patch di sicurezza che deve
  uscire subito ne ha bisogno di uno, oppure di un lancio manuale di `deploy.yml` su un tag.

## Checklist per il go-live

1. `SITE.url` è il dominio vero (alimenta ogni canonical, OG e hreflang, e `pnpm smoke:prod` si
   rifiuta di girare finché è il segnaposto), e `pnpm run check:placeholders` esce 0: il job di
   deploy si ferma su ogni segnaposto rimasto in `site.ts`, `company.ts` e nei dizionari.
2. Dominio aggiunto in Vercel, DNS puntato, HTTPS emesso. Si decide l'host canonico (apice o `www`) e
   si dichiara il redirect in `vercel.json`.
3. Ignored Build Step vuoto nella dashboard: il comando lo dichiara `ignoreCommand` in `vercel.json`,
   e un progetto più vecchio che lo porta anche lì ha due fonti per la stessa regola.
4. `bash scripts/bootstrap-github.sh` lanciato sul repo (è idempotente).
5. Secret del repo impostati; la prima PR di release-please mergiata.
6. DKIM, SPF e DMARC del dominio mittente verificati in Brevo, `CONTACT_*` e `BREVO_API_KEY`
   impostati nel progetto Vercel. Senza le tre `CONTACT_*` il job di deploy si ferma dopo
   `vercel pull`.
7. Un invio vero del form di contatto da un browser visto arrivare; poi si valuta
   `BOTID_ENFORCE=true`.
8. `pnpm smoke:prod` verde contro l'apice.
9. **DPA firmato con ogni responsabile che tocca dati personali**: hosting (Vercel), fornitore di
   email e CRM (Brevo), CMP (iubenda), più tutto ciò che il progetto ha aggiunto. A firmare è il
   referente legale del cliente, non tu.
10. **Ogni credenziale usata durante lo sviluppo ruotata.** Tutto ciò che è passato da un `.env`, da
    una nota condivisa o da un ambiente di preview è bruciato: si emettono valori nuovi, si mettono
    in produzione, si revocano i vecchi. Lo stesso per i secret del repo.
11. **Flussi di consenso verificati su una preview**, sia accettando sia rifiutando, con GA4 Realtime
    aperto: nessuna richiesta a Google prima del consenso, eventi che scorrono dopo. È anche l'unico
    posto in cui una voce mancante nella CSP si manifesta.
12. **Intestazioni di sicurezza verificate su una preview**: nessuna violazione CSP su nessun tipo di
    pagina, HSTS presente, `X-Robots-Tag` su `*.vercel.app` e assente sull'host di produzione.
13. **Chi mantiene la policy iubenda conosce la procedura di ricostruzione** qui sopra: una modifica
    lì è invisibile finché non si rideploya, e niente lo segnala.

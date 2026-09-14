Template Astro riutilizzabile (uso personale e freelance). Il metodo di lavoro — commenti, commit e PR, lingua, pianificazione, agenti verticali, orchestrazione — sta nel plugin `metodo` e in `metodo.md` del repository `metodo-astro`, che il sistema di lavoro importa nel `CLAUDE.md` di ogni progetto: le sue regole `[HARD]` valgono anche qui. Questo file porta solo lo stack e le convenzioni del codice.

## Stack e convenzioni

- **Gestore di pacchetti**: solo pnpm via corepack — la versione è fissata in `packageManager` (`package.json`). Niente npm o yarn, niente installazioni globali. A fermare `yarn` è lo shim di corepack; **niente ferma `npm install`** — corepack non fa shim di npm, e npm ignora `package-manager-strict` in `.npmrc` («Unknown project config»). Il divieto di npm è una convenzione da rispettare, non un guardrail che scatta.
- **Node**: versione fissata in `.nvmrc` — si rispetta, non si assume un'altra.
- **Formatter e linter**: solo Biome (`biome.json`), niente ESLint o Prettier. Stile: 2 spazi, apici singoli, niente punto e virgola, virgola finale.
- **TypeScript**: `astro/tsconfigs/strictest`. Se `noUncheckedIndexedAccess` o `exactOptionalPropertyTypes` segnalano un errore, si corregge il codice — non si allenta la configurazione per farlo sparire.
- **Rendering**: `output: "static"`, quindi le pagine sono prerenderizzate. Una pagina che ha bisogno di dati per richiesta si sfila con `export const prerender = false` esplicito nel frontmatter. Il server viene dall'adapter, non da questa impostazione: azioni e rotte on-demand funzionano in entrambi i casi.
- **Deploy**: Vercel, tramite `@astrojs/vercel`.
- **Leggere l'albero**: `docs/ARCHITECTURE.md` § Struttura del repository, che etichetta ogni percorso come `machinery` / `config` / `chrome` / `seed` / `example`. La machinery si tocca per correggere un difetto, non per riordinare; il pattern `example` si estende invece di inventarne un secondo; un percorso `seed` non si cancella, perché i generatori ci scrivono dentro.

## Sviluppo

Server di sviluppo: `astro dev --background`, gestito con `astro dev stop` / `astro dev status` / `astro dev logs`.

## Documentazione

Documentazione Astro: https://docs.astro.build — si consulta prima di toccare routing e middleware, componenti, isole di framework, content collection, stili Tailwind o i18n.

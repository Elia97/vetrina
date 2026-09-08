# O'Guns Equipment — nuovo e-commerce (`oguns`)

Nuovo e-commerce **full-custom** B2C + B2B per **O'Guns Equipment** (marchio Cafiero S.r.l., Limana
BL), in sostituzione dell'attuale sito **nopCommerce**. Un solo sito, tre lingue (IT/EN/DE), due
valute (EUR/USD), due listini, mercati Europa e Stati Uniti.

Cliente finale O'Guns, committente contrattuale **Smoothie Communicate S.r.l.**. `oguns` è il
codename interno.

> ⚠️ **L'incarico non è ancora conferito** (Art. 3 dell'Accordo Quadro: serve approvazione scritta
> della stima). Per questo il repo contiene il piano di lavoro ma non ancora codice di progetto.

**Questo repo traccia solo il lavoro di sviluppo.** Analisi funzionale, design UI/UX, copy e
traduzioni sono di Smoothie: non sono qui dentro, non sono nostre giornate e non si tracciano qui.

## Documenti

| Documento | Contenuto |
| --- | --- |
| [`docs/PROJECT.md`](docs/PROJECT.md) | Lettura del brief del cliente (§1–14) + le nostre annotazioni (§15), tenute separate |
| [`docs/ROADMAP.md`](docs/ROADMAP.md) | Milestone, sotto-task, stime, dipendenze, rischi tecnici. **Incrociato con le GitHub Milestone/Issue** |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Decisioni aperte, raggruppate per milestone che bloccano. Solo ciò che cambia il codice |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack e struttura — dal template, **da compilare in Milestone 2** |
| [`docs/guides/`](docs/guides/) | Guide stabili e riusabili (SEO, form/email, rendering, UI, content) |
| [`docs/sources/Brief_OGuns_Ecommerce.docx`](docs/sources/Brief_OGuns_Ecommerce.docx) | **Fonte primaria**: brief consolidato del cliente, 14 paragrafi |

I PDF si generano con `tools/md2pdf.sh` e non sono versionati: la fonte è il `.md`.

## Il perimetro

> ⚠️ **Le giornate non sono una scadenza.** Sono unità di valorizzazione del lavoro, da distribuire
> nel tempo insieme all'agenzia. Quando si lavora, con che continuità e in che ordine si consegna è
> una pianificazione separata — e dipende anche da quando arrivano design, testi e risposte.

- **Fase 1 — go-live B2C:** Milestone 1–9, **11 giornate**
- **Fase 2 — canale B2B:** Milestone 10–12, **4,5 giornate**
- **Totale: 15,5 giornate**, nello scenario B. Due regole: **1 gg per milestone di sistema**, **0,5 gg
  per pagina** di front-end. È lo sforzo minimo

Il totale è uno dei tre scenari possibili, e **le due variabili non sono indipendenti**: scrivere il
motore da zero implica costruire anche il pannello di amministrazione.

| Scenario | gg |
| :-- | :-: |
| **B ①** — core open source **+ il suo pannello** | **15,5** |
| **B ②** — core open source **+ back-office su misura** | **17,5** |
| **A** — motore da zero *(back-office incluso perché obbligatorio)* | **21,5** |

## Come si lavora

Modello del template: **una milestone = una GitHub Milestone = N issue = N PR** (una issue = una PR
= un commit squash).

```
docs/ROADMAP.md  ──/milestone <N>──>  GitHub Milestone + una issue per sotto-task
                                          │
                                          └──/pr <issue>──>  branch → agenti verticali →
                                                             gate qualità → PR "Closes #N"
```

- Le sezioni `## Milestone N` di `docs/ROADMAP.md` sono **bespoke**: scritte a mano dal brief, non
  istanziate da un blueprint di `docs/milestone-templates/`.
- Ogni sotto-task ha una intestazione `### N.x <slug>` seguita dal **titolo Conventional in
  grassetto**: `/pr` ne ricava type e scope, e il type guida il bump di release-please.
- Nessuna riga `**Agent:**`: l'agente verticale lo deduce `/milestone`/`/pr` dai percorsi toccati.
- Convenzioni complete in [`CLAUDE.md`](CLAUDE.md).

Label: `compliance` per pagamenti, IVA, GDPR e consent. Le stime stanno a livello di milestone, non
di sotto-task. Il raggruppamento per milestone è l'oggetto GitHub Milestone, **mai una label**.

## Stack

Dal template [`Elia97/astro-template`](https://github.com/Elia97/astro-template), che porta già la
direzione tecnica richiesta dal §9 del brief (smooth scroll e hover come su ATC):

- **Astro** SSR (`output: "server"`, prerender selettivo) + **React** per le isole interattive
- **Tailwind v4**, **GSAP** e **Lenis** per il motion
- **Biome** come unico formatter/linter, TypeScript `strictest`, **vitest**
- **pnpm** via corepack, Node pinnato in `.nvmrc`
- Deploy **Vercel**; produzione solo da tag di release, non da ogni push
- Commit **Conventional**, validati da commitlint su hook lefthook

⚠️ I placeholder del template (`<PROJECT_NAME>`, `<DESCRIPTION>`, dominio) sono **ancora da
sostituire**: è il sotto-task 2.1. Dependabot è in pausa fino ad allora.

## Quick start

```sh
corepack enable
pnpm install
pnpm dev
```

| Comando | Cosa fa |
| --- | --- |
| `pnpm dev` | Dev server |
| `pnpm build` | Build di produzione |
| `pnpm check` | Format + lint + organize imports (scrive) |
| `pnpm typecheck` | `astro check` |
| `pnpm ci` | Controllo non mutante usato in CI: `biome ci` + typecheck + test |

Niente `npm` né `yarn`: `.npmrc` ha `package-manager-strict=true`.

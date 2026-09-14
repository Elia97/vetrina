# Roadmap

> Elenco del codice da scrivere. Modello: **una milestone = una GitHub Milestone = N issue = N PR**
> (una issue = una PR = un commit squash). Ogni sezione `## Milestone N` è **bespoke**; le issue si
> implementano con `/metodo:pr <issue-number>`, mai inline da questo file.
>
> Due modi per aggiungere una milestone. Il **percorso bespoke**: si scrive una sezione
> `## Milestone N` qui sotto, poi `/metodo:milestone <N>` la semina — è la strada per tutto ciò che è
> pianificato in anticipo. Il **percorso rapido**: `/metodo:milestone <nome-template>` istanzia un
> blueprint del plugin `metodo` e lo **accoda** come milestone successiva, per i
> blueprint a cui si arriva a metà progetto e mai contro una sezione già scritta qui, dove creerebbe
> un doppione un numero più avanti.
>
> **Due regole di stima:** una milestone di **sistema** vale **una giornata**; il **front-end** si
> conta **mezza giornata per pagina**. In entrambi i casi è lo **sforzo minimo** — le giornate
> effettivamente maturate si consolidano a fine periodo. Si stima per milestone, mai per sotto-task:
> sommare le stime dei sotto-task compra precisione apparente e costa accuratezza vera.
> La stima, che è un'offerta nel sistema e non un file di questo repo, è derivata dalla colonna
> `gg` qui sotto e non si scrive mai prima.

## Status

| # | Milestone | Fase | gg | Status |
|---|---|:-:|:-:|---|
| 1 | Difetti verificati e fondamenta mancanti | 1 | 12 | 🟡 seeded |
| | **TOTALE** | | **12** | |

<!-- Legenda: 🔲 planned (non ancora seminata) · 🟡 seeded (issue aperte su GitHub) · 🟢 done (Milestone GitHub chiusa) -->

Lavoro interno sul template, non preventivato a un cliente: la stima serve a
ordinare, non a fatturare.

## Dipendenze

Non c'è una seconda milestone: le dipendenze che contano sono fra le issue.

```text
#26 (company.ts nella lista del rebranding)  →  #25 (il messaggio del guard rimanda a quella lista)
#25 (guard dei segnaposto)                   →  #44 (nessun segnaposto nel JSON-LD)
#27 (identità legale)                        →  #29 (contatti e noscript sulla stessa pagina)
                                             →  #40 (il giro della CMP finisce sul controllo del footer)
                                             →  #44 (vatID, sameAs e logo leggono gli stessi dati)
#29 (contratto del form)                     →  #56 (lo scenario del form si scrive su quel contratto)
#30 (pipeline immagini)                      →  #45 (gen:icons importa sharp dalla radice)
#52 (DEFAULT_LOCALE)                         →  #33 (stessi file: configurazione, stub, test di deriva)
                                             →  #55 (i sei v8 ignore sui ripieghi 'it')
#33 (seconda lingua)                         →  #32 (il selettore non si verifica con una lingua sola)
                                             →  #55 (i tre v8 ignore di route-segments.ts)
#54 (fonte delle rotte)                      ⇢  #56 (solo se lo scenario della home copre ogni rotta)
#39 (host della toolbar sui preview)         ⇢  #41 (l'Anteprima di GTM può usare lo stesso ramo)
```

Da non aprire insieme, perché toccano gli stessi file: #28 e #47 (la head), #30 e #31
(l'iniettore di `gen:section`), #31 e #35 (`src/lib/content/`), #32 e #48 (header e nav
mobile), #34 e #57 (`cta-banner.astro`), #36 e #37 (`reportContactResults()`), #46 e #52
(`astro.config.mjs`), #25 e #42 (`deploy.yml`); #39, #40 e #41 (`directives.ts`); #27, #29
e #50 (`contatti.astro`); #34, #48 e #52 (`src/i18n/`).

Verifiche su un preview: #40 con la CMP attiva, dopo #27; #38 dopo aver tolto l'Ignored
Build Step dalla dashboard del progetto Vercel; #39 con la toolbar attiva.

### Rilettura del 2026-09-14

Contro `main` dopo la #62, voce per voce nei blocchi `## Aggiornamento 2026-09-14` e
`## Decisioni 2026-09-14` in coda alle issue:

- **fatte a metà**: #43 (resta il testo che descrive il gate) e #53 (restano un test della
  conversione e il messaggio di fallimento);
- **decise il 2026-09-14** con `/metodo:decisions`, e rientrate nell'ordine: #33 (la seconda
  lingua solo nei test), #32 (le lingue di una pagina le dichiara la pagina), #35
  (Breadcrumb e caricatore qui, la ricetta nel plugin), #39 (la toolbar sui soli preview),
  #42 (resta `pnpm dlx`, con un controllo sulla major), #46 (`lastmod` sulle pagine del
  template), #51 (solo l'apertura del README), #57 (`banner.astro` fuso in
  `cta-banner.astro`, primitive non usate segnate), #58 (il costo nella guida, senza
  commento);
- le voci sul blueprint `foundations`, sulla ricetta di `content-section` e sulle skill del
  plugin `metodo` stanno in Elia97/metodo-astro#1.

**Deroga al metodo**, decisa il 2026-09-14: la milestone si consegna con una PR per onda
invece che con una PR per issue. Dentro la PR c'è un commit per issue; il merge resta
squash, quindi su `main` arriva un commit per onda, con il titolo della PR come messaggio e
il tipo rilasciabile più alto dell'onda. Ogni PR chiude le issue della sua onda, con un
`Closes #N` ciascuna.

L'ordine, un'onda dopo l'altra e dentro l'onda nell'ordine scritto:

1. **Chiusure e piccole**: #43, #53, #26, #24, #49, #59, #58, #48, #28, #47, #51
2. **Identità legale e form**: #27, #29, #25, #44, #36, #37
3. **i18n e primitive**: #52, #33, #32, #34, #57, #50
4. **Contenuti**: #30, #45, #31, #35, #46
5. **Ops e CSP**: #38, #42, #39, #41, #40
6. **Test e copertura**: #54, #55, #56

## Milestone 1 — Difetti verificati e fondamenta mancanti

**Fonte:** bespoke — analisi tecnica del 2026-09-03, corretta e ampliata dal
confronto con i sei progetti che discendono dal template
**GitHub Milestone:** #1 (https://github.com/Elia97/vetrina/milestone/1)
**Fase 1** · **12 gg**

Alla fine di questa milestone il template non spedisce più segnaposto in
produzione, rende l'identità legale che il mercato italiano richiede, ha un
percorso per le immagini e per la seconda lingua invece di due pagine di guida,
e ha un punto d'ingresso che dice subito cos'è il template e come si avvia.

Tre raccomandazioni dell'analisi sono state **scartate** perché il confronto con i
fork le smentisce: rimuovere `heroOverlay`/`overlayChrome` (usati su ogni pagina di
due progetti), rimuovere l'«inventario non usato» (i fork usano quasi tutto, e anche
`banner.astro` ha un consumatore, `cta-banner.astro` — vedi #57), separare i tre
prodotti (tutti e sei i fork li hanno tenuti interi; la #62 ha poi portato agenti,
comandi e documenti di metodo nel plugin `metodo`, e quello che resta è il punto
d'ingresso, #51).

### Difetti verificati sul codice

| Sub-task | Issue |
|---|---|
| Smettere di chiedere un allargamento della CSP che il codice non richiede più | #24 |
| Far fallire il build sui segnaposto che raggiungono la produzione | #25 |
| `company.ts` nella checklist del rebrand | #26 |
| Rendere l'identità legale che ogni sito italiano deve | #27 |
| Dare un template al tag `<title>` | #28 |
| Impedire al submit senza JS di mettere PII nell'URL | #29 |
| Redigere il messaggio dal log `lead-recovery` | #36 |
| Portare l'ultimo copy hardcoded nel dizionario | #37 |

### Fondamenta che ogni fork ricostruisce a mano

| Sub-task | Issue |
|---|---|
| La pipeline immagini che serve alla prima sezione | #30 |
| Una seconda pagina a sezioni senza clonare la homepage | #31 |
| Il selettore di lingua che ogni secondo locale richiede | #32 |
| La seconda lingua esercitata nei test, non nel build | #33 |
| Localizzare i link che saltano `localizedHref` | #34 |
| Breadcrumb e caricatore di entry localizzate per lista → dettaglio | #35 |

### Ops, CSP, deploy

| Sub-task | Issue |
|---|---|
| Impostare l'Ignored Build Step da `vercel.json` | #38 |
| Far passare la toolbar dei preview nella CSP, solo sui preview | #39 |
| Allineare l'allowlist iubenda a ciò che una CMP viva carica | #40 |
| Gli host CSP che un container GTM tira quando il cliente aggiunge tag | #41 |
| Tracciare il pin della CLI Vercel che Dependabot non vede | #42 |
| Far girare `check:comments` come gate | #43 |

### SEO

| Sub-task | Issue |
|---|---|
| I dati strutturati che servono a un'attività locale | #44 |
| Icone PWA generate dal favicon | #45 |
| `lastmod` nel sitemap dalla storia git | #46 |
| `og:image` width, height e alt | #47 |

### Coerenza interna e attrito di primo utilizzo

| Sub-task | Issue |
|---|---|
| Marcare la pagina corrente in entrambe le navigazioni | #48 |
| `Alert` smette di annunciare contenuto statico | #49 |
| Le pagine del template usano il primitivo `Heading` | #50 |
| L'apertura del README: specifico per Vercel e come si avvia | #51 |
| Un solo `DEFAULT_LOCALE` invece di otto letterali | #52 |
| Drift test fra `themeColor` e `--background` | #53 |
| Derivare gli elenchi di rotte da una fonte sola | #54 |
| Soglie di copertura per zona | #55 |
| Smoke Playwright sul sito costruito | #56 |
| Fondere `banner.astro` in `cta-banner.astro` e segnare le primitive non usate | #57 |
| Il costo di `ClientRouter` nella guida di rendering | #58 |
| Togliere i commenti dagli script `is:inline` | #59 |

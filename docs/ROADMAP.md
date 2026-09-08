# Roadmap

> Elenco del codice da scrivere. Modello: **una milestone = una GitHub Milestone = N issue = N PR**
> (una issue = una PR = un commit squash). Ogni sezione `## Milestone N` è **bespoke**; le issue si
> implementano con `/pr <issue-number>`, mai inline da questo file.
>
> Due modi per aggiungere una milestone. Il **percorso bespoke**: si scrive una sezione
> `## Milestone N` qui sotto, poi `/milestone <N>` la semina — è la strada per tutto ciò che è
> pianificato in anticipo. Il **percorso rapido**: `/milestone <nome-template>` istanzia un
> blueprint di `docs/milestone-templates/*.md` e lo **accoda** come milestone successiva, per i
> blueprint a cui si arriva a metà progetto e mai contro una sezione già scritta qui, dove creerebbe
> un doppione un numero più avanti.
>
> **Due regole di stima:** una milestone di **sistema** vale **una giornata**; il **front-end** si
> conta **mezza giornata per pagina**. In entrambi i casi è lo **sforzo minimo** — le giornate
> effettivamente maturate si consolidano a fine periodo. Si stima per milestone, mai per sotto-task:
> sommare le stime dei sotto-task compra precisione apparente e costa accuratezza vera.
> `docs/ESTIMATE.md` (non tracciato) è derivato dalla colonna `gg` qui sotto e non si scrive mai
> prima.

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
#27 (identità legale)  →  #29 (noscript del form usa COMPANY)
                       →  #44 (vatID/sameAs/logo leggono gli stessi dati)
#30 (pipeline immagini) →  #45 (gen:icons ha bisogno di sharp)
#33 (fixture en)        →  #32 (il selettore di lingua senza secondo locale non è verificabile)
                        →  #37 (la seconda lingua fa emergere il copy hardcoded)
#25 (guard placeholder) ←  #26 (company.ts nella checklist: stessa causa, due rimedi)
```

`#39` e `#40` sono le uniche due il cui perimetro non è ancora certo: vanno
verificate su un preview con la CMP attiva **prima** di scrivere codice.

## Milestone 1 — Difetti verificati e fondamenta mancanti

**Fonte:** bespoke — analisi tecnica del 2026-09-03, corretta e ampliata dal
confronto con i sei progetti che discendono dal template
**GitHub Milestone:** #1 (https://github.com/Elia97/astro-template/milestone/1)
**Fase 1** · **12 gg**

Alla fine di questa milestone il template non spedisce più segnaposto in
produzione, rende l'identità legale che il mercato italiano richiede, ha un
percorso per le immagini e per la seconda lingua invece di due pagine di guida,
e ha un punto d'ingresso che non è un documento di processo da 14 KB.

Tre raccomandazioni dell'analisi sono state **scartate** perché il confronto con i
fork le smentisce: rimuovere `heroOverlay`/`overlayChrome` (usati su ogni pagina di
due progetti), rimuovere l'«inventario non usato» (solo `banner.astro` è davvero
inutilizzato — vedi #57), separare i tre prodotti (tutti e sei i fork li hanno
tenuti interi; quello che resta è il quickstart, #51).

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
| Una fixture `en` che eserciti il secondo locale | #33 |
| Localizzare i link che saltano `localizedHref` | #34 |
| Lista → dettaglio, la rotta che sei progetti su sette hanno scritto | #35 |

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
| Un quickstart in cima al README | #51 |
| Un solo `DEFAULT_LOCALE` invece di otto letterali | #52 |
| Drift test fra `themeColor` e `--background` | #53 |
| Derivare gli elenchi di rotte da una fonte sola | #54 |
| Soglie di copertura per zona | #55 |
| Smoke Playwright sul sito costruito | #56 |
| Cancellare `banner.astro` ed etichettare i primitivi dimostrati | #57 |
| Dire quanto costa `ClientRouter` dove viene importato | #58 |
| Togliere i commenti dagli script `is:inline` | #59 |

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
| 2 | I punti di aggancio per ecommerce | 1 | 3,5 | 🟡 seeded |
| | **TOTALE** | | **3,5** | |

<!-- Legenda: 🔲 planned (non ancora seminata) · 🟡 seeded (issue aperte su GitHub) · 🟢 done (Milestone GitHub chiusa) -->

Lavoro interno sul template, non preventivato a un cliente: la stima serve a ordinare, non a
fatturare. La numerazione segue quella delle Milestone GitHub del repository, dove la 1 è chiusa.

## Dipendenze

Le milestone che aspettano questa stanno nella roadmap di `Elia97/ecommerce`:

```text
2 (I punti di aggancio per ecommerce)
 ├→ ecommerce, «Dati e utenti»: l'accesso chiede la CSP a richiesta (2.3), il layout delle email (2.4)
 │  e i dizionari di dominio (2.8)
 └→ ecommerce, «Catalogo, ordini e back-office»: il pannello chiede ui/select (2.5) e il registro
    delle azioni (2.7)
```

Dentro la milestone, la 2.7 viene dopo la 2.4, perché toccano entrambe
`docs/guides/forms-email.md`, e la 2.10 e la 2.11 vengono per ultime. Le altre sono indipendenti.

## Milestone 2 — I punti di aggancio per ecommerce

**Fonte:** bespoke
**GitHub Milestone:** #2 (https://github.com/Elia97/vetrina/milestone/2)
**Fase 1** · **3,5 gg**

Un template derivato come `ecommerce` estende vetrina senza toccarne la base fuori dai punti di
aggancio: azioni, dizionari, email, guscio del documento, CSP delle pagine a richiesta e liste di
configurazione hanno un posto in cui si aggiunge in coda, e `docs/ARCHITECTURE.md` li elenca.

| Sotto-task | Issue |
|---|---|
| fix(content): i segnaposto # del template e check links di officina 0.11.0 | #97 |
| docs: il metodo sta in Elia97/metodo, non in metodo-astro | #99 |
| feat(ops): la CSP anche sulle pagine HTML rese a richiesta | #100 |
| refactor(forms): il layout delle email in un modulo condiviso | #101 |
| feat(ui): ui/select con un valore iniziale e sulle righe aggiunte dopo il caricamento | #102 |
| refactor(layout): il guscio del documento separato dall'arredo del sito | #103 |
| refactor(actions): src/actions/index.ts diventa il solo registro delle azioni | #104 |
| refactor(i18n): dizionari di dominio accanto a quello del sito | #105 |
| refactor(config): le liste che un template derivato allunga, una voce per riga | #106 |
| docs(architecture): i punti di aggancio dei template derivati | #107 |
| docs(roadmap): riporta docs/ROADMAP.md all'impalcatura vuota | #108 |

### 2.1 fix(content): i segnaposto # del template e check links di officina 0.11.0

✅ già fatto in #98

vetrina adotta `check:links` di officina 0.11.0, e il template non porta più link segnaposto `#`.

### 2.2 docs: il metodo sta in Elia97/metodo, non in metodo-astro

`CLAUDE.md` e il README rimandano ancora a `metodo-astro`, che non è il repository del metodo: il
plugin e `metodo.md` stanno in `Elia97/metodo`.

Checklist:
- [ ] `CLAUDE.md` e `README.md`, nell'apertura e in § Strumenti di Claude Code, rimandano a
  `Elia97/metodo`
- [ ] `git grep metodo-astro` non trova niente

### 2.3 feat(ops): la CSP anche sulle pagine HTML rese a richiesta

`cspIntegration()` inietta la policy solo nell'HTML prerenderizzato, e una pagina resa a richiesta,
come l'accesso di ecommerce, esce senza (`docs/guides/deploy-ops.md` § Content-Security-Policy). Il
middleware la aggiunge alle risposte HTML non prerenderizzate, con `collectInlineScriptHashes`,
`buildCspContent` e `injectCspMeta` di `src/lib/csp/`.

Checklist:
- [ ] `src/middleware.ts`: con `!context.isPrerendered` e una risposta `text/html`, il `<meta>` della
  policy subito dopo `<meta charset>`
- [ ] la policy di una pagina a richiesta regge la navigazione con `ClientRouter`, che tiene quella
  della prima pagina caricata
- [ ] la frase [HARD] del middleware, che oggi lo limita alle intestazioni, dice quello che fa
- [ ] test: una pagina a richiesta riceve la policy, una prerenderizzata e una risposta non HTML
  restano intatte
- [ ] `docs/guides/deploy-ops.md` § Content-Security-Policy descrive i due casi

### 2.4 refactor(forms): il layout delle email in un modulo condiviso

`escapeHtml`, `layout` e `detailRow` sono private di `src/emails/contact.ts`, e ogni email nuova le
ricopierebbe: la conferma di un ordine, il reset della password. Passano in `layout.ts`, un modulo
nuovo di `src/lib/emails/`, nella zona `leaf` dei confini di `.fallowrc.jsonc`, così le importa
anche un modulo di `src/lib/`; la lingua resta quella di `email.lang`.

Checklist:
- [ ] `layout.ts` in `src/lib/emails/` esporta `escapeHtml`, `layout` e `detailRow`, con i loro test
- [ ] `src/emails/contact.ts` li importa, e le due email escono identiche
- [ ] la riga del dominio dei form in `docs/ARCHITECTURE.md` § I domini copre `src/lib/emails/**`
- [ ] `docs/guides/forms-email.md` § Rendering delle email dice dove sta il layout

### 2.5 feat(ui): ui/select con un valore iniziale e sulle righe aggiunte dopo il caricamento

`ui/select` non accetta un valore iniziale, e `setupSelects` attiva solo le radici
`[data-select-root]` presenti quando la pagina si carica: una riga aggiunta dopo, come nella griglia
delle varianti del pannello di ecommerce, resta inerte.

Checklist:
- [ ] una prop `value` seleziona l'opzione iniziale, nel `<select>` nativo e nell'etichetta del
  trigger
- [ ] `select-behavior.ts` esporta l'attivazione di una singola radice, e `setupSelects` la usa
- [ ] test per il valore iniziale e per una radice aggiunta dopo il caricamento
- [ ] `docs/guides/ui-components.md` dice come si attiva una riga aggiunta

### 2.6 refactor(layout): il guscio del documento separato dall'arredo del sito

`src/layouts/main.astro` tiene insieme il documento — `<html>`, head, tema, `ClientRouter`, focus
dopo la navigazione — e l'arredo del sito: header, footer e tracciamento. Il documento passa in
`document.astro`, un layout nuovo di `src/layouts/`, e `main.astro` lo compone e resta dov'è, perché
officina lo pretende come layout delle pagine generate. Servirà al layout del pannello di ecommerce.

Checklist:
- [ ] `document.astro` in `src/layouts/` con il guscio e uno slot per il corpo
- [ ] `main.astro` compone `document.astro` con header, footer e tracciamento, e la build delle
  pagine resta identica
- [ ] `docs/ARCHITECTURE.md` § Struttura del repository etichetta il file nuovo

### 2.7 refactor(actions): src/actions/index.ts diventa il solo registro delle azioni

dipende da: 2.4

L'azione `contact` vive per intero in `src/actions/index.ts`, e un template derivato dovrebbe
modificarlo per registrarne altre. Passa in `contact.ts`, un modulo nuovo di `src/actions/`, e
`index.ts` resta il registro: `export const server = { contact }`.

Checklist:
- [ ] `contact.ts` in `src/actions/` con l'azione e i suoi passi; `index.ts` porta solo il registro
- [ ] i test seguono il modulo
- [ ] `docs/guides/forms-email.md` § Un form nuovo dietro un'azione dice dove si registra un'azione

### 2.8 refactor(i18n): dizionari di dominio accanto a quello del sito

`useTranslations` legge un dizionario per lingua, `src/i18n/strings/<lingua>.ts`, e un template
derivato dovrebbe allungarlo con i testi del suo dominio: il pannello, l'accesso. I dizionari di
dominio stanno in `src/i18n/<dominio>/<lingua>.ts`, e `translate.ts` costruisce il traduttore anche
su di loro. Non in `strings/`, che officina legge come i dizionari delle lingue.

Checklist:
- [ ] `translate.ts` costruisce un traduttore su più dizionari, con le chiavi tipizzate
- [ ] un dominio dichiara un dizionario per ogni lingua registrata, e il compilatore lo pretende
- [ ] test con un dominio finto
- [ ] `docs/guides/content-collections.md` dice dove sta un dizionario di dominio

### 2.9 refactor(config): le liste che un template derivato allunga, una voce per riga

`features` in `officina.config.ts` e `coverage.include` in `vitest.config.ts` stanno su una riga, ed
ecommerce ci aggiunge voci: a ogni allineamento quella riga confliggerebbe. Con una voce per riga,
un'aggiunta in coda non tocca le righe di vetrina. Biome tiene su più righe un oggetto che comincia a
capo, ma riporta su una riga un array che ci sta.

Checklist:
- [ ] `features` in `officina.config.ts`, una voce per riga
- [ ] `coverage.include` in `vitest.config.ts`, una voce per riga, in una forma che Biome non riporta
  su una riga
- [ ] `pnpm run ci` verde

### 2.10 docs(architecture): i punti di aggancio dei template derivati

dipende da: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9

Una sezione di `docs/ARCHITECTURE.md` elenca dove un template derivato estende vetrina senza
toccarne la base, e dice che si aggiunge in coda ai blocchi. Una riga in `CLAUDE.md` rimanda lì.

Checklist:
- [ ] la sezione nomina ogni punto di aggancio con il suo file: azioni, dizionari di dominio, layout
  delle email, guscio del documento, CSP a richiesta, liste di configurazione
- [ ] `CLAUDE.md` rimanda alla sezione
- [ ] la tabella di § I domini copre i percorsi che oggi non nomina: `src/layouts/**`,
  `src/i18n/**`, `src/lib/csp/**` e `src/middleware.ts`

### 2.11 docs(roadmap): riporta docs/ROADMAP.md all'impalcatura vuota

dipende da: 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9, 2.10

Come la #93: chiusa la milestone, la roadmap del template torna l'impalcatura che un progetto nuovo
eredita.

Checklist:
- [ ] `docs/ROADMAP.md` uguale all'impalcatura della #93
- [ ] `pnpm run check:roadmap` verde

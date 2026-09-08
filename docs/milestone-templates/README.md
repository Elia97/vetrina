# Impalcature di milestone

Blueprint riutilizzabili di milestone, consumati da `/milestone <nome-template>`
(`.claude/commands/milestone.md`).

## Formato del file

Frontmatter (YAML, volutamente minimo):

```yaml
---
name: "<nome della milestone, può contenere token {{segnaposto}}>"
description: <riassunto in una riga>
---
```

Nessun elenco `placeholders` separato: `/milestone` cerca nel corpo i token `{{snake_case}}`
distinti e li chiede direttamente, in una sola chiamata a `AskUserQuestion`, usando come contesto il
testo che li circonda. Dichiarare i segnaposto due volte sarebbe solo un secondo posto da cui
possono divergere.

Corpo:

- una sola intestazione `# <nome>`, con una o tre frasi: cosa consegna questa milestone e quando ha
  senso tirarla in ballo;
- una sezione `## Sotto-task`, un blocco per sotto-task:

  ```markdown
  ### <N>. <titolo in forma Conventional Commit, es. "feat(content): aggiungi {{x}}">

  **Agent:** <content-agent | ui-agent | seo-agent | forms-agent | perf-rendering-agent | ops-agent | general-purpose>
  **Labels:** <una label GitHub, oppure vuoto>

  <una o tre frasi di ambito e contesto: diventano la prosa del corpo della issue.>

  Checklist:
  - [ ] ...
  ```

Il contratto di lettura su cui `/milestone` conta:

- il prefisso ordinale `<N>. ` viene tolto, e il resto dell'intestazione diventa il titolo letterale
  della issue GitHub, parola per parola, dopo la sostituzione dei segnaposto;
- `**Agent:**` e `**Labels:**` si riconoscono dal prefisso esatto di riga. Le label possono essere
  vuote, e in quel caso `--label` si omette del tutto;
- tutto il resto del blocco (prosa più checklist) diventa il corpo della issue, preceduto da due
  commenti HTML — invisibili nella vista di GitHub e letti da `/pr`:
  ```
  <!-- milestone-template: <slug di questo file> -->
  <!-- suggested-agent: <lo stesso valore di **Agent:** qui sopra> -->
  ```
  È così che `/pr` riusa la logica di scelta dell'agente di `/milestone` senza duplicarne il codice:
  due slash command non possono importarsi a vicenda, quindi il suggerimento viaggia dentro il corpo
  della issue.

## Cosa non fare

- Non inventare mai una label GitHub solo per raggruppare le issue di una milestone: il
  raggruppamento è l'oggetto Milestone nativo. `**Labels:**` serve per le label ordinarie
  (enhancement, bug, …), mai per raggruppare.
- Non frammentare in sotto-task da una riga: ognuno diventa una issue e una PR, e la grana giusta è
  «unità di lavoro coerente e rivedibile».

## Quale percorso semina cosa

`/milestone <nome-template>` **accoda una milestone che nella roadmap non c'è ancora**, numerandola
come `1 + la più alta intestazione ## Milestone N presente`. Va bene per un blueprint tirato in
ballo a progetto avviato, non per uno già scritto nel piano.

`/milestone <N>` semina una sezione `## Milestone N` **che esiste già**. È il percorso per tutto
quello che è stato pianificato prima, `foundations` compresa: lanciare il percorso template su una
roadmap che porta già la sezione creerebbe un doppione un numero più avanti.

## Template disponibili

- `foundations.md` — la Milestone 1 di ogni progetto: branding, ambienti, design system, SEO, form,
  consenso, contenuti reali. Si trascrive nella roadmap mentre si scrive il piano (la stima si
  deriva da lì) e poi si semina con `/milestone 1`. Non si costruisce niente sopra uno scaffold che
  si chiama ancora `astro-template`.
- `content-section.md` — una sezione nuova basata su una content collection (listing, pagine di
  dettaglio e SEO), parametrizzata sui nomi di sezione, collezione e rotta.

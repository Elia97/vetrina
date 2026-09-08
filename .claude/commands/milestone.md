---
description: Ragiona su una milestone come insieme. La semina la prima volta — Milestone GitHub nativa più una issue per sotto-task, da un template di docs/milestone-templates/*.md o da una sezione di docs/ROADMAP.md — e la rilegge contro il codice quando è già seminata. Non scrive mai codice applicativo, non crea branch, non committa.
argument-hint: <nome-template> | <numero-milestone> | backlog
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, ToolSearch, AskUserQuestion, EnterPlanMode, ExitPlanMode
---

# /milestone — la milestone come insieme

Argomenti: **$ARGUMENTS** → il nome di un file in `docs/milestone-templates/<nome>.md` (senza estensione), un numero di milestone `<N>` che corrisponde a un'intestazione `## Milestone N` in `docs/ROADMAP.md`, oppure `backlog` per le issue aperte che non appartengono a nessuna milestone.

Le due modalità — **semina** e **rilettura** — e la ragione per cui esistono stanno in `CLAUDE.md` § Pianificazione e agenti verticali. Qui c'è come si eseguono.

Se `$ARGUMENTS` è vuoto, o non corrisponde a niente, **fermati e mostra le opzioni disponibili**: i nomi dei file in `docs/milestone-templates/*.md` con la loro descrizione, i numeri di milestone della roadmap, e quante issue aperte stanno fuori da ogni milestone.

`gh milestone` **non esiste** come sottocomando della CLI `gh`: l'oggetto milestone si raggiunge solo con `gh api repos/{owner}/{repo}/milestones`. Non scrivere mai `gh milestone create` in questo comando.

## Fase 1 — Pre-volo (sola lettura)

1. `git rev-parse --is-inside-working-tree`. Se fallisce, fermati.
2. Albero di lavoro pulito (`git status --short`): l'unico file che questo comando modifica è `docs/ROADMAP.md`, e gli serve una base pulita. Se è sporco, fermati e chiedi.
3. Il branch dovrebbe essere `main`. Se non lo è, avvisa e chiedi conferma.
4. `gh auth status` e `gh repo view --json owner,name`: confermano che `gh` è autenticato e che il remote si risolve. Se non è così fermati subito con un messaggio chiaro — un progetto appena creato dal template può non avere ancora `gh` configurato.
5. Interpreta `$ARGUMENTS`: corrisponde a `docs/milestone-templates/<arg>.md` → **percorso template**; è un intero che corrisponde a un'intestazione `## Milestone <N>` esistente → **percorso bespoke**; è `backlog` → **percorso backlog**, le issue aperte senza milestone (`gh issue list --search 'no:milestone' --state open`), che saltano la Fase 2 e vanno dritte alla verifica; nessuno dei tre → fermati ed elenca le opzioni.
6. **Stabilisci la modalità** contando quanti sotto-task della sezione portano già un numero di issue: nessuno → semina; tutti → rilettura; alcuni → semina il resto e rileggi quelli che ci sono. Dichiara quale hai scelto prima di proseguire.
   - percorso template: se `docs/ROADMAP.md` ha già una sezione con `**Fonte:** template <stesso nome>`, fermati e chiedi conferma esplicita prima di istanziarne una seconda copia. Un template non si rilegge: ha senso una volta sola.
   - in rilettura, leggi anche lo stato reale su GitHub — `gh issue list --milestone "<titolo>" --state all --json number,title,state,body` — perché una issue può essere stata chiusa, riscritta o spostata senza che la roadmap se ne sia accorta.
7. Leggi `docs/DECISIONS.md`: è informativo e non blocca mai. Le voci aperte pertinenti si portano nel piano (Fase 4) e nel riepilogo (Fase 6).

## Fase 2 — Caricare la sorgente

**Percorso template:**

1. Leggi `docs/milestone-templates/<arg>.md` e interpreta il frontmatter (`name`, `description`: informativi).
2. Cerca nel corpo i token `{{snake_case}}` distinti e chiedili tutti insieme in una sola chiamata a `AskUserQuestion`.
3. Sostituisci ogni `{{token}}` col valore raccolto.
4. Il numero della milestone `N` è 1 + il più alto `## Milestone <N>` già presente in `docs/ROADMAP.md`. **Caso speciale**: se l'unica sezione presente è il segnaposto dello scaffold mai toccato, tratta la roadmap come vuota (`N = 1`) e **sostituisci** quel segnaposto invece di accodarti — è lo stato reale al primo giro di ogni progetto nato dal template.

**Percorso bespoke:**

1. Leggi la sezione `## Milestone N` così com'è: `N` è già fissato dall'intestazione, non c'è nessun segnaposto da sostituire.

**Entrambi i percorsi — leggere i sotto-task:**

- percorso template: spezza sulle intestazioni `### <n>. <titolo>` ed estrai `**Agent:**`, `**Labels:**` e il resto (prosa più checklist) come corpo della issue;
- percorso bespoke: spezza sulle intestazioni `### N.x <slug>`. Qui non c'è metadato `**Agent:**`, quindi l'agente si ricava dalla **tabella dei domini in `docs/ARCHITECTURE.md` § I domini**, che è l'unico posto in cui vive: si legge da lì, non si ricopia.

Una riga sotto l'intestazione di un sotto-task può portare due annotazioni: `dipende da: <N>.<k>[, …]` e `✅ già fatto in #<PR>`. Un sotto-task marcato come fatto non diventa una issue.

## Fase 3 — Verifica contro il codice

Passa da **`/drift`** — con la sezione della roadmap in semina, col numero della milestone in
rilettura. È lui a dire cosa non è più vero, cosa è già fatto e quali dipendenze mancano, e a
scriverlo dove va: nella roadmap se le issue non esistono ancora, in coda al corpo se esistono.

Torna da lì con l'ordine delle voci, i loro raggruppamenti e le sovrapposizioni — quali due toccano gli stessi file: i primi due sono l'input della fase che segue, le terze entrano nel riepilogo finale.

### La sonda

Se una voce mette alla prova il piano — la più rischiosa, quella che se non regge fa ripensare il
resto — marcala come **sonda**: una riga nella descrizione della Milestone GitHub, scritta in
Fase 5. **Al massimo una per milestone**, altrimenti diventa un secondo sistema di priorità accanto
alle dipendenze.

## Fase 4 — Piano: anteprima issue per issue

Entra in modalità piano.

1. Scrivi `.claude/plans/milestone-NN-slug.md` (gitignored). **In semina**, per ogni sotto-task: titolo esatto, corpo esatto (prosa, checklist e le due annotazioni HTML, byte per byte quello che `gh issue create --body-file` riceverà), agente suggerito, label, e i sotto-task da cui dipende. Più la Milestone GitHub in procinto di essere creata (titolo `Milestone N — <nome>`) con la sua descrizione, e il riepilogo delle correzioni già applicate alla roadmap. **In rilettura**: l'ordine proposto per le issue ancora aperte con la ragione di ciascuna posizione, le issue da chiudere o riscrivere, e cosa è cambiato rispetto all'ordine deciso alla semina. I blocchi `## Aggiornamento` non stanno qui: li ha già scritti e applicati `/drift` in Fase 3, con la sua approvazione.
2. `AskUserQuestion` su ogni ambiguità residua.
3. L'utente itera, o approva con `ExitPlanMode` — **quell'unica approvazione copre l'intero lotto**. Nessuna seconda conferma issue per issue.

## Fase 5 — Creazione (autonoma, dopo l'approvazione)

**In rilettura questa fase si riduce a un passo**: seminare i sotto-task che ancora non hanno una issue, col procedimento qui sotto. Milestone e issue esistenti non si ricreano, e i corpi aggiornati sono già su GitHub da `/drift`.

1. **Controllo anti-duplicato** prima di creare: `gh api repos/{owner}/{repo}/milestones -f state=all --method GET --jq '.[] | select(.title=="Milestone N — <nome>") | .number'` — il `--method GET` forza una lettura nonostante il flag `-f`. Serve contro una `docs/ROADMAP.md` disallineata rispetto a quello che c'è davvero su GitHub, invece di fidarsi del file locale. Se lo trova, riusa quel numero invece di creare un doppione.
2. Altrimenti creala:
   ```bash
   gh api repos/{owner}/{repo}/milestones -f title="Milestone N — <nome>"
   ```
   Sempre col segnaposto letterale `{owner}/{repo}`: `gh` lo risolve dal remote del repo corrente, e così questo file resta identico byte per byte e rieseguibile in ogni progetto nato dal template. Prendi `number` e `html_url`.
3. Per ogni sotto-task, nell'ordine della roadmap: scrivi il corpo della issue in `.claude/plans/milestone-NN-slug.issue-<k>.body.md` (gitignored, lasciato su disco per il controllo). Il corpo porta in coda `<!-- suggested-agent: <nome> -->`, che `/pr` legge in Fase 1: il nome viene dal metadato `**Agent:**` del template, e i nomi validi sono quelli di `docs/ARCHITECTURE.md` § I domini. Poi:
   ```bash
   gh issue create --title "<titolo>" --body-file <percorso> --milestone "Milestone N — <nome>" [--label <label>]
   ```
   (ometti `--label` se `**Labels:**` era vuoto). Ricava il numero della issue dall'URL restituito e tieni la corrispondenza sotto-task → numero.
4. Aggiorna `docs/ROADMAP.md`: scrivi o sostituisci la sezione `## Milestone N` con `**GitHub Milestone:** #N (<html_url>)`, la tabella `Sotto-task | Issue` coi numeri creati, e la riga della tabella Status → `🟡 seeded`.
5. **Non committare**: `docs/ROADMAP.md` resta una modifica non committata, e la parte autonoma è solo la creazione di milestone e issue via `gh`.

## Fase 6 — Consegna

Riepilogo: la milestone (numero, titolo, URL); ogni issue aperta (numero, titolo, URL) **nell'ordine deciso**, con la ragione della prima; le sovrapposizioni che `/drift` ha trovato, cioè quali due non conviene aprire insieme; le issue proposte per la chiusura o la riscrittura; la conferma che `docs/ROADMAP.md` è stato aggiornato; e il comando pronto da copiare:

```bash
git add docs/ROADMAP.md
git commit -m "docs: semina la milestone N — <nome> (#X-#Y)"
# in rilettura:
git commit -m "docs: rilegge la milestone N — <nome> contro il codice"
```

Passo successivo: «`/pr <numero-issue>` sulla prima dell'ordine». E la riga che rende utile la rilettura: **rilancia `/milestone <N>` dopo che qualche PR è atterrata** — l'ordine deciso oggi è un'ipotesi, e verificarla costa un minuto.

## Vincoli

Valgono le regole `[HARD]` di `CLAUDE.md` § Come si lavora, e in più: **mai** `gh issue close`, `delete` o `reopen` — una issue si chiude da sola al merge, grazie a `Closes #N`.

---
description: Implementa una issue GitHub dall'inizio alla fine (branch → implementazione → gate → corpo della PR con Closes). Non committa, non pusha e non apre PR — quello è compito dell'utente.
argument-hint: <numero-issue> [--from <branch>]
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, Agent, ToolSearch, AskUserQuestion, EnterPlanMode, ExitPlanMode
---

# /pr — da una issue a una PR

Argomenti: **$ARGUMENTS** → `<N>` (numero della issue, obbligatorio) più l'opzionale `--from <branch>` (branch di base diverso da `main`). Se `<N>` manca, non è un intero, o la issue non esiste o è chiusa → **fermati e chiedi**.

Il modello — una issue, una PR, un commit squash — sta in `CLAUDE.md` § Come si lavora, con le regole `[HARD]` che valgono anche qui. In più: **mai** `gh issue close`, `delete` o `reopen`, e **mai** eseguire il comando di chiusura milestone della Fase 6. Nessuna dipendenza che `CLAUDE.md` o `docs/ARCHITECTURE.md` non documentino: nel dubbio si chiede.

## Fase 1 — Pre-volo (sola lettura)

1. `git rev-parse --is-inside-working-tree`; albero di lavoro pulito (`git status --short`, altrimenti fermati e chiedi: stash, commit o annulla); `git fetch origin` e `main` aggiornato (nessun pull automatico).
2. `gh issue view <N> --json number,title,body,state,labels,milestone,url`. Dal **titolo** ricava `tipo` e `ambito` Conventional; se il titolo non è Conventional, deducili dalle label (`bug`→`fix`, `enhancement`→`feat`, che esistono di default su ogni repo GitHub) oppure chiedi. **Corpo e checklist `- [ ]`** sono la specifica: ogni voce va coperta.
3. Cerca `<!-- suggested-agent: X -->` nel corpo (c'è sulle issue seminate da `/milestone`). Se c'è, è il segnale principale per scegliere gli agenti verticali della Fase 5. Se manca — issue scritta a mano — ricavalo dalla **tabella dei domini in `docs/ARCHITECTURE.md` § I domini**, che è l'unico posto in cui vive: due slash command non possono condividere codice, ma leggono lo stesso file.

## Fase 2 — Attualità

L'issue è stata scritta quando è stata seminata. Passa da **`/drift <numero-issue>`** prima di
pianificare: se qualcosa è andato alla deriva è lui a scrivere il blocco `## Aggiornamento` in coda
al corpo, e tu implementi il corpo aggiornato invece di aggirare la deriva o riscoprirla ogni volta.

Se la deriva è tale che l'issue va ripensata, `/drift` lo dichiara e si ferma: riscriverla è una
decisione dell'utente, e implementare una specifica sbagliata costa più che tornare indietro.

## Fase 3 — Branch

`<tipo>/<N>-<slug>` (slug kebab di 3-5 parole, dal titolo; per esempio `refactor/71-trailing-slash`). Se esiste già, `git switch` dentro (si riprende); altrimenti `git switch -c` da `main` o da `--from`.

## Fase 4 — Piano (modalità piano)

**Prima guarda l'insieme, che sta in due posti e in nessun terzo.** Un blocco `## Aggiornamento AAAA-MM-GG` in coda al corpo della issue è quello che `/drift` ha già trovato non reggere più: è il risultato di una verifica fatta, non riaprirlo e non riscoprirlo. `docs/ROADMAP.md` porta l'ordine e le righe `dipende da:`: se un'altra issue deve atterrare prima di questa, dillo e chiedi conferma prima di procedere.

Se invece la milestone è ferma da settimane e nessuno l'ha più riletta, la cosa che costa meno è dirlo e proporre `/milestone <N>` prima di questa PR: una verifica sull'insieme trova quello che una issue alla volta non può vedere.

Espandi il corpo della issue in `.claude/plans/pr-<N>-<slug>.md`: file da toccare, suddivisione fra agenti verticali (1-3 agenti, percorsi di scope **esclusivi**, solo se la superficie è ampia e parallelizzabile; altrimenti si lavora direttamente — quale agente copre quali percorsi lo dice `docs/ARCHITECTURE.md` § I domini), gate di qualità, controlli manuali. `AskUserQuestion` sulle ambiguità che influenzano il piano. Se l'ambiguità non è del task ma del disegno, la issue è mal posta: passa da `/decisions` invece di decidere dentro la PR. L'utente itera, o approva con `ExitPlanMode`.

Il gate da mettere in conto: **`pnpm run ci`** → **`pnpm run check:comments --diff`** → **`pnpm run audit:diff`** → **`pnpm run build`**.

## Fase 5 — Implementazione

1. Modifiche: agenti in parallelo con percorsi di scope esclusivi se la superficie è ampia (il prompt include scope esclusivo, **ruolo esplicito «implementa»**, riferimenti a `CLAUDE.md` e `docs/ARCHITECTURE.md`, «non committare»); altrimenti modifiche dirette.
2. **Sovrapposizioni**: quando gli agenti paralleli hanno finito, guarda `git status`. Se due hanno toccato lo stesso file nonostante gli scope esclusivi, **fermati qui** e non fondere in automatico. Mostra all'utente i due diff previsti e usa `AskUserQuestion`: o (a) l'utente risolve a mano e tu rilanci il gate, o (b) si lancia un agente dedicato a riconciliare le due modifiche in modo coerente, e si riparte da questo passo.
3. Copri **ogni voce della checklist** della issue, dichiarando esplicitamente quelle rimandate.
4. **Ripasso dei commenti**: lancia `comments-agent` con ruolo **implementa** su `git diff`, prima del gate. Giudica ogni commento che il branch aggiunge — i tuoi e quelli degli altri agenti — con un test solo: porta un fatto verificabile **fuori da questo file**, cioè il comportamento di un fornitore, un numero misurato, una stranezza di piattaforma, un accoppiamento nominato con un altro file? Se no, va via. Le previsioni sul nostro codice («senza questo il layout si rompe») sembrano invarianti ma sono inferenze tratte dal codice stesso, e muoiono qui. L'agente toglie solo righe di commento, quindi il gate subito dopo è prova sufficiente che niente si è rotto. Lancialo anche sul codice che hai scritto tu: `check:comments` legge la forma, non l'utilità, e un commento corto e inutile lo passa verde.
5. Gate di qualità in sequenza: `pnpm run ci`, poi `pnpm run check:comments --diff`, poi `pnpm run audit:diff`, poi `pnpm run build`. Se fallisce, lancia un agente correttivo e rilancia (al massimo due tentativi, poi fermati).
   - `check:comments` esce sempre 0, ma **quello che elenca va risolto prima della consegna**: segnala blocchi di commento oltre due righe, file dove i commenti superano il 15% delle righe, e commenti che narrano la modifica invece di descrivere il codice. `--diff` lo restringe a quello che questo branch ha toccato (merge-base con `origin/main`, non tracciati compresi), che è l'ambito di cui rispondi qui; lanciandolo nudo vedi tutto l'albero, ed è quello che serve quando la issue riguarda il debito ereditato. La regola sta in `CLAUDE.md`.
   - `audit:diff` è `fallow audit`: codice morto, complessità, duplicazione e stile **limitati al diff**, con uscita diversa da zero su un verdetto negativo. Giudica solo quello che questo branch introduce — i ritrovamenti ereditati vengono riportati ma esclusi dal verdetto, così il debito preesistente non blocca mai una issue che non c'entra. Sceglie da sé la base (merge-base col default remoto); si fissa con `FALLOW_AUDIT_BASE` se la risolve male.
   - Gira prima di `build` di proposito: costa meno di un secondo e prende quello che il passo costoso non guarda mai.
6. **Contenimento delle review [HARD]**: qualunque review multi-agente dopo il gate segue le soglie di «Orchestrazione multi-agente» in `CLAUDE.md` — diff piccolo → nessuna, basta il gate sequenziale qui sopra; medio → al massimo un agente revisore; grande, o medio che tocca un'area a rischio → un workflow compatto entro i limiti dichiarati lì. Non aggiungere mai un workflow di review fuori da quelle soglie, qualunque sia la modalità di sessione.
7. Aggiorna la documentazione toccata (mai `docs/PROJECT.md`, e mai `docs/ROADMAP.md`, che si aggiorna alla semina e quando `/drift` la corregge; per l'avanzamento della singola issue la fonte di verità è lo stato su GitHub).

## Fase 6 — Consegna

1. **Allineamento della checklist**: quando il gate è verde e ogni voce della checklist è coperta (o dichiarata rimandata), usa `gh issue edit <N>` per spuntare (`- [x]`) ogni `- [ ]` soddisfatta direttamente nel corpo della issue — modifica solo i marcatori, lasciando il resto identico byte per byte (leggi con `gh issue view <N> --json body -q .body`, gira le caselle, riscrivi con `--body-file`). Le voci rimandate restano non spuntate. È una normale modifica del corpo e non ricade nel divieto su `close`/`delete`/`reopen`: falla direttamente, senza chiedere ogni volta.
2. Lancia `pnpm run audit:brief` e scrivi i **controlli per chi rivede** da lì, non a memoria. È la stessa analisi del gate resa come brief di orientamento: ordine di lettura, i file toccati *oltre* il diff (chiusura dell'impatto), quali unità portano il rischio, e le «decisioni da prendere» che la modifica impone. Esce sempre 0, quindi informa il corpo senza bloccarlo.
3. Genera `.claude/plans/pr-<N>-<slug>.body.md` da `.github/PULL_REQUEST_TEMPLATE.md`, con **`Closes #<N>`**: cosa cambia, definizione di fatto (spunta solo ciò che hai verificato), controlli per chi rivede, note.
4. **Suggerimento di chiusura milestone**: se il JSON della issue ha una `milestone`, lancia `gh issue list --milestone "<titolo milestone>" --state open --json number`. Se l'unica issue aperta è `#<N>` stessa (o l'elenco è vuoto), stampa — **senza mai eseguirlo**:
   ```bash
   # una volta che questa PR è mergiata (Closes #<N> chiude l'ultima issue aperta della milestone):
   gh api -X PATCH repos/{owner}/{repo}/milestones/{numero-milestone} -f state=closed
   # e aggiorna docs/ROADMAP.md a mano: Milestone N → 🟢 done
   ```
   (`numero-milestone`, non il titolo, viene dalla stessa chiamata `gh issue view --json milestone` della Fase 1.)
5. Riepilogo: issue, branch, `git status --short`, esito del gate, checklist coperta e rimandata, e i comandi pronti da copiare:
   ```bash
   git diff
   git add -A && git commit -m "<tipo>(ambito): <descrizione dal titolo della issue>"
   git push -u origin <tipo>/<N>-<slug>
   gh pr create --title "<tipo>(ambito): <descrizione>" --body-file .claude/plans/pr-<N>-<slug>.body.md
   # merge in SQUASH → alimenta la release PR; #<N> si chiude al merge
   ```

## Note

- Il **tipo nel titolo della issue** guida il commit e l'incremento di versione di release-please: un breaking change vuole il `!` nel titolo (`feat(ui)!: …`), perché il corpo dello squash è vuoto e un footer `BREAKING CHANGE:` non arriverebbe mai a release-please.
- `Closes #<N>` va nella **descrizione della PR** (`--body-file`) e solo lì: il corpo dello squash è vuoto, quindi una parola chiave messa nel messaggio di commit non arriverebbe mai su `main` e la issue resterebbe aperta.
- `.claude/plans/` è gitignored: `pr-<N>-<slug>.md` è interno, `.body.md` è per chi rivede.

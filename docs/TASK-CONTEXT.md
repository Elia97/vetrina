# Contesto per compito

Cosa leggere prima di mettere le mani su qualcosa, e **cosa lasciare fuori**. La terza colonna è
quella che conta: un documento caricato senza servire costa contesto a ogni sessione, e i documenti
di questo repo sono più di quanti ne serva uno alla volta.

Le righe si leggono nell'ordine in cui stanno. Se il lavoro attraversa due righe, si prende
l'unione — ma solo delle righe che tocca davvero.

## Il ciclo

```
decisioni aperte   →  /decisions  →  ROADMAP.md · DECISIONS.md · ARCHITECTURE.md
un piano scritto   →  /drift      →  cosa non è più vero, e dove sta scritto adesso
roadmap verificata →  /milestone  →  Milestone GitHub + issue (semina)
milestone in corso →  /milestone  →  issue aggiornate + ordine (rilettura)
una issue          →  /pr         →  branch · commit · PR
il giro dopo       →  /sweep      →  il debito che i gate hanno dichiarato tollerabile
```

Fra un passo e il successivo c'è quasi sempre una persona: l'approvazione del cliente prima di
seminare, la review della PR prima del merge. Non è una catena che si lancia in blocco.

## Cosa leggere

| Compito | Leggi, in quest'ordine | Salta, salvo che il lavoro ci arrivi |
|---|---|---|
| **Orientarsi** nel progetto | `docs/ARCHITECTURE.md` § Struttura del repository · `docs/ROADMAP.md` § Status | le guide di dominio, `HOW_TO_USE.md`, i documenti commerciali |
| **Implementare una issue** (`/pr`) | il corpo della issue, blocco `## Aggiornamento` compreso · la sezione di `docs/ROADMAP.md` da cui nasce · la guida del dominio toccato · `docs/ARCHITECTURE.md` § Stratificazione dei sorgenti | le guide degli altri domini, `HOW_TO_USE.md`, tutto ciò che è commerciale |
| **Seminare o rileggere una milestone** (`/milestone`) | `docs/ROADMAP.md` · `docs/DECISIONS.md` · `docs/ARCHITECTURE.md` § Struttura del repository | le guide di dominio e il codice, finché la verifica contro il codice non li chiama per nome |
| **Verificare un piano contro il codice** (`/drift`) | l'oggetto verificato — issue, milestone o sezione di `docs/ROADMAP.md` — e poi i file veri che nomina | le guide di dominio: qui si guarda cosa esiste, non come si scrive |
| **Decidere un bivio** (`/decisions`) | `docs/DECISIONS.md` · `docs/INPUTS.md` · `docs/PROJECT.md` per la voce del cliente | il codice: qui si decide, non si implementa |
| **Lavorare dentro un dominio** | `docs/ARCHITECTURE.md` § I domini dice quale guida serve per i percorsi che stai toccando · poi quella sola guida | le guide degli altri domini: sono sei, e una per volta è quella giusta |
| **Fare il giro di pulizia** (`/sweep`) | l'uscita di `pnpm run ci` e di `pnpm run review`, che è dove i gate scrivono quello che tollerano | i documenti: qui si guarda cosa il codice porta e non serve più |
| **Preparare un commit o una PR** | `CLAUDE.md` § Come si lavora · `.github/PULL_REQUEST_TEMPLATE.md` | i cataloghi di riferimento: qui serve la procedura, non il perché |
| **Andare in produzione, o tornare indietro** | `docs/guides/deploy-ops.md` § Procedure e § Rollback | tutto il resto |
| **Stima, verbali, documenti al cliente** | `docs/ROADMAP.md` (è la fonte delle giornate) · `docs/proposal-templates/README.md` | il codice e le guide |
| **Aprire un progetto nuovo da questo template** | `HOW_TO_USE.md` | le guide di dominio, che si leggono quando si tocca il dominio |

## Dove va quello che produci

Un fatto scritto in due posti diverge al primo cambiamento, e una decisione presa a voce è persa
alla prossima compattazione. Per ogni cosa prodotta c'è un posto solo:

| Cosa hai in mano | Dove va |
| --- | --- |
| Una decisione aperta, che cambia il codice | `docs/DECISIONS.md`, sotto la milestone che blocca |
| Una decisione presa, su come è fatto il codice | `docs/ARCHITECTURE.md` |
| Una decisione presa, che cambia cosa si costruisce | `docs/ROADMAP.md` — e la decisione esce da `DECISIONS.md` |
| Una regola che vale per chi lavora qui | `CLAUDE.md` |
| Un materiale che aspettiamo da qualcuno | `docs/INPUTS.md`, che è un registro di consegne e non di scelte |
| Qualcosa deciso con l'utente in sessione | `.claude/plans/stato.md` |
| Un piano che non regge più contro il codice | la roadmap se la issue non esiste, il corpo della issue se esiste |

⚠️ **`docs/PROJECT.md` non è in tabella**: è il brief del cliente con le sue parole e si aggiorna
solo con nuovo input esplicito suo (`CLAUDE.md` lo marca `[HARD]`). Niente di prodotto qui ci entra.

⚠️ Le **giornate** non stanno in nessuna di queste righe: le fissa la stima approvata, e spostarle
richiede una stima nuova e una nuova approvazione (`CLAUDE.md`).

Se quello che hai in mano non ricade in nessuna riga, probabilmente non andava scritto.

**I dettagli volatili non si copiano qui.** Gli script stanno in `package.json`, i flag di uno
strumento nel suo `--help`: un catalogo ricopiato in un documento diverge al primo cambiamento, e
nessuno se ne accorge finché non fa danno.

---
description: Confronta con il codice di oggi quello che è scritto in un piano, in una issue o in una sezione della roadmap. Dice cosa non è più vero, cosa è già fatto, quali dipendenze mancano — e scrive le conclusioni dove chi implementa le leggerà. Non implementa niente.
argument-hint: <numero-issue> | <numero-milestone> | <nome-sezione-roadmap> | (vuoto = tutto l'aperto)
allowed-tools: Bash, Read, Glob, Grep, Agent, Edit, AskUserQuestion
---

# /drift — quello che è scritto contro quello che è

Un piano è stato scritto in un momento preciso mentre il codice si muoveva. Questo comando scopre
**cosa di esso è ancora vero**, e lo fa prima che qualcuno lo implementi credendoci.

Ci si passa da tre punti: `/milestone` prima di seminare o rileggendo un insieme, `/pr` prima di
pianificare una issue, e da soli quando una milestone è ferma da settimane.

## Fase 1 — L'ambito

**$ARGUMENTS** è un numero di issue, un numero di milestone, il nome di una sezione di
`docs/ROADMAP.md` non ancora seminata, o niente — nel qual caso l'ambito è tutto ciò che è aperto.

Carica gli oggetti veri: `gh issue view <N>` per una issue, `gh api repos/{owner}/{repo}/milestones`
più `gh issue list --milestone` per una milestone, la sezione di `docs/ROADMAP.md` per un piano non
ancora seminato. Se l'ambito è vuoto o non corrisponde a niente, **fermati e mostra le opzioni**.

## Fase 2 — Verificare

**Dimensiona la verifica sull'input, non sul rituale.** Lancia agenti d'indagine in parallelo — con
un **ruolo esplicito «indagine, sola lettura»** nel prompt, perché nessuno si metta a sistemare quel
che trova — solo se si verifica almeno una di queste due condizioni:

- due o più voci nominano gli stessi percorsi;
- esiste già del codice in una zona che una voce descrive come da fare.

Altrimenti la verifica è un `grep`, uno sguardo a `git log` e un paragrafo: su tre voci indipendenti
dura mezzo minuto, ed è giusto così.

Su ogni voce:

1. **È già fatto, o fatto a metà?** La risposta più preziosa che questo comando possa dare è «tre di
   questi non servono più». Guarda i file veri, non la descrizione che la voce ne dà.
2. **Le sue affermazioni reggono?** Elenchi di file, conteggi e frasi come «X manca» invecchiano in
   fretta.
3. **Cosa fa già il codice in quella zona?** Trova il pattern di casa: un componente simile, la
   convenzione in `docs/guides/`, la regola in `docs/ARCHITECTURE.md`.

Attraverso le voci, **solo se sono più di una**:

4. **Dipendenze.** Quale deve atterrare prima di quale, e perché. Confrontale con quelle già
   dichiarate: una `dipende da:` mancante è la scoperta tipica di questa fase.
5. **Sovrapposizioni.** Quali toccano gli stessi file. Non diventano un vincolo — due issue che si
   toccano non si bloccano a vicenda — ma vanno dette nel riepilogo: sapere quali due non conviene
   aprire insieme è quello che risparmia un conflitto.
6. **Raggruppamento.** Quali sono una issue che si finge tre, e quali tre che si fingono una.

## Fase 3 — Applicare

Se le conclusioni sono più di tre e dipendono l'una dall'altra, fermati e passa da `/decisions`: qui
`AskUserQuestion` chiederebbe cose il cui senso dipende da risposte non ancora date. Altrimenti ogni
conclusione che cambia cosa si costruisce passa da `AskUserQuestion`, e una volta approvata si
applica. **Dove, lo decide se l'oggetto esiste già su GitHub** — non chi ti ha chiamato.

**Se la issue non esiste ancora**, il piano è solo testo: si applica tutto con `Edit` a
`docs/ROADMAP.md`. Fondere due voci, spezzarne una, tagliarne un'altra, aggiungere una riga
`dipende da:`, marcare `✅ già fatto in #<PR>`. Le issue nasceranno già corrette, che è il motivo per
cui questa verifica sta prima della creazione e non dopo.

**Se la issue esiste**, quello che è cambiato va scritto dove chi implementa lo leggerà: in coda al
corpo, con questa forma esatta.

```markdown
## Aggiornamento AAAA-MM-GG
<cosa non è più vero, e cosa lo sostituisce>
```

Si applica con `gh issue edit <N> --body-file` dopo il sì dell'utente, lasciando il resto del corpo
identico byte per byte. È una normale modifica del corpo e non ricade nel divieto su
`close`/`delete`/`reopen`. Una issue che risulta **già soddisfatta** non si chiude: si dice quale e
si propone la chiusura all'utente. Una che va **ripensata da capo** si dichiara e si lascia fuori
dall'ordine — riscriverla è una decisione sua.

In entrambi i casi la roadmap si aggiorna: è lei a portare dipendenze e raggruppamento.

⚠️ Le **giornate** non si toccano: `CLAUDE.md` le vincola alla stima approvata. Voci, descrizioni e
checklist restano liberi.

Il diff della roadmap **è** il resoconto della verifica. Non scrivere un documento a parte: finisce
nel commit, dove resta versionato e rileggibile accanto ai numeri delle issue.

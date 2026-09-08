---
description: Interroga l'utente su un piano o una decisione finché non resta niente di assunto in silenzio. Mappa i bivi come un albero, chiede in blocco quelli allo stesso livello con una raccomandazione ciascuno, e registra dove va a finire ogni decisione presa. Non implementa niente.
argument-hint: <cosa mettere sotto torchio>
allowed-tools: Bash, Read, Glob, Grep, ToolSearch, AskUserQuestion
---

# /decisions — tutti i bivi dello stesso livello, insieme

Serve prima di un lavoro grosso, quando le decisioni non prese si nascondono dentro quelle prese:
una roadmap, un modulo nuovo, una modifica che tocca più applicazioni. Non implementa niente e non
committa: produce decisioni registrate.

## Dove sta nel ciclo

A monte di tutto: qui le decisioni nascono, altrove si eseguono. Il giro completo sta in
`docs/TASK-CONTEXT.md` § Il ciclo.

Si rientra da due punti. Da **`/drift` Fase 3**, chiamato da `/milestone` o da solo, quando la
verifica contro il codice scopre che il piano va ripensato su più assi dipendenti: lì
`AskUserQuestion` costringerebbe a rispondere a domande il cui senso dipende da risposte non ancora
date. E da **`/pr` Fase 4**, solo quando l'ambiguità non è del task ma del disegno — in quel caso
la issue è mal posta, si torna indietro invece di decidere dentro la PR.

## Il metodo

L'albero, la frontiera e i round vengono dalla skill `grilling` di Matt Pocock
(github.com/mattpocock/skills). Quello che segue è la stessa idea con due aggiunte: la terza
categoria di chi decide, e la tabella di dove finisce una decisione.

Le decisioni formano un **albero**: ognuna ne apre altre sotto di sé. La **frontiera** sono quelle
i cui prerequisiti sono già risolti — le sole che si possono porre adesso senza tirare a indovinare
su risposte che non hai ancora dato.

Si lavora a **round**: chiedi tutta la frontiera in una volta, poi aspetti. Le risposte spostano la
frontiera in fuori e sbloccano il round dopo. Una domanda la cui risposta dipende da un'altra
domanda ancora aperta **appartiene al round successivo**, non a questo.

Finisce quando la frontiera è vuota. Non agire finché l'utente non conferma.

## Chi decide cosa [HARD]

Tre categorie, e confonderle è il modo di far decidere all'utente cose che non sono sue.

- **Un fatto lo trovi tu, mai l'utente.** Cosa c'è nel codice, quale versione è installata, se una
  regola è già imposta da un gate, cosa dice la documentazione di un fornitore. Guardalo, non
  chiederlo. Qui gli strumenti diretti bastano quasi sempre: un agente d'indagine si lancia solo
  entro le soglie di «Orchestrazione multi-agente» in `CLAUDE.md`.
- **Una decisione tecnica è dell'utente**, e va posta con la tua raccomandazione accanto. Sei tu a
  dover avere un'opinione: una domanda senza raccomandazione scarica su di lui un lavoro che è tuo.
- **Una decisione del cliente non è una domanda per l'utente.** Il prezzo di una fee, cosa
  comprende una fase, chi paga cosa: non le può decidere lui al posto del cliente. Quelle non
  entrano nel round — finiscono nell'elenco di ciò che resta da chiarire, e il round prosegue
  **sotto un'assunzione dichiarata**, non aspettando.

Se una risposta blocca metà dell'albero, dillo: sapere che si sta procedendo su un ramo incerto
vale più di una domanda in più.

## Il formato di un round

Numerate, una raccomandazione per ciascuna, separate da una riga orizzontale.

```
❓ **D1 — <titolo>**: <la domanda, anche più capoversi, con le opzioni se ci sono>

➡️ <la tua raccomandazione, con la ragione in una riga>

---

❓ **D2 — <titolo>**: …

➡️ …
```

Le opzioni chiuse e mutuamente esclusive possono passare da `AskUserQuestion`; tutto il resto sta
nel testo, dove una risposta può essere sfumata.

## Dove finisce una decisione [HARD]

Una decisione presa a voce e non scritta è persa alla prossima compattazione. Alla fine del giro,
per ognuna, dichiara dove va — la tabella è `docs/TASK-CONTEXT.md` § Dove va quello che produci —
e poi portacela davvero.

## Quando non usarlo

Per un bivio solo: lì basta una domanda con `AskUserQuestion`, e montare un albero per una foglia
è cerimonia. Serve quando i bivi sono più di tre e dipendono l'uno dall'altro.

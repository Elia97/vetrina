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
| 1 | \<nome> | 1 | \<n> | 🔲 planned |
| | **TOTALE** | | **\<n>** | |

<!-- Legenda: 🔲 planned (non ancora seminata) · 🟡 seeded (issue aperte su GitHub) · 🟢 done (Milestone GitHub chiusa) -->

## Dipendenze

<!-- Quale milestone non può partire prima di quale, e perché: è ciò che rende difendibile l'ordine
delle fasi quando il cliente chiede di anticipare qualcosa. -->

```text
1 (<nome>)
 └→ …
```

## Milestone 1 — \<nome>

**Fonte:** \<template `<nome-template>` | bespoke>
**GitHub Milestone:** non ancora seminata
**Fase 1** · **\<n> gg**

<!-- Da una a tre frasi: che cosa esiste alla fine della milestone che prima non c'era. Uno stato
del mondo, non un elenco di attività. -->

| Sotto-task | Issue |
|---|---|
| \<titolo del sotto-task, in forma Conventional Commit> | — |

### 1.1 \<titolo del sotto-task, in forma Conventional Commit>

<!-- Da una a tre frasi di ambito, che diventano la prosa della issue. Sotto il titolo possono stare
le righe `dipende da: 1.<k>` e `✅ già fatto in #<PR>`. -->

Checklist:
- [ ] \<voce verificabile>

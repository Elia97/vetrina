---
description: Il giro di pulizia su ciò che i gate non vedono, o che hanno dichiarato tollerabile. Guarda le esclusioni che non servono più, i TODO invecchiati, i file locali finiti in un commit, i documenti che citano uno stato superato. Non blocca niente e non committa: produce una lista con una proposta per voce.
argument-hint: [area, se vuoi restringere]
allowed-tools: Bash, Read, Glob, Grep, AskUserQuestion
---

# /sweep — quello che passa il gate e non dovrebbe restare

I gate dicono di sì o di no. Questo comando guarda la terza categoria: ciò che passa perché è stato
**dichiarato tollerabile**, e che nessuno rilegge finché non fa danno. Un'esclusione che non serve
più, un `TODO` di sei mesi, un file di log entrato in un commit, un avviso datato in un documento
che descrive uno stato superato.

Quando: dopo che qualche PR è atterrata, prima di una release, o quando `pnpm run review` si
allunga. Non è un gate — non blocca, non committa, non modifica niente da solo.

## Fase 1 — Raccogliere

```bash
pnpm run ci            # le note `·` che i gate stampano senza fallire
pnpm run review        # metriche, bus-factor, duplicazione
git ls-files -i -c --exclude-standard                     # tracciato, ma .gitignore lo escluderebbe
grep -rn "TODO\|FIXME" --include='*.ts' --include='*.astro' --include='*.md' src scripts docs .claude
grep -rn "v8 ignore\|biome-ignore\|fallow-ignore" src scripts .claude
grep -rn "⟳ \*\*[0-9]" docs                              # avvisi datati nei documenti
gh issue list --state open --json number,updatedAt --jq '.[] | "\(.number) \(.updatedAt)"'
```

## Fase 2 — Giudicare, una voce alla volta

Per ognuna, la domanda è sempre la stessa: **serve ancora la ragione per cui è stata scritta?**

| Cosa | Cosa la rende debito |
| :-- | :-- |
| Un'esclusione (`v8 ignore`, `biome-ignore`, `fallow-ignore`, le liste `IGNORED` dei gate) | il ramo è diventato raggiungibile, la regola è cambiata, il file non esiste più |
| Un `TODO` | ha più di qualche mese, o non dice più **cosa fare e dove** |
| Un file tracciato | è generato, o è stato di questa macchina (il caso vero: `guard-log.jsonl`) |
| Un avviso `⟳ <data>` in un documento | descrive uno stato che nel frattempo è cambiato |
| Una nota `·` di `check:comments` | la densità è alta perché il codice lì non è chiaro, non perché serva prosa |
| Una milestone chiusa su GitHub | la roadmap la dà ancora `🟡 seeded` |
| Un override in `pnpm-workspace.yaml` | `pnpm why <pkg>` dice che il parente ha pubblicato la correzione |

Due cose che **non** sono debito, e vanno lasciate stare: un'esclusione che porta la sua ragione e
la ragione regge ancora; un `TODO` che nomina un impegno verso qualcuno, che si toglie quando
l'impegno è sciolto, non quando invecchia.

## Fase 3 — Proporre

Una lista, ordinata per quanto costa lasciarla lì. Per ogni voce: dove sta, perché è debito adesso,
e cosa proponi — togliere, aggiornare, o aprire una issue. Poi `AskUserQuestion` sulle voci che
cambiano comportamento; le altre le esegui dopo il suo sì, in commit separati per tipo.

Se il giro non trova niente, dillo in una riga: **è l'esito più frequente e va bene così.** Uno
sweep che trova sempre qualcosa è uno sweep che si sta inventando il lavoro.

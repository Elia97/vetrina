<!-- IMPALCATURA — si copia in docs/ESTIMATE.md (gitignored) e si riempie. Le due forme possibili
sono nel README.md di questa cartella. Ogni commento come questo va cancellato strada facendo. -->

# Stima delle giornate — \<CLIENTE\> · \<cosa si costruisce\>

**Per:** \<chi la riceve\> · **Da:** \<chi la firma\> · **Data:** \<GG/MM/AAAA\> · **v\<N\>**

> Stima delle giornate necessarie al lavoro descritto in `docs/ROADMAP.md`. **Non è un'offerta
> firmata.** **Oggetto: solo sviluppo software** — scrittura, integrazione e collaudo di codice.

<!-- Se il rapporto è governato da un accordo quadro, cita qui la clausola che chiede una stima
delle giornate: è quello che rende il documento un obbligo che si adempie invece di una proposta
che si spinge. -->

| | **giornate** |
| :-- | :-: |
| **Fase 1 — \<nome\>** | **\<n\>** |
| Fase 2 — \<nome\> | \<n\> |
| **TOTALE SVILUPPO** | **\<n\>** |

> ⚠️ **Come si deriva il numero.** Due regole: una milestone di **sistema** vale **una giornata**;
> il **front-end** conta **mezza giornata per pagina**. Quindi: \<a\> giornate di sistema + \<b\>
> pagine × 0,5 = **\<totale\>**.
>
> ⚠️ **Non è una scadenza, ed è sforzo minimo.** Sono unità di valorizzazione, non un conteggio di
> ore e non un calendario. Dove una milestone prende più della sua giornata, la differenza è lavoro
> maturato, non una variazione di perimetro.
>
> ⚠️ **Le giornate decorrono da quando gli input esistono.** Analisi, design, copy e traduzioni
> stanno a monte di questo lavoro e non sono in questo numero. La data di go-live è la somma di due
> catene, e questo documento ne governa una.

<!-- FORMA SOLE GIORNATE — tieni questo capoverso, adattato, quando le tariffe si applicano alle
giornate maturate in un periodo e non a questo progetto:

> ⚠️ **Perché non c'è un importo.** Quello che si approva è la stima; la tariffa si applica dopo
> alle giornate maturate, un conteggio che appartiene al cliente e non a questo progetto. Le stesse
> giornate valgono importi diversi a seconda di quando maturano: metterci un totale significherebbe
> indovinarlo, e renderebbe questa stima non confrontabile con le altre. **Le giornate si
> confrontano, gli importi no.**

FORMA GIORNATE E IMPORTO — sostituiscilo con una riga di tariffa e un importo al netto dell'IVA, e
aggiungi la colonna dell'importo alla tabella qui sopra. -->

<!-- FACOLTATIVO — solo quando una decisione aperta cambia il totale. Dichiara se le variabili sono
indipendenti: due che si compongono non vanno presentate come se si sommassero. -->

| Scenario | | giornate |
| :-- | :-- | :-: |
| **\<A\>** | \<cosa significa, in una riga\> | **\<n\>** |
| **\<B\>** | \<cosa significa, in una riga\> | **\<n\>** |

---

## 1. Base di calcolo

| | |
| --- | --- |
| **Unità di stima** | la **giornata** |
| Definizione di giornata | un'unità convenzionale di valorizzazione, non un conteggio di ore |
| Calibrazione | **sforzo minimo**, con forte leva di sviluppo assistito: nessun intoppo, nessun rework, nessun contingency |
| Granularità | sistema: **1 giornata per milestone** · front-end: **0,5 giornate per pagina** |
| Dettaglio operativo | `docs/ROADMAP.md` — \<n\> milestone, \<m\> sotto-task con checklist |

## 2. Fuori perimetro

<!-- Nomina le esclusioni esplicitamente, comprese quelle che nessuno ha chiesto: sono le voci che
si invitano da sole più avanti, e dichiararle adesso non costa niente. -->

Analisi funzionale · design UI/UX e design system · copy e traduzioni · formazione del cliente ·
popolamento dei contenuti · costi ricorrenti di hosting, database, email e dominio · manutenzione e
assistenza dopo il go-live.

## 3. Costo per milestone

<!-- Rispecchia docs/ROADMAP.md, una riga per milestone. Se i due divergono, vince la roadmap. -->

| # | Milestone | Natura | giornate |
| --- | --- | :-- | :-: |
| 1 | Fondamenta | sistema | 1 |
| | **FASE 1 — \<nome\>** | | **\<n\>** |
| | **TOTALE** | | **\<n\>** |

### Le \<n\> pagine di front-end

Mezza giornata ciascuna. Sono **template, non contenuti**: pagine che condividono un layout contano
una volta sola.

<!-- Elencale. Poi tieni la frase qui sotto: è la concessione che costa meno in tutto il documento,
ed evita la discussione dopo. -->

Se la sitemap definitiva aggiunge o toglie pagine, il totale si muove di **mezza giornata per
pagina**.

## 4. Variabili aperte

<!-- Un blocco per ogni decisione non risolta che cambia il numero, ciascuna col suo delta in
giornate e le milestone su cui ricade. Una variabile senza numero è una curiosità; una col numero è
una decisione che il cliente può davvero prendere.

Dove il lavoro è di quel tipo in cui «plausibile» e «corretto» si assomigliano — concorrenza,
denaro, imposte, webhook idempotenti — dillo qui, nel documento. Lo sviluppo assistito comprime la
scrittura, non la verifica, ed è esattamente lì che un pavimento a contingency zero è meno
credibile. Dirlo prima è una circostanza qualificata; dirlo dopo è una scusa. -->

# Blueprint dei documenti commerciali

Impalcature dei due documenti che si scrivono **prima** che un progetto sia approvato, e che una
volta scritti restano **fuori dal controllo di versione**.

## Perché stanno qui e non come `docs/ESTIMATE.md`

`.gitignore` esclude `docs/ESTIMATE.md`, `docs/MEETING-*.md` e `docs/*.pdf`: il repo traccia quello
che si costruisce, non quello che si preventiva. Un'impalcatura consegnata a quei percorsi sarebbe
quindi ignorata e non arriverebbe mai in un progetto nuovo. Tenerla sotto un percorso tracciato è
ciò che la fa viaggiare.

## Uso

```sh
cp docs/proposal-templates/estimate.md docs/ESTIMATE.md
cp docs/proposal-templates/meeting.md  docs/MEETING-$(date +%F).md
```

Poi si genera il PDF che viene davvero mandato:

```sh
md2pdf docs/ESTIMATE.md docs/Stima-<progetto>-<data>.pdf
```

## L'accoppiata che non deve divergere

| Documento | Tracciato | Destinatario | Contiene |
|---|:-:|---|---|
| `docs/ROADMAP.md` | ✅ | chi implementa | milestone, sotto-task, **giornate** |
| `docs/ESTIMATE.md` | ❌ | chi paga | le stesse giornate, argomentate |
| `docs/MEETING-<data>.md` | ❌ | **nessuno tranne te** | cosa chiedere, e in che ordine |

`ESTIMATE.md` è **derivato da** `ROADMAP.md`, mai scritto prima. Se i due non concordano su un
numero, ha ragione la roadmap e la stima è vecchia.

`MEETING-*.md` è interno per costruzione: porta la cifra da tenere in tasca accanto a quella sul
tavolo. Non si condivide, non si allega, non si incolla in una mail.

## Cosa decide la forma della stima

Due forme, e la sceglie il destinatario:

- **solo giornate** — un cliente che opera sotto un accordo quadro, dove le tariffe si applicano
  alle giornate maturate in un periodo e non a questo progetto. Metterci un totale significherebbe
  indovinarlo, e renderebbe la stima non confrontabile con le altre.
- **giornate e importo** — un cliente diretto, che compra un lavoro e non un'unità di
  valorizzazione.

L'impalcatura le porta entrambe: si cancella quella che non si applica. Le tariffe vivono fuori da
questo repo.

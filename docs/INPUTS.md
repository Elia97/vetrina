# Input attesi — accessi, dati e materiali

> **Che cosa ci manca, da chi lo aspettiamo, e che cosa si ferma se non arriva.**
>
> Non è un doppione di `docs/DECISIONS.md`: lì si aspetta **una scelta**, qui **una consegna**. Una
> decisione la prende qualcuno in cinque minuti; un input o c'è o non c'è, e chi lo deve produrre
> spesso non sa che qualcuno lo sta aspettando.
>
> **Le due colonne di data sono il motivo per cui questo file esiste.** Se a fine progetto si
> discute di chi ha fatto slittare cosa, questo è il documento — e vale solo se le date le ha
> scritte qualcuno mentre succedeva.
>
> Legenda: 🔴 blocca lavoro già pianificato · ➕ non era nella checklist mandata al cliente.

## Cruscotto — quelli che bloccano

| Input | Da | Chiesto | Atteso | Arrivato | Blocca |
| :-- | :-- | :-: | :-: | :-: | :-- |
| 🔴 **<che cosa>** | <chi> | — | — | — | <la milestone o la issue> |

Le date si compilano **quando si chiede**, non quando arriva: una cella vuota nella colonna
«Chiesto» significa che nessuno l'ha ancora domandato, ed è un'informazione diversa da un ritardo.

---

# La checklist, completata

<!-- Una sezione per area, ognuna intestata a chi deve consegnare. Le aree ricorrenti:
sito e infrastruttura (domini, DNS, hosting), pagamenti, analytics e marketing, gestionale e
commerciale, materiali (testi, immagini, marchio), e gli input che non vengono dal cliente ma
da noi — intestazione degli account, trasferimento del repo, secret della CI. -->

## Come si tiene aggiornato

Una riga cambia stato **due volte**: quando la si chiede e quando arriva. In mezzo non si tocca —
e se resta ferma troppo a lungo, quello è il dato che serve.

Quando un input arriva, la sua riga esce da qui e il fatto entra dove serve: un dato in
`docs/ROADMAP.md`, una scelta in `docs/DECISIONS.md`, un accesso nel gestore delle credenziali.
**Le credenziali non si scrivono in questo file** — qui si scrive che sono arrivate.

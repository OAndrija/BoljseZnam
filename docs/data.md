# Data

V tem dokumentu je opisano na kak način aplikacija hrani podatke o nalogah (z NPZ-jev).

## Struktura mape

Mapa `data` vsebuje podatke o nalogah (z NPZ-jev) v formatu JSON.

V njem se nahajata mapa `problems` in mapa `resources`.

Mapa `problems` vsebuje opise posamičnih nalog. V eni datoteki se nahaja ena naloga (Če je naloga sestavljena iz večih vprašanj so vsa vprašanja v tej datoteki). Datoteke so poimenovane po naslednjem principu:

`<predmet>-<leto>-<stevilka naloge>.json`

Primer:

`KEM-2022-05.json`

Mapa `resources` predvidoma vsebuje slike, v kolikor ima katera od nalog priloženo sliko. Drugih vrst vsebin za enkrat ni predidenih.

V mapi `data` se nahaja še datoteka `index.json`, ki vsebuje metapodatke o posamezni nalogi. **Za enkrat strukture ni definirana.**

## Struktura datotek

Posamezna datoteka, ki predstavlja nalogo, ima sledečo strukturo:

```json
{
    // Nekaj podvojenih metapodatkov. Bi se to obdržalo?
    "subject": "<identifikator predmeta>",
    "year": <leto>,
    "id": <stevilka naloge>,

    "prompt": "<Besedilo, ki se nanaša na celotno nalogo, v kolikor je sestavljena iz večih delov.>",
    "resources": [ "<poti do slik, tabel, ki se nanašajo na celotno nalogo>"...] 

    // kategorije še niso določene, predvidoma glede na poglavje, kamor vprašanje spada
    "categories": [ <kategorija>... ], 
    // če je vprašanj več se predpostavi označevanje z zaporednimi črkami abecede, torej a), b), c)...
    "questions": [
        <questions>...
    ]

}
```

Posamezno vprašanje je lahko tipa `multiple-choice` ali `essay`. Računske naloge štejejo kot tip `essay`, odgovori se avtomatsko ne preverjajo.

Struktura vprašanja tipa `multiple-choice` je sledeča:

```json
{
    "type": "multiple-choice",
    "prompt": "<besedilo naloge>",
    "resources:": [ <ime datoteke>... ],
    "choices": [
        "prvi odgovor",
        "drugi odgovor",
        "tretji odgovor",
        "četrti odgovor"
    ],
    "answer": [ <answer_id>... ] // pravilnih odgovorov je lahko več, po vrsti so številčeni od 0 naprej
}
```

Struktura vprašanja tipa `essay` je sledeča:

```json
{
    "type": "essay",
    "prompt": "<besedilo naloge>",
    "resources:": [ <ime datoteke>... ],
    "answer": "<primer pravilnega odgovora>"
}
```


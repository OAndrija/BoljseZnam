# Data

V tem dokumentu je opisano na kak način aplikacija hrani podatke o nalogah (z NPZ-jev).

## Struktura mape

Mapa `data` vsebuje podatke o nalogah (z NPZ-jev) v formatu JSON.

V njem se nahajata mapa `problems` in mapa `resources`.

Mapa `problems` vsebuje opise posamičnih nalog. V eni datoteki se nahaja ena naloga (Če je naloga sestavljena iz večih vprašanj so vsa vprašanja v tej datoteki). Datoteke so poimenovane po naslednjem principu:

`<predmet>-<leto>-<stevilka naloge>.json`

Primer:

`KEM-2022-05.json`

Mapa `resources` predvidoma vsebuje slike, v kolikor ima katera od nalog priloženo sliko. Drugih vrst vsebin za enkrat ni predidenih. V nalogi se na sliko sklicuješ samo z imenom datoteke (npr. `"resources": ["KEM-2022-05-graf.png"]`), aplikacija jo naloži iz mape `resources`.

Datoteke `index.json` ni treba vzdrževati: aplikacija ob zagonu sama prebere vse datoteke v mapi `problems` in iz imen datotek ter vsebine sestavi seznam nalog (predmet, leto, številka, poglavja, vrste vprašanj).

V mapi `data` se nahaja še datoteka `categories.json` s seznamom poglavij. Identifikator poglavja se uporablja v polju `categories` posamezne naloge:

```json
[
    { "id": "kisline-baze-soli", "name": "Kisline, baze in soli" },
    ...
]
```

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

    // identifikatorji poglavij iz data/categories.json
    "categories": [ <kategorija>... ], 
    // če je vprašanj več se predpostavi označevanje z zaporednimi črkami abecede, torej a), b), c)...
    "questions": [
        <questions>...
    ]

}
```

Posamezno vprašanje je lahko tipa `multiple-choice`, `numeric` ali `essay`. Odgovori tipa `multiple-choice` in `numeric` se preverijo samodejno, pri tipu `essay` pa uporabnik svoj odgovor primerja s primerom rešitve.

Vsa vprašanja imajo lahko še dve neobvezni polji:

- `"hint"`: namig, prikazan pod vprašanjem,
- `"explanation"`: razlaga, prikazana po preverjanju odgovora.

Struktura vprašanja tipa `multiple-choice` je sledeča:

```json
{
    "type": "multiple-choice",
    "prompt": "<besedilo naloge>",
    "resources": [ <ime datoteke>... ],
    "choices": [
        "prvi odgovor",
        "drugi odgovor",
        "tretji odgovor",
        "četrti odgovor"
    ],
    "answer": [ <answer_id>... ] // pravilnih odgovorov je lahko več, po vrsti so številčeni od 0 naprej
}
```

Struktura vprašanja tipa `numeric` (računska naloga s številskim rezultatom) je sledeča:

```json
{
    "type": "numeric",
    "prompt": "<besedilo naloge>",
    "resources": [ <ime datoteke>... ],
    "label": "m(NaCl)",          // neobvezno, oznaka pred poljem za odgovor
    "answer": 10,                // pravilen rezultat
    "unit": "g",                 // neobvezno, pravilna enota
    "units": ["g", "mg", "kg"],  // neobvezno, enote za izbiro; privzeto samo "unit"
    "tolerance": 0.05            // neobvezno, dovoljeno absolutno odstopanje
}
```

Računske naloge, kjer rezultat ni eno število, so še vedno tipa `essay`.

Struktura vprašanja tipa `essay` je sledeča:

```json
{
    "type": "essay",
    "prompt": "<besedilo naloge>",
    "resources": [ <ime datoteke>... ],
    "answer": "<primer pravilnega odgovora>"
}
```


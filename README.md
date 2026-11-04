# BoljšeZnam

Namizna aplikacija za vadbo za **NPZ iz kemije** (9. razred). Učenec rešuje prave naloge s preteklih NPZ-jev, aplikacija pa beleži njegov napredek.

Projekt pri predmetu *Razvoj in upravljanje programskih sistemov* (Naloga 1).

## Kaj aplikacija omogoča

- **Naloge po poglavjih:** vadba izbranega poglavja.
- **Celoten NPZ:** reševanje celotnih preizkusov iz let 2015, 2018, 2022 in 2026.
- **Poimenuj spojino:** poimenovanje naključno generiranih organskih spojin.
- **Uredi reakcijo:** dopolnjevanje koeficientov v kemijskih enačbah.
- **Napredek:** XP, stopnje, dosežki, niz dni vadbe in zgodovina rešenih nalog.

Aplikacija deluje brez internetne povezave.

## Prenos

Zadnjo različico aplikacije prenesete na strani **[Releases](https://github.com/OAndrija/BoljseZnam/releases/latest)**. Pod razdelkom *Assets* izberite datoteko za svoj sistem:

| Sistem | Datoteka | Namestitev |
| --- | --- | --- |
| Windows | `BoljseZnam-…-Setup.exe` | Zaženite datoteko. Aplikacija se namesti in odpre sama. |
| Ubuntu / Debian | `boljseznam_…_amd64.deb` | `sudo apt install ./boljseznam_…_amd64.deb` |
| Fedora | `boljseznam-….x86_64.rpm` | `sudo dnf install ./boljseznam-….x86_64.rpm` |
| macOS | `BoljseZnam-darwin-….zip` | Razširite arhiv in premaknite aplikacijo v mapo *Applications*. |

Aplikacija ni digitalno podpisana, zato vas Windows ali macOS ob prvem zagonu morda opozori. Na Windowsih kliknite *Več informacij* → *Vseeno zaženi*. Na macOS z desnim klikom na aplikacijo izberite *Odpri*.

## Tehnologije

Electron, React, TypeScript, Vite, SQLite. Testi so napisani v Vitestu in Playwrightu.

## Zagon

Potrebujete [Node.js](https://nodejs.org/) 22 ali novejši.

```bash
git clone https://github.com/OAndrija/BoljseZnam.git
cd BoljseZnam
npm install
npm start
```

## Testi

```bash
npm test            # enotni testi
npm run package     # zgradi aplikacijo (potrebno za E2E teste)
npm run test:e2e    # E2E testi
```

## Izdelava namestitvenega paketa

```bash
npm run make
```

Paketi se ustvarijo v mapi `out/make/` (`.deb` in `.rpm` za Linux, `.exe` za Windows, `.zip` za macOS).

## Struktura projekta

| Mapa | Vsebina |
| --- | --- |
| `src/main/` | glavni proces Electrona (branje nalog, baza) |
| `src/renderer/` | uporabniški vmesnik (React) |
| `data/` | naloge NPZ v formatu JSON in slike |
| `tests/`, `e2e/` | testi |
| `docs/` | dokumentacija |
| `npzparse/` | orodje za pretvorbo PDF-jev NPZ v JSON |

Format nalog je opisan v [`docs/data.md`](docs/data.md), shranjevanje napredka pa v [`docs/userdata.md`](docs/userdata.md).
# Uporabniški podatki

Napredek je shranjen v SQLite datoteki `boljseznam/progress.sqlite` pod
Electronovo uporabniško mapo (`app.getPath('userData')`). Bazo ustvari glavni
proces ob zagonu aplikacije. `PRAGMA user_version` je trenutno `1`.

## Tabele

- `user_data`: ena vrstica z `id = 1`, skupnim XP in tedenskim ciljem.
- `history`: en zapis za vsak preverjen poskus posamezne naloge. Podvprašanja
  NPZ se ocenijo skupaj. Preskočene naloge nimajo zapisa. `local_day` je dan
  preverjanja v lokalnem časovnem pasu in se uporablja za niz dni vadbe.
- `drafts`: trenutno stanje vaj, vključno z odgovori in izbrano nalogo. Stanje
  je shranjeno kot JSON z različico zapisa.

Ponovitev iste naloge ustvari nov zapis zgodovine in lahko ponovno prinese XP.
Ponovna ocena eseja posodobi isti poskus; XP se popravi v isti transakciji.
Pri brisanju zgodovine se skupni XP ponastavi, osnutki pa ostanejo shranjeni.

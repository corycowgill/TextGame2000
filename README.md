# The Last Will of Ashvale

A Gothic, Zork-flavored parser adventure that runs in the browser. No build
step. Just open `index.html`.

> *It is the autumn of 1888. You are Dr. Alistair Vance, paranormal investigator,
> summoned by telegram to a fog-bound estate on the Yorkshire moors to settle
> the disputed will of the late Lord Edmund Ashvale. The household is empty.
> Only the dead remain.*

## Run it

The game is plain HTML/CSS/JS using ES modules, so it needs to be served over
HTTP (browsers reject ES modules over `file://`):

```sh
python3 -m http.server 8000
# then open http://localhost:8000/
```

Tested on recent Chrome, Firefox, and Safari. Save/load uses `localStorage`.

## What's in it

The full game is here: 24 rooms across six regions, four restless ghosts, one
murder to solve.

- **Arrival & Drawing Floor.** Find Edmund's body in the study; unlock his
  drawer; recover the burnt will fragment naming his solicitor as the
  unintended heir.
- **East Wing.** Identify the toxin in Cassandra's teacup; release her with
  a sprig of monkshood. Recovers the **Teacup Token** and the first initial.
- **West Wing.** Examine the four family portraits; push Edmund's askew frame
  to reveal a panelled passage. Read Julien's diary, take the silver letter
  opener engraved with R. Recovers the **Letter-Opener Token**.
- **Upstairs.** Cut the crepe across the stair (silver letter opener does it),
  test the rotten balcony before crossing, wind a music box, open a locket,
  show it to Beatrice. Recovers the **Locket Token** and the third initial.
- **Cellar.** Pry the foyer's barred latch with a crowbar, descend into the
  dark (lamp required, or the cat for company), route the boiler's steam to
  the coal chute to thaw an ice-sealed door, and recover Hollis's brass watch.
  Recovers the **Pocket-Watch Token** and the fourth initial.
- **Crypt & Chapel.** With all four tokens, the foyer's grandfather clock
  opens. Place the tokens, light the candles, and `say` the killer's full
  name to break the curse — or name the wrong man, and the manor takes you.

## Commands

The parser handles `verb noun [prep noun]`, abbreviations, articles, and `it`.

| Category   | Commands |
|------------|----------|
| Movement   | `north`/`n`, `south`/`s`, `east`/`e`, `west`/`w`, `up`, `down`, `ne`, `nw`, `se`, `sw`, `enter <thing>`, `exit`, `climb`, `go <dir>` |
| Look       | `look`/`l`, `examine <X>`/`x <X>`, `read <X>`, `listen`, `smell` |
| Search     | `search <X>` — find things hidden on bodies, in drawers, vanities, wardrobes |
| Items      | `take <X>`/`get <X>`/`pick up <X>`, `take all`, `drop <X>`, `inventory`/`i` |
| Use        | `use <X>`, `use <X> on <Y>`, `light <X>`, `extinguish <X>`, `unlock <X> with <Y>`, `open`/`close`/`push`/`pull`/`turn <X>`, `break <X> with <Y>`, `wind <X>`, `play <X>`, `show <X> to <Y>`, `give <X> to <Y>` |
| Talk       | `talk to <NPC>`, `ask <NPC> about <topic>`, `tell <NPC> about <topic>`, `say <word>`, `knock`, `feed <NPC>` |
| Save       | `save [slot]`, `load [slot]`, `restart` (auto-saves to slot `auto` on milestones) |
| Meta       | `wait`/`z`, `again`/`g`, `exits`, `help`, `hint`, `notebook`, `map`, `score`, `quit` |

The input box supports **up/down arrow** for command history, **Tab** to
autocomplete the word you're typing (cycles through matches on repeat), and
**Esc** to clear the field. Item and NPC names in room listings are
**underlined and clickable** — click any of them to examine that thing. Use
`brief` to get short descriptions on revisits, `verbose` to switch back.

## Scoring

The game tracks a hidden score (max ~130). Points come from:

- 20 per spirit-token recovered
- 5 per ghost laid to rest cleanly
- 3–5 per optional discovery (reading the right thing, finding the cat's name,
  searching the vanity for Edmund's wedding ring, reading the green-cloth
  book in the library, etc.)
- 10 for breaking the curse

`score` shows the running total + your current rank. Three ending variants
trigger at the chapel based on score: *Pristine* (≥110), *Adept Investigator*
or *Competent* (60–109), and *Earnest* (<60). The cleaner your run, the
warmer the manor's farewell.

Refer back to the most recent noun with `it`.

## Stuck?

`hint` always tells you the next step. `notebook` shows what you've found and
what initials you've collected. `map` opens a graphical map (Cytoscape.js,
loaded on demand from a CDN — falls back to inline SVG if the CDN is blocked)
with your current room highlighted. `exits` lists where you can go.

If you die, the game auto-saves at every milestone (each new room, each token
recovered). After a death, `load auto` puts you back at your last milestone;
`restart` begins again from the gate.

## Tests

Headless playthrough tests live in `test/`. Run them from the repo root with
`node test/e2e.mjs` and `node test/e2e_loss.mjs`. See `test/README.md` for
details.

## Project layout

```
index.html             Terminal shell
styles.css             Gas-lamp aesthetic
src/main.js            Boot + DOM event wiring
src/engine.js          State, command dispatch, save/load
src/parser.js          Tokenizer, synonym map, disambiguation
src/render.js          DOM I/O helpers
src/data/rooms.js      Room definitions
src/data/items.js      Items + interactions
src/data/npcs.js       NPCs + dialogue trees
src/data/clues.js      Hints, notebook entries, killer-name letters
```

Every room is a plain object with `exits`, `contents`, optional `onEnter` and
`onCommand` hooks. Items and NPCs likewise. Adding a new region is a matter of
appending objects to those data files; the engine is data-driven.

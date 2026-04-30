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

## Status

This is being built in chunks. The currently shipped slice:

- **Region 0 — Arrival & Drawing Floor** is fully playable end-to-end. You can
  enter the manor, search Edmund, unlock his desk drawer, recover the household
  keyring and the burnt will fragment, talk to Mrs. Crow, befriend the cat.
- The four wings (East/West/Upstairs/Cellar) and the Crypt/Chapel finale are
  sealed for now — coming in subsequent chunks.

## Commands

The parser handles `verb noun [prep noun]`, abbreviations, articles, and `it`.

| Category   | Commands |
|------------|----------|
| Movement   | `north`/`n`, `south`/`s`, `east`/`e`, `west`/`w`, `up`, `down`, `ne`, `nw`, `se`, `sw`, `enter <thing>`, `exit`, `climb`, `go <dir>` |
| Look       | `look`/`l`, `examine <X>`/`x <X>`, `read <X>`, `search <X>`, `listen`, `smell` |
| Items      | `take <X>`/`get <X>`/`pick up <X>`, `take all`, `drop <X>`, `inventory`/`i` |
| Use        | `use <X>`, `use <X> on <Y>`, `light <X>`, `extinguish <X>`, `unlock <X> with <Y>`, `open`/`close`/`push`/`pull`/`turn <X>`, `break <X> with <Y>`, `wind <X>`, `play <X>`, `show <X> to <Y>`, `give <X> to <Y>` |
| Talk       | `talk to <NPC>`, `ask <NPC> about <topic>`, `tell <NPC> about <topic>`, `say <word>`, `knock`, `feed <NPC>` |
| Save       | `save [slot]`, `load [slot]`, `restart` |
| Meta       | `wait`/`z`, `again`/`g`, `help`, `hint`, `notebook`, `score`, `quit` |

Refer back to the most recent noun with `it`.

## Walkthrough hints (Region 0)

If you get stuck:

```
read telegram          (sets the scene)
n  e  x window  open window  n  read letter
n  feed cat  w  w  read slate  ask crow about will  ask crow about dredge
e  e  e  search edmund  unlock drawer with fob  take keyring  take will  read will
notebook
```

By the time you finish that path, your notebook should hint at *who* the killer
is. The four wings will add the rest of his name and the means by which to
prove it.

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

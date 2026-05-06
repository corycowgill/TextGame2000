// Region 0: Arrival & Drawing Floor (Chunk A — minimum playable skeleton).
// Rooms are plain data objects. Optional hooks: onEnter(state), onCommand(state, cmd).
// Items, NPCs, exits resolve by id at runtime.

export const ROOMS = {
  iron_gate: {
    id: "iron_gate",
    name: "The Iron Gate",
    short: "An iron gate before a fog-bound manor.",
    long:
      "Wrought iron gates stand half-open before you, the Ashvale crest weeping orange rust " +
      "into the lichen on the gate-piers. Beyond, a gravel drive curves north through fog " +
      "toward the great house — black-windowed, silent, every chimney cold. The coachman's " +
      "lantern is already a small orange dot on the moor road; the sound of his horses came " +
      "back once on the wind, and then was swallowed. A wet smell rises from the box hedges: " +
      "yew, wet stone, and something older that you cannot place. You will not be welcomed " +
      "here, but you may yet be admitted.",
    exits: { north: "front_door", south: null, east: "garden", west: null },
    contents: ["telegram"],
  },

  front_door: {
    id: "front_door",
    name: "Before the Front Door",
    short: "Locked black-oak doors under a carved stone porch.",
    long:
      "A pair of black-oak doors loom under a stone porch, its lintel carved with grotesques " +
      "whose faces the rain has worn nearly smooth. The brass knocker is shaped like a fox " +
      "biting its own tail, polished by older hands than yours to a sullen gleam. The doors " +
      "are locked from within — and not casually; the lock has been turned and the bolts " +
      "thrown. A gravel path leads east around the house toward an overgrown garden; south, " +
      "the drive runs back to the gate.",
    exits: { south: "iron_gate", east: "garden" },
    contents: [],
    onCommand(state, cmd) {
      if (cmd.verb === "knock") {
        return "You knock. The fox-headed knocker rings hollowly through empty halls. No one answers — but somewhere inside, a clock chimes the half-hour.";
      }
      if (cmd.verb === "open" && (cmd.noun === "door" || cmd.noun === "doors" || cmd.noun === "front door")) {
        return "The front doors are locked, and they are not the kind of locks a paranormal investigator picks at a porch in plain view.";
      }
      return null;
    },
  },

  garden: {
    id: "garden",
    name: "The Overgrown Garden",
    short: "A weed-choked garden, thorned, against the east wall.",
    long:
      "Roses gone to thorn and bramble crowd the east face of the manor, their last wet " +
      "petals lying brown on the path like spent matches. A drawing-room window stands here, " +
      "its leaded sash crooked in its frame and the catch broken — with a little force it " +
      "could be opened, or with less, broken. A loose stone the size of a man's fist sits at " +
      "the path's edge, where a gardener's boot once kicked it. The front of the house lies " +
      "west; gravel paths circle further east into the hedge maze, but those wrought-iron " +
      "gates have been bound shut from inside with twists of wire.",
    exits: { west: "front_door", north: "drawing_room_via_window", east: null },
    contents: ["loose_stone", "garden_window"],
    onCommand(state, cmd) {
      if (cmd.verb === "open" && cmd.noun && cmd.noun.includes("window")) {
        if (state.flags.windowOpened) return "The window is already open.";
        state.flags.windowOpened = true;
        return "You force the broken catch and slide the sash up. Cold, dust-smelling air sighs out of the manor.";
      }
      if (cmd.verb === "break" && cmd.noun && cmd.noun.includes("window")) {
        if (state.flags.windowOpened) return "The window is already open — no need to break it.";
        if (!state.inventory.includes("loose_stone")) {
          return "You'd need something heavy to break it with.";
        }
        state.flags.windowOpened = true;
        return "You strike the pane with the loose stone. Glass falls inward with a clatter that the fog seems to swallow whole.";
      }
      return null;
    },
  },

  // Pseudo-room: entering the window from the garden lands you in the drawing room.
  drawing_room_via_window: {
    id: "drawing_room_via_window",
    name: "Through the Window",
    short: "Climbing through the broken window.",
    long: "",
    exits: { south: "garden", north: "drawing_room" },
    onEnter(state) {
      if (!state.flags.windowOpened) {
        // Refuse and bounce back.
        return { redirect: "garden", message: "The window is shut. Try opening or breaking it first." };
      }
      return { redirect: "drawing_room", silent: true };
    },
  },

  drawing_room: {
    id: "drawing_room",
    name: "The Drawing Room",
    short: "A drawing room of shrouded furniture and a cold grate.",
    long:
      "Furniture stands shrouded in dust-cloths like a congregation of mourners, the shapes " +
      "beneath them only suggesting chairs, only suggesting a pianoforte. The grate is full " +
      "of cold ash; a half-burnt log lies at the centre, charred to the shape of a fist. A " +
      "crystal decanter on the sideboard catches what little light there is and throws it " +
      "back in narrow, watery threads. A sealed letter waits on the mantel, propped against " +
      "the carriage clock with a deliberation that feels recent. Doorways open north into " +
      "the foyer and south back to the broken window.",
    exits: { north: "foyer", south: "garden_window_back" },
    contents: ["decanter", "sealed_letter"],
  },

  garden_window_back: {
    id: "garden_window_back",
    name: "The Window",
    short: "Climbing back through the window.",
    long: "",
    exits: { north: "drawing_room", south: "garden" },
    onEnter() {
      return { redirect: "garden", silent: true };
    },
  },

  foyer: {
    id: "foyer",
    name: "The Foyer",
    short: "The grand foyer of Ashvale Manor — chandeliered, cold.",
    long(state) {
      const base =
        "A black-and-white tiled floor stretches beneath a chandelier furred grey with " +
        "cobweb, its candles long since drowned in their own wax. A tall grandfather clock " +
        "keeps watch in the corner — its tick is slow, almost grudging, as if it had grown " +
        "tired of measuring time in this house. The air carries cold beeswax and colder " +
        "lavender. Doorways lead south to the drawing room, west to the dining room, and " +
        "east toward Edmund's study.";
      const stairs = " The stair up to the bedrooms is roped off with black mourning crepe, knotted three times. The cellar door down is barred from this side, an iron nail driven through the latch.";
      const east = state.flags.eastSealBroken
        ? " The east wing doors stand open — their wax seal lies in fragments on the tiles."
        : " A heavy double-door east-northeast bears a black wax seal: 'BY ORDER OF THE EXECUTOR — DO NOT BREAK.'";
      const west = state.flags.westSealBroken
        ? " The west wing doors stand open — their seal broken."
        : " A second sealed door, west-northwest, bears a matching seal.";
      return base + stairs + east + west;
    },
    exits: {
      south: "drawing_room",
      west: "dining_room",
      east: "study",
      northeast: "east_corridor",
      northwest: "west_corridor",
      up: "landing",
      down: "cellar_stair",
    },
    contents: ["grandfather_clock", "black_cat"],
    onCommand(state, cmd) {
      if (cmd.verb === "up" || cmd.verb === "climb") {
        if (!state.flags.crepeCut) {
          return "Black crepe has been tied across the stair, knotted thrice. Bare hands will not undo it tonight; you will need a blade.";
        }
        return null; // fall through to direction handler -> exits.up
      }
      if (cmd.verb === "cut" || (cmd.verb === "break" && cmd.noun && cmd.noun.includes("crepe"))) {
        if (state.flags.crepeCut) return "The crepe is already cut.";
        const noun = (cmd.noun || "").toLowerCase();
        if (!noun.includes("crepe") && !noun.includes("rope") && !noun.includes("ribbon")) return null;
        const hasOpener = state.inventory.includes("silver_letter_opener");
        if (!hasOpener) return "You have nothing sharp enough to cut it cleanly. (A blade would do.)";
        state.flags.crepeCut = true;
        return "You draw the silver letter opener through the crepe. It parts with a small, mournful breath. The stair is yours.";
      }
      if (cmd.verb === "down") {
        if (state.flags.cellarOpened) return null; // pass through to direction handler
        return "The cellar door is barred from this side — a single iron nail driven through the latch. You'd need a crowbar.";
      }
      if (cmd.verb === "pry") {
        const noun = (cmd.noun || "").toLowerCase();
        const sec = (cmd.secondNoun || "").toLowerCase();
        const wantsLatch = noun.includes("latch") || noun.includes("nail") || noun.includes("door") || noun.includes("cellar");
        if (!wantsLatch) return null;
        if (state.flags.cellarOpened) return "The cellar door is already open.";
        const hasCrow = state.inventory.includes("crowbar") || sec.includes("crow") || sec.includes("bar");
        if (!hasCrow || !state.inventory.includes("crowbar")) return "You'd need an iron crowbar.";
        state.flags.cellarOpened = true;
        return "You set the crowbar against the nail and lean. Wood squeals; iron grinds; the latch comes free with a small spray of rust. The cellar door swings inward onto a darkness that smells of coal and ice.";
      }
      if (cmd.verb === "northeast") {
        if (state.flags.eastSealBroken) return null; // fall through to engine, but no exit defined; see redirect below
        return "The east wing door is sealed with executor's wax. You'd need authority — or evidence the executor is a liar — to break it.";
      }
      if (cmd.verb === "northwest") {
        if (state.flags.westSealBroken) return null;
        return "The west wing door is sealed with executor's wax. You'd need authority — or evidence the executor is a liar — to break it.";
      }
      // Grandfather-clock secret door: opens once all four tokens recovered.
      if ((cmd.verb === "open" || cmd.verb === "enter") && cmd.noun && cmd.noun.includes("clock")) {
        if (state.tokensCollected.length < 4) {
          return "The clock-case is solid and unyielding. Something in it expects all four spirits to have spoken first.";
        }
        return {
          __move: "crypt_stair",
          message: "The clock-case sighs open as if it had been waiting for you. A stair winds down into stone — colder than any cellar, older than any wing of the house.",
        };
      }
      // Seal-breaking: requires having read the burnt will fragment.
      if (cmd.verb === "break" && cmd.noun && cmd.noun.includes("seal")) {
        if (!state.flags.readWillFragment) {
          return "The executor's seals carry the law's weight. To defy them you'll need evidence — proof in your hand — that the executor is a forger.";
        }
        const which = (cmd.noun || "").toLowerCase();
        const isEastReq = which.includes("east");
        const isWestReq = which.includes("west");
        // No qualifier => break whichever is still intact, east first.
        const wantEast = isEastReq || (!isWestReq && !state.flags.eastSealBroken);
        const wantWest = isWestReq || (!isEastReq && state.flags.eastSealBroken && !state.flags.westSealBroken);
        if (wantEast && !state.flags.eastSealBroken) {
          state.flags.eastSealBroken = true;
          return "You press a thumb to the east wing seal. With the burnt will in your other hand, the gesture has a kind of authority. The wax cracks; the doors fall open.";
        }
        if (wantWest && !state.flags.westSealBroken) {
          state.flags.westSealBroken = true;
          return "You press your other thumb to the west wing seal. The wax cracks like old bread; the doors fall open onto a wallpapered dark.";
        }
        return "That seal is already broken.";
      }
      return null;
    },
  },

  // ---------------- Region 1: East Wing ----------------

  east_corridor: {
    id: "east_corridor",
    name: "The East Corridor",
    short: "A long corridor of peeling damask wallpaper.",
    long:
      "A long corridor where the green damask wallpaper is peeling in slow curls, like skin " +
      "off something that died standing. A portrait of Lady Cassandra Ashvale hangs at the " +
      "far end in a heavy gilt frame; her painted gaze finds you no matter where you stand " +
      "on the runner, and the runner itself muffles your boots in a way that feels less " +
      "like fabric and more like courtesy. North-east the conservatory shows green through " +
      "its glass; east, a paved path leads out into the hedge maze. The foyer lies south-west.",
    exits: {
      southwest: "foyer",
      northeast: "conservatory",
      east: "hedge_maze",
    },
    contents: ["cassandra_portrait"],
  },

  conservatory: {
    id: "conservatory",
    name: "The Conservatory",
    short: "A glass-domed conservatory, rain-streaked and choked with green.",
    long:
      "Iron arches hold up panels of green-stained glass, and rain has been falling on the " +
      "dome for so long that you cannot tell where the rain ends and the room begins. The " +
      "floor is laid in black-and-white tiles slick with condensation; ferns weep from " +
      "brass urns onto a lead drip-tray. Three rare specimens stand on plinths around a " +
      "wrought-iron tea table, each labelled in a fine, unsteady hand. On the table itself: " +
      "a delicate teacup with a dark sediment at its bottom, untouched these many days; a " +
      "heavy botanical guide, splayed open as if the reader had been called away mid-page. " +
      "The corridor lies south-west.",
    exits: { southwest: "east_corridor" },
    contents: ["teacup", "botanical_guide", "foxglove", "monkshood_plant", "hemlock", "cassandra_ghost"],
  },

  hedge_maze: {
    id: "hedge_maze",
    name: "The Hedge Maze",
    short: "Inside the hedge maze; yew towers on either hand.",
    long:
      "Yew hedges rise twice your height on either side, rain-beaded, their leaves so dark " +
      "they show as black in this grey light. The path branches confusingly, but there is " +
      "a recurring impression — almost a conviction — that all true paths bend inward. " +
      "Now and again you think you hear footsteps a hedge or two over, walking parallel; " +
      "when you stop, they stop with you. The corridor's door is to the west; the maze " +
      "opens outward, north, into a small stone clearing.",
    exits: { west: "east_corridor", north: "stone_folly" },
    contents: [],
  },

  stone_folly: {
    id: "stone_folly",
    name: "The Stone Folly",
    short: "A roofless Greek folly at the maze's heart.",
    long:
      "A miniature Greek folly stands at the maze's heart: four columns of weathered Portland " +
      "stone, no roof, a curved stone bench on which moss has begun a quiet career. At the " +
      "centre, a sundial. The sun has not been seen for some time, but the gnomon still does " +
      "its honest work; its shadow lies across the dial-face as if pointing at something it " +
      "does not wish to name. The hedge path leads back south.",
    exits: { south: "hedge_maze" },
    contents: ["sundial"],
  },

  dining_room: {
    id: "dining_room",
    name: "The Dining Room",
    short: "A long dining room with sixteen empty chairs.",
    long:
      "A long mahogany table, polished to the dull deep gleam of an old well, runs the " +
      "length of the room and is set for sixteen. The setting is complete and abandoned " +
      "mid-meal — knives placed, napkins folded, glasses filled at some point and now half-" +
      "empty, the wine gone the colour of a bruise. Wax has run down the candelabra in long " +
      "pale tongues onto the cloth. A fly that should have died with the season turns slow " +
      "circles above the centrepiece. A swing-door west leads to the servants' hall; the " +
      "foyer lies east.",
    exits: { east: "foyer", west: "servants_hall" },
    contents: ["candelabra"],
  },

  servants_hall: {
    id: "servants_hall",
    name: "The Servants' Hall",
    short: "A plain kitchen and servants' hall, cold-ranged.",
    long:
      "Copper pans hang in tidy ranks above a cold range; a kettle on the back hob has gone " +
      "the colour of slate. A chalk-slate leans on the deal table beside a pencil sharpened " +
      "to nothing. Bunches of dried sage and rosemary swing slowly above the door, though " +
      "there is no draught to move them. Mrs. Crow, the cook, sits very still in a wooden " +
      "chair with her hands folded in her lap — alive, you decide on a second look, though " +
      "she has not blinked since you arrived, and the apron on her knees has not stirred " +
      "even with her breath. The dining room lies east.",
    exits: { east: "dining_room" },
    contents: ["mrs_crow", "chalk_slate"],
  },

  study: {
    id: "study",
    name: "Edmund's Study",
    short: "Edmund's private study, gas-lit, occupied.",
    long:
      "A green-shaded reading lamp on the desk, its gas turned low, throws a bilious light " +
      "across the blotter and onto a wall of leather spines whose gilt lettering glints back " +
      "as though rationed. An ink-pot stands open; a steel-nibbed pen has been laid down " +
      "mid-sentence on a half-finished letter. Lord Edmund Ashvale sits at his desk as " +
      "though merely tired — head bowed, his right hand still loose around the pen, a " +
      "tumbler of brandy untouched at his elbow. His pocket watch, on a chain across his " +
      "waistcoat, has stopped at 11:47, the second hand quivering against the eleven. A " +
      "locked drawer in the desk seems to want examining. The foyer lies west.",
    exits: { west: "foyer" },
    contents: ["edmund_body", "desk_drawer", "brass_lamp"],
  },

  // ---------------- Region 2: West Wing ----------------

  west_corridor: {
    id: "west_corridor",
    name: "The West Corridor",
    short: "A corridor papered in dried-rose damask.",
    long:
      "Damask wallpaper here is the colour of dried roses pressed in a missal, and gives off " +
      "a faint, dusty perfume of just that kind. A long Persian runner, faded almost to " +
      "mouse, deadens your footfalls; on either side of the runner the floorboards have " +
      "been polished, but not recently. A pair of gas-jets on the wall hiss low without " +
      "quite illuminating. The corridor opens north into Edmund's library and west into the " +
      "long portrait gallery. The foyer lies south-east.",
    exits: {
      southeast: "foyer",
      north: "library",
      west: "portrait_gallery",
    },
    contents: [],
  },

  library: {
    id: "library",
    name: "The Library",
    short: "Edmund's library — three walls of legal spine.",
    long:
      "Floor-to-ceiling shelves of leather spines: legal commentaries in calf, estate " +
      "ledgers in buckram, twenty bound years of *The Solicitor's Quarterly* in matching " +
      "burgundy — and, at eye-height, one shelf of poetry that does not match the rest in " +
      "either binding or temperament. A wing-back reading chair sits angled to a cold " +
      "grate, its leather worn in the particular way that is left by one man's elbow on " +
      "one armrest over a great many evenings. A standing desk near the window holds a " +
      "brass-bound blotter and a silver inkpot, dry. The corridor is south.",
    exits: { south: "west_corridor" },
    contents: ["legal_books", "poetry_shelf", "green_book"],
  },

  portrait_gallery: {
    id: "portrait_gallery",
    name: "The Portrait Gallery",
    short: "A long gallery of four family portraits in gilt frames.",
    long(state) {
      const base =
        "A long gallery, wood-panelled in dark oak, hung with four oil portraits in heavy " +
        "gilt frames. Each plaque bears a name and, beneath it, a date and a cause: the " +
        "dates are all this year; the causes vary; the spelling of the causes is the careful " +
        "spelling of a man who knew their meaning. A polished bench runs the length of the " +
        "gallery — the kind put there for mourners, not for visitors. The corridor is east.";
      const passage = state.flags.passageOpened
        ? " A panel behind Edmund's portrait has swung inward; an unlit passage opens north."
        : "";
      return base + passage;
    },
    exits: { east: "west_corridor" },
    contents: ["portrait_cassandra_2", "portrait_julien", "portrait_beatrice", "portrait_edmund"],
    onEnter(state) {
      // Reconcile exits with flag state (handles save/load of an opened passage).
      if (state.flags.passageOpened) this.exits.north = "hidden_passage";
    },
    onCommand(state, cmd) {
      // Late binding: dynamically expose north exit to hidden_passage when puzzle solved.
      // (Engine reads .exits[direction] each move, so we mutate exits here on first solve.)
      const all = state.flags.examinedCassandraPortrait && state.flags.examinedJulienPortrait
                && state.flags.examinedBeatricePortrait && state.flags.examinedEdmundPortrait;
      if (cmd.verb === "push" || cmd.verb === "pull" || cmd.verb === "move") {
        const noun = (cmd.noun || "").toLowerCase();
        if (noun.includes("edmund") || noun.includes("portrait")) {
          if (!all) return "The portrait does not move. (You have the feeling you have not yet seen all four with proper attention.)";
          if (state.flags.passageOpened) return "The panel behind Edmund's portrait already stands open.";
          state.flags.passageOpened = true;
          this.exits.north = "hidden_passage";
          return "Edmund's portrait swings inward on a hidden hinge, revealing a narrow panelled passage beyond. Cold air sighs out.";
        }
      }
      return null;
    },
  },

  hidden_passage: {
    id: "hidden_passage",
    name: "The Hidden Passage",
    short: "A narrow servants' passage behind the portraits.",
    long:
      "A panelled servants' passage, scarcely wide enough for a man's shoulders, smelling " +
      "of cold plaster and old hessian. Dust on the floor lies thick except for a single " +
      "set of recent footprints — out, not in; a man's boot, narrow, with a worn heel. A " +
      "small writing-shelf is set into the wainscoting, the gas-jet stub above it long " +
      "since exhausted; on its surface, a leather diary lies closed beside a silver letter " +
      "opener, the latter laid as if just put down by a hand that intended to come back.",
    exits: { south: "portrait_gallery" },
    contents: ["julien_diary", "silver_letter_opener", "julien_ghost"],
  },

  // ---------------- Region 3: Upstairs ----------------

  landing: {
    id: "landing",
    name: "The Upstairs Landing",
    short: "A galleried landing with a treacherous balcony north.",
    long:
      "A galleried landing rings the foyer at the upper storey, plaster ceiling above " +
      "ribbed with old beams, all the bedroom doors closed and the keys pulled. The " +
      "floorboards on the balcony to the nursery (north) look distinctly unwell — " +
      "discoloured, sagging in places, marked by a missing nail and by a stain along one " +
      "seam that is the wrong sort of brown. From below, the foyer's tiles look very far " +
      "down. East lies the master bedroom; west, a linen closet; the stair down returns " +
      "you to the foyer.",
    exits: {
      down: "foyer",
      east: "master_bedroom",
      west: "linen_closet",
      north: "nursery",
    },
    contents: [],
    onCommand(state, cmd) {
      if (cmd.verb === "test" && cmd.noun && (cmd.noun.includes("floor") || cmd.noun.includes("board") || cmd.noun.includes("balcony"))) {
        if (state.flags.testedBalcony) return "You have already mapped a safe path along the edge.";
        state.flags.testedBalcony = true;
        return "You ease one boot onto each board in turn. Three creak. Two give. One — at the centre — would have dropped you onto the foyer tiles. You map a path along the wall.";
      }
      if (cmd.verb === "north" && !state.flags.testedBalcony) {
        // DEATH: stepping out without testing.
        state.over = true;
        return "[DEATH] You stride out onto the balcony. The third board, the rotten one, splits. You drop two storeys onto black-and-white tiles. The cat watches gravely. Refresh to begin again.";
      }
      return null;
    },
  },

  master_bedroom: {
    id: "master_bedroom",
    name: "The Master Bedroom",
    short: "Edmund and Cassandra's bedroom — very still.",
    long:
      "A four-poster bed of dark walnut, its dark-green curtains tied back, the sheets " +
      "drawn taut as if in expectation of a guest. A vanity holds a single silver-backed " +
      "brush still threaded with one long pale hair. A dressing screen of painted silk " +
      "shows herons stepping through reeds, the silk discoloured along its lower hem. The " +
      "room smells of dried lavender and, beneath that, of something sharper and more " +
      "chemical that the lavender was hung to disguise. The landing lies west.",
    exits: { west: "landing" },
    contents: ["vanity_mirror", "lavender_pouch"],
  },

  linen_closet: {
    id: "linen_closet",
    name: "The Linen Closet",
    short: "A narrow linen closet smelling of cedar.",
    long:
      "Shelves of folded sheets and pillow-slips arranged with army precision, their " +
      "cotton scenting the air with cedar and slow time. A child's pencilled height-marks " +
      "march up the inside of the doorframe; the last is dated last spring, and signed in " +
      "an unsteady B. On the lowest shelf, where a child might once have hidden, lie a " +
      "small enamelled music box, a silver locket on its chain, and an iron crowbar that " +
      "does not match the rest of the closet's furnishings in any respect. The landing is " +
      "east.",
    exits: { east: "landing" },
    contents: ["music_box", "silver_locket", "crowbar"],
  },

  nursery: {
    id: "nursery",
    name: "The Nursery",
    short: "Beatrice's nursery, ceilinged with painted constellations.",
    long:
      "A small bed under a coverlet stitched with stars, a rocking horse paused in its " +
      "creak, a doll's house in which all the doll-house lights are lit (which is " +
      "impossible — they are painted on the windows in yellow oil). Beatrice is in the " +
      "bed; her cheek rests on the pillow exactly as a child sleeping would, dark hair " +
      "across her face, but she does not breathe and has not for some time. The ceiling " +
      "is starred with hand-painted constellations in a good cobalt blue, accurate to the " +
      "season — the Pleiades clustered in their proper place, and Orion at the foot of " +
      "the bed. The landing lies south.",
    exits: { south: "nursery_back" },
    contents: ["beatrice_bed", "rocking_horse", "beatrice_ghost"],
  },

  nursery_back: {
    id: "nursery_back",
    name: "Crossing the Balcony",
    short: "Edging back along the balcony.",
    long: "",
    exits: { north: "nursery", south: "landing" },
    onEnter(state) {
      // Always succeeds returning south (you've already mapped the path going up).
      return { redirect: "landing", silent: true };
    },
  },

  // ---------------- Region 4: Cellar ----------------

  cellar_stair: {
    id: "cellar_stair",
    name: "The Cellar Stair",
    short: "A narrow flagstone stair plunging into the cellars.",
    long:
      "A flagstone stair plunges down between damp brick walls beaded with cold sweat. " +
      "Cobwebs hang in heavy festoons from a low groined ceiling, each web hung with the " +
      "small grey corpses of last year's flies. A draught from below carries the smell of " +
      "coal-dust and ice in equal measure, and somewhere beneath you there is a sound " +
      "almost like someone breathing slowly. A landing at the bottom branches: north to " +
      "the wine cellar, east to the boiler room. The stair up returns you to the foyer.",
    dark: true,
    exits: {
      up: "foyer",
      north: "wine_cellar",
      east: "boiler_room",
    },
    contents: [],
  },

  wine_cellar: {
    id: "wine_cellar",
    name: "The Wine Cellar",
    short: "The Ashvale wine cellar, deep in dust.",
    long:
      "Racks of bottles stretch into shadow on either hand, dust an inch thick on every " +
      "shoulder, the labels blistered illegible by damp. A small standing desk by the door " +
      "bears the household ledger, left open at this autumn's entries in a cramped careful " +
      "hand, with a brass lamp turned to its lowest beside it. The flagstones are grouted " +
      "with damp; somewhere, water drips with the regularity of a metronome. The air " +
      "carries the sweet vinegar smell of wine that has begun, slowly, to turn. The cellar " +
      "stair lies south.",
    dark: true,
    exits: { south: "cellar_stair" },
    contents: ["wine_ledger"],
  },

  boiler_room: {
    id: "boiler_room",
    name: "The Boiler Room",
    short: "A coal-fired boiler room, riveted iron and dead clinker.",
    long(state) {
      const base =
        "A vast iron boiler, riveted and dormant, dominates the room — the great barrel of " +
        "it cold, the firebox door ajar on a black mouth full of dead clinker, ash drifting " +
        "out across the flagstones in long tongues. From its dome, three valves run to " +
        "three labelled pipes: HALL, WINE, CHUTE. A small brass plate is screwed to the " +
        "boiler's flank, its engraving still bright. The cellar stair lies west; the coal " +
        "chute is east — ";
      const tail = state.flags.chuteThawed
        ? "the ice that sealed it has thawed away."
        : "but a wall of ice has grown over the doorway from inside.";
      return base + tail;
    },
    dark: true,
    exits: { west: "cellar_stair", east: "coal_chute" },
    contents: ["steam_boiler", "boiler_plate"],
    onCommand(state, cmd) {
      if (cmd.verb === "east" && !state.flags.chuteThawed) {
        return "The doorway to the chute is blocked by a thick wall of ice. The pipes overhead carry steam — if you can route it that way.";
      }
      return null;
    },
  },

  coal_chute: {
    id: "coal_chute",
    name: "The Coal Chute",
    short: "The coal chute, brick-walled, sloped.",
    long:
      "A narrow brick room with a sloped chute rising to a coal-hatch in the side of the " +
      "house; the hatch is shut against the night, and the room is darker than the cellars " +
      "above it. Coal dust lies black on every surface and softens every sound to a kind " +
      "of cotton silence. Mr. Hollis lies at the foot of the chute, face-down on coal-" +
      "black flagstones, where he must have struck his head when he fell — or was helped " +
      "to fall. His right hand still grips a brass pocket watch as if he had been showing " +
      "the time to someone. The boiler room lies west.",
    dark: true,
    exits: { west: "boiler_room" },
    contents: ["hollis_body", "hollis_ghost", "hollis_watch"],
  },

  // ---------------- Region 5: Crypt & Chapel ----------------

  crypt_stair: {
    id: "crypt_stair",
    name: "The Crypt Stair",
    short: "A spiral stone stair of older work.",
    long:
      "A spiral stair of dressed stone, older than the house above it by some centuries; " +
      "the stonework is precise in a way the manor's brickwork is not, and the wall is cold " +
      "and damp to the touch. Initials have been scratched into one block at shoulder " +
      "height — A.A., A.A., A.A. — like a tally kept by a man counting his children. The " +
      "stair winds down to a vault. The grandfather clock-case stands open above, behind " +
      "you, ticking in a way that no longer sounds entirely like ticking.",
    dark: true,
    exits: { up: "foyer", down: "family_crypt" },
    contents: [],
  },

  family_crypt: {
    id: "family_crypt",
    name: "The Family Crypt",
    short: "The Ashvale family crypt, vaulted, lined with sarcophagi.",
    long:
      "A long vaulted chamber, low-roofed, lined with stone sarcophagi in two long rows. " +
      "Each bears a brass plaque — ASHVALE, ASHVALE, ASHVALE — the brass dulled to dark " +
      "gold, the names beneath them stretching back in an order that begins to seem less " +
      "like generations and more like one life rehearsed. The air is still and very cold; " +
      "your breath shows. At the far end, a fresh sarcophagus stands open and empty, ready " +
      "for a body that has not yet arrived. Beyond it, an iron-bound door east leads to " +
      "the chapel. The stair lies west — and up.",
    dark: true,
    exits: { west: "crypt_stair", east: "family_chapel" },
    contents: ["empty_sarcophagus"],
  },

  family_chapel: {
    id: "family_chapel",
    name: "The Family Chapel",
    short: "The family chapel.",
    long(state) {
      const base =
        "A small private chapel beneath the house: a stone altar plain as a tomb, four " +
        "iron sconces driven into the walls, four black candles set in them, and at the " +
        "centre of the floor a séance circle inlaid in brass. Four sigils mark the four " +
        "cardinal points of the circle, each shaped like one of the spirit-tokens you have " +
        "recovered. The air is colder here than in the crypt, and it carries the smell of " +
        "beeswax, of old incense, and of waiting.";
      const candles = state.flags.candlesLit ? " The four candles are burning." : " The candles are unlit.";
      const tokens = state.flags.tokensPlaced ? " The four tokens lie on their sigils." : "";
      return base + candles + tokens + " The crypt lies west.";
    },
    dark: true,
    // Chapel is dimly lit by the candles once lit; treat as not-dark in that case.
    exits: { west: "family_crypt" },
    contents: ["seance_circle", "altar_candles"],
    onCommand(state, cmd) {
      // Place tokens.
      if ((cmd.verb === "place" || cmd.verb === "put" || cmd.verb === "use") &&
          cmd.noun && (cmd.noun.includes("token") || cmd.noun.includes("tokens"))) {
        if (state.flags.tokensPlaced) return "The four tokens are already in place.";
        if (state.tokensCollected.length < 4) return "You have only " + state.tokensCollected.length + " of the four tokens. The circle will not be answered until all four have spoken.";
        // Move tokens from inventory to the circle.
        const tokenItems = ["teacup_token", "letter_opener_token", "locket_token", "pocket_watch_token"];
        // letter_opener_token is the silver_letter_opener; locket_token is locket_token; pocket_watch is hollis_watch.
        // For simplicity, just check tokensCollected and set the flag without literally moving items.
        state.flags.tokensPlaced = true;
        return [
          "You set each token down on its sigil. As you do, the brass inlay around the circle warms — not hot, but as if the iron had remembered being a hand.",
          "(The circle is open.)",
        ];
      }
      // Light candles.
      if (cmd.verb === "light" && cmd.noun && cmd.noun.includes("candle")) {
        if (state.flags.candlesLit) return "The four candles are already burning.";
        if (!state.flags.lampLit && !state.inventory.includes("brass_lamp")) {
          return "You have no flame to light them with.";
        }
        state.flags.candlesLit = true;
        return "You touch flame to each wick in turn. The four candles take, then steady. The chapel's shadows lean back.";
      }
      // Speak the killer's name.
      if (cmd.verb === "say" || cmd.verb === "name") {
        const said = ((cmd.noun || "") + (cmd.secondNoun ? " " + cmd.secondNoun : "")).toLowerCase().trim();
        if (!said) return "Say what?";
        const haveTokens = state.flags.tokensPlaced;
        const haveLight = state.flags.candlesLit;
        if (!haveTokens && !haveLight) return "You speak the name. Nothing answers. (Place the tokens on the circle and light the candles first.)";
        if (!haveTokens) return "You speak the name. Nothing answers. (Place the four tokens on their sigils first.)";
        if (!haveLight) return "You speak the name. Nothing answers. (Light the candles first.)";
        // Check correctness.
        const target = "pemberton dredge";
        const isFull = said === target || said === "dredge" || said === "pemberton dredge";
        const isCloseEnough = said.includes("pemberton") && said.includes("dredge");
        if (isFull || isCloseEnough) {
          state.over = true;
          state.flags.won = true;
          // Award the completion bonus, if not yet awarded.
          // (engine.awardPoints is module-scoped to engine; we set a flag and
          //  let the engine grant the points on this turn's tail.)
          state.flags.wonClean = true;
          // The ending varies by score. Three tiers, all narratively coherent.
          const score = state.score || 0;
          const rank = score >= 110 ? "Pristine"
                      : score >= 85 ? "Adept Investigator"
                      : score >= 60 ? "Competent"
                                    : "Earnest";
          const opening = [
            "",
            "You speak the name into the circle. 'PEMBERTON DREDGE.'",
            "",
            "The candles flare. The brass sigils ring. Edmund Ashvale rises up out of the circle in his black coat, looking for once at peace.",
            "",
            "  'You have the right of it,' he says. 'And now I can lay down with my brother.'",
            "",
          ];
          const closeByRank = score >= 110 ? [
            "Cassandra. Julien. Beatrice. Hollis. They take the cardinal points of the circle and bow, each in turn, to Edmund — and to you. There is recognition in it: an investigator who looked, and who saw.",
            "The four candles, all together, go out. Above, distantly, a clock strikes the half-hour — a normal half-hour, not the thirteenth. The fog rolls back. Dawn breaks on the moor in clean ribbons of pale gold.",
            "You climb out into a house that no longer expects to keep you. The black cat walks in front of you, tail high; behind, a chapel door closes, and the Ashvales sleep.",
            "",
            "**THE END — Ashvale is freed; nothing in it remains undone.**",
          ] : score >= 60 ? [
            "Cassandra. Julien. Beatrice. Hollis. They take the cardinal points of the circle and bow, each in turn, to Edmund. The four candles, all together, go out.",
            "Above, distantly, a clock strikes the half-hour — a normal half-hour, not the thirteenth. The fog rolls back from the windows. Dawn is grey on the moor.",
            "You climb out into a house that no longer expects to keep you. The black cat follows, eventually.",
            "",
            "**THE END — Ashvale is freed.**",
          ] : [
            "Cassandra. Julien. Beatrice. Hollis. They take the cardinal points of the circle, but their farewells are brief: you have done what was strictly required, and no more. The four candles gutter and die.",
            "Above, the clock strikes once, slow. The fog does not lift; it merely thins. Dawn, when it comes, does not arrive in colour.",
            "You climb out into a quiet house. The cat is not in the foyer.",
            "",
            "**THE END — Ashvale is freed, but the cost lingers.**",
          ];
          // The engine prints the final score line after this returns.
          return [...opening, ...closeByRank];
        }
        // Wrong name.
        state.over = true;
        return [
          "",
          `You speak the name into the circle. '${said.toUpperCase()}.'`,
          "",
          "The candles flare — and gutter, and burn black. The brass sigils ring with a sound that goes through bone. From the four points of the circle, four spirits turn their faces toward you, and they are no longer kind.",
          "",
          "You named the wrong man. The manor takes its consolation.",
          "",
          "**THE END — refresh to begin again.**",
        ];
      }
      return null;
    },
  },
};

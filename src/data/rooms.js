// Region 0: Arrival & Drawing Floor (Chunk A — minimum playable skeleton).
// Rooms are plain data objects. Optional hooks: onEnter(state), onCommand(state, cmd).
// Items, NPCs, exits resolve by id at runtime.

export const ROOMS = {
  iron_gate: {
    id: "iron_gate",
    name: "The Iron Gate",
    short: "An iron gate before the manor.",
    long:
      "Wrought iron gates stand half-open before you, the Ashvale crest weeping with rust. " +
      "Beyond, a gravel drive curves through fog toward the great house — black-windowed, " +
      "silent. The coachman's lantern is already a small orange dot on the moor road. " +
      "You will not be welcomed, but you may yet be admitted.",
    exits: { north: "front_door", south: null, east: "garden", west: null },
    contents: ["telegram"],
  },

  front_door: {
    id: "front_door",
    name: "Before the Front Door",
    short: "The locked front door of Ashvale Manor.",
    long:
      "A pair of black oak doors loom under a stone porch. The brass knocker is shaped like a " +
      "fox biting its own tail. The doors are locked from within. A gravel path leads east " +
      "around the house toward an overgrown garden, and south back to the gate.",
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
    short: "A weed-choked garden against the east wall.",
    long:
      "Roses gone to thorn and bramble crowd the east face of the manor. A drawing-room " +
      "window stands here, its catch broken — with a little force, it could be opened. The " +
      "front of the house lies west; gravel paths circle further east into the hedge maze, " +
      "though those gates appear bound shut from inside.",
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
    short: "A drawing room of dust-cloth furniture.",
    long:
      "Furniture stands shrouded in dust-cloths like a congregation of ghosts. A cold fire-grate, " +
      "a crystal decanter on a sideboard, and a sealed letter on the mantel. Doorways open " +
      "north into the foyer and east back to the broken window.",
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
    short: "The grand foyer of Ashvale Manor.",
    long(state) {
      const base =
        "A black-and-white tiled floor stretches beneath a chandelier furred with cobweb. A " +
        "tall grandfather clock ticks in the corner — slowly, almost grudgingly. Doorways " +
        "lead south to the drawing room, west to the dining room, and east toward Edmund's " +
        "study.";
      const stairs = " The stair up to the bedrooms is roped off with black crepe. The cellar door down is barred.";
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
    },
    contents: ["grandfather_clock", "black_cat"],
    onCommand(state, cmd) {
      if (cmd.verb === "up" || cmd.verb === "climb") {
        return "Black crepe has been tied across the stair. You will not climb tonight unless something authorises it.";
      }
      if (cmd.verb === "down") {
        return "The cellar door is barred from this side, with a nail driven through the latch. Not yet.";
      }
      if (cmd.verb === "northeast") {
        if (state.flags.eastSealBroken) return null; // fall through to engine, but no exit defined; see redirect below
        return "The east wing door is sealed with executor's wax. You'd need authority — or evidence the executor is a liar — to break it.";
      }
      if (cmd.verb === "northwest") {
        if (state.flags.westSealBroken) return null;
        return "The west wing door is sealed with executor's wax. You'd need authority — or evidence the executor is a liar — to break it.";
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
    short: "A corridor in the east wing.",
    long:
      "A long corridor with damask wallpaper peeling in slow curls. A portrait of Lady " +
      "Cassandra Ashvale hangs at the far end, her painted gaze always on you no matter " +
      "where you stand. North-east is the conservatory, glass and green; east, a paved " +
      "path leads out into the hedge maze. The foyer lies south-west.",
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
    short: "A glass-domed conservatory.",
    long:
      "Iron arches hold up panels of green-stained glass; rain has been falling on the " +
      "dome for so long that you cannot tell where the rain ends and the room begins. " +
      "Three rare specimens stand on plinths around a wrought-iron tea table. On the " +
      "table: a teacup, untouched; a heavy botanical guide, splayed open. The corridor " +
      "lies south-west.",
    exits: { southwest: "east_corridor" },
    contents: ["teacup", "botanical_guide", "foxglove", "monkshood_plant", "hemlock", "cassandra_ghost"],
  },

  hedge_maze: {
    id: "hedge_maze",
    name: "The Hedge Maze",
    short: "Inside the hedge maze.",
    long:
      "Yew hedges rise twice your height on either side, beaded with rain. The path " +
      "branches confusingly, but you get the impression that all true paths bend inward. " +
      "The corridor's door is to the west; the maze opens outward, north, into a small " +
      "stone clearing.",
    exits: { west: "east_corridor", north: "stone_folly" },
    contents: [],
  },

  stone_folly: {
    id: "stone_folly",
    name: "The Stone Folly",
    short: "A stone folly at the maze's heart.",
    long:
      "A miniature Greek folly stands at the maze's heart: four columns, no roof, a " +
      "weathered stone bench. At its centre, a sundial. The hedge path leads back south.",
    exits: { south: "hedge_maze" },
    contents: ["sundial"],
  },

  dining_room: {
    id: "dining_room",
    name: "The Dining Room",
    short: "A long dining room with sixteen empty chairs.",
    long:
      "A long mahogany table runs the length of the room, set for sixteen and abandoned " +
      "mid-meal. Wax has run down the candelabra in long pale tongues. A swing-door west " +
      "leads to the servants' hall; the foyer lies east.",
    exits: { east: "foyer", west: "servants_hall" },
    contents: ["candelabra"],
  },

  servants_hall: {
    id: "servants_hall",
    name: "The Servants' Hall",
    short: "A plain kitchen and servants' hall.",
    long:
      "Copper pans hang in tidy ranks above a cold range. A chalk-slate leans on the deal " +
      "table. Mrs. Crow, the cook, sits very still in a wooden chair — alive, you think, " +
      "though she has not blinked since you arrived. The dining room lies east.",
    exits: { east: "dining_room" },
    contents: ["mrs_crow", "chalk_slate"],
  },

  study: {
    id: "study",
    name: "Edmund's Study",
    short: "The late Lord Edmund's private study.",
    long:
      "A green-shaded lamp, an ink-blotter, a wall of leather spines. Lord Edmund Ashvale " +
      "sits at his desk as though merely tired — head bowed, a glass of brandy untouched at " +
      "his elbow. His pocket watch, on a chain across his waistcoat, has stopped at 11:47. " +
      "A locked drawer in the desk seems to want examining. The foyer lies west.",
    exits: { west: "foyer" },
    contents: ["edmund_body", "desk_drawer", "brass_lamp"],
  },

  // ---------------- Region 2: West Wing ----------------

  west_corridor: {
    id: "west_corridor",
    name: "The West Corridor",
    short: "A corridor in the west wing.",
    long:
      "Damask wallpaper here is the colour of dried roses. The corridor opens north into " +
      "Edmund's library and west into the long portrait gallery. The foyer lies south-east.",
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
    short: "Edmund's private library.",
    long:
      "Floor-to-ceiling shelves of leather spines: legal commentaries, estate ledgers, " +
      "and one shelf of poetry that does not match the rest. A reading chair sits angled " +
      "to a cold fire. The corridor is south.",
    exits: { south: "west_corridor" },
    contents: ["legal_books", "poetry_shelf"],
  },

  portrait_gallery: {
    id: "portrait_gallery",
    name: "The Portrait Gallery",
    short: "A long gallery of family portraits.",
    long(state) {
      const base =
        "A long gallery, wood-panelled, hung with four oil portraits in heavy gilt frames. " +
        "Each plaque bears a name and, beneath it, a date and cause: the dates are all this " +
        "year; the causes vary. A polished bench runs the length of the gallery. The " +
        "corridor is east.";
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
    short: "A narrow passage behind the portraits.",
    long:
      "A panelled servants' passage, scarcely wide enough for a man's shoulders. Dust on " +
      "the floor lies thick except for a single set of recent footprints — out, not in. A " +
      "small writing-shelf is set into the wainscoting, with a leather diary and a silver " +
      "letter opener resting on its surface.",
    exits: { south: "portrait_gallery" },
    contents: ["julien_diary", "silver_letter_opener", "julien_ghost"],
  },
};

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
    long:
      "A black-and-white tiled floor stretches beneath a chandelier furred with cobweb. A " +
      "tall grandfather clock ticks in the corner — slowly, almost grudgingly. Doorways " +
      "lead south to the drawing room, west to the dining room, and east toward Edmund's " +
      "study. The stair up to the bedrooms is roped off with black crepe. The cellar door " +
      "down is barred. The wing doors east-northeast and west-northwest are sealed with " +
      "wax and signature: 'BY ORDER OF THE EXECUTOR — DO NOT BREAK.'",
    exits: {
      south: "drawing_room",
      west: "dining_room",
      east: "study",
    },
    contents: ["grandfather_clock", "black_cat"],
    onCommand(state, cmd) {
      if (cmd.verb === "up" || cmd.verb === "climb") {
        return "Black crepe has been tied across the stair. You will not climb tonight unless something authorises it.";
      }
      if (cmd.verb === "down") {
        return "The cellar door is barred from this side, with a nail driven through the latch. Not yet.";
      }
      if (cmd.verb === "northeast" || cmd.verb === "northwest") {
        return "The wing doors are sealed with executor's wax. They will not open while the seal holds.";
      }
      return null;
    },
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
};

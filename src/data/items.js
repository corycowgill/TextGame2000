// Items: { id, names: [aliases], short, desc, flags, takeable, onUse?, onExamine?, onRead? }
// "names" includes every word the parser might match against. The first entry is canonical.

import { ROOMS } from "./rooms.js";

const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

function placeInRoom(roomId, itemId) {
  const r = ROOMS[roomId];
  if (!r) return;
  r.contents = r.contents || [];
  if (!r.contents.includes(itemId)) r.contents.push(itemId);
}

export const ITEMS = {
  // ---- Region 0 ----

  telegram: {
    id: "telegram",
    names: ["telegram", "wire", "message"],
    short: "a folded telegram",
    desc:
      "The telegram is creased from your pocket. It reads:\n" +
      "  DR VANCE STOP COME AT ONCE STOP MATTER OF SPIRITS AND OF LAW STOP\n" +
      "  E ASHVALE OF ASHVALE MANOR HAS DIED IN HIS STUDY STOP\n" +
      "  WILL CONTESTED STOP HOUSEHOLD WILL NOT SPEAK OF IT STOP\n" +
      "  YOUR DISCRETION TRUSTED STOP P DREDGE SOLR STOP",
    takeable: true,
  },

  garden_window: {
    id: "garden_window",
    names: ["window", "drawing-room window", "drawing room window", "sash"],
    short: "the drawing-room window",
    desc(state) {
      if (state.flags.windowOpened) return "The window stands open. The sash slides easily now.";
      return "A tall sash window into the drawing room. The catch is broken; with a heavy stone, you could break the pane outright, or you could simply force the sash up.";
    },
    takeable: false,
  },

  loose_stone: {
    id: "loose_stone",
    names: ["stone", "loose stone", "rock"],
    short: "a loose paving stone",
    desc: "A heavy paving stone, prized loose by frost. It would do violence to a window.",
    takeable: true,
  },

  decanter: {
    id: "decanter",
    names: ["decanter", "brandy", "glass", "crystal"],
    short: "a crystal decanter",
    desc: "Cut crystal, half full of something amber. The stopper is fitted tight.",
    takeable: false,
  },

  sealed_letter: {
    id: "sealed_letter",
    names: ["letter", "sealed letter", "envelope"],
    short: "a sealed letter",
    desc: "Heavy cream paper, addressed in a hurried hand: 'To whomsoever finds this first.' " +
          "It is sealed with black wax, unbroken.",
    takeable: true,
    onRead(state) {
      state.flags.readEdmundLetter = true;
      return [
        "You break the seal. Edmund's hand:",
        "",
        "  If you read this I am already gone, and the man who killed me wears a black",
        "  coat and a notary's smile. He has been at the will. The true testament rests",
        "  where the household sleeps longest. Trust the cook — she sees more than she",
        "  says. Mind the balcony. Mind the cellar. Mind, above all, the hour.",
        "",
        "  — E.A.",
      ];
    },
  },

  grandfather_clock: {
    id: "grandfather_clock",
    names: ["clock", "grandfather clock", "grandfather"],
    short: "a tall grandfather clock",
    desc:
      "An ornate grandfather clock, the brass pendulum still swinging. Its face shows " +
      "a time that does not match your watch — and as you look, the minute hand twitches " +
      "*backwards* a tick, then resumes.",
    takeable: false,
  },

  candelabra: {
    id: "candelabra",
    names: ["candelabra", "candles", "candle"],
    short: "a wax-fouled candelabra",
    desc: "A six-armed silver candelabra, all six candles burned to stubs. The wax has cooled in long pale tongues across the table-cloth.",
    takeable: false,
  },

  chalk_slate: {
    id: "chalk_slate",
    names: ["slate", "chalk slate", "chalkboard", "chalk"],
    short: "a chalk slate",
    desc:
      "A small slate Mrs. Crow uses to speak. A single phrase, written and re-written until " +
      "the chalk has worn through:\n" +
      "  HE CAME FROM THE SOUTH ROAD AT MIDNIGHT WITH A CASE OF PAPERS.",
    takeable: false,
    onRead(state) {
      state.flags.readSlate = true;
      return "You read what is on the slate:\n  HE CAME FROM THE SOUTH ROAD AT MIDNIGHT WITH A CASE OF PAPERS.";
    },
  },

  edmund_body: {
    id: "edmund_body",
    names: ["edmund", "body", "corpse", "lord", "ashvale"],
    short: "Lord Edmund's body",
    desc(state) {
      const base =
        "Lord Edmund Ashvale, sixty and gaunt, sits at his desk with the stillness only the " +
        "dead achieve. There is no wound you can see. His pocket watch, half-out of the " +
        "waistcoat, has stopped at 11:47. A faint smell of bitter almonds rises from the " +
        "brandy glass at his elbow — though he has not drunk a drop.";
      if (state.flags.foundFobKey) return base;
      return base + " A small fob key dangles on the watch chain.";
    },
    takeable: false,
    onCommand(state, cmd) {
      if (cmd.verb === "search") {
        if (state.flags.foundFobKey) {
          return "You have already found the fob key. The body has nothing more to give you.";
        }
        state.flags.foundFobKey = true;
        state.inventory.push("fob_key");
        return "You search Edmund. On the watch chain, beside the stopped timepiece, is a small steel fob key. You take it.";
      }
      if (cmd.verb === "take" && (cmd.noun === "watch" || cmd.noun === "pocket watch" || cmd.noun === "fob" || cmd.noun === "key" || cmd.noun === "fob key")) {
        if (state.flags.foundFobKey) return "You already took the fob key.";
        state.flags.foundFobKey = true;
        state.inventory.push("fob_key");
        return "You free the fob key from the watch chain. The watch itself you leave to its stopped hour.";
      }
      return null;
    },
  },

  fob_key: {
    id: "fob_key",
    names: ["fob key", "fob", "small key", "steel key"],
    short: "a small steel fob key",
    desc: "A small steel key, no bigger than a thumbnail, polished by years of waistcoat pocket. Edmund's, beyond doubt.",
    takeable: true,
  },

  desk_drawer: {
    id: "desk_drawer",
    names: ["drawer", "desk drawer", "desk"],
    short: "a locked desk drawer",
    desc(state) {
      if (state.flags.drawerOpened) {
        return "The drawer hangs open. The velvet lining bears two impressions: one where the household keyring lay, and one where something rectangular — a folded paper — once rested.";
      }
      return "The drawer is locked with a small, particular keyhole — the kind that wants a personal key, not a household one.";
    },
    takeable: false,
    onUnlock(state, keyId) {
      if (state.flags.drawerOpened) return "The drawer is already open.";
      if (keyId !== "fob_key") {
        return `${cap(ITEMS[keyId].short)} will not turn in this lock.`;
      }
      state.flags.drawerOpened = true;
      placeInRoom("study", "edmund_keyring");
      placeInRoom("study", "will_fragment");
      return [
        "The fob key turns. The drawer slides open.",
        "Inside: a heavy iron keyring, and a half-burnt fragment of paper — the corner of a will, with a notary's seal still legible at one edge.",
      ];
    },
    onCommand(state, cmd) {
      if (cmd.verb === "open" && !state.flags.drawerOpened) {
        return "The drawer is locked. You'll need a key — and Edmund kept his own keys close.";
      }
      if (cmd.verb === "open" && state.flags.drawerOpened) return "The drawer is already open.";
      return null;
    },
  },

  will_fragment: {
    id: "will_fragment",
    names: ["will", "will fragment", "fragment", "paper", "burnt paper"],
    short: "a half-burnt fragment of a will",
    desc: "Most of the page is gone to char, but the lower right corner remains. The notary's seal is intact: a wax disc stamped P. DREDGE, SOLR. The line above the seal reads, in copperplate: '...and to the said Pemberton Dredge, the residue of my estate.'",
    takeable: true,
    onRead(state) {
      state.flags.readWillFragment = true;
      return "You read what survives:\n  '...and to the said Pemberton Dredge, the residue of my estate.'\n  Sealed: P. DREDGE, SOLR.";
    },
  },

  // Items obtained later
  edmund_keyring: {
    id: "edmund_keyring",
    names: ["keyring", "keys", "key", "edmund's keys", "ring"],
    short: "Edmund's keyring",
    desc:
      "A heavy iron ring with four keys: a brass one (labelled HOUSE), a long iron one " +
      "(GARDEN), an ornate silver one (LIBRARY), and a small black one (CELLAR).",
    takeable: true,
  },

  brass_lamp: {
    id: "brass_lamp",
    names: ["lamp", "brass lamp", "oil lamp", "lantern"],
    short: "a brass oil lamp",
    desc(state) {
      const oil = state.lampOil;
      const lit = state.flags.lampLit ? " — burning steadily" : " — unlit";
      const fuel = oil >= 30 ? " (full)" : oil >= 15 ? " (half full)" : oil > 0 ? " (low)" : " (empty)";
      return `A heavy brass oil lamp with a glass chimney${lit}${fuel}.`;
    },
    takeable: true,
  },
};

// Helper to fetch item description (handles function descs).
export function itemDesc(item, state) {
  if (typeof item.desc === "function") return item.desc(state);
  return item.desc;
}

// Resolve a noun string against a list of item ids; returns matching ids.
export function resolveItemNoun(noun, ids) {
  if (!noun) return [];
  const n = noun.toLowerCase().trim();
  const matches = [];
  for (const id of ids) {
    const item = ITEMS[id];
    if (!item) continue;
    if (item.names.some((alias) => alias === n || alias.includes(n) || n.includes(alias))) {
      matches.push(id);
    }
  }
  return matches;
}

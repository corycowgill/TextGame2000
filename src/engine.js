// Game engine: world state + verb dispatch.
// Chunk A1: movement, look, examine, take, drop, inventory, help, quit, wait.

import { ROOMS } from "./data/rooms.js";
import { ITEMS, itemDesc } from "./data/items.js";
import { NPCS } from "./data/npcs.js";
import { parse, isDirection } from "./parser.js";
import * as render from "./render.js";

// ---------- State ----------

export function newState() {
  return {
    currentRoom: "iron_gate",
    inventory: [],
    flags: {
      lampLit: false,
      windowOpened: false,
      drawerOpened: false,
      catFed: false,
      readEdmundLetter: false,
      readSlate: false,
    },
    turnCount: 0,
    lampOil: 30,
    visited: new Set(),
    lastNoun: null,
    lastCommand: null,
    notebookEntries: [],
    tokensCollected: [],
    midnightStrikes: 0,
    over: false,
  };
}

let state = newState();
export function getState() { return state; }
export function setState(s) { state = s; }

// ---------- Scope resolution ----------

function room() { return ROOMS[state.currentRoom]; }

function visibleEntities() {
  // Returns { items: [ids], npcs: [ids] } visible right now.
  const r = room();
  const items = [];
  const npcs = [];
  for (const id of r.contents || []) {
    if (NPCS[id]) npcs.push(id);
    else if (ITEMS[id]) items.push(id);
  }
  // Cat follows you once fed.
  if (state.flags.catFed && state.currentRoom !== "foyer" && !npcs.includes("black_cat")) {
    npcs.push("black_cat");
  }
  return { items, npcs };
}

function inventoryItems() {
  return state.inventory.filter((id) => ITEMS[id]);
}

// Match a noun against ids using each entity's `names` array.
function matchNoun(noun, candidateIds, table) {
  if (!noun) return [];
  const n = noun.toLowerCase().trim();
  const matches = [];
  for (const id of candidateIds) {
    const entity = table[id];
    if (!entity) continue;
    const aliases = entity.names || [id];
    for (const a of aliases) {
      if (a === n) { matches.push(id); break; }
      // multi-word alias contained in noun, or noun is a prefix of alias
      if (n.includes(a) || a.startsWith(n)) { matches.push(id); break; }
    }
  }
  return [...new Set(matches)];
}

// Resolve a noun against everything visible (inventory + room contents + npcs).
// Returns { kind: "item"|"npc"|"none"|"ambiguous", ids: [...] }
function resolveNoun(noun) {
  if (!noun) return { kind: "none", ids: [] };
  if (noun === "it" && state.lastNoun) noun = state.lastNoun;

  const { items: roomItems, npcs: roomNpcs } = visibleEntities();
  const allItemIds = [...inventoryItems(), ...roomItems];

  const itemMatches = matchNoun(noun, allItemIds, ITEMS);
  const npcMatches = matchNoun(noun, roomNpcs, NPCS);
  const all = [
    ...itemMatches.map((id) => ({ kind: "item", id })),
    ...npcMatches.map((id) => ({ kind: "npc", id })),
  ];
  if (all.length === 0) return { kind: "none", ids: [] };
  if (all.length === 1) return { kind: all[0].kind, ids: [all[0].id] };
  return { kind: "ambiguous", ids: all.map((x) => x.id) };
}

// ---------- Output helpers ----------

function describeRoom(full = true) {
  const r = room();
  render.printRoomName(r.name);
  if (full) render.print(r.long);
  else render.print(r.short);

  const { items, npcs } = visibleEntities();
  const lines = [];
  for (const id of npcs) lines.push(`${capFirst(NPCS[id].short)} is here.`);
  for (const id of items) {
    const it = ITEMS[id];
    if (it.takeable !== false) lines.push(`There is ${it.short} here.`);
    else lines.push(`You see ${it.short}.`);
  }
  if (lines.length) render.print(lines);

  const exits = Object.keys(r.exits || {}).filter((k) => r.exits[k]);
  if (exits.length) render.print(`Exits: ${exits.join(", ")}.`);
}

function capFirst(s) { return s ? s[0].toUpperCase() + s.slice(1) : s; }

// ---------- Movement ----------

function move(direction) {
  const r = room();
  const dest = r.exits && r.exits[direction];
  if (!dest) return "You cannot go that way.";
  enterRoom(dest);
  return null;
}

function enterRoom(roomId, silent = false) {
  let target = roomId;
  // Follow onEnter redirects.
  let safety = 5;
  while (safety-- > 0) {
    const r = ROOMS[target];
    if (!r) return `(Bad room id: ${target})`;
    if (r.onEnter) {
      const result = r.onEnter(state) || {};
      if (result.redirect) {
        if (result.message) render.print(result.message);
        if (result.silent || silent) silent = true;
        target = result.redirect;
        continue;
      }
    }
    state.currentRoom = target;
    state.visited.add(target);
    if (!silent) describeRoom(true);
    return null;
  }
  return "(Movement loop detected.)";
}

// ---------- Verb handlers ----------

function vLook() {
  describeRoom(true);
  return null;
}

function vExamine(cmd) {
  if (!cmd.noun) return "Examine what?";
  const res = resolveNoun(cmd.noun);
  if (res.kind === "none") return `You see no ${cmd.noun} here.`;
  if (res.kind === "ambiguous") return disambiguate(cmd.noun, res.ids);
  state.lastNoun = cmd.noun;
  if (res.kind === "item") {
    const it = ITEMS[res.ids[0]];
    if (it.onExamine) {
      const r = it.onExamine(state);
      if (r) return r;
    }
    return itemDesc(it, state);
  }
  if (res.kind === "npc") {
    return NPCS[res.ids[0]].desc;
  }
  return null;
}

function vTake(cmd) {
  if (!cmd.noun) return "Take what?";
  if (cmd.noun === "all") return takeAll();
  const res = resolveNoun(cmd.noun);
  if (res.kind === "none") return `There is no ${cmd.noun} here to take.`;
  if (res.kind === "ambiguous") return disambiguate(cmd.noun, res.ids);
  state.lastNoun = cmd.noun;
  if (res.kind === "npc") return "That is not yours to take.";
  const id = res.ids[0];
  const it = ITEMS[id];
  if (state.inventory.includes(id)) return "You already have it.";
  if (it.takeable === false) return "That is not something you can carry.";
  // Move from room to inventory
  const r = room();
  r.contents = (r.contents || []).filter((x) => x !== id);
  state.inventory.push(id);
  return `Taken: ${it.short}.`;
}

function takeAll() {
  const { items } = visibleEntities();
  const lines = [];
  for (const id of items) {
    const it = ITEMS[id];
    if (it.takeable === false) continue;
    if (state.inventory.includes(id)) continue;
    const r = room();
    r.contents = r.contents.filter((x) => x !== id);
    state.inventory.push(id);
    lines.push(`Taken: ${it.short}.`);
  }
  return lines.length ? lines : "There is nothing here to take.";
}

function vDrop(cmd) {
  if (!cmd.noun) return "Drop what?";
  const ids = matchNoun(cmd.noun, inventoryItems(), ITEMS);
  if (ids.length === 0) return `You are not carrying any ${cmd.noun}.`;
  if (ids.length > 1) return disambiguate(cmd.noun, ids);
  const id = ids[0];
  state.lastNoun = cmd.noun;
  state.inventory = state.inventory.filter((x) => x !== id);
  const r = room();
  r.contents = r.contents || [];
  r.contents.push(id);
  return `Dropped: ${ITEMS[id].short}.`;
}

function vInventory() {
  const items = inventoryItems();
  if (items.length === 0) return "You are carrying nothing.";
  return ["You are carrying:", ...items.map((id) => `  - ${ITEMS[id].short}`)];
}

function vWait() {
  state.turnCount += 0; // turn count incremented by main loop already
  return "Time passes.";
}

function vHelp() {
  return [
    "Commands:",
    "  Movement: north (n), south, east, west, up, down, ne, nw, se, sw",
    "            enter <thing>, exit, climb, go <dir>",
    "  Look:     look (l), examine <X> (x), read <X>, search <X>, listen, smell",
    "  Items:    take <X>, take all, drop <X>, inventory (i)",
    "  Use:      use <X>, use <X> on <Y>, light <X>, extinguish <X>",
    "            unlock <X> with <Y>, open/close/push/pull/turn <X>",
    "            break <X> with <Y>, wind/play <X>, show <X> to <Y>",
    "  Talk:     talk to <NPC>, ask <NPC> about <topic>, say <word>",
    "  Meta:     wait (z), again (g), help, hint, notebook, score, quit",
    "  Refer back to the most recent noun with `it`.",
  ];
}

function vQuit() {
  state.over = true;
  return "You step back from the manor. The fog closes over Ashvale, and the night keeps its secrets. (Refresh to begin again.)";
}

function disambiguate(noun, ids) {
  const labels = ids.map((id) => {
    if (ITEMS[id]) return ITEMS[id].short;
    if (NPCS[id]) return NPCS[id].short;
    return id;
  });
  return `Which do you mean — ${labels.join(", or ")}?`;
}

// ---------- Dispatcher ----------

const HANDLERS = {
  look: vLook, examine: vExamine,
  take: vTake, drop: vDrop, inventory: vInventory,
  help: vHelp, quit: vQuit, wait: vWait,
};

function dispatch(cmd) {
  // Movement: bare directions.
  if (isDirection(cmd.verb)) return move(cmd.verb);

  // Room-level override gets first crack.
  const r = room();
  if (r.onCommand) {
    const out = r.onCommand(state, cmd);
    if (out != null) return out;
  }

  // Item-level override (for items in scope).
  const { items: roomItems, npcs: roomNpcs } = visibleEntities();
  const scopeItems = [...inventoryItems(), ...roomItems];
  if (cmd.noun) {
    const ids = matchNoun(cmd.noun, scopeItems, ITEMS);
    for (const id of ids) {
      const it = ITEMS[id];
      if (it.onCommand) {
        const out = it.onCommand(state, cmd);
        if (out != null) return out;
      }
    }
    const npcIds = matchNoun(cmd.noun, roomNpcs, NPCS);
    for (const id of npcIds) {
      const npc = NPCS[id];
      if (npc.onCommand) {
        const out = npc.onCommand(state, cmd);
        if (out != null) return out;
      }
    }
  }

  // Built-in handlers.
  const h = HANDLERS[cmd.verb];
  if (h) return h(cmd);

  // Verb known but unhandled in this scope.
  return `You can't ${cmd.verb} that here.`;
}

// ---------- Public entry point ----------

export function executeInput(rawInput) {
  if (state.over) {
    render.system("The game is over. Refresh to begin again.");
    return;
  }

  const cmd = parse(rawInput);

  if (cmd.kind === "empty") return;

  if (cmd.kind === "again") {
    if (!state.lastCommand) {
      render.print("You haven't done anything yet.");
      return;
    }
    return executeInput(state.lastCommand);
  }

  if (cmd.kind === "unknown") {
    if (cmd.suggestion) {
      render.print(`I don't know "${cmd.token}". Did you mean "${cmd.suggestion}"?`);
    } else {
      render.print(`I don't know the word "${cmd.token}".`);
    }
    return;
  }

  // cmd.kind === "command"
  const out = dispatch(cmd);
  if (out != null) render.print(out);
  state.turnCount += 1;
  state.lastCommand = cmd.raw;

  // Update status bar.
  const r = room();
  render.updateStatus({
    roomName: r.name,
    turnCount: state.turnCount,
    lampOil: state.lampOil,
    lampLit: state.flags.lampLit,
  });
}

export function startGame() {
  // Initial render: print the opening, then describe the start room.
  render.system(
    "THE LAST WILL OF ASHVALE\n" +
    "A Gothic Parser Adventure in Five Hauntings\n"
  );
  render.print(
    "It is the autumn of 1888. The coachman has set you down at the gates of Ashvale Manor and " +
    "departed at unwholesome speed, leaving you alone with a telegram, a fog, and the sound of " +
    "your own breathing. Lord Edmund Ashvale lies dead inside, his will contested, the " +
    "household scattered. You are Dr. Alistair Vance, paranormal investigator. You have until " +
    "the manor's clock strikes thirteen.\n"
  );
  render.print("Type `help` for commands.\n");
  enterRoom(state.currentRoom);
  const r = room();
  render.updateStatus({
    roomName: r.name,
    turnCount: state.turnCount,
    lampOil: state.lampOil,
    lampLit: state.flags.lampLit,
  });
}

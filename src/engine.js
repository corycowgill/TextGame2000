// Game engine: world state + verb dispatch.

import { ROOMS } from "./data/rooms.js";
import { ITEMS, itemDesc } from "./data/items.js";
import { NPCS } from "./data/npcs.js";
import { HINTS, NOTEBOOK_ENTRIES, KILLER_NAME, KILLER_LETTERS, AMBIENT_LINES } from "./data/clues.js";
import { SCENERY } from "./data/scenery.js";
import { parse, isDirection } from "./parser.js";
import * as render from "./render.js";

// Snapshot the initial room contents so we can restore on restart/new-game.
const INITIAL_ROOM_CONTENTS = (() => {
  const snap = {};
  for (const [id, r] of Object.entries(ROOMS)) {
    snap[id] = [...(r.contents || [])];
  }
  return snap;
})();

function resetRooms() {
  for (const [id, contents] of Object.entries(INITIAL_ROOM_CONTENTS)) {
    ROOMS[id].contents = [...contents];
  }
}

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
      foundFobKey: false,
      readWillFragment: false,
      eastSealBroken: false,
      westSealBroken: false,
      readBotanicalGuide: false,
      tookMonkshood: false,
      cassandraReleased: false,
      letterD_east: false,
      examinedCassandraPortrait: false,
      examinedJulienPortrait: false,
      examinedBeatricePortrait: false,
      examinedEdmundPortrait: false,
      passageOpened: false,
      readJulienDiary: false,
      julienReleased: false,
      letterR_west: false,
      crepeCut: false,
      testedBalcony: false,
      musicBoxWound: false,
      openedLocket: false,
      beatriceReleased: false,
      letterE_upstairs: false,
      cellarOpened: false,
      steamRoute: "hall",
      chuteThawed: false,
      readWineLedger: false,
      hollisReleased: false,
      letterD_cellar: false,
      tokensPlaced: false,
      candlesLit: false,
      won: false,
      wonClean: false,
      foundCatName: false,
      foundWeddingRing: false,
      readGreenBook: false,
      brief: false, // brief mode: revisits get short descriptions
    },
    score: 0,
    scoreLog: [],
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

// ---------- Scoring ----------

export const MAX_SCORE = 130;

// Award points once for the given reason; subsequent calls with the same
// reason are ignored (idempotent). Quietly notifies the player when a point
// is earned, so the world feels responsive.
export function awardPoints(amount, reason) {
  if (!state.scoreLog) state.scoreLog = [];
  if (state.scoreLog.includes(reason)) return false;
  state.scoreLog.push(reason);
  state.score = (state.score || 0) + amount;
  // Subtle inline notice. The score command shows the running total.
  render.system(`(+${amount} — ${reason})`);
  return true;
}

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

  const dark = isDark();
  const { items: roomItems, npcs: roomNpcs } = visibleEntities();
  const roomItemsVisible = dark ? [] : roomItems;
  const roomNpcsVisible = dark ? roomNpcs.filter((id) => id === "black_cat") : roomNpcs;
  const allItemIds = [...inventoryItems(), ...roomItemsVisible];

  const itemMatches = matchNoun(noun, allItemIds, ITEMS);
  const npcMatches = matchNoun(noun, roomNpcsVisible, NPCS);
  const all = [
    ...itemMatches.map((id) => ({ kind: "item", id })),
    ...npcMatches.map((id) => ({ kind: "npc", id })),
  ];
  if (all.length === 0) return { kind: "none", ids: [] };
  if (all.length === 1) return { kind: all[0].kind, ids: [all[0].id] };
  return { kind: "ambiguous", ids: all.map((x) => x.id) };
}

// ---------- Output helpers ----------

function isDark() {
  const r = room();
  if (!r.dark) return false;
  // Chapel candles, once lit, banish the darkness in the chapel itself.
  if (r.id === "family_chapel" && state.flags.candlesLit) return false;
  if (state.flags.lampLit && state.lampOil > 0) return false;
  // The cat provides dim light if it's accompanying you.
  const { npcs } = visibleEntities();
  if (npcs.includes("black_cat")) return false;
  return true;
}

function describeRoom(full = true) {
  const r = room();
  if (isDark()) {
    render.printRoomName(r.name);
    render.print("It is pitch dark; you cannot see your hand in front of your face. (You will need a light source.)");
    return;
  }
  render.printRoomName(r.name);
  const longText = typeof r.long === "function" ? r.long(state) : r.long;
  const shortText = typeof r.short === "function" ? r.short(state) : r.short;
  if (full) render.print(longText);
  else render.print(shortText);

  const { items, npcs } = visibleEntities();
  // Build clickable contents listing.
  for (const id of npcs) {
    const npc = NPCS[id];
    const target = (npc.names && npc.names[0]) || id;
    render.printRich([
      `${capFirst(npc.short)}`,
      ` is here.`,
    ].length === 0 ? [] : [
      { noun: capFirst(npc.short), target },
      ` is here.`,
    ]);
  }
  for (const id of items) {
    const it = ITEMS[id];
    const target = (it.names && it.names[0]) || id;
    if (it.takeable !== false) {
      render.printRich([
        `There is `,
        { noun: it.short, target },
        ` here.`,
      ]);
    } else {
      render.printRich([
        `You see `,
        { noun: it.short, target },
        `.`,
      ]);
    }
  }

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
        target = result.redirect;
        continue;
      }
    }
    const firstVisit = !state.visited.has(target);
    state.currentRoom = target;
    state.visited.add(target);
    if (!silent) {
      // Brief mode: short description on revisits, full on first visit.
      const useFull = firstVisit || !state.flags.brief;
      describeRoom(useFull);
    }
    // Auto-save the first time you enter any room - so a death right after
    // exploring a new region doesn't undo your progress.
    if (firstVisit && !state.over) autoSave();
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
  if (res.kind === "none") {
    const sc = lookupScenery(cmd.noun);
    if (sc != null) {
      state.lastNoun = cmd.noun;
      return sc;
    }
    return `You see no ${cmd.noun} here.`;
  }
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
  if (isDark()) return "It is too dark to see anything to take.";
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

function lookupScenery(noun) {
  const sc = SCENERY[state.currentRoom];
  if (!sc || !sc.examine) return null;
  const n = String(noun || "").toLowerCase().trim();
  if (!n) return null;
  for (const entry of sc.examine) {
    for (const a of entry.aliases) {
      const al = a.toLowerCase();
      if (n === al || n.includes(al) || al.includes(n)) {
        return typeof entry.text === "function" ? entry.text(state) : entry.text;
      }
    }
  }
  return null;
}

function vListen() {
  const sc = SCENERY[state.currentRoom];
  if (sc && sc.listen) return typeof sc.listen === "function" ? sc.listen(state) : sc.listen;
  return "You hear nothing of note — only the slow breath of the house.";
}

function vSmell() {
  const sc = SCENERY[state.currentRoom];
  if (sc && sc.smell) return typeof sc.smell === "function" ? sc.smell(state) : sc.smell;
  return "Old dust, mostly.";
}

function vRead(cmd) {
  if (!cmd.noun) return "Read what?";
  const res = resolveNoun(cmd.noun);
  if (res.kind === "none") return `You see no ${cmd.noun} to read.`;
  if (res.kind === "ambiguous") return disambiguate(cmd.noun, res.ids);
  if (res.kind === "npc") return "That is not something you can read.";
  state.lastNoun = cmd.noun;
  const it = ITEMS[res.ids[0]];
  if (it.onRead) {
    const out = it.onRead(state);
    if (out != null) return out;
  }
  // Fall back to the description if it's at all readable.
  return `There is nothing written on ${it.short}.`;
}

function vSearch(cmd) {
  if (!cmd.noun) return "Search what?";
  const res = resolveNoun(cmd.noun);
  if (res.kind === "none") return `You see no ${cmd.noun} here.`;
  if (res.kind === "ambiguous") return disambiguate(cmd.noun, res.ids);
  state.lastNoun = cmd.noun;
  // Items/NPCs may handle search via onCommand; default falls through to examine.
  return vExamine(cmd);
}

function vUnlock(cmd) {
  if (!cmd.noun) return "Unlock what?";
  if (!cmd.secondNoun) return `Unlock ${cmd.noun} with what?`;
  // Resolve target (the thing being unlocked).
  const res = resolveNoun(cmd.noun);
  if (res.kind === "none") return `You see no ${cmd.noun} here.`;
  if (res.kind === "ambiguous") return disambiguate(cmd.noun, res.ids);
  state.lastNoun = cmd.noun;
  // Resolve key (must be in inventory).
  const keyIds = matchNoun(cmd.secondNoun, inventoryItems(), ITEMS);
  if (keyIds.length === 0) return `You are not carrying any ${cmd.secondNoun}.`;
  if (keyIds.length > 1) return disambiguate(cmd.secondNoun, keyIds);

  // Routing: target's onUnlock(keyId) > target's onCommand > default refusal.
  const targetId = res.ids[0];
  const target = ITEMS[targetId];
  if (target && target.onUnlock) {
    const out = target.onUnlock(state, keyIds[0]);
    if (out != null) return out;
  }
  if (target && target.onCommand) {
    const out = target.onCommand(state, cmd);
    if (out != null) return out;
  }
  return `${capFirst(target.short)} does not yield to ${ITEMS[keyIds[0]].short}.`;
}

function vBreak(cmd) {
  if (!cmd.noun) return "Break what?";
  // Route to room/item onCommand; engine has no generic break behavior.
  const r = room();
  if (r.onCommand) {
    const out = r.onCommand(state, cmd);
    if (out != null) return out;
  }
  return "Some things resist breaking, and this is one of them.";
}

function evalDialogue(value, state) {
  if (typeof value === "function") {
    try { return value(state); } catch { return null; }
  }
  return value;
}

function vTalk(cmd) {
  if (!cmd.noun) return "Talk to whom?";
  const { npcs } = visibleEntities();
  const ids = matchNoun(cmd.noun, npcs, NPCS);
  if (ids.length === 0) return `There is no ${cmd.noun} here to talk to.`;
  if (ids.length > 1) return disambiguate(cmd.noun, ids);
  state.lastNoun = cmd.noun;
  const npc = NPCS[ids[0]];
  if (npc.onTalk) {
    const out = npc.onTalk(state);
    if (out != null) return out;
  }
  const def = npc.dialogue && evalDialogue(npc.dialogue.default, state);
  return def || `${capFirst(npc.short)} regards you in silence.`;
}

function vAsk(cmd) {
  if (!cmd.noun) return "Ask whom?";
  if (!cmd.secondNoun) return `Ask ${cmd.noun} about what?`;
  const { npcs } = visibleEntities();
  const ids = matchNoun(cmd.noun, npcs, NPCS);
  if (ids.length === 0) return `There is no ${cmd.noun} here to ask.`;
  if (ids.length > 1) return disambiguate(cmd.noun, ids);
  state.lastNoun = cmd.noun;
  const npc = NPCS[ids[0]];
  const topic = cmd.secondNoun.toLowerCase().trim();
  if (npc.onAsk) {
    const out = npc.onAsk(state, topic);
    if (out != null) return out;
  }
  if (npc.dialogue) {
    // Match topic against dialogue keys (substring on either side).
    for (const key of Object.keys(npc.dialogue)) {
      if (key === "default") continue;
      if (topic.includes(key) || key.includes(topic)) {
        const v = evalDialogue(npc.dialogue[key], state);
        if (v != null) return v;
      }
    }
  }
  return `${capFirst(npc.short)} has nothing to say about that.`;
}

function vSay(cmd) {
  const word = (cmd.noun || cmd.secondNoun || "").trim();
  if (!word) return "Say what?";
  state.lastNoun = word;
  // Rooms can intercept `say` for ritual/finale logic.
  const r = room();
  if (r.onCommand) {
    const out = r.onCommand(state, cmd);
    if (out != null) return out;
  }
  return `Your voice carries through the rooms and is answered only by silence.`;
}

function vShow(cmd) {
  if (!cmd.noun) return "Show what?";
  if (!cmd.secondNoun) return `Show ${cmd.noun} to whom?`;
  const itemIds = matchNoun(cmd.noun, inventoryItems(), ITEMS);
  if (itemIds.length === 0) return `You are not carrying any ${cmd.noun}.`;
  if (itemIds.length > 1) return disambiguate(cmd.noun, itemIds);
  const { npcs } = visibleEntities();
  const npcIds = matchNoun(cmd.secondNoun, npcs, NPCS);
  if (npcIds.length === 0) return `There is no ${cmd.secondNoun} here.`;
  if (npcIds.length > 1) return disambiguate(cmd.secondNoun, npcIds);
  state.lastNoun = cmd.noun;
  const npc = NPCS[npcIds[0]];
  if (npc.onShow) {
    const out = npc.onShow(state, itemIds[0]);
    if (out != null) return out;
  }
  return `${capFirst(npc.short)} regards ${ITEMS[itemIds[0]].short} without comment.`;
}

function vGive(cmd) {
  // Identical plumbing to vShow; routes via onGive then falls back.
  if (!cmd.noun) return "Give what?";
  if (!cmd.secondNoun) return `Give ${cmd.noun} to whom?`;
  const itemIds = matchNoun(cmd.noun, inventoryItems(), ITEMS);
  if (itemIds.length === 0) return `You are not carrying any ${cmd.noun}.`;
  if (itemIds.length > 1) return disambiguate(cmd.noun, itemIds);
  const { npcs } = visibleEntities();
  const npcIds = matchNoun(cmd.secondNoun, npcs, NPCS);
  if (npcIds.length === 0) return `There is no ${cmd.secondNoun} here.`;
  if (npcIds.length > 1) return disambiguate(cmd.secondNoun, npcIds);
  state.lastNoun = cmd.noun;
  const npc = NPCS[npcIds[0]];
  if (npc.onGive) {
    const out = npc.onGive(state, itemIds[0]);
    if (out != null) {
      // If onGive consumed the item, we expect them to have removed it from inventory.
      return out;
    }
  }
  return `${capFirst(npc.short)} declines.`;
}

// ---------- Save / load ----------

const SAVE_PREFIX = "ashvale.save.";

function serializeState() {
  const roomContents = {};
  for (const [id, r] of Object.entries(ROOMS)) roomContents[id] = [...(r.contents || [])];
  return {
    version: 1,
    state: {
      ...state,
      visited: [...state.visited],
    },
    rooms: roomContents,
  };
}

function applySave(payload) {
  if (!payload || payload.version !== 1) return false;
  const restored = { ...payload.state };
  restored.visited = new Set(payload.state.visited || []);
  // Carry forward any missing flags from a fresh state (forward-compat).
  const fresh = newState();
  restored.flags = { ...fresh.flags, ...(restored.flags || {}) };
  state = restored;
  // Restore room contents.
  for (const [id, contents] of Object.entries(payload.rooms || {})) {
    if (ROOMS[id]) ROOMS[id].contents = [...contents];
  }
  return true;
}

function saveToSlot(slot) {
  try {
    const data = JSON.stringify(serializeState());
    if (typeof localStorage === "undefined") return false;
    localStorage.setItem(SAVE_PREFIX + slot, data);
    return true;
  } catch (e) {
    console.warn("[Ashvale] save failed:", e);
    return false;
  }
}

function vSave(cmd) {
  const slot = (cmd.noun || "manual").toLowerCase().replace(/\s+/g, "_");
  if (saveToSlot(slot)) return `Saved as '${slot}'. (Use 'load ${slot}' to restore.)`;
  return "(Save failed. localStorage may be unavailable.)";
}

function autoSave() {
  // Quietly snapshot state to the 'auto' slot. Used at milestones so deaths
  // don't cost the player too much progress.
  saveToSlot("auto");
}

function vLoad(cmd) {
  const slot = (cmd.noun || "auto").toLowerCase().replace(/\s+/g, "_");
  try {
    if (typeof localStorage === "undefined") return "(localStorage unavailable.)";
    const raw = localStorage.getItem(SAVE_PREFIX + slot);
    if (!raw) return `No save found in slot '${slot}'.`;
    const payload = JSON.parse(raw);
    if (!applySave(payload)) return "That save is from an incompatible version.";
    render.clear();
    render.system(`Restored from '${slot}'.`);
    describeRoom(true);
    syncStatus();
    return null;
  } catch (e) {
    return `Load failed: ${e.message}`;
  }
}

function vRestart() {
  resetRooms();
  state = newState();
  render.clear();
  startGame();
  return null;
}

// ---------- Hint / notebook / score ----------

function vHint() {
  const matched = HINTS.find((h) => {
    try { return h.when(state); } catch { return false; }
  });
  if (!matched) return "Nothing comes to mind right now.";
  return `(Hint) ${matched.text}`;
}

function vNotebook() {
  const lines = ["Vance's notebook:"];
  const entries = NOTEBOOK_ENTRIES.filter((e) => state.flags[e.flag]);
  if (entries.length === 0) {
    lines.push("  (You have not written anything yet.)");
  } else {
    for (const e of entries) lines.push(`  - ${e.text}`);
  }
  // Killer-name letters collected so far (one per region).
  const letters = [];
  for (const region of Object.values(KILLER_LETTERS)) {
    if (state.flags[region.flag]) letters.push(region.letter);
  }
  lines.push("");
  if (letters.length === 0) {
    lines.push("  Killer's name: ???? ??????");
  } else {
    lines.push(`  Killer's name (letters so far): ${letters.join(" ")}`);
  }
  lines.push(`  Tokens recovered: ${state.tokensCollected.length}/4`);
  return lines;
}

// Pixel layout for the SVG map. Each entry is a top-left (x, y) for the
// 100x44 room rect, plus the label drawn inside.
const MAP_PIXEL_LAYOUT = {
  // Upstairs (top of the diagram)
  linen_closet:     { x: 250, y: 130, label: "Linen Closet" },
  landing:          { x: 390, y: 130, label: "Landing" },
  master_bedroom:   { x: 530, y: 130, label: "Master Bdrm" },
  nursery:          { x: 390, y:  60, label: "Nursery" },

  // West Wing
  library:          { x: 250, y: 240, label: "Library" },
  hidden_passage:   { x: 110, y: 320, label: "Hidden Pass." },
  portrait_gallery: { x: 250, y: 320, label: "Gallery" },
  west_corridor:    { x: 390, y: 320, label: "West Corr." },

  // East Wing
  conservatory:     { x: 530, y: 240, label: "Conservatory" },
  stone_folly:      { x: 670, y: 240, label: "Stone Folly" },
  east_corridor:    { x: 530, y: 320, label: "East Corr." },
  hedge_maze:       { x: 670, y: 320, label: "Hedge Maze" },

  // Ground floor (the foyer line)
  servants_hall:    { x: 110, y: 410, label: "Servants" },
  dining_room:      { x: 250, y: 410, label: "Dining Rm" },
  foyer:            { x: 390, y: 410, label: "FOYER" },
  study:            { x: 530, y: 410, label: "Study" },

  // South of the foyer
  drawing_room:     { x: 390, y: 490, label: "Drawing Rm" },
  garden:           { x: 390, y: 570, label: "Garden" },
  front_door:       { x: 250, y: 570, label: "Front Door" },
  iron_gate:        { x: 250, y: 650, label: "Iron Gate" },

  // Cellar
  wine_cellar:      { x: 250, y: 760, label: "Wine Cellar" },
  cellar_stair:     { x: 250, y: 830, label: "Cellar Stair" },
  boiler_room:      { x: 390, y: 830, label: "Boiler Rm" },
  coal_chute:       { x: 530, y: 830, label: "Coal Chute" },

  // Crypt
  crypt_stair:      { x: 250, y: 960, label: "Crypt Stair" },
  family_crypt:     { x: 390, y: 960, label: "Family Crypt" },
  family_chapel:    { x: 530, y: 960, label: "Family Chapel" },
};

// Section labels to draw as headings on the SVG.
const MAP_SECTIONS = [
  { x: 110, y: 115, label: "Upstairs" },
  { x: 110, y: 225, label: "Ground Floor" },
  { x: 110, y: 745, label: "Cellar (down from Foyer)" },
  { x: 110, y: 945, label: "Crypt (foyer clock)" },
];

// Short labels (max 9 chars) used in the textual map fallback.
const MAP_LABELS = {
  iron_gate: "Iron Gate",
  front_door: "Front Door",
  garden: "Garden",
  drawing_room: "Drawing",
  foyer: "FOYER",
  dining_room: "Dining",
  servants_hall: "Servants",
  study: "Study",
  east_corridor: "E. Corr.",
  conservatory: "Conserv.",
  hedge_maze: "Hedge",
  stone_folly: "Folly",
  west_corridor: "W. Corr.",
  library: "Library",
  portrait_gallery: "Gallery",
  hidden_passage: "Passage",
  landing: "Landing",
  master_bedroom: "Master",
  linen_closet: "Linen",
  nursery: "Nursery",
  cellar_stair: "C. Stair",
  wine_cellar: "Wine",
  boiler_room: "Boiler",
  coal_chute: "Chute",
  crypt_stair: "K. Stair",
  family_crypt: "Crypt",
  family_chapel: "Chapel",
};

// Render a single room cell: 14 characters wide, fixed.
//   current:   [★ Name        ]
//   visited:   [  Name        ]
//   unvisited: [  ?           ]
function mapCell(id) {
  const W = 14;        // total cell width including the brackets
  const inner = W - 2; // chars between [ and ]
  const label = MAP_LABELS[id] || id;
  let body;
  if (state.currentRoom === id) body = ("★ " + label).padEnd(inner);
  else if (state.visited.has(id)) body = ("  " + label).padEnd(inner);
  else body = "  ?".padEnd(inner);
  return "[" + body + "]";
}

// Build the edge list from ROOMS data + a small set of explicit
// inter-region transitions (stairs, the foyer clock).
function buildMapEdges() {
  const edges = [];
  const seen = new Set();
  // Direct exits between rooms that both appear in the map layout.
  for (const [id, r] of Object.entries(ROOMS)) {
    if (!MAP_PIXEL_LAYOUT[id]) continue;
    for (const dest of Object.values(r.exits || {})) {
      if (!dest || !MAP_PIXEL_LAYOUT[dest]) continue;
      const key = id < dest ? `${id}|${dest}` : `${dest}|${id}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push({ from: id, to: dest, kind: "exit" });
    }
  }
  // Inter-level transitions that aren't expressed as direct exits in ROOMS
  // (the foyer clock, the upstairs stair, the cellar stair).
  const stairs = [
    ["foyer", "landing"],         // up
    ["foyer", "cellar_stair"],    // down (after pry)
    ["foyer", "crypt_stair"],     // clock (after 4 tokens)
  ];
  for (const [a, b] of stairs) {
    if (!MAP_PIXEL_LAYOUT[a] || !MAP_PIXEL_LAYOUT[b]) continue;
    const key = a < b ? `${a}|${b}` : `${b}|${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ from: a, to: b, kind: "stair" });
  }
  return edges;
}

function vMap() {
  // Render an SVG diagram in an overlay panel. The textual fallback is no
  // longer printed in the transcript - the overlay replaces it.
  render.showMap({
    layout: MAP_PIXEL_LAYOUT,
    edges: buildMapEdges(),
    sections: MAP_SECTIONS,
    currentRoom: state.currentRoom,
    visited: state.visited,
    tokens: state.tokensCollected.length,
    totalTokens: 4,
  });
  // Don't print anything in the transcript.
  return null;
}

// Legacy textual map (kept for headless tests / fallback). Not currently called.
function vMapText() {
  const m = mapCell;
  const sp = (n) => " ".repeat(Math.max(0, n));
  const at = (c) => sp(3 + c * 18);
  const center = (c) => sp(3 + c * 18 + 7);
  const lines = [];

  lines.push("              ASHVALE MANOR — MAP");
  lines.push("");
  lines.push("                          N");
  lines.push("                          │");
  lines.push("                    W ────●──── E");
  lines.push("                          │");
  lines.push("                          S");
  lines.push("");
  lines.push("       ★ = your location  ·  ? = unvisited");
  lines.push("");

  // GROUND FLOOR
  lines.push("─── GROUND FLOOR ─────────────────────────────────────────────────");
  lines.push("");
  //  cols:        0              1              2 (FOYER)      3
  lines.push(`${at(0)}${m("servants_hall")} ── ${m("dining_room")} ── ${m("foyer")} ── ${m("study")}`);
  lines.push(`${center(2)}│`);
  lines.push(`${at(2)}${m("drawing_room")}`);
  lines.push(`${center(2)}│`);
  lines.push(`${at(2)}${m("garden")} ── ${m("front_door")}`);
  lines.push(`${center(3)}│`);
  lines.push(`${at(3)}${m("iron_gate")}`);
  lines.push("");

  // EAST WING — east_corridor at col 1 (NE of foyer), hedge at col 2, folly at col 2 row above
  lines.push("─── EAST WING (NE from Foyer) ────────────────────────────────────");
  lines.push("");
  lines.push(`${at(1)}${m("conservatory")}    ${m("stone_folly")}`);
  lines.push(`${center(1)}│${sp(14 + 4 - 1)}│`);
  lines.push(`${sp(0)}   FOYER ─NE─ ${m("east_corridor")} ──── ${m("hedge_maze")}`);
  lines.push("");

  // WEST WING — west_corridor at col 2 (so SE arrow points to FOYER); library above; gallery & passage to W
  lines.push("─── WEST WING (NW from Foyer) ────────────────────────────────────");
  lines.push("");
  lines.push(`${at(2)}${m("library")}`);
  lines.push(`${center(2)}│`);
  lines.push(`${at(0)}${m("hidden_passage")} ── ${m("portrait_gallery")} ── ${m("west_corridor")} ─SE─ FOYER`);
  lines.push("   (passage opens after the gallery puzzle)");
  lines.push("");

  // UPSTAIRS — nursery north of landing; landing in middle; linen W, master E
  lines.push("─── UPSTAIRS (up from Foyer, after cutting crepe) ────────────────");
  lines.push("");
  lines.push(`${at(1)}${m("nursery")}`);
  lines.push(`${center(1)}│  (rotten balcony — test before crossing)`);
  lines.push(`${at(0)}${m("linen_closet")} ── ${m("landing")} ── ${m("master_bedroom")}`);
  lines.push(`${center(1)}│`);
  lines.push(`${center(1)}↓ down to FOYER`);
  lines.push("");

  // CELLAR — wine north of cellar_stair; cellar_stair, boiler, chute east-west
  lines.push("─── CELLAR (down from Foyer, after prying latch — DARK) ──────────");
  lines.push("   Cellar rooms are dark. You need the lamp lit, or the cat.");
  lines.push("");
  lines.push(`${at(0)}${m("wine_cellar")}`);
  lines.push(`${center(0)}│`);
  lines.push(`${at(0)}${m("cellar_stair")} ── ${m("boiler_room")} ── ${m("coal_chute")}`);
  lines.push(`${center(0)}│`);
  lines.push(`${center(0)}↑ up to FOYER`);
  lines.push("");

  // CRYPT — crypt_stair down from foyer clock, then crypt, then chapel
  lines.push("─── CRYPT (open the foyer clock, after all four tokens) ──────────");
  lines.push("");
  lines.push(`${at(0)}${m("crypt_stair")} ── ${m("family_crypt")} ── ${m("family_chapel")}`);
  lines.push(`${center(0)}│`);
  lines.push(`${center(0)}↑ up via the foyer clock`);
  lines.push("");

  // Stats footer.
  const tokens = state.tokensCollected.length;
  const visitedCount = state.visited.size;
  lines.push(`   Tokens recovered: ${tokens}/4   ·   Rooms discovered: ${visitedCount}/${Object.keys(MAP_LABELS).length}`);

  return lines;
}

function rankFor(score) {
  if (score >= 110) return "Pristine";       // close to a perfect run
  if (score >=  85) return "Adept Investigator";
  if (score >=  60) return "Competent";
  if (score >=  30) return "Earnest";
  return "Untrained";
}

function vScore() {
  const score = state.score || 0;
  return [
    `Score: ${score}/${MAX_SCORE}  (${rankFor(score)})`,
    `Turn: ${state.turnCount}`,
    `Tokens recovered: ${state.tokensCollected.length}/4`,
    `Notebook entries: ${NOTEBOOK_ENTRIES.filter((e) => state.flags[e.flag]).length}`,
    `Rooms visited: ${state.visited.size}`,
  ];
}

function currentExits() {
  const r = room();
  return Object.keys(r.exits || {}).filter((d) => r.exits[d]);
}

// Emit an atmospheric flavor line every so often, never twice the same line in
// a row. Tuned to ~1-in-7 turns so it adds mood without being noisy.
let lastAmbient = -1;
function maybePrintAmbient() {
  // Allow tests / debugging to disable ambient flavor entirely.
  if (typeof globalThis !== "undefined" && globalThis.__ASHVALE_NO_AMBIENT__) return;
  if (state.turnCount < 4) return; // give the player a moment to settle in
  if (Math.random() > 1 / 7) return;
  const candidates = [];
  for (let i = 0; i < AMBIENT_LINES.length; i++) {
    if (i === lastAmbient) continue;
    const line = AMBIENT_LINES[i];
    try { if (line.when(state)) candidates.push(i); } catch { /* skip */ }
  }
  if (candidates.length === 0) return;
  const idx = candidates[Math.floor(Math.random() * candidates.length)];
  lastAmbient = idx;
  render.system(AMBIENT_LINES[idx].text);
}

function syncStatus() {
  const r = room();
  render.updateStatus({
    roomName: r.name,
    turnCount: state.turnCount,
    lampOil: state.lampOil,
    lampLit: state.flags.lampLit,
    exits: currentExits(),
  });
}

function vExits() {
  const exits = currentExits();
  if (exits.length === 0) return "There is no obvious way out.";
  return "Obvious exits: " + exits.join(", ") + ".";
}

function vVerbose() {
  state.flags.brief = false;
  return "Verbose mode: every room is fully described on each visit.";
}

function vBrief() {
  state.flags.brief = true;
  return "Brief mode: a room you have visited before will only show its name and exits. (Use `look` to see the full description, or `verbose` to switch back.)";
}

function vHelp() {
  return [
    "Commands:",
    "  Movement: north (n), south, east, west, up, down, ne, nw, se, sw",
    "            enter <thing>, exit, climb, go <dir>, exits",
    "  Look:     look (l), examine <X> (x), read <X>, search <X>, listen, smell",
    "  Items:    take <X>, take all, drop <X>, inventory (i)",
    "  Use:      use <X>, use <X> on <Y>, light <X>, extinguish <X>",
    "            unlock <X> with <Y>, open/close/push/pull/turn <X>",
    "            break <X> with <Y>, wind/play <X>, show <X> to <Y>",
    "  Talk:     talk to <NPC>, ask <NPC> about <topic>, say <word>",
    "  Save:     save [slot], load [slot], restart",
    "            (auto-saves to slot 'auto' on each milestone)",
    "  Meta:     wait (z), again (g), help, hint, notebook, map, score, quit",
    "            verbose / brief (revisits show short descriptions)",
    "  Input:    up/down arrows = history, Tab = autocomplete, Esc = clear",
    "            click any underlined item or NPC to examine it",
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
  listen: vListen, smell: vSmell,
  take: vTake, drop: vDrop, inventory: vInventory,
  help: vHelp, quit: vQuit, wait: vWait,
  read: vRead, search: vSearch,
  unlock: vUnlock, break: vBreak,
  talk: vTalk, ask: vAsk, tell: vAsk, say: vSay,
  show: vShow, give: vGive,
  save: vSave, load: vLoad, restart: vRestart,
  hint: vHint, notebook: vNotebook, score: vScore, map: vMap,
  exits: vExits, verbose: vVerbose, brief: vBrief,
};

function dispatch(cmd) {
  // Room-level override gets first crack — needed so rooms can intercept
  // movement (e.g. the rotten balcony) before the engine resolves exits.
  const r = room();
  if (r.onCommand) {
    const out = r.onCommand(state, cmd);
    if (out && typeof out === "object" && out.__move) {
      if (out.message) render.print(out.message);
      enterRoom(out.__move);
      return null;
    }
    if (out != null) return out;
  }

  // Movement: bare directions.
  if (isDirection(cmd.verb)) return move(cmd.verb);

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

const RECOVERY_VERBS = new Set(["restart", "load", "save", "help", "notebook", "score", "map"]);
// Verbs that don't burn a turn (looking at notes, saving, etc.).
const NO_TURN_VERBS = new Set(["save", "load", "restart", "help", "hint", "notebook", "score", "map", "quit", "exits", "verbose", "brief"]);

export function executeInput(rawInput) {
  const cmd = parse(rawInput);

  if (cmd.kind === "empty") return;

  // Game-over recovery: allow restart / load (so the player can revive from a
  // save) plus harmless meta verbs. Everything else bounces with a hint.
  if (state.over && cmd.kind === "command" && !RECOVERY_VERBS.has(cmd.verb)) {
    const hasAuto = typeof localStorage !== "undefined" && localStorage.getItem(SAVE_PREFIX + "auto");
    const hint = hasAuto
      ? "Type 'load auto' to recover from your last milestone, or 'restart' to begin again."
      : "Type 'restart' to begin again, or 'load <slot>' if you saved earlier.";
    render.system("The game is over. " + hint);
    return;
  }

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
  const flagsBefore = { ...state.flags };
  const tokensBefore = state.tokensCollected.length;
  const out = dispatch(cmd);
  if (out != null) render.print(out);
  // Meta verbs (looking at your map / saving / asking for a hint) don't
  // consume a turn. World-acting verbs do.
  if (!NO_TURN_VERBS.has(cmd.verb)) {
    state.turnCount += 1;
    state.lastCommand = cmd.raw;
  }

  // Token milestone scoring (auto-save happens AFTER all scoring below so the
  // snapshot captures every point earned this turn, not just some).
  let tokenJustEarned = false;
  if (state.tokensCollected.length > tokensBefore && !state.over) {
    awardPoints(20, `recovered ${state.tokensCollected[state.tokensCollected.length - 1].replace(/_/g, " ")}`);
    tokenJustEarned = true;
  }
  // Score ghost releases (separate from the token, for clean releases).
  const releasedFlags = ["cassandraReleased", "julienReleased", "beatriceReleased", "hollisReleased"];
  for (const f of releasedFlags) {
    if (state.flags[f] && !flagsBefore[f]) {
      awardPoints(5, `${f.replace("Released", "")} laid to rest`);
    }
  }
  // Score one-time optional discoveries.
  const optional = [
    ["readEdmundLetter", 5, "you read Edmund's last letter"],
    ["readSlate", 5, "you read Mrs. Crow's slate"],
    ["catFed", 3, "you befriended the cat"],
    ["readWillFragment", 5, "you read the will fragment"],
    ["readBotanicalGuide", 3, "you consulted the botanical guide"],
    ["readJulienDiary", 3, "you read Julien's diary"],
    ["openedLocket", 3, "you opened Beatrice's locket"],
    ["readWineLedger", 3, "you read the wine cellar ledger"],
    ["letterD_east", 2, "you noted the sundial's letter"],
    ["letterR_west", 2, "you noted the letter on the blade"],
    ["letterE_upstairs", 2, "you noted the letter in the locket"],
    ["letterD_cellar", 2, "you noted the ledger's signature"],
  ];
  for (const [flag, pts, reason] of optional) {
    if (state.flags[flag] && !flagsBefore[flag]) awardPoints(pts, reason);
  }
  // Hidden discoveries (defined later in the data files).
  const hidden = [
    ["foundCatName", 3, "the cat finally named itself"],
    ["foundWeddingRing", 5, "you found Edmund's wedding ring"],
    ["readGreenBook", 5, "you read the green-cloth book"],
  ];
  for (const [flag, pts, reason] of hidden) {
    if (state.flags[flag] && !flagsBefore[flag]) awardPoints(pts, reason);
  }
  // Mark Hollis as released when his watch is taken (he stays at peace once
  // the watch is in hand) — keeps the "released" scoring symmetrical.
  if (state.tokensCollected.includes("pocket_watch_token") && !state.flags.hollisReleased) {
    state.flags.hollisReleased = true;
  }
  // Win bonus + final score line, printed once after the chapel finale.
  if (state.flags.won && !flagsBefore.won) {
    awardPoints(10, "the manor freed");
    const score = state.score || 0;
    const rank = rankFor(score);
    render.print("");
    render.win(`Final score: ${score}/${MAX_SCORE}  —  rank: ${rank}.`);
  }

  // Auto-save AFTER all scoring so the snapshot is internally consistent.
  if (tokenJustEarned) autoSave();

  // Occasional atmospheric flavor line. Skipped on look/examine and other
  // verbs that don't move the world; only world-acting turns can trigger it.
  if (!state.over && !NO_TURN_VERBS.has(cmd.verb)) {
    maybePrintAmbient();
  }

  // Lamp/oil tick: consume oil only in dark rooms with no cat-light.
  if (!state.over) {
    const r = ROOMS[state.currentRoom];
    if (r && r.dark && state.flags.lampLit) {
      const { npcs } = visibleEntities();
      const catHere = npcs.includes("black_cat");
      if (!catHere) {
        state.lampOil = Math.max(0, state.lampOil - 1);
        if (state.lampOil === 0) {
          state.flags.lampLit = false;
          render.system("The lamp's flame leans, leans further, and goes out.");
          if (r.dark) {
            state.over = true;
            render.death(
              "In the dark, you reach for a wall that is not where you remember leaving it. " +
              "The flagstones come up and meet your forehead. Whatever waits in this cellar " +
              "with you waits patiently. The manor counts you among its dead now."
            );
          }
        } else if (state.lampOil <= 5) {
          render.system(`(The lamp burns low — ${state.lampOil} oil.)`);
        }
      }
    }
  }

  // Auto-record any new notebook-worthy flags that flipped this turn.
  for (const entry of NOTEBOOK_ENTRIES) {
    if (state.flags[entry.flag] && !flagsBefore[entry.flag]) {
      render.system(`(Notebook updated.)`);
      break;
    }
  }

  syncStatus();
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
  // First-turn onboarding for new players. Concise, not patronising.
  render.system(
    "First time? Try `look`, `examine telegram`, `take telegram`, then `north`.\n" +
    "Useful any time: `help`, `hint`, `notebook`, `map`. Up/Down for history. Tab to autocomplete."
  );
  render.print("");
  enterRoom(state.currentRoom);
  const r = room();
  render.updateStatus({
    roomName: r.name,
    turnCount: state.turnCount,
    lampOil: state.lampOil,
    lampLit: state.flags.lampLit,
  });
}

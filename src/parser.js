// Parser: tokenize -> normalize -> classify into a command structure.
// Noun resolution against the world is done by the engine so the parser stays
// data-only.

// Verb synonym map. Keys are canonical verbs; values are aliases.
export const VERBS = {
  // movement
  north: ["north", "n"],
  south: ["south", "s"],
  east: ["east", "e"],
  west: ["west", "w"],
  up: ["up", "u", "upstairs"],
  down: ["down", "d", "downstairs"],
  northeast: ["northeast", "ne"],
  northwest: ["northwest", "nw"],
  southeast: ["southeast", "se"],
  southwest: ["southwest", "sw"],
  go: ["go", "walk", "move", "head", "travel"],
  enter: ["enter"],
  exit: ["exit", "leave", "out"],
  climb: ["climb"],

  // observation
  look: ["look", "l"],
  examine: ["examine", "x", "inspect", "check", "study"],
  read: ["read", "peruse"],
  search: ["search", "rummage"],
  listen: ["listen"],
  smell: ["smell", "sniff"],
  taste: ["taste"],
  touch: ["touch", "feel"],
  test: ["test"],

  // manipulation
  take: ["take", "get", "grab", "pick", "pickup"],
  drop: ["drop", "discard", "leave"],
  put: ["put", "place", "insert", "set"],
  name: ["name"],
  open: ["open"],
  close: ["close", "shut"],
  push: ["push", "press"],
  pull: ["pull", "yank"],
  turn: ["turn", "rotate"],
  unlock: ["unlock"],
  lock: ["lock"],
  break: ["break", "smash", "shatter"],
  cut: ["cut", "slice", "sever"],
  pry: ["pry", "wrench"],
  tie: ["tie", "fasten"],

  // use & state
  use: ["use", "apply"],
  light: ["light", "ignite", "kindle"],
  extinguish: ["extinguish", "douse", "snuff"],
  wear: ["wear", "don"],
  remove: ["remove", "doff"],
  wind: ["wind"],
  play: ["play"],
  feed: ["feed"],
  show: ["show", "present"],
  give: ["give", "hand", "offer"],

  // social/ritual
  talk: ["talk", "speak"],
  ask: ["ask"],
  tell: ["tell"],
  say: ["say", "shout", "whisper", "utter", "pronounce"],
  knock: ["knock", "rap"],
  ring: ["ring"],
  pray: ["pray"],
  eavesdrop: ["eavesdrop"],

  // meta
  inventory: ["inventory", "i", "inv"],
  score: ["score"],
  save: ["save"],
  load: ["load", "restore"],
  restart: ["restart"],
  quit: ["quit"],
  help: ["help", "?"],
  hint: ["hint"],
  notebook: ["notebook", "journal", "notes"],
  map: ["map"],
  verbose: ["verbose"],
  brief: ["brief"],
  again: ["again", "g"],
  wait: ["wait", "z"],
};

// Build a lookup: alias -> canonical verb.
const VERB_LOOKUP = (() => {
  const m = new Map();
  for (const [canon, aliases] of Object.entries(VERBS)) {
    for (const a of aliases) m.set(a, canon);
  }
  return m;
})();

// Direction shortcut: a movement verb that doesn't need "go".
const DIRECTIONS = new Set([
  "north", "south", "east", "west", "up", "down",
  "northeast", "northwest", "southeast", "southwest",
]);
export function isDirection(v) { return DIRECTIONS.has(v); }

// Words to strip out before parsing.
const ARTICLES = new Set(["the", "a", "an", "some", "of"]);
// Words that introduce a second noun.
const PREPOSITIONS = new Set([
  "on", "in", "into", "onto", "at", "to", "with", "using", "from", "under",
  "behind", "over", "about",
]);
// Filler "look at X" -> "examine X".
const LOOK_AT_TRIGGERS = new Set(["at"]);

function tokenize(input) {
  return input.toLowerCase().trim().split(/\s+/).filter(Boolean);
}

function stripFillers(tokens) {
  return tokens.filter((t) => !ARTICLES.has(t));
}

// Levenshtein for unknown-verb suggestion.
function editDistance(a, b) {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp = new Array(n + 1);
  for (let j = 0; j <= n; j++) dp[j] = j;
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prev
        : 1 + Math.min(prev, dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[n];
}

export function suggestVerb(token) {
  let best = null, bestD = 99;
  for (const alias of VERB_LOOKUP.keys()) {
    if (alias.length <= 1) continue;
    const d = editDistance(token, alias);
    if (d < bestD) { bestD = d; best = alias; }
  }
  if (bestD <= 2) return VERB_LOOKUP.get(best);
  return null;
}

// Parse one user input line into a structured command.
// Returns one of:
//   { kind: "empty" }
//   { kind: "unknown", token, suggestion? }
//   { kind: "again" }
//   { kind: "command", verb, noun, prep, secondNoun, raw }
export function parse(rawInput) {
  const raw = rawInput.trim();
  if (!raw) return { kind: "empty" };

  let tokens = tokenize(raw);
  tokens = stripFillers(tokens);
  if (tokens.length === 0) return { kind: "empty" };

  // "again" / "g" -> replay last command (engine handles).
  if (tokens.length === 1 && (tokens[0] === "again" || tokens[0] === "g")) {
    return { kind: "again" };
  }

  // Bare direction: treat as "go <dir>".
  if (tokens.length === 1) {
    const canon = VERB_LOOKUP.get(tokens[0]);
    if (canon && isDirection(canon)) {
      return { kind: "command", verb: canon, noun: null, prep: null, secondNoun: null, raw };
    }
  }

  // "go north" / "walk west" / "go to garden"
  let verbToken = tokens[0];
  let canonical = VERB_LOOKUP.get(verbToken);
  if (!canonical) {
    return { kind: "unknown", token: verbToken, suggestion: suggestVerb(verbToken) };
  }

  let rest = tokens.slice(1);

  // "look at X" => "examine X"
  if (canonical === "look" && rest.length > 0 && LOOK_AT_TRIGGERS.has(rest[0])) {
    canonical = "examine";
    rest = rest.slice(1);
  }

  // "go <dir>" -> normalize to direction verb
  if (canonical === "go" && rest.length > 0) {
    // strip "to" if present
    if (rest[0] === "to") rest = rest.slice(1);
    if (rest.length === 1) {
      const dirCanon = VERB_LOOKUP.get(rest[0]);
      if (dirCanon && isDirection(dirCanon)) {
        return { kind: "command", verb: dirCanon, noun: null, prep: null, secondNoun: null, raw };
      }
    }
  }

  // "pick up X" -> take X
  if (canonical === "take" && rest[0] === "up") rest = rest.slice(1);

  // "talk to X" -> talk X
  if (canonical === "talk" && rest[0] === "to") rest = rest.slice(1);

  // Extract prep + second noun if present.
  let prep = null;
  let secondNoun = null;
  let nounTokens = rest;
  for (let i = 0; i < rest.length; i++) {
    if (PREPOSITIONS.has(rest[i])) {
      prep = rest[i];
      nounTokens = rest.slice(0, i);
      secondNoun = rest.slice(i + 1).join(" ").trim() || null;
      break;
    }
  }

  const noun = nounTokens.join(" ").trim() || null;

  return {
    kind: "command",
    verb: canonical,
    noun,
    prep,
    secondNoun,
    raw,
  };
}

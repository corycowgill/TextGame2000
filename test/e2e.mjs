// End-to-end playthrough test. Headless DOM, captures every output line.
let pass = 0, fail = 0;
const failures = [];
function expect(name, cond, detail) {
  if (cond) { pass++; }
  else { fail++; failures.push(`✗ ${name}${detail ? ' — ' + detail : ''}`); }
}

// Capture transcript content as plain text. Track room/turn/oil status.
const transcript = [];
const status = { room: "", turn: 0, oil: "" };
const fakeT = {
  appendChild(node) { transcript.push(node.textContent); },
  set scrollTop(_) {}, get scrollHeight() { return 0; },
  set innerHTML(v) { if (v === "") transcript.length = 0; },
  addEventListener: () => {},
};
const els = {};
const stEl = (id) => (els[id] ||= {
  set textContent(v) { this._t = v; if (id === "status-room") status.room = v; if (id === "status-turn") status.turn = v; if (id === "status-oil") status.oil = v; },
  get textContent() { return this._t; },
  remove() {},
});
const overlay = { id: "map-overlay", _h: "", set innerHTML(v) { this._h = v; }, get innerHTML() { return this._h; }, style: {}, appendChild() {}, addEventListener() {}, querySelector() { return null; } };
class FakeEl {
  constructor(t) {
    this.tagName = (t||"").toUpperCase();
    this.children = [];
    this._h = "";
    this.style = {};
    this.id = "";
    this._textContent = "";
    this.className = "";
    this.dataset = {};
  }
  appendChild(c) {
    this.children.push(c);
    // Mirror what a real DOM node does: textContent of the parent reflects
    // the concatenation of its children's textContent.
    this._textContent += (c && c.textContent) || "";
  }
  set textContent(v) { this._textContent = v; }
  get textContent() { return this._textContent; }
  addEventListener() {}
  set innerHTML(v) { this._h = v; }
  get innerHTML() { return this._h; }
  remove() {}
  querySelector() { return null; }
}
globalThis.document = {
  head: new FakeEl("head"),
  body: new FakeEl("body"),
  getElementById(id) {
    if (id === "transcript") return fakeT;
    if (id === "input") return { value: "", focus: () => {} };
    if (id === "input-form") return { addEventListener: () => {} };
    if (id === "map-overlay") return overlay;
    return stEl(id);
  },
  createElement(tag) { return new FakeEl(tag); },
  createTextNode(text) { return { nodeType: 3, textContent: String(text) }; },
  addEventListener: () => {}, readyState: "complete",
};
globalThis.window = { addEventListener: () => {} };
globalThis.location = { protocol: "http:" };
globalThis.__ASHVALE_NO_AMBIENT__ = true; // deterministic transcript for assertions
const lsStore = new Map();
globalThis.localStorage = {
  getItem: k => lsStore.has(k) ? lsStore.get(k) : null,
  setItem: (k, v) => lsStore.set(k, v),
  removeItem: k => lsStore.delete(k),
};

const engine = await import(process.cwd() + "/src/engine.js");

function run(cmd) {
  transcript.length = 0;
  try { engine.executeInput(cmd); } catch (e) { return "EXC:" + e.message; }
  return transcript.join("\n");
}
function out() { return transcript.join("\n"); }
function st() { return engine.getState(); }

// =========== START ===========
engine.startGame();
expect("Start: at iron_gate", st().currentRoom === "iron_gate");
expect("Start: turn 0",       st().turnCount === 0);
expect("Start: nothing carried", st().inventory.length === 0);
expect("Start: shows opening text", out().includes("THE LAST WILL OF ASHVALE"));
expect("Start: describes gate", out().includes("Iron Gate") && out().includes("telegram"));

// ========== Region 0: prologue =============
let t = run("read telegram");
expect("read telegram", t.includes("DR VANCE") && t.includes("DREDGE"));

t = run("n");
expect("n -> front_door", st().currentRoom === "front_door");

t = run("knock");
expect("knock at front door", t.includes("knock") || t.includes("hollow"));

t = run("open door");
expect("open front door fails", t.toLowerCase().includes("locked") || t.includes("not the kind"));

t = run("e");
expect("e -> garden", st().currentRoom === "garden");
expect("garden has stone", out().includes("loose paving stone") || out().includes("stone"));

t = run("examine window");
expect("examine window", t.includes("sash") || t.includes("catch"));

t = run("take stone");
expect("take stone", st().inventory.includes("loose_stone"));

t = run("break window with stone");
expect("break window", t.includes("strike") || t.includes("Glass") || t.includes("clatter"));
expect("window opened flag", st().flags.windowOpened);

t = run("n");
expect("n -> drawing_room", st().currentRoom === "drawing_room");

t = run("take letter");
t = run("read letter");
expect("read sealed letter", t.includes("notary") || t.includes("E.A."));
expect("flag readEdmundLetter", st().flags.readEdmundLetter);

t = run("n");
expect("n -> foyer", st().currentRoom === "foyer");
expect("foyer mentions clock", out().includes("clock"));

// Sealed wings should refuse
t = run("ne");
expect("NE blocked w/o seal break", t.includes("seal") || t.toLowerCase().includes("sealed"));

t = run("up");
expect("Up blocked w/o crepe cut", t.includes("crepe") || t.includes("blade"));

t = run("down");
expect("Down blocked w/o cellar pry", t.includes("cellar") || t.includes("nail") || t.includes("crowbar"));

t = run("feed cat");
expect("feed cat", t.includes("retinue") || t.includes("courtesy"));
expect("catFed flag", st().flags.catFed);

// Talk to crow
t = run("w");
expect("foyer -> dining", st().currentRoom === "dining_room");
t = run("w");
expect("dining -> servants_hall", st().currentRoom === "servants_hall");
t = run("read slate");
expect("read slate", t.includes("MIDNIGHT") || t.includes("PAPERS"));
t = run("ask crow about will");
expect("ask crow about will", t.includes("WILL") && t.includes("BURNT"));
t = run("ask crow about dredge");
expect("ask crow about dredge", t.includes("DREDGE") || t.includes("RENT"));

// Back to foyer, into study
run("e"); run("e");
t = run("e");
expect("foyer -> study", st().currentRoom === "study");
expect("study has lamp+drawer+body", out().toLowerCase().includes("lamp") && out().toLowerCase().includes("body"));

t = run("examine edmund");
expect("examine edmund mentions almonds", t.includes("almonds") || t.includes("11:47"));

t = run("search edmund");
expect("search edmund -> fob key", st().inventory.includes("fob_key"));

t = run("take lamp");
expect("take lamp", st().inventory.includes("brass_lamp"));

t = run("unlock drawer with fob");
expect("unlock drawer", st().flags.drawerOpened);

t = run("take keyring");
expect("take keyring", st().inventory.includes("edmund_keyring"));
t = run("take will");
expect("take will frag", st().inventory.includes("will_fragment"));
t = run("read will");
expect("read will -> Pemberton Dredge", t.includes("Pemberton") && t.includes("Dredge"));
expect("readWillFragment flag", st().flags.readWillFragment);

run("w"); // -> foyer

// =========== Save/load mid-game ===========
t = run("save mid");
expect("save mid", t.includes("Saved") || t.includes("'mid'"));

t = run("hint");
expect("hint suggests seal break", t.toLowerCase().includes("break seal") || t.toLowerCase().includes("seal"));

t = run("notebook");
expect("notebook has will entry", t.includes("DREDGE") || t.includes("Pemberton"));

t = run("score");
expect("score shows tokens 0/4", t.includes("0/4"));

// =========== Region 1: East Wing ===========
t = run("break east seal");
expect("break east seal", st().flags.eastSealBroken);

t = run("ne");
expect("ne -> east_corridor", st().currentRoom === "east_corridor");

t = run("ne");
expect("ne -> conservatory", st().currentRoom === "conservatory");
expect("conservatory has plants & ghost", out().includes("monkshood") || out().includes("Cassandra") || out().includes("Lady"));

t = run("examine teacup");
expect("examine teacup -> bluish residue", t.includes("bluish") || t.includes("violet"));

t = run("read guide");
expect("read botanical guide", t.includes("MONKSHOOD") && t.includes("FOXGLOVE"));

t = run("take monkshood");
expect("take monkshood -> sprig", st().inventory.includes("monkshood_sprig"));

t = run("show monkshood to cassandra");
expect("show monkshood to cassandra", st().tokensCollected.includes("teacup_token"));
expect("Teacup token in inventory", st().inventory.includes("teacup_token"));

t = run("sw");
t = run("e");
expect("east_corridor -> hedge_maze", st().currentRoom === "hedge_maze");
t = run("n");
expect("hedge_maze -> stone_folly", st().currentRoom === "stone_folly");
t = run("examine sundial");
expect("sundial -> letter D", t.includes("D") || t.includes("first of four"));
expect("letterD_east flag", st().flags.letterD_east);

run("s"); run("w"); run("sw"); // -> back to foyer
expect("back at foyer", st().currentRoom === "foyer");

// =========== Region 2: West Wing ===========
t = run("break west seal");
expect("break west seal", st().flags.westSealBroken);
t = run("nw");
expect("nw -> west_corridor", st().currentRoom === "west_corridor");
t = run("w");
expect("w -> portrait_gallery", st().currentRoom === "portrait_gallery");

run("examine cassandra portrait");
run("examine julien portrait");
run("examine beatrice portrait");
t = run("examine edmund portrait");
expect("edmund portrait says askew", t.includes("askew") || t.includes("push"));

t = run("push edmund portrait");
expect("portrait moved", st().flags.passageOpened);

t = run("n");
expect("n -> hidden_passage", st().currentRoom === "hidden_passage");
expect("passage has diary, opener, julien", out().includes("Julien") && out().includes("diary"));

t = run("take diary");
expect("take diary", st().inventory.includes("julien_diary"));
t = run("read diary");
expect("read diary -> R", t.includes("R") || t.includes("inked"));
expect("readJulienDiary flag", st().flags.readJulienDiary);

t = run("show diary to julien");
expect("julien released", st().flags.julienReleased);

t = run("take letter opener");
expect("take letter opener", st().inventory.includes("silver_letter_opener"));
expect("letter_opener_token", st().tokensCollected.includes("letter_opener_token"));
expect("letterR_west flag", st().flags.letterR_west);

run("s"); run("e"); run("se");
expect("back at foyer (after west wing)", st().currentRoom === "foyer");

// =========== Region 3: Upstairs ===========
t = run("cut crepe");
expect("cut crepe", st().flags.crepeCut);

t = run("up");
expect("up -> landing", st().currentRoom === "landing");

// Try crossing without testing first → death
const stateBefore = st().visited.size;
t = run("n");
expect("untested balcony -> death", st().over === true && (t.includes("DEATH") || t.includes("balcony") || t.includes("fall")));

// Restart and replay quickly to upstairs
engine.executeInput("restart");
expect("restart resets state", st().currentRoom === "iron_gate" && st().turnCount === 0);

// Speed-run setup again to reach landing properly
const setup = [
  "n","e","open window","n","n","e",
  "search edmund","unlock drawer with fob","take will","read will","take lamp","w","feed cat",
  "break east seal","break west seal",
  "ne","ne","read guide","take monkshood","show monkshood to cassandra",
  "sw","e","n","examine sundial","s","w","sw",
  "nw","w","x cassandra portrait","x julien portrait","x beatrice portrait","x edmund portrait",
  "push edmund portrait","n","take diary","show diary to julien","take letter opener",
  "s","e","se",
  "cut crepe","up",
];
for (const c of setup) engine.executeInput(c);
expect("after speedrun: at landing", st().currentRoom === "landing");

// Now test floor first
t = run("test floor");
expect("test floor", st().flags.testedBalcony);

// linen_closet first
t = run("w");
expect("landing -> linen_closet", st().currentRoom === "linen_closet");
t = run("take all");
expect("inv: music_box, locket, crowbar",
  st().inventory.includes("music_box") &&
  st().inventory.includes("silver_locket") &&
  st().inventory.includes("crowbar"));
t = run("wind music box");
expect("wind music box", st().flags.musicBoxWound);
t = run("open locket");
expect("open locket -> letter E", st().flags.openedLocket && st().flags.letterE_upstairs);

t = run("e");                          // back to landing
t = run("n");
expect("safe cross to nursery", st().currentRoom === "nursery");
t = run("show locket to beatrice");
expect("beatrice released", st().flags.beatriceReleased);
expect("locket_token recovered", st().tokensCollected.includes("locket_token"));

// Back to foyer
run("s"); // landing (via nursery_back redirect)
t = run("down");
expect("landing down -> foyer", st().currentRoom === "foyer");

// =========== Region 4: Cellar ===========
t = run("pry latch with crowbar");
expect("pry latch", st().flags.cellarOpened);

t = run("light lamp");
expect("light lamp", st().flags.lampLit);

t = run("down");
expect("foyer -> cellar_stair", st().currentRoom === "cellar_stair");

t = run("n");
expect("-> wine_cellar", st().currentRoom === "wine_cellar");
t = run("read ledger");
expect("read ledger -> letter D", st().flags.readWineLedger && st().flags.letterD_cellar);

run("s"); run("e"); // -> boiler_room
expect("-> boiler_room", st().currentRoom === "boiler_room");
t = run("examine plate");
expect("brass plate inscription", t.includes("ASHVALE WORKS") || t.includes("CHUTE"));

t = run("e");
expect("east still blocked by ice", t.toLowerCase().includes("ice") || t.toLowerCase().includes("blocked"));

t = run("turn valve");                  // hall -> wine
t = run("turn valve");                  // wine -> chute, ice melts
expect("chute thawed", st().flags.chuteThawed);

t = run("e");
expect("-> coal_chute", st().currentRoom === "coal_chute");

t = run("ask hollis about will");
expect("hollis testifies forgery", t.includes("forged") || t.includes("DREDGE") || t.includes("dredge") || t.includes("oath"));

t = run("take watch");
expect("watch token recovered", st().tokensCollected.includes("pocket_watch_token"));

run("w"); run("w"); run("up"); // back to foyer
expect("back at foyer (after cellar)", st().currentRoom === "foyer");

// =========== Tokens summary ===========
expect("4 tokens recovered", st().tokensCollected.length === 4);

// Check all four killer letters
const lettersOK = st().flags.letterD_east && st().flags.letterR_west && st().flags.letterE_upstairs && st().flags.letterD_cellar;
expect("All 4 letters recorded (D R E D)", lettersOK);

t = run("notebook");
expect("notebook shows D R E D", t.includes("D") && t.includes("R") && t.includes("E"));

// =========== Region 5: Finale ===========
t = run("open clock");
expect("clock opens with 4 tokens", st().currentRoom === "crypt_stair");

t = run("down");
expect("crypt_stair -> family_crypt", st().currentRoom === "family_crypt");
t = run("e");
expect("family_crypt -> family_chapel", st().currentRoom === "family_chapel");

// Try to say name without setup
t = run("say pemberton dredge");
expect("say without tokens placed gives hint", t.toLowerCase().includes("place") || t.toLowerCase().includes("circle"));

t = run("place tokens");
expect("place tokens", st().flags.tokensPlaced);

t = run("say pemberton dredge");
expect("say without candles gives hint", t.toLowerCase().includes("candle"));

t = run("light candles");
expect("light candles", st().flags.candlesLit);

// Wrong name first - reload from save
// Actually let me save here then test wrong name
run("save final");
t = run("say wrong name");
expect("wrong name kills", st().over === true && (t.includes("THE END") || t.includes("wrong man") || t.includes("manor takes")));

// Restore and try correct name
engine.executeInput("load final");
expect("loaded final state",
  st().currentRoom === "family_chapel" &&
  st().flags.tokensPlaced &&
  st().flags.candlesLit &&
  !st().over);

t = run("say pemberton dredge");
expect("WIN: speak the killer's name", st().flags.won === true);
expect("Win text printed", t.includes("THE END") && (t.includes("freed") || t.includes("PEMBERTON")));
expect("Final score line printed", t.includes("Final score:") && t.includes("rank:"));
expect("Score is positive after win", (st().score || 0) > 0);
expect("Win bonus credited",
  (st().scoreLog || []).some((r) => r.includes("manor freed")));

// =========== MAP feature ===========
// Restart fresh and test map command flow
engine.executeInput("restart");
engine.executeInput("n");
engine.executeInput("e");
engine.executeInput("map");
expect("map command opens overlay", overlay._h && overlay._h.length > 100);
expect("map shell has stats line", overlay._h && overlay._h.includes("Tokens recovered"));
expect("map shell has compass", overlay._h && overlay._h.includes("class=\"map-compass\""));

// =========== HELP / META commands ===========
t = run("help");
expect("help lists commands", t.includes("Movement") && t.includes("Save") && t.includes("hint"));

t = run("frobnicate");
expect("unknown verb error", t.includes("don't know") || t.includes("Did you mean"));

// =========== NEW: exits command ===========
t = run("exits");
expect("exits command lists directions",
  t.toLowerCase().includes("obvious exits") || t.toLowerCase().includes("no obvious"));

// =========== NEW: exits in status bar ===========
expect("status-exits element populated",
  els["status-exits"] && /exits:/.test(els["status-exits"].textContent || ""));

// =========== NEW: auto-save on milestone ===========
// Restart fresh, drive to a token, confirm an 'auto' slot now exists.
engine.executeInput("restart");
const milestoneSetup = [
  "n","e","open window","n","n","e",
  "search edmund","unlock drawer with fob","take will","read will","w",
  "break east seal","ne","ne","read guide","take monkshood",
  "show monkshood to cassandra",   // <-- earns Teacup Token; should auto-save
];
for (const c of milestoneSetup) engine.executeInput(c);
expect("auto-save slot exists after token", lsStore.has("ashvale.save.auto"));
expect("auto-save can be loaded after death (simulated)",
  st().tokensCollected.includes("teacup_token"));

// Force a death and recover via load auto.
engine.getState().over = true; // simulate death directly
engine.executeInput("look");                           // blocked by over
engine.executeInput("load auto");
expect("recovered to milestone (no longer over)", st().over === false);
expect("recovered with teacup token still held", st().tokensCollected.includes("teacup_token"));

// =========== NEW: scoring on milestones ===========
expect("score >= 20 after recovering teacup token", (st().score || 0) >= 20);
expect("score log records token recovery",
  (st().scoreLog || []).some((r) => r.toLowerCase().includes("teacup")));
expect("score log records cassandra release",
  (st().scoreLog || []).some((r) => r.toLowerCase().includes("cassandra")));

// =========== NEW: optional discoveries (cat name + green book + ring) ===========
engine.executeInput("restart");
const optionalSetup = [
  "n","e","open window","n","n",
  "feed cat",       // gate cat name discovery
  "x cat",          // examine after feed -> reveals "Atropos"
];
for (const c of optionalSetup) engine.executeInput(c);
expect("foundCatName flag set after examine post-feed", st().flags.foundCatName === true);
expect("score includes cat-name bonus",
  (st().scoreLog || []).some((r) => r.toLowerCase().includes("cat finally named")));

// Wedding ring (master bedroom).
const ringSetup = [
  "e",                                    // -> study
  "search edmund","unlock drawer with fob","take will","read will","take lamp","w",
  "break west seal","nw","w",
  "x cassandra portrait","x julien portrait","x beatrice portrait","x edmund portrait",
  "push edmund portrait","n","take letter opener","s","e","se",
  "cut crepe","up","test floor",
  "e",                                    // landing -> master_bedroom
  "search vanity",
];
for (const c of ringSetup) engine.executeInput(c);
expect("foundWeddingRing flag", st().flags.foundWeddingRing === true);
expect("wedding ring in inventory", st().inventory.includes("wedding_ring"));

// Green book (library).
engine.executeInput("w");                              // back to landing
engine.executeInput("down");                            // -> foyer
engine.executeInput("nw");                              // -> west_corridor
engine.executeInput("n");                               // -> library
let gb = run("read green book");
expect("read green book", st().flags.readGreenBook === true);
expect("green book text printed", gb.includes("Edmund") || gb.includes("brother"));

// =========== NEW: brief / verbose mode ===========
engine.executeInput("restart");
let v = run("brief");
expect("brief command sets flag", st().flags.brief === true);
expect("brief command confirms", v.toLowerCase().includes("brief"));
v = run("verbose");
expect("verbose command clears flag", st().flags.brief === false);

// =========== NEW: dynamic NPC dialogue ===========
// Default talk-to-Crow with no progress should mention slate.
engine.executeInput("restart");
const cmds_intro = ["n","e","open window","n","n","w","w"];
for (const c of cmds_intro) engine.executeInput(c);
let cd = run("talk to crow");
expect("crow default mentions slate", cd.toLowerCase().includes("slate") || cd.toLowerCase().includes("mournfully"));

// After cassandra release, default should change.
const cmds_token = [
  "e","e","e","search edmund","unlock drawer with fob","take will","read will","take lamp","w",
  "break east seal","ne","ne","read guide","take monkshood","show monkshood to cassandra",
  "sw","sw","w","w",  // back to servants_hall
];
for (const c of cmds_token) engine.executeInput(c);
let cd2 = run("talk to crow");
expect("crow default reflects progress (one less restless / now / one more)",
  cd2.toLowerCase().includes("one less") || cd2.toLowerCase().includes("one more") || cd2.toLowerCase().includes("now"));

// Topic-specific dynamic dialogue: ask about ghost.
let cgg = run("ask crow about ghost");
expect("crow ghost-topic reflects token count", /still wait|still listen/i.test(cgg) || cgg.includes("STILL"));

console.log(`\n=== RESULTS: ${pass} passed, ${fail} failed ===`);
if (failures.length) {
  console.log(failures.join("\n"));
  process.exit(1);
}

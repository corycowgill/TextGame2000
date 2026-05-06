// Lose-paths test: lamp runs out in the dark; restart-from-death works.
const transcript = [];
const fakeT = { appendChild(n) { transcript.push(n.textContent); }, set scrollTop(_) {}, get scrollHeight() { return 0; }, set innerHTML(v) { if (v === "") transcript.length = 0; }, addEventListener: () => {} };
const els = {};
const stEl = id => (els[id] ||= { textContent: "", remove() {} });
class FakeEl {
  constructor(t) { this.tagName = (t||"").toUpperCase(); this.children = []; this._h = ""; this.style = {}; this._tc = ""; this.dataset = {}; }
  appendChild(c) { this.children.push(c); this._tc += (c && c.textContent) || ""; }
  set textContent(v) { this._tc = v; }
  get textContent() { return this._tc; }
  addEventListener() {}
  set innerHTML(v) { this._h = v; }
  get innerHTML() { return this._h; }
  remove() {}
}
globalThis.document = {
  head: new FakeEl("head"), body: new FakeEl("body"),
  getElementById(id) {
    if (id === "transcript") return fakeT;
    if (id === "input") return { value: "", focus: () => {} };
    if (id === "input-form") return { addEventListener: () => {} };
    return stEl(id);
  },
  createElement(tag) { return new FakeEl(tag); },
  createTextNode(text) { return { nodeType: 3, textContent: String(text) }; },
  addEventListener: () => {}, readyState: "complete",
};
globalThis.window = { addEventListener: () => {} };
globalThis.location = { protocol: "http:" };
globalThis.__ASHVALE_NO_AMBIENT__ = true;
globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

const engine = await import(process.cwd() + "/src/engine.js");
engine.startGame();

// Speedrun to cellar with lamp.
const setup = [
  "n","e","open window","n","n","e",
  "search edmund","unlock drawer with fob","take will","read will","take lamp","w",
  "break west seal","nw","w","x cassandra portrait","x julien portrait","x beatrice portrait","x edmund portrait",
  "push edmund portrait","n","take letter opener","s","e","se",
  "cut crepe","up","test floor","w","take crowbar","e","down",
  "pry latch with crowbar",
  "light lamp",
];
for (const c of setup) engine.executeInput(c);
console.log("After setup: at " + engine.getState().currentRoom + ", lamp lit:", engine.getState().flags.lampLit, "oil:", engine.getState().lampOil);

// Now wander in the cellar without the cat (cat won't follow because we never fed it).
engine.executeInput("down");  // -> cellar_stair (dark, lamp lit)
console.log("Entered cellar; oil:", engine.getState().lampOil);

// Burn down the lamp. Initial oil = 30.
let waitsBeforeDeath = 0;
for (let i = 0; i < 40; i++) {
  if (engine.getState().over) break;
  engine.executeInput("wait");
  waitsBeforeDeath++;
  if (i < 5 || i > 25) {
    console.log(`  wait #${waitsBeforeDeath}: oil=${engine.getState().lampOil} lit=${engine.getState().flags.lampLit} over=${engine.getState().over}`);
  }
}
console.log("Final state: over=" + engine.getState().over + ", waits=" + waitsBeforeDeath);
console.log("PASS" + (engine.getState().over ? " — lamp-out kills you in the dark." : " FAILED — never died?"));

// Now test restart from death.
engine.executeInput("restart");
console.log("After restart: at " + engine.getState().currentRoom + " over=" + engine.getState().over);
console.log(engine.getState().currentRoom === "iron_gate" && !engine.getState().over ? "PASS — restart works after death." : "FAIL");

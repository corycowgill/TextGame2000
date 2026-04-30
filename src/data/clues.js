// Hint system + notebook entries.
// Hints are evaluated top-to-bottom; the first whose `when(state)` returns true fires.

export const HINTS = [
  {
    when: (s) => s.currentRoom === "iron_gate" && !s.visited.has("garden"),
    text: "The front door will not open from out here. Try going east, into the garden.",
  },
  {
    when: (s) => s.currentRoom === "garden" && !s.flags.windowOpened,
    text: "The drawing-room window's catch is broken. With a heavy enough object, you could break it; or simply force it open.",
  },
  {
    when: (s) => s.flags.windowOpened && !s.visited.has("drawing_room"),
    text: "The window is open. Go north (or `enter window`) to climb in.",
  },
  {
    when: (s) => s.visited.has("drawing_room") && !s.flags.readEdmundLetter,
    text: "There is a sealed letter on the mantel. `read letter` may set the tone for the night.",
  },
  {
    when: (s) => s.currentRoom === "study" && !s.flags.drawerOpened,
    text: "Edmund's pocket watch is in the open. The desk drawer is locked. Edmund is not in a position to object.",
  },
  {
    when: (s) => s.flags.drawerOpened && !s.inventory.includes("edmund_keyring"),
    text: "Take the keyring (and the will fragment) from the open drawer.",
  },
  {
    when: (s) => s.flags.readWillFragment && !s.flags.eastSealBroken && !s.flags.westSealBroken,
    text: "With the burnt will in hand, the executor's seals on the wing doors no longer hold any moral force. Try `break seal` from the foyer.",
  },
  {
    when: (s) => s.flags.eastSealBroken && !s.visited.has("conservatory"),
    text: "The east wing is open. North-east from the foyer leads to the corridor; from there, the conservatory.",
  },
  {
    when: (s) => s.visited.has("conservatory") && !s.flags.readBotanicalGuide,
    text: "Three plants stand on plinths. The botanical guide on the tea table will tell you what to look for. (`read guide`.)",
  },
  {
    when: (s) => s.flags.readBotanicalGuide && !s.flags.tookMonkshood,
    text: "The teacup's residue is bluish-violet. Match the colour to a plant. Then take a sprig.",
  },
  {
    when: (s) => s.flags.tookMonkshood && !s.tokensCollected.includes("teacup_token"),
    text: "Show the monkshood sprig to Cassandra's ghost.",
  },
  {
    when: (s) => s.tokensCollected.includes("teacup_token") && !s.flags.letterD_east,
    text: "The maze's stone folly has a sundial. Examine it.",
  },
];

// Notebook: clues are auto-recorded by the engine when flags are set.
// Each entry: { flag: "flagName", text: "What gets written in the notebook" }
export const NOTEBOOK_ENTRIES = [
  { flag: "readEdmundLetter", text: "Edmund's letter: 'a man in a black coat and a notary's smile'; 'the true testament rests where the household sleeps longest'." },
  { flag: "readSlate", text: "Mrs. Crow's slate: a man came from the south road at midnight with a case of papers." },
  { flag: "drawerOpened", text: "Inside Edmund's desk drawer: the household keyring (and a velvet impression where a second object once lay)." },
  { flag: "readWillFragment", text: "The will fragment names 'Pemberton Dredge, Solr.' as residual heir. Forged after death — Mrs. Crow's slate confirms the timing." },
  { flag: "cassandraReleased", text: "Lady Cassandra was poisoned with monkshood, served as tea. She names Pemberton Dredge as the hand that poured the cup." },
  { flag: "letterD_east", text: "Stone folly sundial: letter D etched at the centre. (First initial.)" },
];

// Killer-name letter accumulator. Set by region puzzles.
// Region 1 -> D, Region 2 -> R, Region 3 -> E, Region 4 -> D.
// Full name spelled out at finale: "Pemberton Dredge".
export const KILLER_LETTERS = {
  region1: { letter: "D", flag: "letterD_east" },
  region2: { letter: "R", flag: "letterR_west" },
  region3: { letter: "E", flag: "letterE_upstairs" },
  region4: { letter: "D", flag: "letterD_cellar" },
};

export const KILLER_NAME = "pemberton dredge";

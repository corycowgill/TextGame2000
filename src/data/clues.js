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
    when: (s) => s.currentRoom === "study" && !s.flags.drawerOpened && !s.flags.foundFobKey,
    text: "Edmund has a small fob key on his watch chain. `search edmund` to take it.",
  },
  {
    when: (s) => s.currentRoom === "study" && !s.flags.drawerOpened && s.flags.foundFobKey,
    text: "You have the fob key. `unlock drawer with key` (or `use key on drawer`).",
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
  {
    when: (s) => s.flags.westSealBroken && !s.visited.has("portrait_gallery"),
    text: "The west wing is open. The portrait gallery lies west of the corridor.",
  },
  {
    when: (s) => s.visited.has("portrait_gallery") && !(s.flags.examinedCassandraPortrait && s.flags.examinedJulienPortrait && s.flags.examinedBeatricePortrait && s.flags.examinedEdmundPortrait),
    text: "Examine each of the four portraits in turn. Each plaque tells a story.",
  },
  {
    when: (s) => s.flags.examinedCassandraPortrait && s.flags.examinedJulienPortrait && s.flags.examinedBeatricePortrait && s.flags.examinedEdmundPortrait && !s.flags.passageOpened,
    text: "Edmund's portrait is hung askew. Try `push edmund portrait` (or `move portrait`).",
  },
  {
    when: (s) => s.flags.passageOpened && !s.tokensCollected.includes("letter_opener_token"),
    text: "Inside the hidden passage: read the diary, then take the letter opener.",
  },
  {
    when: (s) => s.inventory.includes("silver_letter_opener") && !s.flags.crepeCut,
    text: "The stair to the bedrooms is roped off with crepe. Try `cut crepe` in the foyer.",
  },
  {
    when: (s) => s.flags.crepeCut && !s.visited.has("nursery"),
    text: "Upstairs: the nursery is north across the landing — but `test floor` first; the boards are rotten.",
  },
  {
    when: (s) => s.visited.has("nursery") && !s.inventory.includes("music_box"),
    text: "The linen closet (west of the landing) holds a music box, a locket, and a crowbar. Take all.",
  },
  {
    when: (s) => s.inventory.includes("music_box") && !s.flags.musicBoxWound,
    text: "Wind the music box (`wind music box`).",
  },
  {
    when: (s) => s.flags.musicBoxWound && !s.tokensCollected.includes("locket_token"),
    text: "In the nursery, with the music box wound, show the locket to Beatrice.",
  },
  {
    when: (s) => s.inventory.includes("crowbar") && !s.flags.cellarOpened,
    text: "The cellar door is barred from the foyer side. `pry latch` with the crowbar.",
  },
  {
    when: (s) => s.flags.cellarOpened && !s.inventory.includes("brass_lamp"),
    text: "The cellar is dark. Take the brass lamp from Edmund's study (and `light lamp` before going down).",
  },
  {
    when: (s) => s.flags.cellarOpened && !s.flags.lampLit && s.inventory.includes("brass_lamp"),
    text: "Light the brass lamp before you descend (`light lamp`). Or befriend the cat first — it provides dim light.",
  },
  {
    when: (s) => s.visited.has("boiler_room") && !s.flags.chuteThawed,
    text: "The boiler's valve cycles steam through HALL, WINE, CHUTE. Examine the brass plate, then `turn valve` until steam reaches CHUTE.",
  },
  {
    when: (s) => s.flags.chuteThawed && !s.tokensCollected.includes("pocket_watch_token"),
    text: "The chute is thawed. Take Hollis's pocket watch.",
  },
  {
    when: (s) => s.tokensCollected.length === 4 && !s.visited.has("crypt_stair"),
    text: "All four tokens recovered. The grandfather clock in the foyer expects you now: `open clock` (or `enter clock`).",
  },
  {
    when: (s) => s.visited.has("family_chapel") && !s.flags.tokensPlaced,
    text: "Place the four tokens on the brass sigils: `place tokens`.",
  },
  {
    when: (s) => s.flags.tokensPlaced && !s.flags.candlesLit,
    text: "Light the four black candles: `light candles`.",
  },
  {
    when: (s) => s.flags.tokensPlaced && s.flags.candlesLit && !s.flags.won,
    text: "Speak the killer's full name. Your notebook has both his initials.",
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
  { flag: "readJulienDiary", text: "Julien's diary: 'his cuffs are inked with R — too proud of his own initial to disguise it.' The killer's first name begins with R." },
  { flag: "julienReleased", text: "Julien Ashvale was stabbed with the silver letter opener by 'a man of the law' whose first name begins with R." },
  { flag: "letterR_west", text: "Silver letter opener: engraved with the capital R. (Second initial.)" },
  { flag: "openedLocket", text: "Silver locket: engraved with E in copperplate, 'for my dear Edmund'. (Third initial.)" },
  { flag: "beatriceReleased", text: "Beatrice was smothered in her sleep by 'a man with ink on his cuffs', a letter E on the cuffs." },
  { flag: "readWineLedger", text: "Wine cellar ledger: 'Codicil executed; estate residue assigned per terms. Witnessed and signed: P. DREDGE, SOLR.' Dated the morning AFTER Edmund died — the will is forged." },
  { flag: "letterD_cellar", text: "Wine cellar ledger: heavy ornate D in 'Dredge'. (Fourth initial.)" },
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

// Atmospheric ambient lines. The engine prints one every few turns, picked
// from the pool whose `when(state)` matches. Each line should be brief and
// non-blocking - flavor only, never a clue.
export const AMBIENT_LINES = [
  // Anywhere
  { when: () => true, text: "Somewhere in the manor, a clock chimes the half-hour." },
  { when: () => true, text: "A draught from nowhere stirs the dust." },
  { when: () => true, text: "The wind on the moor leans against the windows." },
  { when: () => true, text: "A single dry leaf scrapes across a sill." },
  { when: () => true, text: "The house breathes with you, slowly." },
  { when: (s) => s.flags.catFed, text: "The cat regards you with editorial patience." },

  // Foyer-specific
  { when: (s) => s.currentRoom === "foyer", text: "The grandfather clock's pendulum hesitates, then resumes." },

  // Outside
  { when: (s) => s.currentRoom === "iron_gate" || s.currentRoom === "front_door" || s.currentRoom === "garden",
    text: "Fog rolls in heavier off the moor." },

  // Conservatory / east wing
  { when: (s) => s.currentRoom === "conservatory" && !s.flags.cassandraReleased,
    text: "Rain ticks against the glass dome, slow and exact." },
  { when: (s) => s.currentRoom === "hedge_maze" || s.currentRoom === "stone_folly",
    text: "Wet hedge-leaves brush your sleeve." },

  // West wing
  { when: (s) => s.currentRoom === "library", text: "Pages somewhere settle, as if a book has just been put down." },
  { when: (s) => s.currentRoom === "portrait_gallery" && !s.flags.julienReleased,
    text: "The eyes in the portraits do not quite stop following you." },

  // Upstairs
  { when: (s) => s.currentRoom === "nursery" && !s.flags.beatriceReleased,
    text: "From the doll's house, very softly, a music-box phrase begins and stops." },
  { when: (s) => s.currentRoom === "landing", text: "The balcony's bad board sighs, even when you don't step on it." },

  // Cellar
  { when: (s) => /^(cellar_stair|wine_cellar|boiler_room|coal_chute)$/.test(s.currentRoom) && !s.flags.lampLit,
    text: "Something small moves in the dark, two paces ahead, and stops." },
  { when: (s) => /^(cellar_stair|wine_cellar|boiler_room|coal_chute)$/.test(s.currentRoom) && s.flags.lampLit,
    text: "The lamp's flame leans away from a draught you can't feel." },

  // Crypt
  { when: (s) => s.currentRoom === "family_crypt" || s.currentRoom === "crypt_stair",
    text: "The stone here is older than the house, and colder." },
  { when: (s) => s.currentRoom === "family_chapel" && !s.flags.candlesLit,
    text: "The four black candles wait, perfectly upright." },
  { when: (s) => s.currentRoom === "family_chapel" && s.flags.candlesLit && !s.flags.won,
    text: "The candle flames lean inward, toward the circle, all four together." },

  // Late game
  { when: (s) => s.tokensCollected.length === 4 && !s.flags.won,
    text: "The grandfather clock in the foyer ticks more slowly now. It is waiting." },
];

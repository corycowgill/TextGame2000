// Per-room sensory layer: what you hear, what you smell, and small scenery
// details that reward `examine X` for X that isn't an item or NPC.
//
// Shape:
//   SCENERY[roomId] = {
//     listen: string | (state) => string
//     smell:  string | (state) => string
//     examine: [
//       { aliases: ["wallpaper","damask"], text: string | (state) => string },
//       ...
//     ]
//   }
//
// Aliases are matched case-insensitive against the player's noun via includes().

export const SCENERY = {
  iron_gate: {
    listen: "Wind in the moor grass, the rasp of the gate's hinge as it swings an inch and back, and a single far rook calling at intervals.",
    smell: "Wet yew, peat smoke from somewhere else, and the faint metallic tang of rusted ironwork.",
    examine: [
      { aliases: ["gate", "gates", "crest", "ironwork"], text: "Rust eats the Ashvale crest from the inside out, leaving the fox-and-key device just legible." },
      { aliases: ["drive", "gravel", "fog"], text: "Gravel pales away into fog after twenty paces; the manor is more a darker patch of fog than a building." },
      { aliases: ["moor", "road", "lantern"], text: "The moor road runs flat and pale, treeless. The coachman has long since taken his lantern with him." },
    ],
  },

  front_door: {
    listen: "Beyond the doors, very faint, a clock chimes the half-hour. Once. Then nothing.",
    smell: "Cold beeswax and rain-soaked oak.",
    examine: [
      { aliases: ["knocker", "fox"], text: "The brass fox bites its own tail with weary patience; the brass is bright only where many hands have lifted it." },
      { aliases: ["porch", "grotesques", "carving", "lintel"], text: "The porch lintel is carved with grotesques whose faces the rain has worn nearly featureless. One of them is laughing." },
      { aliases: ["door", "doors", "oak"], text: "The black oak is dry, well-seasoned, and locked very thoroughly indeed." },
    ],
  },

  garden: {
    listen: "Rainwater ticks from leaf to leaf, and somewhere the garden gate creaks in a wind that you cannot feel.",
    smell: "Wet earth, rotting petals, and the green-moss stink of a glasshouse with broken panes.",
    examine: [
      { aliases: ["roses", "bramble", "thorns", "rose"], text: "The roses are a tangle of unpruned years; their last brown petals lie wet on the path." },
      { aliases: ["wall", "ivy", "brick"], text: "The east wall is smothered in ivy that has begun to lift the bricks from their mortar one by one." },
      { aliases: ["sash", "frame", "catch"], text: "The leaded sash is crooked in its frame; its catch is broken inward, as if forced from outside before." },
    ],
  },

  drawing_room: {
    listen: "Underneath the silence, the fire-grate pings as cold metal contracts further into cold.",
    smell: "Beeswax polish, old soot, and a faint ghost of pipe-tobacco from a man who was here some time ago.",
    examine: [
      { aliases: ["cloth", "cloths", "sheet", "sheets"], text: "Each dust-cloth is held by a small lead weight at one corner; the household was meant to be away for some weeks." },
      { aliases: ["pianoforte", "piano"], text: "Beneath one of the larger cloths, the rectangle of an upright pianoforte. Its lid is shut; its keys, if you lifted the cloth, would be cold to the touch." },
      { aliases: ["mantel", "mantelpiece", "carriage clock"], text: "The carriage clock on the mantel has stopped at 11:47 — the same minute as Edmund's pocket watch." },
      { aliases: ["grate", "ash", "fireplace", "fire"], text: "The grate is cold. A half-burnt log lies at the centre, charred to the shape of a fist." },
    ],
  },

  foyer: {
    listen: "The grandfather clock ticks; under its tick, very faintly, the chandelier's prisms chime against each other in a draught you cannot feel.",
    smell: "Cold beeswax, colder lavender, and a pinch of black wax from the executor's seals.",
    examine: [
      { aliases: ["chandelier", "cobweb", "cobwebs", "prisms"], text: "The chandelier hangs in long swags of grey cobweb, the prisms within them pale as drowned bells." },
      { aliases: ["tile", "tiles", "floor"], text: "Good Italian marble, polished so mercilessly that the chandelier shows reversed in it — and your own face, much too pale." },
      { aliases: ["crepe"], text: "Black mourning crepe, knotted three times across the stair: not a barrier, but an instruction." },
      { aliases: ["nail", "latch"], text: "An iron nail has been driven straight through the cellar latch from this side. Hollis would not have done his own door so unkindly." },
    ],
  },

  east_corridor: {
    listen: "From the conservatory, water on glass; from the maze beyond, nothing at all.",
    smell: "Old wallpaper paste, and something green and growing — the conservatory leaks through the joinery.",
    examine: [
      { aliases: ["wallpaper", "damask"], text: "The green damask peels in slow curls, exposing under-paper printed with pomegranates in a pattern thirty years out of fashion." },
      { aliases: ["runner", "rug", "carpet"], text: "The runner is so worn that the warp shows through the weft. Footprints have not lain on it for some time." },
    ],
  },

  conservatory: {
    listen: "Rain on glass. A single insect, somewhere in the ferns, that you cannot identify by sound alone.",
    smell: "Wet leaf-mould, brass polish, and — under it — the faint flat sweetness of sugared tea long gone cold.",
    examine: [
      { aliases: ["dome", "panels", "glass"], text: "The green-stained glass is old, bubbled at the edges, and patched in two places with sheet lead." },
      { aliases: ["fern", "ferns", "urn", "urns"], text: "The brass urns are tarnished green where condensation has run down them in long tongues." },
      { aliases: ["floor", "tiles"], text: "Black-and-white tiles slick with damp. One tile near the table is loose, and rocks under your boot." },
      { aliases: ["plinth", "plinths", "label", "labels"], text: "Each specimen plinth bears a small enamel label, lettered by a fine, unsteady hand. The labels disagree with the botanical guide on at least one count." },
    ],
  },

  hedge_maze: {
    listen: "Rain in the leaves, and — once, then not again — footsteps on gravel that walked when you walked, and stopped when you stopped.",
    smell: "Wet yew, sour earth, and the cold metallic note of old rain on iron.",
    examine: [
      { aliases: ["yew", "hedge", "hedges", "leaves"], text: "The yew is old, well-tended; some of these hedges were planted before the manor was built." },
      { aliases: ["gravel", "path"], text: "The gravel underfoot has been recently raked — but only on the path you came in by." },
    ],
  },

  stone_folly: {
    listen: "A single drop falls from each column to the bench at uneven intervals, like a clock that has forgotten the rhythm of seconds.",
    smell: "Cold limestone, moss, and the high green note of clipped yew on all sides.",
    examine: [
      { aliases: ["bench"], text: "The bench is curved to fit two people sitting close. The moss has overtaken the place where their feet would have been." },
      { aliases: ["columns", "column"], text: "Four columns, plain Doric, each rain-pitted at its base where standing water has bitten back into the stone." },
      { aliases: ["shadow", "gnomon"], text: "The shadow on the dial-face does not lie at the time the sun would put it." },
    ],
  },

  dining_room: {
    listen: "A fly turns slow circles above the centrepiece. Otherwise, nothing — sixteen places set for sixteen people who are not here.",
    smell: "Wine going to vinegar, old wax, and a thin underlayer of meat that should have been served and was not.",
    examine: [
      { aliases: ["table", "mahogany"], text: "Sixteen places, complete. The head of the table is set with its glass filled, as if for someone the host did not wish to slight." },
      { aliases: ["candelabra", "wax"], text: "The wax has run down the candelabra in long pale tongues that suggest the candles burned far past their proper hour." },
      { aliases: ["chairs", "chair"], text: "All sixteen are pulled out an inch — politely, as if everyone had been about to stand at once and then thought better of it." },
      { aliases: ["fly"], text: "The fly is the wrong sort of fly for the season. You decline to follow that thought to its conclusion." },
      { aliases: ["wine", "glass", "glasses"], text: "The wine has gone the colour of a bruise. None of the glasses are empty; none are full." },
    ],
  },

  servants_hall: {
    listen: "The kettle ticks as it cools — slowly, as if it were not quite cool enough yet to stop ticking.",
    smell: "Cold lard, cold copper, and the dry sage hung in bunches above the door.",
    examine: [
      { aliases: ["pans", "copper"], text: "Copper pans hang in graduated ranks, each polished within the fortnight, none used since." },
      { aliases: ["range", "hob", "kettle"], text: "The range is cold, but the hob bears a kettle whose underside is still warm to the back of the hand." },
      { aliases: ["sage", "rosemary", "herbs", "bunches"], text: "Bunches of sage and rosemary swing slowly above the door though there is no draught. You decline to watch them too long." },
      { aliases: ["pencil"], text: "The chalk-pencil has been sharpened to nothing, as though Mrs. Crow had been writing for a very long time and could not stop." },
    ],
  },

  study: {
    listen: "The clock on the mantel has stopped, but you keep imagining you can hear it. That is a sign of an investigator who has not slept enough.",
    smell: "Pipe tobacco, ink, brandy, and — under all three — the very faint smell of camphor.",
    examine: [
      { aliases: ["books", "spines", "shelves", "leather", "shelf"], text: "Calf-bound legal commentaries, three-quarter-bound estate ledgers in buckram, no fiction. A magistrate's library, kept in good order." },
      { aliases: ["lamp", "gas-lamp", "reading lamp", "shade"], text: "A green-glass shade, a brass standard, gas-fed; the gas itself is turned to a thrifty thread." },
      { aliases: ["blotter", "ink-blotter"], text: "The blotter holds the mirror-image of a half-finished letter: the words are reversed but legible, in part. *…I find I cannot in conscience…*" },
      { aliases: ["letter", "half-finished letter", "half finished letter"], text: "The letter under Edmund's hand begins: *Dredge — I find I cannot in conscience sign the new instrument…* It does not finish; the pen stopped before the next clause." },
      { aliases: ["pen", "nib"], text: "A steel-nibbed pen, laid down — not dropped — across the half-finished letter. The ink at the nib is dry now, but it dried in a clean line." },
      { aliases: ["brandy", "tumbler", "glass"], text: "Brandy at the elbow, untouched. The skin on its surface is the dust of two days' settling." },
    ],
  },

  west_corridor: {
    listen: "The gas-jets hiss low without quite illuminating; nothing else moves.",
    smell: "Dried roses from the wallpaper, and dust from the runner.",
    examine: [
      { aliases: ["wallpaper", "damask", "roses"], text: "The damask, dried-rose pink, has flowered the room with a faint potpourri smell that the cleaning has not been able to dispel." },
      { aliases: ["jets", "gas", "sconce", "sconces"], text: "The gas-jets have been turned to the lowest setting that will keep them burning. Frugality, or a man who did not wish to be too clearly seen." },
      { aliases: ["runner", "rug"], text: "A long Persian, faded almost to mouse. Footprints have not been kept off it; they have only never been there." },
    ],
  },

  library: {
    listen: "A timber clicks in the wainscot as the temperature drops further. From outside, very far off, a moor-owl calls and is answered.",
    smell: "Calf leather, dry pulp, and the coal-tar sharpness of printing-ink not yet faded from a recently opened book.",
    examine: [
      { aliases: ["shelves", "spines", "books", "shelf"], text: "Three walls of legal commentary, ordered alphabetically. Edmund kept his books as a magistrate keeps his bench: severely." },
      { aliases: ["fire", "grate", "fireplace", "ash"], text: "The grate is cold, but a half-burnt scrap of paper at the back is a deeper black than its ashes; someone has burned a letter here, recently." },
      { aliases: ["chair", "reading chair", "wing-back", "wing back"], text: "The chair holds the impress of a man's weight on its right side, where his arm and elbow lay each evening for many years." },
      { aliases: ["desk", "blotter", "inkpot"], text: "The standing desk's blotter is unmarked, the silver inkpot dry. Whatever Edmund wrote in his last days, he did not write it on this desk." },
    ],
  },

  portrait_gallery: {
    listen: "Floorboards creak in the room above, as if someone walked along the upstairs balcony and then stopped to listen for you.",
    smell: "Linseed oil and old varnish; the gilt frames warm with that faint resinous note that gilding gives off in cold air.",
    examine: [
      { aliases: ["panelling", "panels", "panel", "wood-panelled", "wood panelled"], text: "The dark oak panelling is divided into bays. One bay — behind Edmund's portrait — has a slight black gap at its edge where the joinery does not quite meet." },
      { aliases: ["bench"], text: "A bench long enough for three: mourners' seating. The leather of its top is worn most at the centre, where one woman sat repeatedly." },
      { aliases: ["plaques", "plaque"], text: "Each plaque carries a name, a date, and a cause. The dates are all this autumn." },
    ],
  },

  hidden_passage: {
    listen: "From the gallery side, your own breath. From the further side, somewhere deeper, a slow and patient pacing.",
    smell: "Cold plaster, hessian, dust that has not been disturbed for years.",
    examine: [
      { aliases: ["footprints", "prints", "boot", "boots"], text: "A man's narrow boot, with a worn outer heel — a man who walked with his weight outward, perhaps from arthritis. Out, not in." },
      { aliases: ["shelf", "writing-shelf", "writing shelf", "wainscoting"], text: "A small folded-down writing shelf, gas-jet stub above. The shelf bears a single ring-mark: a brandy glass, not an ink-pot." },
      { aliases: ["jet", "gas", "stub"], text: "The gas-jet stub is tarnished; it has not been lit in years." },
    ],
  },

  landing: {
    listen: "From the foyer below, the grandfather clock; from the nursery, when the wind stirs, the very faint creak of a rocking horse.",
    smell: "Beeswax on the banister, dried lavender from the master bedroom, and a different sourness from the boards under the balcony.",
    examine: [
      { aliases: ["balcony", "boards", "floorboards"], text: "The balcony is a horseshoe of pine boards laid badly; the longest are towards the centre, where they have begun to rot from below." },
      { aliases: ["doors"], text: "Five bedroom doors. Four are locked from outside; the fifth has had its key removed entirely." },
      { aliases: ["banister", "railing"], text: "The banister is mahogany, sound, and you grip it harder than you intended." },
      { aliases: ["stain"], text: "A stain along one seam of the centre board, the wrong sort of brown. You decide not to put your boot near it." },
    ],
  },

  master_bedroom: {
    listen: "The four-poster's tester rustles minutely. There is no draught.",
    smell: "Lavender, very thick — and, beneath the lavender, the chemical sweetness of a tincture that should not have been in this room.",
    examine: [
      { aliases: ["bed", "four-poster", "four poster"], text: "Sheets drawn taut, the corners hospital-cornered. Cassandra was a methodical woman." },
      { aliases: ["screen", "dressing screen", "silk"], text: "Painted silk: herons stepping through reeds. The silk is discoloured along its lower hem, where someone wiped a hand against it." },
      { aliases: ["brush"], text: "A silver-backed brush, one long pale hair caught in its bristles." },
    ],
  },

  linen_closet: {
    listen: "The shelf-paper rustles slightly; the closet smells of cedar and old time, and time always rustles.",
    smell: "Cedar, cotton, and the faint sweetness of pressed lavender.",
    examine: [
      { aliases: ["shelves", "sheets", "cotton", "pillow-slips", "pillow slips"], text: "Folded sheets, laundry-blue, in graduated heights. The lowest shelf is slightly less folded than the rest, as if a child had tidied up after themselves and not finished." },
      { aliases: ["doorframe", "frame", "height-marks", "marks"], text: "Pencilled height-marks march up the inside of the doorframe; the last is dated last spring and signed in an unsteady B. The next mark up that should have been hers is missing." },
    ],
  },

  nursery: {
    listen: "A music box winds itself half a note and stops. The rocking horse does not creak. The doll's house lights do not buzz, because they are painted on. Only your own breath remains.",
    smell: "Sleep, talcum, and a thread of camphor from the medicine cabinet on the wall.",
    examine: [
      { aliases: ["ceiling", "stars", "constellations"], text: "The constellations are accurate to the autumn sky. Whoever painted them put Orion at the foot of the bed deliberately, where a child could find him without sitting up." },
      { aliases: ["doll's house", "dolls house", "doll house", "dollhouse"], text: "The doll's house is a perfect miniature of Ashvale Manor itself. The little library is missing its little books." },
      { aliases: ["coverlet", "blanket", "stars"], text: "A coverlet stitched with stars, drawn up to the chin in the way that a parent draws a coverlet, not the way a child does." },
    ],
  },

  cellar_stair: {
    listen: "Water drips on stone somewhere below. The breathing sound is not breathing; it is the boiler's pipes contracting in the cold.",
    smell: "Coal-dust and ice in equal parts, and an undernote of old wine from somewhere further in.",
    examine: [
      { aliases: ["cobwebs", "webs", "cobweb"], text: "Each web carries the small grey corpses of last year's flies. Whatever spiders made these are not in residence now." },
      { aliases: ["brick", "walls", "wall"], text: "The brick is older than the manor — sixteenth-century, if you had to guess. The cellars predate the house above by some hundred years." },
    ],
  },

  wine_cellar: {
    listen: "A drip every five seconds, regular as a metronome — a slow leak from somewhere overhead, falling onto a stone.",
    smell: "Cork-rot, slow-souring wine, and the cold mineral tang of saltpetre from the walls.",
    examine: [
      { aliases: ["racks", "rack", "bottles", "bottle"], text: "Bottles laid on their sides, dusty grey, the wax over each cork cracked. The vintages run back fifty years." },
      { aliases: ["desk", "standing desk"], text: "A small standing desk, the slant top scratched by years of hot brass. A man — Hollis, presumably — kept his accounts here." },
    ],
  },

  boiler_room: {
    listen: "The pipes click in the cold. Something heavier — the weight of ice, perhaps — settles further along the chute wall.",
    smell: "Coal-dust, iron, and a thread of steam still trapped in the pipes from the last time the boiler ran.",
    examine: [
      { aliases: ["barrel", "firebox"], text: "An iron giant with rivets the size of a man's thumb. The firebox door yawns open on a black mouth full of cold clinker." },
      { aliases: ["pipes", "pipe"], text: "Three brass pipes run from the dome — HALL, WINE, CHUTE. The labels have been polished, recently, by an interested thumb." },
      { aliases: ["ash", "clinker"], text: "The cold clinker in the firebox has the grey-black sheen of coal that burned recently and was banked, not extinguished." },
    ],
  },

  coal_chute: {
    listen: "Coal dust deadens every sound. Even your own breathing arrives a beat late.",
    smell: "Coal, iron, and the cold mineral note of blood that has had time to dry.",
    examine: [
      { aliases: ["chute", "hatch"], text: "The hatch at the top is bolted from outside. The slope is steep enough that a man could not climb it without help — or a body could fall a long way down it, if pushed." },
      { aliases: ["coal", "dust", "flagstones"], text: "Coal dust lies black on every surface. There is the impression of a struggle near the foot of the chute, scuffed across the dust." },
    ],
  },

  crypt_stair: {
    listen: "Stone gives back stone. Above and behind, the clock-case ticks in a way that is no longer entirely like ticking.",
    smell: "Cold stone, mineral damp, and — faintly — incense, from somewhere ahead.",
    examine: [
      { aliases: ["initials", "scratching", "scratchings", "tally"], text: "Three sets of initials — A.A., A.A., A.A. — at shoulder height. Children of the family, lost young, if you had to guess." },
      { aliases: ["stonework", "stone", "stones", "block"], text: "The dressed stone is older than the manor, and finer; the cellars below seem to belong to an earlier house, or an earlier institution." },
    ],
  },

  family_crypt: {
    listen: "Your breath. The very faint creak of brass plaques expanding minutely as your lamp warms the air.",
    smell: "Cold stone, dry incense, and a sweetness that is not perfume.",
    examine: [
      { aliases: ["plaques", "plaque", "brass"], text: "ASHVALE, ASHVALE, ASHVALE. The Christian names rotate among Alistair, Aurora, Algernon, Ambrose — five generations of A's." },
      { aliases: ["sarcophagi", "tombs", "rows"], text: "Stone sarcophagi in two long rows. The fresh one — the one waiting — has its lid propped against the wall. The lid is heavier than one man could lift." },
      { aliases: ["vault", "ceiling", "roof"], text: "The vault is dry, well-cut, older than the manor by some considerable measure." },
    ],
  },

  family_chapel: {
    listen(state) {
      if (state.flags.candlesLit) return "Four candle-flames breathe in time with each other — slowly, deliberately, as if measuring a thing that is not air.";
      return "Stone gives back stone. Beneath the stone, a slow patient sound that may only be your own pulse.";
    },
    smell: "Beeswax, old incense, and a sweetness on which it would not be wise to dwell.",
    examine: [
      { aliases: ["altar", "stone altar"], text: "Plain limestone, unmarked. Whoever consecrated this chapel did not believe in ornament." },
      { aliases: ["sconces", "iron sconces", "sconce"], text: "Four iron sconces, ungilded, driven straight into the wall. Each holds a single black candle." },
      { aliases: ["sigils", "brass", "inlay"], text: "Brass sigils inlaid into the floor at the four cardinal points. Each is shaped like one of the spirit-tokens you have been recovering." },
    ],
  },
};

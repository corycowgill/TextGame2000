// NPCs: { id, names, short, desc, dialogue: { topic: text }, onTalk?, onAsk?, onShow?, onGive? }

export const NPCS = {
  mrs_crow: {
    id: "mrs_crow",
    names: ["crow", "mrs crow", "mrs. crow", "cook", "woman"],
    short: "Mrs. Crow, the cook",
    desc:
      "Mrs. Crow is a small woman in black bombazine, hands folded in her lap. Her eyes " +
      "follow you, but her mouth does not move. A chalk-slate rests beside her.",
    takeable: false,
    dialogue: {
      default: "Mrs. Crow regards you mournfully and taps the slate beside her. (Try `read slate`.)",
      will:
        "She writes, slowly: HE BROUGHT A NEW WILL. THE OLD ONE BURNT IN THE GRATE.",
      edmund:
        "She writes: A GOOD MAN. HE WAS FRIGHTENED THE LAST WEEK. HE WOULD NOT EAT.",
      solicitor:
        "Her face hardens. She writes one word and underlines it twice: DREDGE.",
      dredge:
        "She writes: HE WALKS AS IF THE FLOOR OWES HIM RENT.",
      cat:
        "She writes: HE IS NOT A CAT. HE IS A WITNESS.",
      ghost:
        "She writes: THERE ARE FOUR. THEY ARE ANGRY. THEY ARE OWED ANSWERS.",
      house:
        "She writes: THE HOUSE EATS THE NIGHT. DO NOT BE HERE WHEN IT FINISHES.",
    },
  },

  cassandra_ghost: {
    id: "cassandra_ghost",
    names: ["cassandra", "ghost", "lady cassandra", "spirit", "lady"],
    short: "the spirit of Lady Cassandra",
    desc:
      "Lady Cassandra stands among her plants, faint and beautiful and patient, the colour " +
      "of conservatory rain. Her lips move, but only flower-names come out. She is not at " +
      "rest.",
    takeable: false,
    dialogue: {
      default: "She murmurs: 'Foxglove. Foxglove. Hemlock. Show me what I drank, and I shall be still.'",
      will: "Her gaze lifts for a moment. She says, 'Pemberton's hand was on the cup.'",
      edmund: "'My husband's brother. He died believing me. Tell him I forgive his trust.'",
      poison: "'In the cup, in the cup. Show me which flower, and I will name the hand that poured.'",
    },
    onShow(state, itemId) {
      if (itemId === "monkshood_sprig") {
        if (state.tokensCollected.includes("teacup_token")) return "She has already given you what she had.";
        state.tokensCollected.push("teacup_token");
        state.flags.cassandraReleased = true;
        state.inventory.push("teacup_token");
        return [
          "You hold up the sprig. Her face changes — not relief, exactly, but recognition.",
          "  'So. The blue cup, then. Tell my husband I am sorry I trusted his brother's solicitor with my tea.'",
          "She unclasps something from her wrist — a small porcelain disc — and presses it into your hand. The conservatory rain seems to slacken. The plant on the plinth sags, as though spent.",
          "(You have recovered the Teacup Token.)",
        ];
      }
      if (itemId === "foxglove" || itemId === "hemlock") {
        return "Her face contorts. 'No. That was not in my cup.'";
      }
      return null;
    },
  },

  julien_ghost: {
    id: "julien_ghost",
    names: ["julien", "ghost", "spirit", "master julien", "brother"],
    short: "the spirit of Master Julien",
    desc:
      "Master Julien stands at the writing-shelf, scholarly and slight, the wound at his " +
      "ribs translucent. He is patient as only a man with no rest can be.",
    takeable: false,
    dialogue: {
      default: "He says, 'My letter-opener, brother. I never wrote with it. He used it on me.'",
      will: "'Pemberton drew up the codicil himself. My brother signed in trust. I told him not to.'",
      edmund: "'Trust was always his weakness. He thought lawyers were honest because they wore black.'",
      killer: "'A man of the law. His cuffs were always inked. He hated the letter R, because it stood at the front of his own first name.'",
      letter: "'R for his proper Christian name, which he resented. I wrote it once on the blade in jest. He took the blade with him. So he took the joke.'",
    },
    onShow(state, itemId) {
      if (itemId === "silver_letter_opener" || itemId === "julien_diary") {
        if (state.flags.julienReleased) return "Julien is at peace. There is nothing left to show him.";
        state.flags.julienReleased = true;
        return [
          "He looks at it long and gently. 'Yes. That is the blade. Tell my brother — tell Edmund, when you find him on the other side — that I bore him no grudge.'",
          "He fades, like a candle flame leaning into a draught.",
        ];
      }
      return null;
    },
  },

  beatrice_ghost: {
    id: "beatrice_ghost",
    names: ["beatrice", "child", "girl", "ghost", "spirit"],
    short: "Beatrice's spirit",
    desc:
      "Beatrice lies in her bed, cheek on the pillow as for any night, her eyes open. " +
      "Where there should be a child, there is the half-trick of one — present and absent " +
      "at once.",
    takeable: false,
    dialogue: {
      default: "She watches you without blinking. 'Did you bring my song? It is not the same without my song.'",
      song: "'Mama used to wind it. I cannot turn the key now. Will you?'",
      papa: "'A man with ink on his cuffs came in. He was very tall. He said, hush.'",
      ink: "'On his cuffs there was a letter. It looked like the letter at the end of papa's name.'",
      killer: "'A man with ink on his cuffs. His name has E in it, like papa's.'",
    },
    onShow(state, itemId) {
      if (itemId === "silver_locket") {
        if (state.flags.beatriceReleased) return "Beatrice is at peace. Let her sleep.";
        if (!state.flags.musicBoxWound) {
          return "She looks at the locket and at you, sadly. 'Will you wind my song first? I cannot remember without my song.'";
        }
        // Soothed by music + locket: release.
        state.flags.beatriceReleased = true;
        if (!state.tokensCollected.includes("locket_token")) state.tokensCollected.push("locket_token");
        state.inventory.push("locket_token");
        // Mark letter E if not already noted.
        state.flags.letterE_upstairs = true;
        return [
          "She reaches a hand that is not quite a hand and rests it on the locket. The chime in the music box goes from a tune to a lullaby.",
          "  'Tell papa I forgive him for trusting that man. The man's name has E. Tell papa.'",
          "She closes her eyes. The doll's house lights, one by one, go out. She presses something cool into your palm.",
          "(You have recovered the Locket Token.)",
        ];
      }
      if (itemId === "music_box") {
        if (!state.flags.musicBoxWound) return "She looks at the box. 'It will not sing yet.'";
        return "She smiles, faintly. 'Yes. But the song wants the locket too.'";
      }
      return null;
    },
    onCommand(state, cmd) {
      if (cmd.verb === "play" && cmd.noun && cmd.noun.includes("music")) {
        // Play music box in the nursery — atmospheric, no token unless locket also given.
        if (!state.flags.musicBoxWound) return "The music box will not play. (Try winding it first.)";
        return "You lift the lid in Beatrice's room. A lullaby threads itself between her and the windows. She turns her cheek toward you. (Showing her the locket would give her the rest.)";
      }
      return null;
    },
  },

  hollis_ghost: {
    id: "hollis_ghost",
    names: ["hollis", "butler", "spirit", "ghost", "mr hollis", "mr. hollis"],
    short: "the spirit of Mr. Hollis",
    desc:
      "Mr. Hollis stands beside his own body, holding (in his left hand, since the right is " +
      "still gripping his watch below) a folded napkin, very precisely, as though waiting to " +
      "announce a guest.",
    takeable: false,
    dialogue: {
      default: "He inclines his head. 'I observed Mr. Dredge in the wine cellar at midnight, sir, signing a paper that was not yet meant to be signed. He observed me observing him. The chute, sir, was nearer than the front door.'",
      will: "'The codicil was forged. I will swear so under any oath you can devise; I am, after all, in no further employment.'",
      dredge: "'A small man with proud handwriting. He fancied his own initial. He underlined his D.'",
      edmund: "'Lord Edmund was a kind master, sir. He trusted his lawyers. There was no remedy for that fault but trust.'",
    },
    onCommand() { return null; },
  },

  black_cat: {
    id: "black_cat",
    names: ["cat", "black cat", "kitten"],
    short: "a black cat",
    desc:
      "A long black cat with a white chevron at the throat. It watches you as if assessing " +
      "a tradesman's references. When you move, it moves; when you stop, it stops.",
    takeable: false,
    dialogue: {
      default: "The cat looks at you with an expression best described as *editorial*.",
    },
    onCommand(state, cmd) {
      if (cmd.verb === "feed" || cmd.verb === "give") {
        state.flags.catFed = true;
        return "The cat accepts your offering with grave courtesy and now seems to consider you part of its retinue. It will follow.";
      }
      if (cmd.verb === "take" || cmd.verb === "pick") {
        return "The cat declines, with prejudice.";
      }
      return null;
    },
  },
};

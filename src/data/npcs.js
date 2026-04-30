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

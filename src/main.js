import { startGame, executeInput } from "./engine.js";
import * as render from "./render.js";
import { VERBS } from "./parser.js";

// Build the autocomplete vocabulary once at boot. It's the union of every
// verb alias plus a small set of common nouns/directions, so Tab on a fresh
// input cycles through "go, look, examine, take, …".
const AUTOCOMPLETE_VOCAB = (() => {
  const set = new Set();
  for (const aliases of Object.values(VERBS)) {
    for (const a of aliases) if (a.length > 1) set.add(a);
  }
  // Common nouns the player will type a lot.
  for (const n of ["lamp", "letter", "telegram", "drawer", "fob", "key", "crepe", "valve",
                   "window", "door", "diary", "ledger", "monkshood", "locket", "watch", "token"]) {
    set.add(n);
  }
  return [...set].sort();
})();

function showBootError(err) {
  // Best-effort: write the error into the transcript so the user sees something.
  const t = document.getElementById("transcript");
  if (!t) {
    alert("Boot error: " + (err && err.message ? err.message : err));
    return;
  }
  const notice = document.getElementById("boot-notice");
  if (notice) notice.remove();
  const div = document.createElement("div");
  div.className = "line death";
  div.textContent = "Boot error: " + (err && err.message ? err.message : String(err));
  t.appendChild(div);
  const hint = document.createElement("div");
  hint.className = "line system";
  hint.textContent =
    location.protocol === "file:"
      ? "The page is being opened from disk (file://). ES modules require HTTP. Run:  python3 -m http.server 8000  in the project directory and open http://localhost:8000/"
      : "Hard-refresh (Shift+Reload) to clear cached modules. Open the browser console for details.";
  t.appendChild(hint);
  console.error("[Ashvale] boot failed:", err);
}

function init() {
  try {
    const form = document.getElementById("input-form");
    const input = document.getElementById("input");
    const transcript = document.getElementById("transcript");
    if (!form || !input || !transcript) {
      throw new Error("Required DOM elements not found (form/input/transcript).");
    }

    // Clear the loading placeholder, if any.
    const notice = document.getElementById("boot-notice");
    if (notice) notice.remove();

    // Command history: up/down arrows recall previous inputs.
    const history = [];
    let historyIndex = -1;
    let inProgress = "";

    // Tab autocomplete: completes the last word in the input. Repeated Tab
    // cycles through the matches.
    let tabMatches = null;
    let tabIndex = 0;
    let tabPrefix = "";
    let tabPrefixLen = 0;

    input.addEventListener("keydown", (e) => {
      // Reset tab cycle on any non-Tab key.
      if (e.key !== "Tab") {
        tabMatches = null;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const value = input.value;
        if (tabMatches === null) {
          // Find the last word (alphabet only) in the input.
          const m = value.match(/([A-Za-z]+)$/);
          tabPrefix = m ? m[1].toLowerCase() : "";
          tabPrefixLen = m ? m[1].length : 0;
          tabMatches = AUTOCOMPLETE_VOCAB.filter((w) => w.startsWith(tabPrefix));
          tabIndex = 0;
        } else {
          tabIndex = (tabIndex + 1) % Math.max(1, tabMatches.length);
        }
        if (tabMatches.length === 0) return;
        const completion = tabMatches[tabIndex];
        const stem = value.slice(0, value.length - tabPrefixLen);
        input.value = stem + completion;
        // Update the running prefix length so consecutive Tabs replace cleanly.
        tabPrefixLen = completion.length;
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        return;
      }
      if (e.key === "ArrowUp") {
        if (history.length === 0) return;
        if (historyIndex === -1) {
          // First press: stash whatever the user is mid-typing.
          inProgress = input.value;
          historyIndex = history.length - 1;
        } else if (historyIndex > 0) {
          historyIndex--;
        }
        input.value = history[historyIndex];
        // Move caret to end after the value updates.
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        if (historyIndex === -1) return;
        if (historyIndex < history.length - 1) {
          historyIndex++;
          input.value = history[historyIndex];
        } else {
          historyIndex = -1;
          input.value = inProgress;
          inProgress = "";
        }
        setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
        e.preventDefault();
      } else if (e.key === "Escape") {
        input.value = "";
        historyIndex = -1;
        inProgress = "";
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value;
      input.value = "";
      historyIndex = -1;
      inProgress = "";
      if (!value.trim()) {
        render.focusInput();
        return;
      }
      // Don't push duplicates of the most recent entry.
      if (history.length === 0 || history[history.length - 1] !== value) {
        history.push(value);
        // Keep history bounded.
        if (history.length > 200) history.shift();
      }
      render.echo(value);
      try {
        executeInput(value);
      } catch (err) {
        console.error(err);
        render.system("(Something has gone wrong in the engine. See console.)");
      }
      render.focusInput();
    });

    // Click anywhere in the transcript to refocus the input.
    transcript.addEventListener("click", () => {
      render.focusInput();
    });

    startGame();
    render.focusInput();
    window.__ashvaleBooted = true;
  } catch (err) {
    showBootError(err);
    // Re-throw so the global error handler also sees it (and dev tools).
    throw err;
  }
}

// Module scripts are deferred, so the DOM is normally ready by now.
// Guard for the unusual case anyway.
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  // Defer one tick so the inline boot watchdog has installed before we run.
  Promise.resolve().then(init);
}

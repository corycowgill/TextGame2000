import { startGame, executeInput } from "./engine.js";
import * as render from "./render.js";

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

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const value = input.value;
      input.value = "";
      if (!value.trim()) {
        render.focusInput();
        return;
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

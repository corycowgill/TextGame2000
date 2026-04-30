import { startGame, executeInput } from "./engine.js";
import * as render from "./render.js";

function init() {
  const form = document.getElementById("input-form");
  const input = document.getElementById("input");

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
  document.getElementById("transcript").addEventListener("click", () => {
    render.focusInput();
  });

  startGame();
  render.focusInput();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

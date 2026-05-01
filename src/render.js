// DOM I/O for the game transcript and status bar.
const transcriptEl = () => document.getElementById("transcript");

function appendLine(text, cls) {
  const t = transcriptEl();
  if (!t) {
    // Surfacing this is preferable to silent failure during boot.
    console.warn("[Ashvale] transcript element missing; line dropped:", text);
    return;
  }
  const div = document.createElement("div");
  div.className = "line" + (cls ? " " + cls : "");
  div.textContent = text;
  t.appendChild(div);
  t.scrollTop = t.scrollHeight;
}

export function print(text, cls) {
  if (text == null) return;
  if (Array.isArray(text)) {
    for (const piece of text) print(piece, cls);
    return;
  }
  const str = String(text);
  // Preserve blank lines as spacers.
  if (str === "") {
    appendLine(" ", cls);
    return;
  }
  // Split on explicit newlines so each becomes its own line element.
  const parts = str.split("\n");
  for (const p of parts) appendLine(p, cls);
}

export function printRoomName(name) {
  print(name, "room-name");
}

export function echo(cmd) {
  print(cmd, "echo");
}

export function system(text) {
  print(text, "system");
}

export function death(text) {
  print(text, "death");
}

export function win(text) {
  print(text, "win");
}

export function clear() {
  const t = transcriptEl();
  if (t) t.innerHTML = "";
}

export function updateStatus({ roomName, turnCount, lampOil, lampLit }) {
  const r = document.getElementById("status-room");
  const t = document.getElementById("status-turn");
  const o = document.getElementById("status-oil");
  if (r && roomName != null) r.textContent = roomName;
  if (t && turnCount != null) t.textContent = `turn ${turnCount}`;
  if (o && lampOil != null) {
    if (!lampLit) o.textContent = "lamp: unlit";
    else o.textContent = `lamp: ${lampOil} oil`;
  }
}

export function focusInput() {
  const inp = document.getElementById("input");
  if (inp) inp.focus();
}

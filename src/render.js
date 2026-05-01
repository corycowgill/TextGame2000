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

// ---------- SVG map overlay ----------

const MAP_OVERLAY_ID = "map-overlay";

function ensureOverlay() {
  let o = document.getElementById(MAP_OVERLAY_ID);
  if (o) return o;
  o = document.createElement("div");
  o.id = MAP_OVERLAY_ID;
  o.addEventListener("click", (e) => {
    // Click outside the panel (on the dim background) closes the map.
    if (e.target.id === MAP_OVERLAY_ID || e.target.id === "map-close") hideMap();
  });
  document.body.appendChild(o);
  // Esc to close.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && o.style.display !== "none") hideMap();
  });
  return o;
}

export function hideMap() {
  const o = document.getElementById(MAP_OVERLAY_ID);
  if (o) o.style.display = "none";
  focusInput();
}

// Show the map overlay. `data` is { rooms, layout, edges, currentRoom, visited,
// tokens, totalTokens }.
//   rooms:   { id -> { id, name } }
//   layout:  { id -> { x, y, label } }    // pixel coordinates and short label
//   edges:   array of { from, to, kind }  // kind: "exit" | "stair"
//   currentRoom, visited (Set), tokens (number), totalTokens (number)
export function showMap(data) {
  const o = ensureOverlay();
  o.innerHTML = buildMapHTML(data);
  o.style.display = "flex";
}

function escapeXml(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

function buildMapHTML(data) {
  const { layout, edges, currentRoom, visited, tokens, totalTokens, sections } = data;

  const W = 100, H = 44; // room cell width/height in SVG units
  const cx = (id) => layout[id].x + W / 2;
  const cy = (id) => layout[id].y + H / 2;

  // Build edges first so they sit beneath rooms.
  const lineParts = [];
  for (const e of edges) {
    if (!layout[e.from] || !layout[e.to]) continue;
    const x1 = cx(e.from), y1 = cy(e.from), x2 = cx(e.to), y2 = cy(e.to);
    const cls = e.kind === "stair" ? "edge stair" : "edge";
    const bothVisited = visited.has(e.from) && visited.has(e.to);
    const dim = bothVisited ? "" : " dim";
    lineParts.push(
      `<line class="${cls}${dim}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`
    );
  }

  // Build rooms.
  const roomParts = [];
  for (const id of Object.keys(layout)) {
    const r = layout[id];
    const isHere = id === currentRoom;
    const isVisited = visited.has(id);
    const cls = isHere ? "room here" : isVisited ? "room visited" : "room unknown";
    const label = isVisited || isHere ? escapeXml(r.label) : "?";
    roomParts.push(
      `<g class="${cls}">` +
        `<rect x="${r.x}" y="${r.y}" width="${W}" height="${H}" rx="6" ry="6" />` +
        `<text x="${r.x + W / 2}" y="${r.y + H / 2 + 4}" text-anchor="middle">${label}</text>` +
      `</g>`
    );
  }

  // Section labels.
  const sectionParts = (sections || []).map((s) =>
    `<text class="section-label" x="${s.x}" y="${s.y}">${escapeXml(s.label)}</text>`
  );

  // Compass rose, top-left of the panel (in SVG units).
  const compass = `
    <g class="compass" transform="translate(60, 60)">
      <circle r="34" />
      <text class="cn" y="-20" text-anchor="middle">N</text>
      <text class="cs" y="28" text-anchor="middle">S</text>
      <text class="cw" x="-22" y="4" text-anchor="middle">W</text>
      <text class="ce" x="22" y="4" text-anchor="middle">E</text>
      <line x1="0" y1="-32" x2="0" y2="32" />
      <line x1="-32" y1="0" x2="32" y2="0" />
    </g>`;

  // SVG viewbox sized for our layout.
  const VBW = 880, VBH = 1060;

  const svg = `
    <svg viewBox="0 0 ${VBW} ${VBH}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin meet">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5"
          markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      ${compass}
      <text class="title" x="${VBW / 2}" y="44" text-anchor="middle">Ashvale Manor</text>
      ${sectionParts.join("")}
      <g class="edges">${lineParts.join("")}</g>
      <g class="rooms">${roomParts.join("")}</g>
    </svg>`;

  const tokensLine = `Tokens recovered: ${tokens}/${totalTokens}  ·  Rooms discovered: ${visited.size}/${Object.keys(layout).length}`;

  return `
    <div class="map-panel" role="dialog" aria-label="Map of Ashvale Manor">
      <div class="map-toolbar">
        <span class="map-title">Map</span>
        <span class="map-stats">${escapeXml(tokensLine)}</span>
        <button id="map-close" type="button" aria-label="Close map">close ✕</button>
      </div>
      ${svg}
      <div class="map-legend">
        <span class="legend here">★ you are here</span>
        <span class="legend visited">visited</span>
        <span class="legend unknown">unvisited</span>
        <span class="legend stair">— — stair / hidden door</span>
      </div>
    </div>
  `;
}


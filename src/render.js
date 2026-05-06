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

// Map full direction names to compact arrows for the status bar.
const DIR_ARROWS = {
  north: "N", south: "S", east: "E", west: "W",
  up: "↑", down: "↓",
  northeast: "NE", northwest: "NW", southeast: "SE", southwest: "SW",
};

export function updateStatus({ roomName, turnCount, lampOil, lampLit, exits }) {
  const r = document.getElementById("status-room");
  const t = document.getElementById("status-turn");
  const o = document.getElementById("status-oil");
  const x = document.getElementById("status-exits");
  if (r && roomName != null) r.textContent = roomName;
  if (t && turnCount != null) t.textContent = `turn ${turnCount}`;
  if (o && lampOil != null) {
    if (!lampLit) o.textContent = "lamp: unlit";
    else o.textContent = `lamp: ${lampOil} oil`;
  }
  if (x && Array.isArray(exits)) {
    if (exits.length === 0) x.textContent = "exits: none";
    else x.textContent = "exits: " + exits.map((d) => DIR_ARROWS[d] || d).join(" ");
  }
}

export function focusInput() {
  const inp = document.getElementById("input");
  if (inp) inp.focus();
}

// ---------- Map overlay ----------

const MAP_OVERLAY_ID = "map-overlay";
const CYTOSCAPE_URL = "https://cdn.jsdelivr.net/npm/cytoscape@3.30.4/dist/cytoscape.umd.js";

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

// Lazy-load Cytoscape.js the first time the user opens the map. If the CDN is
// unreachable the promise rejects and showMap falls back to inline SVG.
let cytoscapeLoadPromise = null;
function loadCytoscape() {
  if (typeof window !== "undefined" && window.cytoscape) {
    return Promise.resolve(window.cytoscape);
  }
  if (cytoscapeLoadPromise) return cytoscapeLoadPromise;
  cytoscapeLoadPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = CYTOSCAPE_URL;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.onload = () =>
      window.cytoscape ? resolve(window.cytoscape) : reject(new Error("cytoscape global missing after load"));
    s.onerror = () => {
      cytoscapeLoadPromise = null; // allow retry on next open
      reject(new Error("Failed to fetch cytoscape from " + CYTOSCAPE_URL));
    };
    document.head.appendChild(s);
  });
  return cytoscapeLoadPromise;
}

// Show the map overlay. `data` is { layout, edges, sections, currentRoom,
// visited, tokens, totalTokens }.
export function showMap(data) {
  const o = ensureOverlay();
  o.innerHTML = buildPanelShell(data);
  o.style.display = "flex";
  const graphEl = document.getElementById("cy-graph");
  if (!graphEl) return;

  // Try Cytoscape first; on any failure fall back to inline SVG.
  loadCytoscape()
    .then((cy) => {
      try {
        graphEl.innerHTML = "";
        renderWithCytoscape(graphEl, data, cy);
      } catch (e) {
        console.warn("[Ashvale] Cytoscape render failed; SVG fallback.", e);
        graphEl.innerHTML = buildMapSVG(data);
      }
    })
    .catch((e) => {
      console.warn("[Ashvale] Cytoscape unavailable; SVG fallback.", e);
      graphEl.innerHTML = buildMapSVG(data);
    });
}

function escapeXml(s) {
  return String(s).replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])
  );
}

function buildPanelShell(data) {
  const { tokens, totalTokens, visited, layout } = data;
  const stats = `Tokens recovered: ${tokens}/${totalTokens}  ·  Rooms discovered: ${visited.size}/${Object.keys(layout).length}`;
  return `
    <div class="map-panel" role="dialog" aria-label="Map of Ashvale Manor">
      <div class="map-toolbar">
        <span class="map-title">Ashvale Manor — Map</span>
        <span class="map-stats">${escapeXml(stats)}</span>
        <button id="map-close" type="button" aria-label="Close map">close ✕</button>
      </div>
      <div class="map-graph-wrap">
        <div class="map-compass" aria-hidden="true">
          <span class="cn">N</span>
          <span class="cw">W</span>
          <span class="cdot">●</span>
          <span class="ce">E</span>
          <span class="cs">S</span>
        </div>
        <div id="cy-graph" class="cy-graph">
          <div class="cy-loading">drawing the manor…</div>
        </div>
      </div>
      <div class="map-legend">
        <span class="legend here">▲ you are here</span>
        <span class="legend visited">visited</span>
        <span class="legend unknown">unvisited</span>
        <span class="legend stair">— — stair / hidden door</span>
        <span class="legend hint">drag to pan · scroll to zoom</span>
      </div>
    </div>
  `;
}

function renderWithCytoscape(container, data, cytoscape) {
  const { layout, edges, currentRoom, visited } = data;

  const nodes = Object.entries(layout).map(([id, r]) => {
    const cls = id === currentRoom ? "here" : visited.has(id) ? "visited" : "unknown";
    const label = (visited.has(id) || id === currentRoom) ? r.label : "?";
    return {
      data: { id, label },
      position: { x: r.x, y: r.y },
      classes: cls,
      grabbable: false,
      selectable: false,
    };
  });

  const cyEdges = edges.map((e, i) => {
    const bothKnown = (visited.has(e.from) || e.from === currentRoom) &&
                      (visited.has(e.to)   || e.to   === currentRoom);
    const cls = e.kind === "stair"
      ? (bothKnown ? "stair" : "stair dim")
      : (bothKnown ? "exit"  : "exit dim");
    return {
      data: { id: `e${i}`, source: e.from, target: e.to },
      classes: cls,
      selectable: false,
    };
  });

  const cy = cytoscape({
    container,
    elements: { nodes, edges: cyEdges },
    layout: { name: "preset" },
    minZoom: 0.4,
    maxZoom: 2.5,
    wheelSensitivity: 0.25,
    style: [
      {
        selector: "node",
        style: {
          shape: "round-rectangle",
          width: 110,
          height: 38,
          "background-color": "#2a1f15",
          "border-color": "#a89878",
          "border-width": 1,
          label: "data(label)",
          color: "#e8d8b0",
          "text-valign": "center",
          "text-halign": "center",
          "font-family": "'Iowan Old Style', 'Palatino Linotype', Georgia, serif",
          "font-size": 12,
          "text-wrap": "ellipsis",
          "text-max-width": 100,
        },
      },
      {
        selector: "node.unknown",
        style: {
          "background-color": "#1a140e",
          "border-color": "#3a2a1c",
          "border-style": "dashed",
          color: "#a89878",
          "font-style": "italic",
        },
      },
      {
        selector: "node.visited",
        style: {
          "background-color": "#2a1f15",
          "border-color": "#a89878",
          color: "#e8d8b0",
        },
      },
      {
        selector: "node.here",
        style: {
          "background-color": "#d49a4a",
          "border-color": "#f5e6c0",
          "border-width": 2.5,
          color: "#14100c",
          "font-weight": "bold",
        },
      },
      {
        selector: "edge",
        style: {
          width: 1.6,
          "line-color": "#a89878",
          "curve-style": "straight",
          "target-arrow-shape": "none",
          opacity: 0.95,
        },
      },
      {
        selector: "edge.dim",
        style: {
          "line-color": "#3a2a1c",
          "line-style": "dotted",
          opacity: 0.7,
        },
      },
      {
        selector: "edge.stair",
        style: {
          "line-style": "dashed",
          "line-color": "#d49a4a",
          width: 1.4,
          opacity: 0.85,
        },
      },
      {
        selector: "edge.stair.dim",
        style: {
          "line-color": "#5a4022",
          opacity: 0.6,
        },
      },
    ],
  });

  // Frame the graph nicely on first render.
  cy.fit(undefined, 30);
  // Centre on the player so the user immediately sees where they are.
  if (currentRoom && cy.getElementById(currentRoom).length) {
    cy.center(cy.getElementById(currentRoom));
    // Pull back zoom a touch so context is visible too.
    cy.zoom(Math.min(cy.zoom(), 0.95));
  }
}

// SVG fallback used only when Cytoscape can't be loaded. Returns just the
// <svg> body, to be injected into the #cy-graph container.
function buildMapSVG(data) {
  const { layout, edges, currentRoom, visited, sections } = data;
  const W = 100, H = 44;
  const cx = (id) => layout[id].x + W / 2;
  const cy = (id) => layout[id].y + H / 2;

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

  const sectionParts = (sections || []).map((s) =>
    `<text class="section-label" x="${s.x}" y="${s.y}">${escapeXml(s.label)}</text>`
  );

  const VBW = 880, VBH = 1060;
  return `
    <svg viewBox="0 0 ${VBW} ${VBH}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMin meet">
      ${sectionParts.join("")}
      <g class="edges">${lineParts.join("")}</g>
      <g class="rooms">${roomParts.join("")}</g>
    </svg>`;
}


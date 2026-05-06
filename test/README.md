# Tests

Headless playthrough tests for *The Last Will of Ashvale*. They mock
just enough DOM for `engine.js` and `render.js` to load, then drive
the engine through scripted command sequences and assert on game
state.

## Run

From the repository root:

```sh
node test/e2e.mjs        # full happy-path + parser/save/load/finale (~120 assertions)
node test/e2e_loss.mjs   # lose paths (rotten balcony, lamp burns out in dark)
```

Each script prints a pass/fail summary and exits non-zero on any
failure.

## Notes

- The tests set `globalThis.__ASHVALE_NO_AMBIENT__ = true` so the
  engine doesn't emit random ambient flavor lines (which would make
  string-match assertions flaky).
- They use an in-memory `localStorage` shim, so save/load is tested
  but doesn't touch your real browser storage.
- The Cytoscape map uses a CDN script tag; in headless mode the
  script load fails silently and the SVG fallback is exercised.

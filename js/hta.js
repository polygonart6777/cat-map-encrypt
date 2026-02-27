/**
 * hta.js
 * Controls the "Step-by-Step" page.
 * Shows a 10×10 coloured grid being transformed by A=[[1,1],[1,0]]:
 *   - Left panel:   current discrete positions
 *   - Middle panel: linear map output (before mod), with 10×10 region highlighted
 *   - Right panel:  result after mod N (next state preview)
 */

let htaInited  = false;

const HTA_N      = 10;
const HTA_LMIN   = -5;
const HTA_LMAX   = 20;
const HTA_LRANGE = HTA_LMAX - HTA_LMIN; // 25

let htaOrig    = [];
let htaCurrent = [];
let htaIter    = 0;

/* ── Init (called lazily on first tab visit) ── */

function initHTA() {
  htaInited = true;
  htaOrig   = [];

  for (let i = 0; i < HTA_N; i++) {
    for (let j = 0; j < HTA_N; j++) {
      htaOrig.push({ x: i, y: j, idx: i * HTA_N + j });
    }
  }

  htaCurrent = htaOrig.map(p => ({ ...p }));
  htaRedraw();
}

/* ── Colour spectrum (matches original generateColors() exactly) ── */

function htaColor(idx) {
  const j       = idx % HTA_N;
  const baseHue = 510 + (j * 50) / HTA_N + (j * 105) / HTA_N;
  return `hsl(${baseHue % 360}, 60%, 50%)`;
}

/* ── Coordinate helpers ── */

/**
 * Convert a grid coordinate to canvas pixel position.
 * @param {number} x
 * @param {number} y
 * @param {number} W  canvas width
 * @param {number} H  canvas height
 * @param {boolean} isLinear  use extended linear range instead of discrete grid
 * @returns {[number, number]} [canvasX, canvasY]
 */
function htaToCanvas(x, y, W, H, isLinear) {
  if (isLinear) {
    return [
      ((x - HTA_LMIN) / HTA_LRANGE) * W,
      H - ((y - HTA_LMIN) / HTA_LRANGE) * H,
    ];
  }
  // Discrete: place point at centre of its grid cell
  const cell = W / HTA_N;
  return [(x + 0.5) * cell, H - (y + 0.5) * cell];
}

/* ── Drawing helpers ── */

function htaDrawGrid(ctx, W, H, isLinear) {
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth   = 0.5;

  if (isLinear) {
    // Sparse grid lines every 5 units across the extended range
    for (let i = Math.ceil(HTA_LMIN); i <= HTA_LMAX; i += 5) {
      const [cx] = htaToCanvas(i, 0, W, H, true);
      if (cx >= 0 && cx <= W) {
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();
      }
    }
    for (let j = Math.ceil(HTA_LMIN); j <= HTA_LMAX; j += 5) {
      const [, cy] = htaToCanvas(0, j, W, H, true);
      if (cy >= 0 && cy <= H) {
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();
      }
    }

    // Highlight the valid 10×10 region in red
    const [x0, y1] = htaToCanvas(0,     0,     W, H, true);
    const [x1, y0] = htaToCanvas(HTA_N, HTA_N, W, H, true);
    ctx.fillStyle   = 'rgba(255,0,0,0.08)';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.strokeStyle = 'red';
    ctx.lineWidth   = 1.5;
    ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);

  } else {
    // Dense 10×10 grid
    const cell = W / HTA_N;
    ctx.fillStyle = 'rgba(0,150,0,0.07)';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i <= HTA_N; i++) {
      ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(W, i * cell); ctx.stroke();
    }
  }
}

function htaDrawPoints(ctx, W, H, points, isLinear) {
  const cell = W / HTA_N;

  for (const p of points) {
    ctx.fillStyle = htaColor(p.idx);

    if (isLinear) {
      // linearTransform from original: newX = x+y, newY = x+0*y
      const lx       = p.x + p.y;
      const ly       = p.x + 0 * p.y;
      const [cx, cy] = htaToCanvas(lx, ly, W, H, true);

      // Skip points far outside the visible canvas
      if (cx >= -20 && cx <= W + 20 && cy >= -20 && cy <= H + 20) {
        ctx.fillRect(cx - 6, cy - 6, 12, 12);
        ctx.strokeStyle = '#000';
        ctx.lineWidth   = 0.5;
        ctx.strokeRect(cx - 6, cy - 6, 12, 12);
      }
    } else {
      // Fill the entire grid cell (y-axis flipped for canvas coords)
      const cx = p.x * cell;
      const cy = (HTA_N - 1 - p.y) * cell;
      ctx.fillRect(cx, cy, cell, cell);
      ctx.strokeStyle = '#000';
      ctx.lineWidth   = 0.5;
      ctx.strokeRect(cx, cy, cell, cell);
    }
  }
}

/* ── Main redraw ── */

function htaRedraw() {
  const W = 280, H = 280;
  const bCtx = document.getElementById('hta-before').getContext('2d');
  const lCtx = document.getElementById('hta-linear').getContext('2d');
  const aCtx = document.getElementById('hta-after').getContext('2d');

  // Left: current discrete state
  bCtx.clearRect(0, 0, W, H); bCtx.fillStyle = 'white'; bCtx.fillRect(0, 0, W, H);
  htaDrawGrid(bCtx, W, H, false);
  htaDrawPoints(bCtx, W, H, htaCurrent, false);

  // Middle: linear map of current points (before mod)
  lCtx.clearRect(0, 0, W, H); lCtx.fillStyle = 'white'; lCtx.fillRect(0, 0, W, H);
  htaDrawGrid(lCtx, W, H, true);
  htaDrawPoints(lCtx, W, H, htaCurrent, true);

  // Right: next-state preview — what current points become after mod N
  const next = htaCurrent.map(p => ({
    x:   ((p.x + p.y)       % HTA_N + HTA_N) % HTA_N,
    y:   ((p.x + 0 * p.y)   % HTA_N + HTA_N) % HTA_N,
    idx: p.idx,
  }));
  aCtx.clearRect(0, 0, W, H); aCtx.fillStyle = 'white'; aCtx.fillRect(0, 0, W, H);
  htaDrawGrid(aCtx, W, H, false);
  htaDrawPoints(aCtx, W, H, next, false);
}

/* ── Controls ── */

function htaApply() {
  htaCurrent = htaCurrent.map(p => ({
    x:   ((p.x + p.y)       % HTA_N + HTA_N) % HTA_N,
    y:   ((p.x + 0 * p.y)   % HTA_N + HTA_N) % HTA_N,
    idx: p.idx,
  }));

  htaIter++;
  document.getElementById('hta-count').textContent = htaIter;

  // Reveal middle and right panels on first apply
  document.getElementById('hta-col-linear').style.opacity = '1';
  document.getElementById('hta-col-after').style.opacity  = '1';

  htaRedraw();
}

function htaReset() {
  htaCurrent = htaOrig.map(p => ({ ...p }));
  htaIter    = 0;
  document.getElementById('hta-count').textContent        = '0';
  document.getElementById('hta-col-linear').style.opacity = '0.25';
  document.getElementById('hta-col-after').style.opacity  = '0.25';
  htaRedraw();
}

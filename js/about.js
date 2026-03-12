/**
 * about.js
 * Renders static diagrams on the About page.
 * Reuses htaDrawGrid and htaDrawPoints from hta.js.
 */

// Build the original 10×10 grid points once — shared by all diagrams
const aboutPoints = [];
for (let i = 0; i < HTA_N; i++) {
  for (let j = 0; j < HTA_N; j++) {
    aboutPoints.push({ x: i, y: j, idx: i * HTA_N + j });
  }
}

// ── Helpers ──────────────────────────────────────────────────

function clearCanvas(ctx, W, H) {
  ctx.globalAlpha = 1.0;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, W, H);
}

function getCtx(id) {
  const el = document.getElementById(id);
  return el ? el.getContext("2d") : null;
}

// Draws a single square with opacity based on original x coordinate
function drawPoint(ctx, cx, cy, idx, origX, size = 12) {
  const half = size / 2;
  const t = origX / (HTA_N - 1); // 0 at x=0, 1 at x=HTA_N-1
  k = 0.6;
  const alpha = 1.5 * Math.exp((-1.1 * origX) / (HTA_N - 1));
  http: console.log(alpha);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = htaColor(idx);
  ctx.fillRect(cx - half, cy - half, size, size);
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 0.5;
  ctx.strokeRect(cx - half, cy - half, size, size);
  ctx.globalAlpha = 1.0;
}

// ── Arnold Cat Map diagram ────────────────────────────────────

function initAboutDiagram() {
  const W = 280,
    H = 280;

  const reflected = aboutPoints.map((p) => ({ x: p.y, y: p.x, idx: p.idx }));
  const linear = aboutPoints;
  const after = aboutPoints.map((p) => ({
    x: (((p.x + p.y) % HTA_N) + HTA_N) % HTA_N,
    y: (((p.x + 0 * p.y) % HTA_N) + HTA_N) % HTA_N,
    idx: p.idx,
  }));

  [
    { id: "about-hta-before", points: aboutPoints, isLinear: false },
    { id: "about-hta-reflect", points: reflected, isLinear: false },
    { id: "about-hta-linear", points: linear, isLinear: true },
    { id: "about-hta-after", points: after, isLinear: false },
  ].forEach(({ id, points, isLinear }) => {
    const ctx = getCtx(id);
    if (!ctx) return;
    clearCanvas(ctx, W, H);
    htaDrawGrid(ctx, W, H, isLinear);

    if (isLinear) {
      // Use drawPoint for opacity in linear mode
      for (const p of points) {
        const lx = p.x + p.y;
        const ly = p.x;
        const cx = ((lx - HTA_LMIN) / HTA_LRANGE) * W;
        const cy = H - ((ly - HTA_LMIN) / HTA_LRANGE) * H;
        if (cx >= -20 && cx <= W + 20 && cy >= -20 && cy <= H + 20) {
          drawPoint(ctx, cx, cy, p.idx, p.x);
        }
      }
    } else {
      const cell = W / HTA_N;
      for (const p of points) {
        const cx = p.x * cell + cell / 2;
        const cy = (HTA_N - 1 - p.y) * cell + cell / 2;
        drawPoint(ctx, cx, cy, p.idx, aboutPoints[p.idx].x, cell); // pass cell size
      }
    }
  });

  initDetVisuals();
  initEigenVisuals();
}

// ── Determinant visuals ───────────────────────────────────────

function drawLinearPoints(ctx, W, H, a11, a12, a21, a22) {
  for (const p of aboutPoints) {
    const lx = a11 * p.x + a12 * p.y;
    const ly = a21 * p.x + a22 * p.y;
    const cx = ((lx - HTA_LMIN) / HTA_LRANGE) * W;
    const cy = H - ((ly - HTA_LMIN) / HTA_LRANGE) * H;
    if (cx >= -20 && cx <= W + 20 && cy >= -20 && cy <= H + 20) {
      drawPoint(ctx, cx, cy, p.idx, p.x);
    }
  }
}

function initDetVisuals() {
  const W = 280,
    H = 280;

  function drawDetCanvas(id, a11, a12, a21, a22, useLinear) {
    const ctx = getCtx(id);
    if (!ctx) return;
    clearCanvas(ctx, W, H);

    if (useLinear) {
      htaDrawGrid(ctx, W, H, true);
      drawLinearPoints(ctx, W, H, a11, a12, a21, a22);
    } else {
      const transformed = aboutPoints.map((p) => ({
        x: (((a11 * p.x + a12 * p.y) % HTA_N) + HTA_N) % HTA_N,
        y: (((a21 * p.x + a22 * p.y) % HTA_N) + HTA_N) % HTA_N,
        idx: p.idx,
        origX: p.x,
      }));
      htaDrawGrid(ctx, W, H, false);
      const cell = W / HTA_N;
      for (const p of transformed) {
        const cx = p.x * cell + cell / 2;
        const cy = (HTA_N - 1 - p.y) * cell + cell / 2;
        drawPoint(ctx, cx, cy, p.idx, p.origX, cell); // pass cell size
      }
    }
  }

  drawDetCanvas("about-det-1", 1, 0, 0, 1, false);
  drawDetCanvas("about-det-neg1", 0, 1, 1, 0, false);
  drawDetCanvas("about-det-2", 2, 0, 0, 1, true);
  drawDetCanvas("about-det-0", 1, 0, 0, 0, true);
}

function initEigenVisuals() {
  const W = 280,
    H = 280;

  function drawEigenCanvas(id, a11, a12, a21, a22) {
    const ctx = getCtx(id);
    if (!ctx) return;
    clearCanvas(ctx, W, H);
    htaDrawGrid(ctx, W, H, true);
    drawLinearPoints(ctx, W, H, a11, a12, a21, a22);
  }

  drawEigenCanvas("about-eigen-both-gt", 4, 1, 1, 2);
  drawEigenCanvas("about-eigen-both-lt", 0, 1, -1, 1);
  drawEigenCanvas("about-eigen-length-1", 1, 1, 0, 1);
  drawEigenCanvas("about-eigen-straddle", 1, 1, 1, 0);
}

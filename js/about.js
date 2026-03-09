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
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, W, H);
}

function getCtx(id) {
  const el = document.getElementById(id);
  return el ? el.getContext("2d") : null;
}

// ── Arnold Cat Map diagram ────────────────────────────────────

function initAboutDiagram() {
  const W = 280,
    H = 280;

  // Derived point sets from the shared original
  const reflected = aboutPoints.map((p) => ({ x: p.y, y: p.x, idx: p.idx }));
  const linear = aboutPoints; // drawn in linear mode — no transform needed
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
    htaDrawPoints(ctx, W, H, points, isLinear);
  });

  initDetVisuals();
}

// ── Determinant visuals ───────────────────────────────────────

function drawLinearPoints(ctx, W, H, a11, a12, a21, a22) {
  for (const p of aboutPoints) {
    const lx = a11 * p.x + a12 * p.y;
    const ly = a21 * p.x + a22 * p.y;

    const cx = ((lx - HTA_LMIN) / HTA_LRANGE) * W;
    const cy = H - ((ly - HTA_LMIN) / HTA_LRANGE) * H;

    if (cx >= -20 && cx <= W + 20 && cy >= -20 && cy <= H + 20) {
      ctx.fillStyle = htaColor(p.idx);
      ctx.fillRect(cx - 6, cy - 6, 12, 12);
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 0.5;
      ctx.strokeRect(cx - 6, cy - 6, 12, 12);
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
      }));
      htaDrawGrid(ctx, W, H, false);
      htaDrawPoints(ctx, W, H, transformed, false);
    }
  }

  // det = 1  — identity, discrete grid style
  drawDetCanvas("about-det-1", 1, 0, 0, 1, false);

  // det = -1 — reflect, discrete grid style
  drawDetCanvas("about-det-neg1", 0, 1, 1, 0, false);

  // det = 2  — linear style showing points outside red box
  drawDetCanvas("about-det-2", 2, 0, 0, 1, true);

  // det = 0  — linear style showing collapse
  drawDetCanvas("about-det-0", 1, 0, 0, 0, true);
}

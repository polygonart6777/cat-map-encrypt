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
  const alpha = 2 * Math.exp((-1.1 * origX) / (HTA_N - 1));
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
  initRotationVisuals();
  initShearVisuals();
  initReflectionVisuals();
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

// ── Matrix power helper ───────────────────────────────────────

// Multiply two 2x2 matrices
function matMul(a, b) {
  return [
    a[0] * b[0] + a[1] * b[2],
    a[0] * b[1] + a[1] * b[3],
    a[2] * b[0] + a[3] * b[2],
    a[2] * b[1] + a[3] * b[3],
  ];
}

// Raise a 2x2 matrix to the nth power
function matPow(m, n) {
  let result = [1, 0, 0, 1]; // identity
  for (let i = 0; i < n; i++) result = matMul(result, m);
  return result;
}

function applyMatrixMod(pts, m, steps) {
  let current = pts.map((p) => ({ x: p.x, y: p.y, idx: p.idx, origX: p.x }));
  for (let i = 0; i < steps; i++) {
    current = current.map((p) => ({
      x: ((Math.floor(m[0] * p.x + m[1] * p.y) % HTA_N) + HTA_N) % HTA_N,
      y: ((Math.floor(m[2] * p.x + m[3] * p.y) % HTA_N) + HTA_N) % HTA_N,
      idx: p.idx,
      origX: p.origX,
    }));
  }
  return current;
}

// Draw a set of transformed points in linear mode with dynamic bounds
function drawDynamicPoints(ctx, W, H, transformed) {
  const pad = 20;
  const allX = transformed.map((p) => p.x);
  const allY = transformed.map((p) => p.y);
  const minX = Math.min(...allX, 0);
  const maxX = Math.max(...allX, HTA_N);
  const minY = Math.min(...allY, 0);
  const maxY = Math.max(...allY, HTA_N);

  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  function toCanvas(x, y) {
    return [
      pad + ((x - minX) / rangeX) * (W - pad * 2),
      H - pad - ((y - minY) / rangeY) * (H - pad * 2),
    ];
  }

  // Draw faint grid
  ctx.strokeStyle = "#ddd";
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 1.0;
  for (let i = 0; i <= HTA_N; i++) {
    const [cx] = toCanvas(i, 0);
    const [, cy] = toCanvas(0, i);
    ctx.beginPath();
    ctx.moveTo(cx, pad);
    ctx.lineTo(cx, H - pad);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(pad, cy);
    ctx.lineTo(W - pad, cy);
    ctx.stroke();
  }

  // Draw red box for original 0-N region
  const [rx0, ry0] = toCanvas(0, HTA_N);
  const [rx1, ry1] = toCanvas(HTA_N, 0);
  ctx.globalAlpha = 1.0;
  ctx.fillStyle = "rgba(255,0,0,0.08)";
  ctx.fillRect(rx0, ry0, rx1 - rx0, ry1 - ry0);
  ctx.strokeStyle = "red";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(rx0, ry0, rx1 - rx0, ry1 - ry0);

  // Draw points
  for (const p of transformed) {
    const [cx, cy] = toCanvas(p.x, p.y);
    drawPoint(ctx, cx, cy, p.idx, p.origX);
  }
}

function initReflectionVisuals() {
  const W = 280,
    H = 280;
  const R = [0, 1, 1, 0];

  [0, 1, 2].forEach((n) => {
    const ctx = getCtx(`about-ref-${n}`);
    if (!ctx) return;
    clearCanvas(ctx, W, H);
    htaDrawGrid(ctx, W, H, false);

    const transformed = applyMatrixMod(aboutPoints, R, n);
    const cell = W / HTA_N;
    for (const p of transformed) {
      const cx = p.x * cell + cell / 2;
      const cy = (HTA_N - 1 - p.y) * cell + cell / 2;
      drawPoint(ctx, cx, cy, p.idx, p.origX, cell);
    }
  });
}

// ── Rotation visuals ─────────────────────────────────────────

function initRotationVisuals() {
  const W = 280,
    H = 280;
  const R = [0, -1, 1, 0];

  [0, 1, 2, 3, 4].forEach((n) => {
    const ctx = getCtx(`about-rot-${n}`);
    if (!ctx) return;
    clearCanvas(ctx, W, H);
    htaDrawGrid(ctx, W, H, false);

    const transformed = applyMatrixMod(aboutPoints, R, n);
    const cell = W / HTA_N;
    for (const p of transformed) {
      const cx = p.x * cell + cell / 2;
      const cy = (HTA_N - 1 - p.y) * cell + cell / 2;
      drawPoint(ctx, cx, cy, p.idx, p.origX, cell);
    }
  });
}

// ── Shear visuals ─────────────────────────────────────────────

function initShearVisuals() {
  const W = 280,
    H = 280;
  const S = [1, 2, 0, 1];

  [0, 1, 2, 3, 4, 5].forEach((n) => {
    const ctx = getCtx(`about-shear-${n}`);
    if (!ctx) return;
    clearCanvas(ctx, W, H);
    htaDrawGrid(ctx, W, H, false);

    const transformed = applyMatrixMod(aboutPoints, S, n);
    const cell = W / HTA_N;
    for (const p of transformed) {
      const cx = p.x * cell + cell / 2;
      const cy = (HTA_N - 1 - p.y) * cell + cell / 2;
      drawPoint(ctx, cx, cy, p.idx, p.origX, cell);
    }
  });
}

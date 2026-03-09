function initAboutDiagram() {
  const W = 280,
    H = 280;

  // Original 10×10 grid
  const points = [];
  for (let i = 0; i < HTA_N; i++) {
    for (let j = 0; j < HTA_N; j++) {
      points.push({ x: i, y: j, idx: i * HTA_N + j });
    }
  }

  // Flip across the diagonal — (x, y) becomes (y, x)
  const flipped = points.map((p) => ({
    x: p.y,
    y: p.x,
    idx: p.idx,
  }));

  // After mod N
  const after = points.map((p) => ({
    x: (((p.x + p.y) % HTA_N) + HTA_N) % HTA_N,
    y: (((p.x + 0 * p.y) % HTA_N) + HTA_N) % HTA_N,
    idx: p.idx,
  }));

  // Draw original
  const bCtx = document.getElementById("about-hta-before").getContext("2d");
  bCtx.clearRect(0, 0, W, H);
  bCtx.fillStyle = "white";
  bCtx.fillRect(0, 0, W, H);
  htaDrawGrid(bCtx, W, H, false);
  htaDrawPoints(bCtx, W, H, points, false);

  // Draw flip across diagonal
  const fCtx = document.getElementById("about-hta-flip").getContext("2d");
  fCtx.clearRect(0, 0, W, H);
  fCtx.fillStyle = "white";
  fCtx.fillRect(0, 0, W, H);
  htaDrawGrid(fCtx, W, H, false);
  htaDrawPoints(fCtx, W, H, flipped, false);

  // Draw linear map before mod
  const lCtx = document.getElementById("about-hta-linear").getContext("2d");
  lCtx.clearRect(0, 0, W, H);
  lCtx.fillStyle = "white";
  lCtx.fillRect(0, 0, W, H);
  htaDrawGrid(lCtx, W, H, true);
  htaDrawPoints(lCtx, W, H, points, true);

  // Draw after mod N
  const aCtx = document.getElementById("about-hta-after").getContext("2d");
  aCtx.clearRect(0, 0, W, H);
  aCtx.fillStyle = "white";
  aCtx.fillRect(0, 0, W, H);
  htaDrawGrid(aCtx, W, H, false);
  htaDrawPoints(aCtx, W, H, after, false);
}

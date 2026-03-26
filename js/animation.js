/**
 * animation.js
 * Controls the "Animation" page.
 * Supports forward/back stepping with cached history, play/stop,
 * variable speed, and automatic period detection.
 */

let animInited = false;
let animCanvas, animCtx;
let animN = 16;
let animOrigData = null;
let animCurrentData = null;
let animIterations = 0;
let animHistory = [];
let animPlaying = false;
let animTimer = null;
let animPeriod = null;
let animFilename = null;

/* ── Init (called lazily on first tab visit) ── */

function initAnim() {
  animInited = true;
  animCanvas = document.getElementById("anim-canvas");
  animCtx = animCanvas.getContext("2d");
  animN = 16;

  animLoadDefault();
}

function animLoadDefault() {
  animCanvas.width = animN;
  animCanvas.height = animN;

  makeDefaultImage(animN).then((d) => {
    animOrigData = d;
    animCurrentData = new ImageData(
      new Uint8ClampedArray(d.data),
      animN,
      animN,
    );
    animIterations = 0;
    animHistory = [new ImageData(new Uint8ClampedArray(d.data), animN, animN)];

    animCtx.putImageData(d, 0, 0);
    animDetectPeriod();
    animUpdateUI();
    updateSpeedProgress();
  });
}

/* ── Event handlers ── */

function animOnSizeChange() {
  const input = document.getElementById("anim-size");
  const error = document.getElementById("anim-size-error");
  const val = parseInt(input.value) || 16;

  if (val > 500) {
    input.value = 500;
    error.style.display = "block";
  } else if (val < 2) {
    input.value = 2;
    error.style.display = "none";
  } else {
    error.style.display = "none";
  }

  animN = Math.min(500, Math.max(2, parseInt(input.value)));
  animStop();
  animLoadDefault();
  resetUploadBox("anim", "PNG / JPG / GIF");
}

function animOnUpload(input) {
  const file = input.files[0];
  if (!file) return;

  // Always stop and reset state before loading new image
  animStop();
  animIterations = 0;
  animHistory = [];
  animCurrentData = null;

  if (typeof umami !== "undefined") {
    umami.track("Upload Image", { page: "animation" });
  }

  animN = Math.min(
    500,
    Math.max(2, parseInt(document.getElementById("anim-size").value) || 16),
  );

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      animCanvas.width = animN;
      animCanvas.height = animN;

      const c = document.createElement("canvas");
      c.width = animN;
      c.height = animN;
      const ctx = c.getContext("2d");
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, animN, animN);
      ctx.drawImage(img, 0, 0, animN, animN);

      animOrigData = ctx.getImageData(0, 0, animN, animN);
      animCurrentData = new ImageData(
        new Uint8ClampedArray(animOrigData.data),
        animN,
        animN,
      );
      animIterations = 0;
      animHistory = [
        new ImageData(new Uint8ClampedArray(animOrigData.data), animN, animN),
      ];

      animCtx.putImageData(animOrigData, 0, 0);
      animDetectPeriod();
      animFilename = file.name;
      animUpdateUI();
      markUploaded("anim", file.name);

      input.value = "";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ── Period detection ── */

function animDetectPeriod() {
  if (!animOrigData || animN > 500) return;
  const { a11, a12, a21, a22 } = animGetMatrix();

  animPeriod = null;
  const orig = animOrigData.data;
  let cur = new ImageData(new Uint8ClampedArray(orig), animN, animN);
  const limit = 1700;

  for (let i = 1; i <= limit; i++) {
    cur = applyArnoldTransform(cur, a11, a12, a21, a22);
    if (dataEqual(cur.data, orig)) {
      animPeriod = i;
      break;
    }
  }

  const info = document.getElementById("anim-period-info");
  const val = document.getElementById("anim-period-val");
  const lbl = document.getElementById("anim-period-lbl");

  if (animPeriod) {
    if (info) info.style.display = "flex";
    if (val) val.textContent = animPeriod;
    if (lbl) lbl.textContent = "period = " + animPeriod;
  } else {
    if (info) info.style.display = "none";
    if (lbl) lbl.textContent = "period > limit";
  }
}

/* ── Stepping (matches original stepForward / stepBack logic) ── */

function animStep(dir) {
  if (!animOrigData) return;
  const { a11, a12, a21, a22 } = animGetMatrix();

  if (dir === 1) {
    if (animHistory.length > animIterations + 1) {
      animIterations++;
      animCurrentData = new ImageData(
        new Uint8ClampedArray(animHistory[animIterations].data),
        animN,
        animN,
      );
    } else {
      const next = applyArnoldTransform(animCurrentData, a11, a12, a21, a22);
      animIterations++;
      animHistory = animHistory.slice(0, animIterations);
      animHistory.push(
        new ImageData(new Uint8ClampedArray(next.data), animN, animN),
      );
      animCurrentData = next;
    }
    animCtx.putImageData(animCurrentData, 0, 0);

    // Reset back to original once the period is reached
    if (animPeriod && animIterations >= animPeriod) {
      animStop();
      animCurrentData = new ImageData(
        new Uint8ClampedArray(animOrigData.data),
        animN,
        animN,
      );
      animCtx.putImageData(animCurrentData, 0, 0);
      animIterations = 0;
      animHistory = [
        new ImageData(new Uint8ClampedArray(animOrigData.data), animN, animN),
      ];
    }
  } else {
    if (animIterations > 0) {
      animIterations--;
      animCurrentData = new ImageData(
        new Uint8ClampedArray(animHistory[animIterations].data),
        animN,
        animN,
      );
      animCtx.putImageData(animCurrentData, 0, 0);
    }
  }

  animUpdateUI();
}

/* ── Playback ── */

function animToggle() {
  if (animPlaying) animStop();
  else animPlay();
}

let currentTimestep = 300;

function animPlay() {
  if (!animOrigData) return;
  animPlaying = true;
  document.getElementById("anim-play-btn").textContent = "⏹ Stop";
  animTimer = setInterval(() => animStep(1), currentTimestep);
}

function animStop() {
  animPlaying = false;
  clearInterval(animTimer);
  const btn = document.getElementById("anim-play-btn");
  if (btn) btn.textContent = "▶ Animate";
}

function changeTimestep(delta) {
  currentTimestep = Math.min(1000, Math.max(50, currentTimestep + delta));
  updateSpeedProgress();
  if (animPlaying) {
    animStop();
    animPlay();
  }
}

function updateSpeedProgress() {
  const fill = document.getElementById("speed-progress");
  if (!fill) return;
  const pct = ((1000 - currentTimestep) / (1000 - 50)) * 100;
  fill.style.width = pct + "%";
  fill.classList.toggle("at-limit", currentTimestep === 50);
}

function animUpdateUI() {
  const n = document.getElementById("anim-n");
  const nLbl = document.getElementById("anim-n-lbl");
  const desc = document.getElementById("anim-canvas-desc");
  const progress = document.getElementById("anim-progress");

  if (n) n.textContent = animIterations;
  if (nLbl) nLbl.textContent = animIterations;
  if (desc)
    desc.textContent =
      "Iteration " + animIterations + (animPeriod ? " of " + animPeriod : "");
  if (animPeriod && progress) {
    progress.style.width =
      ((animIterations % animPeriod) / animPeriod) * 100 + "%";
  }
}

function animSaveFrame() {
  if (!confirm("Save this frame as a PNG image?")) return;

  if (typeof umami !== "undefined") {
    umami.track("Save Frame", { iteration: animIterations, size: animN });
  }
  const name = animFilename
    ? animFilename.replace(/\.[^.]+$/, "")
    : "arnold-cat-map";
  const link = document.createElement("a");
  link.download = `${name}-n-${animN}.png`;
  link.href = animCanvas.toDataURL("image/png");
  link.click();
  const btn = document.querySelector(".canvas-download");
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    btn.classList.add("saved");
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-download"></i>';
      btn.classList.remove("saved");
    }, 2000);
  }
}

function animOnMatrixChange() {
  animStop();
  const { a11, a12, a21, a22 } = animGetMatrix();
  updateMatrixWarning("anim", a11, a12, a21, a22);
  if (!animOrigData) return;

  animCurrentData = new ImageData(
    new Uint8ClampedArray(animOrigData.data),
    animN,
    animN,
  );
  animCtx.putImageData(animCurrentData, 0, 0);
  animIterations = 0;
  animHistory = [
    new ImageData(new Uint8ClampedArray(animOrigData.data), animN, animN),
  ];

  if (a11 != null && a12 != null && a21 != null && a22 != null) {
    animDetectPeriod();
    animUpdateUI();
  }
}

function animReset() {
  animStop();

  // Reset matrix inputs to defaults
  const defaults = { aa11: 1, aa12: 1, aa21: 1, aa22: 0 };
  for (const [id, val] of Object.entries(defaults)) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }
  updateMatrixWarning("anim", 1, 1, 1, 0);

  // Reset size input
  animN = 16;
  const sizeInput = document.getElementById("anim-size");
  if (sizeInput) sizeInput.value = "16";

  // Reset upload box label
  resetUploadBox("anim", "PNG / JPG / GIF");
  animFilename = null;

  // Reload the default image at the default size
  animCanvas.width = animN;
  animCanvas.height = animN;
  makeDefaultImage(animN).then((d) => {
    animOrigData = d;
    animCurrentData = new ImageData(
      new Uint8ClampedArray(d.data),
      animN,
      animN,
    );
    animIterations = 0;
    animHistory = [new ImageData(new Uint8ClampedArray(d.data), animN, animN)];
    animCtx.putImageData(d, 0, 0);
    animDetectPeriod();
    animUpdateUI();
  });
}

function togglePanel(header) {
  const isNowCollapsed = header.classList.toggle("collapsed");
  header.setAttribute("aria-expanded", String(!isNowCollapsed));
  const body = header.nextElementSibling;
  body.classList.toggle("collapsed", isNowCollapsed);
}

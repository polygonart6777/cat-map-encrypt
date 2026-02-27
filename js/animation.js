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
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ── Matrix helper ── */

function animGetMatrix() {
  return {
    a11: parseInt(document.getElementById("aa11").value) || 1,
    a12: parseInt(document.getElementById("aa12").value) || 1,
    a21: parseInt(document.getElementById("aa21").value) || 1,
    a22: parseInt(document.getElementById("aa22").value) || 0,
  };
}

/* ── Period detection ── */

function animDetectPeriod() {
  if (!animOrigData) return;

  const { a11, a12, a21, a22 } = animGetMatrix();
  let cur = new ImageData(
    new Uint8ClampedArray(animOrigData.data),
    animN,
    animN,
  );
  const orig = animOrigData.data;

  animPeriod = null;

  // Limit search to avoid freezing on large images
  const limit = animN <= 500 ? 1500 : 300;
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
    info.style.display = "flex";
    val.textContent = animPeriod;
    lbl.textContent = "period = " + animPeriod;
  } else {
    info.style.display = "none";
    lbl.textContent = "period = >limit";
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

function animReset() {
  animStop();
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
  document.getElementById("speed-lbl").textContent = currentTimestep + "ms";
  if (animPlaying) {
    animStop();
    animPlay();
  }
}

/* ── UI sync ── */

function animUpdateUI() {
  document.getElementById("anim-n").textContent = animIterations;
  document.getElementById("anim-canvas-desc").textContent =
    "Iteration " + animIterations + (animPeriod ? " of " + animPeriod : "");
  if (animPeriod) {
    document.getElementById("anim-progress").style.width =
      ((animIterations % animPeriod) / animPeriod) * 100 + "%";
  }
}

function animSaveFrame() {
  const link = document.createElement("a");
  const filename = animFilename
    ? animFilename.replace(/\.[^/.]+$/, "")
    : "arnold-cat-map";
  link.download = `${filename}-iteration-${animIterations}.png`;
  link.href = animCanvas.toDataURL("image/png");
  link.click();
}

function animOnMatrixChange() {
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
  animDetectPeriod();
  animUpdateUI();
}

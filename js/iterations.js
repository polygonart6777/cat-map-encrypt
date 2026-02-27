/**
 * iterations.js
 * Controls the "All Iterations" page.
 * Generates a grid of every iteration up to a chosen count,
 * detects the period, and stagger-renders cards.
 */

let iterN        = 16;
let iterOrigData = null;

// Load default image on startup
makeDefaultImage(iterN).then(data => { iterOrigData = data; });

/* ── Event handlers wired up via HTML onchange/onclick ── */

function iterOnSizeChange() {
  iterN = parseInt(document.getElementById('iter-size').value);
  makeDefaultImage(iterN).then(data => { iterOrigData = data; });
  document.getElementById('iter-file').value = '';
}

function iterOnUpload(input) {
   const file = input.files[0];
  if (!file) return;
  iterN = Math.min(500, Math.max(2, parseInt(document.getElementById('iter-size').value) || 16));
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = iterN;
      c.height = iterN;
      const ctx = c.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, iterN, iterN);
      ctx.drawImage(img, 0, 0, iterN, iterN);
      iterOrigData = ctx.getImageData(0, 0, iterN, iterN);
      markUploaded('iter', file.name);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function generateAllIterations() {
  if (!iterOrigData) iterOrigData = makeDefaultImage(iterN);

  const a11   = parseInt(document.getElementById('ia11').value) || 1;
  const a12   = parseInt(document.getElementById('ia12').value) || 1;
  const a21   = parseInt(document.getElementById('ia21').value) || 1;
  const a22   = parseInt(document.getElementById('ia22').value) || 0;
  const count = parseInt(document.getElementById('iter-slider').value);

  document.getElementById('iterationsGrid').innerHTML = '';
  document.getElementById('iter-period-row').style.display = 'none';

  const origArr   = new Uint8ClampedArray(iterOrigData.data);
  let cur         = new ImageData(new Uint8ClampedArray(origArr), iterN, iterN);
  let periodFound = false;
  let periodN     = null;

  // Pre-compute all frames synchronously
  const frames = [new ImageData(new Uint8ClampedArray(cur.data), iterN, iterN)];

  for (let i = 1; i <= count; i++) {
    cur = applyArnoldTransform(cur, a11, a12, a21, a22);
    frames.push(new ImageData(new Uint8ClampedArray(cur.data), iterN, iterN));

    if (!periodFound && dataEqual(cur.data, origArr)) {
      periodFound = true;
      periodN = i;
    }
  }

  if (periodFound) {
    document.getElementById('iter-period-row').style.display = 'block';
    document.getElementById('iter-period-n').textContent = periodN;
  }

  // Stagger card render for a satisfying reveal effect
  const grid = document.getElementById('iterationsGrid');
  frames.forEach((frame, i) => {
    setTimeout(() => {
      const div = document.createElement('div');
      div.className = 'iteration-item' + (periodN && i === periodN ? ' is-period' : '');

      const canvas = document.createElement('canvas');
      canvas.width  = iterN;
      canvas.height = iterN;
      canvas.getContext('2d').putImageData(frame, 0, 0);

      const h4 = document.createElement('h4');
      if (i === 0)            h4.textContent = 'Original';
      else if (i === periodN) h4.textContent = `n = ${i}  ← period`;
      else                    h4.textContent = `n = ${i}`;

      div.appendChild(canvas);
      div.appendChild(h4);
      grid.appendChild(div);
    }, i * 80);
  });
}

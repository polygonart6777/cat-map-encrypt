/**
 * shared.js
 * Core Arnold Cat Map math and shared utilities used by all three pages.
 */

/**
 * Apply one step of the Arnold Cat Map to an ImageData.
 * newX = (a11*x + a12*y) % N
 * newY = (a21*x + a22*y) % N
 *
 * @param {ImageData} imageData
 * @param {number} a11
 * @param {number} a12
 * @param {number} a21
 * @param {number} a22
 * @returns {ImageData} transformed copy
 */
function applyArnoldTransform(imageData, a11, a12, a21, a22) {
  const N = imageData.width;
  const src = imageData.data;
  const dst = new Uint8ClampedArray(src.length);

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const nx = (a11 * x + a12 * y) % N;
      const ny = (a21 * x + a22 * y) % N;
      const si = (y * N + x) * 4;
      const di = (ny * N + nx) * 4;
      dst[di]     = src[si];
      dst[di + 1] = src[si + 1];
      dst[di + 2] = src[si + 2];
      dst[di + 3] = src[si + 3];
    }
  }

  return new ImageData(dst, N, N);
}

/**
 * Deep-equality check for two Uint8ClampedArray pixel buffers.
 *
 * @param {Uint8ClampedArray} a
 * @param {Uint8ClampedArray} b
 * @returns {boolean}
 */
function dataEqual(a, b) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Load assets/15by15.png and scale it into an N×N canvas,
 * returning a Promise<ImageData>.
 *
 * imageSmoothingEnabled is set to false so pixel art stays crisp
 * when N matches the source resolution, and nearest-neighbour
 * scaling is used when N differs.
 *
 * Falls back to a solid teal fill if the image cannot be loaded
 * (e.g. when opening index.html directly via file://).
 *
 * @param {number} N  — canvas width & height in pixels
 * @returns {Promise<ImageData>}
 */
function makeDefaultImage(N) {
  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      const c   = document.createElement('canvas');
      c.width   = N;
      c.height  = N;
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = false;  // keep pixel art crisp
      ctx.drawImage(img, 0, 0, N, N);
      resolve(ctx.getImageData(0, 0, N, N));
    };

    img.onerror = () => {
      console.warn('Could not load assets/15by15.png — using teal fallback.');
      const c   = document.createElement('canvas');
      c.width   = N;
      c.height  = N;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#3bbfbf';
      ctx.fillRect(0, 0, N, N);
      resolve(ctx.getImageData(0, 0, N, N));
    };

    img.src = 'assets/16by16cat.png';
  });
}

function markUploaded(prefix, filename) {
  const box  = document.getElementById(prefix + '-upload-box');
  const icon = document.getElementById(prefix + '-upload-icon');
  const lbl  = document.getElementById(prefix + '-upload-lbl');
  const sub  = document.getElementById(prefix + '-upload-sub');
  box.classList.add('uploaded');
  icon.textContent = '✓';
  lbl.textContent  = filename.length > 14 ? filename.slice(0, 12) + '…' : filename;
  sub.textContent  = 'Image loaded';
}

function resetUploadBox(prefix, subText) {
  const box  = document.getElementById(prefix + '-upload-box');
  const icon = document.getElementById(prefix + '-upload-icon');
  const lbl  = document.getElementById(prefix + '-upload-lbl');
  const sub  = document.getElementById(prefix + '-upload-sub');

  box.classList.remove('uploaded');
  icon.textContent = '📂';
  lbl.textContent  = 'Upload image';
  sub.textContent  = subText;
}

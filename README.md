# Arnold Cat Map

An interactive web explorer for the Arnold Cat Map — a chaotic, area-preserving
map on the torus that scrambles any image yet is periodic: every image eventually
returns to its exact original state.

## What is the Arnold Cat Map?

Given an N×N image, each pixel at position (x, y) moves to:

```
x' = (a₁₁·x + a₁₂·y) mod N
y' = (a₂₁·x + a₂₂·y) mod N
```

The default matrix `A = [[1,1],[1,0]]` has determinant 1 (area-preserving)
and eigenvalues that straddle 1 — stretching in one eigenvector direction and
compressing in the other. The modulo wraps everything back onto the unit square,
creating the characteristic chaotic scrambling.

## Pages

| Page | Description |
|------|-------------|
| **All Iterations** | Generates every iteration up to a chosen count, laid out as a grid of cards. Automatically detects and highlights the period. |
| **Animation** | Step forward/back through iterations with cached history, or animate continuously. A progress bar tracks how far through the period you are. |
| **Step-by-Step** | Shows the 10×10 coloured grid being transformed in three stages: current state → linear map (before mod) → after mod N. |

## Features

- Upload **your own image** on any page
- Adjustable **matrix A** entries and **image size** (14×14 up to 500×500)
- **Period detection** — finds when the image returns to its original state
- Procedural **default cat image** matching the pixel-cat colour palette

## Project Structure

```
arnold-cat-map/
├── index.html          # Markup for all three pages (no inline JS or CSS)
├── css/
│   └── styles.css      # All styles, design tokens, and layout
├── js/
│   ├── shared.js       # Arnold transform math + default image generator
│   ├── nav.js          # Tab switching with lazy page initialisation
│   ├── iterations.js   # "All Iterations" page logic
│   ├── animation.js    # "Animation" page logic
│   └── hta.js          # "Step-by-Step" page logic
└── assets/             # Place your own cat images here (optional)
```

## Running Locally

This is a plain HTML/CSS/JS project with no build step or dependencies.

```bash
# Clone and open directly — or use any static server, e.g.:
npx serve .

# Or with Python:
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

> **Note:** The file upload feature requires a server (even `localhost`) due to
> browser security restrictions on `file://` URLs. Opening `index.html` directly
> will work for everything except loading a custom image.

## Colour Palette

The site uses colours sampled from the pixel cat image:

| Token | Hex | Role |
|-------|-----|------|
| `--accent`  | `#c05a38` | Terracotta — cat's fur |
| `--accent2` | `#3bbfbf` | Teal — cat's background |
| `--accent3` | `#e8906a` | Warm orange — cat's face |
| `--bg`      | `#e8f9f9` | Page background |
| `--text`    | `#2a1f14` | Deep warm brown |

/**
 * nav.js
 * Handles tab switching between the three pages.
 * Lazily initialises animation and HTA pages on first visit.
 */

function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  btn.classList.add('active');
  if (id === 'hta' && !htaInited) initHTA();

  // Close the mobile menu after a tab is selected
  closeNav();
}

function toggleNav() {
  const links     = document.getElementById('nav-links');
  const hamburger = document.getElementById('nav-hamburger');
  const isOpen    = links.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
}

function closeNav() {
  const links     = document.getElementById('nav-links');
  const hamburger = document.getElementById('nav-hamburger');
  links.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
}

function initQrCode() {
  const url = window.location.href.replace(/\/$/, "");
  document.getElementById("qr-url-text").textContent = url;
}

function copyQrUrl() {
  const url = document.getElementById("qr-url-text").textContent;
  navigator.clipboard.writeText(url).then(() => {
    const btn = document.getElementById("qr-copy-btn");
    btn.innerHTML = '<i class="fa-solid fa-check"></i>';
    btn.classList.add("copied");
    setTimeout(() => {
      btn.innerHTML = '<i class="fa-solid fa-copy"></i>';
      btn.classList.remove("copied");
    }, 2000);
  });
}

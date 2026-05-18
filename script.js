const header = document.querySelector(".site-header");
const yearTarget = document.querySelector("[data-year]");
const copyButton = document.querySelector("[data-copy-url]");
const copyStatus = document.querySelector(".copy-status");

if (yearTarget) {
  yearTarget.textContent = new Date().getFullYear();
}

const syncHeaderElevation = () => {
  if (!header) return;
  header.dataset.elevated = String(window.scrollY > 8);
};

syncHeaderElevation();
window.addEventListener("scroll", syncHeaderElevation, { passive: true });

copyButton?.addEventListener("click", async () => {
  const pageUrl = "https://bugonia.github.io/mypage/";

  try {
    await navigator.clipboard.writeText(pageUrl);
    if (copyStatus) {
      copyStatus.textContent = "已复制：https://bugonia.github.io/mypage/";
    }
  } catch {
    if (copyStatus) {
      copyStatus.textContent = "主页链接：https://bugonia.github.io/mypage/";
    }
  }
});

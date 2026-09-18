document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const navList = document.querySelector(".nav-list");

  if (toggle && navList) {
    toggle.addEventListener("click", () => {
      const isOpen = navList.classList.toggle("open");
      toggle.setAttribute("aria-expanded", isOpen);
    });

    navList.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        navList.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const form = document.getElementById("contact-form");
  const note = document.getElementById("form-note");

  if (form && note) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      note.textContent = "送信フォームはまだ接続されていません。実際の送信には別途フォーム送信サービス(例: Googleフォーム, フォームメーラー等)の設定が必要です。";
    });
  }
});

"use client";
// Alternador claro/escuro: grava a escolha em localStorage e aplica data-theme no <html>.
// O ícone troca por CSS (ver .theme-toggle em globals.css), sem estado em React.
export function ThemeToggle() {
  function toggle() {
    const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* sem armazenamento */ }
  }
  return (
    <button type="button" className="theme-toggle" onClick={toggle} aria-label="Alternar tema claro/escuro">
      <span className="icon-sun" aria-hidden="true">☀</span>
      <span className="icon-moon" aria-hidden="true">☾</span>
    </button>
  );
}

const sportNames = {
  football: "Футбол",
  volleyball: "Волейбол",
  basketball: "Баскетбол"
};

let currentFilter = "all";
let allMatches = [];

const matchesEl = document.getElementById("matches");
const countEl = document.getElementById("match-count");

function parseLocalDate(date, time = "00:00") {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(year, month - 1, day, hour || 0, minute || 0);
}

function formatDate(dateString) {
  const date = parseLocalDate(dateString);
  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: date.toLocaleDateString("bg-BG", { month: "short" }).replace(".", ""),
    weekday: date.toLocaleDateString("bg-BG", { weekday: "long" })
  };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function render() {
  const now = new Date();
  const visible = allMatches
    .filter(match => currentFilter === "all" || match.sport === currentFilter)
    .filter(match => parseLocalDate(match.date, match.time) >= now)
    .sort((a, b) => parseLocalDate(a.date, a.time) - parseLocalDate(b.date, b.time));

  countEl.textContent = `${visible.length} ${visible.length === 1 ? "мач" : "мача"}`;

  if (!visible.length) {
    matchesEl.innerHTML = `<div class="empty">
      <div class="empty-icon">⚽</div>
      <h3>Няма предстоящи мачове</h3>
      <p>Когато добавиш срещи в <code>matches.json</code>, те ще се появят тук.</p>
    </div>`;
    return;
  }

  matchesEl.innerHTML = visible.map(match => {
    const date = formatDate(match.date);
    return `<article class="match-card">
      <div class="date-box">
        <div class="date-day">${date.day}</div>
        <div class="date-month">${escapeHtml(date.month)} · ${escapeHtml(date.weekday)}</div>
      </div>
      <div class="match-info">
        <div class="sport-label">${sportNames[match.sport] || "Спорт"}</div>
        <div class="teams">${escapeHtml(match.home)} <span class="versus">—</span> ${escapeHtml(match.away)}</div>
        <div class="match-meta">${match.venue ? `<span>⌖ ${escapeHtml(match.venue)}</span>` : ""}</div>
      </div>
      <div class="time">${escapeHtml(match.time)} ч.</div>
    </article>`;
  }).join("");
}

async function loadMatches() {
  try {
    const response = await fetch(`matches.json?v=${Date.now()}`);
    if (!response.ok) throw new Error("Неуспешно зареждане на matches.json");
    allMatches = await response.json();
    if (!Array.isArray(allMatches)) throw new Error("matches.json трябва да съдържа списък");
    render();
  } catch (error) {
    matchesEl.innerHTML = `<div class="empty"><h3>Не успях да заредя програмата</h3><p>Провери дали файлът <code>matches.json</code> е качен и съдържа валиден JSON.</p></div>`;
    countEl.textContent = "Грешка";
    console.error(error);
  }
}

document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(item => item.classList.remove("active"));
    button.classList.add("active");
    currentFilter = button.dataset.filter;
    render();
  });
});

loadMatches();

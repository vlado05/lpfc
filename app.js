
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
  const months = [
    "ЯНУ", "ФЕВ", "МАР", "АПР",
    "МАЙ", "ЮНИ", "ЮЛИ", "АВГ",
    "СЕП", "ОКТ", "НОЕ", "ДЕК"
  ];

  return {
    day: String(date.getDate()).padStart(2, "0"),
    month: months[date.getMonth()],
    weekday: date.toLocaleDateString("bg-BG", { weekday: "long" })
  };
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[char]);
}

function googleCalendarUrl(match) {
  const start = parseLocalDate(match.date, match.time);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);

  function formatGoogleDate(date) {
    return date.getFullYear() +
      String(date.getMonth() + 1).padStart(2, "0") +
      String(date.getDate()).padStart(2, "0") + "T" +
      String(date.getHours()).padStart(2, "0") +
      String(date.getMinutes()).padStart(2, "0") + "00";
  }

  const title = `Локомотив Пловдив – ${match.away}`;
  const details = `Спорт: ${sportNames[match.sport] || "Спорт"}\nМач: ${match.home} – ${match.away}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${formatGoogleDate(start)}/${formatGoogleDate(end)}`,
    details,
    location: match.venue || ""
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
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
      <p>Ще бъдат публикувани, когато има официални данни.</p>
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
        <div class="sport-label">${escapeHtml(sportNames[match.sport] || "Спорт")}</div>
        <div class="teams">${escapeHtml(match.home)} <span class="versus">—</span> ${escapeHtml(match.away)}</div>
        <div class="match-meta">${match.venue ? `<span>⌖ ${escapeHtml(match.venue)}</span>` : ""}</div>
        <a class="calendar-button"
           href="${escapeHtml(googleCalendarUrl(match))}"
           target="_blank"
           rel="noopener noreferrer">
          + Добави в Google Календар
        </a>
      </div>
      <div class="time">${escapeHtml(match.time)} ч.</div>
    </article>`;
  }).join("");
}

async function loadMatches() {
  try {
    const files = [
      "football.json",
      "volleyball.json",
      "basketball.json"
    ];

    const results = await Promise.all(
      files.map(async file => {
        const response = await fetch(`${file}?v=${Date.now()}`);
        if (!response.ok) throw new Error(`Грешка при зареждане на ${file}`);

        const data = await response.json();
        if (!Array.isArray(data)) throw new Error(`${file} трябва да съдържа списък`);

        return data;
      })
    );

    allMatches = results.flat();
    render();

  } catch (error) {
    matchesEl.innerHTML = `<div class="empty">
      <h3>Не успях да заредя програмата</h3>
      <p>Провери трите JSON файла.</p>
    </div>`;
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

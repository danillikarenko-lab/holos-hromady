const SUPABASE_URL = "https://gdicbbcpvfbohqrjdzie.supabase.co";
const SUPABASE_KEY = "sb_publishable_WTPFcMtRFf6y0iraVajbsA_ugXDFS4Q";
const STORAGE_KEY = "holosHromadyResponsesV1";
const form = document.getElementById("surveyForm");
const message = document.getElementById("formMessage");
const nav = document.getElementById("nav");
const menuToggle = document.getElementById("menuToggle");
document.getElementById("year").textContent = new Date().getFullYear();

menuToggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.textContent = open ? "✕" : "☰";
});
nav.querySelectorAll("a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open");
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.textContent = "☰";
}));

function getResponses() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch (_) { return []; }
}
function saveResponses(items) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); return true; }
  catch (_) { return false; }
}
function checkedValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(el => el.value);
}
function getAnswerCount() {
  const names = ["strays", "food", "support"];
  let count = names.filter(name => form.querySelector(`input[name="${name}"]:checked`)).length;
  count += ["causes", "help"].filter(name => form.querySelectorAll(`input[name="${name}"]:checked`).length).length;
  count += document.getElementById("city").value.trim() ? 1 : 0;
  return count;
}
function updateProgress() {
  const count = getAnswerCount();
  document.getElementById("progressText").textContent = `Заповнено ${count} з 6 запитань`;
  document.getElementById("progressBar").style.width = `${count / 6 * 100}%`;
}
form.addEventListener("change", updateProgress);
form.addEventListener("input", updateProgress);


form.addEventListener("submit", async event => {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const response = {
    city: document.getElementById("city").value.trim(),
    strays: form.querySelector('input[name="strays"]:checked').value,
    food: form.querySelector('input[name="food"]:checked').value,
    causes: checkedValues("causes"),
    help: checkedValues("help"),
    support: form.querySelector('input[name="support"]:checked').value,
    submittedAt: new Date().toISOString()
  };

  const submitButton = form.querySelector('[type="submit"]');
  if (submitButton) submitButton.disabled = true;

  message.classList.add("visible");
  message.textContent = "Надсилаємо відповіді...";

  try {
    const result = await fetch(
      `${SUPABASE_URL}/rest/v1/survey_responses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({ answers: response })
      }
    );

    if (!result.ok) {
      throw new Error(`HTTP ${result.status}: ${await result.text()}`);
    }

    message.textContent =
      "Дякуємо! Ваші відповіді успішно надіслано.";
    renderResults();

    form.reset();
    updateProgress();

  } catch (error) {
    console.error("Supabase error:", error);
    message.textContent =
      "Не вдалося надіслати відповіді. Спробуйте ще раз.";
  } finally {
    if (submitButton) submitButton.disabled = false;
    message.scrollIntoView({
      behavior: "smooth",
      block: "center"
    });
  }
});
function percent(n, total) {
  return total > 0
    ? `${Math.round(n / total * 100)}%`
    : "—";
}

async function renderResults() {
  const totalEl = document.getElementById("totalResponses");
  const seriousEl = document.getElementById("seriousPercent");
  const foodEl = document.getElementById("foodPercent");
  const noteEl = document.getElementById("resultsNote");

  noteEl.textContent = "Завантаження статистики...";

  try {
    const result = await fetch(
      `${SUPABASE_URL.replace(/\/+$/, "")}/rest/v1/rpc/survey_public_stats`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": SUPABASE_KEY,
          "Authorization": `Bearer ${SUPABASE_KEY}`
        },
        body: "{}"
      }
    );

    if (!result.ok) {
      throw new Error(
        `HTTP ${result.status}: ${await result.text()}`
      );
    }

    const data = await result.json();

    const total = Number(data.total) || 0;
    const serious = Number(data.strays_serious) || 0;
    const food = Number(data.food_frequent) || 0;

    totalEl.textContent = total;
    seriousEl.textContent = percent(serious, total);
    foodEl.textContent = percent(food, total);

    noteEl.textContent = total > 0
      ? `Статистика на основі ${total} отриманих анкет.`
      : "Поки що відповідей немає. Будьте першими!";

  } catch (error) {
    console.error("Statistics error:", error);
    totalEl.textContent = "—";
    seriousEl.textContent = "—";
    foodEl.textContent = "—";
    noteEl.textContent =
      "Не вдалося завантажити статистику. Спробуйте оновити.";
  }
}

document.getElementById("showResults")
  .addEventListener("click", renderResults);

renderResults();
updateProgress();

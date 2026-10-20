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
function percent(n, total) { return total ? `${Math.round(n / total * 100)}%` : "—"; }
function renderResults() {
  const data = getResponses();
  document.getElementById("totalResponses").textContent = data.length;
  document.getElementById("seriousPercent").textContent = percent(data.filter(x => ["Серйозна", "Дуже серйозна"].includes(x.strays)).length, data.length);
  document.getElementById("foodPercent").textContent = percent(data.filter(x => x.food === "Часто").length, data.length);
  document.getElementById("resultsNote").textContent = data.length
    ? `Локально збережено ${data.length} ${data.length === 1 ? "відповідь" : data.length < 5 ? "відповіді" : "відповідей"}. Це лише дані цього браузера, а не загальна статистика громади.`
    : "Поки що відповідей немає. Будьте першими — пройдіть опитування вище.";
}
document.getElementById("showResults").addEventListener("click", renderResults);
document.getElementById("resetData").addEventListener("click", () => {
  if (confirm("Очистити всі демонстраційні відповіді, збережені в цьому браузері?")) {
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    renderResults();
  }
});
renderResults();
updateProgress();

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

form.addEventListener("submit", event => {
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
  const responses = getResponses();
  responses.push(response);
  if (!saveResponses(responses)) {
    message.textContent = "Не вдалося зберегти відповіді в цьому браузері. Перевірте налаштування сховища.";
    message.classList.add("visible");
    return;
  }
  message.textContent = "Дякуємо! Відповіді збережено локально в цьому браузері. Вони не були надіслані організаторам або на сервер.";
  message.classList.add("visible");
  form.reset();
  updateProgress();
  renderResults();
  message.scrollIntoView({behavior:"smooth", block:"center"});
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

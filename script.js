const $ = (id) => document.getElementById(id);

// Header navigation
const menuBtn = $("menuBtn"), nav = $("nav");
menuBtn.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.textContent = open ? "✕" : "☰";
});
document.querySelectorAll("nav a").forEach(a => a.addEventListener("click", () => {
  nav.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.textContent = "☰";
}));

// Date greeting
const now = new Date();
$("todayLabel").textContent = now.toLocaleDateString(undefined, {weekday:"short", month:"short", day:"numeric"});
$("year").textContent = now.getFullYear();

// Rotating gentle thoughts
const thoughts = [
  "You are allowed to take things one moment at a time.",
  "Small steps are still steps. They count.",
  "You don't need to earn a moment of rest.",
  "A difficult day does not define your whole story.",
  "Give yourself the patience you offer other people.",
  "You can start again without making a big announcement."
];
let thoughtIndex = 0;
$("newThought").addEventListener("click", () => {
  thoughtIndex = (thoughtIndex + 1) % thoughts.length;
  $("dailyThought").textContent = thoughts[thoughtIndex];
});

// Mood garden: keep a small local history, maximum 12 blooms
const moodMessages = {
  Sunny: "A sunny moment. Let yourself enjoy what feels good today. ☀️",
  Breezy: "A steady breeze. Notice what is helping you feel grounded. 🍃",
  Cloudy: "Cloudy days belong too. You don't have to force a brighter mood. ☁️",
  Rainy: "A rainy moment can call for gentleness. Consider taking a pause or reaching out to someone you trust. 🌧️",
  Stormy: "Big feelings can be a lot to hold. Take things one step at a time, and consider talking with someone you trust. ⛈️"
};
const moodEmoji = {Sunny:"☀️", Breezy:"🍃", Cloudy:"☁️", Rainy:"🌧️", Stormy:"⛈️"};
let moodHistory = [];
try { moodHistory = JSON.parse(localStorage.getItem("mindspace-mood-garden") || "[]"); } catch(e) {}
function drawGarden() {
  $("gardenFlowers").innerHTML = "";
  if (!moodHistory.length) {
    $("gardenFlowers").innerHTML = '<span class="empty-garden">✿</span>';
    $("gardenCount").textContent = "Your check-ins will grow here.";
    return;
  }
  moodHistory.forEach((item, i) => {
    const flower = document.createElement("span");
    flower.textContent = item.emoji;
    flower.title = `${item.mood} · ${item.date}`;
    flower.style.animationDelay = `${i * 35}ms`;
    $("gardenFlowers").appendChild(flower);
  });
  $("gardenCount").textContent = `${moodHistory.length} little ${moodHistory.length === 1 ? "check-in" : "check-ins"} planted.`;
}
drawGarden();
document.querySelectorAll(".mood").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".mood").forEach(b => b.classList.remove("selected"));
  button.classList.add("selected");
  const mood = button.dataset.mood;
  $("moodMessage").textContent = moodMessages[mood];
  moodHistory.push({mood, emoji:moodEmoji[mood], date:new Date().toLocaleDateString()});
  moodHistory = moodHistory.slice(-12);
  try { localStorage.setItem("mindspace-mood-garden", JSON.stringify(moodHistory)); } catch(e) {}
  drawGarden();
}));

// Journal prompts and local draft
const prompts = [
  "What is one thing you wish you gave yourself more credit for?",
  "What is something small you are looking forward to?",
  "When did you feel most like yourself recently?",
  "What would make tomorrow feel a little easier?",
  "What is one thing you can let be 'good enough' today?"
];
let promptIndex = 0;
$("nextPrompt").addEventListener("click", () => {
  promptIndex = (promptIndex + 1) % prompts.length;
  $("promptText").textContent = prompts[promptIndex];
});
const journalKey = "mindspace-thought-vault";
try { $("journalText").value = localStorage.getItem(journalKey) || ""; } catch(e) {}
function updateWordCount() {
  const text = $("journalText").value.trim();
  const count = text ? text.split(/\s+/).length : 0;
  $("wordCount").textContent = `${count} ${count === 1 ? "word" : "words"}`;
}
updateWordCount();
$("journalText").addEventListener("input", updateWordCount);
$("journalForm").addEventListener("submit", e => {
  e.preventDefault();
  try {
    localStorage.setItem(journalKey, $("journalText").value);
    $("journalStatus").textContent = "Reflection saved in this browser ✓";
  } catch(err) { $("journalStatus").textContent = "Browser storage is unavailable."; }
});
$("clearJournal").addEventListener("click", () => {
  $("journalText").value = "";
  try { localStorage.removeItem(journalKey); } catch(e) {}
  updateWordCount(); $("journalStatus").textContent = "Your local entry was cleared.";
});

// Reset room: breathing cycle or 2-minute quiet timer
let resetInterval = null, resetMode = null, secondsLeft = 0, phase = "in";
const orb = $("resetOrb");
function stopReset(message = "Choose a reset that feels comfortable.") {
  clearInterval(resetInterval); resetInterval = null; resetMode = null;
  orb.classList.remove("inhale", "exhale");
  $("orbText").innerHTML = "breathe<br>easy";
  $("orbCaption").textContent = "A small pause is still a pause.";
  $("resetStatus").textContent = message;
  $("breathStart").textContent = "Start breathing →";
  $("focusStart").disabled = false;
}
function runBreathingPhase() {
  orb.classList.remove("inhale", "exhale");
  if (phase === "in") {
    orb.classList.add("inhale"); $("orbText").textContent = "Breathe in"; $("orbCaption").textContent = "Gently breathe in · 4 seconds"; phase = "out";
  } else {
    orb.classList.add("exhale"); $("orbText").textContent = "Breathe out"; $("orbCaption").textContent = "Gently breathe out · 4 seconds"; phase = "in";
  }
}
$("breathStart").addEventListener("click", () => {
  if (resetMode === "breath") { stopReset(); return; }
  stopReset("Breathing pause is ready.");
  resetMode = "breath"; phase = "in"; runBreathingPhase();
  $("breathStart").textContent = "Stop breathing";
  $("resetStatus").textContent = "Follow the gentle rhythm only if it feels comfortable.";
  let count = 4;
  resetInterval = setInterval(() => { count--; if (count <= 0) { count = 4; runBreathingPhase(); } }, 1000);
});
$("focusStart").addEventListener("click", () => {
  if (resetMode === "focus") { stopReset("Pause ended."); return; }
  stopReset(); resetMode = "focus"; secondsLeft = 120;
  $("focusStart").textContent = "End pause";
  $("resetStatus").textContent = "A quiet two-minute pause is underway.";
  $("orbText").textContent = "2:00"; $("orbCaption").textContent = "Look away from the screen if you'd like.";
  resetInterval = setInterval(() => {
    secondsLeft--;
    const mins = Math.floor(secondsLeft / 60), secs = secondsLeft % 60;
    $("orbText").textContent = `${mins}:${String(secs).padStart(2,"0")}`;
    if (secondsLeft <= 0) { stopReset("Your two-minute pause is complete. Welcome back."); $("orbText").textContent = "Well<br>done"; $("focusStart").textContent = "Start a 2-minute pause"; }
  }, 1000);
  $("focusStart").textContent = "End pause";
});

// Little-win wall; user-added text is rendered safely as text, not HTML
let wins = [];
try { wins = JSON.parse(localStorage.getItem("mindspace-little-wins") || "[]"); } catch(e) {}
function drawWins() {
  const wall = $("winWall"); wall.innerHTML = "";
  if (!wins.length) {
    wall.innerHTML = '<div class="wall-empty"><span>✿</span><b>Your wall is waiting.</b><small>Add your first little win.</small></div>';
    return;
  }
  wins.forEach(text => {
    const note = document.createElement("div");
    note.className = "win-note";
    note.textContent = `✿  ${text}`;
    wall.appendChild(note);
  });
}
drawWins();
$("winForm").addEventListener("submit", e => {
  e.preventDefault();
  const input = $("winInput"), value = input.value.trim();
  if (!value) return;
  wins.unshift(value); wins = wins.slice(0, 8);
  try { localStorage.setItem("mindspace-little-wins", JSON.stringify(wins)); } catch(e) {}
  drawWins(); input.value = "";
});

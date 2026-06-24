const prayerNames = ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"];
const kaaba = { lat: 21.422487, lon: 39.826206 };
let selectedJuzNumber = 1;
let qiblaBearing = 0;
let deviceHeading = 0;

const juzInfo = [
  ["Al-Fatihah 1:1", "Al-Baqarah 2:141"],
  ["Al-Baqarah 2:142", "Al-Baqarah 2:252"],
  ["Al-Baqarah 2:253", "Ali Imran 3:92"],
  ["Ali Imran 3:93", "An-Nisa 4:23"],
  ["An-Nisa 4:24", "An-Nisa 4:147"],
  ["An-Nisa 4:148", "Al-Ma'idah 5:81"],
  ["Al-Ma'idah 5:82", "Al-An'am 6:110"],
  ["Al-An'am 6:111", "Al-A'raf 7:87"],
  ["Al-A'raf 7:88", "Al-Anfal 8:40"],
  ["Al-Anfal 8:41", "At-Tawbah 9:92"],
  ["At-Tawbah 9:93", "Hud 11:5"],
  ["Hud 11:6", "Yusuf 12:52"],
  ["Yusuf 12:53", "Ibrahim 14:52"],
  ["Al-Hijr 15:1", "An-Nahl 16:128"],
  ["Al-Isra 17:1", "Al-Kahf 18:74"],
  ["Al-Kahf 18:75", "Ta-Ha 20:135"],
  ["Al-Anbiya 21:1", "Al-Hajj 22:78"],
  ["Al-Mu'minun 23:1", "Al-Furqan 25:20"],
  ["Al-Furqan 25:21", "An-Naml 27:55"],
  ["An-Naml 27:56", "Al-Ankabut 29:45"],
  ["Al-Ankabut 29:46", "Al-Ahzab 33:30"],
  ["Al-Ahzab 33:31", "Ya-Sin 36:27"],
  ["Ya-Sin 36:28", "Az-Zumar 39:31"],
  ["Az-Zumar 39:32", "Fussilat 41:46"],
  ["Fussilat 41:47", "Al-Jathiyah 45:37"],
  ["Al-Ahqaf 46:1", "Adh-Dhariyat 51:30"],
  ["Adh-Dhariyat 51:31", "Al-Hadid 57:29"],
  ["Al-Mujadilah 58:1", "At-Tahrim 66:12"],
  ["Al-Mulk 67:1", "Al-Mursalat 77:50"],
  ["An-Naba 78:1", "An-Nas 114:6"]
];

const hadiths = [
  {
    text: "The best among you are those who learn the Quran and teach it.",
    source: "Sahih al-Bukhari"
  },
  {
    text: "Actions are judged only by intentions.",
    source: "Sahih al-Bukhari and Sahih Muslim"
  },
  {
    text: "A good word is charity.",
    source: "Sahih al-Bukhari and Sahih Muslim"
  },
  {
    text: "Make things easy and do not make things difficult.",
    source: "Sahih al-Bukhari"
  }
];

const duas = [
  {
    title: "Dua for Knowledge",
    arabic: "رَبِّ زِدْنِي عِلْمًا",
    meaning: "My Lord, increase me in knowledge."
  },
  {
    title: "Dua for Good in Both Worlds",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    meaning: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the Fire."
  },
  {
    title: "Dua for Forgiveness",
    arabic: "رَبِّ اغْفِرْ لِي وَارْحَمْنِي",
    meaning: "My Lord, forgive me and have mercy on me."
  },
  {
    title: "Dua Before Leaving Home",
    arabic: "بِسْمِ اللهِ تَوَكَّلْتُ عَلَى اللهِ",
    meaning: "In the name of Allah, I place my trust in Allah."
  }
];

function qs(selector) {
  return document.querySelector(selector);
}

function setText(selector, value) {
  qs(selector).textContent = value;
}

async function fetchJson(url, timeoutMs = 9000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const result = await response.json();
    return { response, result };
  } finally {
    window.clearTimeout(timer);
  }
}

function renderJuzButtons() {
  qs("#juzGrid").innerHTML = Array.from({ length: 30 }, (_, index) => {
    const number = index + 1;
    return `<button type="button" data-juz="${number}" class="${number === selectedJuzNumber ? "active" : ""}">Parah ${number}</button>`;
  }).join("");
  renderJuzSummary();
}

function renderJuzSummary() {
  const [from, to] = juzInfo[selectedJuzNumber - 1];
  setText("#selectedJuz", `Parah ${selectedJuzNumber}`);
  qs("#surahRange").innerHTML = `<span>Starts: ${from}</span><span>Ends: ${to}</span>`;
}

function renderPrayerTimes(timings) {
  qs("#prayerGrid").innerHTML = prayerNames.map((name) => {
    const time = String(timings[name] || "--").split(" ")[0];
    return `<article class="prayer-card" data-prayer="${name}"><span>${name}</span><strong>${time}</strong></article>`;
  }).join("");
  highlightNextPrayer(timings);
}

function highlightNextPrayer(timings) {
  const now = new Date();
  const today = now.toDateString();
  const future = prayerNames
    .filter((name) => name !== "Sunrise")
    .map((name) => {
      const [hours, minutes] = String(timings[name]).split(" ")[0].split(":").map(Number);
      return { name, date: new Date(`${today} ${hours}:${minutes}:00`) };
    })
    .filter((item) => item.date > now)
    .sort((a, b) => a.date - b.date)[0];

  const next = future || { name: "Fajr", date: null };
  setText("#nextPrayer", next.date ? `${next.name} at ${String(timings[next.name]).split(" ")[0]}` : "Fajr tomorrow");
  document.querySelectorAll(".prayer-card").forEach((card) => {
    card.classList.toggle("next", card.dataset.prayer === next.name);
  });
}

async function loadPrayerByCity(event) {
  if (event) event.preventDefault();
  const city = qs("#cityInput").value.trim();
  const country = qs("#countryInput").value.trim();
  const method = qs("#methodInput").value;
  if (!city || !country) return;

  setText("#prayerStatus", "Loading prayer times...");
  try {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=${method}`;
    const { response, result } = await fetchJson(url);
    if (!response.ok || !result.data) throw new Error("Prayer timing service is unavailable.");
    renderPrayerTimes(result.data.timings);
    setText("#hijriDate", `${result.data.date.hijri.day} ${result.data.date.hijri.month.en} ${result.data.date.hijri.year} AH`);
    setText("#gregorianDate", result.data.date.readable);
    setText("#prayerStatus", `Showing timings for ${city}, ${country}. Confirm with your local masjid.`);
  } catch (error) {
    setText("#prayerStatus", `${error.message} Showing sample Makkah timings.`);
    renderPrayerTimes({ Fajr: "04:15", Sunrise: "05:40", Dhuhr: "12:22", Asr: "15:41", Maghrib: "19:05", Isha: "20:35" });
  }
}

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Location is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve(position.coords),
      () => reject(new Error("Location permission was denied or unavailable.")),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
}

async function loadPrayerByLocation() {
  setText("#prayerStatus", "Requesting your location...");
  try {
    const coords = await getLocation();
    const method = qs("#methodInput").value;
    const url = `https://api.aladhan.com/v1/timings?latitude=${coords.latitude}&longitude=${coords.longitude}&method=${method}`;
    const { response, result } = await fetchJson(url);
    if (!response.ok || !result.data) throw new Error("Prayer timing service is unavailable.");
    renderPrayerTimes(result.data.timings);
    setText("#hijriDate", `${result.data.date.hijri.day} ${result.data.date.hijri.month.en} ${result.data.date.hijri.year} AH`);
    setText("#gregorianDate", result.data.date.readable);
    setText("#prayerStatus", "Showing timings for your current location. Confirm with your local masjid.");
  } catch (error) {
    setText("#prayerStatus", error.message);
  }
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function toDegrees(value) {
  return (value * 180) / Math.PI;
}

function calculateQiblaBearing(lat, lon) {
  const lat1 = toRadians(lat);
  const lat2 = toRadians(kaaba.lat);
  const diff = toRadians(kaaba.lon - lon);
  const x = Math.sin(diff);
  const y = Math.cos(lat1) * Math.tan(lat2) - Math.sin(lat1) * Math.cos(diff);
  return (toDegrees(Math.atan2(x, y)) + 360) % 360;
}

function updateNeedle() {
  qs("#qiblaNeedle").style.transform = `rotate(${qiblaBearing - deviceHeading}deg)`;
}

async function findQibla() {
  setText("#qiblaStatus", "Requesting location for Qibla...");
  try {
    const coords = await getLocation();
    qiblaBearing = calculateQiblaBearing(coords.latitude, coords.longitude);
    updateNeedle();
    setText("#bearingValue", `${Math.round(qiblaBearing)}°`);
    setText("#qiblaStatus", "Qibla direction calculated. Rotate your device for live compass support.");
  } catch (error) {
    setText("#qiblaStatus", error.message);
  }
}

async function enableCompass() {
  try {
    if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") throw new Error("Compass permission was not granted.");
    }
    window.addEventListener("deviceorientationabsolute", handleOrientation, true);
    window.addEventListener("deviceorientation", handleOrientation, true);
    setText("#qiblaStatus", "Compass enabled. Keep your phone flat and rotate slowly.");
  } catch (error) {
    setText("#qiblaStatus", error.message);
  }
}

function handleOrientation(event) {
  const heading = event.webkitCompassHeading || (event.alpha == null ? 0 : 360 - event.alpha);
  deviceHeading = heading;
  updateNeedle();
}

async function loadSelectedJuz() {
  setText("#quranStatus", `Loading Parah ${selectedJuzNumber}...`);
  qs("#ayahList").innerHTML = '<p class="empty-state">Fetching Arabic Quran text...</p>';
  try {
    const { response, result } = await fetchJson(`https://api.alquran.cloud/v1/juz/${selectedJuzNumber}/quran-uthmani`, 12000);
    if (!response.ok || !result.data?.ayahs) throw new Error("Quran text service is unavailable.");
    qs("#ayahList").innerHTML = result.data.ayahs.map((ayah) => `
      <article class="ayah">
        <p class="arabic">${ayah.text}</p>
        <small>Surah ${ayah.surah.englishName} - Ayah ${ayah.numberInSurah}</small>
      </article>
    `).join("");
    setText("#quranStatus", `Loaded ${result.data.ayahs.length} ayahs from Parah ${selectedJuzNumber}.`);
  } catch (error) {
    qs("#ayahList").innerHTML = '<p class="empty-state">Unable to load online Quran text right now. The Parah index above still shows the reading range.</p>';
    setText("#quranStatus", error.message);
  }
}

function showHadith() {
  const item = hadiths[Math.floor(Math.random() * hadiths.length)];
  setText("#hadithText", item.text);
  setText("#hadithSource", item.source);
}

function showDua() {
  const item = duas[Math.floor(Math.random() * duas.length)];
  setText("#duaTitle", item.title);
  setText("#duaArabic", item.arabic);
  setText("#duaMeaning", item.meaning);
}

function getTasbeehState() {
  return JSON.parse(localStorage.getItem("tasbeehState") || '{"count":0,"dhikr":"SubhanAllah"}');
}

function saveTasbeehState(state) {
  localStorage.setItem("tasbeehState", JSON.stringify(state));
  setText("#tasbeehCount", state.count);
  qs("#dhikrSelect").value = state.dhikr;
}

function changeCount(delta) {
  const state = getTasbeehState();
  state.count = Math.max(0, state.count + delta);
  state.dhikr = qs("#dhikrSelect").value;
  saveTasbeehState(state);
}

document.querySelector(".menu-toggle").addEventListener("click", () => {
  document.querySelector(".navbar").classList.toggle("menu-open");
});

qs("#locationForm").addEventListener("submit", loadPrayerByCity);
qs("#useLocation").addEventListener("click", loadPrayerByLocation);
qs("#findQibla").addEventListener("click", findQibla);
qs("#enableCompass").addEventListener("click", enableCompass);
qs("#loadJuz").addEventListener("click", loadSelectedJuz);
qs("#newHadith").addEventListener("click", showHadith);
qs("#newDua").addEventListener("click", showDua);
qs("#countButton").addEventListener("click", () => changeCount(1));
qs("#minusCount").addEventListener("click", () => changeCount(-1));
qs("#resetCount").addEventListener("click", () => saveTasbeehState({ count: 0, dhikr: qs("#dhikrSelect").value }));
qs("#targetCount").addEventListener("click", () => saveTasbeehState({ count: 33, dhikr: qs("#dhikrSelect").value }));
qs("#dhikrSelect").addEventListener("change", () => {
  const state = getTasbeehState();
  state.dhikr = qs("#dhikrSelect").value;
  saveTasbeehState(state);
});

qs("#juzGrid").addEventListener("click", (event) => {
  const button = event.target.closest("[data-juz]");
  if (!button) return;
  selectedJuzNumber = Number(button.dataset.juz);
  document.querySelectorAll("[data-juz]").forEach((item) => item.classList.remove("active"));
  button.classList.add("active");
  renderJuzSummary();
  qs("#ayahList").innerHTML = '<p class="empty-state">Parah selected. Press "Load Arabic Text" to read online.</p>';
});

renderJuzButtons();
showHadith();
showDua();
saveTasbeehState(getTasbeehState());
loadPrayerByCity();

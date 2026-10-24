/* FNCS Career — dashboard (tabs + training minigame). Visual demo, localStorage. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var g = function (k) { return localStorage.getItem(k) || ""; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); };
  function numk(k, d) { var v = parseInt(localStorage.getItem(k), 10); return isNaN(v) ? d : v; }
  var MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var DOW = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
  var STAT_KEYS = ["Стрельба", "Стройка", "Ротации", "Клатч", "Гейм-IQ", "Стабильность"];
  var SHORT = ["СТР", "СТРОЙ", "РОТ", "КЛЧ", "IQ", "СТБ"];

  if (!g("fnc_nick")) { location.href = "career.html"; return; }
  var P = {
    nick: g("fnc_nick"), age: numk("fnc_age", 18), avatar: g("fnc_avatar"),
    flag: (g("fnc_country_flag") || g("fnc_country").replace(/^ru-.*/, "ru")) || "eu",
    countryName: g("fnc_country_name") || "—", ping: g("fnc_ping") || "—",
    pos: g("fnc_pos") || "—", role: g("fnc_role") || "",
    stats: (function () { try { var p = JSON.parse(g("fnc_stats")); if (p && p.vals && p.vals.length === 6) return p.vals.map(Number); } catch (e) {} return [55, 55, 55, 55, 55, 55]; })(),
    energy: numk("fnc_energy", 100), mood: numk("fnc_mood", 62)
  };
  var flagUrl = function (iso) { return "https://flagcdn.com/w320/" + iso + ".png"; };
  function ageBonus(a) { a = +a || 20; return a <= 16 ? 6 : a <= 18 ? 4 : a <= 21 ? 2 : a <= 25 ? 0 : a <= 30 ? -2 : -4; }
  function baseOvr() { return Math.round(P.stats.reduce(function (a, b) { return a + b; }, 0) / 6); }
  function overallOf() { return Math.max(30, Math.min(99, baseOvr() + ageBonus(P.age))); }
  function rarityOf(o) { return o >= 84 ? { n: "Легендарный", c: "#ffcf3a" } : o >= 74 ? { n: "Эпический", c: "#b06bff" } : o >= 64 ? { n: "Редкий", c: "#46b6ff" } : o >= 55 ? { n: "Необычный", c: "#3fe07a" } : { n: "Обычный", c: "#9aa6bf" }; }
  function divOf(o) { return o >= 85 ? 1 : o >= 78 ? 2 : o >= 70 ? 3 : o >= 63 ? 4 : o >= 56 ? 5 : o >= 48 ? 6 : 7; }
  function save() {
    var o = overallOf();
    localStorage.setItem("fnc_stats", JSON.stringify({ keys: STAT_KEYS, vals: P.stats }));
    localStorage.setItem("fnc_overall", o); localStorage.setItem("fnc_base", baseOvr());
    localStorage.setItem("fnc_bonus", ageBonus(P.age)); localStorage.setItem("fnc_rarity", rarityOf(o).n);
    localStorage.setItem("fnc_rarity_color", rarityOf(o).c); localStorage.setItem("fnc_division", divOf(o));
    localStorage.setItem("fnc_energy", P.energy); localStorage.setItem("fnc_mood", P.mood);
  }

  var today = new Date();
  function fmtD(d) { return DOW[(d.getDay() + 6) % 7] + ", " + d.getDate() + " " + MON[d.getMonth()]; }
  function weekDays() { var dow = (today.getDay() + 6) % 7, mon = new Date(today); mon.setDate(today.getDate() - dow); var a = []; for (var i = 0; i < 7; i++) { var d = new Date(mon); d.setDate(mon.getDate() + i); a.push(d); } return a; }
  var EV_IDX = 3; // Thursday = tournament (demo)
  function evInfo() { var w = weekDays(), d = w[EV_IDX]; return { date: fmtD(d), isToday: d.toDateString() === today.toDateString() }; }

  function avHtml(big) { return P.avatar ? '<img src="' + P.avatar + '" alt="">' : '<span class="noav">нет' + (big ? "<br>" : " ") + 'фото</span>'; }
  function cardHtml(mini) {
    var o = overallOf(), r = rarityOf(o), b = baseOvr(), bo = ageBonus(P.age);
    var rows = STAT_KEYS.map(function (k, i) { return '<div class="pc-row"><span class="s-k">' + k + '</span><span class="s-v">' + P.stats[i] + '</span><span class="s-bar"><i style="width:' + P.stats[i] + '%"></i></span></div>'; }).join("");
    return '<div class="pcard' + (mini ? " mini" : "") + '" style="--rar:' + r.c + '">' +
      '<div class="pcard-top"><div><div class="pc-ovr">' + o + '</div><div class="pc-base">' + b + ' <span>' + (bo >= 0 ? "+" : "") + bo + '</span></div>' +
      '<div><span class="pc-pos">' + P.pos + '</span></div>' + (mini ? "" : '<div class="pc-region"><img class="flag" src="' + flagUrl(P.flag) + '" alt=""> ' + esc(P.countryName) + '</div>') + '</div>' +
      '<div class="pcard-av">' + avHtml(true) + '</div></div>' +
      '<div class="pcard-nick">' + esc(P.nick) + '</div><div class="pcard-rarity">' + r.n + '</div>' +
      '<div class="pcard-stats">' + rows + '</div>' +
      '<div class="pcard-div">FNCS · <b>Дивизион ' + divOf(o) + '</b></div></div>';
  }
  var RC = 2 * Math.PI * 36;
  function ring(val, color, label) {
    return '<div class="ring"><div class="rc"><svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="36" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="8"/>' +
      '<circle cx="42" cy="42" r="36" fill="none" stroke="' + color + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + (RC * val / 100).toFixed(1) + ' ' + RC.toFixed(1) + '"/></svg>' +
      '<span class="rv">' + val + '</span></div><div class="rk">' + label + '</div></div>';
  }
  function trainGrid() { return P.stats.map(function (v, i) { return '<div class="train-cell"><div class="tk">' + SHORT[i] + '</div><div class="tv">' + v + '</div></div>'; }).join(""); }

  /* ---------- player bar ---------- */
  function buildBar() {
    var o = overallOf();
    $("#playerBar").innerHTML =
      '<div class="player-bar"><div class="pb-id"><img class="pb-av" src="' + (P.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='62' height='62'%3E%3Crect width='62' height='62' fill='%232657b0'/%3E%3C/svg%3E") + '" alt="">' +
      '<div class="pb-name"><h2>' + esc(P.nick) + '</h2><div class="pb-meta">' + P.age + ' лет · Дивизион ' + divOf(o) + ' · ' + P.pos + ' <img class="flag" src="' + flagUrl(P.flag) + '" alt=""></div></div></div>' +
      '<div class="pb-mid"><span class="pb-rating"><b>' + o + '</b><span>Рейтинг</span></span>' +
      '<div class="pb-energy"><div class="k">Энергия</div><div class="bar"><i style="width:' + P.energy + '%"></i></div></div>' +
      '<div class="pb-bal"><div class="k">Баланс</div><b>$0</b></div></div>' +
      '<div class="pb-season"><div class="c"><b>1</b><span>Сезон</span></div><div class="c"><b>' + today.getDate() + " " + MON[today.getMonth()] + '</b><span>Неделя</span></div><div class="c"><b>' + P.ping + '</b><span>Пинг</span></div></div></div>';
  }

  /* ---------- tabs ---------- */
  var cur = "center";
  var TABS = {
    center: renderCenter, profile: renderProfile, career: renderCareer, training: renderTraining,
    calendar: renderCalendar, tables: renderTables, shop: renderShop, history: renderHistory
  };
  function setTab(name) {
    cur = name;
    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === name); });
    $("#tabContent").innerHTML = TABS[name]();
    wire(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("#subnav").addEventListener("click", function (e) { var b = e.target.closest(".tab-btn"); if (b) setTab(b.getAttribute("data-tab")); });

  function wire(name) {
    if (name === "center") {
      var ab = $("#actionBtn"); if (ab) ab.addEventListener("click", function () { var ev = evInfo(); if (ev.isToday) return; openTrain(DRILLS[2]); });
    }
    if (name === "training") {
      Array.prototype.forEach.call(document.querySelectorAll("[data-drill]"), function (el) {
        el.addEventListener("click", function () { openTrain(DRILLS.filter(function (d) { return d.id === el.getAttribute("data-drill"); })[0]); });
      });
    }
  }

  /* ---------- tab: Центр ---------- */
  function renderCenter() {
    var ev = evInfo(), w = weekDays();
    var week = w.map(function (d, i) {
      var now = d.toDateString() === today.toDateString(), isEv = i === EV_IDX;
      var lbl = isEv ? "Виктори Кап" : (now ? "Сегодня · свободно" : "Свободный день");
      return '<div class="day-cell' + (now ? " now" : "") + (isEv ? " ev" : "") + '"><div class="dow">' + DOW[i] + '</div><div class="dnum">' + d.getDate() + '</div><div class="dlbl">' + lbl + '</div></div>';
    }).join("");
    var evDays = { 9: 1, 18: 1, 27: 1, 36: 1 }, pills = "";
    for (var n = 1; n <= 50; n++) pills += '<span class="' + (evDays[n] ? "ev" : "") + (n === 15 ? " now" : "") + '">' + (evDays[n] ? "$" : n) + '</span>';
    var action = ev.isToday
      ? '<span class="ac-tag ac-live">Турнир сегодня</span><h3>Виктори Кап</h3><p>Games of the Future 2025 · Abu Dhabi. Победи в&nbsp;квалификации и&nbsp;пробейся на&nbsp;ЛАН.</p><button class="btn btn-primary btn-lg" id="actionBtn" type="button">Играть турнир →</button>'
      : '<span class="ac-tag">Свободный день</span><h3>Тренировка</h3><p>Турнира сегодня нет — качай статы на&nbsp;тренировке.</p><button class="btn btn-primary btn-lg" id="actionBtn" type="button">Тренироваться →</button><div class="ac-next">Ближайший турнир: <b>Виктори Кап</b> · ' + ev.date + '</div>';
    return '<div class="dash"><aside class="fcard day-panel"><p class="panel-title">День</p>' +
      '<div class="d-date">' + fmtD(today) + '</div><div class="d-sub">Свободный день · идёт тренировка</div>' +
      '<div class="rings">' + ring(P.energy, "var(--green)", "Энергия") + ring(P.mood, "var(--accent)", "Настрой") + '</div>' +
      '<p class="panel-title" style="margin-top:4px">Тренировки</p><div class="train-grid">' + trainGrid() + '</div>' +
      '<p class="panel-title" style="margin-top:16px">Карточка игрока</p>' + cardHtml(true) + '</aside>' +
      '<div class="dash-main"><div class="fcard"><div class="next-head"><h3>Далее</h3><span class="ssn">Сезон в дуо · неделя 3</span></div>' +
      '<div class="season-pills">' + pills + '</div><div class="week-row">' + week + '</div></div>' +
      '<div class="fcard action-card">' + action + '</div></div></div>';
  }

  /* ---------- tab: Профиль ---------- */
  function renderProfile() {
    var o = overallOf();
    var rows = [["Никнейм", esc(P.nick)], ["Возраст", P.age + " лет"], ["Регион", esc(P.countryName)], ["Пинг", P.ping + " мс"], ["Позиция", P.pos === "ИГЛ" ? "IGL (лидер)" : "Фрагер"], ["Рейтинг", o + " · " + rarityOf(o).n], ["Дивизион", divOf(o)], ["Сервер", "Франкфурт"]];
    return '<div class="two-col"><div>' + cardHtml(false) + '</div><div class="fcard"><p class="panel-title">Профиль игрока</p>' +
      '<div class="kv-list">' + rows.map(function (r) { return '<div class="kv"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>'; }).join("") + '</div>' +
      '<p class="kv-note">Статы растут на&nbsp;тренировках. Чем выше рейтинг — тем выше дивизион и&nbsp;редкость карточки.</p></div></div>';
  }

  /* ---------- tab: Карьера ---------- */
  function renderCareer() {
    var o = overallOf(), d = divOf(o);
    var ladder = "";
    for (var i = 7; i >= 1; i--) ladder += '<div class="lad' + (i === d ? " cur" : (i < d ? " done" : "")) + '"><b>Д' + i + '</b><span>' + (i === 1 ? "Чемпионский" : i <= 2 ? "Элита" : i <= 4 ? "Контендеры" : "Открытый") + '</span></div>';
    return '<div class="fcard"><p class="panel-title">Путь карьеры · Сезон 1</p><h3 class="blk-h">Ты в&nbsp;<span class="accent">Дивизионе ' + d + '</span></h3>' +
      '<p class="blk-sub">Поднимайся по&nbsp;дивизионам: качай статы, играй турниры и&nbsp;пробивайся в&nbsp;топ.</p>' +
      '<div class="ladder">' + ladder + '</div></div>' +
      '<div class="two-col"><div class="fcard"><p class="panel-title">Цель сезона</p><h4 class="blk-h2">Выйти в&nbsp;Дивизион ' + Math.max(1, d - 1) + '</h4><p class="blk-sub">Набери рейтинг и&nbsp;не&nbsp;вылетай из&nbsp;квалификаций.</p><div class="goal-bar"><i style="width:' + Math.min(100, (o % 7) * 14 + 20) + '%"></i></div></div>' +
      '<div class="fcard"><p class="panel-title">Трофеи</p><p class="blk-sub">Пока пусто. Выиграй первый турнир, чтобы получить трофей.</p><div class="trophy-empty">🏆</div></div></div>';
  }

  /* ---------- tab: Тренировка ---------- */
  function renderTraining() {
    var cards = DRILLS.map(function (dr) {
      return '<button class="drill" data-drill="' + dr.id + '" type="button"><h4>' + dr.name + '</h4><p>' + dr.desc + '</p>' +
        '<span class="drill-stat">' + (dr.id === "rest" ? "+ энергия" : "+ " + dr.stats.map(function (i) { return SHORT[i]; }).join(" · ")) + '</span></button>';
    }).join("");
    return '<div class="fcard"><p class="panel-title">Тренировка</p><h3 class="blk-h">Качай навыки</h3>' +
      '<p class="blk-sub">Выбери занятие и&nbsp;пройди мини-игру — попадай по&nbsp;целям, и&nbsp;статы вырастут. Энергия: <b>' + P.energy + '%</b>.</p>' +
      '<div class="drill-grid">' + cards + '</div></div>' +
      '<div class="fcard"><p class="panel-title">Текущие статы</p><div class="pcard-stats big-stats">' +
      STAT_KEYS.map(function (k, i) { return '<div class="pc-row"><span class="s-k">' + k + '</span><span class="s-v">' + P.stats[i] + '</span><span class="s-bar"><i style="--rar:var(--cyan);width:' + P.stats[i] + '%;background:var(--cyan)"></i></span></div>'; }).join("") + '</div></div>';
  }

  /* ---------- tab: Календарь ---------- */
  function renderCalendar() {
    var w = weekDays();
    var week = w.map(function (d, i) { var now = d.toDateString() === today.toDateString(), ev = i === EV_IDX; return '<div class="day-cell' + (now ? " now" : "") + (ev ? " ev" : "") + '"><div class="dow">' + DOW[i] + '</div><div class="dnum">' + d.getDate() + '</div><div class="dlbl">' + (ev ? "Виктори Кап" : now ? "Сегодня" : "Свободно") + '</div></div>'; }).join("");
    var evs = [["Виктори Кап", evInfo().date, "Мейджор · Abu Dhabi"], ["Дивизионный кубок", "След. неделя", "Квалификация"], ["FNCS Финал", "Через 3 недели", "ЛАН · Копенгаген"]];
    var evDays = { 9: 1, 18: 1, 27: 1, 36: 1 }, pills = "";
    for (var n = 1; n <= 50; n++) pills += '<span class="' + (evDays[n] ? "ev" : "") + (n === 15 ? " now" : "") + '">' + (evDays[n] ? "$" : n) + '</span>';
    return '<div class="fcard"><p class="panel-title">Календарь · Сезон 1</p><div class="season-pills big-pills">' + pills + '</div>' +
      '<p class="panel-title" style="margin-top:16px">Эта неделя</p><div class="week-row">' + week + '</div></div>' +
      '<div class="fcard"><p class="panel-title">Крупные события</p><div class="ev-list">' +
      evs.map(function (e) { return '<div class="ev-row"><div class="ev-ic">★</div><div class="ev-body"><b>' + e[0] + '</b><span>' + e[2] + '</span></div><div class="ev-date">' + e[1] + '</div></div>'; }).join("") + '</div></div>';
  }

  /* ---------- tab: Таблицы ---------- */
  function renderTables() {
    var o = overallOf(), d = divOf(o);
    var bots = [["SwizzY", 93], ["panzer", 90], ["Kirillian", 86], ["m0nke", 78], ["ZetaFN", 72], ["kryptoN", 66], ["asterix", 61], ["volt", 58]];
    var me = [esc(P.nick), o, true];
    var all = bots.map(function (b) { return [b[0], b[1], false]; }); all.push(me);
    all.sort(function (a, b) { return b[1] - a[1]; });
    var rows = all.map(function (r, i) { return '<tr class="' + (r[2] ? "me" : "") + '"><td>' + (i + 1) + '</td><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + (r[1] * 12) + '</td></tr>'; }).join("");
    return '<div class="fcard"><p class="panel-title">Таблица · Дивизион ' + d + '</p><h3 class="blk-h">Твоя позиция в&nbsp;дивизионе</h3>' +
      '<table class="lb"><thead><tr><th>#</th><th>Игрок</th><th>Рейтинг</th><th>Очки</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="kv-note">Соперники — демо. Поднимай рейтинг на&nbsp;тренировках, чтобы обойти их.</p></div>';
  }

  /* ---------- tab: Магазин ---------- */
  function renderShop() {
    var items = [["Скин «Чемпион»", 1200, "🎽"], ["Кирка «FNCS»", 800, "⛏️"], ["Дельтаплан", 500, "🪂"], ["Эмоция «Победа»", 300, "💃"], ["Обёртка «Неон»", 400, "🎨"], ["Буст опыта ×2", 950, "⚡"]];
    return '<div class="fcard"><p class="panel-title">Магазин</p><h3 class="blk-h">Витрина</h3><p class="blk-sub">Косметика и&nbsp;бусты. Демо — покупки не&nbsp;активны.</p>' +
      '<div class="shop-grid">' + items.map(function (it) { return '<div class="shop-item"><div class="si-ic">' + it[2] + '</div><div class="si-name">' + it[0] + '</div><div class="si-price">' + it[1] + ' <span>V-Bucks</span></div><span class="si-buy">Купить</span></div>'; }).join("") + '</div></div>';
  }

  /* ---------- tab: История ---------- */
  function renderHistory() {
    return '<div class="fcard"><p class="panel-title">История матчей</p><div class="empty-state"><div class="es-ic">🎮</div><h3>Пока нет сыгранных матчей</h3><p>Сыграй первый турнир — и&nbsp;результаты появятся здесь.</p></div></div>';
  }

  /* ---------- training minigame ---------- */
  var DRILLS = [
    { id: "aim", name: "Аим-тренировка", stats: [0, 3], desc: "Лови цели как можно быстрее — качает Стрельбу и Клатч." },
    { id: "build", name: "Стройка", stats: [1, 3], desc: "Жми по целям на скорость — качает Стройку и Клатч." },
    { id: "scrim", name: "Скримы", stats: [0, 1, 2, 3, 4, 5], desc: "Матч-режим — понемногу качает все статы." },
    { id: "review", name: "Разбор игр", stats: [2, 4], desc: "Лови ключевые моменты — качает Ротации и Гейм-IQ." },
    { id: "rest", name: "Отдых", stats: [], desc: "Восстанавливает энергию и настрой." }
  ];
  var modal = $("#trainModal"), tmZone = $("#tmZone"), tmTime = $("#tmTime"), tmHits = $("#tmHits"), tmResult = $("#tmResult"), tmStart = $("#tmStart");
  var gameTimer = null, hits = 0, timeLeft = 15, curDrill = null;
  function closeModal() { modal.hidden = true; if (gameTimer) { clearInterval(gameTimer); gameTimer = null; } }
  Array.prototype.forEach.call(document.querySelectorAll("[data-close]"), function (el) { el.addEventListener("click", closeModal); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  function openTrain(dr) {
    if (!dr) return;
    curDrill = dr;
    if (dr.id === "rest") {
      P.energy = 100; P.mood = Math.min(100, P.mood + 20); save(); buildBar(); setTab(cur);
      flash("Ты отдохнул — энергия 100%, настрой +20.");
      return;
    }
    if (P.energy < 15) { flash("Мало энергии. Сначала отдохни."); return; }
    $("#tmTitle").textContent = dr.name;
    $("#tmDesc").textContent = dr.desc + " Жми по целям!";
    tmResult.hidden = true; tmStart.hidden = false; tmStart.textContent = "Начать";
    tmZone.querySelectorAll(".tm-target").forEach(function (t) { t.remove(); });
    hits = 0; timeLeft = 15; tmHits.textContent = "0"; tmTime.textContent = "15";
    modal.hidden = false;
  }
  tmStart.addEventListener("click", startGame);
  function spawn() {
    tmZone.querySelectorAll(".tm-target").forEach(function (t) { t.remove(); });
    var t = document.createElement("button"); t.className = "tm-target"; t.type = "button";
    var sz = 46, pad = 6, w = tmZone.clientWidth - sz - pad * 2, h = tmZone.clientHeight - sz - pad * 2;
    t.style.left = (pad + Math.random() * Math.max(0, w)) + "px";
    t.style.top = (pad + Math.random() * Math.max(0, h)) + "px";
    t.addEventListener("pointerdown", function (e) { e.preventDefault(); hits++; tmHits.textContent = hits; spawn(); });
    tmZone.appendChild(t);
  }
  function startGame() {
    tmStart.hidden = true; tmResult.hidden = true; hits = 0; timeLeft = 15; tmHits.textContent = "0"; tmTime.textContent = "15";
    spawn();
    gameTimer = setInterval(function () {
      timeLeft--; tmTime.textContent = timeLeft;
      if (timeLeft <= 0) { clearInterval(gameTimer); gameTimer = null; endGame(); }
    }, 1000);
  }
  function endGame() {
    tmZone.querySelectorAll(".tm-target").forEach(function (t) { t.remove(); });
    var oOld = overallOf();
    var gain = Math.max(1, Math.round(hits / 5));
    var changed = [];
    curDrill.stats.forEach(function (i) { var old = P.stats[i]; P.stats[i] = Math.min(99, P.stats[i] + gain); if (P.stats[i] !== old) changed.push(SHORT[i] + " +" + (P.stats[i] - old)); });
    P.energy = Math.max(0, P.energy - 18); P.mood = Math.min(100, P.mood + 3);
    save(); var oNew = overallOf();
    tmResult.hidden = false;
    tmResult.innerHTML = '<div class="tm-res-big">' + hits + ' попаданий</div>' +
      '<div class="tm-res-gains">' + (changed.length ? changed.join(" · ") : "без прироста") + '</div>' +
      '<div class="tm-res-ovr">Рейтинг: ' + oOld + ' → <b>' + oNew + '</b> · Энергия: ' + P.energy + '%</div>' +
      '<button class="btn btn-primary" type="button" id="tmAgain">Готово</button>';
    $("#tmAgain").addEventListener("click", function () { closeModal(); buildBar(); setTab(cur); });
  }

  /* ---------- toast ---------- */
  var toastT;
  function flash(msg) {
    var t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }

  /* ---------- init ---------- */
  buildBar(); setTab("center");
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();

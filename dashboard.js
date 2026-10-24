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
    xp: (function () { try { var p = JSON.parse(g("fnc_statxp")); if (p && p.length === 6) return p.map(Number); } catch (e) {} return [0, 0, 0, 0, 0, 0]; })(),
    energy: numk("fnc_energy", 100), mood: numk("fnc_mood", 62), balance: numk("fnc_balance", 0)
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
    localStorage.setItem("fnc_statxp", JSON.stringify(P.xp));
    localStorage.setItem("fnc_balance", P.balance);
  }
  var XP_PER = 100; // опыта на +1 к стату
  function fmtMoney(n) { return (n || 0).toLocaleString("ru-RU"); }
  function loadArr(k) { try { var v = JSON.parse(g(k)); if (v && v.length != null) return v; } catch (e) {} return []; }
  function loadObj(k) { try { var v = JSON.parse(g(k)); if (v && typeof v === "object") return v; } catch (e) {} return {}; }

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
      '<div class="pb-bal"><div class="k">Баланс</div><b>$' + fmtMoney(P.balance) + '</b></div></div>' +
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
      var ab = $("#actionBtn"); if (ab) ab.addEventListener("click", function () { var ev = evInfo(); if (ev.isToday) openTournament("Виктори Кап"); else openTrain(DRILLS[2]); });
    }
    if (name === "career") {
      var pt = $("#playTourBtn"); if (pt) pt.addEventListener("click", function () { openTournament(pt.getAttribute("data-ev") || "Показательный турнир"); });
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
    var hist = loadArr("fnc_history"), played = hist.length, ev = evInfo(), tr = loadObj("fnc_trophies");
    var trIc = { win: "🏆", podium: "🥈", top10: "🎖" }, trNm = { win: "Победы", podium: "Подиумы", top10: "Топ-10" };
    var trophyHtml = Object.keys(trIc).filter(function (k) { return tr[k]; }).map(function (k) { return '<div class="trophy"><span class="tr-ic">' + trIc[k] + '</span><b>' + tr[k] + '</b><span class="tr-nm">' + trNm[k] + '</span></div>'; }).join("");
    return '<div class="fcard"><p class="panel-title">Путь карьеры · Сезон 1</p><h3 class="blk-h">Ты в&nbsp;<span class="accent">Дивизионе ' + d + '</span></h3>' +
      '<p class="blk-sub">Поднимайся по&nbsp;дивизионам: качай статы, играй турниры и&nbsp;пробивайся в&nbsp;топ.</p>' +
      '<div class="ladder">' + ladder + '</div></div>' +
      '<div class="fcard tour-cta"><div class="tc-body"><p class="panel-title">Турнир</p><h4 class="blk-h2">' + (ev.isToday ? "Сегодня: Виктори Кап" : "Виктори Кап · " + ev.date) + '</h4><p class="blk-sub">Сессия из 6 игр. Место и&nbsp;очки зависят от&nbsp;твоих статов, а&nbsp;не&nbsp;от&nbsp;рандома. Сыграно турниров: <b>' + played + '</b>.</p></div>' +
      '<button class="btn btn-primary btn-lg" id="playTourBtn" data-ev="Виктори Кап" type="button">Играть турнир →</button></div>' +
      '<div class="two-col"><div class="fcard"><p class="panel-title">Цель сезона</p><h4 class="blk-h2">Выйти в&nbsp;Дивизион ' + Math.max(1, d - 1) + '</h4><p class="blk-sub">Набери рейтинг и&nbsp;не&nbsp;вылетай из&nbsp;квалификаций.</p><div class="goal-bar"><i style="width:' + Math.min(100, (o % 7) * 14 + 20) + '%"></i></div></div>' +
      '<div class="fcard"><p class="panel-title">Трофеи</p>' + (trophyHtml ? '<div class="trophy-row">' + trophyHtml + '</div>' : '<p class="blk-sub">Пока пусто. Выиграй первый турнир, чтобы получить трофей.</p><div class="trophy-empty">🏆</div>') + '</div></div>';
  }

  /* ---------- tab: Тренировка ---------- */
  function renderTraining() {
    var cards = DRILLS.map(function (dr) {
      return '<button class="drill" data-drill="' + dr.id + '" type="button"><h4>' + dr.name + '</h4><p>' + dr.desc + '</p>' +
        '<span class="drill-stat">' + (dr.id === "rest" ? "+ энергия" : "+ " + dr.stats.map(function (i) { return SHORT[i]; }).join(" · ")) + '</span></button>';
    }).join("");
    return '<div class="fcard"><p class="panel-title">Тренировка</p><h3 class="blk-h">Качай навыки</h3>' +
      '<p class="blk-sub">Выбери занятие и&nbsp;пройди короткую мини-игру (5&nbsp;сек). За&nbsp;попадания капает опыт — статы растут не&nbsp;сразу (≈10&nbsp;тренировок = +1 к&nbsp;рейтингу). Энергия: <b>' + P.energy + '%</b>.</p>' +
      '<div class="drill-grid">' + cards + '</div></div>' +
      '<div class="fcard"><p class="panel-title">Текущие статы <span class="pt-note">(тонкая полоса — опыт до +1)</span></p><div class="pcard-stats big-stats">' +
      STAT_KEYS.map(function (k, i) { return '<div class="pc-row"><span class="s-k">' + k + '</span><span class="s-v">' + P.stats[i] + '</span><span class="s-bar"><i style="width:' + P.stats[i] + '%;background:var(--cyan)"></i><u class="s-xp" style="width:' + Math.round(P.xp[i]) + '%"></u></span></div>'; }).join("") + '</div></div>';
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
    var hist = loadArr("fnc_history");
    if (!hist.length) return '<div class="fcard"><p class="panel-title">История матчей</p><div class="empty-state"><div class="es-ic">🎮</div><h3>Пока нет сыгранных матчей</h3><p>Сыграй первый турнир — и&nbsp;результаты появятся здесь.</p></div></div>';
    var best = hist.reduce(function (m, h) { return Math.min(m, h.rank); }, 999);
    var wins = hist.filter(function (h) { return h.vr > 0; }).length;
    var rows = hist.map(function (h) {
      var dt = new Date(h.date), ds = dt.getDate() + " " + MON[dt.getMonth()];
      var badge = h.rank === 1 ? "t-gold" : h.rank <= 3 ? "t-silver" : h.rank <= 10 ? "t-blue" : "";
      return '<div class="hist-row"><div class="hr-place ' + badge + '">#' + h.rank + '</div>' +
        '<div class="hr-body"><b>' + esc(h.name) + '</b><span>' + ds + ' · ' + h.total + ' очк · ' + h.elims + ' килл · лучшее #' + h.best + (h.vr ? " · 👑" + h.vr : "") + '</span></div>' +
        '<div class="hr-prize">' + (h.prize ? "$" + fmtMoney(h.prize) : "—") + '</div></div>';
    }).join("");
    return '<div class="fcard"><p class="panel-title">История матчей</p>' +
      '<div class="hist-sum"><div><b>' + hist.length + '</b><span>турниров</span></div><div><b>#' + best + '</b><span>лучшее место</span></div><div><b>' + wins + '</b><span>👑 викторий</span></div></div>' +
      '<div class="hist-list">' + rows + '</div></div>';
  }

  /* ---------- training minigame ---------- */
  var DRILLS = [
    { id: "aim", name: "Аим-тренировка", mode: "aim", xpMult: 3, stats: [0, 3], desc: "Лови цели как можно быстрее — качает Стрельбу и Клатч." },
    { id: "build", name: "Стройка / Эдит", mode: "edit", xpMult: 4, stats: [1, 3], desc: "Редачь стенку: жми подсвеченные ячейки, собирай правки на скорость — качает Стройку и Клатч." },
    { id: "scrim", name: "Скримы", mode: "aim", xpMult: 1, stats: [0, 1, 2, 3, 4, 5], desc: "Матч-режим — понемногу качает все статы." },
    { id: "review", name: "Разбор игр", mode: "aim", xpMult: 3, stats: [2, 4], desc: "Лови ключевые моменты — качает Ротации и Гейм-IQ." },
    { id: "rest", name: "Отдых", mode: "rest", xpMult: 0, stats: [], desc: "Восстанавливает энергию и настрой." }
  ];
  var modal = $("#trainModal"), tmZone = $("#tmZone"), tmTime = $("#tmTime"), tmHits = $("#tmHits"), tmResult = $("#tmResult"), tmStart = $("#tmStart");
  var GAME_SECS = 5;
  var gameTimer = null, hits = 0, timeLeft = GAME_SECS, curDrill = null;
  var editGrid = null, hotSet = {}, hotCount = 0, doneCount = 0;
  function setHudLabel(txt) { var l = $("#tmHitsLabel"); if (l) l.textContent = txt; }
  function clearZone() { tmZone.querySelectorAll(".tm-target, .tm-grid").forEach(function (t) { t.remove(); }); editGrid = null; }
  function closeModal() { modal.hidden = true; if (gameTimer) { clearInterval(gameTimer); gameTimer = null; } clearZone(); }
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
    if (P.energy < 12) { flash("Мало энергии. Сначала отдохни."); return; }
    $("#tmTitle").textContent = dr.name;
    $("#tmDesc").textContent = dr.desc + (dr.mode === "edit" ? " Жми подсвеченные ячейки!" : " Жми по целям!");
    setHudLabel(dr.mode === "edit" ? "Правок" : "Попаданий");
    tmResult.hidden = true; tmStart.hidden = false; tmStart.textContent = "Начать";
    clearZone();
    hits = 0; timeLeft = GAME_SECS; tmHits.textContent = "0"; tmTime.textContent = GAME_SECS;
    modal.hidden = false;
  }
  tmStart.addEventListener("click", startGame);

  /* ---- aim mode: hit moving targets ---- */
  function spawn() {
    tmZone.querySelectorAll(".tm-target").forEach(function (t) { t.remove(); });
    var t = document.createElement("button"); t.className = "tm-target"; t.type = "button";
    var sz = 46, pad = 6, w = tmZone.clientWidth - sz - pad * 2, h = tmZone.clientHeight - sz - pad * 2;
    t.style.left = (pad + Math.random() * Math.max(0, w)) + "px";
    t.style.top = (pad + Math.random() * Math.max(0, h)) + "px";
    t.addEventListener("pointerdown", function (e) { e.preventDefault(); if (!gameTimer) return; hits++; tmHits.textContent = hits; spawn(); });
    tmZone.appendChild(t);
  }

  /* ---- edit mode: Fortnite-style wall edit — press the highlighted cells ---- */
  function buildEditGrid() {
    clearZone();
    var grid = document.createElement("div"); grid.className = "tm-grid";
    for (var i = 0; i < 9; i++) {
      var c = document.createElement("button"); c.type = "button"; c.className = "tm-cell"; c.setAttribute("data-i", i);
      c.addEventListener("pointerdown", onEditCell); grid.appendChild(c);
    }
    tmZone.appendChild(grid); editGrid = grid; newEditRound();
  }
  function newEditRound() {
    if (!editGrid) return;
    var cells = editGrid.querySelectorAll(".tm-cell");
    cells.forEach(function (c) { c.classList.remove("hot", "done"); });
    var n = 2 + Math.floor(Math.random() * 3), idx = []; // подсветить 2..4 ячейки
    while (idx.length < n) { var r = Math.floor(Math.random() * 9); if (idx.indexOf(r) < 0) idx.push(r); }
    hotSet = {}; idx.forEach(function (r) { cells[r].classList.add("hot"); hotSet[r] = true; });
    hotCount = n; doneCount = 0;
  }
  function onEditCell(e) {
    e.preventDefault(); if (!gameTimer) return;
    var c = e.currentTarget, i = +c.getAttribute("data-i");
    if (hotSet[i] && !c.classList.contains("done")) {
      c.classList.add("done"); doneCount++;
      if (doneCount >= hotCount) { hits++; tmHits.textContent = hits; newEditRound(); }
    }
  }

  function startGame() {
    tmStart.hidden = true; tmResult.hidden = true; hits = 0; timeLeft = GAME_SECS; tmHits.textContent = "0"; tmTime.textContent = GAME_SECS;
    if (curDrill.mode === "edit") buildEditGrid(); else { clearZone(); spawn(); }
    gameTimer = setInterval(function () {
      timeLeft--; tmTime.textContent = timeLeft;
      if (timeLeft <= 0) { clearInterval(gameTimer); gameTimer = null; endGame(); }
    }, 1000);
  }
  function endGame() {
    clearZone();
    var oOld = overallOf();
    var gx = Math.min(50, Math.max(1, Math.round(hits * (curDrill.xpMult || 2)))); // очень мало + потолок: ~10 тренировок = +1 к рейтингу
    var ups = [], gains = [];
    curDrill.stats.forEach(function (i) {
      P.xp[i] += gx; gains.push(SHORT[i] + " +" + gx);
      while (P.xp[i] >= XP_PER && P.stats[i] < 99) { P.stats[i]++; P.xp[i] -= XP_PER; ups.push(SHORT[i] + " +1"); }
      if (P.stats[i] >= 99) P.xp[i] = 0;
    });
    P.energy = Math.max(0, P.energy - 10); P.mood = Math.min(100, P.mood + 3);
    save(); var oNew = overallOf();
    var scoreLbl = curDrill.mode === "edit" ? " правок" : " попаданий";
    tmResult.hidden = false;
    tmResult.innerHTML = '<div class="tm-res-big">' + hits + scoreLbl + '</div>' +
      '<div class="tm-res-gains">' + gains.join(" · ") + ' опыта</div>' +
      (ups.length ? '<div class="tm-res-up">⬆ ' + ups.join(" · ") + '</div>' : '<div class="tm-res-up muted">копи опыт — статы растут не сразу</div>') +
      '<div class="tm-res-ovr">Рейтинг: ' + oOld + ' → <b>' + oNew + '</b> · Энергия: ' + P.energy + '%</div>' +
      '<button class="btn btn-primary" type="button" id="tmAgain">Готово</button>';
    $("#tmAgain").addEventListener("click", function () { closeModal(); buildBar(); setTab(cur); });
  }

  /* ---------- tournament simulation (skill-based, not pure random) ---------- */
  function rr(a, b) { return a + Math.random() * (b - a); }
  function placePts(place) {
    if (place === 1) return 60; if (place <= 2) return 54; if (place <= 3) return 50; if (place <= 5) return 46;
    if (place <= 8) return 42; if (place <= 12) return 36; if (place <= 16) return 30; if (place <= 25) return 24;
    if (place <= 35) return 18; if (place <= 50) return 12; if (place <= 70) return 6; return 3;
  }
  // Full lobby simulated each game: placement is driven by overall (skill) + bounded variance.
  function simulateTournament(games) {
    games = games || 6;
    var me = overallOf(), N = 100, skill = [me];
    for (var i = 1; i < N; i++) skill.push(Math.max(35, Math.min(99, Math.round(me + rr(-16, 12)))));
    var totals = []; for (var t = 0; t < N; t++) totals.push(0);
    var myElims = 0, best = N, vr = 0, log = [];
    for (var gi = 0; gi < games; gi++) {
      var order = skill.map(function (s, idx) { return { idx: idx, r: s + rr(-20, 20) }; }).sort(function (a, b) { return b.r - a.r; });
      for (var p = 0; p < N; p++) {
        var idx = order[p].idx, place = p + 1;
        var el = Math.max(0, Math.round((order[p].r - skill[idx] + 10) / 7) + (place <= 10 ? 1 : 0));
        totals[idx] += placePts(place) + el;
        if (idx === 0) { myElims += el; if (place < best) best = place; if (place === 1) vr++; log.push({ g: gi + 1, place: place, el: el, pts: placePts(place) + el }); }
      }
    }
    var myTotal = totals[0], rank = 1;
    for (var j = 1; j < N; j++) if (totals[j] > myTotal) rank++;
    return { me: me, games: games, total: myTotal, elims: myElims, best: best, vr: vr, rank: rank, lobby: N, log: log };
  }
  function tournamentRewards(res) {
    var pct = res.rank / res.lobby; // меньше = лучше
    return {
      xpAll: Math.round(10 + (1 - pct) * 40), // 10..50 опыта ко всем статам
      prize: res.rank === 1 ? 5000 : res.rank <= 3 ? 2500 : res.rank <= 10 ? 1200 : res.rank <= 25 ? 500 : res.rank <= 50 ? 150 : 0,
      trophy: res.vr > 0 ? "win" : res.rank <= 3 ? "podium" : res.rank <= 10 ? "top10" : null
    };
  }
  function applyTournament(res, rw) {
    var ups = [];
    for (var i = 0; i < 6; i++) { P.xp[i] += rw.xpAll; while (P.xp[i] >= XP_PER && P.stats[i] < 99) { P.stats[i]++; P.xp[i] -= XP_PER; ups.push(SHORT[i] + " +1"); } if (P.stats[i] >= 99) P.xp[i] = 0; }
    P.balance += rw.prize; P.energy = Math.max(0, P.energy - 25); P.mood = Math.min(100, P.mood + (res.rank <= 10 ? 6 : -2));
    save();
    var hist = loadArr("fnc_history");
    hist.unshift({ name: res.name, date: Date.now(), rank: res.rank, lobby: res.lobby, total: res.total, elims: res.elims, best: res.best, vr: res.vr, prize: rw.prize });
    localStorage.setItem("fnc_history", JSON.stringify(hist.slice(0, 30)));
    if (rw.trophy) { var tr = loadObj("fnc_trophies"); tr[rw.trophy] = (tr[rw.trophy] || 0) + 1; localStorage.setItem("fnc_trophies", JSON.stringify(tr)); }
    return ups;
  }
  var tourModal = $("#tourModal");
  Array.prototype.forEach.call(document.querySelectorAll("[data-tclose]"), function (el) { el.addEventListener("click", function () { tourModal.hidden = true; }); });
  function openTournament(name) {
    if (P.energy < 25) { flash("Мало энергии для турнира. Отдохни."); return; }
    var res = simulateTournament(6); res.name = name || "Турнир";
    var rw = tournamentRewards(res), ups = applyTournament(res, rw);
    var rankCls = res.rank === 1 ? "t-gold" : res.rank <= 3 ? "t-silver" : res.rank <= 10 ? "t-blue" : "";
    var rows = res.log.map(function (l) { return '<tr><td>Игра ' + l.g + '</td><td>' + (l.place === 1 ? "👑 1" : l.place) + '</td><td>' + l.el + '</td><td>' + l.pts + '</td></tr>'; }).join("");
    var trophyTxt = rw.trophy === "win" ? "🏆 Victory Royale!" : rw.trophy === "podium" ? "🥈 Подиум (топ-3)" : rw.trophy === "top10" ? "🎖 Топ-10" : "";
    $("#tourTitle").textContent = res.name;
    $("#tourBody").innerHTML =
      '<div class="t-rank ' + rankCls + '"><b>' + res.rank + '</b><span>место из ' + res.lobby + '</span></div>' +
      '<div class="t-kpis"><div><b>' + res.total + '</b><span>очки</span></div><div><b>' + res.elims + '</b><span>киллы</span></div><div><b>' + res.best + '</b><span>лучшее</span></div><div><b>' + res.vr + '</b><span>👑 VR</span></div></div>' +
      '<table class="t-log"><thead><tr><th>Игра</th><th>Место</th><th>Киллы</th><th>Очки</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (trophyTxt ? '<div class="t-tr">' + trophyTxt + '</div>' : "") +
      '<div class="t-rw-row">Приз: <b>$' + fmtMoney(rw.prize) + '</b> · Опыт: <b>+' + rw.xpAll + '</b> ко всем статам' + (ups.length ? ' · <span class="accent">' + ups.join(" ") + '</span>' : "") + '</div>' +
      '<button class="btn btn-primary" id="tourDone" type="button">Готово</button>';
    tourModal.hidden = false;
    $("#tourDone").addEventListener("click", function () { tourModal.hidden = true; buildBar(); setTab(cur); });
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

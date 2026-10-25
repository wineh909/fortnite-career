/* FNCS Career — career hub (дни сезона, тренировки, турниры, PR, призовые). localStorage. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var g = function (k) { return localStorage.getItem(k) || ""; };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); };
  function numk(k, d) { var v = parseInt(localStorage.getItem(k), 10); return isNaN(v) ? d : v; }
  function fnum(n) { return (n || 0).toLocaleString("ru-RU"); }
  function loadArr(k) { try { var v = JSON.parse(g(k)); if (v && v.length != null) return v; } catch (e) {} return []; }
  function loadObj(k) { try { var v = JSON.parse(g(k)); if (v && typeof v === "object") return v; } catch (e) {} return {}; }
  var MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  var STAT_KEYS = ["Стрельба", "Стройка", "Ротации", "Клатч", "Гейм-IQ", "Стабильность"];
  var SHORT = ["СТР", "СТРОЙ", "РОТ", "КЛЧ", "IQ", "СТБ"];
  var XP_PER = 100, MAX_ENERGY = 100, DAILY_REGEN = 80, SEASON_LEN = 42;

  if (!g("fnc_nick")) { location.href = "career.html"; return; }
  var P = {
    nick: g("fnc_nick"), age: numk("fnc_age", 18), avatar: g("fnc_avatar"),
    flag: (g("fnc_country_flag") || g("fnc_country").replace(/^ru-.*/, "ru")) || "eu",
    countryName: g("fnc_country_name") || "—", ping: g("fnc_ping") || "—",
    pos: g("fnc_pos") || "—", role: g("fnc_role") || "",
    stats: (function () { try { var p = JSON.parse(g("fnc_stats")); if (p && p.vals && p.vals.length === 6) return p.vals.map(Number); } catch (e) {} return [55, 55, 55, 55, 55, 55]; })(),
    xp: (function () { try { var p = JSON.parse(g("fnc_statxp")); if (p && p.length === 6) return p.map(Number); } catch (e) {} return [0, 0, 0, 0, 0, 0]; })(),
    energy: numk("fnc_energy", 100), mood: numk("fnc_mood", 62),
    day: numk("fnc_day", 1), season: numk("fnc_season", 1),
    pr: numk("fnc_pr", 0), earnings: numk("fnc_earnings", 0),
    balance: numk("fnc_balance", numk("fnc_earnings", 0)), // тратимые деньги
    gear: loadObj("fnc_gear"), moves: loadArr("fnc_moves")
  };
  var flagUrl = function (iso) { return "https://flagcdn.com/w320/" + iso + ".png"; };
  function ageBonus(a) { a = +a || 20; return a <= 16 ? 6 : a <= 18 ? 4 : a <= 21 ? 2 : a <= 25 ? 0 : a <= 30 ? -2 : -4; }
  function baseOvr() { return Math.round(P.stats.reduce(function (a, b) { return a + b; }, 0) / 6); }
  // магазин девайсов: лучший сетап = выше рейтинг (с нищими играешь хуже)
  var GEAR = [
    { id: "monitor", n: "Монитор", ic: "🖥️", tiers: [{ n: "Офисный 60 Гц", b: 0, p: 0 }, { n: "144 Гц игровой", b: 1, p: 1000 }, { n: "240 Гц", b: 2, p: 3000 }, { n: "360 Гц про", b: 3, p: 8000 }] },
    { id: "pc", n: "Компьютер", ic: "💻", tiers: [{ n: "Старый ноут", b: 0, p: 0 }, { n: "Средний ПК", b: 1, p: 1500 }, { n: "Игровой ПК", b: 2, p: 5000 }, { n: "Топ-риг", b: 3, p: 12000 }] },
    { id: "periph", n: "Мышь и клава", ic: "🖱️", tiers: [{ n: "Офисные", b: 0, p: 0 }, { n: "Игровые", b: 1, p: 800 }, { n: "Киберспорт", b: 2, p: 2500 }] },
    { id: "net", n: "Интернет", ic: "📶", tiers: [{ n: "Мобильный", b: 0, p: 0 }, { n: "Домашний", b: 1, p: 1200 }, { n: "Оптика, низкий пинг", b: 2, p: 3500 }] },
    { id: "chair", n: "Кресло и сетап", ic: "🪑", tiers: [{ n: "Табуретка", b: 0, p: 0 }, { n: "Игровое кресло", b: 1, p: 700 }, { n: "Про-сетап", b: 2, p: 2200 }] }
  ];
  function gearTier(id) { var t = P.gear[id]; return t != null ? t : 0; }
  function gearBonus() { var s = 0; GEAR.forEach(function (g) { var tr = g.tiers[gearTier(g.id)]; if (tr) s += tr.b; }); return s; }
  function overallOf() { return Math.max(30, Math.min(99, baseOvr() + ageBonus(P.age) + gearBonus())); }
  // редкость — шкала Fortnite (цвета как в игре)
  function rarityOf(o) { return o >= 95 ? { n: "Мифический", c: "#ffd84d" } : o >= 90 ? { n: "Легендарный", c: "#ff9b3d" } : o >= 80 ? { n: "Эпический", c: "#b06bff" } : o >= 70 ? { n: "Редкий", c: "#46b6ff" } : o >= 60 ? { n: "Необычный", c: "#3fe07a" } : { n: "Обычный", c: "#9aa6bf" }; }
  function divOf(o) { return o >= 82 ? 1 : o >= 75 ? 2 : o >= 68 ? 3 : o >= 61 ? 4 : 5; }
  function divName(d) { return d === 1 ? "Чемпионский" : d === 2 ? "Элита" : d === 3 ? "Контендеры" : d === 4 ? "Претенденты" : "Открытый"; }
  function save() {
    var o = overallOf();
    localStorage.setItem("fnc_stats", JSON.stringify({ keys: STAT_KEYS, vals: P.stats }));
    localStorage.setItem("fnc_overall", o); localStorage.setItem("fnc_base", baseOvr());
    localStorage.setItem("fnc_bonus", ageBonus(P.age)); localStorage.setItem("fnc_rarity", rarityOf(o).n);
    localStorage.setItem("fnc_rarity_color", rarityOf(o).c); localStorage.setItem("fnc_division", divOf(o));
    localStorage.setItem("fnc_energy", P.energy); localStorage.setItem("fnc_mood", P.mood);
    localStorage.setItem("fnc_statxp", JSON.stringify(P.xp));
    localStorage.setItem("fnc_day", P.day); localStorage.setItem("fnc_season", P.season);
    localStorage.setItem("fnc_pr", P.pr); localStorage.setItem("fnc_earnings", P.earnings);
    localStorage.setItem("fnc_balance", P.balance); localStorage.setItem("fnc_gear", JSON.stringify(P.gear));
    localStorage.setItem("fnc_moves", JSON.stringify(P.moves));
  }

  /* ---------- календарь сезона (по образцу FNCS) ---------- */
  var SCHEDULE = [
    { day: 2, name: "Дивизионный кубок · Нед.1", type: "cup", lobby: 100, games: 6, prizeTop: 1500, prW: 0.5 },
    { day: 6, name: "Console Cash Cup", type: "cash", lobby: 100, games: 8, prizeTop: 4000, prW: 1.0 },
    { day: 9, name: "Дивизионный кубок · Нед.2", type: "cup", lobby: 100, games: 6, prizeTop: 1500, prW: 0.5 },
    { day: 13, name: "FNCS Major · Play-In", type: "major", lobby: 100, games: 8, prizeTop: 3000, prW: 0.6 },
    { day: 16, name: "FNCS Major · Хиты", type: "major", lobby: 80, games: 5, prizeTop: 6000, prW: 0.9 },
    { day: 20, name: "FNCS Major · Гранд-финал", type: "final", lobby: 50, games: 12, prizeTop: 60000, prW: 2.0 },
    { day: 24, name: "Дивизионный кубок · Нед.3", type: "cup", lobby: 100, games: 6, prizeTop: 1500, prW: 0.5 },
    { day: 28, name: "Solo Cash Cup", type: "cash", lobby: 100, games: 8, prizeTop: 4000, prW: 1.0 },
    { day: 31, name: "Reload Cup", type: "cash", lobby: 100, games: 6, prizeTop: 2500, prW: 0.7 },
    { day: 35, name: "Дивизионный кубок · Нед.4", type: "cup", lobby: 100, games: 6, prizeTop: 1500, prW: 0.5 },
    { day: 42, name: "Global Championship", type: "final", lobby: 50, games: 12, prizeTop: 100000, prW: 3.0 }
  ];
  var TYPE_LBL = { cup: "Кубок", cash: "Cash Cup", major: "Мейджор", final: "Финал" };
  function eventOnDay(d) { for (var i = 0; i < SCHEDULE.length; i++) if (SCHEDULE[i].day === d) return SCHEDULE[i]; return null; }
  function nextEvent(fromDay) { for (var i = 0; i < SCHEDULE.length; i++) if (SCHEDULE[i].day >= fromDay) return SCHEDULE[i]; return null; }

  /* ---------- карточка / кольца ---------- */
  function avHtml(big) { return P.avatar ? '<img src="' + P.avatar + '" alt="">' : '<span class="noav">нет' + (big ? "<br>" : " ") + 'фото</span>'; }
  function cardHtml(mini) {
    var o = overallOf(), r = rarityOf(o), b = baseOvr(), bo = ageBonus(P.age) + gearBonus();
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

  /* ---------- шапка игрока ---------- */
  function buildBar() {
    var o = overallOf();
    $("#playerBar").innerHTML =
      '<div class="player-bar"><div class="pb-id"><img class="pb-av" src="' + (P.avatar || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='62' height='62'%3E%3Crect width='62' height='62' fill='%232657b0'/%3E%3C/svg%3E") + '" alt="">' +
      '<div class="pb-name"><h2>' + esc(P.nick) + '</h2><div class="pb-meta">' + P.age + ' лет · Дивизион ' + divOf(o) + ' · ' + P.pos + ' <img class="flag" src="' + flagUrl(P.flag) + '" alt=""></div></div></div>' +
      '<div class="pb-mid"><span class="pb-rating"><b>' + o + '</b><span>Рейтинг</span></span>' +
      '<span class="pb-stat"><b>' + fnum(P.pr) + '</b><span>PR</span></span>' +
      '<span class="pb-stat"><b>$' + fnum(P.balance) + '</b><span>Баланс</span></span>' +
      '<div class="pb-energy"><div class="k">Энергия</div><div class="bar"><i style="width:' + P.energy + '%"></i></div></div></div>' +
      '<div class="pb-season"><div class="c"><b>' + P.season + '</b><span>Сезон</span></div><div class="c"><b>' + P.day + '</b><span>День / ' + SEASON_LEN + '</span></div><div class="c"><b>' + P.ping + '</b><span>Пинг</span></div></div></div>';
  }

  /* ---------- вкладки ---------- */
  var cur = "center";
  var TABS = {
    center: renderCenter, profile: renderProfile, career: renderCareer, training: renderTraining,
    calendar: renderCalendar, tables: renderTables, pr: renderPR, earnings: renderEarnings, shop: renderShop, history: renderHistory
  };
  function setTab(name) {
    if (!TABS[name]) name = "center";
    cur = name;
    Array.prototype.forEach.call(document.querySelectorAll(".tab-btn"), function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === name); });
    $("#tabContent").innerHTML = TABS[name]();
    wire(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  $("#subnav").addEventListener("click", function (e) { var b = e.target.closest(".tab-btn"); if (b) setTab(b.getAttribute("data-tab")); });

  var trainRot = 0; // ротация тренировок с кнопки «Тренироваться»
  function rotDrill() { var d = DRILLS[trainRot % DRILLS.length]; trainRot++; return d; }
  function wire(name) {
    if (name === "center") {
      var ab = $("#actionBtn"); if (ab) ab.addEventListener("click", function () { var ev = eventOnDay(P.day); if (ev) openTournament(ev); else openTrain(rotDrill()); });
      var sk = $("#skipBtn"); if (sk) sk.addEventListener("click", function () { var ev = eventOnDay(P.day); if (ev && !confirmSkip) { confirmSkip = true; sk.textContent = "Точно пропустить турнир?"; return; } advanceDay(); });
    }
    if (name === "training") {
      Array.prototype.forEach.call(document.querySelectorAll("[data-drill]"), function (el) {
        el.addEventListener("click", function () { openTrain(DRILLS.filter(function (d) { return d.id === el.getAttribute("data-drill"); })[0]); });
      });
    }
    if (name === "shop") wireShop();
  }
  var confirmSkip = false;

  /* ---------- день: смена дня + реген энергии ---------- */
  function advanceDay() {
    confirmSkip = false;
    P.day++;
    if (P.day > SEASON_LEN) { P.day = 1; P.season++; flash("Новый сезон " + P.season + "! Путь продолжается."); }
    P.energy = Math.min(MAX_ENERGY, P.energy + DAILY_REGEN);
    P.mood = Math.min(100, P.mood + 4);
    save(); buildBar(); setTab("center");
  }

  /* ---------- Центр ---------- */
  function dayStrip() {
    var cells = "";
    for (var d = P.day; d < P.day + 7 && d <= SEASON_LEN; d++) {
      var ev = eventOnDay(d), now = d === P.day;
      cells += '<div class="day-cell' + (now ? " now" : "") + (ev ? " ev ev-" + ev.type : "") + '"><div class="dow">День</div><div class="dnum">' + d + '</div><div class="dlbl">' + (ev ? TYPE_LBL[ev.type] : (now ? "тренировка" : "свободно")) + '</div></div>';
    }
    return cells;
  }
  function renderCenter() {
    var ev = eventOnDay(P.day), nx = nextEvent(P.day + (ev ? 1 : 0));
    var action;
    if (ev) {
      action = '<span class="ac-tag ac-live ev-' + ev.type + '">' + TYPE_LBL[ev.type] + ' · сегодня</span><h3>' + ev.name + '</h3>' +
        '<p>Лобби ' + ev.lobby + ' · ' + ev.games + ' игр · призовой фонд от&nbsp;$' + fnum(ev.prizeTop) + '. Место зависит от&nbsp;твоего рейтинга, а&nbsp;не&nbsp;от&nbsp;рандома.</p>' +
        '<div class="ac-btns"><button class="btn btn-primary btn-lg" id="actionBtn" type="button">Играть турнир →</button>' +
        '<button class="btn btn-ghost" id="skipBtn" type="button">Пропустить день</button></div>';
    } else {
      action = '<span class="ac-tag">Свободный день</span><h3>Тренировка</h3>' +
        '<p>Турнира сегодня нет — качай статы на&nbsp;мини-играх (кнопка чередует занятия). Энергия: <b>' + P.energy + '%</b>.</p>' +
        '<div class="ac-btns"><button class="btn btn-primary btn-lg" id="actionBtn" type="button">Тренироваться →</button>' +
        '<button class="btn btn-ghost" id="skipBtn" type="button">Скипнуть день →</button></div>' +
        (nx ? '<div class="ac-next">Ближайший турнир: <b>' + nx.name + '</b> · день ' + nx.day + ' (через ' + (nx.day - P.day) + ')</div>' : '');
    }
    return '<div class="dash"><aside class="fcard day-panel"><p class="panel-title">Сезон ' + P.season + ' · День ' + P.day + '</p>' +
      '<div class="d-date">' + (ev ? ev.name : "Свободный день") + '</div><div class="d-sub">' + (ev ? "День турнира" : "Тренировка · подготовка") + '</div>' +
      '<div class="rings">' + ring(P.energy, "var(--green)", "Энергия") + ring(P.mood, "var(--accent)", "Настрой") + '</div>' +
      '<p class="panel-title" style="margin-top:4px">Статы</p><div class="train-grid">' + trainGrid() + '</div>' +
      '<p class="panel-title" style="margin-top:16px">Карточка игрока</p>' + cardHtml(true) + '</aside>' +
      '<div class="dash-main"><div class="fcard"><div class="next-head"><h3>Календарь</h3><span class="ssn">Сезон ' + P.season + ' · дни ' + P.day + '–' + Math.min(SEASON_LEN, P.day + 6) + '</span></div>' +
      '<div class="week-row">' + dayStrip() + '</div></div>' +
      '<div class="fcard action-card">' + action + '</div></div></div>';
  }

  /* ---------- Профиль ---------- */
  function renderProfile() {
    var o = overallOf(), gb = gearBonus();
    var rows = [["Никнейм", esc(P.nick)], ["Возраст", P.age + " лет"], ["Страна", esc(P.countryName)], ["Пинг", P.ping + " мс"], ["Позиция", P.pos === "ИГЛ" ? "IGL (лидер)" : "Фрагер"], ["Рейтинг", o + " · " + rarityOf(o).n], ["Дивизион", divOf(o) + " · " + divName(divOf(o))], ["Сетап (девайсы)", gb ? "+" + gb + " к рейтингу" : "нищий — +0"], ["PR (Power Rankings)", fnum(P.pr)]];
    var chain = (P.moves && P.moves.length) ? P.moves : [P.countryName];
    var movesHtml = chain.length > 1 ? '<div class="moves-path"><span class="mp-label">Путь: где играл</span><div class="mp-chain">' + chain.map(function (c, i) { return (i ? '<span class="mp-arr">→</span>' : "") + '<span class="mp-c' + (i === chain.length - 1 ? " now" : "") + '">' + esc(c) + '</span>'; }).join("") + '</div></div>' : "";
    return '<div class="two-col"><div>' + cardHtml(false) + '</div><div class="fcard"><p class="panel-title">Профиль игрока</p>' +
      '<div class="kv-list">' + rows.map(function (r) { return '<div class="kv"><span class="k">' + r[0] + '</span><span class="v">' + r[1] + '</span></div>'; }).join("") + '</div>' +
      movesHtml +
      '<div class="earn-total"><span>Весь заработок с&nbsp;турниров</span><b>$' + fnum(P.earnings) + '</b></div>' +
      '<p class="kv-note">Статы растут на&nbsp;тренировках, девайсы из&nbsp;магазина добавляют рейтинг. PR и&nbsp;призовые копятся с&nbsp;турниров.</p></div></div>';
  }

  /* ---------- Карьера ---------- */
  function renderCareer() {
    var o = overallOf(), d = divOf(o);
    var ladder = "";
    for (var i = 5; i >= 1; i--) ladder += '<div class="lad' + (i === d ? " cur" : (i < d ? " done" : "")) + '"><b>Д' + i + '</b><span>' + divName(i) + '</span></div>';
    var hist = loadArr("fnc_history"), played = hist.length, tr = loadObj("fnc_trophies");
    var trIc = { win: "🏆", podium: "🥈", top10: "🎖" }, trNm = { win: "Победы", podium: "Подиумы", top10: "Топ-10" };
    var trophyHtml = Object.keys(trIc).filter(function (k) { return tr[k]; }).map(function (k) { return '<div class="trophy"><span class="tr-ic">' + trIc[k] + '</span><b>' + tr[k] + '</b><span class="tr-nm">' + trNm[k] + '</span></div>'; }).join("");
    return '<div class="fcard"><p class="panel-title">Путь карьеры · Сезон ' + P.season + '</p><h3 class="blk-h">Ты в&nbsp;<span class="accent">Дивизионе ' + d + '</span> · ' + divName(d) + '</h3>' +
      '<p class="blk-sub">Поднимайся с&nbsp;5-го дивизиона в&nbsp;1-й: качай статы, играй турниры по&nbsp;календарю и&nbsp;пробивайся в&nbsp;топ региона.</p>' +
      '<div class="ladder">' + ladder + '</div></div>' +
      '<div class="two-col"><div class="fcard"><p class="panel-title">Сводка сезона</p>' +
      '<div class="kv-list"><div class="kv"><span class="k">Сыграно турниров</span><span class="v">' + played + '</span></div>' +
      '<div class="kv"><span class="k">PR за карьеру</span><span class="v">' + fnum(P.pr) + '</span></div>' +
      '<div class="kv"><span class="k">Заработок</span><span class="v">$' + fnum(P.earnings) + '</span></div>' +
      '<div class="kv"><span class="k">День сезона</span><span class="v">' + P.day + ' / ' + SEASON_LEN + '</span></div></div></div>' +
      '<div class="fcard"><p class="panel-title">Трофеи</p>' + (trophyHtml ? '<div class="trophy-row">' + trophyHtml + '</div>' : '<p class="blk-sub">Пока пусто. Выиграй первый турнир, чтобы получить трофей.</p><div class="trophy-empty">🏆</div>') + '</div></div>';
  }

  /* ---------- Тренировка ---------- */
  function renderTraining() {
    var cards = DRILLS.map(function (dr) {
      return '<button class="drill" data-drill="' + dr.id + '"' + (P.energy < dr.cost ? " disabled" : "") + ' type="button"><h4>' + dr.name + '</h4><p>' + dr.desc + '</p>' +
        '<span class="drill-stat">+ ' + dr.stats.map(function (i) { return SHORT[i]; }).join(" · ") + ' · −' + dr.cost + ' энергии</span></button>';
    }).join("");
    return '<div class="fcard"><p class="panel-title">Тренировка</p><h3 class="blk-h">4 мини-игры · по 5 секунд</h3>' +
      '<p class="blk-sub">Каждая тренировка — отдельная игра на&nbsp;5&nbsp;сек и&nbsp;стоит 30–40 энергии. За&nbsp;успехи капает опыт, статы растут не&nbsp;сразу (≈10 тренировок = +1 к&nbsp;рейтингу). Энергия: <b>' + P.energy + '%</b> — восстанавливается в&nbsp;новом дне.</p>' +
      '<div class="drill-grid">' + cards + '</div></div>' +
      '<div class="fcard"><p class="panel-title">Текущие статы <span class="pt-note">(тонкая полоса — опыт до +1)</span></p><div class="pcard-stats big-stats">' +
      STAT_KEYS.map(function (k, i) { return '<div class="pc-row"><span class="s-k">' + k + '</span><span class="s-v">' + P.stats[i] + '</span><span class="s-bar"><i style="width:' + P.stats[i] + '%;background:var(--cyan)"></i><u class="s-xp" style="width:' + Math.round(P.xp[i]) + '%"></u></span></div>'; }).join("") + '</div></div>';
  }

  /* ---------- Календарь ---------- */
  function renderCalendar() {
    var rows = SCHEDULE.map(function (ev) {
      var state = ev.day < P.day ? "done" : ev.day === P.day ? "now" : "soon";
      var stLbl = state === "done" ? "сыгран" : state === "now" ? "сегодня" : "через " + (ev.day - P.day);
      return '<div class="ev-row ' + state + '"><div class="ev-ic ev-' + ev.type + '">' + (ev.type === "final" ? "★" : ev.type === "major" ? "◆" : ev.type === "cash" ? "$" : "•") + '</div>' +
        '<div class="ev-body"><b>' + ev.name + '</b><span>' + TYPE_LBL[ev.type] + ' · лобби ' + ev.lobby + ' · ' + ev.games + ' игр · фонд $' + fnum(ev.prizeTop) + '</span></div>' +
        '<div class="ev-date">День ' + ev.day + '<span>' + stLbl + '</span></div></div>';
    }).join("");
    return '<div class="fcard"><p class="panel-title">Календарь сезона ' + P.season + ' <span class="pt-note">День ' + P.day + ' / ' + SEASON_LEN + '</span></p>' +
      '<h3 class="blk-h">Сцена сезона</h3><p class="blk-sub">Турниры идут по&nbsp;дням. В&nbsp;свободные дни — тренировки; день двигается кнопкой «Скипнуть день» в&nbsp;Центре.</p>' +
      '<div class="ev-list">' + rows + '</div></div>';
  }

  /* ---------- Таблицы (дивизион) ---------- */
  function renderTables() {
    var o = overallOf(), d = divOf(o);
    var bots = [["SwizzY", 94], ["panzer", 90], ["Kirillian", 85], ["m0nke", 79], ["ZetaFN", 73], ["kryptoN", 67], ["asterix", 62], ["volt", 58]];
    var all = bots.map(function (b) { return [b[0], b[1], false]; }); all.push([esc(P.nick), o, true]);
    all.sort(function (a, b) { return b[1] - a[1]; });
    var rows = all.map(function (r, i) { return '<tr class="' + (r[2] ? "me" : "") + '"><td>' + (i + 1) + '</td><td>' + r[0] + '</td><td>' + r[1] + '</td><td>Д' + divOf(r[1]) + '</td></tr>'; }).join("");
    return '<div class="fcard"><p class="panel-title">Таблица региона · ' + esc(P.countryName) + '</p><h3 class="blk-h">Твоя позиция по&nbsp;рейтингу</h3>' +
      '<table class="lb"><thead><tr><th>#</th><th>Игрок</th><th>Рейтинг</th><th>Дивизион</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      '<p class="kv-note">Соперники — демо. Поднимай рейтинг тренировками и&nbsp;турнирами, чтобы обойти их.</p></div>';
  }

  /* ---------- PR ---------- */
  var PRO_PR = [["vic0", 3200], ["Malibuca", 2980], ["shxrk", 2610], ["Peterbot", 2550], ["Pixie", 2300], ["SwizzY", 2180], ["Scroll", 2020], ["Sky", 1870], ["Th0masHD", 1600], ["Setty", 1420]];
  function renderPR() {
    var list = PRO_PR.map(function (x) { return { n: x[0], pr: x[1], me: false }; });
    list.push({ n: P.nick, pr: P.pr, me: true });
    list.sort(function (a, b) { return b.pr - a.pr; });
    var myRank = 1; for (var i = 0; i < list.length; i++) { if (list[i].me) { myRank = i + 1; break; } }
    var rows = list.map(function (r, i) { return '<tr class="' + (r.me ? "me" : "") + '"><td>' + (i + 1) + '</td><td>' + esc(r.n) + '</td><td>' + fnum(r.pr) + '</td></tr>'; }).join("");
    return '<div class="fcard"><p class="panel-title">Power Rankings</p>' +
      '<div class="big-stat"><b>' + fnum(P.pr) + '</b><span>твои PR-очки · место #' + myRank + ' в рейтинге сцены</span></div>' +
      '<p class="blk-sub">PR копятся с&nbsp;каждого турнира: чем выше место и&nbsp;весомее событие (Мейджор и&nbsp;финал весят больше кубка), тем больше очков. Это и&nbsp;есть твой вес на&nbsp;сцене.</p></div>' +
      '<div class="fcard"><p class="panel-title">Рейтинг сцены по PR</p><table class="lb"><thead><tr><th>#</th><th>Игрок</th><th>PR</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  /* ---------- Заработок ---------- */
  var PRO_EARN = [["vic0", 458253], ["Malibuca", 433541], ["shxrk", 359960], ["t3eny", 350546], ["Pixie", 322786], ["SwizzY", 317725], ["Scroll", 295893], ["Sky", 277037], ["Peterbot", 195391], ["PabloWingu", 150323]];
  function renderEarnings() {
    var list = PRO_EARN.map(function (x) { return { n: x[0], e: x[1], me: false }; });
    list.push({ n: P.nick, e: P.earnings, me: true });
    list.sort(function (a, b) { return b.e - a.e; });
    var myRank = 1; for (var i = 0; i < list.length; i++) { if (list[i].me) { myRank = i + 1; break; } }
    var rows = list.map(function (r, i) { return '<tr class="' + (r.me ? "me" : "") + '"><td>' + (i + 1) + '</td><td>' + esc(r.n) + '</td><td>$' + fnum(r.e) + '</td></tr>'; }).join("");
    var hist = loadArr("fnc_history").filter(function (h) { return h.prize; });
    var pay = hist.length ? '<div class="fcard"><p class="panel-title">Крупнейшие выплаты</p><div class="hist-list">' +
      hist.slice().sort(function (a, b) { return b.prize - a.prize; }).slice(0, 6).map(function (h) { return '<div class="hist-row"><div class="hr-place">#' + h.rank + '</div><div class="hr-body"><b>' + esc(h.name) + '</b><span>место #' + h.rank + ' из ' + h.lobby + '</span></div><div class="hr-prize">$' + fnum(h.prize) + '</div></div>'; }).join("") + '</div></div>' : "";
    return '<div class="fcard"><p class="panel-title">Призовые</p>' +
      '<div class="big-stat"><b>$' + fnum(P.earnings) + '</b><span>весь заработок с&nbsp;турниров · место #' + myRank + ' среди игроков</span></div>' +
      '<p class="blk-sub">Каждое попадание в&nbsp;топ на&nbsp;турнире приносит призовые. Крупные деньги — на&nbsp;Мейджорах и&nbsp;финалах.</p></div>' +
      '<div class="fcard"><p class="panel-title">Рейтинг по призовым</p><table class="lb"><thead><tr><th>#</th><th>Игрок</th><th>Призовые</th></tr></thead><tbody>' + rows + '</tbody></table></div>' + pay;
  }

  /* ---------- Магазин (девайсы + переезд) ---------- */
  var RELO_COST = 5000;
  var RELO = [
    { c: "Германия", iso: "de", ping: 9 }, { c: "Великобритания", iso: "gb", ping: 17 }, { c: "Франция", iso: "fr", ping: 17 },
    { c: "Швеция", iso: "se", ping: 27 }, { c: "Испания", iso: "es", ping: 31 }, { c: "Польша", iso: "pl", ping: 21 },
    { c: "США", iso: "us", ping: 95 }, { c: "Канада", iso: "ca", ping: 99 }, { c: "Бразилия", iso: "br", ping: 120 },
    { c: "Япония", iso: "jp", ping: 230 }, { c: "Южная Корея", iso: "kr", ping: 210 }, { c: "Австралия", iso: "au", ping: 290 }, { c: "ОАЭ", iso: "ae", ping: 70 }
  ];
  function moneyOk(p) { return P.balance >= p; }
  function renderShop() {
    var cards = GEAR.map(function (g) {
      var cur = gearTier(g.id), curT = g.tiers[cur], next = g.tiers[cur + 1];
      return '<div class="shop-card"><div class="shop-ic">' + g.ic + '</div><div class="shop-body"><b>' + g.n + '</b>' +
        '<span class="shop-cur">Сейчас: ' + curT.n + (curT.b ? ' · +' + curT.b + ' рейтинг' : '') + '</span>' +
        (next ? '<div class="shop-next"><span>' + next.n + ' · <b class="accent">+' + next.b + '</b> рейтинг</span>' +
          '<button class="btn btn-sm' + (moneyOk(next.p) ? ' btn-primary' : ' btn-off') + '" data-buy-gear="' + g.id + '"' + (moneyOk(next.p) ? '' : ' disabled') + ' type="button">$' + fnum(next.p) + '</button></div>'
          : '<span class="shop-max">Максимум ⭐</span>') + '</div></div>';
    }).join("");
    return '<div class="fcard"><div class="shop-head"><div><p class="panel-title">Магазин · девайсы</p><h3 class="blk-h">Апгрейдь сетап</h3></div><div class="shop-bal"><span>Баланс</span><b>$' + fnum(P.balance) + '</b></div></div>' +
      '<p class="blk-sub">Чем лучше девайсы — тем выше рейтинг и&nbsp;результаты. С&nbsp;нищим сетапом играешь хуже. Деньги капают с&nbsp;турниров. Сейчас сетап даёт <b class="accent">+' + gearBonus() + '</b> к&nbsp;рейтингу.</p>' +
      '<div class="shop-grid">' + cards + '</div></div>' +
      '<div class="fcard"><p class="panel-title">Переезд</p><div class="shop-card relo"><div class="shop-ic">✈️</div><div class="shop-body"><b>Переезд в другую страну</b>' +
      '<span class="shop-cur">Сменишь страну и&nbsp;регион. В&nbsp;профиле останется история переездов.</span>' +
      '<div class="shop-next"><span>Сейчас: <b>' + esc(P.countryName) + '</b></span><button class="btn btn-sm' + (moneyOk(RELO_COST) ? ' btn-primary' : ' btn-off') + '" id="reloBtn"' + (moneyOk(RELO_COST) ? '' : ' disabled') + ' type="button">$' + fnum(RELO_COST) + '</button></div></div></div></div>';
  }
  function renderRelocation() {
    var cards = RELO.map(function (r) {
      var cur = r.c === P.countryName;
      return '<button class="relo-opt' + (cur ? " cur" : "") + '" data-relo-to="' + r.iso + "|" + r.c + "|" + r.ping + '"' + (cur ? " disabled" : "") + ' type="button">' +
        '<img class="flag" src="' + flagUrl(r.iso) + '" alt=""><span class="relo-c">' + esc(r.c) + '</span><span class="relo-p">' + (cur ? "ты здесь" : "пинг " + r.ping + " мс") + '</span></button>';
    }).join("");
    return '<div class="fcard"><p class="panel-title">Переезд · $' + fnum(RELO_COST) + '</p><h3 class="blk-h">Куда переезжаешь?</h3>' +
      '<p class="blk-sub">Выбери новую страну — сменится регион и&nbsp;пинг, а&nbsp;в&nbsp;профиле появится история переездов.</p>' +
      '<div class="relo-grid">' + cards + '</div><button class="btn btn-ghost btn-block" id="reloBack" type="button">← Назад в магазин</button></div>';
  }
  function wireShop() {
    Array.prototype.forEach.call(document.querySelectorAll("[data-buy-gear]"), function (b) { b.addEventListener("click", function () { buyGear(b.getAttribute("data-buy-gear")); }); });
    Array.prototype.forEach.call(document.querySelectorAll("[data-relo-to]"), function (b) { b.addEventListener("click", function () { doRelo(b.getAttribute("data-relo-to")); }); });
    var rb = $("#reloBtn"); if (rb) rb.addEventListener("click", function () { $("#tabContent").innerHTML = renderRelocation(); wireShop(); window.scrollTo({ top: 0, behavior: "smooth" }); });
    var back = $("#reloBack"); if (back) back.addEventListener("click", function () { $("#tabContent").innerHTML = renderShop(); wireShop(); });
  }
  function buyGear(id) {
    var g2 = GEAR.filter(function (x) { return x.id === id; })[0]; if (!g2) return;
    var cur = gearTier(id), next = g2.tiers[cur + 1]; if (!next) return;
    if (P.balance < next.p) { flash("Не хватает денег."); return; }
    P.balance -= next.p; P.gear[id] = cur + 1; save(); buildBar();
    $("#tabContent").innerHTML = renderShop(); wireShop();
    flash(g2.n + ": " + next.n + " · +" + next.b + " к рейтингу!");
  }
  function doRelo(val) {
    if (P.balance < RELO_COST) { flash("Не хватает денег на переезд."); return; }
    var parts = val.split("|"), iso = parts[0], c = parts[1], ping = +parts[2];
    if (c === P.countryName) return;
    P.balance -= RELO_COST;
    if (!P.moves || !P.moves.length) P.moves = [P.countryName];
    P.moves.push(c);
    P.countryName = c; P.flag = iso; P.ping = ping;
    localStorage.setItem("fnc_country_name", c); localStorage.setItem("fnc_country_flag", iso); localStorage.setItem("fnc_ping", ping);
    save(); buildBar();
    $("#tabContent").innerHTML = renderShop(); wireShop();
    flash("Переезд в " + c + "! Новый пинг " + ping + " мс.");
  }

  /* ---------- История ---------- */
  function renderHistory() {
    var hist = loadArr("fnc_history");
    if (!hist.length) return '<div class="fcard"><p class="panel-title">История матчей</p><div class="empty-state"><div class="es-ic">🎮</div><h3>Пока нет сыгранных матчей</h3><p>Сыграй первый турнир — и&nbsp;результаты появятся здесь.</p></div></div>';
    var best = hist.reduce(function (m, h) { return Math.min(m, h.rank); }, 999);
    var wins = hist.filter(function (h) { return h.vr > 0; }).length;
    var rows = hist.map(function (h) {
      var dt = new Date(h.date), ds = dt.getDate() + " " + MON[dt.getMonth()];
      var badge = h.rank === 1 ? "t-gold" : h.rank <= 3 ? "t-silver" : h.rank <= 10 ? "t-blue" : "";
      return '<div class="hist-row"><div class="hr-place ' + badge + '">#' + h.rank + '</div>' +
        '<div class="hr-body"><b>' + esc(h.name) + '</b><span>' + ds + ' · ' + h.total + ' очк · ' + h.elims + ' килл · лучшее #' + h.best + (h.vr ? " · 👑" + h.vr : "") + (h.pr ? " · +" + h.pr + " PR" : "") + '</span></div>' +
        '<div class="hr-prize">' + (h.prize ? "$" + fnum(h.prize) : "—") + '</div></div>';
    }).join("");
    return '<div class="fcard"><p class="panel-title">История матчей</p>' +
      '<div class="hist-sum"><div><b>' + hist.length + '</b><span>турниров</span></div><div><b>#' + best + '</b><span>лучшее место</span></div><div><b>' + wins + '</b><span>👑 викторий</span></div></div>' +
      '<div class="hist-list">' + rows + '</div></div>';
  }

  /* ========================= ТРЕНИРОВКИ: 4 мини-игры ========================= */
  var DRILLS = [
    { id: "aim", name: "Аим-тренировка", mode: "aim", cost: 30, xpMult: 3, stats: [0, 3], desc: "Лови цели как можно быстрее — реакция и точность." },
    { id: "build", name: "Стройка / Эдит", mode: "edit", cost: 35, xpMult: 5, stats: [1, 3], desc: "Редачь стенку как в Fortnite: выдели нужные ячейки и подтверди эдит." },
    { id: "scrim", name: "Скримы", mode: "react", cost: 40, xpMult: 5, stats: [0, 2, 3], desc: "Матч-темп: жми загорающуюся ячейку мгновенно." },
    { id: "review", name: "Разбор игр", mode: "odd", cost: 30, xpMult: 5, stats: [2, 4], desc: "Гейм-сенс: найди отличающуюся ячейку в сетке." }
  ];
  var modal = $("#trainModal"), tmZone = $("#tmZone"), tmTime = $("#tmTime"), tmHits = $("#tmHits"), tmResult = $("#tmResult"), tmStart = $("#tmStart");
  var GAME_SECS = 5;
  var gameTimer = null, hits = 0, timeLeft = GAME_SECS, curDrill = null;
  var grid = null, targetSet = [], litIdx = -1, oddIdx = -1;
  function setHudLabel(txt) { var l = $("#tmHitsLabel"); if (l) l.textContent = txt; }
  function clearZone() { tmZone.querySelectorAll(".tm-target, .tm-grid").forEach(function (t) { t.remove(); }); grid = null; }
  function closeModal() { modal.hidden = true; if (gameTimer) { clearInterval(gameTimer); gameTimer = null; } clearZone(); }
  Array.prototype.forEach.call(document.querySelectorAll("[data-close]"), function (el) { el.addEventListener("click", closeModal); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });
  var HUD = { aim: "Попаданий", edit: "Правок", react: "Реакций", odd: "Найдено" };

  function openTrain(dr) {
    if (!dr) return;
    curDrill = dr;
    if (P.energy < dr.cost) { flash("Мало энергии (нужно " + dr.cost + "). Скипни день в Центре."); return; }
    $("#tmTitle").textContent = dr.name;
    $("#tmDesc").textContent = dr.desc;
    setHudLabel(HUD[dr.mode] || "Счёт");
    tmResult.hidden = true; tmStart.hidden = false; tmStart.textContent = "Начать";
    clearZone();
    hits = 0; timeLeft = GAME_SECS; tmHits.textContent = "0"; tmTime.textContent = GAME_SECS;
    modal.hidden = false;
  }
  tmStart.addEventListener("click", startGame);

  /* --- aim: клики по целям --- */
  function spawnTarget() {
    tmZone.querySelectorAll(".tm-target").forEach(function (t) { t.remove(); });
    var t = document.createElement("button"); t.className = "tm-target"; t.type = "button";
    var sz = 46, pad = 6, w = tmZone.clientWidth - sz - pad * 2, h = tmZone.clientHeight - sz - pad * 2;
    t.style.left = (pad + Math.random() * Math.max(0, w)) + "px";
    t.style.top = (pad + Math.random() * Math.max(0, h)) + "px";
    t.addEventListener("pointerdown", function (e) { e.preventDefault(); if (!gameTimer) return; hits++; tmHits.textContent = hits; spawnTarget(); });
    tmZone.appendChild(t);
  }

  /* --- общий 3x3 грид --- */
  function build3x3(cls, handler) {
    clearZone();
    var gr = document.createElement("div"); gr.className = "tm-grid " + cls;
    for (var i = 0; i < 9; i++) {
      var c = document.createElement("button"); c.type = "button"; c.className = "tm-cell"; c.setAttribute("data-i", i);
      c.addEventListener("pointerdown", handler); gr.appendChild(c);
    }
    tmZone.appendChild(gr); grid = gr; return gr;
  }
  function cellsOf() { return grid.querySelectorAll(".tm-cell"); }

  /* --- edit: эдит стенки как в Fortnite (выдели ячейки = подтверди эдит) --- */
  var EDIT_PATTERNS = [[4], [7], [1], [3, 4, 5], [1, 4, 7], [4, 7], [1, 4], [0, 4, 8], [2, 4, 6], [3, 4], [4, 5], [0, 1, 3, 4], [4, 5, 7, 8], [6, 7, 3, 4]];
  function newEditRound() {
    var cells = cellsOf();
    cells.forEach(function (c) { c.classList.remove("target", "cut"); });
    targetSet = EDIT_PATTERNS[Math.floor(Math.random() * EDIT_PATTERNS.length)].slice().sort(function (a, b) { return a - b; });
    targetSet.forEach(function (i) { cells[i].classList.add("target"); });
  }
  function onEditCell(e) {
    e.preventDefault(); if (!gameTimer) return;
    e.currentTarget.classList.toggle("cut");
    var cut = []; cellsOf().forEach(function (c, i) { if (c.classList.contains("cut")) cut.push(i); });
    cut.sort(function (a, b) { return a - b; });
    if (cut.length === targetSet.length && cut.join() === targetSet.join()) { hits++; tmHits.textContent = hits; flashCell(); newEditRound(); }
  }
  function flashCell() { grid.classList.add("ok"); setTimeout(function () { if (grid) grid.classList.remove("ok"); }, 120); }

  /* --- react: жми загорающуюся ячейку --- */
  function litOne() { var cells = cellsOf(); cells.forEach(function (c) { c.classList.remove("lit"); }); litIdx = Math.floor(Math.random() * 9); cells[litIdx].classList.add("lit"); }
  function onReactCell(e) { e.preventDefault(); if (!gameTimer) return; if (+e.currentTarget.getAttribute("data-i") === litIdx) { hits++; tmHits.textContent = hits; litOne(); } }

  /* --- odd: найди отличающуюся ячейку --- */
  function newOddRound() { var cells = cellsOf(); cells.forEach(function (c) { c.classList.remove("odd"); }); oddIdx = Math.floor(Math.random() * 9); cells[oddIdx].classList.add("odd"); }
  function onOddCell(e) { e.preventDefault(); if (!gameTimer) return; if (+e.currentTarget.getAttribute("data-i") === oddIdx) { hits++; tmHits.textContent = hits; newOddRound(); } }

  function startGame() {
    tmStart.hidden = true; tmResult.hidden = true; hits = 0; timeLeft = GAME_SECS; tmHits.textContent = "0"; tmTime.textContent = GAME_SECS;
    var m = curDrill.mode;
    if (m === "edit") { build3x3("edit-wall", onEditCell); newEditRound(); }
    else if (m === "react") { build3x3("react-grid", onReactCell); litOne(); }
    else if (m === "odd") { build3x3("odd-grid", onOddCell); newOddRound(); }
    else { clearZone(); spawnTarget(); }
    gameTimer = setInterval(function () {
      timeLeft--; tmTime.textContent = timeLeft;
      if (timeLeft <= 0) { clearInterval(gameTimer); gameTimer = null; endGame(); }
    }, 1000);
  }
  function endGame() {
    clearZone();
    var oOld = overallOf();
    var gx = Math.min(50, Math.max(1, Math.round(hits * (curDrill.xpMult || 3))));
    var ups = [], gains = [];
    curDrill.stats.forEach(function (i) {
      P.xp[i] += gx; gains.push(SHORT[i] + " +" + gx);
      while (P.xp[i] >= XP_PER && P.stats[i] < 99) { P.stats[i]++; P.xp[i] -= XP_PER; ups.push(SHORT[i] + " +1"); }
      if (P.stats[i] >= 99) P.xp[i] = 0;
    });
    P.energy = Math.max(0, P.energy - curDrill.cost); P.mood = Math.min(100, P.mood + 2);
    save(); localStorage.setItem("fnc_trainings", numk("fnc_trainings", 0) + 1); var oNew = overallOf();
    tmResult.hidden = false;
    tmResult.innerHTML = '<div class="tm-res-big">' + hits + " · " + (HUD[curDrill.mode] || "очков").toLowerCase() + '</div>' +
      '<div class="tm-res-gains">' + gains.join(" · ") + ' опыта</div>' +
      (ups.length ? '<div class="tm-res-up">⬆ ' + ups.join(" · ") + '</div>' : '<div class="tm-res-up muted">копи опыт — статы растут не сразу</div>') +
      '<div class="tm-res-ovr">Рейтинг: ' + oOld + ' → <b>' + oNew + '</b> · Энергия: ' + P.energy + '% · −' + curDrill.cost + '</div>' +
      '<button class="btn btn-primary" type="button" id="tmAgain">Готово</button>';
    $("#tmAgain").addEventListener("click", function () { closeModal(); buildBar(); setTab(cur); });
  }

  /* ========================= ТУРНИР (система очков как на FortniteTracker) ========================= */
  function rr(a, b) { return a + Math.random() * (b - a); }
  function placePts(place) { // накопительно: VR +9, топ2-5 +4/порог, топ6-25 +2/порог
    var p = 0, t; if (place === 1) p += 9;
    for (t = 2; t <= 5; t++) if (place <= t) p += 4;
    for (t = 6; t <= 25; t++) if (place <= t) p += 2;
    return p;
  }
  // пошаговый симулятор: лобби считается по играм, стратегия игрока влияет на его ролл
  function newSim(ev) {
    var me = overallOf(), N = ev.lobby, skill = [me];
    for (var i = 1; i < N; i++) skill.push(Math.max(35, Math.min(99, Math.round(me + rr(-16, 12)))));
    var totals = []; for (var z = 0; z < N; z++) totals.push(0);
    return { ev: ev, N: N, skill: skill, totals: totals, myElims: 0, best: N, vr: 0, log: [], g: 0 };
  }
  function simGames(sim, count, mod) {
    var out = [];
    for (var c = 0; c < count && sim.g < sim.ev.games; c++) {
      sim.g++;
      var order = sim.skill.map(function (s, idx) {
        var noise = idx === 0 ? rr(-20, 20) * mod.varMul + mod.perf : rr(-20, 20);
        return { idx: idx, r: s + noise };
      }).sort(function (a, b) { return b.r - a.r; });
      for (var p = 0; p < sim.N; p++) {
        var idx = order[p].idx, place = p + 1;
        var base = Math.max(0, Math.round((order[p].r - sim.skill[idx] + 10) / 8) + (place <= 10 ? 1 : 0));
        var el = idx === 0 ? Math.max(0, base + mod.killBias) : base;
        sim.totals[idx] += placePts(place) + el * 4;
        if (idx === 0) {
          sim.myElims += el; if (place < sim.best) sim.best = place; if (place === 1) sim.vr++;
          var row = { g: sim.g, place: place, el: el, pts: placePts(place) + el * 4 };
          sim.log.push(row); out.push(row);
        }
      }
    }
    return out;
  }
  function myRankNow(sim) { var t = sim.totals[0], rank = 1; for (var j = 1; j < sim.N; j++) if (sim.totals[j] > t) rank++; return rank; }
  function finishSim(sim) { return { total: sim.totals[0], elims: sim.myElims, best: sim.best, vr: sim.vr, rank: myRankNow(sim), lobby: sim.N, games: sim.ev.games, log: sim.log }; }

  // точки высадки на карте (как в Fortnite) — heat задаёт модификатор, завязан на статы
  // СТР=0 СТРОЙ=1 РОТ=2 КЛЧ=3 IQ=4 СТБ=5
  var HEAT = {
    hot: { lbl: "Жарко", c: "#ff6b4a", perf: 0, varMul: 1.32, killBias: 2, fit: 0 },
    mid: { lbl: "Средне", c: "#ffd84d", perf: 1, varMul: 1, killBias: 0, fit: -1 },
    safe: { lbl: "Тихо", c: "#3fe07a", perf: 0, varMul: 0.78, killBias: -1, fit: 5 }
  };
  var POIS = [ // координаты в % квадрата карты (фон — реальная карта Fortnite)
    { id: "lifty", n: "Lifty Lodge", heat: "safe", x: 34, y: 14 },
    { id: "freaky", n: "Freaky Fields", heat: "mid", x: 65, y: 19 },
    { id: "wonkee", n: "Wonkeeland", heat: "mid", x: 80, y: 28 },
    { id: "chopped", n: "Chopped Shop", heat: "safe", x: 19, y: 31 },
    { id: "nightmare", n: "Nightmare Neighborhood", heat: "hot", x: 44, y: 32 },
    { id: "greenhill", n: "Green Hill Zone", heat: "mid", x: 32, y: 47 },
    { id: "reality", n: "Reality's Reign", heat: "hot", x: 64, y: 47 },
    { id: "golden", n: "Golden Grove", heat: "mid", x: 83, y: 53 },
    { id: "stone", n: "Stone Sanctum", heat: "hot", x: 49, y: 63 },
    { id: "shaken", n: "Shaken Sanctuary", heat: "mid", x: 71, y: 67 },
    { id: "heatwave", n: "Heatwave Harbor", heat: "safe", x: 23, y: 68 },
    { id: "sunken", n: "Sunken Shores", heat: "safe", x: 46, y: 80 },
    { id: "cluster", n: "Cluster Coast", heat: "safe", x: 78, y: 81 }
  ];
  // забег по зонам: 4 этапа (действие → проходят зоны → действие)
  var PHASES = [
    { title: "Ранняя игра", sub: "Ты высадился. Как играешь первые зоны?", opts: [
      { id: "fight", ic: "⚔️", n: "Драться за точку", d: "Забрать лут в бою — киллы, но риск. Любит Стрельбу.", fit: 0, perf: 0, varMul: 1.25, killBias: 2 },
      { id: "loot", ic: "🎒", n: "Тихо лутаться", d: "Собрать всё без боёв, баланс. Любит Гейм-IQ.", fit: 4, perf: 1, varMul: 1, killBias: 0 },
      { id: "erot", ic: "🧭", n: "Сразу ротация", d: "Уйти в зону пораньше, безопасно. Любит Ротации.", fit: 2, perf: 0, varMul: 0.82, killBias: -1 }
    ] },
    { title: "Мид-гейм", sub: "Зона сжимается. Что делаешь в середине?", opts: [
      { id: "aggro", ic: "🔫", n: "Искать бои", d: "Добивать команды ради киллов. Любит Клатч.", fit: 3, perf: 0, varMul: 1.2, killBias: 2 },
      { id: "mats", ic: "🧱", n: "Копить материалы", d: "Фармить и строить экономику. Любит Стройку.", fit: 1, perf: 1, varMul: 1, killBias: 0 },
      { id: "mrot", ic: "🛡️", n: "Ранние ротации", d: "Держаться края зоны, плейсмент. Любит Ротации.", fit: 2, perf: 0, varMul: 0.82, killBias: -1 }
    ] },
    { title: "Поздняя игра", sub: "Остались сильнейшие. Как берёшь позицию?", opts: [
      { id: "high", ic: "⛰️", n: "Забрать хайграунд", d: "Строить вверх, держать высоту. Любит Стройку.", fit: 1, perf: 1, varMul: 1, killBias: 0 },
      { id: "take", ic: "💥", n: "Отжать позицию", d: "Выбить соперников с точки. Любит Клатч.", fit: 3, perf: 0, varMul: 1.22, killBias: 2 },
      { id: "passive", ic: "🧊", n: "На плейсмент", d: "Не лезть, тянуть место. Любит Стабильность.", fit: 5, perf: 0, varMul: 0.8, killBias: -1 }
    ] },
    { title: "Эндгейм", sub: "Финальный круг. Решающий момент.", opts: [
      { id: "push", ic: "🚀", n: "Пушить на 1 место", d: "Идти на победу, максимум риска. Любит Клатч.", fit: 3, perf: 2, varMul: 1.3, killBias: 2 },
      { id: "place", ic: "🎯", n: "Чистый плейсмент", d: "Отсидеться ради очков за место. Любит Стабильность.", fit: 5, perf: 1, varMul: 0.75, killBias: -1 },
      { id: "read", ic: "🧠", n: "Читать зону", d: "Угадать круг и занять центр. Любит Гейм-IQ.", fit: 4, perf: 1, varMul: 0.9, killBias: 0 }
    ] }
  ];
  function heatOf(id) { return HEAT[(POIS.filter(function (p) { return p.id === id; })[0] || POIS[0]).heat]; }
  function poiOf(id) { return POIS.filter(function (p) { return p.id === id; })[0] || POIS[0]; }
  // POI-кнопки поверх реальной карты (фон задаёт CSS .br-map)
  function poiMarkers(selId) {
    return POIS.map(function (p) {
      var h = HEAT[p.heat];
      return '<button class="br-poi' + (p.id === selId ? " on" : "") + '" data-poi="' + p.id + '" style="left:' + p.x + '%;top:' + p.y + '%" type="button">' +
        '<span class="br-poi-dot" style="background:' + h.c + '"></span><span class="br-poi-lbl">' + esc(p.n) + '</span></button>';
    }).join("");
  }
  function fitBonus(idx) { return idx < 0 ? 0 : (P.stats[idx] - 60) / 6; }
  function addMod(m, o) { m.perf += (o.perf || 0) + fitBonus(o.fit != null ? o.fit : -1); m.varMul *= (o.varMul || 1); m.killBias += (o.killBias || 0); return m; }
  function byId2(arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return arr[0]; }
  function prGain(rank, lobby, prW) { var pct = 1 - (rank - 1) / lobby; return Math.round(pct * pct * 140 * prW); }
  function prizeOf(rank, lobby, top) {
    if (rank === 1) return top; if (rank <= 3) return Math.round(top * 0.5); if (rank <= 5) return Math.round(top * 0.3);
    if (rank <= 10) return Math.round(top * 0.15); if (rank <= 25) return Math.round(top * 0.06);
    if (rank <= lobby * 0.5) return Math.round(top * 0.02); return 0;
  }
  var tourModal = $("#tourModal"), pendingDay = false;
  window.addEventListener("resize", function () { if (!tourModal.hidden && tState && tState.zones) layoutZone(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-tclose]"), function (el) { el.addEventListener("click", function () { tourModal.hidden = true; if (pendingDay) { pendingDay = false; advanceDay(); } }); });
  var tState = null;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function dist(ax, ay, bx, by) { var dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
  function optCard(o) { return '<button class="t-opt" data-opt="' + o.id + '" type="button"><span class="t-opt-ic">' + o.ic + '</span><b>' + o.n + '</b><span>' + o.d + '</span></button>'; }

  // Этап 1 — карта высадки (реальная карта Fortnite, клик по локации)
  function tourCard() { return tourModal.querySelector(".tour-card"); }
  function openTournament(ev) {
    tState = { ev: ev, poi: null };
    $("#tourTitle").textContent = ev.name;
    var c = tourCard(); if (c) c.classList.add("tour-big");
    pendingDay = false;
    tourModal.hidden = false;
    renderMap();
  }
  function renderMap() {
    var ev = tState.ev, sel = tState.poi, p = sel ? poiOf(sel) : null, h = sel ? heatOf(sel) : null;
    $("#tourBody").innerHTML =
      '<div class="br-layout"><div class="br-side">' +
        '<p class="t-ev-sub">' + TYPE_LBL[ev.type] + ' · ' + ev.lobby + ' игроков · фонд от $' + fnum(ev.prizeTop) + '</p>' +
        '<h4 class="t-q">Куда высаживаешься?</h4>' +
        '<div class="map-legend"><span><i style="background:#ff6b4a"></i>Жарко</span><span><i style="background:#ffd84d"></i>Средне</span><span><i style="background:#3fe07a"></i>Тихо</span></div>' +
        '<div class="map-pick">' + (p ? 'Высадка: <b style="color:' + h.c + '">' + esc(p.n) + '</b>' + (h.fit >= 0 ? ' · тащит ' + SHORT[h.fit] : '') : 'Нажми на локацию на карте') + '</div>' +
        '<div class="br-side-foot"><button class="btn btn-primary btn-block" id="tDrop" type="button"' + (sel ? "" : " disabled") + '>' + (sel ? "Высадиться →" : "Выбери локацию") + '</button></div>' +
      '</div>' +
      '<div class="br-stage"><div class="br-map br-pick" id="brMap"><div class="br-pois">' + poiMarkers(sel) + '</div></div></div></div>';
  }
  // делегирование кликов (навешивается один раз)
  $("#tourBody").addEventListener("click", function (e) {
    if (!tState) return;
    var poi = e.target.closest("[data-poi]");
    if (poi) { tState.poi = poi.getAttribute("data-poi"); renderMap(); return; }
    if (e.target.id === "tDrop" && !e.target.disabled) { startRun(); return; }
    var opt = e.target.closest(".t-opt");
    if (opt && opt.parentNode.getAttribute("data-grp") === "phase") { applyPhase(opt.getAttribute("data-opt")); return; }
    if (e.target.id === "tourDone") { tourModal.hidden = true; pendingDay = false; advanceDay(); }
  });

  // ===== Battle Royale на карте: зоны + игроки-стрелочки =====
  function startRun() {
    var ev = tState.ev, drop = poiOf(tState.poi), N = ev.lobby;
    var zones = [{ x: 50, y: 48, r: 45 }];
    for (var z = 1; z < 8; z++) {
      var prev = zones[z - 1], nr = prev.r * 0.66, a = rr(0, Math.PI * 2), d = (prev.r - nr) * Math.random();
      zones.push({ x: clamp(prev.x + Math.cos(a) * d, nr, 100 - nr), y: clamp(prev.y + Math.sin(a) * d, nr, 100 - nr), r: nr });
    }
    var players = [{ x: drop.x, y: drop.y, alive: true, me: true, skill: overallOf(), kills: 0 }];
    for (var i = 1; i < N; i++) {
      var sp = POIS[Math.floor(Math.random() * POIS.length)];
      players.push({ x: clamp(sp.x + rr(-7, 7), 2, 98), y: clamp(sp.y + rr(-7, 7), 2, 98), alive: true, me: false, skill: clamp(Math.round(overallOf() + rr(-16, 12)), 35, 99), kills: 0 });
    }
    tState.zones = zones; tState.players = players; tState.zoneIdx = 0; tState.alive = N; tState.kills = 0;
    tState.me = players[0]; tState.phaseIdx = 0;
    tState.baseMod = addMod({ perf: 0, varMul: 1, killBias: 0 }, heatOf(tState.poi));
    tState.aliveCurve = [N, Math.round(N * 0.62), Math.round(N * 0.4), Math.round(N * 0.26), Math.round(N * 0.16), Math.round(N * 0.09), Math.round(N * 0.04), 1];
    $("#tourBody").innerHTML =
      '<div class="br-layout"><div class="br-side">' +
        '<div class="br-side-head" id="brPhase">Высадка · ' + esc(drop.n) + '</div>' +
        '<div class="br-stats"><div><b id="brAlive">' + N + '</b><span>живых</span></div><div><b id="brZone">1</b><span>зона/8</span></div><div><b id="brKills">0</b><span>киллы</span></div></div>' +
        '<div id="tMid"></div>' +
      '</div>' +
      '<div class="br-stage"><div class="br-map" id="brMap"><div class="br-zone" id="brZoneC"></div><div class="br-players" id="brPlayers">' +
      players.map(function (p) { return '<i class="br-arrow' + (p.me ? " me" : "") + '" style="left:' + p.x + '%;top:' + p.y + '%"></i>'; }).join("") + '</div></div></div></div>';
    layoutZone(); requestAnimationFrame(layoutZone); setTimeout(layoutZone, 40);
    showPhase(0);
  }
  function layoutZone() {
    var map = $("#brMap"), zc = $("#brZoneC"); if (!map || !zc) return;
    var z = tState.zones[tState.zoneIdx], w = map.clientWidth || map.getBoundingClientRect().width;
    var d = (z.r * 2 / 100) * w;
    zc.style.width = d + "px"; zc.style.height = d + "px"; zc.style.left = z.x + "%"; zc.style.top = z.y + "%";
  }
  function showPhase(i) {
    var ph = PHASES[i], lbl = $("#brPhase"); if (lbl) lbl.textContent = ph.title;
    $("#tMid").innerHTML = '<div class="t-decision"><p class="t-dec-q"><b>' + ph.title + '.</b> ' + ph.sub + '</p>' +
      '<div class="t-opts" data-grp="phase">' + ph.opts.map(optCard).join("") + '</div></div>';
  }
  function applyPhase(optId) {
    var ph = PHASES[tState.phaseIdx], opt = byId2(ph.opts, optId);
    tState.curMod = addMod({ perf: tState.baseMod.perf, varMul: tState.baseMod.varMul, killBias: tState.baseMod.killBias }, opt);
    $("#tMid").innerHTML = '<div class="t-zoneflow">Шторм сужается…</div>';
    runZones(2, function () {
      tState.phaseIdx++;
      if (!tState.me.alive || tState.zoneIdx >= tState.zones.length - 1) { finishRun(); return; }
      if (tState.phaseIdx < PHASES.length) showPhase(tState.phaseIdx);
      else finishRun();
    });
  }
  function runZones(n, done) {
    var k = 0;
    (function next() {
      if (k >= n || !tState.me.alive || tState.zoneIdx >= tState.zones.length - 1) { done(); return; }
      k++; stepZone(); setTimeout(next, 1350);
    })();
  }
  function stepZone() {
    tState.zoneIdx++;
    var zi = tState.zoneIdx, z = tState.zones[zi], mod = tState.curMod || tState.baseMod;
    var alivePlayers = tState.players.filter(function (p) { return p.alive; });
    alivePlayers.forEach(function (p) {
      if (dist(p.x, p.y, z.x, z.y) > z.r * 0.75) {
        var pull = p.me ? 0.8 : 0.58 + Math.random() * 0.32;
        p.x = clamp(p.x + (z.x - p.x) * pull + rr(-3, 3), 1, 99);
        p.y = clamp(p.y + (z.y - p.y) * pull + rr(-3, 3), 1, 99);
      } else { p.x = clamp(p.x + rr(-4, 4), 1, 99); p.y = clamp(p.y + rr(-4, 4), 1, 99); }
    });
    var target = tState.aliveCurve[zi] || 1, need = Math.max(0, tState.alive - target);
    var me = tState.me, inZone = dist(me.x, me.y, z.x, z.y) <= z.r * 1.1;
    // выживание: порог растёт к эндгейму — хороший игрок доживает дальше
    var surviveRoll = (me.skill - 45) + mod.perf * 1.5 + (inZone ? 0 : -22) + rr(-13, 13) * mod.varMul;
    var TH = [0, 2, 6, 12, 20, 30, 44, 62];
    var meDies = surviveRoll < (TH[zi] != null ? TH[zi] : 70);
    var bots = alivePlayers.filter(function (p) { return !p.me; });
    bots.sort(function (a, b) {
      return ((dist(a.x, a.y, z.x, z.y) <= z.r ? a.skill : a.skill - 40) + rr(-10, 10)) - ((dist(b.x, b.y, z.x, z.y) <= z.r ? b.skill : b.skill - 40) + rr(-10, 10));
    });
    var botDeaths = meDies ? Math.max(0, need - 1) : need;
    for (var i = 0; i < botDeaths && i < bots.length; i++) bots[i].alive = false;
    if (meDies) { me.alive = false; me.place = tState.players.filter(function (p) { return p.alive; }).length + 1; }
    else { var kg = Math.max(0, Math.round((mod.killBias + fitBonus(0)) * 0.3 * Math.random())); me.kills += kg; tState.kills += kg; }
    tState.alive = tState.players.filter(function (p) { return p.alive; }).length;
    renderStep();
  }
  function renderStep() {
    layoutZone();
    var pl = $("#brPlayers"); if (pl) {
      var nodes = pl.children;
      tState.players.forEach(function (p, i) { var el = nodes[i]; if (!el) return; el.style.left = p.x + "%"; el.style.top = p.y + "%"; if (!p.alive) el.classList.add(p.me ? "knocked" : "dead"); });
    }
    var a = $("#brAlive"); if (a) a.textContent = tState.alive;
    var zz = $("#brZone"); if (zz) zz.textContent = tState.zoneIdx + 1;
    var kk = $("#brKills"); if (kk) kk.textContent = tState.kills;
  }
  function finishRun() {
    var me = tState.me, placement;
    if (me.alive) {
      var last = tState.players.filter(function (p) { return p.alive; });
      if (last.length > 1) { last.sort(function (a, b) { return (b.skill + (b.me ? tState.curMod.perf * 2 : 0) + rr(0, 16)) - (a.skill + (a.me ? tState.curMod.perf * 2 : 0) + rr(0, 16)); }); placement = last.indexOf(me) + 1; }
      else placement = 1;
      if (placement === 1 && me.kills === 0) me.kills = 1;
    } else placement = me.place || (tState.alive + 1);
    var ev = tState.ev, total = placePts(placement) + tState.kills * 4;
    showResult({ rank: placement, lobby: ev.lobby, total: total, elims: tState.kills, best: placement, vr: placement === 1 ? 1 : 0, log: [] });
  }
  // Этап 4 — итог + награды
  function showResult(res) {
    var c = tourCard(); if (c) c.classList.remove("tour-big");
    var ev = tState.ev;
    var prize = prizeOf(res.rank, ev.lobby, ev.prizeTop), pr = prGain(res.rank, ev.lobby, ev.prW);
    var ups = [], xpAll = Math.round(8 + (1 - res.rank / ev.lobby) * 34);
    for (var i = 0; i < 6; i++) { P.xp[i] += xpAll; while (P.xp[i] >= XP_PER && P.stats[i] < 99) { P.stats[i]++; P.xp[i] -= XP_PER; ups.push(SHORT[i] + " +1"); } if (P.stats[i] >= 99) P.xp[i] = 0; }
    P.earnings += prize; P.balance += prize; P.pr += pr; P.mood = Math.min(100, P.mood + (res.rank <= 10 ? 6 : -2));
    save();
    var hist = loadArr("fnc_history");
    hist.unshift({ name: ev.name, date: Date.now(), rank: res.rank, lobby: res.lobby, total: res.total, elims: res.elims, best: res.best, vr: res.vr, prize: prize, pr: pr });
    localStorage.setItem("fnc_history", JSON.stringify(hist.slice(0, 40)));
    var trophy = res.rank === 1 ? "win" : res.rank <= 3 ? "podium" : res.rank <= 10 ? "top10" : null;
    if (trophy) { var tr = loadObj("fnc_trophies"); tr[trophy] = (tr[trophy] || 0) + 1; localStorage.setItem("fnc_trophies", JSON.stringify(tr)); }
    var rankCls = res.rank === 1 ? "t-gold" : res.rank <= 3 ? "t-silver" : res.rank <= 10 ? "t-blue" : "";
    var rows = res.log.map(function (l) { return '<tr><td>Игра ' + l.g + '</td><td>' + (l.place === 1 ? "👑 1" : l.place) + '</td><td>' + l.el + '</td><td>' + l.pts + '</td></tr>'; }).join("");
    var trophyTxt = trophy === "win" ? "🏆 Победа на турнире!" : trophy === "podium" ? "🥈 Подиум (топ-3)" : trophy === "top10" ? "🎖 Топ-10" : "";
    $("#tourBody").innerHTML =
      '<div class="t-rank ' + rankCls + '"><b>' + res.rank + '</b><span>место из ' + res.lobby + '</span></div>' +
      '<div class="t-kpis"><div><b>' + res.total + '</b><span>очки</span></div><div><b>' + res.elims + '</b><span>киллы</span></div><div><b>' + res.best + '</b><span>лучшее</span></div><div><b>' + res.vr + '</b><span>👑 VR</span></div></div>' +
      (res.log.length ? '<table class="t-log"><thead><tr><th>Игра</th><th>Место</th><th>Киллы</th><th>Очки</th></tr></thead><tbody>' + rows + '</tbody></table>' : '') +
      (trophyTxt ? '<div class="t-tr">' + trophyTxt + '</div>' : "") +
      '<div class="t-rw-row">Приз: <b>$' + fnum(prize) + '</b> · <b>+' + pr + ' PR</b> · Опыт: <b>+' + xpAll + '</b>' + (ups.length ? ' · <span class="accent">' + ups.join(" ") + '</span>' : "") + '</div>' +
      '<button class="btn btn-primary btn-block" id="tourDone" type="button">В следующий день →</button>';
    pendingDay = true;
  }

  /* ---------- toast ---------- */
  var toastT;
  function flash(msg) {
    var t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove("show"); }, 3200);
  }

  /* ---------- init ---------- */
  buildBar(); setTab("center");
})();

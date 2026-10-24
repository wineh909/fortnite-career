/* FNCS Career — FNCS Draft mode. Собери состав под кэп, синергия, симуляция турнира команд. localStorage. */
(function () {
  "use strict";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  var STAT_KEYS = ["Стрельба", "Стройка", "Ротации", "Клатч", "Гейм-IQ", "Стабильность"];
  var SHORT = ["СТР", "СТРОЙ", "РОТ", "КЛЧ", "IQ", "СТБ"];
  var REGIONS = [
    { id: "EU", name: "Европа", flag: "eu" }, { id: "NAC", name: "NA Central", flag: "us" },
    { id: "NAW", name: "NA West", flag: "us" }, { id: "BR", name: "Бразилия", flag: "br" },
    { id: "ASIA", name: "Азия", flag: "kr" }, { id: "OCE", name: "Океания", flag: "au" },
    { id: "ME", name: "Ближний Восток", flag: "ae" }
  ];
  var ROLES = ["Фрагер", "IGL", "Флекс", "Саппорт"];
  var FORMATS = [{ id: "solo", name: "Соло", size: 1, cap: 260 }, { id: "duo", name: "Дуо", size: 2, cap: 440 }, { id: "trio", name: "Трио", size: 3, cap: 620 }];
  var YEARS = [2023, 2024, 2025, 2026];
  var SEASONS = ["Сезон 1", "Сезон 2", "Сезон 3", "Сезон 4"];
  var NAMES = ["Vortexx", "Zylo", "Krypt", "Nyxo", "Blaze", "Riptide", "Specter", "Volt", "Aether", "Quake",
    "Frost", "Havoc", "Pyro", "Glitch", "Nova", "Razr", "Echo", "Surge", "Drako", "Venom",
    "Zephyr", "Cobalt", "Flux", "Onyx", "Reign", "Sable", "Talon", "Kairo", "Lumen", "Mirage",
    "Phantom", "Rogue", "Shade", "Titan", "Umbra", "Vexen", "Wraith", "Zenith", "Apexx", "Boltz",
    "Cinder", "Duskk", "Emberr", "Fabled", "Ghostt", "Hexi", "Ionn", "Jaxx"];

  function hashStr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function rr(a, b) { return a + Math.random() * (b - a); }
  function rarityOf(o) { return o >= 88 ? { n: "Легендарный", c: "#ffcf3a" } : o >= 80 ? { n: "Эпический", c: "#b06bff" } : o >= 72 ? { n: "Редкий", c: "#46b6ff" } : o >= 64 ? { n: "Необычный", c: "#3fe07a" } : { n: "Обычный", c: "#9aa6bf" }; }
  var flagUrl = function (iso) { return "https://flagcdn.com/w320/" + iso + ".png"; };

  /* ---------- player pool (deterministic) ---------- */
  var POOL = (function () {
    var pool = [];
    NAMES.forEach(function (nm, i) {
      var r = rng(hashStr(nm + "|fncs"));
      var region = REGIONS[i % REGIONS.length].id;
      var role = ROLES[Math.floor(r() * ROLES.length)];
      var ov = 58 + Math.floor(Math.pow(r(), 1.25) * 39); // 58..96, перекос вниз
      var stats = STAT_KEYS.map(function () { return clamp(ov + Math.round((r() - 0.5) * 18), 40, 99); });
      if (role === "Фрагер") { stats[0] = clamp(stats[0] + 6, 40, 99); stats[3] = clamp(stats[3] + 4, 40, 99); }
      else if (role === "IGL") { stats[2] = clamp(stats[2] + 6, 40, 99); stats[4] = clamp(stats[4] + 6, 40, 99); }
      else if (role === "Саппорт") { stats[1] = clamp(stats[1] + 5, 40, 99); stats[5] = clamp(stats[5] + 5, 40, 99); }
      var cost = Math.round(10 * Math.pow(2.15, (ov - 50) / 10));
      pool.push({ id: "p" + i, name: nm, region: region, role: role, ov: ov, stats: stats, cost: cost, rar: rarityOf(ov) });
    });
    return pool;
  })();
  function byId(id) { for (var i = 0; i < POOL.length; i++) if (POOL[i].id === id) return POOL[i]; return null; }
  function regOf(id) { for (var i = 0; i < REGIONS.length; i++) if (REGIONS[i].id === id) return REGIONS[i]; return REGIONS[0]; }

  /* ---------- state ---------- */
  var S = (function () {
    var d = { year: 2026, season: "Сезон 1", region: "EU", format: "duo", team: [] };
    try { var p = JSON.parse(localStorage.getItem("fnc_draft_state")); if (p) { for (var k in d) if (p[k] != null) d[k] = p[k]; } } catch (e) {}
    if (!FORMATS.filter(function (f) { return f.id === d.format; }).length) d.format = "duo";
    return d;
  })();
  function fmt() { return FORMATS.filter(function (f) { return f.id === S.format; })[0]; }
  function saveState() { localStorage.setItem("fnc_draft_state", JSON.stringify(S)); }
  function teamPlayers() { return S.team.map(byId).filter(Boolean); }

  // controls (client-side filter/sort)
  var C = { q: "", role: "", region: "", sort: "ov" };

  /* ---------- synergy / power ---------- */
  function teamStats() {
    var t = teamPlayers();
    if (!t.length) return { power: 0, avg: 0, cost: 0, syn: { region: 0, role: 0, rarity: 0, total: 0 }, notes: [] };
    var avg = Math.round(t.reduce(function (a, p) { return a + p.ov; }, 0) / t.length);
    var cost = t.reduce(function (a, p) { return a + p.cost; }, 0);
    var multi = t.length > 1, notes = [];
    var sameRegion = t.every(function (p) { return p.region === t[0].region; });
    var regionBonus = multi ? (sameRegion ? 5 : -2) : 0;
    if (multi) notes.push(sameRegion ? "Один регион +5" : "Разные регионы −2");
    var roles = t.map(function (p) { return p.role; });
    var hasIGL = roles.indexOf("IGL") >= 0, hasFrag = roles.indexOf("Фрагер") >= 0;
    var uniq = roles.filter(function (v, i) { return roles.indexOf(v) === i; }).length;
    var roleBonus = 0;
    if (multi) {
      if (hasIGL && hasFrag) { roleBonus += 3; notes.push("IGL + Фрагер +3"); }
      if (uniq === t.length) { roleBonus += 2; notes.push("Разные роли +2"); }
      if (uniq === 1) { roleBonus -= 2; notes.push("Одна роль −2"); }
    }
    var legend = t.filter(function (p) { return p.ov >= 84; }).length;
    var rarityBonus = legend >= 2 ? 2 : 0;
    if (rarityBonus) notes.push("2+ топ-игрока +2");
    var synTotal = regionBonus + roleBonus + rarityBonus;
    return { power: Math.round(avg + synTotal), avg: avg, cost: cost, syn: { region: regionBonus, role: roleBonus, rarity: rarityBonus, total: synTotal }, notes: notes };
  }

  /* ---------- rendering ---------- */
  var setupEl = $("#draftSetup"), ctrlEl = $("#poolControls"), poolEl = $("#poolGrid"), teamEl = $("#teamPanel"), histEl = $("#draftHistory");
  var MON = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
  function fmtDate(ts) { var d = new Date(ts); return d.getDate() + " " + MON[d.getMonth()]; }
  function draftHist() { try { return JSON.parse(localStorage.getItem("fnc_draft_history")) || []; } catch (e) { return []; } }

  function pill(list, cur, attr) {
    return list.map(function (o) { var id = o.id != null ? o.id : o; var nm = o.name != null ? o.name : o; return '<button class="dpill' + (id === cur ? " active" : "") + '" data-' + attr + '="' + id + '" type="button">' + nm + '</button>'; }).join("");
  }
  function renderSetup() {
    var f = fmt();
    setupEl.innerHTML =
      '<div class="ds-row"><span class="ds-lbl">Год</span><div class="dpills" data-grp="year">' + pill(YEARS, S.year, "yr") + '</div></div>' +
      '<div class="ds-row"><span class="ds-lbl">Сезон</span><div class="dpills" data-grp="season">' + pill(SEASONS, S.season, "season") + '</div></div>' +
      '<div class="ds-row"><span class="ds-lbl">Регион</span><div class="dpills" data-grp="region">' + pill(REGIONS, S.region, "region") + '</div></div>' +
      '<div class="ds-row"><span class="ds-lbl">Формат</span><div class="dpills" data-grp="format">' + pill(FORMATS, S.format, "format") + '</div></div>' +
      '<div class="ds-note">Кэп состава: <b>' + f.cap + '</b> · игроков в команде: <b>' + f.size + '</b></div>';
  }
  function renderControls() {
    ctrlEl.innerHTML =
      '<input class="pool-search" id="poolSearch" type="text" placeholder="Поиск игрока..." value="' + esc(C.q) + '">' +
      '<div class="pool-filters">' +
      '<select id="fRole"><option value="">Все роли</option>' + ROLES.map(function (r) { return '<option value="' + r + '"' + (C.role === r ? " selected" : "") + '>' + r + '</option>'; }).join("") + '</select>' +
      '<select id="fRegion"><option value="">Все регионы</option>' + REGIONS.map(function (r) { return '<option value="' + r.id + '"' + (C.region === r.id ? " selected" : "") + '>' + r.name + '</option>'; }).join("") + '</select>' +
      '<select id="fSort"><option value="ov"' + (C.sort === "ov" ? " selected" : "") + '>По рейтингу</option><option value="cost"' + (C.sort === "cost" ? " selected" : "") + '>По цене</option><option value="name"' + (C.sort === "name" ? " selected" : "") + '>По имени</option></select>' +
      '</div>';
  }
  function filteredPool() {
    var list = POOL.filter(function (p) {
      if (C.q && p.name.toLowerCase().indexOf(C.q.toLowerCase()) < 0) return false;
      if (C.role && p.role !== C.role) return false;
      if (C.region && p.region !== C.region) return false;
      return true;
    });
    list.sort(function (a, b) {
      if (C.sort === "cost") return b.cost - a.cost;
      if (C.sort === "name") return a.name < b.name ? -1 : 1;
      return b.ov - a.ov;
    });
    return list;
  }
  function dcard(p, inTeam) {
    var f = fmt(), ts = teamStats(), remaining = f.cap - ts.cost;
    var full = S.team.length >= f.size;
    var canAfford = p.cost <= remaining;
    var reg = regOf(p.region);
    var disabled = inTeam ? false : (full || !canAfford);
    var btn = inTeam
      ? '<button class="dc-btn remove" data-remove="' + p.id + '" type="button">Убрать</button>'
      : '<button class="dc-btn add' + (disabled ? " off" : "") + '" data-add="' + p.id + '"' + (disabled ? " disabled" : "") + ' type="button">' + (full ? "Состав полон" : !canAfford ? "Дорого" : "+ В состав") + '</button>';
    return '<div class="dcard' + (inTeam ? " picked" : "") + '" style="--rar:' + p.rar.c + '">' +
      '<div class="dc-top"><span class="dc-ov">' + p.ov + '</span><span class="dc-cost">$' + p.cost + '</span></div>' +
      '<div class="dc-name">' + esc(p.name) + '</div>' +
      '<div class="dc-meta"><img class="flag" src="' + flagUrl(reg.flag) + '" alt=""> ' + reg.id + ' · ' + p.role + '</div>' +
      '<div class="dc-rar">' + p.rar.n + '</div>' +
      '<div class="dc-stats">' + p.stats.map(function (v, i) { return '<span title="' + STAT_KEYS[i] + '">' + SHORT[i] + ' ' + v + '</span>'; }).join("") + '</div>' +
      btn + '</div>';
  }
  function renderPool() {
    var list = filteredPool();
    poolEl.innerHTML = list.length ? list.map(function (p) { return dcard(p, S.team.indexOf(p.id) >= 0); }).join("") : '<div class="pool-empty">Никого не нашли — измени фильтры.</div>';
  }
  function renderTeam() {
    var f = fmt(), ts = teamStats(), t = teamPlayers();
    var slots = "";
    for (var i = 0; i < f.size; i++) {
      var p = t[i];
      slots += p
        ? '<div class="tp-slot filled" style="--rar:' + p.rar.c + '"><div class="tp-ov">' + p.ov + '</div><div class="tp-info"><b>' + esc(p.name) + '</b><span>' + regOf(p.region).id + ' · ' + p.role + ' · $' + p.cost + '</span></div><button class="tp-x" data-remove="' + p.id + '" type="button">✕</button></div>'
        : '<div class="tp-slot empty"><span>Слот ' + (i + 1) + '</span><small>выбери игрока справа</small></div>';
    }
    var capPct = Math.min(100, Math.round(ts.cost / f.cap * 100));
    var over = ts.cost > f.cap;
    var full = S.team.length >= f.size;
    var synHtml = ts.notes.length ? ts.notes.map(function (n) { return '<span class="syn-tag' + (n.indexOf("−") >= 0 ? " neg" : "") + '">' + n + '</span>'; }).join("") : '<span class="syn-tag muted">синергия появится при 2+ игроках</span>';
    teamEl.innerHTML =
      '<div class="fcard tp-card"><p class="panel-title">Твоя команда · ' + f.name + '</p>' +
      '<div class="tp-power"><div class="tpw-big"><b>' + ts.power + '</b><span>Сила команды</span></div><div class="tpw-sub">Средний рейтинг ' + ts.avg + (ts.syn.total ? ' · синергия ' + (ts.syn.total > 0 ? "+" : "") + ts.syn.total : "") + '</div></div>' +
      '<div class="tp-slots">' + slots + '</div>' +
      '<div class="tp-cap"><div class="tpc-head"><span>Бюджет</span><b class="' + (over ? "over" : "") + '">$' + ts.cost + ' / $' + f.cap + '</b></div><div class="tpc-bar"><i style="width:' + capPct + '%' + (over ? ";background:var(--danger,#ff6b6b)" : "") + '"></i></div></div>' +
      '<div class="tp-syn">' + synHtml + '</div>' +
      '<button class="btn btn-primary btn-lg btn-block" id="simBtn"' + (full && !over ? "" : " disabled") + ' type="button">' + (full ? (over ? "Превышен кэп" : "Симулировать турнир →") : "Набери " + f.size + " игрок(а/ов)") + '</button>' +
      (S.team.length ? '<button class="btn btn-ghost btn-block" id="clearBtn" type="button">Очистить состав</button>' : "") +
      '</div>';
  }
  function renderHistory() {
    var hist = draftHist();
    if (!hist.length) { histEl.innerHTML = ""; return; }
    var played = hist.length;
    var best = hist.reduce(function (m, h) { return Math.min(m, h.rank); }, 999);
    var champs = hist.filter(function (h) { return h.rank === 1; }).length;
    var totalPrize = hist.reduce(function (a, h) { return a + (h.prize || 0); }, 0);
    var rows = hist.map(function (h) {
      var f = FORMATS.filter(function (x) { return x.id === h.format; })[0] || { name: h.format };
      var badge = h.rank === 1 ? "t-gold" : h.rank <= 3 ? "t-silver" : h.rank <= 10 ? "t-blue" : "";
      return '<div class="dh-row"><div class="dh-place ' + badge + '">#' + h.rank + '</div>' +
        '<div class="dh-body"><b>' + esc((h.names || []).join(" · ")) + '</b><span>' + regOf(h.region).name + ' · ' + f.name + ' · сила ' + h.power + ' · ' + h.total + ' очк · ' + fmtDate(h.date) + '</span></div>' +
        '<div class="dh-prize">' + (h.prize ? "$" + h.prize.toLocaleString("ru-RU") : "—") + '</div></div>';
    }).join("");
    histEl.innerHTML = '<div class="fcard"><p class="panel-title">История драфтов</p>' +
      '<div class="dh-sum"><div><b>' + played + '</b><span>турниров</span></div><div><b>#' + best + '</b><span>лучшее место</span></div><div><b>' + champs + '</b><span>🏆 чемпионств</span></div><div><b>$' + totalPrize.toLocaleString("ru-RU") + '</b><span>призовых</span></div></div>' +
      '<div class="dh-list">' + rows + '</div></div>';
  }
  function renderAll() { renderSetup(); renderControls(); renderPool(); renderTeam(); renderHistory(); }

  /* ---------- interactions ---------- */
  function flash(msg) {
    var t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show"); clearTimeout(flash._t); flash._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }
  function addPlayer(id) {
    var f = fmt(), p = byId(id); if (!p) return;
    if (S.team.indexOf(id) >= 0) return;
    if (S.team.length >= f.size) { flash("Состав уже полон (" + f.size + ")."); return; }
    var ts = teamStats(); if (ts.cost + p.cost > f.cap) { flash("Не хватает бюджета на " + p.name + "."); return; }
    S.team.push(id); saveState(); renderPool(); renderTeam();
  }
  function removePlayer(id) { var i = S.team.indexOf(id); if (i >= 0) { S.team.splice(i, 1); saveState(); renderPool(); renderTeam(); } }

  setupEl.addEventListener("click", function (e) {
    var b = e.target.closest(".dpill"); if (!b) return;
    if (b.hasAttribute("data-yr")) S.year = +b.getAttribute("data-yr");
    else if (b.hasAttribute("data-season")) S.season = b.getAttribute("data-season");
    else if (b.hasAttribute("data-region")) S.region = b.getAttribute("data-region");
    else if (b.hasAttribute("data-format")) { S.format = b.getAttribute("data-format"); var f = fmt(); if (S.team.length > f.size) S.team = S.team.slice(0, f.size); }
    saveState(); renderAll();
  });
  ctrlEl.addEventListener("input", function (e) {
    if (e.target.id === "poolSearch") { C.q = e.target.value; renderPool(); }
  });
  ctrlEl.addEventListener("change", function (e) {
    if (e.target.id === "fRole") C.role = e.target.value;
    else if (e.target.id === "fRegion") C.region = e.target.value;
    else if (e.target.id === "fSort") C.sort = e.target.value;
    renderPool();
  });
  poolEl.addEventListener("click", function (e) {
    var a = e.target.closest("[data-add]"), r = e.target.closest("[data-remove]");
    if (a && !a.disabled) addPlayer(a.getAttribute("data-add"));
    else if (r) removePlayer(r.getAttribute("data-remove"));
  });
  teamEl.addEventListener("click", function (e) {
    var r = e.target.closest("[data-remove]");
    if (r) { removePlayer(r.getAttribute("data-remove")); return; }
    if (e.target.id === "clearBtn") { S.team = []; saveState(); renderAll(); return; }
    if (e.target.id === "simBtn" && !e.target.disabled) runTournament();
  });

  /* ---------- team tournament simulation ---------- */
  function placePtsTeam(place) { var tbl = [65, 54, 46, 40, 35, 30, 26, 22, 19, 16, 13, 11, 9, 7, 6, 5, 4, 3, 2, 1]; return tbl[place - 1] || 1; }
  function simTournament(myPower) {
    var N = 20, games = 6, powers = [myPower];
    for (var i = 1; i < N; i++) powers.push(clamp(Math.round(myPower + rr(-10, 8)), 50, 99));
    var totals = []; for (var z = 0; z < N; z++) totals.push(0);
    var myElims = 0, best = N, wins = 0, log = [];
    for (var g = 0; g < games; g++) {
      var order = powers.map(function (p, idx) { return { idx: idx, r: p + rr(-14, 14) }; }).sort(function (a, b) { return b.r - a.r; });
      for (var p = 0; p < N; p++) {
        var idx = order[p].idx, place = p + 1;
        var el = Math.max(0, Math.round((order[p].r - powers[idx] + 8) / 5) + (place <= 5 ? 1 : 0));
        totals[idx] += placePtsTeam(place) + el;
        if (idx === 0) { myElims += el; if (place < best) best = place; if (place === 1) wins++; log.push({ g: g + 1, place: place, el: el, pts: placePtsTeam(place) + el }); }
      }
    }
    var myTotal = totals[0], rank = 1; for (var j = 1; j < N; j++) if (totals[j] > myTotal) rank++;
    return { total: myTotal, elims: myElims, best: best, wins: wins, rank: rank, lobby: N, games: games, log: log };
  }
  function prizeOf(rank) { return rank === 1 ? 10000 : rank <= 3 ? 5000 : rank <= 5 ? 2500 : rank <= 10 ? 800 : 0; }
  var tourModal = $("#tourModal");
  Array.prototype.forEach.call(document.querySelectorAll("[data-tclose]"), function (el) { el.addEventListener("click", function () { tourModal.hidden = true; }); });
  function runTournament() {
    var ts = teamStats(), t = teamPlayers();
    var res = simTournament(ts.power);
    var prize = prizeOf(res.rank);
    // save draft history
    var hist; try { hist = JSON.parse(localStorage.getItem("fnc_draft_history")) || []; } catch (e) { hist = []; }
    hist.unshift({ date: Date.now(), region: S.region, format: S.format, power: ts.power, names: t.map(function (p) { return p.name; }), rank: res.rank, lobby: res.lobby, total: res.total, elims: res.elims, wins: res.wins, prize: prize });
    localStorage.setItem("fnc_draft_history", JSON.stringify(hist.slice(0, 20)));
    renderHistory();
    // MVP = highest-ov player
    var mvp = t.slice().sort(function (a, b) { return b.ov - a.ov; })[0];
    var rankCls = res.rank === 1 ? "t-gold" : res.rank <= 3 ? "t-silver" : res.rank <= 10 ? "t-blue" : "";
    var rows = res.log.map(function (l) { return '<tr><td>Игра ' + l.g + '</td><td>' + (l.place === 1 ? "👑 1" : l.place) + '</td><td>' + l.el + '</td><td>' + l.pts + '</td></tr>'; }).join("");
    var trophyTxt = res.wins > 0 && res.rank === 1 ? "🏆 Чемпионы турнира!" : res.rank <= 3 ? "🥈 Подиум (топ-3)" : res.rank <= 10 ? "🎖 Топ-10" : "";
    $("#tourTitle").textContent = regOf(S.region).name + " · " + fmt().name + " · " + S.season;
    $("#tourBody").innerHTML =
      '<div class="t-rank ' + rankCls + '"><b>' + res.rank + '</b><span>место из ' + res.lobby + ' команд</span></div>' +
      '<div class="t-kpis"><div><b>' + res.total + '</b><span>очки</span></div><div><b>' + res.elims + '</b><span>киллы</span></div><div><b>' + res.best + '</b><span>лучшее</span></div><div><b>' + res.wins + '</b><span>👑 VR</span></div></div>' +
      '<table class="t-log"><thead><tr><th>Игра</th><th>Место</th><th>Киллы</th><th>Очки</th></tr></thead><tbody>' + rows + '</tbody></table>' +
      (trophyTxt ? '<div class="t-tr">' + trophyTxt + '</div>' : "") +
      '<div class="t-rw-row">Сила команды: <b>' + ts.power + '</b> · MVP: <b>' + esc(mvp.name) + '</b> · Приз: <b>$' + prize.toLocaleString("ru-RU") + '</b></div>' +
      '<button class="btn btn-primary" id="tourDone" type="button">Готово</button>';
    tourModal.hidden = false;
    $("#tourDone").addEventListener("click", function () { tourModal.hidden = true; });
  }

  /* ---------- init ---------- */
  renderAll();
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();

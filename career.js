/* FNCS Career — career setup (map + profile + auto player card). Visual only, localStorage. */
(function () {
  "use strict";
  var SVGNS = "http://www.w3.org/2000/svg";
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]; }); };

  /* Ping (ms to Frankfurt) — демо. Все страны. Россия — две зоны (ниже). */
  var PING = {
    de: 9, nl: 11, be: 12, lu: 10, fr: 17, ch: 14, at: 13, cz: 15, pl: 21, sk: 17, hu: 19, si: 18,
    hr: 20, it: 23, es: 31, pt: 41, gb: 17, ie: 27, dk: 18, no: 31, se: 27, fi: 34, ee: 35, lv: 34,
    lt: 32, by: 37, ua: 41, md: 44, ro: 31, bg: 37, rs: 29, ba: 27, me: 31, mk: 35, al: 39, gr: 47,
    mt: 37, cy: 62, tr: 57, ge: 72, am: 80, az: 84, is: 39, fo: 33, ax: 35, xk: 35, ma: 46, dz: 41,
    tn: 39, ly: 60, li: 13, ad: 30, mc: 19, sm: 25, va: 23, kz: 88, ir: 95, sa: 85, iq: 92, eg: 70,
    sy: 66, lb: 68, il: 62, jo: 66, ps: 64, kw: 90
  };
  var RU_WEST = 40, RU_EAST = 80, RU_SPLIT_X = 616;
  var RU = {
    ru: "Россия", de: "Германия", fr: "Франция", gb: "Великобритания", it: "Италия", es: "Испания",
    pt: "Португалия", nl: "Нидерланды", be: "Бельгия", lu: "Люксембург", ch: "Швейцария", at: "Австрия",
    pl: "Польша", cz: "Чехия", sk: "Словакия", hu: "Венгрия", ro: "Румыния", bg: "Болгария", gr: "Греция",
    tr: "Турция", ua: "Украина", by: "Беларусь", lt: "Литва", lv: "Латвия", ee: "Эстония", fi: "Финляндия",
    se: "Швеция", no: "Норвегия", dk: "Дания", is: "Исландия", ie: "Ирландия", hr: "Хорватия", si: "Словения",
    ba: "Босния и Герцеговина", rs: "Сербия", me: "Черногория", mk: "Сев. Македония", al: "Албания",
    md: "Молдова", cy: "Кипр", mt: "Мальта", li: "Лихтенштейн", ad: "Андорра", sm: "Сан-Марино", mc: "Монако",
    va: "Ватикан", xk: "Косово", fo: "Фареры", ax: "Аланды", ge: "Грузия", am: "Армения", az: "Азербайджан",
    kz: "Казахстан", ma: "Марокко", dz: "Алжир", tn: "Тунис", ly: "Ливия", eg: "Египет", sy: "Сирия",
    lb: "Ливан", il: "Израиль", jo: "Иордания", iq: "Ирак", ir: "Иран", sa: "Саудовская Аравия",
    kw: "Кувейт", ps: "Палестина"
  };
  var SPRAWL = { ru: 1, kz: 1, ir: 1, sa: 1, iq: 1, eg: 1, ly: 1, sy: 1, jo: 1, il: 1, lb: 1, ps: 1, kw: 1 };
  var isoOf = function (id) { return id.indexOf("ru-") === 0 ? "ru" : id; };
  var flagUrl = function (id) { return "https://flagcdn.com/w320/" + isoOf(id) + ".png"; };
  var nameOf = function (id, fb) { return id === "ru-west" ? "Россия · Запад" : id === "ru-east" ? "Россия · Восток" : (RU[id] || fb || id.toUpperCase()); };
  var pingOf = function (id) { return id === "ru-west" ? RU_WEST : id === "ru-east" ? RU_EAST : PING[id]; };

  var state = {
    avatar: localStorage.getItem("fnc_avatar") || "", nick: localStorage.getItem("fnc_nick") || "",
    age: localStorage.getItem("fnc_age") || "", country: localStorage.getItem("fnc_country") || "",
    role: localStorage.getItem("fnc_role") || ""
  };

  /* ================= MAP ================= */
  var host = $("#mapSvgHost"), svg, pt, paths = {}, labelSize = 5;
  var base = null, view = null;

  function labelPoint(path, b) {
    var step = Math.max(b.width, b.height) / 20, sx = 0, sy = 0, n = 0, ins = [];
    for (var x = b.x + step / 2; x < b.x + b.width; x += step)
      for (var y = b.y + step / 2; y < b.y + b.height; y += step) { pt.x = x; pt.y = y; if (path.isPointInFill(pt)) { sx += x; sy += y; n++; ins.push([x, y]); } }
    if (!n) return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
    var cx = sx / n, cy = sy / n; pt.x = cx; pt.y = cy;
    if (path.isPointInFill(pt)) return { x: cx, y: cy };
    var best = ins[0], bd = Infinity;
    for (var i = 0; i < ins.length; i++) { var d = (ins[i][0] - cx) * (ins[i][0] - cx) + (ins[i][1] - cy) * (ins[i][1] - cy); if (d < bd) { bd = d; best = ins[i]; } }
    return { x: best[0], y: best[1] };
  }
  function svgPoint(evt) { var m = svg.getScreenCTM(); if (!m) return null; var p = svg.createSVGPoint(); p.x = evt.clientX; p.y = evt.clientY; return p.matrixTransform(m.inverse()); }
  function addLabel(val, x, y, small) {
    var t = document.createElementNS(SVGNS, "text");
    t.setAttribute("class", "ping-label" + (small ? " lbl-sm" : "")); t.setAttribute("x", x); t.setAttribute("y", y);
    t.setAttribute("font-size", labelSize); t.style.strokeWidth = (labelSize * 0.17) + "px";
    t.textContent = val; svg.appendChild(t);
  }

  function buildMap() {
    if (!window.EUROPE_MAP) { host.textContent = "Карта не загрузилась."; return; }
    var data = window.EUROPE_MAP;
    svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", data.worldViewBox);
    svg.setAttribute("role", "img"); svg.setAttribute("aria-label", "Карта регионов с пингом");
    pt = svg.createSVGPoint();
    var defs = document.createElementNS(SVGNS, "defs"); svg.appendChild(defs);

    data.locations.forEach(function (loc) {
      var p = document.createElementNS(SVGNS, "path");
      p.setAttribute("d", loc.path); p.setAttribute("class", "country");
      p.setAttribute("vector-effect", "non-scaling-stroke"); p.setAttribute("fill", "transparent");
      p.style.pointerEvents = "all";
      p.setAttribute("data-id", loc.id); p.setAttribute("data-name", nameOf(loc.id, loc.name));
      p.addEventListener("click", function (e) {
        if (panned) { panned = false; return; }
        if (loc.id === "ru") { var q = svgPoint(e); selectCountry(q && q.x < RU_SPLIT_X ? "ru-west" : "ru-east"); }
        else selectCountry(loc.id);
      });
      svg.appendChild(p); paths[loc.id] = p;
    });
    host.appendChild(svg);

    var fb = null;
    Object.keys(paths).forEach(function (id) {
      if (SPRAWL[id]) return; var b = paths[id].getBBox(); if (!b.width) return;
      if (!fb) fb = { x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height };
      else { fb.x = Math.min(fb.x, b.x); fb.y = Math.min(fb.y, b.y); fb.x2 = Math.max(fb.x2, b.x + b.width); fb.y2 = Math.max(fb.y2, b.y + b.height); }
    });
    var w = fb.x2 - fb.x, h = fb.y2 - fb.y, padX = w * 0.02, padY = h * 0.04;
    base = { x: fb.x - padX, y: fb.y - padY, w: w + padX * 2 + w * 0.30, h: h + padY * 2 };
    view = { x: base.x, y: base.y, w: base.w, h: base.h };
    applyView();
    labelSize = w * 0.021;

    data.locations.forEach(function (loc) {
      var p = paths[loc.id], b = p.getBBox(); if (!b.width) return;
      var cp = document.createElementNS(SVGNS, "clipPath"); cp.id = "cp-" + loc.id; cp.setAttribute("clipPathUnits", "userSpaceOnUse");
      var cpath = document.createElementNS(SVGNS, "path"); cpath.setAttribute("d", loc.path); cp.appendChild(cpath); defs.appendChild(cp);
      var im = document.createElementNS(SVGNS, "image");
      im.setAttribute("href", flagUrl(loc.id)); im.setAttributeNS("http://www.w3.org/1999/xlink", "href", flagUrl(loc.id));
      if (loc.id === "ru") {
        // Russia's bbox is huge and its white (top) stripe sits above the viewport.
        // Horizontal tricolor is uniform across width, so map it (undistorted) to the
        // VISIBLE vertical band so all three stripes (white/blue/red) show.
        var topY = base.y, botY = Math.min(b.y + b.height, base.y + base.h);
        im.setAttribute("x", b.x); im.setAttribute("y", topY);
        im.setAttribute("width", b.width); im.setAttribute("height", botY - topY);
        im.setAttribute("preserveAspectRatio", "none");
      } else {
        im.setAttribute("x", b.x); im.setAttribute("y", b.y); im.setAttribute("width", b.width); im.setAttribute("height", b.height);
        im.setAttribute("preserveAspectRatio", "xMidYMid slice");
      }
      im.setAttribute("clip-path", "url(#cp-" + loc.id + ")");
      im.style.pointerEvents = "none"; svg.insertBefore(im, p);
    });

    /* Russia divider line (black), clipped to Russia */
    var line = document.createElementNS(SVGNS, "line");
    line.setAttribute("x1", RU_SPLIT_X); line.setAttribute("x2", RU_SPLIT_X);
    line.setAttribute("y1", base.y); line.setAttribute("y2", base.y + base.h);
    line.setAttribute("clip-path", "url(#cp-ru)"); line.setAttribute("stroke", "#061024");
    line.setAttribute("stroke-width", "3.5"); line.setAttribute("vector-effect", "non-scaling-stroke");
    line.style.pointerEvents = "none"; svg.appendChild(line);

    /* labels — every country */
    data.locations.forEach(function (loc) {
      if (loc.id === "ru" || PING[loc.id] == null) return;
      var p = paths[loc.id], b = p.getBBox(); if (!b.width) return;
      var lp = labelPoint(p, b);
      if (lp.x < base.x || lp.x > base.x + base.w || lp.y < base.y || lp.y > base.y + base.h) return;
      var small = b.width < w * 0.05 && b.height < h * 0.05;
      addLabel(PING[loc.id], lp.x, lp.y, small);
    });
    addLabel(RU_WEST, 572, 252, false);
    addLabel(RU_EAST, 660, 252, false);

    initZoomPan();
  }

  /* ---- zoom / pan ---- */
  var panned = false;
  function applyView() {
    svg.setAttribute("viewBox", view.x + " " + view.y + " " + view.w + " " + view.h);
    svg.classList.toggle("zoomed", view.w < base.w * 0.64);
  }
  function clampView() {
    view.w = Math.min(view.w, base.w); view.h = Math.min(view.h, base.h);
    view.x = Math.max(base.x, Math.min(base.x + base.w - view.w, view.x));
    view.y = Math.max(base.y, Math.min(base.y + base.h - view.h, view.y));
  }
  function zoomAt(scale, cx, cy) {
    if (cx == null) { cx = view.x + view.w / 2; cy = view.y + view.h / 2; }
    var nw = Math.min(base.w, Math.max(base.w * 0.22, view.w * scale)), k = nw / view.w;
    view.x = cx - (cx - view.x) * k; view.y = cy - (cy - view.y) * k;
    view.w = nw; view.h = view.h * k; clampView(); applyView();
  }
  function initZoomPan() {
    var mw = $("#mapWrap");
    var zi = $("#zoomIn"), zo = $("#zoomOut");
    if (zi) zi.addEventListener("click", function () { zoomAt(0.65); });
    if (zo) zo.addEventListener("click", function () { zoomAt(1 / 0.65); });
    mw.addEventListener("wheel", function (e) {
      e.preventDefault(); var q = svgPoint(e); zoomAt(e.deltaY < 0 ? 0.82 : 1 / 0.82, q && q.x, q && q.y);
    }, { passive: false });
    var drag = false, last = null, moved = 0;
    svg.addEventListener("pointerdown", function (e) { drag = true; moved = 0; panned = false; last = svgPoint(e); try { svg.setPointerCapture(e.pointerId); } catch (x) {} });
    svg.addEventListener("pointermove", function (e) {
      if (!drag || !last) return; var q = svgPoint(e); if (!q) return;
      var dx = q.x - last.x, dy = q.y - last.y; moved += Math.abs(dx) + Math.abs(dy);
      view.x -= dx; view.y -= dy; clampView(); applyView();
      if (moved > view.w * 0.02) { panned = true; mw.classList.add("grabbing"); }
      last = svgPoint(e);
    });
    var end = function () { drag = false; last = null; mw.classList.remove("grabbing"); };
    svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);
  }

  var selectedLine = $("#selectedLine");
  function selectCountry(id) {
    var baseId = isoOf(id); if (!paths[baseId]) return;
    state.country = id; localStorage.setItem("fnc_country", id);
    Object.keys(paths).forEach(function (k) { paths[k].classList.toggle("selected", k === baseId); });
    var ping = pingOf(id);
    var html = '<img class="flag" src="' + flagUrl(baseId) + '" alt="" /> ' + nameOf(id, paths[baseId].getAttribute("data-name"));
    html += ping != null ? ' — пинг <b>&nbsp;' + ping + ' мс</b>' : '';
    selectedLine.innerHTML = html; updateFoot(); renderCard();
  }

  var search = $("#countrySearch");
  search.addEventListener("input", function () {
    var q = search.value.trim().toLowerCase();
    Object.keys(paths).forEach(function (id) {
      var nm = (paths[id].getAttribute("data-name") || "").toLowerCase();
      paths[id].classList.toggle("dim", !!q && nm.indexOf(q) < 0 && id.indexOf(q) < 0);
    });
  });

  var placeholder = $("#mapPlaceholder");
  var regionNames = { "na-central": "NA Central", "na-west": "NA West", brazil: "Бразилия", asia: "Азия", me: "Ближний Восток", oce: "Океания" };
  $("#regionTabs").addEventListener("click", function (e) {
    var b = e.target.closest(".tab"); if (!b) return;
    Array.prototype.forEach.call(this.querySelectorAll(".tab"), function (t) { t.classList.remove("active"); });
    b.classList.add("active");
    var r = b.getAttribute("data-region");
    if (r === "europe") placeholder.style.display = "none";
    else { placeholder.style.display = "grid"; placeholder.innerHTML = "Карта региона «" + regionNames[r] + "»<br/>появится позже.<br/><span style='color:var(--faint);font-size:12px'>Пока доступна Европа.</span>"; }
  });

  /* ================= AVATAR ================= */
  var avInput = $("#avatarInput"), avBox = $("#avatarBox"), avImg = $("#avatarImg");
  function setAvatar(url) { state.avatar = url; avImg.src = url; avImg.hidden = false; avBox.classList.add("has-img"); try { localStorage.setItem("fnc_avatar", url); } catch (e) {} renderCard(); }
  avInput.addEventListener("change", function () {
    var f = avInput.files && avInput.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var max = 440, s = Math.min(1, max / Math.max(img.width, img.height));
        var cw = Math.round(img.width * s), ch = Math.round(img.height * s);
        var c = document.createElement("canvas"); c.width = cw; c.height = ch;
        c.getContext("2d").drawImage(img, 0, 0, cw, ch);
        try { setAvatar(c.toDataURL("image/jpeg", 0.85)); } catch (err) { setAvatar(e.target.result); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(f);
  });

  /* ================= NICK + AGE ================= */
  var nick = $("#nickname"), age = $("#age");
  nick.addEventListener("input", function () { state.nick = nick.value; localStorage.setItem("fnc_nick", nick.value); $('.error[data-for="nickname"]').textContent = ""; updateFoot(); renderCard(); });
  age.addEventListener("input", function () { state.age = age.value; localStorage.setItem("fnc_age", age.value); $('.error[data-for="age"]').textContent = ""; updateFoot(); renderCard(); });

  /* ================= ROLES ================= */
  var roleGrid = $("#roleGrid");
  roleGrid.addEventListener("click", function (e) {
    var c = e.target.closest(".role-card"); if (!c) return;
    state.role = c.getAttribute("data-role"); localStorage.setItem("fnc_role", state.role);
    Array.prototype.forEach.call(roleGrid.querySelectorAll(".role-card"), function (x) { x.classList.toggle("active", x === c); });
    updateFoot(); renderCard();
  });

  /* ================= PLAYER CARD ================= */
  var STAT_KEYS = ["Стрельба", "Стройка", "Ротации", "Клатч", "Гейм-IQ", "Стабильность"];
  function hashStr(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function ageBonus(a) { a = +a || 20; return a <= 16 ? 6 : a <= 18 ? 4 : a <= 21 ? 2 : a <= 25 ? 0 : a <= 30 ? -2 : -4; }
  function rarityOf(o) { return o >= 84 ? { name: "Легендарный", c: "#ffcf3a" } : o >= 74 ? { name: "Эпический", c: "#b06bff" } : o >= 64 ? { name: "Редкий", c: "#46b6ff" } : o >= 55 ? { name: "Необычный", c: "#3fe07a" } : { name: "Обычный", c: "#9aa6bf" }; }
  function divOf(o) { return o >= 85 ? 1 : o >= 78 ? 2 : o >= 70 ? 3 : o >= 63 ? 4 : o >= 56 ? 5 : o >= 48 ? 6 : 7; }
  function buildStats() {
    var r = rng(hashStr((state.nick || "player").toLowerCase() + "|" + isoOf(state.country || "")));
    var v = STAT_KEYS.map(function () { return 42 + Math.floor(r() * 34); });
    if (state.role === "fragger") { v[0] += 7; v[3] += 6; v[2] -= 4; v[4] -= 2; }
    else if (state.role === "igl") { v[2] += 7; v[4] += 7; v[0] -= 4; v[1] += 2; }
    v = v.map(function (x) { return Math.max(30, Math.min(97, x)); });
    var baseOvr = Math.round(v.reduce(function (a, b) { return a + b; }, 0) / 6), bonus = ageBonus(state.age);
    var overall = Math.max(30, Math.min(99, baseOvr + bonus));
    return { stats: v, baseOvr: baseOvr, bonus: bonus, overall: overall, rarity: rarityOf(overall), division: divOf(overall) };
  }
  function renderCard() {
    var wrap = $("#pcardWrap");
    var ready = state.nick && state.nick.trim().length >= 2 && state.age && +state.age >= 10 && state.country;
    if (!ready) { wrap.innerHTML = '<div class="pcard-empty">Заполни ник, возраст и&nbsp;страну — соберём карточку игрока автоматически.</div>'; return; }
    var s = buildStats(), iso = isoOf(state.country);
    var pos = state.role === "fragger" ? "ФРГ" : state.role === "igl" ? "ИГЛ" : "—";
    var av = state.avatar ? '<img src="' + state.avatar + '" alt="">' : '<span class="noav">нет<br>фото</span>';
    var rows = STAT_KEYS.map(function (k, i) { return '<div class="pc-row"><span class="s-k">' + k + '</span><span class="s-v">' + s.stats[i] + '</span><span class="s-bar"><i style="width:' + s.stats[i] + '%"></i></span></div>'; }).join("");
    wrap.innerHTML =
      '<div class="pcard" style="--rar:' + s.rarity.c + '">' +
        '<div class="pcard-top"><div>' +
          '<div class="pc-ovr">' + s.overall + '</div>' +
          '<div class="pc-base">' + s.baseOvr + ' <span>' + (s.bonus >= 0 ? "+" : "") + s.bonus + '</span></div>' +
          '<div><span class="pc-pos">' + pos + '</span></div>' +
          '<div class="pc-region"><img class="flag" src="' + flagUrl(iso) + '" alt=""> Европа</div>' +
        '</div><div class="pcard-av">' + av + '</div></div>' +
        '<div class="pcard-nick">' + esc(state.nick) + '</div>' +
        '<div class="pcard-rarity">' + s.rarity.name + '</div>' +
        '<div class="pcard-stats">' + rows + '</div>' +
        '<div class="pcard-div">FNCS · <b>Дивизион ' + s.division + '</b></div>' +
      '</div>';
  }

  /* ================= FOOT / NEXT ================= */
  var footHint = $("#footHint");
  function updateFoot() {
    var need = [];
    if (!state.nick || state.nick.trim().length < 2) need.push("ник");
    if (!state.age || +state.age < 10) need.push("возраст");
    if (!state.country) need.push("страну");
    if (!state.role) need.push("позицию");
    footHint.innerHTML = need.length ? "Осталось выбрать: " + need.join(", ") + "." : "Готово — жми «Далее».";
    footHint.style.color = need.length ? "" : "var(--green)";
  }
  $("#nextBtn").addEventListener("click", function () {
    if (!state.nick || state.nick.trim().length < 2) { $('.error[data-for="nickname"]').textContent = "Укажи никнейм"; nick.focus(); return; }
    if (!state.age || +state.age < 10) { $('.error[data-for="age"]').textContent = "Укажи возраст"; age.focus(); return; }
    if (!state.country) { footHint.innerHTML = "Выбери страну на карте."; footHint.style.color = "#ff9a9a"; $("#mapWrap").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (!state.role) { footHint.innerHTML = "Выбери позицию: Фрагер или IGL."; footHint.style.color = "#ff9a9a"; return; }
    var s = buildStats();
    localStorage.setItem("fnc_ping", pingOf(state.country) != null ? pingOf(state.country) : "");
    localStorage.setItem("fnc_country_name", nameOf(state.country));
    localStorage.setItem("fnc_country_flag", isoOf(state.country));
    localStorage.setItem("fnc_overall", s.overall);
    localStorage.setItem("fnc_base", s.baseOvr);
    localStorage.setItem("fnc_bonus", s.bonus);
    localStorage.setItem("fnc_rarity", s.rarity.name);
    localStorage.setItem("fnc_rarity_color", s.rarity.c);
    localStorage.setItem("fnc_division", s.division);
    localStorage.setItem("fnc_stats", JSON.stringify({ keys: STAT_KEYS, vals: s.stats }));
    localStorage.setItem("fnc_pos", state.role === "fragger" ? "ФРГ" : state.role === "igl" ? "ИГЛ" : "—");
    window.location.href = "next.html";
  });

  /* ================= INIT / RESTORE ================= */
  buildMap();
  if (state.avatar) setAvatar(state.avatar);
  if (state.nick) nick.value = state.nick;
  if (state.age) age.value = state.age;
  if (state.country) selectCountry(state.country);
  if (state.role) { var rc = roleGrid.querySelector('.role-card[data-role="' + state.role + '"]'); if (rc) rc.classList.add("active"); }
  updateFoot(); renderCard();
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();

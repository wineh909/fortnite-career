/* FNCS Career — career setup (map + form). Visual only, data in localStorage. */
(function () {
  "use strict";
  var SVGNS = "http://www.w3.org/2000/svg";
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---- Ping (ms to Frankfurt) — демо-значения, Россия 65 ---- */
  var PING = {
    ru: 65, de: 9, nl: 11, be: 12, lu: 10, fr: 17, ch: 14, at: 13, cz: 15, pl: 21,
    sk: 17, hu: 19, si: 18, hr: 20, it: 23, es: 31, pt: 41, gb: 17, ie: 27, dk: 18,
    no: 31, se: 27, fi: 34, ee: 35, lv: 34, lt: 32, by: 37, ua: 41, md: 44, ro: 31,
    bg: 37, rs: 29, ba: 27, me: 31, mk: 35, al: 39, gr: 47, mt: 37, cy: 62, tr: 57,
    ge: 72, am: 80, az: 84, is: 39, fo: 33, ax: 35, xk: 35, ma: 46, dz: 41, tn: 39, ly: 60
  };
  /* Russian names */
  var RU = {
    ru: "Россия", de: "Германия", fr: "Франция", gb: "Великобритания", it: "Италия",
    es: "Испания", pt: "Португалия", nl: "Нидерланды", be: "Бельгия", lu: "Люксембург",
    ch: "Швейцария", at: "Австрия", pl: "Польша", cz: "Чехия", sk: "Словакия", hu: "Венгрия",
    ro: "Румыния", bg: "Болгария", gr: "Греция", tr: "Турция", ua: "Украина", by: "Беларусь",
    lt: "Литва", lv: "Латвия", ee: "Эстония", fi: "Финляндия", se: "Швеция", no: "Норвегия",
    dk: "Дания", is: "Исландия", ie: "Ирландия", hr: "Хорватия", si: "Словения",
    ba: "Босния и Герцеговина", rs: "Сербия", me: "Черногория", mk: "Сев. Македония",
    al: "Албания", md: "Молдова", cy: "Кипр", mt: "Мальта", li: "Лихтенштейн", ad: "Андорра",
    sm: "Сан-Марино", mc: "Монако", va: "Ватикан", xk: "Косово", fo: "Фареры", ax: "Аланды",
    ge: "Грузия", am: "Армения", az: "Азербайджан", kz: "Казахстан", ma: "Марокко",
    dz: "Алжир", tn: "Тунис", ly: "Ливия", eg: "Египет", sy: "Сирия", lb: "Ливан",
    il: "Израиль", jo: "Иордания", iq: "Ирак", ir: "Иран", sa: "Саудовская Аравия",
    kw: "Кувейт", ps: "Палестина"
  };
  /* Countries that sprawl east/south — excluded from the Europe framing bbox */
  var SPRAWL = { ru: 1, kz: 1, ir: 1, sa: 1, iq: 1, eg: 1, ly: 1, sy: 1, jo: 1, il: 1, lb: 1, ps: 1, kw: 1 };
  var flagUrl = function (id) { return "https://flagcdn.com/w320/" + id + ".png"; };
  var nameOf = function (id, fallback) { return RU[id] || fallback || id.toUpperCase(); };

  /* ---- State ---- */
  var state = {
    avatar: localStorage.getItem("fnc_avatar") || "",
    nick: localStorage.getItem("fnc_nick") || "",
    country: localStorage.getItem("fnc_country") || "",
    role: localStorage.getItem("fnc_role") || ""
  };

  /* ================= MAP ================= */
  var host = $("#mapSvgHost");
  var paths = {};
  var labelSize = 5;

  function buildMap() {
    if (!window.EUROPE_MAP) { host.textContent = "Карта не загрузилась."; return; }
    var data = window.EUROPE_MAP;
    var svg = document.createElementNS(SVGNS, "svg");
    svg.setAttribute("viewBox", data.worldViewBox);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Карта Европы с пингом");
    var defs = document.createElementNS(SVGNS, "defs");
    svg.appendChild(defs);

    data.locations.forEach(function (loc) {
      var p = document.createElementNS(SVGNS, "path");
      p.setAttribute("d", loc.path);
      p.setAttribute("class", "country");
      p.setAttribute("vector-effect", "non-scaling-stroke");
      p.setAttribute("fill", "transparent");
      p.style.pointerEvents = "all";
      p.setAttribute("data-id", loc.id);
      p.setAttribute("data-name", nameOf(loc.id, loc.name));
      p.addEventListener("click", function () { selectCountry(loc.id); });
      svg.appendChild(p);
      paths[loc.id] = p;
    });
    host.appendChild(svg);

    /* frame viewBox to Europe (exclude sprawlers) */
    var fb = null;
    Object.keys(paths).forEach(function (id) {
      if (SPRAWL[id]) return;
      var b = paths[id].getBBox();
      if (!b.width) return;
      if (!fb) fb = { x: b.x, y: b.y, x2: b.x + b.width, y2: b.y + b.height };
      else { fb.x = Math.min(fb.x, b.x); fb.y = Math.min(fb.y, b.y); fb.x2 = Math.max(fb.x2, b.x + b.width); fb.y2 = Math.max(fb.y2, b.y + b.height); }
    });
    var w = fb.x2 - fb.x, h = fb.y2 - fb.y;
    var padX = w * 0.02, padY = h * 0.04;
    var vb = [fb.x - padX, fb.y - padY, w + padX * 2, h + padY * 2];
    svg.setAttribute("viewBox", vb.join(" "));
    labelSize = vb[2] * 0.023;

    /* flag fills + ping labels */
    data.locations.forEach(function (loc) {
      var p = paths[loc.id];
      var b = p.getBBox();
      if (!b.width) return;
      var cp = document.createElementNS(SVGNS, "clipPath");
      cp.id = "cp-" + loc.id;
      cp.setAttribute("clipPathUnits", "userSpaceOnUse");
      var cpath = document.createElementNS(SVGNS, "path");
      cpath.setAttribute("d", loc.path);
      cp.appendChild(cpath); defs.appendChild(cp);
      var im = document.createElementNS(SVGNS, "image");
      im.setAttribute("href", flagUrl(loc.id));
      im.setAttributeNS("http://www.w3.org/1999/xlink", "href", flagUrl(loc.id));
      im.setAttribute("x", b.x); im.setAttribute("y", b.y);
      im.setAttribute("width", b.width); im.setAttribute("height", b.height);
      im.setAttribute("preserveAspectRatio", "xMidYMid slice");
      im.setAttribute("clip-path", "url(#cp-" + loc.id + ")");
      im.style.pointerEvents = "none";
      svg.insertBefore(im, p);

      /* label */
      if (PING[loc.id] == null) return;
      var cx, cy;
      if (loc.id === "ru") { cx = vb[0] + vb[2] * 0.83; cy = vb[1] + vb[3] * 0.22; }
      else {
        cx = b.x + b.width / 2; cy = b.y + b.height / 2;
        var inX = cx > vb[0] + vb[2] * 0.01 && cx < vb[0] + vb[2] * 0.99;
        var inY = cy > vb[1] + vb[3] * 0.01 && cy < vb[1] + vb[3] * 0.99;
        if (!inX || !inY) return;
        if (b.width < vb[2] * 0.016 && b.height < vb[3] * 0.016) return; // skip micro
      }
      var t = document.createElementNS(SVGNS, "text");
      t.setAttribute("class", "ping-label");
      t.setAttribute("x", cx); t.setAttribute("y", cy);
      t.setAttribute("font-size", labelSize);
      t.style.strokeWidth = (labelSize * 0.16) + "px";
      t.textContent = PING[loc.id];
      svg.appendChild(t);
    });
  }

  var selectedLine = $("#selectedLine");
  function selectCountry(id) {
    if (!paths[id]) return;
    state.country = id;
    localStorage.setItem("fnc_country", id);
    Object.keys(paths).forEach(function (k) { paths[k].classList.toggle("selected", k === id); });
    var ping = PING[id];
    var html = '<img class="flag" src="' + flagUrl(id) + '" alt="" /> ' + nameOf(id, paths[id].getAttribute("data-name"));
    html += ping != null ? ' — пинг <b>&nbsp;' + ping + ' мс</b>' : ' — <b>&nbsp;регион вне зоны</b>';
    selectedLine.innerHTML = html;
    updateFoot();
  }

  /* ---- search ---- */
  var search = $("#countrySearch");
  search.addEventListener("input", function () {
    var q = search.value.trim().toLowerCase();
    Object.keys(paths).forEach(function (id) {
      var nm = (paths[id].getAttribute("data-name") || "").toLowerCase();
      var hit = !q || nm.indexOf(q) >= 0 || id.indexOf(q) >= 0;
      paths[id].classList.toggle("dim", !hit && !!q);
    });
  });

  /* ---- region tabs ---- */
  var placeholder = $("#mapPlaceholder");
  var regionNames = { "na-central": "NA Central", "na-west": "NA West", brazil: "Бразилия", asia: "Азия", me: "Ближний Восток", oce: "Океания" };
  $("#regionTabs").addEventListener("click", function (e) {
    var b = e.target.closest(".tab"); if (!b) return;
    Array.prototype.forEach.call(this.querySelectorAll(".tab"), function (t) { t.classList.remove("active"); });
    b.classList.add("active");
    var r = b.getAttribute("data-region");
    if (r === "europe") { placeholder.style.display = "none"; }
    else { placeholder.style.display = "grid"; placeholder.innerHTML = "Карта региона «" + regionNames[r] + "»<br/>появится позже.<br/><span style='color:var(--faint);font-size:12px'>Пока доступна Европа.</span>"; }
  });

  /* ================= AVATAR ================= */
  var avInput = $("#avatarInput"), avBox = $("#avatarBox"), avImg = $("#avatarImg");
  function setAvatar(url) {
    state.avatar = url;
    avImg.src = url; avImg.hidden = false; avBox.classList.add("has-img");
    try { localStorage.setItem("fnc_avatar", url); } catch (e) {}
    updateFoot();
  }
  avInput.addEventListener("change", function () {
    var f = avInput.files && avInput.files[0]; if (!f) return;
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var max = 440, w = img.width, h = img.height;
        var s = Math.min(1, max / Math.max(w, h));
        var cw = Math.round(w * s), ch = Math.round(h * s);
        var c = document.createElement("canvas"); c.width = cw; c.height = ch;
        c.getContext("2d").drawImage(img, 0, 0, cw, ch);
        try { setAvatar(c.toDataURL("image/jpeg", 0.85)); } catch (err) { setAvatar(e.target.result); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(f);
  });

  /* ================= NICKNAME ================= */
  var nick = $("#nickname");
  nick.addEventListener("input", function () {
    state.nick = nick.value;
    localStorage.setItem("fnc_nick", nick.value);
    $('.error[data-for="nickname"]').textContent = "";
    updateFoot();
  });

  /* ================= ROLES ================= */
  var roleGrid = $("#roleGrid");
  roleGrid.addEventListener("click", function (e) {
    var c = e.target.closest(".role-card"); if (!c) return;
    state.role = c.getAttribute("data-role");
    localStorage.setItem("fnc_role", state.role);
    Array.prototype.forEach.call(roleGrid.querySelectorAll(".role-card"), function (x) { x.classList.toggle("active", x === c); });
    updateFoot();
  });

  /* ================= FOOT / NEXT ================= */
  var footHint = $("#footHint");
  function updateFoot() {
    var need = [];
    if (!state.nick || state.nick.trim().length < 2) need.push("ник");
    if (!state.country) need.push("страну");
    if (!state.role) need.push("позицию");
    footHint.innerHTML = need.length ? "Осталось выбрать: " + need.join(", ") + "." : "Готово — жми «Далее».";
    footHint.style.color = need.length ? "" : "var(--green)";
  }
  $("#nextBtn").addEventListener("click", function () {
    if (!state.nick || state.nick.trim().length < 2) { $('.error[data-for="nickname"]').textContent = "Укажи никнейм"; nick.focus(); return; }
    if (!state.country) { footHint.innerHTML = "Выбери страну на карте."; footHint.style.color = "#ff9a9a"; document.getElementById("mapWrap").scrollIntoView({ behavior: "smooth", block: "center" }); return; }
    if (!state.role) { footHint.innerHTML = "Выбери позицию: Фрагер или IGL."; footHint.style.color = "#ff9a9a"; return; }
    localStorage.setItem("fnc_ping", PING[state.country] != null ? PING[state.country] : "");
    localStorage.setItem("fnc_country_name", nameOf(state.country));
    window.location.href = "next.html";
  });

  /* ================= INIT / RESTORE ================= */
  buildMap();
  if (state.avatar) setAvatar(state.avatar);
  if (state.nick) nick.value = state.nick;
  if (state.country && paths[state.country]) selectCountry(state.country);
  if (state.role) {
    var rc = roleGrid.querySelector('.role-card[data-role="' + state.role + '"]');
    if (rc) rc.classList.add("active");
  }
  updateFoot();
  document.querySelectorAll("[data-year]").forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();

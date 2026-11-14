/* ИНВЕСТ ОРДЕР — административная панель (прототип, данные в памяти страницы) */
(function () {
  const D = window.IO_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const nf = new Intl.NumberFormat("ru-RU");
  const nf1 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
  const rub = (n) => (n < 0 ? "−" : "") + nf.format(Math.abs(Math.round(n))) + " ₽";
  const mln = (n) => nf1.format(n / 1e6) + " млн ₽";
  const today = "13.11.2026";
  const nowTime = () => { const d = new Date(); return today + " " + String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); };

  /* ---------- Иконки ---------- */
  const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">${d}</svg>`;
  const ICON = {
    dash: ic('<path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z"/>'),
    apps: ic('<path d="M9 5h10M9 12h10M9 19h10M4 5h1M4 12h1M4 19h1"/>'),
    proj: ic('<path d="M3 21h18M6 21V10l6-5 6 5v11"/>'),
    fin: ic('<rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>'),
    part: ic('<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20c.8-3.5 3.2-5 6-5s5.2 1.5 6 5M15 15c2.5 0 4.5 1.3 5.5 4"/>'),
    key: ic('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>'),
    rep: ic('<path d="M4 19V5M4 19h16M8 15l4-4 3 3 5-6"/>'),
    log: ic('<path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/>'),
    users: ic('<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>'),
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5L20 7"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    ok: ic('<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>'),
    warn: ic('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5"/>'),
    eye: ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'),
    undo: ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 010 10h-3"/>'),
    plus: ic('<path d="M12 5v14M5 12h14"/>'),
    dl: ic('<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>')
  };

  /* ---------- Роли ---------- */
  const ROLES = {
    manager: { name: "Менеджер", person: "Алексей Смирнов", av: "АС", views: ["dash", "apps", "part", "access"] },
    editor: { name: "Редактор проектов", person: "Ольга Ветрова", av: "ОВ", views: ["dash", "proj", "reports"] },
    finance: { name: "Финансовый сотрудник", person: "Тимур Алиев", av: "ТА", views: ["dash", "fin", "part", "reports"] },
    head: { name: "Утверждающий руководитель", person: "Руслан Гаджиев", av: "РГ", views: ["dash", "apps", "proj", "fin", "part", "access", "reports", "audit"] },
    admin: { name: "Администратор", person: "Дмитрий Козлов", av: "ДК", views: ["dash", "apps", "proj", "fin", "part", "access", "reports", "audit", "users"] }
  };
  const NAV = [
    ["Работа", [["dash", "Обзор", ICON.dash], ["apps", "Заявки", ICON.apps], ["part", "Участники", ICON.part], ["access", "Доступы", ICON.key]]],
    ["Проекты", [["proj", "Проекты", ICON.proj], ["fin", "Финансы", ICON.fin], ["reports", "Отчёты", ICON.rep]]],
    ["Система", [["audit", "Журнал", ICON.log], ["users", "Сотрудники и роли", ICON.users]]]
  ];
  let role = "head", view = "dash";
  const me = () => ROLES[role];

  /* ---------- Данные ---------- */
  const projects = D.projects.map((p, i) => ({ ...p, pub: p.status === "soon" ? "ready" : "published", author: "Ольга Ветрова", checks: null }));
  projects.push({
    ...D.projects[4], id: "io-107", title: "Складской комплекс, Новая Рига", city: "Истра", region: "mo", status: "soon", pub: "review",
    budget: 64e6, own: 14e6, target: 50e6, received: 0, participants: 0, stage: 0, author: "Ольга Ветрова",
    checks: { model: true, budget: true, legal: false, fees: false, access: true, disclosure: false }
  });
  projects.forEach((p) => { if (!p.checks) p.checks = { model: true, budget: true, legal: true, fees: true, access: true, disclosure: true }; });
  const CHECKS = { model: "Модель участия и распределения результата", budget: "Бюджет и источники финансирования", legal: "Юридическая схема и юрлицо-получатель", fees: "Комиссии: база, момент оплаты, включение в сумму", access: "Уровни доступа полей карточки", disclosure: "Обязательные раскрытия согласованы с юристом" };
  const PUB = { draft: ["Черновик", "muted"], review: ["Проверка", "warn"], ready: ["Готов к публикации", "blue"], published: ["Опубликован", "ok"], hidden: ["Скрыт", "muted"], archive: ["Архив", "muted"] };
  const FUND = { soon: ["Не открыт", "muted"], open: ["Открыт", "ok"], paused: ["Приостановлен", "warn"], closed: ["Закрыт", "muted"] };

  const APP_ST = [
    ["new", "Новая"], ["assigned", "Назначен ответственный"], ["contact", "Контакт установлен"], ["discussion", "Обсуждение"],
    ["agreed", "Условия согласованы"], ["signed", "Документы подписаны"], ["awaiting", "Ожидается поступление"],
    ["partial", "Частичное поступление"], ["confirmed", "Участие подтверждено"], ["side", "Отказ / отмена / лист ожидания"]
  ];
  let appSeq = 104220;
  const apps = [
    ["Мария Орлова", "io-104", 2e6, "Telegram", "new", "—"], ["Денис Ким", "io-102", 5e6, "Звонок", "new", "—"],
    ["Сергей Волков", "io-101", 1.5e6, "WhatsApp", "assigned", "АС"], ["Иван Петров", "io-104", 2e6, "Telegram", "discussion", "АС"],
    ["Эльмира Гасанова", "io-102", 3e6, "Звонок", "contact", "АС"], ["Павел Захаров", "io-101", 1e6, "E-mail", "agreed", "АС"],
    ["Виктор Ли", "io-102", 4e6, "Звонок", "signed", "АС"], ["Анна Соколова", "io-101", 2e6, "WhatsApp", "awaiting", "АС"],
    ["Иван Петров", "io-102", 5e6, "Telegram", "partial", "АС"], ["Рустам Магомедов", "io-103", 1e6, "Звонок", "side", "АС", "Лист ожидания"],
    ["Кирилл Белов", "io-101", 2.5e6, "Звонок", "confirmed", "АС"]
  ].map((a) => ({ id: "З-" + (appSeq++), name: a[0], project: a[1], amount: a[2], contact: a[3], st: a[4], owner: a[5], side: a[6] || "", date: "0" + (1 + appSeq % 9) + ".11.2026" }));

  // Реестр операций
  let opSeq = 1;
  const ops = [];
  const addOp = (o) => { const op = { id: "ОП-" + String(opSeq++).padStart(4, "0"), storno: false, by: "Тимур Алиев", ...o }; ops.push(op); return op; };
  const investors101 = [["Иван Петров", 1.5e6, "12.05"], ["Иван Петров", 1.5e6, "20.05"], ["Мария Орлова", 2.5e6, "14.05"], ["Денис Ким", 2e6, "15.05"], ["Рашид Гасанов", 3e6, "18.05"], ["Кирилл Белов", 1.5e6, "21.05"], ["Елена Соколова", 2e6, "22.05"], ["Шамиль Магомедов", 2.5e6, "27.05"], ["Виктор Ли", 1.5e6, "02.06"], ["Павел Захаров", 2e6, "05.06"]];
  addOp({ date: "10.05.2026", project: "io-101", party: "ООО «Инвест Ордер»", kind: "own", amount: 10e6, doc: "п/п 101", purpose: "Собственные вложения" });
  investors101.forEach(([n, a, d], i) => {
    addOp({ date: d + ".2026", project: "io-101", party: n, kind: "contrib", amount: a, doc: "п/п " + (2101 + i), purpose: "Взнос по договору" });
    addOp({ date: d + ".2026", project: "io-101", party: n, kind: "fee", amount: a * 0.1, doc: "п/п " + (3101 + i), purpose: "Комиссия 10% сверх суммы участия" });
  });
  addOp({ date: "08.06.2026", project: "io-101", party: "ИП Карпов (продавец участка)", kind: "expense", amount: 8.4e6, doc: "ДКП №14", purpose: "Оплата участка", article: "Приобретение" });
  addOp({ date: "15.07.2026", project: "io-101", party: "Росреестр", kind: "expense", amount: 22e3, doc: "п/п 410", purpose: "Госпошлина", article: "Оформление" });
  addOp({ date: "30.09.2026", project: "io-101", party: "ООО «СтальКаркас»", kind: "expense", amount: 2.68e6, doc: "Счёт 77", purpose: "Аванс подрядчику ЛСТК", article: "Строительство" });
  // поступления по другим проектам — агрегатом
  [["io-102", 52.5e6, 14], ["io-103", 15.6e6, 12], ["io-104", 4.4e6, 4], ["io-106", 17.5e6, 7]].forEach(([pid, sum, n]) => {
    for (let i = 0; i < n; i++) addOp({ date: "01.10.2026", project: pid, party: "Участник " + (i + 1), kind: "contrib", amount: sum / n, doc: "п/п " + pid.slice(-3) + (100 + i), purpose: "Взнос по договору" });
  });
  const KIND = {
    own: ["Собственные вложения", "blue"], contrib: ["Взнос в счёт финансирования", "ok"], fee: ["Комиссия инвестора", "muted"],
    refund: ["Возврат взноса", "bad"], expense: ["Расход", "warn"], profit: ["Выплата прибыли", "blue"], capital: ["Возврат капитала", "blue"]
  };

  const grants = [
    { id: 1, person: "Иван Петров", project: "io-101", scope: "Финансовая модель v3.1, проект договора", date: "12.05.2026", by: "Алексей Смирнов", active: true },
    { id: 2, person: "Иван Петров", project: "io-102", scope: "Все закрытые материалы проекта", date: "28.08.2026", by: "Алексей Смирнов", active: true },
    { id: 3, person: "Эльмира Гасанова", project: "io-102", scope: "Точный адрес, финансовая модель", date: "07.11.2026", by: "Алексей Смирнов", active: true },
    { id: 4, person: "Сергей Волков", project: "io-101", scope: "Финансовая модель v3.0", date: "02.04.2026", by: "Алексей Смирнов", active: false, revoked: "15.05.2026" }
  ];

  const reports = [
    { id: 1, project: "io-101", q: "III квартал 2026", st: "published", ver: 1, date: "20.10.2026", reads: 7 },
    { id: 2, project: "io-102", q: "III квартал 2026", st: "review", ver: 1, date: "—", reads: 0 },
    { id: 3, project: "io-103", q: "III квартал 2026", st: "draft", ver: 1, date: "—", reads: 0 },
    { id: 4, project: "io-101", q: "II квартал 2026", st: "published", ver: 2, date: "25.07.2026", reads: 9, reason: "Исправлена строка «Расходы на оформление»" }
  ];
  const REP = { draft: "Черновик", review: "Проверка", published: "Опубликован" };

  const staff = [
    ["Руслан Гаджиев", ["Руководитель"], true, "13.11 09:12"], ["Алексей Смирнов", ["Менеджер"], true, "13.11 10:40"],
    ["Ольга Ветрова", ["Редактор"], true, "12.11 18:05"], ["Тимур Алиев", ["Финансы"], true, "13.11 08:57"],
    ["Дмитрий Козлов", ["Администратор", "Финансы"], true, "11.11 16:30"]
  ];

  const audit = [];
  const log = (text, who) => { audit.unshift({ t: nowTime(), who: who || me().person, text, fresh: true }); };
  [["10.11.2026 14:02", "Тимур Алиев", "Сверка выписки по счёту ООО «ИО Подольск» за октябрь — расхождений нет"],
   ["08.11.2026 11:20", "Руслан Гаджиев", "Утверждена версия условий 2.0 проекта IO-102"],
   ["07.11.2026 16:45", "Алексей Смирнов", "Выдан доступ: Эльмира Гасанова → IO-102 (точный адрес, финмодель)"],
   ["06.11.2026 10:03", "Система", "Новая заявка З-104223 → IO-104"],
   ["20.10.2026 12:00", "Руслан Гаджиев", "Опубликован отчёт IO-101 за III квартал 2026"]].forEach(([t, w, x]) => audit.push({ t, who: w, text: x }));

  /* ---------- Расчёты ---------- */
  const proj = (id) => projects.find((p) => p.id === id);
  const live = (pid) => ops.filter((o) => o.project === pid);
  function fin(pid) {
    const L = live(pid), sum = (k) => L.filter((o) => o.kind === k).reduce((s, o) => s + o.amount, 0);
    const contrib = sum("contrib"), refund = sum("refund");
    const net = contrib - refund;
    const p = proj(pid);
    const cash = sum("own") + contrib - refund - sum("expense") - sum("profit") - sum("capital");
    const byInv = {};
    L.filter((o) => o.kind === "contrib" || o.kind === "refund").forEach((o) => { byInv[o.party] = (byInv[o.party] || 0) + (o.kind === "refund" ? -o.amount : o.amount); });
    const participants = Object.values(byInv).filter((v) => v > 0.5).length;
    return { contrib, refund, net, fee: sum("fee"), expense: sum("expense"), cash, participants, pct: p.target ? net / p.target * 100 : 0, left: Math.max(0, p.target - net), over: Math.max(0, net - p.target), payments: L.filter((o) => o.kind === "contrib" && o.amount > 0).length };
  }

  /* ---------- UI-утилиты ---------- */
  function toast(title, text, bad) {
    const t = document.createElement("div");
    t.className = "toast" + (bad ? " toast--bad" : "");
    t.innerHTML = (bad ? ICON.warn : ICON.ok) + `<div><b>${esc(title)}</b>${text ? `<span>${esc(text)}</span>` : ""}</div>`;
    $("#toasts").appendChild(t);
    setTimeout(() => { t.classList.add("is-out"); setTimeout(() => t.remove(), 500); }, 4200);
  }
  const st = (label, cls) => `<span class="st st--${cls}"><i></i>${esc(label)}</span>`;
  const thumb = (p) => {
    const art = D.directions[p.direction].art;
    const path = art === "hangar" ? "M8 38V24Q29 6 50 24V38M4 38H54" : art === "towers" ? "M6 38L22 32L52 35L36 42ZM20 34V12L28 10V32M32 35V18L40 16V34" : "M8 38V18H50V38M6 18H52V14H6ZM14 22H24V30H14ZM34 22H44V30H34Z";
    return `<div class="proj-thumb"><svg viewBox="0 0 58 46"><path d="${path}" fill="none" stroke="#45d6c6" stroke-width="1.2" stroke-linejoin="round"/></svg></div>`;
  };
  function openDrawer(html) { $("#drawerBody").innerHTML = html; $("#drawer").classList.add("is-open"); $("#drawer").setAttribute("aria-hidden", "false"); }
  function closeDrawer() { $("#drawer").classList.remove("is-open"); $("#drawer").setAttribute("aria-hidden", "true"); }
  const can = (v) => me().views.includes(v);
  const denied = (what) => toast("Недостаточно прав", `Роль «${me().name}» не может: ${what}`, true);
  function countUp(el) {
    const to = parseFloat(el.dataset.to), dec = +(el.dataset.dec || 0), t0 = performance.now();
    const f = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    (function tick(t) { const k = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - k, 4); el.textContent = f.format(to * e) + (el.dataset.suf || ""); if (k < 1) requestAnimationFrame(tick); })(t0);
  }

  /* ---------- Навигация ---------- */
  function renderNav() {
    const newApps = apps.filter((a) => a.st === "new").length;
    const overdue = overdueReports().length;
    $("#admNav").innerHTML = NAV.map(([g, items]) => {
      const vis = items.filter(([k]) => can(k));
      if (!vis.length) return "";
      return `<div class="adm-nav__group">${g}</div>` + vis.map(([k, t, i]) =>
        `<button data-view="${k}" class="${k === view ? "is-active" : ""}">${i}${t}${k === "apps" && newApps ? `<span class="count">${newApps}</span>` : ""}${k === "reports" && overdue ? `<span class="count count--warn">${overdue}</span>` : ""}</button>`).join("");
    }).join("");
  }
  function go(v) {
    if (!can(v)) v = "dash";
    view = v; $("#q").value = "";
    renderNav(); render();
    $("#side").classList.remove("is-open");
    scrollTo({ top: 0 });
  }

  /* ---------- Представления ---------- */
  const V = {};

  V.dash = () => {
    const newApps = apps.filter((a) => a.st === "new").length;
    const pending = apps.filter((a) => ["assigned", "contact", "discussion", "agreed", "signed", "awaiting", "partial"].includes(a.st)).length;
    const month = ops.filter((o) => o.kind === "contrib" && /\.(10|11)\.2026$/.test(o.date)).reduce((s, o) => s + o.amount, 0);
    const bars = projects.filter((p) => p.pub === "published").map((p) => ({ p, f: fin(p.id) }));
    const max = Math.max(...bars.map((b) => Math.max(b.p.target, b.f.net)));
    return `
    <div class="view-head"><div><span class="eyebrow">Добрый день, ${esc(me().person.split(" ")[0])}</span><h1 style="margin-top:10px">Обзор</h1><p>Сводка по заявкам, поступлениям и отчётности на ${today}.</p></div></div>
    <div class="kpis">
      <div class="kpi kpi--accent"><span>Новые заявки</span><b data-to="${newApps}">0</b><small>без ответственного</small><svg class="kpi__spark" viewBox="0 0 90 34"><path pathLength="1" d="M2 30L14 24L26 27L38 16L50 20L62 10L74 14L88 4"/></svg></div>
      <div class="kpi"><span>Ждут действия</span><b data-to="${pending}">0</b><small>заявки в работе</small><svg class="kpi__spark" viewBox="0 0 90 34"><path pathLength="1" d="M2 20L14 22L26 14L38 18L50 12L62 16L74 8L88 10"/></svg></div>
      <div class="kpi"><span>Поступления, окт–ноя</span><b><span data-to="${month / 1e6}" data-dec="1">0</span> млн ₽</b><small>взносы в счёт финансирования</small><svg class="kpi__spark" viewBox="0 0 90 34"><path pathLength="1" d="M2 30L14 28L26 22L38 24L50 14L62 12L74 6L88 4"/></svg></div>
      <div class="kpi"><span>Просроченные отчёты</span><b data-to="${overdueReports().length}">0</b><small>срок — 30 дней после квартала</small><svg class="kpi__spark" viewBox="0 0 90 34"><path pathLength="1" d="M2 24L14 24L26 18L38 22L50 22L62 18L74 20L88 16"/></svg></div>
    </div>
    <div class="grid-3-1">
      <div class="card">
        <div class="card__head"><h3>Сбор по проектам</h3><span class="muted" style="font-size:13px">чистые подтверждённые поступления / целевой сбор</span></div>
        <div style="display:grid;gap:16px">${bars.map(({ p, f }) => `
          <div data-search="${esc(p.title)}">
            <div style="display:flex;justify-content:space-between;gap:12px;font-size:14px;margin-bottom:7px"><span><b style="font-weight:600">${esc(p.id.toUpperCase())}</b> · ${esc(p.title)}</span><span class="mono" style="font-size:12.5px;white-space:nowrap">${nf1.format(f.pct)}% · ${mln(f.net)} / ${mln(p.target)}</span></div>
            <div class="mini-bar" style="height:10px"><i data-w="${Math.min(100, f.pct)}" style="width:0"></i></div>
          </div>`).join("")}</div>
      </div>
      <div class="card">
        <div class="card__head"><h3>Задачи</h3></div>
        <div class="checklist-pub">
          ${newApps ? `<div class="chk no"><span class="chk__ico">${ICON.x}</span><span>${newApps} нов. заявки без ответственного</span><button class="btn btn--ghost btn--xs" data-go="apps">Открыть</button></div>` : ""}
          ${overdueReports().map((p) => `<div class="chk no"><span class="chk__ico">${ICON.x}</span><span>Отчёт ${p.id.toUpperCase()} за III кв. просрочен</span><button class="btn btn--ghost btn--xs" data-go="reports">Открыть</button></div>`).join("")}
          ${projects.filter((p) => p.pub === "review").map((p) => `<div class="chk no"><span class="chk__ico">${ICON.x}</span><span>${esc(p.title)} ждёт утверждения</span><button class="btn btn--ghost btn--xs" data-go="proj">Открыть</button></div>`).join("")}
          <div class="chk ok"><span class="chk__ico">${ICON.check}</span><span>Сверка с банком за октябрь</span></div>
        </div>
      </div>
    </div>
    <div class="card"><div class="card__head"><h3>Последние действия</h3>${can("audit") ? `<button class="btn btn--ghost btn--xs" data-go="audit">Весь журнал</button>` : ""}</div>
      <ul class="audit">${audit.slice(0, 6).map(auditRow).join("")}</ul></div>`;
  };

  V.apps = () => `
    <div class="view-head"><div><span class="eyebrow">Воронка</span><h1 style="margin-top:10px">Заявки</h1><p>Перетащите карточку или используйте стрелки. Статус заявки не меняет сбор и не резервирует место — поступления фиксирует финансовый сотрудник.</p></div>
      <div class="view-head__actions"><button class="btn btn--sm" id="newApp">${ICON.plus.replace("<svg", '<svg width="16"')} Тестовая заявка</button><button class="btn btn--ghost btn--sm" data-export="apps">${ICON.dl.replace("<svg", '<svg width="16"')} Экспорт CSV</button></div></div>
    <div class="kanban" id="kanban">${APP_ST.map(([k, t]) => {
      const list = apps.filter((a) => a.st === k);
      return `<div class="kcol ${k === "side" ? "kcol--side" : ""}" data-st="${k}"><div class="kcol__head">${t}<span>${list.length}</span></div>${list.map(appCard).join("")}</div>`;
    }).join("")}</div>`;
  const appCard = (a) => {
    const p = proj(a.project);
    return `<div class="kcard" draggable="true" data-app="${a.id}" data-search="${esc(a.name + " " + p.title + " " + a.id)}" style="border-left-color:${a.st === "side" ? "var(--ink-3)" : a.st === "confirmed" ? "var(--teal-3)" : a.st === "new" ? "var(--warn)" : "var(--teal)"}">
      <b>${esc(a.name)}</b><p>${esc(p.title)}${a.side ? ` · <em>${esc(a.side)}</em>` : ""}</p>
      <div class="kcard__foot"><strong>${mln(a.amount)}</strong><span>${esc(a.contact)}</span>${a.owner !== "—" ? `<span class="mini-av" title="Ответственный">${a.owner}</span>` : `<span class="st st--warn" style="height:22px">без отв.</span>`}</div>
      <div class="kcard__move"><button data-mv="-1" aria-label="Предыдущий статус">←</button><button data-open-app="${a.id}">Открыть</button><button data-mv="1" aria-label="Следующий статус">→</button></div>
    </div>`;
  };

  V.proj = () => `
    <div class="view-head"><div><span class="eyebrow">Карточки</span><h1 style="margin-top:10px">Проекты</h1><p>Три независимых статуса: публикация, финансирование, реализация. Публикует только руководитель, и только если все критичные поля утверждены.</p></div></div>
    <div class="card">${projects.map((p) => {
      const f = fin(p.id);
      const allOk = Object.values(p.checks).every(Boolean);
      return `<div class="proj-row" data-search="${esc(p.title + " " + p.id + " " + p.city)}">
        ${thumb(p)}
        <div><b>${esc(p.title)}</b><small>${p.id.toUpperCase()} · ${esc(p.city)} · v${esc(p.version)}</small></div>
        <div class="stack"><small>Публикация</small>${st(...PUB[p.pub])}</div>
        <div class="stack"><small>Финансирование</small>${st(...FUND[p.status])}</div>
        <div class="stack" style="min-width:120px"><small>Сбор ${nf1.format(f.pct)}%</small><div class="mini-bar"><i data-w="${Math.min(100, f.pct)}" style="width:0"></i></div></div>
        <div style="display:flex;gap:8px">${!allOk ? `<span class="st st--bad" title="Пустые критичные поля">${Object.values(p.checks).filter((x) => !x).length} блок.</span>` : ""}<button class="btn btn--ghost btn--xs" data-open-proj="${p.id}">Открыть</button></div>
      </div>`;
    }).join("")}</div>`;

  function projDrawer(id) {
    const p = proj(id), f = fin(id);
    const allOk = Object.values(p.checks).every(Boolean);
    const isHead = role === "head";
    const selfApprove = me().person === p.author;
    openDrawer(`
      <span class="eyebrow">${p.id.toUpperCase()} · автор: ${esc(p.author)}</span>
      <h2>${esc(p.title)}</h2>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:22px">${st(...PUB[p.pub])}${st(...FUND[p.status])}${st("Стадия: " + p.stages[p.stage], "blue")}</div>
      <h4 style="margin:0 0 10px">Чек-лист публикации</h4>
      <div class="checklist-pub">${Object.entries(CHECKS).map(([k, t]) => `<div class="chk ${p.checks[k] ? "ok" : "no"}"><span class="chk__ico">${p.checks[k] ? ICON.check : ICON.x}</span><span>${t}</span>${!p.checks[k] ? `<button class="btn btn--ghost btn--xs" data-chk="${k}" data-p="${p.id}">Утвердить</button>` : ""}</div>`).join("")}</div>
      ${!allOk ? `<div class="alert" style="margin-top:14px">${ICON.warn}<span>Публикация заблокирована: не утверждены критичные поля.</span></div>` : ""}
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">
        ${p.pub !== "published" ? `<button class="btn btn--sm" data-publish="${p.id}" ${!allOk ? "disabled" : ""}>Опубликовать</button>` : `<button class="btn btn--ghost btn--sm" data-hide="${p.id}">Скрыть с сайта</button>`}
        <a class="btn btn--ghost btn--sm" href="project.html?id=${p.id}" target="_blank" rel="noopener">Публичная карточка</a>
      </div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">${!isHead ? "Публикацию утверждает только руководитель." : selfApprove ? "Автор карточки не может утвердить свою публикацию." : "Утверждение будет записано в журнал."}</p>
      <h4 style="margin:28px 0 10px">Финансирование</h4>
      <dl class="dl">
        <dt>Целевой сбор</dt><dd>${rub(p.target)}</dd>
        <dt>Чистые поступления</dt><dd>${rub(f.net)} · ${nf1.format(f.pct)}%</dd>
        <dt>Остаток привлечения</dt><dd>${rub(f.left)}</dd>
        ${f.over ? `<dt>Превышение</dt><dd style="color:var(--warn)">${rub(f.over)}</dd>` : ""}
        <dt>Участников</dt><dd>${f.participants}${p.seats ? " из " + p.seats + " мест" : ""}</dd>
      </dl>
      <h4 style="margin:28px 0 10px">Статус финансирования</h4>
      <div class="seg">${Object.entries(FUND).map(([k, [t]]) => `<button data-fund="${k}" data-p="${p.id}" class="${p.status === k ? "is-active" : ""}">${t}</button>`).join("")}</div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">Смена статуса финансирования не меняет статус публикации и стадию реализации.</p>`);
  }

  let finProject = "io-101", finFilter = "all";
  V.fin = () => {
    const p = proj(finProject), f = fin(finProject);
    const list = ops.filter((o) => o.project === finProject && (finFilter === "all" || o.kind === finFilter)).slice().reverse();
    return `
    <div class="view-head"><div><span class="eyebrow">Управленческий реестр</span><h1 style="margin-top:10px">Финансы</h1><p>Обособленный учёт по каждому проекту. Исправления — только сторнированием. Реестр не заменяет бухгалтерский учёт.</p></div>
      <div class="view-head__actions"><label class="select-pill"><span class="sr-only">Проект</span><select id="finProj">${projects.filter((x) => x.pub === "published").map((x) => `<option value="${x.id}" ${x.id === finProject ? "selected" : ""}>${x.id.toUpperCase()} · ${esc(x.title)}</option>`).join("")}</select></label><button class="btn btn--ghost btn--sm" data-export="ops">${ICON.dl.replace("<svg", '<svg width="16"')} Экспорт</button></div></div>
    <div class="fin-scale">
      <div class="ring" data-ring="${f.pct}"><svg viewBox="0 0 120 120"><defs><linearGradient id="ringGrad"><stop offset="0" stop-color="#45d6c6"/><stop offset="1" stop-color="#2593b8"/></linearGradient></defs><circle class="ring__bg" cx="60" cy="60" r="52"/><circle class="ring__fg" cx="60" cy="60" r="52"/></svg><div class="ring__val">${Math.round(f.pct)}%</div></div>
      <div><h4>Шкала сбора</h4><p>Чистые подтверждённые взносы ÷ целевой сбор. Комиссии сверх суммы участия и собственные вложения в шкалу не входят. Возврат взноса уменьшает шкалу, выплата прибыли — нет.</p></div>
      <div class="fin-scale__nums"><div><span>Поступило</span><b>${mln(f.net)}</b></div><div><span>Цель</span><b>${mln(p.target)}</b></div><div><span>${f.over ? "Превышение" : "Осталось"}</span><b>${mln(f.over || f.left)}</b></div></div>
    </div>
    <div class="fin-sum">
      <div><span>Остаток денежных средств</span><b id="fsCash">${rub(f.cash)}</b></div>
      <div><span>Уникальных участников</span><b>${f.participants}</b><span>${f.payments} платежей</span></div>
      <div><span>Комиссии инвесторов</span><b>${rub(f.fee)}</b><span>получатель — ООО «Инвест Ордер»</span></div>
      <div><span>Расходы проекта</span><b>${rub(f.expense)}</b></div>
    </div>
    ${role === "finance" || role === "admin" || role === "head" ? `
    <div class="card"><div class="card__head"><h3>Новая операция</h3><span class="muted" style="font-size:13px">юрлицо: ${esc(p.entity)}</span></div>
      <form class="op-form" id="opForm" novalidate>
        <div class="field field--select"><select name="kind" id="op-kind">${Object.entries(KIND).map(([k, [t]]) => `<option value="${k}" ${k === "contrib" ? "selected" : ""}>${t}</option>`).join("")}</select><label for="op-kind">Вид операции</label></div>
        <div class="field"><input name="party" id="op-party" placeholder=" " value="Иван Петров" required><label for="op-party">Участник / контрагент</label></div>
        <div class="field"><input name="amount" id="op-amount" placeholder=" " inputmode="numeric" value="1 500 000" required><label for="op-amount">Сумма, ₽</label></div>
        <div class="field"><input name="date" id="op-date" placeholder=" " value="20.05.2026" required><label for="op-date">Дата платежа</label></div>
        <div class="field"><input name="doc" id="op-doc" placeholder=" " value="п/п 2102" required><label for="op-doc">Документ-основание</label></div>
        <div class="field"><input name="purpose" id="op-purpose" placeholder=" " value="Взнос по договору"><label for="op-purpose">Назначение</label></div>
        <div class="op-form__foot"><p class="op-form__hint">Защита от дублей: проект + дата + сумма + контрагент + документ. Предзаполнены данные уже внесённого платежа — попробуйте сохранить, затем измените номер документа.</p><button class="btn btn--sm" type="submit">Провести операцию</button></div>
      </form></div>` : `<div class="notice-role">${ICON.eye}<span>Роль «${esc(me().name)}» видит реестр только для чтения.</span></div>`}
    <div class="card">
      <div class="card__head"><h3>Реестр операций</h3>
        <div class="seg">${[["all", "Все"], ["contrib", "Взносы"], ["fee", "Комиссии"], ["expense", "Расходы"], ["refund", "Возвраты"]].map(([k, t]) => `<button data-ff="${k}" class="${finFilter === k ? "is-active" : ""}">${t}</button>`).join("")}</div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>№</th><th>Дата</th><th>Вид</th><th>Контрагент</th><th>Документ</th><th class="num">Сумма</th><th>Внёс</th><th></th></tr></thead><tbody>
        ${list.length ? list.map((o) => `<tr data-op="${o.id}" class="${o.fresh ? "is-new" : ""} ${o.storno ? "is-storno" : ""} ${o.reverses ? "is-reverse" : ""}" data-search="${esc(o.party + " " + o.doc + " " + o.id)}">
          <td class="mono">${o.id}</td><td>${o.date}</td><td>${o.reverses ? st("Сторно " + o.reverses, "bad") : st(...KIND[o.kind])}</td><td>${esc(o.party)}</td><td class="mono">${esc(o.doc)}</td>
          <td class="num"><b>${rub(o.amount)}</b></td><td class="mono">${esc(o.by)}</td>
          <td>${!o.storno && !o.reverses && (role === "finance" || role === "admin") ? `<button class="icon-act" data-storno="${o.id}" title="Сторнировать" aria-label="Сторнировать ${o.id}">${ICON.undo}</button>` : ""}</td></tr>`).join("") : `<tr><td colspan="8" class="tbl-empty">Нет операций</td></tr>`}
      </tbody></table></div></div>`;
  };

  V.part = () => {
    const rows = [];
    projects.forEach((p) => {
      const byInv = {};
      ops.filter((o) => o.project === p.id && ["contrib", "refund", "fee"].includes(o.kind)).forEach((o) => {
        const r = byInv[o.party] || (byInv[o.party] = { paid: 0, fee: 0, n: 0 });
        if (o.kind === "fee") r.fee += o.amount; else { r.paid += o.kind === "refund" ? -o.amount : o.amount; if (o.kind === "contrib" && o.amount > 0) r.n++; }
      });
      Object.entries(byInv).forEach(([name, r]) => { if (!/^Участник/.test(name)) rows.push({ name, p, ...r }); });
    });
    return `
    <div class="view-head"><div><span class="eyebrow">Реестр участия</span><h1 style="margin-top:10px">Участники</h1><p>Один инвестор с несколькими платежами — один участник. Внесённые средства и комиссии показаны раздельно.</p></div><button class="btn btn--ghost btn--sm" data-export="part">${ICON.dl.replace("<svg", '<svg width="16"')} Экспорт</button></div>
    <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Участник</th><th>Проект</th><th>Платежей</th><th class="num">Внесено</th><th class="num">Комиссия</th><th>Статус</th><th>Версия условий</th></tr></thead><tbody>
      ${rows.map((r) => `<tr data-search="${esc(r.name + " " + r.p.title)}"><td><b>${esc(r.name)}</b></td><td>${esc(r.p.id.toUpperCase())}</td><td>${r.n}</td><td class="num">${rub(r.paid)}</td><td class="num">${rub(r.fee)}</td><td>${r.paid > 0 ? st("Участие подтверждено", "ok") : st("Возврат", "bad")}</td><td class="mono">${esc(r.p.version)}</td></tr>`).join("")}
    </tbody></table></div></div>`;
  };

  V.access = () => `
    <div class="view-head"><div><span class="eyebrow">Закрытые материалы</span><h1 style="margin-top:10px">Доступы</h1><p>Разрешение выдаётся на конкретный проект, отдельно от членства. Отзыв блокирует дальнейшее получение файлов; уже скачанные копии удалить нельзя.</p></div></div>
    <div class="card"><div class="card__head"><h3>Выдать доступ</h3></div>
      <form class="op-form" id="grantForm" novalidate>
        <div class="field"><input name="person" id="g-person" placeholder=" " required><label for="g-person">Кандидат / участник</label></div>
        <div class="field field--select"><select name="project" id="g-project">${projects.filter((p) => p.pub === "published").map((p) => `<option value="${p.id}">${p.id.toUpperCase()} · ${esc(p.title)}</option>`).join("")}</select><label for="g-project">Проект</label></div>
        <div class="field field--select"><select name="scope" id="g-scope"><option>Точный адрес</option><option>Финансовая модель</option><option>Проект договора</option><option>Все закрытые материалы проекта</option></select><label for="g-scope">Область доступа</label></div>
        <div class="op-form__foot"><p class="op-form__hint">Будут записаны дата выдачи и ответственный — ${esc(me().person)}.</p><button class="btn btn--sm" type="submit">Выдать доступ</button></div>
      </form></div>
    <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Кому</th><th>Проект</th><th>Область</th><th>Выдан</th><th>Ответственный</th><th>Статус</th><th></th></tr></thead><tbody>
      ${grants.slice().reverse().map((g) => `<tr class="${g.fresh ? "is-new" : ""}" data-search="${esc(g.person + " " + g.project + " " + g.scope)}"><td><b>${esc(g.person)}</b></td><td>${g.project.toUpperCase()}</td><td>${esc(g.scope)}</td><td>${g.date}</td><td>${esc(g.by)}</td><td>${g.active ? st("Действует", "ok") : st("Отозван " + g.revoked, "bad")}</td><td>${g.active ? `<button class="btn btn--danger btn--xs" data-revoke="${g.id}">Отозвать</button>` : ""}</td></tr>`).join("")}
    </tbody></table></div></div>`;

  function overdueReports() {
    return projects.filter((p) => p.pub === "published" && ["open", "closed", "paused"].includes(p.status) && !reports.some((r) => r.project === p.id && r.q === "III квартал 2026" && r.st === "published"));
  }
  V.reports = () => `
    <div class="view-head"><div><span class="eyebrow">Отчётность</span><h1 style="margin-top:10px">Квартальные отчёты</h1><p>Черновик → проверка → опубликован. Опубликованный отчёт меняется только новой версией с причиной; предыдущая сохраняется.</p></div></div>
    ${overdueReports().length ? `<div class="notice-role">${ICON.warn}<span>Не опубликованы отчёты за III квартал (срок — 30.10.2026): ${overdueReports().map((p) => p.id.toUpperCase()).join(", ")}</span></div>` : ""}
    <div class="card">${reports.map((r) => {
      const p = proj(r.project), steps = ["draft", "review", "published"], idx = steps.indexOf(r.st);
      return `<div class="rep" data-search="${esc(p.title + " " + r.q)}">
        <div><b>${esc(p.title)} · ${r.q}</b><p>Версия ${r.ver}${r.reason ? " · " + esc(r.reason) : ""} · ${r.st === "published" ? `опубликован ${r.date}, прочитали ${r.reads}` : "не опубликован"}</p>
          <div class="rep__flow">${steps.map((s, i) => `${i ? `<i class="${i <= idx ? "on" : ""}"></i>` : ""}<span class="${i <= idx ? "on" : ""}">${REP[s]}</span>`).join("")}</div></div>
        <div class="rep__acts">
          ${r.st === "draft" ? `<button class="btn btn--sm" data-rep="review" data-r="${r.id}">На проверку</button>` : ""}
          ${r.st === "review" ? `<button class="btn btn--sm" data-rep="published" data-r="${r.id}">Опубликовать</button><button class="btn btn--ghost btn--sm" data-rep="draft" data-r="${r.id}">Вернуть</button>` : ""}
          ${r.st === "published" ? `<button class="btn btn--ghost btn--sm" data-newver="${r.id}">Новая версия</button>` : ""}
        </div></div>`;
    }).join("")}</div>`;

  const auditRow = (a) => `<li class="${a.fresh ? "is-new" : ""}" data-search="${esc(a.who + " " + a.text)}"><time>${a.t}</time><span class="who">${esc(a.who)}</span><span>${esc(a.text)}</span></li>`;
  V.audit = () => `<div class="view-head"><div><span class="eyebrow">Аудит</span><h1 style="margin-top:10px">Журнал действий</h1><p>Все существенные действия сотрудников с датой и автором. Записи не редактируются.</p></div><button class="btn btn--ghost btn--sm" data-export="audit">${ICON.dl.replace("<svg", '<svg width="16"')} Экспорт</button></div>
    <div class="card"><ul class="audit">${audit.map(auditRow).join("")}</ul></div>`;

  V.users = () => `<div class="view-head"><div><span class="eyebrow">Администрирование</span><h1 style="margin-top:10px">Сотрудники и роли</h1><p>Один сотрудник может совмещать роли; автор не утверждает собственные публикации и операции. Для сотрудников обязательна 2FA.</p></div></div>
    <div class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Сотрудник</th><th>Роли</th><th>2FA</th><th>Последний вход</th><th></th></tr></thead><tbody>
      ${staff.map(([n, r, tfa, last]) => `<tr data-search="${esc(n + " " + r.join(" "))}"><td><b>${esc(n)}</b></td><td>${r.map((x) => `<span class="st st--blue" style="margin-right:4px">${x}</span>`).join("")}</td><td>${tfa ? st("Включена", "ok") : st("Нет", "bad")}</td><td class="mono">${last}</td><td><button class="btn btn--ghost btn--xs" data-sessions="${esc(n)}">Сессии</button></td></tr>`).join("")}
    </tbody></table></div></div>`;

  /* ---------- Рендер ---------- */
  function render() {
    const html = V[view]();
    $("#views").innerHTML = `<section class="view is-active">${html}</section>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      $$("[data-w]").forEach((i) => (i.style.width = i.dataset.w + "%"));
      $$("[data-to]").forEach(countUp);
      $$(".ring[data-ring]").forEach((r) => { const c = $(".ring__fg", r); c.style.strokeDashoffset = 327 - 327 * Math.min(100, +r.dataset.ring) / 100; });
    }));
    ops.forEach((o) => delete o.fresh); grants.forEach((g) => delete g.fresh); audit.forEach((a) => delete a.fresh);
    if (view === "apps") initKanban();
  }
  function rerenderKeepScroll() { const y = scrollY, kx = $("#kanban") && $("#kanban").scrollLeft; renderNav(); render(); scrollTo(0, y); if (kx != null && $("#kanban")) $("#kanban").scrollLeft = kx; }

  /* ---------- Канбан ---------- */
  function moveApp(id, to) {
    const a = apps.find((x) => x.id === id); if (!a || a.st === to) return;
    if (!["manager", "head", "admin"].includes(role)) return denied("менять статусы заявок");
    const from = APP_ST.find(([k]) => k === a.st)[1], toT = APP_ST.find(([k]) => k === to)[1];
    a.st = to;
    if (to !== "new" && a.owner === "—") a.owner = me().av;
    if (to === "side") a.side = "Отказ кандидата";
    log(`Заявка ${a.id} (${a.name}): «${from}» → «${toT}»`);
    if (to === "confirmed") toast("Статус обновлён", "Убедитесь, что поступление отражено в реестре финансов — заявка сама по себе сбор не меняет");
    else toast("Статус обновлён", `${a.name}: ${toT}`);
    rerenderKeepScroll();
  }
  function initKanban() {
    let dragId = null;
    $$(".kcard").forEach((c) => {
      c.addEventListener("dragstart", (e) => { dragId = c.dataset.app; c.classList.add("is-dragging"); e.dataTransfer.effectAllowed = "move"; });
      c.addEventListener("dragend", () => c.classList.remove("is-dragging"));
    });
    $$(".kcol").forEach((col) => {
      col.addEventListener("dragover", (e) => { e.preventDefault(); col.classList.add("is-over"); });
      col.addEventListener("dragleave", () => col.classList.remove("is-over"));
      col.addEventListener("drop", (e) => { e.preventDefault(); col.classList.remove("is-over"); if (dragId) moveApp(dragId, col.dataset.st); });
    });
  }

  /* ---------- Экспорт CSV ---------- */
  function exportCSV(kind) {
    let rows = [];
    if (kind === "ops") rows = [["№", "Дата", "Проект", "Вид", "Контрагент", "Документ", "Сумма", "Сторно"]].concat(ops.filter((o) => o.project === finProject).map((o) => [o.id, o.date, o.project, o.reverses ? "Сторно " + o.reverses : KIND[o.kind][0], o.party, o.doc, o.amount, o.storno ? "да" : ""]));
    else if (kind === "apps") rows = [["№", "Имя", "Проект", "Сумма", "Статус"]].concat(apps.map((a) => [a.id, a.name, a.project, a.amount, APP_ST.find(([k]) => k === a.st)[1]]));
    else if (kind === "audit") rows = [["Время", "Кто", "Действие"]].concat(audit.map((a) => [a.t, a.who, a.text]));
    else rows = [["Таблица"], ["Участники"]].concat($$(".tbl tbody tr").map((tr) => $$("td", tr).map((td) => td.textContent.trim())));
    const csv = "﻿" + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `invest-order-${kind}-${today}.csv`; a.click();
    log(`Экспорт реестра: ${kind}`);
    toast("Экспорт готов", a.download);
  }

  /* ---------- События ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("button, a, [data-dclose]"); if (!t) return;
    const d = t.dataset;
    if (d.view) return go(d.view);
    if (d.go) { closeDrawer(); return go(d.go); }
    if (d.dclose !== undefined) return closeDrawer();
    if (d.export) return exportCSV(d.export);

    if (d.mv) {
      const id = t.closest(".kcard").dataset.app, a = apps.find((x) => x.id === id);
      const i = APP_ST.findIndex(([k]) => k === a.st), j = Math.max(0, Math.min(APP_ST.length - 1, i + +d.mv));
      return moveApp(id, APP_ST[j][0]);
    }
    if (d.openApp) {
      const a = apps.find((x) => x.id === d.openApp), p = proj(a.project);
      return openDrawer(`<span class="eyebrow">${a.id} · ${a.date}</span><h2>${esc(a.name)}</h2>
        <dl class="dl"><dt>Проект</dt><dd>${esc(p.title)}</dd><dt>Желаемая сумма</dt><dd>${rub(a.amount)}</dd><dt>Способ связи</dt><dd>${esc(a.contact)}</dd><dt>Статус</dt><dd>${APP_ST.find(([k]) => k === a.st)[1]}${a.side ? " · " + esc(a.side) : ""}</dd><dt>Ответственный</dt><dd>${a.owner === "—" ? "не назначен" : "Алексей Смирнов"}</dd><dt>Версия условий</dt><dd>${esc(p.version)}</dd></dl>
        <h4 style="margin:24px 0 10px">Обсуждение рисков</h4>
        <div class="field"><textarea id="riskNote" placeholder=" "></textarea><label for="riskNote">Дата, сотрудник, версия переданных материалов</label></div>
        <button class="btn btn--sm" style="margin-top:12px" data-risk="${a.id}">Зафиксировать обсуждение</button>
        <p class="muted" style="font-size:12.5px;margin-top:16px">Заявка не резервирует место и не увеличивает сбор. Подписание подтверждается загрузкой итоговых документов.</p>`);
    }
    if (d.risk) {
      const v = $("#riskNote").value.trim();
      if (!v) return toast("Заполните запись", "Укажите дату, сотрудника и версию материалов", true);
      log(`Зафиксировано обсуждение рисков по заявке ${d.risk}: ${v}`); closeDrawer(); toast("Записано в журнал", d.risk); return;
    }
    if (t.id === "newApp") {
      const a = { id: "З-" + (appSeq++), name: "Новый кандидат", project: "io-104", amount: 1e6, contact: "Звонок", st: "new", owner: "—", side: "", date: today };
      apps.push(a); log(`Новая заявка ${a.id} → IO-104`, "Система"); toast("Новая заявка", a.id + " · без ответственного");
      rerenderKeepScroll(); const c = $(`[data-app="${a.id}"]`); c && c.classList.add("is-new"); return;
    }

    if (d.openProj) return projDrawer(d.openProj);
    if (d.chk) {
      if (!["editor", "head", "admin"].includes(role)) return denied("утверждать поля карточки");
      const p = proj(d.p); p.checks[d.chk] = true; log(`${p.id.toUpperCase()}: утверждено — ${CHECKS[d.chk]}`);
      toast("Поле утверждено", CHECKS[d.chk]); projDrawer(p.id); rerenderKeepScroll(); return;
    }
    if (d.publish) {
      const p = proj(d.publish);
      if (role !== "head") return denied("публиковать проекты — это делает утверждающий руководитель");
      if (me().person === p.author) return toast("Нельзя утвердить своё", "Автор карточки не утверждает собственную публикацию", true);
      if (!Object.values(p.checks).every(Boolean)) return toast("Публикация заблокирована", "Есть пустые критичные поля", true);
      p.pub = "published"; log(`Опубликован проект ${p.id.toUpperCase()} «${p.title}», версия условий ${p.version}`);
      toast("Проект опубликован", p.title); projDrawer(p.id); rerenderKeepScroll(); return;
    }
    if (d.hide) {
      if (role !== "head" && role !== "admin") return denied("скрывать проекты");
      const p = proj(d.hide); p.pub = "hidden"; log(`Проект ${p.id.toUpperCase()} скрыт с сайта; кабинеты участников сохраняют доступ`);
      toast("Проект скрыт", "Участники по-прежнему видят его в кабинете"); projDrawer(p.id); rerenderKeepScroll(); return;
    }
    if (d.fund) {
      if (role !== "head" && role !== "admin") return denied("менять статус финансирования");
      const p = proj(d.p); if (p.status === d.fund) return;
      log(`${p.id.toUpperCase()}: финансирование «${FUND[p.status][0]}» → «${FUND[d.fund][0]}»`); p.status = d.fund;
      toast("Статус финансирования изменён", FUND[d.fund][0]); projDrawer(p.id); rerenderKeepScroll(); return;
    }

    if (d.ff) { finFilter = d.ff; return rerenderKeepScroll(); }
    if (d.storno) {
      const o = ops.find((x) => x.id === d.storno);
      if (o.by === me().person && role !== "admin") { /* разрешаем, но логируем */ }
      o.storno = true;
      const r = addOp({ date: today, project: o.project, party: o.party, kind: o.kind, amount: -o.amount, doc: "Сторно " + o.doc, purpose: "Сторнирование " + o.id, reverses: o.id, by: me().person, fresh: true });
      log(`Сторно ${o.id} (${KIND[o.kind][0]}, ${rub(o.amount)}) → ${r.id}`);
      toast("Операция сторнирована", `${o.id} → ${r.id}. История сохранена.`); return rerenderKeepScroll();
    }
    if (d.revoke) {
      const g = grants.find((x) => x.id === +d.revoke);
      if (!["manager", "head", "admin"].includes(role)) return denied("отзывать доступ");
      g.active = false; g.revoked = today; log(`Отозван доступ: ${g.person} → ${g.project.toUpperCase()} (${g.scope})`);
      toast("Доступ отозван", "Дальнейшее получение файлов заблокировано"); return rerenderKeepScroll();
    }
    if (d.rep) {
      const r = reports.find((x) => x.id === +d.r), p = proj(r.project);
      if (d.rep === "published" && role !== "head") return denied("публиковать отчёты — нужен руководитель");
      if (d.rep === "review" && !["editor", "finance", "head", "admin"].includes(role)) return denied("отправлять отчёты на проверку");
      r.st = d.rep; if (d.rep === "published") { r.date = today; }
      log(`Отчёт ${p.id.toUpperCase()} · ${r.q}: ${REP[d.rep]}`);
      toast("Отчёт: " + REP[d.rep], d.rep === "published" ? "Участники получат уведомление в кабинете" : p.title);
      renderNav(); return rerenderKeepScroll();
    }
    if (d.newver) {
      const r = reports.find((x) => x.id === +d.newver), p = proj(r.project);
      return openDrawer(`<span class="eyebrow">${p.id.toUpperCase()} · ${r.q}</span><h2>Новая версия отчёта</h2>
        <p class="muted">Текущая версия ${r.ver} сохранится в истории. Участники увидят уведомление и причину изменения.</p>
        <div class="field" style="margin-top:16px"><textarea id="verReason" placeholder=" "></textarea><label for="verReason">Причина изменения</label></div>
        <button class="btn btn--sm" style="margin-top:12px" data-saveVer="${r.id}">Создать версию ${r.ver + 1}</button>`);
    }
    if (d.savever) {
      const r = reports.find((x) => x.id === +d.savever), why = $("#verReason").value.trim();
      if (!why) return toast("Укажите причину", "Без причины новая версия не создаётся", true);
      reports.push({ ...r, id: reports.length + 1, ver: r.ver + 1, st: "draft", date: "—", reads: 0, reason: why });
      log(`Создана версия ${r.ver + 1} отчёта ${r.project.toUpperCase()} · ${r.q}: ${why}`);
      closeDrawer(); toast("Создан черновик новой версии", "Предыдущая версия остаётся опубликованной до утверждения"); return rerenderKeepScroll();
    }
    if (d.sessions) return openDrawer(`<span class="eyebrow">Безопасность</span><h2>${esc(d.sessions)}</h2>
      <dl class="dl"><dt>macOS · Safari</dt><dd>Москва · сейчас</dd><dt>iPhone · приложение</dt><dd>Москва · 12.11 21:14</dd><dt>Windows · Chrome</dt><dd>Махачкала · 02.11 10:03</dd></dl>
      <button class="btn btn--danger btn--sm" style="margin-top:18px" data-killsess="${esc(d.sessions)}">Завершить другие сессии</button>`);
    if (d.killsess) { log(`Завершены сессии сотрудника ${d.killsess}`); closeDrawer(); toast("Сессии завершены", d.killsess); return; }
  });

  document.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.id === "opForm") {
      if (!["finance", "admin", "head"].includes(role)) return denied("проводить операции");
      const amount = +f.amount.value.replace(/\D/g, ""), party = f.party.value.trim(), doc = f.doc.value.trim(), date = f.date.value.trim();
      if (!amount || !party || !doc || !/^\d{2}\.\d{2}\.\d{4}$/.test(date)) return toast("Проверьте поля", "Сумма, контрагент, документ и дата ДД.ММ.ГГГГ обязательны", true);
      const dup = ops.find((o) => !o.reverses && !o.storno && o.project === finProject && o.date === date && o.amount === amount && o.party === party && o.doc === doc);
      if (dup) { log(`Заблокирован повтор операции ${dup.id} (${doc})`); return toast("Повтор операции заблокирован", `Такой платёж уже проведён: ${dup.id}`, true); }
      const kind = f.kind.value;
      const op = addOp({ date, project: finProject, party, kind, amount, doc, purpose: f.purpose.value, by: me().person, fresh: true });
      log(`Проведена операция ${op.id}: ${KIND[kind][0]}, ${party}, ${rub(amount)}`);
      const f2 = fin(finProject);
      toast("Операция проведена", kind === "contrib" ? `Сбор: ${nf1.format(f2.pct)}% · участников: ${f2.participants}` : kind === "fee" ? "Комиссия в шкалу сбора не входит" : KIND[kind][0]);
      return rerenderKeepScroll();
    }
    if (f.id === "grantForm") {
      const person = f.person.value.trim();
      if (!person) return toast("Укажите кандидата", "", true);
      if (!["manager", "head", "admin"].includes(role)) return denied("выдавать доступ");
      grants.push({ id: grants.length + 1, person, project: f.project.value, scope: f.scope.value, date: today, by: me().person, active: true, fresh: true });
      log(`Выдан доступ: ${person} → ${f.project.value.toUpperCase()} (${f.scope.value})`);
      toast("Доступ выдан", `${person} · ${f.scope.value}`); return rerenderKeepScroll();
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.id === "finProj") { finProject = e.target.value; finFilter = "all"; rerenderKeepScroll(); }
    if (e.target.id === "role") {
      role = e.target.value; setMe(); log(`Вход в роли «${me().name}» (демо)`, me().person);
      toast("Роль: " + me().name, "Меню и права обновлены"); go(view);
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id === "q") {
      const q = e.target.value.trim().toLowerCase();
      $$("[data-search]").forEach((el) => (el.style.display = !q || el.dataset.search.toLowerCase().includes(q) ? "" : "none"));
    }
    if (e.target.name === "amount" && e.target.closest("#opForm")) { const d = e.target.value.replace(/\D/g, "").slice(0, 11); e.target.value = d ? nf.format(+d) : ""; }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeDrawer(); if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { e.preventDefault(); $("#q").focus(); } });
  $("#admBurger").addEventListener("click", () => $("#side").classList.toggle("is-open"));

  function setMe() { $("#meName").textContent = me().person; $("#meRole").textContent = me().name; $("#meAv").textContent = me().av; }
  $("#role").innerHTML = Object.entries(ROLES).map(([k, r]) => `<option value="${k}" ${k === role ? "selected" : ""}>${r.name}</option>`).join("");
  setMe(); renderNav(); render();
})();

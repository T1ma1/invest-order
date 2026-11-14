/* ИНВЕСТ ОРДЕР — общие компоненты и анимации */
(function () {
  const D = window.IO_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Форматирование ---------- */
  const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
  function money(n, full) {
    if (n == null) return "—";
    if (full) return new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";
    if (Math.abs(n) >= 1e6) return nf.format(n / 1e6) + " млн ₽";
    if (Math.abs(n) >= 1e3) return nf.format(n / 1e3) + " тыс. ₽";
    return nf.format(n) + " ₽";
  }
  const pct = (p) => p.received / p.target * 100;
  const region = (id) => (D.regions.find((r) => r.id === id) || {}).name || "";

  /* ---------- Иконки ---------- */
  const I = {
    arrow: '<svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    arrowS: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 8h16M4 16h16"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/></svg>',
    doc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>'
  };
  window.IO_ICONS = I;

  const logoSVG = '<svg viewBox="0 0 40 40" fill="none"><rect x="1" y="1" width="38" height="38" rx="11" fill="#0b4f6c"/><path d="M12 28V12" stroke="#45d6c6" stroke-width="2.2" stroke-linecap="round"/><circle cx="24.5" cy="20" r="7.5" stroke="#fff" stroke-width="2.2"/><path d="M17 28L31 12" stroke="#45d6c6" stroke-width="1.2" stroke-linecap="round" opacity=".7"/></svg>';

  /* ---------- Объёмные чертежи (canvas, assets/js/lines.js) ---------- */
  function blueprint(kind, o = {}) {
    let k = kind;
    if (kind === "hangar" && o.seed && [...String(o.seed)].reduce((a, c) => a + c.charCodeAt(0), 0) % 2 === 0) k = "arch";
    return `<div class="lm${o.dark ? " lm--dark" : ""}" data-line="${k}" data-seed="${o.seed || kind}"${o.dark ? ' data-dark="1"' : ""} aria-hidden="true"></div>`;
  }
  function fillShots(root = document) {
    if (!window.IOLines) return;
    $$(".lm:not(.is-init)", root).forEach((el) => {
      el.classList.add("is-init");
      IOLines.mount(el, el.dataset.line, { dark: !!el.dataset.dark, seed: el.dataset.seed, small: true, fit: 1.2 });
    });
  }
  const with3D = () => {};

  /* ---------- Карточка проекта ---------- */
  function projectCard(p, i = 0) {
    const dir = D.directions[p.direction];
    const st = D.fundingStatus[p.status];
    const f = pct(p);
    const over = Math.max(0, p.received - p.target);
    const left = Math.max(0, p.target - p.received);
    const seats = p.seats ? `<span>${p.participants} из ${p.seats} мест</span>` : `<span>${p.participants} участн.</span>`;
    const yieldTxt = p.yieldTerm != null ? `${nf.format(p.yieldTerm)}% <small>за ${p.yieldTermMonths} мес.</small>` : "—";
    return `<article class="pcard tilt" data-reveal style="--d:${(i % 3) * 0.1}s;--col:${(i % 3) - 1}" data-dir="${p.direction}" data-region="${p.region}" data-min="${p.min}" data-model="${p.model}" data-term="${p.termMonths}" data-status="${p.status}" data-pct="${f}" data-updated="${p.updated}">
      <div class="pcard__media blueprint-host">${blueprint(dir.art, { seed: p.id })}
        <div class="pcard__badges"><span class="badge badge--${st.cls}"><i></i>${st.label}</span><span class="badge badge--demo">Демо</span></div>
      </div>
      <div class="pcard__body">
        <div class="pcard__meta"><span>${dir.short}</span><span class="dot"></span><span>${p.city}</span></div>
        <h3><a href="project.html?id=${p.id}">${p.title}</a></h3>
        <dl class="kv">
          <div><dt>Мин. сумма</dt><dd>${money(p.min)}</dd></div>
          <div><dt>Прогноз инвестора</dt><dd>${yieldTxt}</dd></div>
          <div><dt>Модель</dt><dd>${p.modelLabel}</dd></div>
        </dl>
        <div class="progress" data-progress="${Math.min(f, 100)}" data-over="${over > 0 ? (over / p.received * 100) : 0}">
          <div class="progress__top"><span>Собрано от цели</span><b>${Math.round(f)}%</b></div>
          <div class="progress__bar"><div class="progress__fill"></div>${over > 0 ? '<div class="progress__over"></div>' : ""}</div>
          <div class="progress__bottom"><span>${money(p.received)} из ${money(p.target)}</span>${over > 0 ? `<span>превышение ${money(over)}</span>` : (p.status === "soon" ? "<span>скоро</span>" : `<span>осталось ${money(left)}</span>`)}</div>
        </div>
      </div>
    </article>`;
  }

  /* ---------- Шапка, подвал, модалка ---------- */
  function buildChrome() {
    const page = document.body.dataset.page || "";
    const links = [
      ["catalog.html", "Проекты", "catalog"],
      ["how.html", "Как устроено участие", "how"],
      ["about.html", "О сообществе", "about"],
      ["about.html#contacts", "Контакты", "contacts"]
    ];
    const h = $("#site-header");
    if (h) {
      h.outerHTML = `<header class="header" id="header"><div class="container header__in">
        <a href="index.html" class="logo" aria-label="Инвест Ордер — на главную">${logoSVG}<span>Инвест Ордер<small>инвестиционное сообщество</small></span></a>
        <nav class="nav" aria-label="Основная навигация">${links.map(([u, t, k]) => `<a href="${u}" class="${k === page ? "is-active" : ""}">${t}</a>`).join("")}</nav>
        <div class="header__actions">
          <a href="auth.html" class="icon-btn" aria-label="Войти в личный кабинет" title="Войти" data-hover>${I.user}</a>
          <button class="btn btn--sm" data-apply data-magnetic>Подать заявку ${I.arrow}</button>
          <button class="icon-btn burger" aria-label="Меню" aria-expanded="false" id="burger">${I.menu}</button>
        </div>
      </div></header>
      <div class="mobile-menu" id="mobileMenu" aria-hidden="true">
        <a href="index.html">Главная</a>${links.map(([u, t]) => `<a href="${u}">${t}</a>`).join("")}<a href="auth.html">Войти</a>
        <button class="btn btn--teal btn--block" data-apply>Подать заявку ${I.arrow}</button>
      </div>`;
    }
    const f = $("#site-footer");
    if (f) {
      f.outerHTML = `<footer class="footer"><div class="container">
        <div class="footer__grid">
          <div>
            <a href="index.html" class="logo">${logoSVG}<span>Инвест Ордер<small>инвестиционное сообщество</small></span></a>
            <p style="margin-top:22px;max-width:330px;font-size:14.5px">Проекты в недвижимости с обособленным учётом, открытыми комиссиями и квартальной отчётностью.</p>
          </div>
          <div><h5>Проекты</h5><ul><li><a href="catalog.html?dir=build">Строительство</a></li><li><a href="catalog.html?dir=land">Участок → метры</a></li><li><a href="catalog.html?dir=resale">Срочный выкуп</a></li><li><a href="catalog.html">Все проекты</a></li></ul></div>
          <div><h5>Сообщество</h5><ul><li><a href="how.html">Как устроено участие</a></li><li><a href="about.html">О команде</a></li><li><a href="auth.html">Вход и регистрация</a></li><li><a href="about.html#contacts">Контакты</a></li><li><a href="auth.html?mode=staff">Вход для команды</a></li></ul></div>
          <div><h5>Документы</h5><ul><li><a href="#">Политика обработки ПДн</a></li><li><a href="#">Согласие на обработку ПДн</a></li><li><a href="#">Пользовательское соглашение</a></li></ul></div>
        </div>
        <div class="footer__big" aria-hidden="true">Инвест Ордер</div>
        <div class="footer__bottom">
          <p class="footer__disc">Информация на сайте не является публичной офертой и не гарантирует доходность. Прогнозные показатели рассчитаны по утверждённой модели проекта и могут измениться. Денежные переводы и подписание документов выполняются вне сайта. Тексты обязательных раскрытий утверждаются юристом до запуска.</p>
          <span>© 2026 Инвест Ордер · прототип</span>
        </div>
      </div></footer>
      <div class="demo-ribbon">Прототип · демо-данные</div>`;
    }
    // Модалка заявки
    const m = document.createElement("div");
    m.className = "modal"; m.id = "applyModal"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true"); m.setAttribute("aria-labelledby", "applyTitle");
    m.innerHTML = `<div class="modal__bg" data-close></div><div class="modal__box">
      <button class="icon-btn modal__close" data-close aria-label="Закрыть">${I.close}</button>
      <div class="apply-wrap">
        <div class="modal__head"><span class="eyebrow">Заявка на участие</span><h3 id="applyTitle">Обсудим участие</h3><p class="muted" style="margin:0;font-size:14.5px">Регистрация не нужна. Менеджер свяжется, расскажет о модели, условиях и рисках. Заявка ни к чему не обязывает.</p></div>
        ${applyForm("m")}
      </div>
      ${successBlock()}
    </div>`;
    document.body.appendChild(m);
  }

  function applyForm(px) {
    const opts = D.projects.map((p) => `<option value="${p.id}">${p.title}${p.status === "closed" ? " — лист ожидания" : ""}</option>`).join("");
    return `<form class="form apply-form" novalidate>
      <div class="field field--select"><select name="project" id="${px}-project"><option value="">Пока не выбрал — нужна консультация</option>${opts}</select><label for="${px}-project">Проект</label></div>
      <div class="apply-project-note"></div>
      <div class="form__row">
        <div class="field"><input name="name" id="${px}-name" placeholder=" " autocomplete="name" required><label for="${px}-name">Как к вам обращаться</label><div class="field__err">Укажите имя</div></div>
        <div class="field"><input name="phone" id="${px}-phone" placeholder=" " inputmode="tel" autocomplete="tel" required><label for="${px}-phone">Телефон</label><div class="field__err">Проверьте номер телефона</div></div>
      </div>
      <div class="field"><input name="amount" id="${px}-amount" placeholder=" " inputmode="numeric"><label for="${px}-amount">Желаемая сумма участия, ₽</label><div class="field__err amount-err">Сумма меньше минимальной</div></div>
      <div><p class="form-legal" style="margin:4px 0 10px">Как удобнее связаться</p>
        <div class="chips">${["Звонок", "WhatsApp", "Telegram", "E-mail"].map((c, i) => `<label class="chip"><input type="radio" name="contact" value="${c}" ${i === 0 ? "checked" : ""}><span>${c}</span></label>`).join("")}</div>
      </div>
      <div class="field"><textarea name="comment" id="${px}-comment" placeholder=" "></textarea><label for="${px}-comment">Комментарий или вопрос</label></div>
      <label class="check"><input type="checkbox" name="pd" required><span>Даю <a href="#">согласие на обработку персональных данных</a> и принимаю <a href="#">политику конфиденциальности</a></span></label>
      <label class="check"><input type="checkbox" name="risk" required><span>Понимаю, что заявка не резервирует место, не является договором и что условия и риски обсуждаются с командой до подписания</span></label>
      <button class="btn btn--block" type="submit" data-magnetic>Отправить заявку ${I.arrow}</button>
    </form>`;
  }
  function successBlock() {
    return `<div class="form-success"><svg viewBox="0 0 80 80"><circle pathLength="1" cx="40" cy="40" r="36"/><path pathLength="1" d="M24 41l11 11 21-23"/></svg>
      <h3>Заявка принята</h3><p class="muted">Номер <b class="mono success-num"></b>. Менеджер свяжется с вами в течение рабочего дня выбранным способом.</p>
      <p class="muted" style="font-size:13px">Заявка не увеличивает сбор проекта и не резервирует место — участие подтверждается после подписания документов и поступления средств.</p>
      <button class="btn btn--ghost btn--sm" data-close style="margin-top:10px">Закрыть</button></div>`;
  }

  function phoneMask(el) {
    el.addEventListener("input", () => {
      let d = el.value.replace(/\D/g, "");
      if (d.startsWith("8")) d = "7" + d.slice(1);
      if (!d.startsWith("7")) d = "7" + d;
      d = d.slice(0, 11);
      const p = d.slice(1);
      let s = "+7";
      if (p.length) s += " (" + p.slice(0, 3);
      if (p.length >= 3) s += ") " + p.slice(3, 6);
      if (p.length >= 6) s += "-" + p.slice(6, 8);
      if (p.length >= 8) s += "-" + p.slice(8, 10);
      el.value = s;
    });
  }
  function amountMask(el) {
    el.addEventListener("input", () => {
      const d = el.value.replace(/\D/g, "").slice(0, 11);
      el.value = d ? new Intl.NumberFormat("ru-RU").format(+d) : "";
    });
  }

  function initForms() {
    $$(".apply-form").forEach((form) => {
      const sel = form.project, note = $(".apply-project-note", form);
      phoneMask(form.phone); amountMask(form.amount);
      const upd = () => {
        const p = D.projects.find((x) => x.id === sel.value);
        if (!p) { note.innerHTML = ""; return; }
        const closed = p.status === "closed", paused = p.status === "paused", soon = p.status === "soon";
        note.innerHTML = `<div class="alert ${closed || paused ? "" : "alert--info"}" style="margin:0">${I.info}<span>${
          closed ? "Набор по проекту закрыт. Заявка попадёт в лист ожидания — команда сообщит, если места освободятся." :
          paused ? "Набор приостановлен. Заявка будет рассмотрена после возобновления." :
          soon ? "Набор ещё не открыт. Мы сообщим об открытии в первую очередь." :
          `Минимальная сумма — ${money(p.min, true)}, шаг — ${money(p.step, true)}${p.max ? `, максимум — ${money(p.max, true)}` : ""}. Комиссия компании 10% оплачивается сверх суммы участия.`}</span></div>`;
      };
      sel.addEventListener("change", upd);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = true;
        const setErr = (el, bad) => { (el.closest(".field") || el.closest(".check")).classList.toggle("is-error", bad); if (bad) ok = false; };
        setErr(form.name, form.name.value.trim().length < 2);
        setErr(form.phone, form.phone.value.replace(/\D/g, "").length !== 11);
        const p = D.projects.find((x) => x.id === sel.value);
        const amt = +form.amount.value.replace(/\D/g, "");
        const err = $(".amount-err", form);
        if (p && amt && amt < p.min) { err.textContent = `Минимальная сумма — ${money(p.min, true)}`; setErr(form.amount, true); }
        else if (p && amt && p.max && amt > p.max) { err.textContent = `Максимальная сумма — ${money(p.max, true)}`; setErr(form.amount, true); }
        else setErr(form.amount, false);
        setErr(form.pd, !form.pd.checked);
        setErr(form.risk, !form.risk.checked);
        if (!ok) { const first = $(".is-error input, .is-error select", form); first && first.focus(); return; }
        const box = form.closest(".modal__box, .cta-form");
        const wrap = form.closest(".apply-wrap") || form;
        wrap.style.display = "none";
        const s = $(".form-success", box);
        $(".success-num", s).textContent = "З-" + String(Date.now()).slice(-6);
        s.classList.add("is-shown");
      });
      $$("input, select, textarea", form).forEach((el) => el.addEventListener("input", () => { const w = el.closest(".field, .check"); w && w.classList.remove("is-error"); }));
    });
  }

  function initModal() {
    const m = $("#applyModal");
    let last;
    const open = (pid) => {
      last = document.activeElement;
      const wrap = $(".apply-wrap", m), s = $(".form-success", m), form = $(".apply-form", m);
      wrap.style.display = ""; s.classList.remove("is-shown");
      if (pid !== undefined) { form.project.value = pid; form.project.dispatchEvent(new Event("change")); }
      m.classList.add("is-open"); document.body.style.overflow = "hidden";
      setTimeout(() => form.name.focus(), 350);
      closeMenu();
    };
    const close = () => { m.classList.remove("is-open"); document.body.style.overflow = ""; last && last.focus(); };
    document.addEventListener("click", (e) => {
      const a = e.target.closest("[data-apply]");
      if (a) { e.preventDefault(); open(a.dataset.apply || ""); }
      if (e.target.closest("#applyModal [data-close]")) close();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && m.classList.contains("is-open")) close(); });
  }

  /* ---------- Меню / шапка ---------- */
  function closeMenu() {
    const mm = $("#mobileMenu"), b = $("#burger");
    if (!mm) return;
    mm.classList.remove("is-open"); mm.setAttribute("aria-hidden", "true");
    b && (b.innerHTML = I.menu, b.setAttribute("aria-expanded", "false"));
    if (!$("#applyModal.is-open")) document.body.style.overflow = "";
  }
  function initHeader() {
    const h = $("#header"); if (!h) return;
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY;
      h.classList.toggle("is-scrolled", y > 20);
      h.classList.toggle("is-hidden", y > 400 && y > lastY && !$("#mobileMenu.is-open"));
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    const b = $("#burger"), mm = $("#mobileMenu");
    b && b.addEventListener("click", () => {
      const o = !mm.classList.contains("is-open");
      if (!o) return closeMenu();
      mm.classList.add("is-open"); mm.setAttribute("aria-hidden", "false");
      b.innerHTML = I.close; b.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    });
    mm && mm.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });
  }

  /* ---------- Разбиение текста на слова ---------- */
  function splitText(el) {
    let i = 0;
    const walk = (node) => {
      const frag = document.createDocumentFragment();
      node.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span"); w.className = "w";
            const inner = document.createElement("span"); inner.textContent = part; inner.style.setProperty("--i", i++);
            w.appendChild(inner); frag.appendChild(w);
          });
        } else if (n.nodeName === "BR") frag.appendChild(n.cloneNode());
        else { const c = n.cloneNode(false); c.appendChild(walk(n)); frag.appendChild(c); }
      });
      return frag;
    };
    const f = walk(el); el.innerHTML = ""; el.appendChild(f);
  }

  /* ---------- Счётчики ---------- */
  function countUp(el) {
    const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
    const suf = el.dataset.suffix || "", dur = 1800, t0 = performance.now();
    const fmt = new Intl.NumberFormat("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.innerHTML = fmt.format(to * e) + suf;
      if (k < 1) requestAnimationFrame(tick);
    };
    reduce ? (el.innerHTML = fmt.format(to) + suf) : requestAnimationFrame(tick);
  }

  /* ---------- Наблюдатель появления ---------- */
  function observe(root = document) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        const el = en.target;
        el.classList.add("is-in");
        if (el.classList.contains("blueprint-host")) el.classList.add("is-drawn");
        if (el.dataset.count) countUp(el);
        if (el.dataset.progress != null) {
          const fill = $(".progress__fill", el), over = $(".progress__over", el);
          fill.style.width = el.dataset.progress + "%";
          if (over) over.style.width = el.dataset.over + "%";
        }
        if (el.classList.contains("ring")) {
          const c = $(".ring__fg", el); c.style.strokeDashoffset = 327 - 327 * Math.min(100, +el.dataset.ring) / 100;
        }
        if (el.classList.contains("budget__bar")) $$("div", el).forEach((d) => (d.style.flexGrow = d.dataset.grow));
        if (el.classList.contains("timeline")) { const f = $(".timeline__fill", el); f && (f.style.height = f.dataset.h); }
        io.unobserve(el);
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    fillShots(root);
    $$("[data-reveal], .split, [data-count], .progress, .blueprint-host, .process, .jstep, .ring, .budget__bar, .timeline", root)
      .forEach((el) => { if (!el.classList.contains("is-in")) io.observe(el); });
  }

  /* ---------- Интерактив: tilt, magnetic, glow, курсор ---------- */
  function initPointer() {
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches || reduce) return;
    document.addEventListener("mousemove", (e) => {
      const t = e.target.closest(".tilt");
      if (t) {
        const r = t.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        t.style.transform = `perspective(1000px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg) translateY(-6px)`;
      }
      const g = e.target.closest(".dir");
      if (g) { const r = g.getBoundingClientRect(); g.style.setProperty("--mx", (e.clientX - r.left) + "px"); g.style.setProperty("--my", (e.clientY - r.top) + "px"); }
      const mg = e.target.closest("[data-magnetic]");
      if (mg) { const r = mg.getBoundingClientRect(); mg.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .18}px, ${(e.clientY - r.top - r.height / 2) * .28}px)`; }
    });
    document.addEventListener("mouseout", (e) => {
      const t = e.target.closest(".tilt, [data-magnetic]");
      if (t && !t.contains(e.relatedTarget)) t.style.transform = "";
    });
  }

  /* ---------- Параллакс ---------- */
  function initParallax() {
    const els = $$("[data-parallax]"); if (!els.length || reduce) return;
    const upd = () => els.forEach((el) => {
      const r = el.getBoundingClientRect(), k = parseFloat(el.dataset.parallax);
      el.style.translate = `0 ${((r.top + r.height / 2) - innerHeight / 2) * k}px`;
    });
    window.addEventListener("scroll", () => requestAnimationFrame(upd), { passive: true }); upd();
  }

  /* ---------- Hero: «топографические» линии ---------- */
  function heroCanvas() {
    const cv = $("#heroCanvas"); if (!cv) return;
    const ctx = cv.getContext("2d");
    let w, h, dpr, t = 0, mx = -999, my = -999, visible = true;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); w = cv.offsetWidth; h = cv.offsetHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    resize(); addEventListener("resize", resize);
    cv.parentElement.addEventListener("mousemove", (e) => { const r = cv.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; });
    cv.parentElement.addEventListener("mouseleave", () => { mx = my = -999; });
    new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(cv);
    const N = 26;
    const draw = () => {
      if (visible) {
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < N; i++) {
          const base = h * 0.18 + (h * 0.95) * (i / N);
          const a = 0.05 + 0.13 * Math.sin((i / N) * Math.PI);
          ctx.beginPath();
          for (let x = -10; x <= w + 10; x += 10) {
            let y = base
              + Math.sin(x * 0.0042 + t * 0.6 + i * 0.32) * 26
              + Math.sin(x * 0.0091 - t * 0.4 + i * 0.17) * 12
              + Math.cos(x * 0.0017 + i * 0.5) * 40 * (i / N);
            const dx = x - mx, dy = y - my, dd = dx * dx + dy * dy;
            if (dd < 40000) y += (dy > 0 ? 1 : -1) * (1 - dd / 40000) * 38;
            x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
          }
          ctx.strokeStyle = i % 5 === 0 ? `rgba(37,147,184,${a + .05})` : `rgba(25,179,168,${a})`;
          ctx.lineWidth = i % 5 === 0 ? 1.2 : 0.8;
          ctx.stroke();
        }
        t += 0.006;
      }
      if (!reduce) requestAnimationFrame(draw);
    };
    draw();
  }

  /* ---------- Прелоадер ---------- */
  function preloader() {
    const p = $(".preloader"); if (!p) return document.body.classList.add("is-loaded");
    const done = () => { p.classList.add("is-done"); document.body.classList.add("is-loaded"); setTimeout(() => p.remove(), 1400); };
    const seen = sessionStorage.getItem("io-pre");
    try { sessionStorage.setItem("io-pre", "1"); } catch (e) {}
    if (seen || reduce) { p.style.transition = "none"; done(); return; }
    window.addEventListener("load", () => setTimeout(done, 1100));
    setTimeout(done, 3200);
  }

  /* ---------- Старт ---------- */
  window.IO = { $, $$, money, nf, pct, region, blueprint, with3D, fillShots, projectCard, observe, applyForm, successBlock, initForms };
  document.addEventListener("DOMContentLoaded", () => {
    buildChrome();
    initHeader();
    initModal();
    $$(".split").forEach(splitText);
    document.dispatchEvent(new Event("io:ready"));
    initForms();
    observe();
    initPointer();
    initParallax();
    heroCanvas();
    preloader();
  });
})();

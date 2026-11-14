/* Логика отдельных страниц */
document.addEventListener("io:ready", () => {
  const { $, $$, money, nf, pct, region, blueprint, projectCard, applyForm, successBlock } = window.IO;
  const D = window.IO_DATA;
  const I = window.IO_ICONS;

  /* ===== Главная ===== */
  const hd = $("#heroDraw");
  if (hd && window.IOLines) IOLines.mount(hd, "hangar", { live: true, track: "window", range: .35, fit: 1.2, duration: 3.4, shiftX: innerWidth > 1100 ? .04 : 0, pitch: .42, yaw: .5 });

  const dirs = $("#directions");
  if (dirs) {
    const txt = {
      build: ["Покупка или аренда участка, схема размещения, строительство ангаров, зданий ЛСТК и магазинов.", ["Аренда", "Продажа", "Сочетание"]],
      land: ["Покупка участка, подготовка и упаковка проекта, передача застройщику с получением квадратных метров.", ["Получение метров", "Реализация"]],
      resale: ["Срочный выкуп недвижимости ниже рынка, подготовка объекта и последующая продажа.", ["Короткий срок", "Продажа"]]
    };
    dirs.innerHTML = Object.values(D.directions).map((d, i) => `
      <a href="catalog.html?dir=${d.id}" class="dir on-dark" data-reveal style="--d:${i * .12}s;--n:${i}">
        <div class="dir__art blueprint-host">${blueprint(d.art, { seed: d.id === "build" ? "a" : d.id, dark: true })}</div>
        <div class="dir__body">
          <span class="dir__num">${d.n} / 03</span>
          <h3>${d.title}</h3>
          <p>${txt[d.id][0]}</p>
          <div class="dir__tags">${txt[d.id][1].map((t) => `<span class="tag">${t}</span>`).join("")}<span class="tag" style="margin-left:auto;background:var(--teal);color:var(--deep-3)">Проекты →</span></div>
        </div>
      </a>`).join("");
  }

  const hp = $("#homeProjects");
  if (hp) hp.innerHTML = D.projects.filter((p) => p.status === "open").slice(0, 3).map(projectCard).join("");

  const cf = $("#ctaForm");
  if (cf) cf.innerHTML = `<div class="apply-wrap">${applyForm("c")}</div>${successBlock()}`;

  /* ===== Каталог ===== */
  const grid = $("#catalogGrid");
  if (grid) {
    grid.innerHTML = D.projects.map(projectCard).join("");
    const cards = $$(".pcard", grid);
    const fr = $("#filters");
    // Регионы
    $("#fRegion").innerHTML = D.regions.map((r) => `<label class="chip"><input type="checkbox" name="region" value="${r.id}"><span>${r.name}</span></label>`).join("");
    const params = new URLSearchParams(location.search);
    if (params.get("dir")) { const c = $(`input[name=dir][value=${params.get("dir")}]`, fr); c && (c.checked = true); }
    const range = $("#fMin"), rv = $("#fMinVal");
    const steps = [0, 5e5, 1e6, 2e6, 3e6, 5e6];
    const termMax = $("#fTerm");

    function apply(animate = true) {
      const dirs = $$("input[name=dir]:checked", fr).map((x) => x.value);
      const regs = $$("input[name=region]:checked", fr).map((x) => x.value);
      const models = $$("input[name=model]:checked", fr).map((x) => x.value);
      const sts = $$("input[name=status]:checked", fr).map((x) => x.value);
      const budget = steps[+range.value];
      const tm = +termMax.value;
      range.style.setProperty("--p", (range.value / (steps.length - 1) * 100) + "%");
      rv.textContent = budget ? "до " + money(budget) : "любая";
      $("#fTermVal").textContent = tm >= 48 ? "любой" : "до " + tm + " мес.";
      termMax.style.setProperty("--p", ((tm - 6) / 42 * 100) + "%");
      let n = 0;
      const vis = [];
      cards.forEach((c) => {
        const ok = (!dirs.length || dirs.includes(c.dataset.dir)) &&
          (!regs.length || regs.includes(c.dataset.region)) &&
          (!models.length || models.includes(c.dataset.model)) &&
          (!sts.length || sts.includes(c.dataset.status)) &&
          (!budget || +c.dataset.min <= budget) &&
          (tm >= 48 || +c.dataset.term <= tm);
        if (ok) { n++; vis.push(c); }
        if (!ok) { c.classList.add("is-filtered-out"); setTimeout(() => c.classList.contains("is-filtered-out") && (c.style.display = "none"), animate ? 400 : 0); }
        else { c.style.display = ""; requestAnimationFrame(() => c.classList.remove("is-filtered-out")); }
      });
      $("#count").textContent = n;
      $("#countWord").textContent = (n % 10 === 1 && n % 100 !== 11) ? "проект" : ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) ? "проекта" : "проектов";
      $("#empty").classList.toggle("is-shown", n === 0);
      // сортировка
      const s = $("#sort").value;
      const key = { pct: (c) => -c.dataset.pct, min: (c) => +c.dataset.min, term: (c) => +c.dataset.term, new: (c) => -c.dataset.updated.split(".").reverse().join("") };
      if (key[s]) cards.slice().sort((a, b) => key[s](a) - key[s](b)).forEach((c) => grid.appendChild(c));
    }
    fr.addEventListener("input", () => apply());
    $("#sort").addEventListener("change", () => apply());
    $$("[data-reset]").forEach((b) => b.addEventListener("click", () => { $$("input[type=checkbox]", fr).forEach((x) => (x.checked = false)); range.value = 0; termMax.value = 48; apply(); }));
    $("#filtersOpen").addEventListener("click", () => fr.classList.add("is-open"));
    $("#filtersClose").addEventListener("click", () => fr.classList.remove("is-open"));
    apply(false);
  }

  /* ===== Страница проекта ===== */
  const ph = $("#projectPage");
  if (ph) {
    const id = new URLSearchParams(location.search).get("id") || D.projects[0].id;
    const p = D.projects.find((x) => x.id === id) || D.projects[0];
    const dir = D.directions[p.direction];
    const st = D.fundingStatus[p.status];
    const f = pct(p), over = Math.max(0, p.received - p.target), left = Math.max(0, p.target - p.received);
    document.title = p.title + " — Инвест Ордер";
    const canApply = p.status === "open";
    const applyBtn = canApply ? `<button class="btn btn--block" data-apply="${p.id}" data-magnetic>Подать заявку ${I.arrow}</button>`
      : p.status === "closed" ? `<button class="btn btn--ghost btn--block" data-apply="${p.id}">Встать в лист ожидания</button>`
      : `<button class="btn btn--ghost btn--block" data-apply="${p.id}">${p.status === "soon" ? "Узнать об открытии" : "Оставить заявку"}</button>`;

    const fee = (k, o) => `<div class="fee-panel ${k === "owner" ? "is-active" : ""}" data-panel="${k}"><div class="table-wrap"><table class="table"><tbody>
      <tr><td>Плательщик</td><td>${o.payer}</td></tr><tr><td>Ставка</td><td>${o.rate}</td></tr><tr><td>База расчёта</td><td>${o.base}</td></tr>
      <tr><td>Сумма / способ определения</td><td>${o.amount}</td></tr><tr><td>Момент начисления и оплаты</td><td>${o.moment}</td></tr>
      <tr><td>Получатель</td><td>${o.receiver}</td></tr><tr><td>Отражение в бюджете</td><td>${o.budget}</td></tr>
      <tr><td>Включена ли в сумму участия</td><td>${o.included}</td></tr><tr><td>Налоги</td><td>${o.tax}</td></tr></tbody></table></div></div>`;
    const manage = p.manageTerms === "pending" ? "Условия последующего управления согласуются индивидуально"
      : p.manageTerms === "none" ? "Последующее управление не предусмотрено (проект завершается продажей)" : "Управление объектом в период эксплуатации: 5% от арендного дохода, ежеквартально, до продажи объекта";

    const budgetSegs = [["Собственные вложения", p.own, "var(--deep)"], ["Прочие источники", p.other, "var(--sky)"], ["Целевой сбор", p.target, "var(--teal)"]].filter((s) => s[1] > 0);

    ph.innerHTML = `
    <section class="p-hero on-dark">
      <div class="p-hero__art" id="p3d"></div><span class="drag-hint">Потяните, чтобы повернуть</span>
      <div class="container" style="position:relative">
        <div class="p-hero__in">
          <div>
            <nav class="crumbs" data-reveal="fade"><a href="index.html">Главная</a>/<a href="catalog.html">Проекты</a>/<span>${p.id.toUpperCase()}</span></nav>
            <h1 class="split">${p.title}</h1>
            <div class="p-hero__loc" data-reveal style="--d:.3s"><span class="tag">${dir.title}</span><span class="tag">${region(p.region)}, ${p.city}</span><span class="tag">${p.location}</span></div>
            <p class="lead" data-reveal style="--d:.35s">${p.short}</p>
            <div class="p-hero__badges" data-reveal style="--d:.4s"><span class="badge badge--${st.cls}"><i></i>${st.label}</span><span class="badge">Стадия: ${p.stages[p.stage]}</span><span class="badge badge--demo">Демо-проект</span></div>
          </div>
          <div></div>
        </div>
      </div>
    </section>

    <div class="container p-layout">
      <div class="p-main">
        <section>
          <span class="eyebrow" data-reveal>Ключевые показатели</span>
          <h2 class="split" style="margin-top:16px">Экономика <em>проекта</em></h2>
          <dl class="metrics" data-reveal>
            <div class="metric"><dt>Общий бюджет</dt><dd>${money(p.budget)}</dd></div>
            <div class="metric"><dt>Целевой сбор</dt><dd>${money(p.target)}</dd></div>
            <div class="metric"><dt>Срок реализации</dt><dd>${p.termMonths} мес.</dd></div>
            <div class="metric"><dt>Участие</dt><dd>от ${money(p.min)}<small>шаг ${money(p.step)}${p.max ? ` · максимум ${money(p.max)}` : ""}</small></dd></div>
            <div class="metric"><dt>Первые выплаты</dt><dd>${p.firstPayout}</dd></div>
            ${p.payback ? `<div class="metric"><dt>Окупаемость</dt><dd>${p.payback}</dd></div>` : `<div class="metric"><dt>Форма участия</dt><dd style="font-size:22px">${p.form}</dd></div>`}
          </dl>
          <div class="budget" style="margin-top:34px" data-reveal>
            <h4 style="margin:0;font-size:15px;font-weight:600">Структура бюджета</h4>
            <div class="budget__bar">${budgetSegs.map((s) => `<div data-grow="${s[1]}" style="background:${s[2]}">${money(s[1])}</div>`).join("")}</div>
            <div class="budget__legend">${budgetSegs.map((s) => `<span><i style="background:${s[2]}"></i>${s[0]} — ${Math.round(s[1] / p.budget * 100)}%</span>`).join("")}</div>
          </div>
        </section>

        <section>
          <span class="eyebrow" data-reveal>Прогноз</span>
          <h2 class="split" style="margin-top:16px">Доходность <em>инвестора</em></h2>
          <div class="yield">
            <div class="yield__card" data-reveal><span class="muted" style="font-size:13px">За срок проекта · ${p.yieldTermMonths} мес.</span><b><span data-count="${p.yieldTerm}">0</span><sup>%</sup></b><p>Прогнозная прибыль инвестора ÷ его общий денежный вклад, включая комиссию. Возврат капитала прибылью не считается.</p></div>
            <div class="yield__card" data-reveal style="--d:.1s"><span class="muted" style="font-size:13px">Годовая</span><b>${p.yieldAnnual != null ? `<span data-count="${p.yieldAnnual}">0</span><sup>%</sup>` : "—"}</b><p>${p.yieldAnnual != null ? "Метод: " + p.yieldMethod + "." : "Для короткого проекта с единовременной выплатой годовая доходность не приводится, чтобы не смешивать показатели."}</p></div>
          </div>
          <div class="alert alert--info" data-reveal>${I.info}<span><b>Состав вычетов:</b> ${p.deductions}. Распределение результата: ${p.distribution.toLowerCase()}. План выхода: ${p.exit.toLowerCase()}.</span></div>
          ${p.manageTerms === "pending" ? `<div class="alert" data-reveal>${I.info}<span>Расходы на последующее управление ещё не определены — показатель <b>предварительный</b> и не является итоговым «после всех комиссий».</span></div>` : ""}
        </section>

        <section>
          <span class="eyebrow" data-reveal>Обязательный блок</span>
          <h2 class="split" style="margin-top:16px">Как зарабатывает <em>компания</em></h2>
          <div class="fee-tabs" role="tablist" data-reveal>
            <button class="fee-tab is-active" data-tab="owner" role="tab"><b>${p.fees.owner.rate}</b><span>С собственника объекта</span></button>
            <button class="fee-tab" data-tab="investor" role="tab"><b>${p.fees.investor.rate}</b><span>С инвестора</span></button>
            <button class="fee-tab" data-tab="manage" role="tab"><b style="font-size:24px;line-height:1.4">Управление</b><span>Последующее</span></button>
          </div>
          ${fee("owner", p.fees.owner)}${fee("investor", p.fees.investor)}
          <div class="fee-panel" data-panel="manage"><div class="alert alert--info" style="margin:0">${I.info}<span>${manage}</span></div></div>
          <p class="muted" style="font-size:13.5px;margin:18px 0 0">Комиссии взимаются с разных плательщиков и от разных баз — они не складываются в единую ставку 20%.</p>
        </section>

        <section>
          <span class="eyebrow" data-reveal>Юридическая модель</span>
          <h2 class="split" style="margin-top:16px">Структура и <em>защита</em></h2>
          <div class="table-wrap" data-reveal><table class="table"><tbody>
            <tr><td>Юридическая модель</td><td>${p.legal}</td></tr>
            <tr><td>Получатель средств</td><td>${p.entity}</td></tr>
            <tr><td>Форма участия</td><td>${p.form}</td></tr>
            <tr><td>Распределение результата</td><td>${p.distribution}</td></tr>
          </tbody></table></div>
          <ul class="checklist" style="margin-top:20px" data-reveal>${p.protection.map((x) => `<li>${x}</li>`).join("")}</ul>
        </section>

        <section>
          <span class="eyebrow" data-reveal>Реализация</span>
          <h2 class="split" style="margin-top:16px">Этапы <em>проекта</em></h2>
          <ol class="timeline">
            <div class="timeline__fill" data-h="${Math.max(0, (p.stage) / (p.stages.length - 1) * 100)}%"></div>
            ${p.stages.map((s, i) => `<li class="${i < p.stage ? "is-done" : i === p.stage ? "is-now" : ""}" data-reveal style="--d:${i * .08}s"><span class="timeline__dot"></span><div><h5>${s}</h5><p>${i < p.stage ? "Завершено" : i === p.stage ? "Текущая стадия" : "Запланировано"}</p></div><time>${p.stageDates[i] || "—"}</time></li>`).join("")}
          </ol>
        </section>

        <section>
          <span class="eyebrow" data-reveal>Медиа</span>
          <h2 class="split" style="margin-top:16px">Фото и <em>схемы</em></h2>
          <div class="gallery" data-reveal>
            <div class="blueprint-host">${blueprint(dir.art, { seed: p.id + "-g1" })}<span>Схема размещения · иллюстрация</span></div>
            <div class="blueprint-host">${blueprint(dir.art, { seed: p.id + "-g2", eve: true })}<span>Фото объекта появятся после съёмки</span></div>
            <div class="blueprint-host">${blueprint(dir.art, { seed: p.id + "-g3" })}<span>Участок</span></div>
          </div>
        </section>

        <section>
          <span class="eyebrow" data-reveal>Закрытые материалы</span>
          <h2 class="split" style="margin-top:16px">Доступно <em>после обсуждения</em></h2>
          <p class="muted" data-reveal>Команда открывает материалы конкретного проекта после личного разговора. Регистрация и членство в сообществе доступ автоматически не дают.</p>
          <div class="locked">${["Точный адрес и кадастровые данные", "Подробная финансовая модель", "Документы на объект и участок", "Проект договора", "Сметы и подрядные договоры", "Отчёты по проекту"].map((x, i) => `<div class="locked__item" data-reveal style="--d:${i * .06}s">${I.lock}<div><b>${x}</b><span>Закрыто</span></div></div>`).join("")}</div>
          <div class="version">Условия актуальны на ${p.updated} · версия условий ${p.version} · ${p.id.toUpperCase()}</div>
        </section>
      </div>

      <aside class="p-sticky">
        <div class="side-card" data-reveal="scale">
          <div style="display:flex;gap:20px;align-items:center">
            <div class="ring" data-ring="${f}"><svg viewBox="0 0 120 120"><defs><linearGradient id="ringGrad"><stop offset="0" stop-color="#19b3a8"/><stop offset="1" stop-color="#2593b8"/></linearGradient></defs><circle class="ring__bg" cx="60" cy="60" r="52"/><circle class="ring__fg" cx="60" cy="60" r="52"/></svg><div class="ring__val"><span data-count="${Math.round(f)}" data-suffix="%">0</span></div></div>
            <div><span class="muted" style="font-size:13px">Собрано от цели</span><div style="font-family:var(--f-display);font-size:30px;font-weight:600;line-height:1.1;color:var(--deep-3)">${money(p.received)}</div><span class="muted" style="font-size:13px">из ${money(p.target)}</span></div>
          </div>
          <div class="side-card__sum">
            <div><span>Остаток привлечения</span><b>${money(left)}</b></div>
            ${over > 0 ? `<div><span>Превышение сбора</span><b style="color:var(--warn)">${money(over)}</b></div>` : ""}
            <div><span>Подтверждённых участников</span><b>${p.participants}</b></div>
            ${p.seats ? `<div><span>Свободных мест</span><b>${Math.max(0, p.seats - p.participants)} из ${p.seats}</b></div>` : ""}
            <div><span>Минимальная сумма</span><b>${money(p.min, true)}</b></div>
            <div><span>Комиссия с инвестора</span><b>10% сверх суммы</b></div>
          </div>
          ${applyBtn}
          <p class="side-card__note">Шкала = подтверждённые поступления в счёт целевого финансирования ÷ целевой сбор. Заявки и комиссии в шкалу не входят. Заявка не резервирует место.</p>
        </div>
      </aside>
    </div>`;

    $$(".fee-tab", ph).forEach((t) => t.addEventListener("click", () => {
      $$(".fee-tab", ph).forEach((x) => x.classList.toggle("is-active", x === t));
      $$(".fee-panel", ph).forEach((x) => x.classList.toggle("is-active", x.dataset.panel === t.dataset.tab));
    }));
    $$(".split", ph).forEach((el) => { /* разбиваем заново добавленные заголовки */
      let i = 0; const words = el.innerHTML.split(/(<em>.*?<\/em>|\s+)/).filter(Boolean);
      el.innerHTML = words.map((w) => {
        if (/^\s+$/.test(w)) return " ";
        if (w.startsWith("<em>")) return "<em>" + w.slice(4, -5).split(/\s+/).map((x) => `<span class="w"><span style="--i:${i++}">${x}</span></span>`).join(" ") + "</em>";
        return `<span class="w"><span style="--i:${i++}">${w}</span></span>`;
      }).join("");
    });
    const p3 = $("#p3d", ph); p3.classList.add("is-line");
    const pk = blueprint(dir.art, { seed: p.id }).match(/data-line="(\w+)"/)[1];
    if (window.IOLines) IOLines.mount(p3, pk, { dark: true, live: true, drag: true, track: "window", range: .3, fit: .82, duration: 3, shiftX: innerWidth > 1100 ? .2 : 0, shiftY: innerWidth > 1100 ? .08 : .04 });
  }

  /* ===== Как устроено участие: линия прогресса ===== */
  const j = $(".journey");
  if (j) {
    const line = $(".journey__line i", j);
    const upd = () => { const r = j.getBoundingClientRect(); const k = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / r.height)); line.style.setProperty("--h", k * 100 + "%"); };
    addEventListener("scroll", () => requestAnimationFrame(upd), { passive: true }); upd();
  }

  /* ===== Кабинет: вкладки ===== */
  const cn = $(".cab-nav");
  if (cn) {
    const go = (tab) => {
      $$("button[data-tab]", cn).forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
      $$(".cab-pane").forEach((p) => p.classList.toggle("is-active", p.dataset.pane === tab));
      window.IO.observe($(`.cab-pane[data-pane="${tab}"]`));
    };
    cn.addEventListener("click", (e) => { const b = e.target.closest("button[data-tab]"); if (b) go(b.dataset.tab); });
    $$("[data-go]").forEach((b) => b.addEventListener("click", () => { go(b.dataset.go); scrollTo({ top: 0, behavior: "smooth" }); }));
  }
});

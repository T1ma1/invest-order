/* Вход, регистрация, восстановление доступа, вход сотрудника (прототип) */
document.addEventListener("io:ready", () => {
  const { $, $$, blueprint } = window.IO;
  const DEMO_CODE = "123456", MAX_TRIES = 5;
  const eye = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
  const eyeOff = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 3l18 18M10.6 5.1A10 10 0 0112 5c6.5 0 10 7 10 7a17 17 0 01-3.2 4.1M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7c1.6 0 3-.4 4.3-1"/><path d="M9.9 9.9a3 3 0 004.2 4.2"/></svg>';

  const bp = $("#authBp"); if (bp) window.IOLines && IOLines.mount(bp, "towers", { dark: true, live: true, track: "window", range: .3, fit: .9 });

  let flow = "register", phoneVal = "", loginTries = 0, otpTries = 0, timer = null;

  /* ---------- Шаги ---------- */
  function show(step, back) {
    const cur = $(".step.is-active");
    if (cur) cur.classList.remove("is-active", "is-back");
    const el = $(`.step[data-step="${step}"]`);
    el.classList.toggle("is-back", !!back);
    el.classList.add("is-active");
    const tabs = $("#tabs");
    tabs.style.display = ["login", "register"].includes(step) ? "" : "none";
    if (["login", "register"].includes(step)) {
      tabs.dataset.tab = step;
      $$("button", tabs).forEach((b) => b.classList.toggle("is-active", b.dataset.tab === step));
    }
    document.title = ({ login: "Вход", register: "Регистрация", recover: "Восстановление доступа", staff: "Вход сотрудника", code: "Вход по коду", newpw: "Новый пароль", link: "Регистрация завершена" }[step] || "Подтверждение") + " — Инвест Ордер";
    const first = $("input:not([type=checkbox]):not(.sr-only)", el);
    setTimeout(() => first && first.focus({ preventScroll: true }), 250);
  }
  $$("#tabs button").forEach((b) => b.addEventListener("click", () => show(b.dataset.tab, b.dataset.tab === "login")));
  document.addEventListener("click", (e) => {
    const g = e.target.closest("[data-go]"); if (g) { e.preventDefault(); show(g.dataset.go); }
    const b = e.target.closest("[data-back]"); if (b) show(b.dataset.back, true);
  });

  /* ---------- Поля ---------- */
  $$(".pw-toggle").forEach((t) => {
    t.innerHTML = eye;
    t.addEventListener("click", () => {
      const i = t.parentElement.querySelector("input"), show = i.type === "password";
      i.type = show ? "text" : "password"; t.innerHTML = show ? eyeOff : eye;
      t.setAttribute("aria-label", show ? "Скрыть пароль" : "Показать пароль");
    });
  });
  const maskPhone = (el) => el.addEventListener("input", () => {
    let d = el.value.replace(/\D/g, ""); if (!d) { el.value = ""; return; }
    if (d.startsWith("8")) d = "7" + d.slice(1); if (!d.startsWith("7")) d = "7" + d; d = d.slice(0, 11);
    const p = d.slice(1); let s = "+7";
    if (p.length) s += " (" + p.slice(0, 3); if (p.length >= 3) s += ") " + p.slice(3, 6);
    if (p.length >= 6) s += "-" + p.slice(6, 8); if (p.length >= 8) s += "-" + p.slice(8, 10);
    el.value = s;
  });
  ["#c-phone", "#r-phone"].forEach((s) => maskPhone($(s)));
  const isPhone = (v) => v.replace(/\D/g, "").length === 11;
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  /* Оценка пароля: 0 — пусто, 1 — ненадёжный, 2 — средний, 3 — надёжный */
  const COMMON = ["password", "qwerty", "йцукен", "пароль", "12345", "11111", "00000", "abc123", "admin", "iloveyou", "qazwsx", "zxcvbn"];
  function pwScore(v) {
    const c = { len: v.length >= 8, abc: /[a-zа-яё]/i.test(v), num: /\d/.test(v) || /[^\w\sа-яё]/i.test(v) };
    if (!v) return { level: 0, c };
    const low = v.toLowerCase();
    const common = COMMON.some((w) => low.includes(w) && v.length < w.length + 5) || /^(.)\1+$/.test(v);
    let extra = 0;
    if (/\d/.test(v)) extra++;
    if (/[A-ZА-ЯЁ]/.test(v) && /[a-zа-яё]/.test(v)) extra++;
    if (/[^\w\sа-яё]/i.test(v)) extra++;
    if (v.length >= 12) extra++;
    let level = 1;
    if (c.len && c.abc && !common && extra >= 1) level = 2;
    if (c.len && c.abc && !common && (extra >= 3 || (v.length >= 16 && extra >= 2))) level = 3;
    return { level, c, common };
  }
  const pwOk = (v) => pwScore(v).level >= 2;
  const setErr = (input, bad) => { const w = input.closest(".field, .check"); w && w.classList.toggle("is-error", bad); return !bad; };
  $$("input").forEach((i) => i.addEventListener("input", () => { const w = i.closest(".field, .check"); w && w.classList.remove("is-error"); }));
  function busy(btn, on, label) {
    if (on) { btn.dataset.html = btn.innerHTML; btn.innerHTML = label || "Проверяем…"; btn.disabled = true; }
    else { btn.innerHTML = btn.dataset.html; btn.disabled = false; }
  }

  // Надёжность пароля: шкала, подпись и подсказки
  const shield = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path class="pwm__sh" pathLength="1" d="M12 3l7 3v5.5c0 4.4-2.9 7.9-7 9.5-4.1-1.6-7-5.1-7-9.5V6z"/><path class="pwm__ck" pathLength="1" d="M8.6 12.2l2.4 2.4 4.4-4.8"/><path class="pwm__ex" pathLength="1" d="M12 8.5v4.2M12 15.6v.1"/></svg>';
  const tick = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path pathLength="1" d="M3.5 8.4l3 3 6-6.6"/></svg>';
  const LABEL = ["Придумайте пароль", "Ненадёжный пароль", "Средний пароль", "Надёжный пароль"];
  const TIP = ["Не меньше 8 символов, обязательно с буквами", "Такой пароль легко подобрать", "Подойдёт. Добавьте символы или длину — будет надёжнее", "Отлично, такой пароль подобрать трудно"];
  $$(".pwm").forEach((m) => {
    const input = $("#" + m.dataset.for);
    m.dataset.l = "0";
    m.innerHTML = `<div class="pwm__bar"><i></i><i></i><i></i></div>
      <div class="pwm__row"><span class="pwm__ico">${shield}</span><span class="pwm__txt"><b class="pwm__label">${LABEL[0]}</b><span class="pwm__tip">${TIP[0]}</span></span></div>
      <ul class="pwm__hints"><li data-k="len">${tick}От 8 символов</li><li data-k="abc">${tick}Есть буквы</li><li data-k="num">${tick}Цифры или символы</li></ul>`;
    const label = $(".pwm__label", m), tip = $(".pwm__tip", m);
    input.addEventListener("input", () => {
      const r = pwScore(input.value), prev = +m.dataset.l;
      $$("li", m).forEach((li) => li.classList.toggle("is-ok", !!input.value && r.c[li.dataset.k]));
      tip.textContent = r.level !== 1 ? TIP[r.level] : !r.c.abc ? "Добавьте буквы" : !r.c.len ? "Слишком короткий — нужно от 8 символов" : r.common ? "Слишком простое сочетание — его подбирают первым" : "Добавьте цифры, символы или длину";
      if (r.level === prev) return;
      m.dataset.l = r.level;
      label.textContent = LABEL[r.level];
      m.classList.remove("is-swap", "is-up", "is-down"); void m.offsetWidth;
      m.classList.add("is-swap", r.level > prev ? "is-up" : "is-down");
    });
  });

  /* ---------- Вход по паролю ---------- */
  $("#fLogin").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target, err = $("#loginErr");
    const ok = setErr(f.login, !(isPhone(f.login.value) || isEmail(f.login.value.trim()))) & setErr(f.password, !f.password.value);
    if (!ok) return;
    if (loginTries >= MAX_TRIES) { err.textContent = "Слишком много попыток. Вход по паролю временно заблокирован на 10 минут — войдите по коду из SMS."; err.classList.add("is-shown"); return; }
    const btn = $("button[type=submit]", f); busy(btn, true);
    setTimeout(() => {
      busy(btn, false);
      if (f.password.value.toLowerCase() === "wrong" || f.password.value.length < 4) {
        loginTries++;
        err.textContent = `Неверный телефон, e-mail или пароль. Осталось попыток: ${MAX_TRIES - loginTries}.`;
        err.classList.add("is-shown"); return;
      }
      err.classList.remove("is-shown");
      location.href = "cabinet.html";
    }, 700);
  });

  /* ---------- Код из SMS ---------- */
  $("#fCode").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!setErr(e.target.phone, !isPhone(e.target.phone.value))) return;
    flow = "login"; startOtp(e.target.phone.value);
  });

  /* ---------- Регистрация ---------- */
  $("#fReg").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.website.value) return; // ловушка для ботов
    let ok = true;
    ok = setErr(f.name, f.name.value.trim().length < 2) && ok;
    ok = setErr(f.phone, !isPhone(f.phone.value)) && ok;
    ok = setErr(f.email, !!f.email.value.trim() && !isEmail(f.email.value.trim())) && ok;
    ok = setErr(f.password, !pwOk(f.password.value)) && ok;
    ok = setErr(f.pd, !f.pd.checked) && ok;
    ok = setErr(f.terms, !f.terms.checked) && ok;
    if (!ok) { const first = $(".is-error input", f); first && first.focus(); return; }
    flow = "register"; startOtp(f.phone.value);
  });

  /* ---------- Восстановление ---------- */
  $("#fRec").addEventListener("submit", (e) => {
    e.preventDefault();
    const v = e.target.login.value.trim();
    if (!setErr(e.target.login, !(isPhone(v) || isEmail(v)))) return;
    flow = "recover"; startOtp(v);
  });
  $("#fNew").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const ok = setErr(f.p1, !pwOk(f.p1.value)) & setErr(f.p2, f.p1.value !== f.p2.value);
    if (!ok) return;
    const btn = $("button[type=submit]", f); busy(btn, true, "Сохраняем…");
    setTimeout(() => (location.href = "cabinet.html"), 800);
  });

  /* ---------- Сотрудник ---------- */
  $("#fStaff").addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const ok = setErr(f.email, !isEmail(f.email.value.trim())) & setErr(f.password, !f.password.value);
    if (!ok) return;
    const btn = $("button[type=submit]", f); busy(btn, true);
    setTimeout(() => { busy(btn, false); flow = "staff"; startOtp(f.email.value.trim()); }, 600);
  });

  /* ---------- Ввод кода ---------- */
  const otp = $("#otp");
  otp.innerHTML = Array.from({ length: 6 }, (_, i) => `<input inputmode="numeric" autocomplete="${i === 0 ? "one-time-code" : "off"}" maxlength="1" aria-label="Цифра ${i + 1}">`).join("");
  const cells = $$("input", otp);
  cells.forEach((c, i) => {
    c.addEventListener("input", () => {
      const d = c.value.replace(/\D/g, "");
      if (d.length > 1) { fill(d); return; }
      c.value = d; c.classList.toggle("filled", !!d);
      otp.classList.remove("is-error");
      if (d && i < 5) cells[i + 1].focus();
      check();
    });
    c.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !c.value && i) { cells[i - 1].focus(); cells[i - 1].value = ""; cells[i - 1].classList.remove("filled"); }
      if (e.key === "ArrowLeft" && i) cells[i - 1].focus();
      if (e.key === "ArrowRight" && i < 5) cells[i + 1].focus();
    });
    c.addEventListener("paste", (e) => { e.preventDefault(); fill((e.clipboardData.getData("text") || "").replace(/\D/g, "")); });
    c.addEventListener("focus", () => c.select());
  });
  function fill(d) {
    d.slice(0, 6).split("").forEach((x, i) => { cells[i].value = x; cells[i].classList.add("filled"); });
    cells[Math.min(5, d.length)].focus(); check();
  }
  function check() {
    const code = cells.map((c) => c.value).join("");
    if (code.length < 6) return;
    const err = $("#otpErr");
    if (otpTries >= MAX_TRIES) return;
    if (code === DEMO_CODE) {
      otp.classList.add("is-ok"); err.classList.remove("is-shown");
      cells.forEach((c) => (c.disabled = true));
      setTimeout(done, 650);
    } else {
      otpTries++;
      otp.classList.remove("is-error"); void otp.offsetWidth; otp.classList.add("is-error");
      err.textContent = otpTries >= MAX_TRIES
        ? (flow === "staff" ? "5 неверных кодов подряд. Вход заблокирован на 15 минут, администратор получил уведомление." : "Код заблокирован после 5 неверных попыток. Запросите новый код.")
        : `Неверный код. Осталось попыток: ${MAX_TRIES - otpTries}.`;
      err.classList.add("is-shown");
      setTimeout(() => { cells.forEach((c) => { c.value = ""; c.classList.remove("filled"); }); if (otpTries < MAX_TRIES) cells[0].focus(); }, 500);
      if (otpTries >= MAX_TRIES) { cells.forEach((c) => (c.disabled = true)); clearInterval(timer); const r = $("#resend"); r.disabled = false; r.textContent = "Запросить новый код"; }
    }
  }
  function startOtp(target) {
    phoneVal = target; otpTries = 0;
    cells.forEach((c) => { c.value = ""; c.disabled = false; c.classList.remove("filled"); });
    otp.classList.remove("is-error", "is-ok"); $("#otpErr").classList.remove("is-shown");
    const staff = flow === "staff";
    $("#otpTitle").textContent = staff ? "Двухфакторная проверка" : flow === "recover" ? "Введите код" : flow === "login" ? "Код из SMS" : "Подтвердите телефон";
    $("#otpLead").innerHTML = staff ? "Введите 6-значный код из приложения-аутентификатора." : `Код отправлен на <b>${target.replace(/[<>&]/g, "")}</b>. Он действует 5 минут.`;
    $("#resend").style.display = staff ? "none" : "";
    $("#otpBack").textContent = staff ? "← Назад" : "← Изменить номер";
    $("#otpBack").onclick = () => show(flow === "register" ? "register" : flow === "recover" ? "recover" : flow === "staff" ? "staff" : "code", true);
    show("otp");
    if (!staff) runTimer();
    setTimeout(() => cells[0].focus(), 300);
  }
  function runTimer() {
    const r = $("#resend"); let s = 59;
    clearInterval(timer); r.disabled = true;
    const tick = () => { r.textContent = `Отправить снова через 0:${String(s).padStart(2, "0")}`; if (s-- <= 0) { clearInterval(timer); r.disabled = false; r.textContent = "Отправить код снова"; } };
    tick(); timer = setInterval(tick, 1000);
  }
  $("#resend").addEventListener("click", () => { otpTries = 0; cells.forEach((c) => { c.disabled = false; c.value = ""; c.classList.remove("filled"); }); $("#otpErr").classList.remove("is-shown"); runTimer(); cells[0].focus(); });

  function done() {
    clearInterval(timer);
    if (flow === "staff") { location.href = "admin.html"; return; }
    if (flow === "login") { location.href = "cabinet.html"; return; }
    if (flow === "recover") { show("newpw"); return; }
    // регистрация: поиск заявок, оставленных без регистрации
    const match = phoneVal.replace(/\D/g, "").endsWith("1234567");
    $("#linkLead").textContent = match
      ? "Мы нашли заявки, оставленные с этого номера. Они привязаны к вашему кабинету — новых дублей не создано."
      : "Заявок с этим номером не найдено. Новые заявки будут сразу появляться в кабинете.";
    $("#found").innerHTML = match
      ? `<div class="found__row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg><div><b>З-104211 · Торговый павильон у трассы Р-217</b><span>06.11.2026 · 2 млн ₽ · статус «Обсуждение»</span></div></div>
         <div class="found__row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg><div><b>З-104229 · Торговое помещение, Махачкала</b><span>02.11.2026 · лист ожидания</span></div></div>`
      : `<div class="found__row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.5"/></svg><div><b>Заявок пока нет</b><span>Демо: номер +7 (900) 123-45-67 найдёт две заявки</span></div></div>`;
    show("link");
  }

  /* ---------- Режим из адреса ---------- */
  const mode = new URLSearchParams(location.search).get("mode");
  show(["register", "recover", "staff", "code"].includes(mode) ? mode : "login");
});

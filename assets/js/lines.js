/* ИНВЕСТ ОРДЕР — объёмные архитектурные чертежи на canvas.
   Лёгкие: без библиотек, только тонкие линии, перспектива и прорисовка.
   IOLines.mount(el, kind, { dark, seed, live, interactive }) */
(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const MAIN = 0, THIN = 1, ACC = 2, DASH = 3, GRID = 4;

  function rng(seed) { let s = [...String(seed)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7); return () => { s = (s * 1664525 + 1013904223) | 0; return ((s >>> 0) % 10000) / 10000; }; }

  /* ---------- Построитель ---------- */
  function B() {
    const S = [], L = [];
    const seg = (a, b, c = MAIN) => S.push([a, b, c]);
    const api = {
      S, L, seg,
      label(p, t) { L.push([p, t]); },
      poly(pts, c = MAIN, close = true) { for (let i = 0; i < pts.length - (close ? 0 : 1); i++) seg(pts[i], pts[(i + 1) % pts.length], c); },
      box(x, y, z, w, h, d, c = MAIN) {
        const p = (i, j, k) => [x + i * w, y + j * h, z + k * d];
        api.poly([p(0, 0, 0), p(1, 0, 0), p(1, 0, 1), p(0, 0, 1)], c);
        api.poly([p(0, 1, 0), p(1, 1, 0), p(1, 1, 1), p(0, 1, 1)], c);
        [[0, 0], [1, 0], [1, 1], [0, 1]].forEach(([i, k]) => seg(p(i, 0, k), p(i, 1, k), c));
      },
      // горизонтальные этажные линии по периметру
      floors(x, y, z, w, h, d, n, c = THIN) {
        for (let f = 1; f < n; f++) { const yy = y + (h * f) / n; api.poly([[x, yy, z], [x + w, yy, z], [x + w, yy, z + d], [x, yy, z + d]], c); }
      },
      // сетка окон на фасаде z = const
      windowsZ(x, y, z, w, h, cols, rows, c = THIN, pad = .25) {
        const cw = w / cols, rh = h / rows;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const x0 = x + i * cw + cw * pad, x1 = x + (i + 1) * cw - cw * pad, y0 = y + j * rh + rh * .22, y1 = y + (j + 1) * rh - rh * .18;
          api.poly([[x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z]], c);
        }
      },
      windowsX(x, y, z, d, h, cols, rows, c = THIN, pad = .25) {
        const cw = d / cols, rh = h / rows;
        for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
          const z0 = z + i * cw + cw * pad, z1 = z + (i + 1) * cw - cw * pad, y0 = y + j * rh + rh * .22, y1 = y + (j + 1) * rh - rh * .18;
          api.poly([[x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0]], c);
        }
      },
      grid(x0, z0, x1, z1, step) {
        for (let x = x0; x <= x1 + .01; x += step) seg([x, 0, z0], [x, 0, z1], GRID);
        for (let z = z0; z <= z1 + .01; z += step) seg([x0, 0, z], [x1, 0, z], GRID);
      }
    };
    return api;
  }

  /* ---------- Модели ---------- */
  const MODELS = {
    // Склад ЛСТК с офисом и доками
    hangar(r) {
      const b = B();
      b.grid(-60, -36, 60, 40, 6);
      b.poly([[-54, 0, -26], [46, 0, -26], [46, 0, 32], [-54, 0, 32]], DASH);
      const W = 64, H = 11, D = 32, X = -26, Z = -16;
      b.box(X, 0, Z, W, H, D);
      for (let x = X + 2; x < X + W; x += 2) b.seg([x, 0, Z + D], [x, H, Z + D], GRID);
      for (let z = Z + 2; z < Z + D; z += 2) b.seg([X + W, 0, z], [X + W, H, z], GRID);
      b.poly([[X, H - 1.6, Z + D], [X + W, H - 1.6, Z + D], [X + W, H - 1.6, Z]], ACC, false);
      for (let i = 0; i < 9; i++) { const x = X + 12 + i * 5.6; b.poly([[x, 1.2, Z + D], [x + 3.4, 1.2, Z + D], [x + 3.4, 5, Z + D], [x, 5, Z + D]], THIN); b.seg([x - .4, 5.6, Z + D], [x - .4, 5.6, Z + D + 2], THIN); b.seg([x + 3.8, 5.6, Z + D], [x + 3.8, 5.6, Z + D + 2], THIN); b.seg([x - .4, 5.6, Z + D + 2], [x + 3.8, 5.6, Z + D + 2], THIN); }
      for (let i = 0; i < 4; i++) { const z = Z + 5 + i * 7; b.poly([[X + 6, H, z], [X + W - 6, H, z], [X + W - 6, H, z + 1.6], [X + 6, H, z + 1.6]], THIN); }
      // офис
      const OX = X - 15, OZ = Z + 6;
      b.box(OX, 0, OZ, 15, 16, 22);
      b.floors(OX, 0, OZ, 15, 16, 22, 4);
      b.windowsZ(OX, 0, OZ + 22, 15, 16, 5, 4, THIN, .12);
      b.poly([[OX - 1, 4, OZ + 22], [OX + 9, 4, OZ + 22], [OX + 9, 4, OZ + 27], [OX - 1, 4, OZ + 27]], MAIN);
      // фура
      b.box(X + 30, 0, Z + D + 6, 2.6, 4, 13, THIN);
      b.label([X + W / 2, 0, Z + D + 3], "64 000");
      b.label([X + W + 3, H, Z], "H 11 000");
      b.label([OX + 7, 16, OZ], "ОФИС · 3 ЭТ.");
      return b;
    },
    // Арочный ангар
    arch(r) {
      const b = B(); b.grid(-48, -40, 48, 40, 6);
      const R = 14, Lh = 46, N = 9;
      for (let i = 0; i <= N; i++) {
        const z = -Lh / 2 + (Lh * i) / N, pts = [];
        for (let a = 0; a <= 24; a++) { const t = Math.PI * a / 24; pts.push([-Math.cos(t) * R, Math.sin(t) * R, z]); }
        b.poly(pts, i === 0 || i === N ? MAIN : THIN, false);
      }
      for (let a = 0; a <= 8; a++) { const t = Math.PI * a / 8; b.seg([-Math.cos(t) * R, Math.sin(t) * R, -Lh / 2], [-Math.cos(t) * R, Math.sin(t) * R, Lh / 2], a % 4 === 0 ? MAIN : GRID); }
      b.poly([[-5, 0, Lh / 2], [5, 0, Lh / 2], [5, 8, Lh / 2], [-5, 8, Lh / 2]], ACC);
      b.label([0, R + 2, 0], "R 14 000");
      b.label([R + 3, 0, 0], "L 46 000");
      return b;
    },
    // Участок: контур, стройка, кран, будущий дом
    towers(r) {
      const b = B(); b.grid(-50, -40, 50, 40, 5);
      b.poly([[-40, 0, -26], [30, 0, -34], [42, 0, 22], [-30, 0, 32]], ACC);
      const fh = 3, built = 9, total = 22, X = -18, Z = -8, W = 18, D = 14;
      b.box(X, 0, Z, W, built * fh, D);
      b.floors(X, 0, Z, W, built * fh, D, built);
      for (let i = 0; i <= 4; i++) b.seg([X + i * W / 4, built * fh, Z], [X + i * W / 4, (built + 2) * fh, Z], THIN);
      b.box(X, built * fh, Z, W, (total - built) * fh, D, DASH);
      b.box(X + 28, 0, Z - 6, 16, 16 * fh, 14, DASH);
      // кран
      const cx = X + W + 5, H = total * fh + 8;
      b.seg([cx, 0, Z + 4], [cx, H, Z + 4]); b.seg([cx + 1.6, 0, Z + 4], [cx + 1.6, H, Z + 4]);
      for (let y = 0; y < H; y += 3) b.seg([cx, y, Z + 4], [cx + 1.6, y + 3, Z + 4], GRID);
      b.seg([cx - 12, H, Z + 4], [cx + 30, H, Z + 4]); b.seg([cx + .8, H + 5, Z + 4], [cx + 30, H, Z + 4], THIN); b.seg([cx + .8, H + 5, Z + 4], [cx - 12, H, Z + 4], THIN);
      b.seg([cx + 22, H, Z + 4], [cx + 22, H - 16, Z + 4], ACC);
      b.label([X + W / 2, (built) * fh + 2, Z], "ЭТАП 1 · 9 ЭТ.");
      b.label([30, 0, -34], "S = 1,8 ГА");
      return b;
    },
    // Помещение с витринами в городском доме
    facade(r) {
      const b = B(); b.grid(-48, -30, 48, 34, 4);
      const X = -20, W = 40, H = 22, Z = -9, D = 18;
      b.box(X, 0, Z, W, H, D);
      b.seg([X, 4.6, Z + D], [X + W, 4.6, Z + D]); b.seg([X + W, 4.6, Z + D], [X + W, 4.6, Z]);
      b.windowsZ(X, 4.6, Z + D, W, H - 4.6, 10, 5, THIN, .3);
      b.windowsX(X + W, 4.6, Z, D, H - 4.6, 5, 5, THIN, .3);
      for (let i = 0; i < 4; i++) b.poly([[X + 2 + i * 9.6, .4, Z + D], [X + 9 + i * 9.6, .4, Z + D], [X + 9 + i * 9.6, 3.8, Z + D], [X + 2 + i * 9.6, 3.8, Z + D]], ACC);
      b.box(X - 16, 0, Z, 15, 16, D, THIN); b.box(X + W + 1, 0, Z, 14, 26, D, THIN);
      b.seg([-48, 0, Z + D + 6], [48, 0, Z + D + 6], DASH);
      b.label([X + W / 2, 0, Z + D + 3], "ВИТРИНЫ · 310 М²");
      return b;
    },
    tower(r) {
      const b = B(); b.grid(-40, -30, 40, 30, 4);
      b.box(-12, 0, -10, 24, 5, 20);
      b.box(-9, 5, -8, 18, 72, 16); b.floors(-9, 5, -8, 18, 72, 16, 24);
      b.box(-5, 77, -4, 10, 4, 8, ACC);
      b.box(-34, 0, -8, 16, 30, 14, THIN); b.box(20, 0, -6, 14, 40, 12, THIN);
      b.label([0, 81, 0], "H 81 000");
      return b;
    }
  };

  /* ---------- Рендер ---------- */
  function mount(el, kind, o = {}) {
    if (el.__lines) return el.__lines;
    const build = MODELS[kind] || MODELS.hangar;
    const r = rng(o.seed || kind), M = build(r);
    const cv = document.createElement("canvas"); cv.className = "lines-cv"; el.appendChild(cv);
    const ctx = cv.getContext("2d");
    const dark = !!o.dark;
    const col = dark
      ? { [MAIN]: "rgba(255,255,255,.82)", [THIN]: "rgba(255,255,255,.34)", [ACC]: "#7fe0d4", [DASH]: "rgba(255,255,255,.42)", [GRID]: "rgba(255,255,255,.07)", text: "rgba(255,255,255,.55)" }
      : { [MAIN]: "rgba(11,79,108,.9)", [THIN]: "rgba(11,79,108,.32)", [ACC]: "#19b3a8", [DASH]: "rgba(11,79,108,.45)", [GRID]: "rgba(11,79,108,.07)", text: "rgba(10,43,58,.5)" };
    const lw = { [MAIN]: 1.15, [THIN]: .7, [ACC]: 1.4, [DASH]: .9, [GRID]: .6 };
    // порядок прорисовки: сетка → основные → детали
    const order = { [GRID]: 0, [DASH]: 1, [MAIN]: 2, [ACC]: 3, [THIN]: 4 };
    const segs = M.S.map((s, i) => ({ s, k: order[s[2]] + (i / M.S.length) * .9 })).sort((a, b) => a.k - b.k).map((x) => x.s);
    // габарит
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    segs.forEach(([a, b]) => [a, b].forEach((p) => p.forEach((v, i) => { mn[i] = Math.min(mn[i], v); mx[i] = Math.max(mx[i], v); })));
    const cx = (mn[0] + mx[0]) / 2, cy = (mn[1] + mx[1]) / 2, cz = (mn[2] + mx[2]) / 2;
    const rad = Math.hypot(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) / 2;

    let W = 0, H = 0, dpr = 1;
    const resize = () => { dpr = Math.min(2, devicePixelRatio || 1); W = el.clientWidth; H = el.clientHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px"; draw(); };

    let yaw = o.yaw != null ? o.yaw : .5, pitch = o.pitch != null ? o.pitch : .44, tYaw = yaw, tPitch = pitch;
    let prog = reduce ? 1 : 0, t0 = 0, running = false, visible = false, hover = false, idle = 0;
    const fit = o.fit || .9, shiftX = o.shiftX || 0, shiftY = o.shiftY || 0;

    function project(p, cs, sn, cp, sp, f, sc) {
      let x = p[0] - cx, y = p[1] - cy, z = p[2] - cz;
      const x1 = x * cs - z * sn, z1 = x * sn + z * cs;
      const y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      const d = rad * 5 - z2, k = f / d;
      return [W / 2 + shiftX * W + x1 * k * sc, H / 2 + shiftY * H - y2 * k * sc];
    }
    function draw() {
      if (!W || !H) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const cs = Math.cos(yaw), sn = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
      const f = rad * 5, sc = (Math.min(W, H * 1.35) * fit) / (rad * 2.1);
      const n = segs.length;
      ctx.lineCap = "round";
      for (let i = 0; i < n; i++) {
        const st = (i / n) * .78, k = Math.max(0, Math.min(1, (prog - st) / .22));
        if (k <= 0) break;
        const [a, b, c] = segs[i];
        const A = project(a, cs, sn, cp, sp, f, sc), Bp = project(b, cs, sn, cp, sp, f, sc);
        ctx.strokeStyle = col[c]; ctx.lineWidth = lw[c];
        ctx.setLineDash(c === DASH ? [4, 4] : []);
        ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(A[0] + (Bp[0] - A[0]) * k, A[1] + (Bp[1] - A[1]) * k); ctx.stroke();
      }
      ctx.setLineDash([]);
      const la = Math.max(0, Math.min(1, (prog - .85) / .15));
      if (la > 0 && !o.noLabels) {
        ctx.font = `400 ${o.small ? 9 : 10.5}px "IBM Plex Mono", monospace`; ctx.textAlign = "center";
        M.L.forEach(([p, t]) => {
          const q = project(p, cs, sn, cp, sp, f, sc);
          ctx.fillStyle = col.text; ctx.globalAlpha = la; ctx.fillText(t, q[0], q[1] - 8);
          ctx.beginPath(); ctx.arc(q[0], q[1], 2, 0, 7); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    }
    function loop(now) {
      if (!t0) t0 = now;
      const t = (now - t0) / 1000;
      if (prog < 1) prog = Math.min(1, t / (o.duration || 2.6));
      const swing = o.live && !reduce ? Math.sin(t * .12) * .16 : 0;
      yaw += (tYaw + swing - yaw) * .06; pitch += (tPitch - pitch) * .06;
      draw();
      const moving = Math.abs(tYaw + swing - yaw) > .0005 || Math.abs(tPitch - pitch) > .0005;
      if (visible && (prog < 1 || o.live || moving || hover)) requestAnimationFrame(loop); else running = false;
    }
    function kick() { if (!running && visible) { running = true; requestAnimationFrame(loop); } }
    const base = { yaw, pitch };
    if (o.interactive !== false && fine) {
      const tgt = o.track === "window" ? window : el.closest(o.track || ".pcard, .dir, .gallery > div, .auth-art") || el;
      tgt.addEventListener("pointermove", (e) => {
        const rr = o.track === "window" ? { left: 0, top: 0, width: innerWidth, height: innerHeight } : el.getBoundingClientRect();
        const px = (e.clientX - rr.left) / rr.width - .5, py = (e.clientY - rr.top) / rr.height - .5;
        tYaw = base.yaw + px * (o.range || .5); tPitch = base.pitch + py * .16; hover = true; kick();
      });
      tgt.addEventListener("pointerleave", () => { tYaw = base.yaw; tPitch = base.pitch; hover = false; kick(); });
    }
    if (o.drag) {
      let dn = false, lx = 0;
      el.addEventListener("pointerdown", (e) => { dn = true; lx = e.clientX; el.setPointerCapture(e.pointerId); el.classList.add("is-drag"); });
      el.addEventListener("pointerup", () => { dn = false; el.classList.remove("is-drag"); });
      el.addEventListener("pointermove", (e) => { if (!dn) return; base.yaw += (e.clientX - lx) * .008; tYaw = base.yaw; lx = e.clientX; kick(); });
    }
    new ResizeObserver(resize).observe(el); resize();
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { el.classList.add("is-drawn"); kick(); } }, { threshold: .15 }).observe(el);
    return (el.__lines = { redraw: draw });
  }

  window.IOLines = { mount };
})();

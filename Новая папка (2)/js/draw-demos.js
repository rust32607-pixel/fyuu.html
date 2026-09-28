/* Физические анимации. Каждый демо-объект:
     duration — сек «модельного» времени цикла (число или функция(p, topic)),
     hint     — подпись под канвой,
     draw(ctx, S), S = {w,h,t,p,res,topic,speed}.
   Физика считается здесь заново по параметрам S.p (в СИ), поэтому картинка
   не зависит от порядка шагов расчёта. */
(function (global) {
  'use strict';

  var H = global.H, C = H.C, D = global.Demos = global.Demos || {};
  var N = global.Fmt.num;
  var G = 9.8, Rgas = 8.314, KB = 1.381e-23, DEG = 180 / Math.PI;

  /* Плашка с показаниями приборов. */
  function readout(ctx, x, y, title, rows, w) {
    var width = w || 200;
    H.panel(ctx, x, y, width, 24 + rows.length * 19, { title: title });
    rows.forEach(function (r, i) {
      var cy = y + 40 + i * 19;
      H.text(ctx, x + 12, cy, r[0], { size: 12, color: C.soft });
      H.text(ctx, x + width - 12, cy, r[1], { size: 13, color: r[2] || C.ink, align: 'right', weight: '600', math: true });
    });
  }

  /* Ось времени с бегунком. */
  function timeline(ctx, x, y, w, t, dur) {
    H.line(ctx, x, y, x + w, y, { color: C.line, width: 3 });
    H.line(ctx, x, y, x + w * (t / dur), y, { color: C.accent, width: 3 });
    H.circle(ctx, x + w * (t / dur), y, 4, { fill: C.accent });
    H.text(ctx, x + w + 8, y, 't = ' + N(t, 2) + ' с', { size: 11.5, color: C.soft, math: true, baseline: 'middle' });
  }

  /* ══════════════════════════ Закон Гука ══════════════════════════ */
  D.spring = {
    duration: 6,
    hint: 'Груз на пружине: растянули на Δl и отпустили — идёт гармоническое колебание.',
    draw: function (ctx, S) {
      var k = S.p.k, A = S.p.dl, m = S.p.m;
      var T = 2 * Math.PI * Math.sqrt(m / k);
      var w = 2 * Math.PI / T;
      var x = A * Math.cos(w * S.t);              // смещение от равновесия
      var v = -A * w * Math.sin(w * S.t);
      var F = -k * x;
      var Eel = 0.5 * k * x * x;
      var Ek = 0.5 * m * v * v;
      var Etot = 0.5 * k * A * A;

      var wallX = 70, axisY = Math.min(150, S.h * 0.4);
      var natLen = 120;
      var span = Math.max(S.w * 0.28, 150);
      var s = span / Math.max(A * 2.2, 0.02);      // пикселей на метр
      var eqX = wallX + natLen + A * s;            // положение равновесия при t=0 (растянута)
      var bx = wallX + natLen + (A + x) * s;       // правый край пружины
      var bs = 42;

      /* стол и стена */
      H.line(ctx, 30, axisY + bs / 2, S.w * 0.52, axisY + bs / 2, { color: C.soft, width: 1.6 });
      H.hatch(ctx, 30, axisY + bs / 2, S.w * 0.52 - 30, 14, { step: 11 });
      H.rect(ctx, wallX - 14, axisY - 78, 14, 156, { fill: '#e9eef6', stroke: C.metalDark });

      H.spring(ctx, wallX, axisY, bx, 13, 15, { width: 2.6 });
      H.roundRect(ctx, bx, axisY - bs / 2, bs, bs, 7, { fill: '#dbe5f3', stroke: C.metalDark, width: 1.6 });
      H.text(ctx, bx + bs / 2, axisY + 4, 'm', { size: 14, color: C.accentDeep, align: 'center', baseline: 'middle', math: true, weight: '700' });

      /* отметка равновесия и линейка */
      H.line(ctx, eqX + bs / 2, axisY - 74, eqX + bs / 2, axisY + 40, { color: C.faint, dash: [4, 4] });
      H.text(ctx, eqX + bs / 2, axisY - 80, 'x = 0', { size: 11, color: C.faint, align: 'center' });
      var rl = axisY + 44;
      H.line(ctx, eqX + bs / 2 - A * s, rl, eqX + bs / 2 + A * s, rl, { color: C.soft, width: 1.4 });
      for (var i = -10; i <= 10; i++) {
        var px = eqX + bs / 2 + (i * A / 10) * s;
        H.line(ctx, px, rl, px, rl + (i % 5 === 0 ? 7 : 4), { color: C.soft });
        if (i % 5 === 0) H.text(ctx, px, rl + 18, N(i * A * 100 / 10, 2), { size: 10, color: C.faint, align: 'center' });
      }
      H.text(ctx, eqX + bs / 2 + A * s + 6, rl + 18, 'см', { size: 10, color: C.faint });

      /* векторы: сила упругости и скорость */
      var fMax = k * A;
      var fs = fMax > 0 ? Math.min(90, 90 * Math.abs(F) / fMax) : 0;
      var cy = axisY - bs / 2 - 20;
      if (Math.abs(F) > 1e-6) {
        H.arrow(ctx, bx + bs / 2, cy, bx + bs / 2 - Math.sign(F) * fs, cy, { color: C.bad, width: 3, label: 'F = ' + N(Math.abs(F), 2) + ' Н', labelSize: 12.5 });
      }
      var vs = Math.abs(v) > 0 ? Math.min(80, 80 * Math.abs(v) / (A * w)) : 0;
      H.arrow(ctx, bx + bs / 2, axisY + bs / 2 + 22, bx + bs / 2 + Math.sign(v || 1) * Math.max(vs, 2), axisY + bs / 2 + 22, { color: C.accent, width: 2.6, label: 'v', labelSize: 12 });

      /* графики x(t), F(t) */
      var gx = S.w * 0.56, gw = S.w * 0.4, gh = 130, gy = 40;
      var tspan = Math.max(2 * T, 0.2);
      var pts1 = [], pts2 = [];
      for (var q = 0; q <= 120; q++) {
        var tt = tspan * q / 120;
        pts1.push([tt, A * Math.cos(w * tt)]);
        pts2.push([tt, -k * A * Math.cos(w * tt)]);
      }
      H.plot(ctx, { x: gx, y: gy + 18, w: gw, h: gh }, {
        title: 'Удлинение и сила', x: [0, tspan], y: [-A, A],
        xLabel: 't, с', yLabel: 'x, м', legend: false,
        series: [{ pts: pts1, color: C.accent, width: 2, label: 'x(t)' }]
      });
      H.plot(ctx, { x: gx, y: gy + 18 + gh + 42, w: gw, h: gh }, {
        title: 'Сила упругости', x: [0, tspan], y: [-fMax, fMax],
        xLabel: 't, с', yLabel: 'F, Н',
        series: [{ pts: pts2, color: C.bad, width: 2, label: 'F(t) = −k x(t)' }],
        marker: [{ x: S.t % tspan, y: F, color: C.accentDeep, label: N(Math.abs(F), 2) + ' Н' }]
      });

      readout(ctx, 30, S.h - 118, 'Текущие значения', [
        ['жёсткость k', N(k, 3) + ' Н/м'],
        ['амплитуда Δl', N(A * 100, 2) + ' см'],
        ['период T', N(T, 3) + ' с'],
        ['F = k·Δl (макс)', N(fMax, 2) + ' Н']
      ], 190);

      /* энергия */
      var ex = 250, ey = S.h - 74, ew = Math.max(180, S.w * 0.2);
      H.text(ctx, ex, ey - 10, 'Энергия, Дж', { size: 11, color: C.soft, weight: '700' });
      var full = Etot > 0 ? ew : 1;
      var w1 = Etot > 0 ? ew * Eel / Etot : 0;
      H.rect(ctx, ex, ey, w1, 16, { fill: C.accent });
      H.rect(ctx, ex + w1, ey, ew - w1, 16, { fill: '#9ec9e8' });
      H.rect(ctx, ex, ey, ew, 16, { stroke: C.line });
      H.text(ctx, ex, ey + 32, 'упругая ' + N(Eel, 2), { size: 11.5, color: C.accentDeep });
      H.text(ctx, ex + ew, ey + 32, 'кинетическая ' + N(Ek, 2), { size: 11.5, color: C.soft, align: 'right' });
      H.text(ctx, ex + ew / 2, ey - 10, 'Σ = ' + N(Etot, 2) + ' Дж — не меняется', { size: 11, color: C.ok, align: 'center' });
    }
  };

  /* ═══════════════════════ Сохранение импульса ═══════════════════════ */
  D.momentum = {
    duration: function (p) {
      var tc = collideTime(p);
      return tc == null ? 4 : tc + 2.6;
    },
    hint: 'Два тела на гладкой опоре: до удара — свои скорости, после — по закону сохранения импульса.',
    draw: function (ctx, S) {
      var m1 = S.p.m1, m2 = S.p.m2, v1 = S.p.v1, v2 = S.p.v2;
      var e = Number(S.p.type);
      var L = 2.6;                       // начальное расстояние между центрами, м
      var r1 = 0.055 * Math.cbrt(m1), r2 = 0.055 * Math.cbrt(m2);
      var tc = collideTime(S.p);
      var u1 = ((m1 - e * m2) * v1 + m2 * (1 + e) * v2) / (m1 + m2);
      var u2 = (m1 * (1 + e) * v1 + (m2 - e * m1) * v2) / (m1 + m2);
      var dur = S.duration;

      function pos(t) {
        if (tc == null || t < tc) return [v1 * t, L + v2 * t];
        return [v1 * tc + u1 * (t - tc), L + v2 * tc + u2 * (t - tc)];
      }
      /* автомасштаб по всей траектории */
      var lo = Infinity, hi = -Infinity;
      for (var q = 0; q <= 60; q++) {
        var pp = pos(dur * q / 60);
        lo = Math.min(lo, pp[0] - r1); hi = Math.max(hi, pp[1] + r2);
      }
      var x0 = 40, x1 = S.w * 0.6;
      var s = (x1 - x0) / Math.max(hi - lo, 0.4);
      var toPx = function (xm) { return x0 + (xm - lo) * s; };
      var trackY = 130;

      H.line(ctx, 20, trackY + 52, S.w * 0.62, trackY + 52, { color: C.soft, width: 1.6 });
      H.hatch(ctx, 20, trackY + 52, S.w * 0.62 - 20, 13, { step: 10 });

      var cur = pos(S.t);
      var collided = tc != null && S.t >= tc;
      var cx1 = toPx(cur[0]), cx2 = toPx(cur[1]);

      /* тела */
      function ball(cx, r, m, color, label) {
        H.circle(ctx, cx, trackY, Math.max(12, r * s), { fill: color, shine: 'rgba(255,255,255,.8)', stroke: C.accentDeep, width: 1.4 });
        H.text(ctx, cx, trackY, label, { size: 12.5, color: '#fff', align: 'center', baseline: 'middle', weight: '700' });
        H.text(ctx, cx, trackY + Math.max(12, r * s) + 16, m + ' кг', { size: 11, color: C.soft, align: 'center' });
      }
      ball(cx1, r1, N(m1, 2), '#5b8def', '1');
      ball(cx2, r2, N(m2, 2), '#8fb8e8', '2');

      /* векторы скоростей */
      var vmax = Math.max(Math.abs(v1), Math.abs(v2), Math.abs(u1), Math.abs(u2), 0.5);
      function varrow(cx, vv, y, color, tag) {
        if (Math.abs(vv) < 1e-4) return;
        var len = Math.abs(vv) / vmax * 70;
        H.arrow(ctx, cx, y, cx + Math.sign(vv) * Math.max(len, 4), y, { color: color, width: 2.6, label: tag + ' = ' + N(Math.abs(vv), 2), labelSize: 11.5 });
      }
      varrow(cx1, collided ? u1 : v1, trackY - 46, C.accent, collided ? "v₁′" : 'v₁');
      varrow(cx2, collided ? u2 : v2, trackY - 22, C.violet, collided ? "v₂′" : 'v₂');

      if (collided && tc != null && S.t - tc < 0.9) {
        H.circle(ctx, (cx1 + cx2) / 2, trackY, 20 + (S.t - tc) * 40, { stroke: C.warn, width: 2, dash: [3, 3], alpha: Math.max(0, 1 - (S.t - tc) / 0.9) });
      }
      if (tc == null) {
        H.text(ctx, 40, 44, 'Тела не столкнутся: v₁ ≤ v₂ — расстояние не уменьшается.', { size: 13, color: C.warn, weight: '600' });
      } else {
        H.text(ctx, 40, 44, 'Удар ' + (e ? 'абсолютно упругий' : 'абсолютно неупругий') + ' в момент t = ' + N(tc, 2) + ' с', { size: 12.5, color: C.soft });
      }
      timeline(ctx, 40, trackY + 84, S.w * 0.5, S.t, dur);

      /* график v(t) */
      var gpts1 = [], gpts2 = [];
      if (tc == null) {
        gpts1 = [[0, v1], [dur, v1]]; gpts2 = [[0, v2], [dur, v2]];
      } else {
        gpts1 = [[0, v1], [tc, v1], [tc, u1], [dur, u1]];
        gpts2 = [[0, v2], [tc, v2], [tc, u2], [dur, u2]];
      }
      var ylo = Math.min(v1, v2, u1, u2, 0), yhi = Math.max(v1, v2, u1, u2, 0);
      H.plot(ctx, { x: S.w * 0.66, y: 46, w: Math.max(180, S.w * 0.3), h: 150 }, {
        title: 'Скорости тел', x: [0, dur], y: [ylo - 0.3, yhi + 0.3],
        xLabel: 't, с', yLabel: 'v, м/с',
        series: [{ pts: gpts1, color: C.accent, label: 'шар 1' }, { pts: gpts2, color: C.violet, label: 'шар 2' }],
        cursor: S.t
      });

      /* импульсы и энергия */
      var p0 = m1 * v1 + m2 * v2, p1 = m1 * u1 + m2 * u2;
      var E0 = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
      var E1 = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
      readout(ctx, S.w * 0.66, 250, 'Баланс', [
        ['p до удара', N(p0, 3) + ' кг·м/с'],
        ['p после удара', N(p1, 3) + ' кг·м/с', Math.abs(p0 - p1) < 1e-6 ? C.ok : C.bad],
        ['Eк до', N(E0, 3) + ' Дж'],
        ['Eк после', N(E1, 3) + ' Дж', E1 <= E0 + 1e-9 ? C.ink : C.bad],
        ['потери ΔE', N(E0 - E1, 3) + ' Дж', e ? C.ok : C.warn]
      ], Math.max(190, S.w * 0.3));
    }
  };

  function collideTime(p) {
    var L = 2.6, r1 = 0.055 * Math.cbrt(p.m1), r2 = 0.055 * Math.cbrt(p.m2);
    var dv = p.v1 - p.v2;
    if (dv <= 1e-6) return null;
    var tc = (L - r1 - r2) / dv;
    return tc > 0 ? tc : null;
  }

  /* ═══════════════════ Второй закон: наклонная плоскость ═══════════════════ */
  D.incline = {
    duration: function (p) {
      var a = accel(p);
      if (a <= 1e-6) return 4;
      return Math.max(1.6, Math.min(6, Math.sqrt(2 * 3.2 / a) * 1.15));
    },
    hint: 'Силы разложены по осям наклонной плоскости: mg sin α скользит вниз, μN мешает.',
    draw: function (ctx, S) {
      var m = S.p.m, al = S.p.alpha, mu = S.p.mu, F = S.p.F;
      var a = accel(S.p);
      var dur = S.duration;
      var Lr = 3.2;                                     // длина ската, м
      var s = Math.min(0.5 * a * S.t * S.t, Lr);
      var moved = a > 1e-6;

      /* геометрия: верх ската слева */
      var topX = 60, topY = 60;
      var availW = Math.min(S.w * 0.55, 520), availH = S.h - 150;
      var scale = Math.min(availW / (Lr * Math.cos(al)), availH / (Lr * Math.sin(al) + 0.2));
      if (!isFinite(scale) || scale <= 0) scale = 60;
      var botX = topX + Lr * Math.cos(al) * scale;
      var botY = topY + Lr * Math.sin(al) * scale;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(botX, botY);
      ctx.lineTo(topX, botY);
      ctx.closePath();
      ctx.fillStyle = '#eef3fa';
      ctx.fill();
      ctx.strokeStyle = C.metalDark;
      ctx.lineWidth = 1.8;
      ctx.stroke();
      ctx.restore();
      H.line(ctx, topX - 20, botY, Math.max(botX + 30, S.w * 0.55), botY, { color: C.soft, width: 1.8 });
      H.hatch(ctx, topX - 20, botY, Math.max(botX, S.w * 0.55) - topX + 30, 12, { step: 10 });

      /* угол α */
      ctx.save();
      ctx.strokeStyle = C.accent; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(topX + 52, topY);
      ctx.arc(topX, topY, 52, 0, Math.atan((botY - topY) / (botX - topX)));
      ctx.stroke();
      ctx.restore();
      H.text(ctx, topX + 60, topY + 18, 'α = ' + N(al * DEG, 2) + '°', { size: 12.5, color: C.accentDeep, math: true, weight: '600' });

      /* тело на скате */
      var dirX = Math.cos(al), dirY = Math.sin(al);
      var nx = Math.sin(al), ny = -Math.cos(al);         // нормаль, направлена от плоскости вверх-влево
      var bs = 40;
      var px = topX + dirX * s * scale, py = topY + dirY * s * scale;
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(al);
      H.roundRect(ctx, -bs * 0.6, -bs, bs * 1.2, bs, 5, { fill: '#dbe5f3', stroke: C.metalDark, width: 1.6 });
      H.text(ctx, 0, -bs / 2, 'm', { size: 13, color: C.accentDeep, align: 'center', baseline: 'middle', math: true, weight: '700' });
      ctx.restore();

      /* точка приложения сил — центр тела */
      var cx = px + nx * bs * 0.5, cy = py + ny * bs * 0.5;

      var fScale = 90 / Math.max(m * G, 1);
      var gPar = m * G * Math.sin(al) * fScale;          // проекция mg вдоль ската
      var gPerp = m * G * Math.cos(al) * fScale;         // проекция mg в нормаль
      var mgLen = m * G * fScale;
      var mgTipX = cx, mgTipY = cy + mgLen;

      /* разложение mg по осям ската (пунктирный параллелограмм) */
      var aX = cx + dirX * gPar, aY = cy + dirY * gPar;              // вдоль ската вниз
      var bX = cx - nx * gPerp, bY = cy - ny * gPerp;                // в плоскость
      H.line(ctx, aX, aY, mgTipX, mgTipY, { color: C.faint, dash: [4, 3], width: 1.2 });
      H.line(ctx, bX, bY, mgTipX, mgTipY, { color: C.faint, dash: [4, 3], width: 1.2 });
      H.line(ctx, cx, cy, aX, aY, { color: C.soft, dash: [4, 3], width: 1.4 });
      H.line(ctx, cx, cy, bX, bY, { color: C.soft, dash: [4, 3], width: 1.4 });
      H.text(ctx, aX + dirX * 12 + 4, aY + dirY * 12 + 14, 'mg sin α', { size: 11.5, color: C.soft, math: true });
      H.text(ctx, bX - 46, bY + 4, 'mg cos α', { size: 11.5, color: C.soft, math: true });

      /* тяжесть */
      H.arrow(ctx, cx, cy, mgTipX, mgTipY, { color: C.ink, width: 2.6, label: 'mg', labelSize: 12.5 });
      /* реакция опоры */
      H.arrow(ctx, cx, cy, cx + nx * gPerp, cy + ny * gPerp, { color: C.ok, width: 2.6, label: 'N', labelSize: 12.5 });

      /* направление возможного движения: вниз (+1) или вверх (−1) по скату */
      var Fdown = m * G * Math.sin(al);
      var Ftr = mu * m * G * Math.cos(al);
      var tend = (Fdown - F) >= 0 ? 1 : -1;
      var sgn = moved ? (a >= 0 ? 1 : -1) : tend;

      /* сила трения — против движения */
      var frLen = Ftr * fScale;
      if (frLen > 1) {
        H.arrow(ctx, cx, cy + 3, cx - dirX * frLen * sgn, cy + 3 - dirY * frLen * sgn,
          { color: C.warn, width: 2.4, label: moved ? 'F тр' : 'F тр пок.', labelSize: 11.5 });
      }
      /* внешняя сила — вдоль ската (тянет вверх) */
      if (F > 0) {
        H.arrow(ctx, cx, cy - 8, cx - dirX * F * fScale, cy - 8 - dirY * F * fScale,
          { color: C.violet, width: 2.4, label: 'F', labelSize: 12 });
      }
      /* скорость */
      if (moved) {
        var vv = Math.abs(a) * S.t, vx = dirX * sgn, vy = dirY * sgn;
        var ox = cx + nx * 30, oy = cy + ny * 30, ln = Math.min(74, vv * 9);
        H.arrow(ctx, ox, oy, ox + vx * ln, oy + vy * ln, { color: C.accent, width: 2.6, label: 'v = ' + N(vv, 2) + ' м/с', labelSize: 11.5 });
      } else {
        H.text(ctx, cx + 30, cy - 40, 'a = 0 — тело покоится', { size: 12.5, color: C.warn, weight: '600' });
      }

      /* графики v(t), s(t) */
      var tmax = moved ? Math.max(dur, 0.6) : dur;
      var pts = [], pts2 = [];
      for (var q = 0; q <= 40; q++) {
        var tt = tmax * q / 40;
        pts.push([tt, a * tt]);
        pts2.push([tt, 0.5 * a * tt * tt]);
      }
      var vMax = Math.max(a * tmax, 0.5), sMax = Math.max(0.5 * a * tmax * tmax, 0.5);
      H.plot(ctx, { x: S.w * 0.6, y: 46, w: Math.max(170, S.w * 0.34), h: 110 }, {
        title: 'Скорость', x: [0, tmax], y: [0, vMax], xLabel: 't, с', yLabel: 'v, м/с',
        series: [{ pts: pts, color: C.accent, width: 2 }], cursor: S.t
      });
      H.plot(ctx, { x: S.w * 0.6, y: 190, w: Math.max(170, S.w * 0.34), h: 110 }, {
        title: 'Путь вдоль ската', x: [0, tmax], y: [0, sMax], xLabel: 't, с', yLabel: 's, м',
        series: [{ pts: pts2, color: C.ok, width: 2, fill: 'rgba(31,157,99,.12)' }], cursor: S.t
      });

      readout(ctx, 60, S.h - 116, 'Силы и ускорение', [
        ['mg sin α', N(m * G * Math.sin(al), 2) + ' Н'],
        ['N = mg cos α', N(m * G * Math.cos(al), 2) + ' Н'],
        ['F тр = μN', N(mu * m * G * Math.cos(al), 2) + ' Н'],
        ['a', N(a, 2) + ' м/с²', a > 0 ? C.accentDeep : C.warn],
        ['α₀ = arctg μ', N(Math.atan(mu) * DEG, 2) + '°']
      ], 210);
    }
  };

  function accel(p) {
    var Fdown = p.m * G * Math.sin(p.alpha);
    var Ftr = p.mu * p.m * G * Math.cos(p.alpha);
    var D = Fdown - p.F;
    return Math.abs(D) > Ftr ? (Math.abs(D) - Ftr) / p.m : 0;
  }

  /* ══════════════════════ Закон Ома, Джоуль — Ленц ══════════════════════ */
  D.ohm = {
    duration: 7,
    hint: 'Замкнутая цепь: ток нагревает спираль, теплота идёт в воду — закон Джоуля — Ленца.',
    draw: function (ctx, S) {
      var rho = Number(S.p.mat), l = S.p.l, Sm = S.p.S * 1e6, U = S.p.U, tt = S.p.t, mw = S.p.mw;
      var Rr = rho * l / Sm, I = U / Rr, P = U * I, Q = P * tt;
      var dT = Q / (4200 * mw), j = I / Sm;

      /* контур цепи */
      var cx0 = 40, cy0 = 70, cw = Math.min(S.w * 0.42, 330), ch = 190;
      H.line(ctx, cx0, cy0, cx0 + cw, cy0, { color: C.metalDark, width: 2 });
      H.line(ctx, cx0, cy0 + ch, cx0 + cw, cy0 + ch, { color: C.metalDark, width: 2 });
      H.line(ctx, cx0, cy0, cx0 + cw * 0.18, cy0, { color: C.metalDark, width: 2 });
      H.line(ctx, cx0, cy0, cx0, cy0 + ch, { color: C.metalDark, width: 2 });
      H.line(ctx, cx0 + cw, cy0, cx0 + cw, cy0 + ch * 0.35, { color: C.metalDark, width: 2 });
      H.line(ctx, cx0 + cw, cy0 + ch * 0.65, cx0 + cw, cy0 + ch, { color: C.metalDark, width: 2 });

      /* источник тока слева */
      var by = cy0 + ch / 2;
      H.line(ctx, cx0 - 26, by - 12, cx0 + 26, by - 12, { color: C.ink, width: 3 });
      H.line(ctx, cx0 - 12, by + 6, cx0 + 12, by + 6, { color: C.ink, width: 6 });
      H.text(ctx, cx0, by - 24, U + ' В', { size: 11.5, color: C.soft, align: 'center' });
      H.line(ctx, cx0, cy0 + ch, cx0, by + 6, { color: C.metalDark, width: 2 });
      H.line(ctx, cx0, by - 12, cx0, cy0, { color: C.metalDark, width: 2 });

      /* спираль-резистор внизу, раскаляется от мощности */
      var rx = cx0 + cw * 0.42, rw = cw * 0.4, ry = cy0 + ch;
      var glow = Math.max(0, Math.min(1, P / 3000));
      ctx.save();
      ctx.strokeStyle = H.mix('#8fa3bf', '#e2543a', glow);
      ctx.lineWidth = 3.4;
      ctx.beginPath();
      for (var i = 0; i <= 24; i++) {
        var xx = rx + (rw * i) / 24;
        var yy = ry + (i % 2 ? -7 : 7);
        i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy);
      }
      ctx.stroke();
      if (glow > 0.05) {
        ctx.globalAlpha = glow * 0.5;
        ctx.strokeStyle = '#ff8a5c'; ctx.lineWidth = 10;
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
      ctx.restore();
      H.text(ctx, rx + rw / 2, ry + 26, 'R = ' + N(Rr, 3) + ' Ом', { size: 12, color: C.accentDeep, align: 'center', math: true, weight: '600' });
      H.line(ctx, cx0, ry, rx, ry, { color: C.metalDark, width: 2 });
      H.line(ctx, rx + rw, ry, cx0 + cw, ry, { color: C.metalDark, width: 2 });

      /* электроны: скорость дрейфа условно ∝ I */
      var per = 2 * (cw + ch);
      var dots = 26;
      var drift = Math.min(0.9, I / 12) * (S.t / 2);
      for (var d = 0; d < dots; d++) {
        var f = ((d / dots) + drift) % 1;
        var pp = f * per;
        var ex, ey;
        if (pp < cw) { ex = cx0 + pp; ey = cy0; }
        else if (pp < cw + ch) { ex = cx0 + cw; ey = cy0 + (pp - cw); }
        else if (pp < 2 * cw + ch) { ex = cx0 + cw - (pp - cw - ch); ey = cy0 + ch; }
        else { ex = cx0; ey = cy0 + ch - (pp - 2 * cw - ch); }
        if (Math.abs(ey - ry) < 12 && ex > rx - 4 && ex < rx + rw + 4) continue;
        H.circle(ctx, ex, ey, 2.6, { fill: C.accent });
      }
      H.arrow(ctx, cx0 + cw * 0.1, cy0 - 16, cx0 + cw * 0.3, cy0 - 16, { color: C.warn, width: 2, label: 'I = ' + N(I, 2) + ' А', labelSize: 12 });

      /* амперметр и вольтметр */
      H.circle(ctx, cx0 + cw * 0.72, cy0, 16, { fill: '#fff', stroke: C.metalDark, width: 1.6 });
      H.text(ctx, cx0 + cw * 0.72, cy0, 'A', { size: 14, color: C.ink, align: 'center', baseline: 'middle', weight: '700' });
      H.circle(ctx, cx0 + cw + 34, cy0 + ch * 0.5, 16, { fill: '#fff', stroke: C.metalDark, width: 1.6 });
      H.text(ctx, cx0 + cw + 34, cy0 + ch * 0.5, 'V', { size: 14, color: C.ink, align: 'center', baseline: 'middle', weight: '700' });
      H.line(ctx, cx0 + cw, cy0 + ch * 0.5 - 16, cx0 + cw, cy0 + ch * 0.35, { color: C.metalDark, width: 1.4 });
      H.line(ctx, cx0 + cw, cy0 + ch * 0.5 + 16, cx0 + cw, cy0 + ch * 0.65, { color: C.metalDark, width: 1.4 });

      /* стакан с водой и нагрев */
      var bw = 110, bh = 130, bx = cx0 + cw * 0.42, byy = cy0 + ch + 46;
      var frac = Math.min(1, S.t / S.duration);
      var temp = 20 + dT * frac;
      H.beaker(ctx, bx, byy, bw, bh, {
        level: Math.min(0.9, 0.25 + mw * 0.3), liquid: H.heatColor(Math.min(1, dT * frac / 90), 0.85),
        liquidTop: H.heatColor(Math.min(1, dT * frac / 90) * 0.6, 0.6), surfaceWave: true, phase: S.t,
        graduations: true, label: 'вода ' + N(mw * 1000, 3) + ' г'
      });
      H.line(ctx, bx + bw * 0.5, byy + 6, bx + bw * 0.5, ry, { color: '#c9603f', width: 3 });
      H.thermometer(ctx, bx + bw + 18, byy + 8, bh - 30, Math.min(1, (temp - 20) / Math.max(dT, 1)), { label: 't', color: C.bad });
      H.text(ctx, bx + bw + 25, byy + bh - 4, N(temp, 3) + ' °C', { size: 12, color: C.bad, align: 'center', math: true, weight: '600' });
      if (frac > 0.5) {
        for (var b = 0; b < 5; b++) {
          var bt = (S.t * 0.6 + b * 0.37) % 1;
          H.circle(ctx, bx + 20 + b * 18, byy + bh - 20 - bt * (bh * 0.7), 2 + bT(bt), { fill: 'rgba(255,255,255,.75)' });
        }
      }
      function bT(x) { return x * 2.2; }

      /* график нагрева */
      var gT = [];
      for (var q2 = 0; q2 <= 40; q2++) {
        var tau = tt * q2 / 40;
        gT.push([tau / tt * 100, 20 + (Q / (4200 * mw)) * (q2 / 40)]);
      }
      H.plot(ctx, { x: S.w * 0.62, y: 46, w: Math.max(180, S.w * 0.34), h: 140 }, {
        title: 'Нагрев воды', x: [0, 100], y: [20, 20 + Math.max(dT, 2)],
        xLabel: 'доля времени, %', yLabel: 'T, °C',
        series: [{ pts: gT, color: C.bad, width: 2, fill: 'rgba(209,73,91,.1)' }],
        cursor: frac * 100
      });

      readout(ctx, S.w * 0.62, 232, 'Расчёт цепи', [
        ['R = ρl/S', N(Rr, 3) + ' Ом'],
        ['I = U/R', N(I, 3) + ' А'],
        ['P = UI', N(P, 3) + ' Вт'],
        ['Q = Pt', N(Q, 3) + ' Дж'],
        ['ΔT = Q/(cm)', N(dT, 3) + ' °C'],
        ['j = I/S', N(j, 2) + ' А/мм²', j > 6 ? C.bad : C.ink]
      ], Math.max(190, S.w * 0.34));
    }
  };

  /* ══════════════ МКТ: уравнение Менделеева — Клапейрона ══════════════ */
  D.gas = {
    duration: 8,
    hint: 'Молекулы идеального газа летят прямо и отражаются от стенок: давление — это их удары.',
    draw: function (ctx, S) {
      var p = S.p.p, V = S.p.V, T = S.p.T, M = Number(S.p.gas);
      var nu = p * V / (Rgas * T);
      var Nm = nu * 6.022e23;
      var vrms = Math.sqrt(3 * Rgas * T / M);
      var rho = p * M / (Rgas * T);

      /* сосуд: ширина ∝ V */
      var bx = 50, by = 60;
      var maxW = Math.min(S.w * 0.5, 420), maxH = 210;
      var kV = Math.sqrt(V / 0.05);
      var bw = Math.max(90, maxW * kV), bh = maxH;
      H.rect(ctx, bx, by, bw, bh, { fill: 'rgba(47,111,237,.05)', stroke: C.metalDark, width: 2.4 });
      /* поршень справа */
      H.rect(ctx, bx + bw - 10, by - 8, 20, bh + 16, { fill: '#c9d6e8', stroke: C.metalDark });
      H.arrow(ctx, bx + bw + 34, by + bh / 2, bx + bw + 8, by + bh / 2, { color: C.soft, width: 2, label: 'p', labelSize: 12 });

      /* молекулы — детерминированное «отражение» через треугочную волну */
      var cnt = Math.max(10, Math.min(64, Math.round(12 + nu * 26)));
      var sp = vrms / Math.max(vrms, 1) * 0.9 + 0.1;
      for (var i = 0; i < cnt; i++) {
        var seed = i * 2.399963;
        var ang = (Math.sin(seed) * 0.5 + 0.5) * Math.PI * 2;
        var vx = Math.cos(ang) * sp, vy = Math.sin(ang) * sp;
        var px0 = (Math.sin(seed * 3.1) * 0.5 + 0.5), py0 = (Math.cos(seed * 2.7) * 0.5 + 0.5);
        var rx = tri(px0 * bw + vx * S.t * 70, bw), ry = tri(py0 * bh + vy * S.t * 70, bh);
        var hot = Math.min(1, (T - 253) / 420);
        H.circle(ctx, bx + rx, by + ry, 4.6, { fill: H.mix('#4f7fd0', '#e0654f', hot), shine: 'rgba(255,255,255,.7)' });
        H.line(ctx, bx + rx, by + ry, bx + rx + vx * 12, by + ry + vy * 12, { color: C.faint, width: 1, alpha: 0.5 });
      }
      H.text(ctx, bx, by - 14, 'V = ' + N(V * 1000, 3) + ' л', { size: 12.5, color: C.accentDeep, math: true, weight: '600' });
      H.text(ctx, bx + bw / 2, by + bh + 22, 'показано ' + cnt + ' молекул из ' + N(Nm, 2) + ' · скорость ∝ √(3RT/M)', { size: 11.5, color: C.soft, align: 'center' });

      H.thermometer(ctx, bx - 34, by + 20, bh - 60, Math.min(1, (T - 253) / 420), { label: 'T', color: C.bad });
      H.text(ctx, bx - 27, by + bh + 2, N(T, 3), { size: 11.5, color: C.bad, align: 'center', math: true });

      /* индикатор давления */
      var pgx = bx + bw + 90, pgy = by;
      H.rect(ctx, pgx, pgy + 150, 26, -Math.min(140, p / 2e6 * 140), { fill: C.accent, stroke: C.line });
      H.text(ctx, pgx + 13, pgy + 168, N(p / 1000, 3) + ' кПа', { size: 11.5, color: C.accentDeep, align: 'center', math: true, weight: '600' });
      H.text(ctx, pgx + 13, pgy + 6, 'давление', { size: 10.5, color: C.soft, align: 'center' });

      /* изохора p(T) */
      var pts = [];
      for (var q = 0; q <= 40; q++) {
        var Tk = 253 + (673 - 253) * q / 40;
        pts.push([Tk, nu * Rgas * Tk / V / 1000]);
      }
      H.plot(ctx, { x: S.w * 0.66, y: 46, w: Math.max(170, S.w * 0.3), h: 150 }, {
        title: 'Изохора p(T) при ν, V = const', x: [253, 673], y: [0, Math.max(1200, pts[40][1] * 1.05)],
        xLabel: 'T, К', yLabel: 'p, кПа',
        series: [{ pts: pts, color: C.ok, width: 2 }],
        marker: [{ x: T, y: p / 1000, color: C.accentDeep, label: 'текущее' }]
      });

      readout(ctx, S.w * 0.66, 250, 'Состояние газа', [
        ['ν = pV/(RT)', N(nu, 3) + ' моль'],
        ['m = νM', N(nu * M * 1000, 3) + ' г'],
        ['N = νN_A', N(Nm, 2) + ''],
        ['ρ = pM/(RT)', N(rho, 3) + ' кг/м³'],
        ['v ср. (√3RT/M)', N(vrms, 3) + ' м/с'],
        ['E = 3/2 kT', N(1.5 * KB * T, 2) + ' Дж']
      ], Math.max(190, S.w * 0.32));
    }
  };

  function tri(x, span) {
    var k = ((x % (2 * span)) + 2 * span) % (2 * span);
    return k > span ? 2 * span - k : k;
  }

  /* ══════════════════════════ Тонкая линза ══════════════════════════ */
  D.lens = {
    duration: 6,
    hint: 'Два характерных луча строят изображение: предмет ближе фокуса — лупа (мнимое изображение).',
    draw: function (ctx, S) {
      var F = S.p.F, d = S.p.d, hObj = S.p.h;
      var near = Math.abs(d - F) < 0.002;
      var f = F * d / (d - F);
      var Gam = f / d;
      var Himg = Math.abs(Gam) * hObj;

      var axisY = S.h * 0.5, lensX = S.w * 0.54;
      var right = S.w - lensX - 30, left = lensX - 30;
      var s = left / Math.max(d, 0.03);                 // масштаб: предмет всегда влезает слева
      var hs = Math.min(120, Math.max(30, hObj * s)) / Math.max(hObj, 1e-6);

      var objX = lensX - d * s;
      var tipY = axisY - hObj * hs;
      var real = f > 0;
      var imgX = lensX + f * s;
      var imgTipY = real ? axisY + Himg * hs : axisY - Himg * hs;

      /* оптическая ось, линза, фокусы */
      H.line(ctx, 16, axisY, S.w - 16, axisY, { color: C.soft, width: 1.2 });
      ctx.save();
      ctx.strokeStyle = C.accent; ctx.lineWidth = 2.2; ctx.fillStyle = 'rgba(47,111,237,.10)';
      ctx.beginPath();
      var lh = 112;
      ctx.moveTo(lensX, axisY - lh);
      ctx.quadraticCurveTo(lensX + 18, axisY, lensX, axisY + lh);
      ctx.quadraticCurveTo(lensX - 18, axisY, lensX, axisY - lh);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
      [[-F, 'F'], [F, "F′"], [-2 * F, '2F'], [2 * F, "2F′"]].forEach(function (mk) {
        var x = lensX + mk[0] * s;
        if (x < 10 || x > S.w - 10) return;
        H.circle(ctx, x, axisY, 3.4, { fill: C.warn });
        H.text(ctx, x, axisY + 17, mk[1], { size: 11, color: C.warn, align: 'center', math: true });
      });

      /* предметы */
      H.arrow(ctx, objX, axisY, objX, tipY, { color: C.ink, width: 3, head: 10 });
      H.text(ctx, objX, tipY - 12, 'h = ' + N(hObj * 100, 2) + ' см', { size: 11, color: C.soft, align: 'center' });

      /* лучи: y = k x + b за линзой, ведём до края экрана */
      var ph = (S.t % 3) / 3;
      function ray(x1, y1, x2, y2, color, dash, alpha) {
        H.line(ctx, x1, y1, x2, y2, { color: color, width: 1.7, dash: dash, alpha: alpha == null ? 0.95 : alpha });
        pulse(x1, y1, x2, y2, color, dash ? 0 : 1);
      }
      function pulse(x1, y1, x2, y2, color, on) {
        if (!on) return;
        var f2 = (ph) % 1;
        H.circle(ctx, x1 + (x2 - x1) * f2, y1 + (y2 - y1) * f2, 3, { fill: color });
      }
      function beyond(x, y, dx, dy, color, dash) {
        var t = 1e4;
        if (dx > 1e-9) t = Math.min(t, (S.w - 6 - x) / dx);
        if (dx < -1e-9) t = Math.min(t, (6 - x) / dx);
        if (dy > 1e-9) t = Math.min(t, (S.h - 6 - y) / dy);
        if (dy < -1e-9) t = Math.min(t, (6 - y) / dy);
        H.line(ctx, x, y, x + dx * t, y + dy * t, { color: color, width: 1.7, dash: dash, alpha: dash ? 0.6 : 0.95 });
        if (!dash) pulse(x, y, x + dx * t, y + dy * t, color, 1);
      }

      var rays = [];
      /* 1) параллельный оси → идёт через задний фокус F′ */
      var k1 = (axisY - tipY) / (F * s);
      ray(objX, tipY, lensX, tipY, C.accent);
      beyond(lensX, tipY, 1, k1, C.accent);
      if (!real) H.line(ctx, lensX, tipY, imgX, imgTipY, { color: C.accent, dash: [5, 4], width: 1.2, alpha: 0.55 });
      rays.push([lensX, tipY, 1, k1]);
      /* 2) через оптический центр — не отклоняется */
      var k2 = (axisY - tipY) / (lensX - objX);
      ray(objX, tipY, lensX, axisY, C.ok);
      beyond(lensX, axisY, 1, k2, C.ok);
      if (!real) H.line(ctx, lensX, axisY, imgX, imgTipY, { color: C.ok, dash: [5, 4], width: 1.2, alpha: 0.55 });
      /* 3) через передний фокус → после линзы параллельно оси */
      if (d > F) {
        var k3 = (tipY - axisY) / (objX - (lensX - F * s));
        var y3 = axisY + k3 * ((lensX - F * s) - (lensX - F * s));      // 0 относительно F
        var yAtLens = axisY + k3 * ((lensX) - (lensX - F * s));
        ray(objX, tipY, lensX, yAtLens, C.warn);
        ray(lensX, yAtLens, Math.min(S.w - 6, imgX), yAtLens, C.warn);
        y3 = yAtLens;
      }

      /* изображение */
      if (!near && Math.abs(f) * s < left * 6) {
        H.arrow(ctx, imgX, axisY, imgX, imgTipY, {
          color: real ? C.bad : C.violet, width: 2.8, dash: real ? [] : [5, 4], head: 9
        });
        H.text(ctx, imgX, imgTipY + (real ? 20 : -12),
          (real ? 'действительное, перевёрнутое' : 'мнимое, прямое') + '  H = ' + N(Himg * 100, 2) + ' см',
          { size: 11.5, color: real ? C.bad : C.violet, align: 'center' });
      } else if (!near) {
        H.text(ctx, S.w - 20, 40, 'Изображение далеко за краем экрана (d близко к F)', { size: 12, color: C.warn, align: 'right' });
      }

      readout(ctx, 24, 28, 'Параметры', [
        ['F', N(F * 100, 3) + ' см'],
        ['d', N(d * 100, 3) + ' см'],
        ['f', near ? '→ ∞' : N(f * 100, 3) + ' см'],
        ['Γ = f/d', near ? '∞' : N(Math.abs(Gam), 3) + '×'],
        ['D = 1/F', N(1 / F, 3) + ' дптр']
      ], 172);

      H.text(ctx, S.w / 2, S.h - 22, (near ? 'd = F: лучи после линзы параллельны — изображения нет'
        : d > 2 * F ? 'd > 2F → уменьшенное перевёрнутое (фотоаппарат)'
          : d > F ? 'F < d < 2F → увеличенное перевёрнутое (проектор)'
            : 'd < F → мнимое прямое увеличенное (лупа)'), { size: 12.5, color: C.soft, align: 'center' });
    }
  };

  /* ═══════════════ Преломление и полное внутреннее отражение ═══════════════ */
  D.refraction = {
    duration: 6,
    hint: 'Луч идёт из воздуха в среду; ниже — обратный ход: при α больше критического луч не выходит наружу.',
    draw: function (ctx, S) {
      var n = Number(S.p.medium), al = S.p.alpha;
      var sb = Math.sin(al) / n;
      var be = Math.asin(Math.min(1, sb));
      var crit = Math.asin(1 / n);

      var midY = S.h * 0.46, hitX = S.w * 0.36;
      /* среды */
      H.rect(ctx, 0, 0, S.w, midY, { fill: '#fbfdff' });
      var tint = Math.min(0.5, 0.12 + (n - 1.3) * 0.22);
      H.rect(ctx, 0, midY, S.w, S.h - midY, { fill: 'rgba(47,111,237,' + tint.toFixed(3) + ')' });
      H.line(ctx, 0, midY, S.w, midY, { color: C.accentDeep, width: 2 });
      H.text(ctx, 20, midY - 12, 'воздух  n₁ = 1,00', { size: 12.5, color: C.soft });
      H.text(ctx, 20, midY + 22, 'среда  n₂ = ' + N(n, 3) + '   v = c/n = ' + N(3e8 / n, 3) + ' м/с', { size: 12.5, color: C.accentDeep });

      /* нормаль */
      H.line(ctx, hitX, midY - 160, hitX, midY + 160, { color: C.faint, dash: [5, 4] });
      H.text(ctx, hitX + 6, midY - 158, 'n', { size: 11.5, color: C.faint, math: true });

      var L = 150;
      var ix = hitX - L * Math.sin(al), iy = midY - L * Math.cos(al);
      var rx = hitX + L * Math.sin(al), ry = midY - L * Math.cos(al);
      var tx = hitX + L * Math.sin(be), ty = midY + L * Math.cos(be);

      H.arrow(ctx, ix, iy, hitX, midY, { color: C.warn, width: 2.6, head: 9 });
      H.arrow(ctx, hitX, midY, rx, ry, { color: C.soft, width: 1.8, dash: [6, 4], label: 'отражённый', labelSize: 11 });
      H.arrow(ctx, hitX, midY, tx, ty, { color: C.bad, width: 2.6, head: 9, label: 'преломлённый', labelSize: 11 });

      /* дуги углов */
      function arc(cx, cy, r, a0, a1, color, label) {
        ctx.save();
        ctx.strokeStyle = color; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
        var am = (a0 + a1) / 2;
        H.text(ctx, cx + Math.cos(am) * (r + 14), cy + Math.sin(am) * (r + 14), label, { size: 12.5, color: color, math: true, weight: '600', align: 'center', baseline: 'middle' });
        ctx.restore();
      }
      arc(hitX, midY, 44, -Math.PI / 2 - al, -Math.PI / 2, C.warn, 'α = ' + N(al * DEG, 2) + '°');
      arc(hitX, midY, 34, Math.PI / 2, Math.PI / 2 + be, C.bad, 'β = ' + N(be * DEG, 2) + '°');

      /* бегущие волны света */
      var ph = (S.t % 2) / 2;
      for (var i = 0; i < 6; i++) {
        var f = (i / 6 + ph) % 1;
        H.circle(ctx, ix + (hitX - ix) * f, iy + (midY - iy) * f, 3, { fill: '#ffd166', stroke: C.warn });
        H.circle(ctx, hitX + (tx - hitX) * f, midY + (ty - midY) * f, 3, { fill: '#ffd166', stroke: C.bad });
      }

      /* нижняя панель: обратный ход и критический угол */
      var py = S.h - 120, px = S.w * 0.55;
      var pw = Math.max(220, S.w * 0.4);
      H.panel(ctx, px, py, pw, 104, { title: 'Обратный ход: среда → воздух' });
      var cx0 = px + 54, cy0 = py + 66;
      H.line(ctx, px + 16, cy0, px + 110, cy0, { color: C.accentDeep, width: 2 });
      H.rect(ctx, px + 16, cy0, 94, 30, { fill: 'rgba(47,111,237,' + Math.min(0.5, tint).toFixed(3) + ')' });
      var aShow = Math.min(crit * 1.6, al);
      var ex2 = cx0 + 46 * Math.sin(aShow), ey2 = cy0 - 46 * Math.cos(aShow);
      H.arrow(ctx, cx0, cy0, ex2, ey2, { color: C.bad, width: 2.4 });
      var beyond = al > crit;
      if (beyond) {
        H.arrow(ctx, cx0, cy0, cx0 + 46 * Math.sin(aShow), cy0 + 46 * Math.cos(aShow), { color: C.warn, width: 2.4, label: 'ПВО', labelSize: 11 });
      } else {
        H.arrow(ctx, cx0, cy0, cx0 + 46 * Math.sin(aShow / n), cy0 - 46 * Math.cos(aShow / n), { color: C.ok, width: 2, label: 'выход', labelSize: 11 });
      }
      H.line(ctx, cx0, cy0 - 52, cx0, cy0 + 8, { color: C.faint, dash: [4, 3] });
      readout(ctx, px + 130, py + 26, '', [
        ['α_пр = arcsin(1/n)', N(crit * DEG, 3) + '°', C.accentDeep],
        [beyond ? 'α > α_пр' : 'α < α_пр', beyond ? 'нет преломлённого луча' : 'луч выходит', beyond ? C.bad : C.ok]
      ], pw - 140);

      readout(ctx, 20, S.h - 118, 'Закон Снеллиуса', [
        ['sin α', N(Math.sin(al), 3)],
        ['sin β = sin α / n', N(sb, 3)],
        ['β', N(be * DEG, 3) + '°'],
        ['α_пр', N(crit * DEG, 3) + '°']
      ], 190);
    }
  };
})(window);

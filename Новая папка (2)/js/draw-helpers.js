/* H — примитивы рисования для анимаций: векторы сил, графики, посуда,
   молекулы, температурная заливка. Все размеры — в CSS-пикселях,
   коэффициент devicePixelRatio учитывается в H.setup(). */
(function (global) {
  'use strict';

  /* Палитра совпадает с css/styles.css — анимация выглядит частью страницы. */
  var C = {
    ink: '#16233c',
    soft: '#5a6a85',
    faint: '#8d9ab2',
    line: '#d7e0ee',
    grid: '#edf1f7',
    paper: '#fdfefe',
    accent: '#2f6fed',
    accentDeep: '#1b3f8f',
    accentSoft: '#eaf1ff',
    ok: '#1f9d63',
    warn: '#b7791f',
    bad: '#d1495b',
    violet: '#6b46c1',
    metal: '#9fb0c8',
    metalDark: '#61738f',
    glass: '#b9c8dd',
    water: '#cfe3ff',
    wood: '#d9c39c'
  };

  var FONT = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif';
  var MATH = '"Cambria Math",Cambria,Georgia,serif';

  /* ─── Канва ─────────────────────────────────────────────── */
  function setup(canvas, cssH) {
    var w = Math.max(320, canvas.clientWidth || 800);
    var h = cssH || 380;
    var dpr = Math.min(global.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.height = h + 'px';
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  function clear(ctx, w, h, bg) {
    ctx.save();
    ctx.fillStyle = bg || C.paper;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  /* ─── Базовые фигуры ────────────────────────────────────── */
  function line(ctx, x1, y1, x2, y2, o) {
    o = o || {};
    ctx.save();
    ctx.strokeStyle = o.color || C.ink;
    ctx.lineWidth = o.width || 1;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function rect(ctx, x, y, w, h, o) {
    o = o || {};
    ctx.save();
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fillRect(x, y, w, h); }
    if (o.stroke) {
      ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width || 1;
      if (o.dash) ctx.setLineDash(o.dash);
      ctx.strokeRect(x, y, w, h);
    }
    ctx.restore();
  }

  function roundRect(ctx, x, y, w, h, r, o) {
    o = o || {};
    ctx.save();
    ctx.beginPath();
    var rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
    ctx.closePath();
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width || 1; ctx.stroke(); }
    ctx.restore();
  }

  function circle(ctx, x, y, r, o) {
    o = o || {};
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.2, r), 0, Math.PI * 2);
    if (o.fill) {
      if (o.shine) {
        var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
        g.addColorStop(0, o.shine);
        g.addColorStop(1, o.fill);
        ctx.fillStyle = g;
      } else ctx.fillStyle = o.fill;
      ctx.fill();
    }
    if (o.stroke) {
      ctx.strokeStyle = o.stroke; ctx.lineWidth = o.width || 1;
      if (o.dash) ctx.setLineDash(o.dash);
      ctx.stroke();
    }
    ctx.restore();
  }

  /* Стрелка (вектор силы, скорости, тока). */
  function arrow(ctx, x1, y1, x2, y2, o) {
    o = o || {};
    var color = o.color || C.accent;
    var w = o.width || 2.4;
    var head = o.head || Math.max(7, w * 3.2);
    var a = Math.atan2(y2 - y1, x2 - x1);
    var len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 0.6) return;
    ctx.save();
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = w;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2 - Math.cos(a) * head * 0.8, y2 - Math.sin(a) * head * 0.8);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - Math.cos(a - 0.42) * head, y2 - Math.sin(a - 0.42) * head);
    ctx.lineTo(x2 - Math.cos(a + 0.42) * head, y2 - Math.sin(a + 0.42) * head);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    if (o.label) {
      var lx = x2 + Math.cos(a) * (head + 8);
      var ly = y2 + Math.sin(a) * (head + 8);
      text(ctx, lx, ly, o.label, {
        color: color, size: o.labelSize || 14, align: Math.abs(Math.cos(a)) > 0.6 ? (Math.cos(a) > 0 ? 'left' : 'right') : 'center',
        baseline: Math.abs(Math.sin(a)) > 0.6 ? (Math.sin(a) > 0 ? 'top' : 'bottom') : 'middle',
        weight: '600', math: true
      });
    }
  }

  /* ─── Текст ─────────────────────────────────────────────── */
  function text(ctx, x, y, str, o) {
    o = o || {};
    ctx.save();
    ctx.fillStyle = o.color || C.ink;
    ctx.globalAlpha = o.alpha == null ? 1 : o.alpha;
    var size = o.size || 13;
    ctx.font = (o.weight ? o.weight + ' ' : '') + size + 'px ' + (o.math ? MATH : FONT);
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.baseline || 'alphabetic';
    String(str).split('\n').forEach(function (row, i) {
      ctx.fillText(row, x, y + i * (size * 1.28));
    });
    ctx.restore();
  }

  /* Перенос по словам — для подписей и выносок. */
  function wrap(ctx, str, maxW) {
    var words = String(str).split(' ');
    var rows = [], cur = '';
    words.forEach(function (wd) {
      var t = cur ? cur + ' ' + wd : wd;
      if (ctx.measureText(t).width > maxW && cur) { rows.push(cur); cur = wd; }
      else cur = t;
    });
    if (cur) rows.push(cur);
    return rows;
  }

  /* Белая плашка с подписью — легенда, показания приборов. */
  function panel(ctx, x, y, w, h, o) {
    o = o || {};
    roundRect(ctx, x, y, w, h, 10, {
      fill: o.fill || '#ffffff',
      stroke: o.stroke || C.line,
      width: 1
    });
    if (o.title) {
      text(ctx, x + 12, y + 17, o.title, { size: 10.5, color: C.soft, weight: '700' });
    }
  }

  function legend(ctx, x, y, items, o) {
    o = o || {};
    var dy = o.dy || 18, r = o.r || 5;
    items.forEach(function (it, i) {
      var cy = y + i * dy;
      if (it.color) circle(ctx, x + r, cy, r, { fill: it.color, stroke: 'rgba(22,35,60,.18)' });
      text(ctx, x + r * 2 + 7, cy, it.text, { size: o.size || 12.5, color: it.color || C.ink, baseline: 'middle', math: it.math });
    });
  }

  /* ─── График ──────────────────────────────────────────────
     H.plot(ctx, {x,y,w,h}, {x:[0,1],y:[0,1],series:[{pts,color,label}]}) */
  function plot(ctx, box, o) {
    o = o || {};
    var xr = o.x || [0, 1], yr = o.y || [0, 1];
    var sx = function (v) { return box.x + (v - xr[0]) / (xr[1] - xr[0] || 1) * box.w; };
    var sy = function (v) { return box.y + box.h - (v - yr[0]) / (yr[1] - yr[0] || 1) * box.h; };

    panel(ctx, box.x - 8, box.y - 8, box.w + 16, box.h + 30, { title: o.title });

    /* сетка */
    var xt = o.xTicks || ticks(xr[0], xr[1], o.xSteps || 5);
    var yt = o.yTicks || ticks(yr[0], yr[1], o.ySteps || 4);
    xt.forEach(function (v) {
      line(ctx, sx(v), box.y, sx(v), box.y + box.h, { color: C.grid });
      text(ctx, sx(v), box.y + box.h + 14, fmtTick(v), { size: 10.5, color: C.faint, align: 'center' });
    });
    yt.forEach(function (v) {
      line(ctx, box.x, sy(v), box.x + box.w, sy(v), { color: C.grid });
      text(ctx, box.x - 6, sy(v), fmtTick(v), { size: 10.5, color: C.faint, align: 'right', baseline: 'middle' });
    });

    /* нулевые оси */
    if (yr[0] < 0 && yr[1] > 0 && o.zero !== false) line(ctx, box.x, sy(0), box.x + box.w, sy(0), { color: C.line, width: 1.4 });
    if (xr[0] < 0 && xr[1] > 0 && o.zero !== false) line(ctx, sx(0), box.y, sx(0), box.y + box.h, { color: C.line, width: 1.4 });

    line(ctx, box.x, box.y + box.h, box.x + box.w, box.y + box.h, { color: C.soft });
    line(ctx, box.x, box.y, box.x, box.y + box.h, { color: C.soft });

    if (o.xLabel) text(ctx, box.x + box.w, box.y + box.h + 27, o.xLabel, { size: 11.5, color: C.soft, align: 'right', math: true });
    if (o.yLabel) text(ctx, box.x + 4, box.y - 14, o.yLabel, { size: 11.5, color: C.soft, math: true });

    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x - 1, box.y - 1, box.w + 2, box.h + 2);
    ctx.clip();
    (o.series || []).forEach(function (s) {
      var pts = (s.pts || []).filter(function (p) { return p && isFinite(p[0]) && isFinite(p[1]); });
      if (!pts.length) return;
      if (s.fill) {
        ctx.beginPath();
        ctx.moveTo(sx(pts[0][0]), sy(0));
        pts.forEach(function (p) { ctx.lineTo(sx(p[0]), sy(p[1])); });
        ctx.lineTo(sx(pts[pts.length - 1][0]), sy(0));
        ctx.closePath();
        ctx.fillStyle = s.fill; ctx.fill();
      }
      if (s.band) {
        ctx.beginPath();
        pts.forEach(function (p, i) { i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])); });
        ctx.strokeStyle = s.color; ctx.lineWidth = s.width || 6; ctx.globalAlpha = 0.15; ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.beginPath();
      pts.forEach(function (p, i) {
        if (i) ctx.lineTo(sx(p[0]), sy(p[1])); else ctx.moveTo(sx(p[0]), sy(p[1]));
      });
      ctx.strokeStyle = s.color || C.accent;
      ctx.lineWidth = s.width || 2;
      ctx.setLineDash(s.dash || []);
      ctx.stroke();
      ctx.setLineDash([]);
      if (s.dots) pts.forEach(function (p) { circle(ctx, sx(p[0]), sy(p[1]), s.dots === true ? 3 : s.dots, { fill: s.color || C.accent }); });
    });
    ctx.restore();

    /* курсор времени + подпись текущей точки */
    if (o.cursor != null) {
      var cx = sx(o.cursor);
      line(ctx, cx, box.y, cx, box.y + box.h, { color: C.accent, width: 1, dash: [3, 3], alpha: 0.8 });
    }
    if (o.marker) {
      o.marker.forEach(function (m) {
        circle(ctx, sx(m.x), sy(m.y), 4.5, { fill: '#fff', stroke: m.color || C.accent, width: 2 });
        if (m.label) text(ctx, sx(m.x) + 8, sy(m.y) - 8, m.label, { size: 11.5, color: m.color || C.accent, math: true, weight: '600' });
      });
    }
    if ((o.series || []).length > 1 && o.legend !== false) {
      legend(ctx, box.x + 10, box.y + 12, o.series.filter(function (s) { return s.label; }).map(function (s) { return { color: s.color, text: s.label }; }), { dy: 16, r: 4, size: 11.5 });
    }
  }

  function ticks(a, b, n) {
    var span = b - a;
    if (!(span > 0)) return [a];
    var raw = span / n;
    var mag = Math.pow(10, Math.floor(Math.log10(raw)));
    var step = [1, 2, 2.5, 5, 10].map(function (m) { return m * mag; }).filter(function (s) { return s >= raw; })[0] || mag * 10;
    var out = [];
    for (var v = Math.ceil(a / step) * step; v <= b + step * 1e-6; v += step) out.push(Math.round(v / step) * step);
    return out;
  }

  function fmtTick(v) {
    if (Math.abs(v) < 1e-12) return '0';
    var a = Math.abs(v);
    if (a >= 10000 || a < 0.01) return v.toExponential(1).replace('.', ',').replace('e', '·10^');
    return String(Number(v.toPrecision(3))).replace('.', ',');
  }

  /* ─── Механика: пружина, наклонная плоскость, линейка ───── */
  function spring(ctx, x, y0, y1, coils, r, o) {
    o = o || {};
    ctx.save();
    ctx.strokeStyle = o.color || C.metalDark;
    ctx.lineWidth = o.width || 2.4;
    ctx.lineJoin = 'round';
    var n = coils || 12;
    var lead = Math.min(14, (y1 - y0) * 0.12);
    ctx.beginPath();
    ctx.moveTo(x, y0);
    ctx.lineTo(x, y0 + lead);
    var span = (y1 - lead) - (y0 + lead);
    for (var i = 0; i < n; i++) {
      var t0 = y0 + lead + (span * (i + 0.5)) / n;
      var t1 = y0 + lead + (span * (i + 1)) / n;
      ctx.lineTo(x + (i % 2 ? -r : r), t0);
      ctx.lineTo(x, t1);
    }
    ctx.lineTo(x, y1);
    ctx.stroke();
    ctx.restore();
  }

  /* Штриховка «стена/опора». */
  function hatch(ctx, x, y, w, h, o) {
    o = o || {};
    ctx.save();
    ctx.strokeStyle = o.color || C.glass;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    var step = o.step || 9;
    for (var i = -h; i < w + h; i += step) {
      ctx.moveTo(x + i, y + h);
      ctx.lineTo(x + i + h, y);
    }
    ctx.stroke();
    ctx.restore();
    line(ctx, x, y + h, x + w, y + h, { color: o.edge || C.metalDark, width: 1.6 });
  }

  function ruler(ctx, x, y, h, metersPerPixel, o) {
    o = o || {};
    var step = o.step || 0.01;
    line(ctx, x, y, x, y + h, { color: C.soft, width: 1.4 });
    var n = Math.ceil(h / (step / metersPerPixel));
    for (var i = 0; i <= n; i++) {
      var yy = y + i * (step / metersPerPixel);
      if (yy > y + h + 1) break;
      var major = i % (o.majorEvery || 10) === 0;
      line(ctx, x, yy, x + (major ? 12 : 6), yy, { color: C.soft, width: major ? 1.3 : 1 });
      if (major) text(ctx, x + 15, yy, String(Math.round(i * step * 100)), { size: 10.5, color: C.faint, baseline: 'middle' });
    }
    if (o.unit) text(ctx, x, y - 8, o.unit, { size: 11, color: C.faint });
  }

  /* ─── Химическая посуда ─────────────────────────────────── */
  /* Стакан/колба с жидкостью. level — доля заполнения 0..1. */
  function beaker(ctx, x, y, w, h, o) {
    o = o || {};
    var wall = 2;
    var lvl = Math.max(0, Math.min(1, o.level == null ? 0.6 : o.level));
    var top = y + h - h * lvl;
    ctx.save();
    if (lvl > 0.002 && o.liquid) {
      var g = ctx.createLinearGradient(0, top, 0, y + h);
      g.addColorStop(0, o.liquidTop || o.liquid);
      g.addColorStop(1, o.liquid);
      ctx.beginPath();
      ctx.moveTo(x + wall, top);
      if (o.surfaceWave) {
        for (var sxp = x + wall; sxp <= x + w - wall; sxp += 6) {
          ctx.lineTo(sxp, top + Math.sin(sxp * 0.12 + (o.phase || 0) * 4) * 1.6);
        }
      }
      ctx.lineTo(x + w - wall, y + h - wall);
      ctx.lineTo(x + wall, y + h - wall);
      ctx.closePath();
      ctx.fillStyle = g;
      ctx.globalAlpha = o.liquidAlpha == null ? 1 : o.liquidAlpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    /* стенки: слева, дно, справа + носик */
    ctx.strokeStyle = o.stroke || C.glass;
    ctx.lineWidth = wall;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.14, y);
    ctx.lineTo(x, y + h * 0.14);
    ctx.lineTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y + h * 0.14);
    ctx.lineTo(x + w - w * 0.14, y);
    ctx.stroke();
    /* деления */
    if (o.graduations) {
      for (var i = 1; i <= 4; i++) {
        var gy = y + h - (h * i) / 5;
        line(ctx, x + 4, gy, x + (i % 2 ? 12 : 18), gy, { color: C.glass, width: 1 });
      }
    }
    ctx.restore();
    if (o.label) text(ctx, x + w / 2, y + h + 16, o.label, { size: 12, color: C.soft, align: 'center' });
    if (o.value) text(ctx, x + w / 2, y - 8, o.value, { size: 12.5, color: C.accentDeep, align: 'center', weight: '600', math: true });
  }

  /* Пробирка (узкая, со скруглённым дном). */
  function tube(ctx, x, y, w, h, o) {
    o = o || {};
    var lvl = Math.max(0, Math.min(1, o.level == null ? 0.6 : o.level));
    var r = w / 2;
    ctx.save();
    if (lvl > 0.01 && o.liquid) {
      var top = y + h - (h - r) * lvl - r;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, y + h - r);
      ctx.arc(x + r, y + h - r, r, Math.PI, 0, true);
      ctx.lineTo(x + w, top);
      ctx.closePath();
      ctx.fillStyle = o.liquid;
      ctx.globalAlpha = o.liquidAlpha == null ? 1 : o.liquidAlpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = o.stroke || C.glass;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 3, y);
    ctx.lineTo(x, y + 4);
    ctx.lineTo(x, y + h - r);
    ctx.arc(x + r, y + h - r, r, Math.PI, 0, true);
    ctx.lineTo(x + w, y + 4);
    ctx.lineTo(x + w + 3, y);
    ctx.stroke();
    ctx.restore();
    if (o.label) text(ctx, x + r, y + h + 16, o.label, { size: 12, color: C.soft, align: 'center' });
  }

  /* Термометр: frac 0..1 — положение столбика. */
  function thermometer(ctx, x, y, h, frac, o) {
    o = o || {};
    var w = 14, bulb = 10;
    circle(ctx, x + w / 2, y + h, bulb, { fill: o.color || C.bad, stroke: C.glass, width: 1.5 });
    roundRect(ctx, x, y, w, h, 7, { fill: '#fff', stroke: C.glass, width: 1.5 });
    var f = Math.max(0, Math.min(1, frac));
    var top = y + h - (h - 6) * f;
    roundRect(ctx, x + 3.5, top, w - 7, y + h - top, 3, { fill: o.color || C.bad });
    for (var i = 0; i <= 5; i++) line(ctx, x + w, y + (h * i) / 5, x + w + 5, y + (h * i) / 5, { color: C.glass });
    if (o.label) text(ctx, x + w / 2, y - 8, o.label, { size: 11.5, color: C.soft, align: 'center' });
  }

  /* Электрод, солёной мостик, спиртовка — мелкие детали. */
  function electrode(ctx, x, y, h, w, o) {
    o = o || {};
    roundRect(ctx, x, y, w, h, 3, { fill: o.fill || C.metal, stroke: o.stroke || C.metalDark });
    if (o.label) text(ctx, x + w / 2, y - 8, o.label, { size: 12, color: C.soft, align: 'center', weight: '600' });
  }

  /* Атом-«шарик» с подписью. */
  function atom(ctx, x, y, r, color, label, o) {
    o = o || {};
    circle(ctx, x, y, r, { fill: color, shine: 'rgba(255,255,255,.75)', stroke: 'rgba(22,35,60,.25)', width: 1 });
    if (label) text(ctx, x, y, label, { size: o.size || Math.max(9, r * 0.85), color: o.labelColor || '#fff', align: 'center', baseline: 'middle', weight: '700' });
  }

  function bond(ctx, x1, y1, x2, y2, o) {
    o = o || {};
    line(ctx, x1, y1, x2, y2, { color: o.color || 'rgba(22,35,60,.45)', width: o.width || 3 });
  }

  /* Молекула: атомы + связи. atoms = [{dx,dy,r,c,l}] */
  function molecule(ctx, x, y, atoms, o) {
    o = o || {};
    (atoms.links || []).forEach(function (lk) {
      var a = atoms.nodes[lk[0]], b = atoms.nodes[lk[1]];
      bond(ctx, x + a.dx, y + a.dy, x + b.dx, y + b.dy, o);
    });
    atoms.nodes.forEach(function (a) { atom(ctx, x + a.dx, y + a.dy, a.r, a.c, a.l, o); });
  }

  /* Пузырёк газа. */
  function bubble(ctx, x, y, r, o) {
    o = o || {};
    circle(ctx, x, y, r, { fill: 'rgba(255,255,255,.55)', stroke: o.color || 'rgba(47,111,237,.55)', width: 1.2 });
  }

  /* Тепловая заливка: t 0..1 → от голубого к красному (нагрев раствора). */
  function heatColor(t, alpha) {
    t = Math.max(0, Math.min(1, t));
    var r = Math.round(150 + 105 * t);
    var g = Math.round(190 - 60 * t);
    var b = Math.round(240 - 150 * t);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha == null ? 1 : alpha) + ')';
  }

  /* Смешение двух цветов (для индикаторов). */
  function mix(c1, c2, t) {
    var a = parse(c1), b = parse(c2);
    t = Math.max(0, Math.min(1, t));
    function p(x) { return Array.isArray(x) ? x : parse(x); }
    a = p(a); b = p(b);
    var r = Math.round(a[0] + (b[0] - a[0]) * t);
    var g = Math.round(a[1] + (b[1] - a[1]) * t);
    var bl = Math.round(a[2] + (b[2] - a[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  function parse(c) {
    var m = /^#([0-9a-f]{6})$/i.exec(c);
    if (m) {
      var n = parseInt(m[1], 16);
      return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    return [255, 255, 255];
  }

  /* Пружинные «часы» анимации: плавный цикл 0..1. */
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }

  global.H = {
    C: C, FONT: FONT, MATH: MATH,
    setup: setup, clear: clear,
    line: line, rect: rect, roundRect: roundRect, circle: circle, arrow: arrow,
    text: text, wrap: wrap, panel: panel, legend: legend, plot: plot, ticks: ticks,
    spring: spring, hatch: hatch, ruler: ruler,
    beaker: beaker, tube: tube, thermometer: thermometer, electrode: electrode,
    atom: atom, bond: bond, molecule: molecule, bubble: bubble,
    heatColor: heatColor, mix: mix, ease: ease
  };
})(window);

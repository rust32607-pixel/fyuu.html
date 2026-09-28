/* app.js — интерфейс лаборатории: список тем, карточка темы, панель
   параметров, расчёт «формула → подстановка → результат», переключение
   единиц и цикл анимации на Canvas.  */
(function (global) {
  'use strict';

  var H = global.H, Fmt = global.Fmt, Lab = global.Lab;

  /* Реестр анимаций наполняют draw-demos.js и draw-chem-demos.js:
     Demos[id] = { duration, hint, draw(ctx, S) }
     S = { w, h, t, p, res, topic, speed } — t в секундах «модели». */
  var Demos = global.Demos = global.Demos || {};

  var el = function (id) { return document.getElementById(id); };

  var state = {
    subject: 'phys',
    topicId: null,
    disp: {},        // значения параметров в текущих (отображаемых) единицах
    computed: null,  // результат Lab.compute
    playing: false,
    speed: 1,
    t: 0,
    last: 0,
    raf: null
  };

  /* ─── Форматирование результата шага расчёта ─────────────── */
  function valueText(step) {
    if (step.dim && Fmt.DIMS[step.dim]) return Fmt.split(step.value, step.dim);
    return Fmt.num(step.value, 3) + (step.unit ? '\u2009' + step.unit : '');
  }

  function math(str) { return Fmt.math(str == null ? '' : str); }

  /* ─── Левый список тем ──────────────────────────────────── */
  function renderSidebar() {
    var side = el('sidebar');
    side.innerHTML = '';
    Lab.groups(state.subject).forEach(function (g) {
      var box = document.createElement('div');
      box.className = 'side-group';
      var h3 = document.createElement('h3');
      h3.textContent = g.name;
      box.appendChild(h3);
      g.items.forEach(function (t) {
        var b = document.createElement('button');
        b.className = 'side-item' + (t.id === state.topicId ? ' is-active' : '');
        b.textContent = t.title.replace(/^[^:]+:\s*/, '');
        b.title = t.title;
        b.setAttribute('data-topic', t.id);
        b.addEventListener('click', function () { openTopic(t.id); });
        box.appendChild(b);
      });
      if (!g.items.length) {
        var e = document.createElement('p');
        e.className = 'side-empty';
        e.textContent = 'Темы появятся позже.';
        box.appendChild(e);
      }
      side.appendChild(box);
    });
  }

  /* ─── Открытие темы ─────────────────────────────────────── */
  function openTopic(id) {
    var topic = Lab.find(id);
    if (!topic) return;
    state.topicId = id;
    state.subject = topic.subject;
    state.disp = defaultDisp(topic);
    state.t = 0;
    el('introView').hidden = true;
    el('topicView').hidden = false;
    document.querySelectorAll('#subjectTabs .tab').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-subject') === topic.subject);
    });
    renderSidebar();
    renderHead(topic);
    renderParams(topic);
    recompute();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function defaultDisp(topic) {
    var d = {};
    topic.params.forEach(function (p) {
      d[p.key] = p.kind === 'select' ? p.options[0].value : Lab.bounds(p).def;
    });
    return d;
  }

  function renderHead(topic) {
    el('crumbs').innerHTML = '';
    var cr = document.createElement('span');
    cr.textContent = (topic.subject === 'phys' ? 'Физика' : 'Химия') + ' · ' + topic.group;
    el('crumbs').appendChild(cr);
    var badge = document.createElement('span');
    badge.className = 'badge ' + levelClass(topic.level);
    badge.textContent = topic.level;
    el('crumbs').appendChild(badge);

    el('topicTitle').textContent = topic.title;
    el('topicSub').textContent = topic.short + ' — ' + (topic.subject === 'phys' ? 'физика' : 'химия') + ', ' + topic.group;
    el('topicDesc').innerHTML = math(topic.statement || '');

    var th = el('theory');
    th.innerHTML = '';
    (topic.theory || []).forEach(function (t) {
      var li = document.createElement('li');
      li.innerHTML = math(t);
      th.appendChild(li);
    });
    th.parentElement.hidden = !(topic.theory || []).length;

    var ap = el('apply');
    ap.innerHTML = '';
    (topic.apply || []).forEach(function (t) {
      var li = document.createElement('li');
      li.innerHTML = math(t);
      ap.appendChild(li);
    });
    ap.parentElement.hidden = !(topic.apply || []).length;

    el('limits').innerHTML = (topic.limits || []).map(function (t) { return '<li>' + math(t) + '</li>'; }).join('');
    el('example').innerHTML = math(topic.example || '—');
    el('selfcheck').innerHTML = (topic.check || []).map(function (t) { return '<li>' + math(t) + '</li>'; }).join('');
    el('sources').innerHTML = (topic.sources || []).map(function (t) { return '<li>' + Fmt.esc(t) + '</li>'; }).join('');

    var tr = el('tryList');
    tr.innerHTML = (topic.try || []).length
      ? '<h4>Что попробовать</h4><ul>' + topic.try.map(function (t) { return '<li>' + math(t) + '</li>'; }).join('') + '</ul>'
      : '';
  }

  function levelClass(level) {
    var m = /(\d)/.exec(level || '');
    return m ? 'lv' + m[1] : '';
  }

  /* ─── Панель параметров ─────────────────────────────────── */
  function renderParams(topic) {
    var box = el('params');
    box.innerHTML = '';
    topic.params.forEach(function (p) {
      var cell = document.createElement('div');
      cell.className = 'param';
      cell.setAttribute('data-key', p.key);

      var head = document.createElement('div');
      head.className = 'param-head';
      var lab = document.createElement('span');
      lab.className = 'param-label';
      lab.innerHTML = (p.sym ? '<span class="math">' + math(p.sym) + '</span> · ' : '') + Fmt.esc(p.label);
      var val = document.createElement('span');
      val.className = 'param-val';
      head.appendChild(lab);
      head.appendChild(val);
      cell.appendChild(head);

      if (p.kind === 'select') {
        var sel = document.createElement('select');
        p.options.forEach(function (o) {
          var op = document.createElement('option');
          op.value = o.value;
          op.textContent = o.label;
          sel.appendChild(op);
        });
        sel.value = state.disp[p.key];
        sel.addEventListener('change', function () {
          state.disp[p.key] = sel.value;
          recompute();
        });
        cell.appendChild(sel);
      } else {
        var b = Lab.bounds(p);
        var range = document.createElement('input');
        range.type = 'range';
        range.min = b.min; range.max = b.max; range.step = b.step;
        range.value = num(state.disp[p.key], b);
        var input = document.createElement('input');
        input.type = 'number';
        input.min = b.min; input.max = b.max; input.step = b.step;
        input.value = range.value;
        input.setAttribute('aria-label', p.label + ', ' + b.u);

        var commit = function (v, from) {
          state.disp[p.key] = v;
          if (from !== 'range') range.value = num(v, b);
          if (from !== 'number') input.value = String(v);
          recompute();
        };
        range.addEventListener('input', function () { commit(parseFloat(range.value), 'range'); });
        input.addEventListener('input', function () {
          var raw = input.value.trim().replace(',', '.');
          if (raw === '' || !isFinite(Number(raw))) return;   // ждём завершения ввода
          commit(Number(raw), 'number');
        });
        cell.appendChild(range);

        var hint = document.createElement('div');
        hint.className = 'hint';
        hint.textContent = 'от ' + Fmt.num(b.min, 3) + ' до ' + Fmt.num(b.max, 3) + ' ' + b.u +
          (p.si && p.si.tip ? ' · ' + p.si.tip : '');
        cell.appendChild(hint);
        cell.appendChild(input);
      }
      box.appendChild(cell);
    });
  }

  function num(v, b) {
    if (!isFinite(v)) return b.def;
    var k = Math.round((v - b.min) / b.step) * b.step + b.min;
    return Math.min(b.max, Math.max(b.min, Number(k.toFixed(6))));
  }

  /* Обновить подпись значения у каждого параметра */
  function syncParamLabels(topic) {
    topic.params.forEach(function (p) {
      var cell = document.querySelector('.param[data-key="' + p.key + '"]');
      if (!cell) return;
      var out = cell.querySelector('.param-val');
      if (!out) return;
      if (p.kind === 'select') {
        var opt = p.options.filter(function (o) { return String(o.value) === String(state.disp[p.key]); })[0];
        out.textContent = opt ? opt.label.split('—')[0].trim() : '—';
      } else {
        out.textContent = Lab.show(p, Lab.toSI(p, Number(state.disp[p.key])), 3);
      }
    });
  }

  /* ─── Расчёт и вывод ────────────────────────────────────── */
  function recompute() {
    var topic = Lab.find(state.topicId);
    if (!topic) return;
    var r = Lab.compute(topic, state.disp);
    state.computed = r;

    /* ошибки ввода */
    var errBox = el('errors');
    errBox.innerHTML = '';
    document.querySelectorAll('.param').forEach(function (c) { c.classList.remove('is-error'); });
    if (!r.ok) {
      r.errors.forEach(function (e) {
        var d = document.createElement('div');
        d.className = 'err';
        d.textContent = (e.label ? e.label + ': ' : '') + e.msg;
        errBox.appendChild(d);
        var cell = document.querySelector('.param[data-key="' + e.key + '"]');
        if (cell) cell.classList.add('is-error');
      });
    }

    el('calcFormula').innerHTML = math(topic.formula);

    if (!r.ok) {
      el('dynStatus').innerHTML = '<div class="status status-bad">Проверьте выделенные параметры — расчёт не выполнен.</div>';
      el('calcSubst').innerHTML = '';
      el('calcResult').innerHTML = '—';
      el('results').innerHTML = '';
      el('extras').innerHTML = '';
      el('vars').innerHTML = '';
      drawFrame();
      return;
    }

    syncParamLabels(topic);

    /* статус границ применимости */
    var st = el('dynStatus');
    st.innerHTML = '';
    (r.res.notes || []).forEach(function (n) {
      if (!n) return;
      var d = document.createElement('div');
      d.className = 'status status-' + (n.level === 'info' ? 'info' : n.level);
      d.innerHTML = '<span>' + math(n.text) + '</span>';
      st.appendChild(d);
    });

    /* формула → подстановка → результат */
    el('calcSubst').innerHTML = (r.res.steps || []).map(function (step) {
      return '<div class="calc-sub">' +
        '<span class="calc-tag">' + Fmt.esc(step.label) + '</span>' +
        '<span class="math calc-src">' + math(step.formula) + '</span>' +
        '<span class="math">' + math(step.subst) + '</span>' +
        '<span class="math calc-out">= ' + math(valueText(step)) + '</span>' +
        (step.note ? '<span class="calc-note">' + math(step.note) + '</span>' : '') +
        '</div>';
    }).join('');

    var main = (r.res.steps || [])[0];
    el('calcResult').innerHTML = main
      ? math(main.label + ' = ' + valueText(main))
      : '—';

    el('results').innerHTML = (r.res.steps || []).map(function (step, i) {
      return '<div class="res' + (i === 0 ? ' res-main' : '') + '">' +
        '<span class="res-key">' + Fmt.esc(step.label) + '</span>' +
        '<span class="res-val">' + math(valueText(step)) + '</span>' +
        '</div>';
    }).join('');

    el('extras').innerHTML = (r.res.extras || []).map(function (x) {
      if (x.eq) return '<div class="extra-eq">' + math(x.eq) + '</div>';
      if (x.title) return '<div class="extra-title">' + Fmt.esc(x.title) + '</div>';
      return '<div class="extra-text">' + math(x.text || '') + '</div>';
    }).join('');

    el('vars').innerHTML = topic.params.map(function (p) {
      var v;
      if (p.kind === 'select') {
        var o = p.options.filter(function (x) { return String(x.value) === String(state.disp[p.key]); })[0];
        v = o ? o.label : '—';
      } else {
        v = Lab.show(p, Lab.toSI(p, Number(state.disp[p.key])), 3);
      }
      return '<span><span class="math">' + math(p.sym || p.label) + '</span> = ' + Fmt.esc(v) + '</span>';
    }).join('');

    drawFrame();
  }

  /* ─── Анимация ──────────────────────────────────────────── */
  var CANVAS_H = 400;

  function drawFrame() {
    var canvas = el('canvas');
    var topic = Lab.find(state.topicId);
    if (!topic || !canvas) return;
    var g = H.setup(canvas, CANVAS_H);
    H.clear(g.ctx, g.w, g.h);
    var demo = Demos[topic.demo];
    el('canvasHint').textContent = demo
      ? demo.hint + ' Скорость слева внизу — ползунок «Скорость» в шапке блока.'
      : 'Анимация для этой темы ещё не добавлена — расчёт работает.';
    if (!demo) return;

    var r = state.computed;
    var S = {
      w: g.w, h: g.h,
      t: state.t,
      duration: demo.duration || 6,
      p: r && r.ok ? r.v : defaultSI(topic),
      res: r && r.ok ? r.res : null,
      topic: topic,
      speed: state.speed
    };
    try {
      demo.draw(g.ctx, S);
    } catch (e) {
      H.text(g.ctx, 20, 30, 'Ошибка анимации: ' + e.message, { color: H.C.bad, size: 13 });
    }
  }

  /* Если ввод некорректен — анимация всё равно рисуется на дефолтных значениях. */
  function defaultSI(topic) {
    var out = {};
    topic.params.forEach(function (p) {
      out[p.key] = p.kind === 'select' ? p.options[0].value : p.si.def;
    });
    return out;
  }

  function loop(ts) {
    if (!state.playing) { state.raf = null; return; }
    var demo = Demos[(Lab.find(state.topicId) || {}).demo];
    var dur = (demo && demo.duration) || 6;
    if (!state.last) state.last = ts;
    var dt = Math.min(0.05, (ts - state.last) / 1000);
    state.last = ts;
    state.t += dt * state.speed;
    if (state.t > dur) state.t = 0;
    drawFrame();
    state.raf = requestAnimationFrame(loop);
  }

  function play(on) {
    state.playing = on;
    state.last = 0;
    el('playBtn').textContent = on ? '❚❚ Пауза' : '▶ Пуск';
    if (on && !state.raf) state.raf = requestAnimationFrame(loop);
    if (!on) drawFrame();
  }

  /* ─── Единицы ───────────────────────────────────────────── */
  function setSystem(sys) {
    var topic = Lab.find(state.topicId);
    var keep = topic && state.computed && state.computed.ok ? state.computed.v : null;
    Fmt.setMode(sys);
    document.querySelectorAll('.unit-btn').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-unit') === (sys === 'school' ? 'school' : 'SI'));
    });
    if (!topic) return;
    topic.params.forEach(function (p) {
      if (p.kind === 'select') return;
      var si = keep ? keep[p.key] : Lab.toSI(p, Number(state.disp[p.key]));
      state.disp[p.key] = Lab.toDisp(p, si);
    });
    renderParams(topic);
    recompute();
  }

  /* ─── Инициализация ─────────────────────────────────────── */
  function init() {
    Fmt.setMode('si');

    document.querySelectorAll('#subjectTabs .tab').forEach(function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-subject');
        state.subject = s;
        document.querySelectorAll('#subjectTabs .tab').forEach(function (x) { x.classList.toggle('is-active', x === b); });
        var first = Lab.bySubject(s)[0];
        if (first) openTopic(first.id);
        else { renderSidebar(); el('topicView').hidden = true; el('introView').hidden = false; }
      });
    });

    document.querySelectorAll('.unit-btn').forEach(function (b) {
      b.addEventListener('click', function () {
        setSystem(b.getAttribute('data-unit') === 'school' ? 'school' : 'si');
      });
    });

    el('startPhysBtn').addEventListener('click', function () { var t = Lab.bySubject('phys')[0]; if (t) openTopic(t.id); });
    el('startChemBtn').addEventListener('click', function () { var t = Lab.bySubject('chem')[0]; if (t) openTopic(t.id); });

    el('playBtn').addEventListener('click', function () { play(!state.playing); });
    el('resetBtn').addEventListener('click', function () { state.t = 0; play(false); drawFrame(); });
    el('resetParamsBtn').addEventListener('click', function () {
      var topic = Lab.find(state.topicId);
      if (!topic) return;
      state.disp = defaultDisp(topic);
      state.t = 0;
      renderParams(topic);
      recompute();
    });
    el('speedRange').addEventListener('input', function () {
      state.speed = parseFloat(this.value);
      el('speedVal').textContent = state.speed.toFixed(1) + '×';
    });
    el('printBtn').addEventListener('click', function () {
      document.querySelectorAll('details').forEach(function (d) { d.setAttribute('open', ''); });
      window.print();
    });

    global.addEventListener('resize', function () { drawFrame(); });

    renderSidebar();
    var first = Lab.bySubject('phys')[0];
    if (first) openTopic(first.id);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.App = {
    state: state, openTopic: openTopic, recompute: recompute, drawFrame: drawFrame, Demos: Demos
  };
})(window);

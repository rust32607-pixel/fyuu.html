/* Lab — ядро лаборатории: константы, реестр тем, перевод единиц,
   валидация ввода и запуск расчёта.  */
(function (global) {
  'use strict';

  /* Константы: значения приняты в школьном курсе и справочниках
     (см. поле sources у тем). */
  var CONST = {
    g: 9.8,            // Н/кг — ускорение свободного падения (в задачах часто 10)
    R: 8.314,          // Дж/(моль·К) — универсальная газовая постоянная
    NA: 6.022e23,      // 1/моль — постоянная Авогадро
    F: 96485,          // Кл/моль — постоянная Фарадея
    c0: 3e8,           // м/с — скорость света в вакууме
    Vm0: 0.0224,       // м³/моль — молярный объём газа при н. у.
    cWater: 4200,      // Дж/(кг·°C) — удельная теплоёмкость воды
    rhoWater: 1000,    // кг/м³ — плотность воды
    pAtm: 101325,      // Па — нормальное атмосферное давление
    dHneut: 57000      // Дж/моль — тепловой эффект нейтрализации сильной кислоты щёлочью
  };

  var topics = [];

  function register(list) {
    for (var i = 0; i < list.length; i++) {
      if (!find(list[i].id)) topics.push(list[i]);
    }
  }
  function find(id) {
    for (var i = 0; i < topics.length; i++) if (topics[i].id === id) return topics[i];
    return null;
  }
  function bySubject(s) { return topics.filter(function (t) { return t.subject === s; }); }
  function groups(subject) {
    var order = [], map = {};
    bySubject(subject).forEach(function (t) {
      if (!map[t.group]) { map[t.group] = []; order.push(t.group); }
      map[t.group].push(t);
    });
    return order.map(function (g) { return { name: g, items: map[g] }; });
  }

  /* ─── Единицы ввода/вывода параметра ─────────────────────────
     Режим 'si' — основные единицы СИ, режим 'school' — привычные
     школьные (см, г, л, мин, кПа, °C). Границы в теме заданы в СИ.  */
  function io(p) {
    var dim = p.dim ? Fmt.DIMS[p.dim] : null;
    if (Fmt.mode() === 'school' && dim) {
      var alt = dim.alt && dim.alt[0];
      return {
        u: p.schoolU || (alt ? alt.u : dim.si),
        f: p.schoolF || (alt ? alt.f : dim.f),
        c: p.schoolC !== undefined ? p.schoolC : (alt && alt.c ? alt.c : 0)
      };
    }
    return { u: p.unit || (dim ? dim.si : ''), f: dim ? dim.f : 1, c: 0 };
  }
  function toDisp(p, si) { var o = io(p); return si * o.f + (o.c || 0); }
  function toSI(p, d) { var o = io(p); return (d - (o.c || 0)) / o.f; }
  function unitOf(p) { return io(p).u; }

  /* Границы и шаг в текущих единицах (для ползунка и подсказки). */
  function bounds(p) {
    var o = io(p);
    var step = p.dispStep != null ? p.dispStep : Number((p.si.step * o.f).toPrecision(2));
    if (step <= 0) step = 0.01;
    return {
      min: p.si.min * o.f + (o.c || 0),
      max: p.si.max * o.f + (o.c || 0),
      step: step,
      def: p.si.def * o.f + (o.c || 0),
      u: o.u
    };
  }

  /* Значение параметра в виде строки «0,06 м» в текущих единицах. */
  function show(p, si, sig) {
    return Fmt.num(toDisp(p, si), sig) + (unitOf(p) ? '\u2009' + unitOf(p) : '');
  }

  /* ─── Валидация ввода ─────────────────────────────────────── */
  function validate(p, raw) {
    if (p.kind === 'select') {
      return (raw === '' || raw === undefined || raw === null)
        ? 'Выберите значение из списка' : null;
    }
    var b = bounds(p);
    var str = String(raw).trim().replace(',', '.');
    if (str === '') return 'Введите значение';
    if (!/^-?\d*\.?\d+(e-?\d+)?$/i.test(str)) return 'Можно вводить только числа, разделитель — запятая или точка';
    var v = Number(str);
    if (!isFinite(v)) return 'Слишком большое число';
    if (v < b.min - 1e-9) return 'Слишком мало: минимум ' + Fmt.num(b.min, 3) + '\u2009' + b.u;
    if (v > b.max + 1e-9) return 'Слишком много: максимум ' + Fmt.num(b.max, 3) + '\u2009' + b.u;
    if (p.check) {
      var msg = p.check(toSI(p, v));
      if (msg) return msg;
    }
    return null;
  }

  /* Пользовательские значения → набор значений в СИ. */
  function collect(topic, dispVals) {
    var out = {};
    topic.params.forEach(function (p) {
      var raw = dispVals[p.key];
      if (p.kind === 'select') {
        out[p.key] = (raw === undefined || raw === null || raw === '') ? p.options[0].value : raw;
        return;
      }
      var v = Number(String(raw).trim().replace(',', '.'));
      if (!isFinite(v)) v = p.si.def;
      out[p.key] = toSI(p, v);
    });
    return out;
  }

  /* Полный цикл: проверка → расчёт → статус границ применимости. */
  function compute(topic, dispVals) {
    var errors = [], first = null;
    topic.params.forEach(function (p) {
      var msg = validate(p, dispVals[p.key]);
      if (msg) {
        errors.push({ key: p.key, label: p.label, msg: msg });
        if (!first) first = msg;
      }
    });
    if (errors.length) return { ok: false, errors: errors };

    var v = collect(topic, dispVals);
    var res;
    try {
      res = topic.calc(v);
    } catch (e) {
      return { ok: false, errors: [{ key: '', label: 'Расчёт', msg: 'Не удалось посчитать результат: ' + e.message }] };
    }
    res.notes = res.notes || [];
    res.steps = res.steps || [];
    res.extras = res.extras || [];
    return { ok: true, v: v, res: res };
  }

  /* Мелкие помощники для текстов формул. */
  function s(v, unit, sig) { return Fmt.num(v, sig) + (unit ? '\u2009' + unit : ''); }
  function mul() { return Array.prototype.slice.call(arguments).join(' · '); }
  function fr(a, b) { return '\\frac{' + a + '}{' + b + '}'; }
  function eq(l, r) { return l + ' = ' + r; }

  global.Lab = {
    CONST: CONST,
    register: register, find: find, bySubject: bySubject, groups: groups, topics: topics,
    io: io, toDisp: toDisp, toSI: toSI, unitOf: unitOf, bounds: bounds, show: show,
    validate: validate, collect: collect, compute: compute,
    s: s, mul: mul, fr: fr, eq: eq
  };
})(window);

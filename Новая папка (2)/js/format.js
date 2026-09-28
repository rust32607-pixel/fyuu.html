/* Fmt — форматирование чисел, разметка формул и перевод единиц.
   Формулы записаны компактной разметкой:
     x_{0}   нижний индекс        ^{2}      верхний индекс
     \frac{a}{b}   дробь (черта горизонтальная)   \sqrt{a}   корень
     \cdot \approx \pm \to \sim  и греческие буквы \mu \nu \Omega \Delta ...
*/
(function (global) {
  'use strict';

  var SYM = {
    cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓', ast: '*',
    approx: '≈', ne: '≠', leq: '≤', geq: '≥', ll: '≪', gg: '≫', sim: '∼', propto: '∝',
    to: '→', rightarrow: '→', leftarrow: '←', implies: '⇒', mapsto: '↦', uparrow: '↑', downarrow: '↓',
    infty: '∞', partial: '∂', circ: '°', deg: '°', perp: '⊥', angle: '∠', ldots: '…', dots: '…',
    alpha: 'α', beta: 'β', gamma: 'γ', Gamma: 'Γ', delta: 'δ', Delta: 'Δ',
    epsilon: 'ε', varepsilon: 'ε', zeta: 'ζ', eta: 'η', theta: 'θ', iota: 'ι',
    kappa: 'κ', lambda: 'λ', Lambda: 'Λ', mu: 'μ', nu: 'ν', xi: 'ξ', Xi: 'Ξ',
    pi: 'π', Pi: 'Π', rho: 'ρ', sigma: 'σ', Sigma: 'Σ', tau: 'τ', upsilon: 'υ',
    phi: 'φ', Phi: 'Φ', chi: 'χ', psi: 'ψ', Psi: 'Ψ', omega: 'ω', Omega: 'Ω',
    La: 'Л', l: 'л', '|': '‖'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ─── Числа: 3 значащие цифры, запятая, тонкие пробелы, 10 в степени ─── */
  function num(x, sig) {
    sig = sig || 3;
    if (x === null || x === undefined || !isFinite(x)) return '—';
    if (x === 0) return '0';
    var neg = x < 0;
    x = Math.abs(x);
    var exp = Math.floor(Math.log10(x));
    var s;
    if (exp < -3 || exp >= 5) {
      var man = x / Math.pow(10, exp);
      var m = Number(man.toPrecision(Math.min(3, sig)));
      if (m >= 10) { m = m / 10; exp += 1; }
      s = String(m).replace('.', ',') + '·10' + supers(exp);
    } else {
      var dec = Math.max(0, sig - 1 - exp);
      var v = Number(x.toPrecision(sig));
      if (Math.abs(v) >= Math.pow(10, sig - 1) && exp < 5) { v = Number(v.toPrecision(sig - 1)); }
      s = thinGroup(String(v).replace('.', ','));
    }
    return (neg ? '−' : '') + s;
  }

  function thinGroup(s) {
    var parts = s.split(',');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '\u2009');
    return parts.join(',');
  }

  function supers(n) {
    var map = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
    return String(n).split('').map(function (c) { return map[c] || c; }).join('');
  }

  /* ─── Разметка формул → HTML (рекурсивный разбор) ───────────────── */
  function math(src) {
    var s = String(src);
    var pos = 0;

    function closeOf(from) {           // позиция закрывающей скобки для '{' на from
      var d = 0;
      for (var i = from; i < s.length; i++) {
        if (s.charAt(i) === '{') d++;
        else if (s.charAt(i) === '}') { d--; if (!d) return i; }
      }
      return s.length;
    }

    function group(stopAtBrace) {      // читать атомы до '}' или конца
      var out = '';
      while (pos < s.length) {
        if (s.charAt(pos) === '}') { if (stopAtBrace) pos++; return out; }
        out += atom();
      }
      return out;
    }

    function arg() {                   // аргумент команды: {…}, \cmd или один символ
      while (s.charAt(pos) === ' ') pos++;
      var c = s.charAt(pos);
      if (c === '{') { pos++; return group(true); }
      if (c === '\\') return atom();
      return esc(s.charAt(pos++) || '');
    }

    function rawArg() {                // аргумент как обычный текст
      while (s.charAt(pos) === ' ') pos++;
      if (s.charAt(pos) === '{') {
        var k = closeOf(pos);
        var t = s.slice(pos + 1, k);
        pos = k + 1;
        return esc(t);
      }
      return esc(s.charAt(pos++) || '');
    }

    function atom() {
      var c = s.charAt(pos);

      if (c === '\\') {
        var m = /^\\([A-Za-z]+)/.exec(s.slice(pos));
        if (m) {
          var name = m[1];
          pos += m[0].length;
          if (name === 'frac') { var a = arg(), b = arg(); return frac(a, b); }
          if (name === 'sqrt') { return '<span class="msqrt"><span class="mrad">√</span><span class="mrad">' + arg() + '</span></span>'; }
          if (name === 'text' || name === 'mathrm' || name === 'operatorname' || name === 'unit') {
            return '<span class="mtext">' + rawArg() + '</span>';
          }
          if (name === 'left' || name === 'right' || name === 'displaystyle') return '';
          return esc(SYM[name] !== undefined ? SYM[name] : name);
        }
        var ch = s.charAt(pos + 1);
        pos += 2;
        if (ch === ',' || ch === ';' || ch === ' ') return '&thinsp;';
        if (ch === '!') return '';
        return esc(ch);
      }

      if (c === '{') { pos++; return group(true); }

      if (c === '^' || c === '_') {
        pos++;
        return '<' + (c === '^' ? 'sup' : 'sub') + '>' + arg() + '</' + (c === '^' ? 'sup' : 'sub') + '>';
      }

      pos++;
      return esc(c);
    }

    function frac(a, b) {
      return '<span class="mfrac"><span class="mnum">' + a + '</span><span class="mden">' + b + '</span></span>';
    }

    var html = group(false);
    return html;
  }

  /* Стили формул добавляем сами — файл самодостаточен. */
  var style = document.createElement('style');
  style.textContent = [
    '.formula,.subst{font-family:"Cambria Math","STIX Two Math","Latin Modern Math",Cambria,Georgia,serif;font-size:1.06em;line-height:1.6}',
    '.formula sub,.formula sup,.subst sub,.subst sup{font-size:.72em}',
    '.mfrac{display:inline-flex;flex-direction:column;vertical-align:-0.55em;text-align:center;margin:0 3px;line-height:1.15}',
    '.mfrac>.mnum{padding:0 4px;border-bottom:1px solid currentColor}',
    '.mfrac>.mden{padding:0 4px}',
    '.msqrt{white-space:nowrap}',
    '.msqrt>.mrad:last-child{border-top:1px solid currentColor;padding:0 2px;margin-left:-1px}',
    '.mtext{font-family:inherit;font-style:normal}',
    '.unit{white-space:nowrap}'
  ].join('');
  document.head.appendChild(style);

  /* ─── Единицы измерения ─────────────────────────────────────────────
     Внутри всё хранится в СИ. disp(value, dim) возвращает {v, unit} —
     значение и единицу, уместные для текущего режима отображения.      */
  var DIMS = {
    length:      { si: 'м',    ru: 'м',      f: 1,    alt: [{ u: 'мм', f: 1e3 }, { u: 'см', f: 100 }, { u: 'км', f: 1e-3 }] },
    area:        { si: 'м²',   ru: 'м²',     f: 1,    alt: [{ u: 'см²', f: 1e4 }, { u: 'мм²', f: 1e6 }] },
    volume:      { si: 'м³',   ru: 'м³',     f: 1,    alt: [{ u: 'л', f: 1e3 }, { u: 'см³', f: 1e6 }] },
    volumeMl:    { si: 'л',    ru: 'л',      f: 1e3,  alt: [{ u: 'мл', f: 1e6 }] },
    mass:        { si: 'кг',   ru: 'кг',     f: 1,    alt: [{ u: 'г', f: 1e3 }, { u: 'т', f: 1e-3 }] },
    molarMass:   { si: 'кг/моль', ru: 'кг/моль', f: 1, alt: [{ u: 'г/моль', f: 1e3 }] },
    time:        { si: 'с',    ru: 'с',      f: 1,    alt: [{ u: 'мин', f: 1 / 60 }, { u: 'ч', f: 1 / 3600 }] },
    speed:       { si: 'м/с',  ru: 'м/с',    f: 1,    alt: [{ u: 'км/ч', f: 3.6 }] },
    acc:         { si: 'м/с²', ru: 'м/с²',   f: 1 },
    momentum:    { si: 'кг·м/с', ru: 'кг·м/с', f: 1 },
    force:       { si: 'Н',    ru: 'Н',      f: 1,    alt: [{ u: 'кН', f: 1e-3 }, { u: 'мН', f: 1e3 }] },
    pressure:    { si: 'Па',   ru: 'Па',     f: 1,    alt: [{ u: 'кПа', f: 1e-3 }, { u: 'МПа', f: 1e-6 }] },
    atm:         { si: 'атм',  ru: 'атм',    f: 1 / 101325 },
    energy:      { si: 'Дж',   ru: 'Дж',     f: 1,    alt: [{ u: 'кДж', f: 1e-3 }, { u: 'МДж', f: 1e-6 }] },
    power:       { si: 'Вт',   ru: 'Вт',     f: 1,    alt: [{ u: 'кВт', f: 1e-3 }, { u: 'МВт', f: 1e-6 }] },
    temp:        { si: 'К',    ru: 'К',      f: 1,    alt: [{ u: '°C', f: 1, c: -273.15 }] },
    temperature: { si: 'К',    ru: 'К',      f: 1,    alt: [{ u: '°C', f: 1, c: -273.15 }] },
    dT:          { si: 'К',    ru: 'К',      f: 1 },
    freq:        { si: 'Гц',   ru: 'Гц',     f: 1,    alt: [{ u: 'кГц', f: 1e-3 }, { u: 'МГц', f: 1e-6 }] },
    period:      { si: 'с',    ru: 'с',      f: 1,    alt: [{ u: 'мкс', f: 1e6 }, { u: 'нс', f: 1e9 }] },
    current:     { si: 'А',    ru: 'А',      f: 1,    alt: [{ u: 'мА', f: 1e3 }] },
    voltage:     { si: 'В',    ru: 'В',      f: 1,    alt: [{ u: 'мВ', f: 1e3 }, { u: 'кВ', f: 1e-3 }] },
    resistance:  { si: 'Ом',   ru: 'Ом',     f: 1,    alt: [{ u: 'кОм', f: 1e-3 }, { u: 'МОм', f: 1e-6 }] },
    resistivity: { si: 'Ом·м', ru: 'Ом·м',   f: 1 },
    cap:         { si: 'Ф',    ru: 'Ф',      f: 1,    alt: [{ u: 'мкФ', f: 1e6 }, { u: 'нФ', f: 1e9 }, { u: 'пФ', f: 1e12 }] },
    charge:      { si: 'Кл',   ru: 'Кл',     f: 1 },
    density:     { si: 'кг/м³', ru: 'кг/м³', f: 1,   alt: [{ u: 'г/см³', f: 1e-3 }, { u: 'г/л', f: 1 }] },
    heatcap:     { si: 'Дж/(кг·К)', ru: 'Дж/(кг·К)', f: 1 },
    entropy:     { si: 'Дж/К', ru: 'Дж/К',   f: 1 },
    specificHeat:{ si: 'Дж/кг', ru: 'Дж/кг', f: 1,   alt: [{ u: 'кДж/кг', f: 1e-3 }] },
    k:           { si: 'Н/м',  ru: 'Н/м',    f: 1 },
    moment:      { si: 'Н·м',  ru: 'Н·м',    f: 1 },
    angle:       { si: 'рад',  ru: 'рад',    f: 1,   alt: [{ u: '°', f: 180 / Math.PI }] },
    amount:      { si: 'моль', ru: 'моль',   f: 1,   alt: [{ u: 'ммоль', f: 1e3 }] },
    conc:        { si: 'моль/л', ru: 'моль/л', f: 1, alt: [{ u: 'ммоль/л', f: 1e3 }] },
    molality:    { si: 'моль/кг', ru: 'моль/кг', f: 1 },
    molarVol:    { si: 'м³/моль', ru: 'м³/моль', f: 1, alt: [{ u: 'л/моль', f: 1e3 }] },
    percent:     { si: '%',    ru: '%',      f: 100 },
    count:       { si: '',     ru: '',       f: 1 },
    plain:       { si: '',     ru: '',       f: 1 }
  };

  var mode = 'auto';   // 'auto' — самая удобная единица; 'si' — только СИ
  var system = 'si';   // 'si' | 'ru' (пока совпадают)

  function pick(dim, v) {
    if (!dim.alt || mode === 'si') return dim.f;
    var a = Math.abs(v * dim.f);
    if (a === 0 || !isFinite(a)) return dim.f;
    var best = dim.f, bestScore = Infinity;
    var cands = [dim.f].concat(dim.alt.map(function (x) { return x.f; }));
    for (var i = 0; i < cands.length; i++) {
      var d = Math.abs(Math.log10(a * cands[i]));
      var score = d > 1 ? d + 1 : d * 0.25;   // штраф за 0,00… и за большие числа
      if (score < bestScore) { bestScore = score; best = cands[i]; }
    }
    return best;
  }

  function disp(value, key) {
    var dim = DIMS[key];
    if (!dim) return { v: value, unit: '' };
    if (!isFinite(value)) return { v: value, unit: dim[system] };
    var f = pick(dim, value);
    var unit = dim[system];
    if (dim.alt) {
      for (var i = 0; i < dim.alt.length; i++) {
        if (dim.alt[i].f === f) { unit = dim.alt[i].u; break; }
      }
    }
    var v = value * f;
    var alt = dim.alt;
    if (alt) {
      for (var j = 0; j < alt.length; j++) {
        if (alt[j].f === f && alt[j].c) { v = value * alt[j].f + alt[j].c; break; }
      }
    }
    return { v: v, unit: unit };
  }

  /* Значение + единица одной строкой: "44,1 Вт" */
  function split(value, key, sig) {
    var d = disp(value, key);
    return num(d.v, sig) + (d.unit ? '\u2009' + d.unit : '');
  }

  function unit(value, key, sig) { return split(value, key, sig); }

  function setMode(m) { mode = m; }
  function getMode() { return mode; }
  function setSystem(s) { system = s === 'ru' ? 'ru' : 'si'; }

  /* Значение, введённое пользователем в отображаемой единице → СИ. */
  function toSI(value, key) {
    var dim = DIMS[key];
    if (!dim) return value;
    var f = pick(dim, value);
    var conv = f;
    if (dim.alt) {
      for (var i = 0; i < dim.alt.length; i++) {
        if (dim.alt[i].f === f && dim.alt[i].c) { conv = f; return (value - dim.alt[i].c) / f; }
      }
    }
    return value / conv;
  }

  global.Fmt = {
    num: num, math: math, split: split, unit: unit, disp: disp,
    toSI: toSI, setMode: setMode, mode: getMode, setSystem: setSystem,
    DIMS: DIMS, esc: esc, thinGroup: thinGroup, supers: supers
  };
})(window);

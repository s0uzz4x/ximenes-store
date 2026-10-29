/* Funções de apoio usadas pela vitrine e pelo painel. */
(function () {
  'use strict';
  var L = window.Loja = window.Loja || {};

  L.reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  L.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  L.money = function (n) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n || 0);
  };

  L.uid = function () {
    return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
  };

  L.clone = function (o) { return JSON.parse(JSON.stringify(o)); };

  L.hue = function (s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  };

  /* Só os dígitos do número; acrescenta 55 (Brasil) quando vier sem o código do país. */
  L.waNumber = function (v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d && d.length <= 11) d = '55' + d;
    return d;
  };

  L.fmtPhone = function (v) {
    var d = String(v || '').replace(/\D/g, '');
    if (d.length > 11 && d.indexOf('55') === 0) d = d.slice(2);
    if (d.length === 11) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    if (d.length === 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
    return d;
  };

  L.parsePrice = function (v) {
    var s = String(v || '').trim().replace(/[^\d.,]/g, '');
    if (!s) return NaN;
    if (s.indexOf(',') > -1) s = s.replace(/\./g, '').replace(',', '.');
    return parseFloat(s);
  };

  L.toast = function (msg) {
    var box = document.getElementById('toast-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast-box';
      box.className = 'toast-box';
      document.body.appendChild(box);
    }
    var d = document.createElement('div');
    d.className = 'toast';
    d.setAttribute('role', 'status');
    d.textContent = msg;
    box.appendChild(d);
    setTimeout(function () { d.remove(); }, 2800);
  };
})();

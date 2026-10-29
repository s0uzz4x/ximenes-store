/* Vitrine, produto, sacola e pedido pelo WhatsApp. */
(function () {
  'use strict';
  var L = window.Loja, esc = L.esc, money = L.money;

  /* ---------- Dados ---------- */
  var D = window.LOJA_DADOS || {};
  var store = {
    settings: Object.assign({ name: 'Ximenes Store', tagline: 'Roupas para o dia a dia', whatsapp: '', instagram: '', logo: '' }, D.settings || {}),
    products: Array.isArray(D.products) ? D.products : []
  };
  L.getStore = function () { return store; };
  L.setStore = function (s) { store = s; };

  var ui = L.ui = {
    cat: 'Todos', q: '', openId: null, imgIdx: 0, size: null, qty: 1, sizeErr: false,
    cart: false, cust: '', obs: '', enter: false, noKeep: false,
    canAdmin: false, admin: false, tab: 'produtos', draft: null, dirty: false,
    form: null, delId: null, confirmExit: false, formErr: ''
  };
  var A = L.actions = {};

  var cart = [];
  try { cart = JSON.parse(localStorage.getItem('ximenes-cart') || '[]'); } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];

  function prod(id) { return store.products.find(function (p) { return p.id === id; }); }
  function saveCart() { try { localStorage.setItem('ximenes-cart', JSON.stringify(cart)); } catch (e) {} }
  function cartLines() {
    return cart.map(function (l) { return { pid: l.pid, size: l.size, qty: l.qty, p: prod(l.pid) }; })
      .filter(function (l) { return l.p; });
  }
  function cartCount() { return cartLines().reduce(function (a, l) { return a + l.qty; }, 0); }
  function cartTotal() { return cartLines().reduce(function (a, l) { return a + l.qty * l.p.price; }, 0); }
  function cats() {
    var s = [];
    store.products.forEach(function (p) { if (p.category && s.indexOf(p.category) < 0) s.push(p.category); });
    return s;
  }
  L.prod = prod;

  /* ---------- Imagens ---------- */
  var SHIRT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" aria-hidden="true"><path d="M8 3 3 6l2 4 3-1v12h8V9l3 1 2-4-5-3a4 4 0 0 1-8 0z"/></svg>';
  var WA_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"/><circle cx="8" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="11" r="1" fill="currentColor" stroke="none"/><circle cx="16" cy="11" r="1" fill="currentColor" stroke="none"/></svg>';
  function ph(p) { return '<span class="ph" style="--h:' + L.hue(p.name || 'x') + '">' + SHIRT + '</span>'; }
  function cover(p) {
    return (p.images && p.images[0])
      ? '<img src="' + p.images[0] + '" alt="' + esc(p.name) + '" loading="lazy" decoding="async">'
      : ph(p);
  }
  L.ph = ph;

  /* ---------- Estrutura da página ---------- */
  var root = L.root = document.getElementById('root');
  root.innerHTML = '<div id="page"></div><div id="layer"></div><div id="toast-box" class="toast-box"></div>';
  var elPage = document.getElementById('page'), elLayer = document.getElementById('layer');

  function renderPage() {
    var s = store.settings, wn = L.waNumber(s.whatsapp), h = '';
    if (io) io.disconnect();

    h += '<div class="progress" id="progress"></div>';
    h += '<header class="top" id="top"><div class="wrap"><div class="brand">' +
      (s.logo ? '<img class="logo" src="' + esc(s.logo) + '" alt="">' : '') +
      '<span>' + esc(s.name) + '</span></div><div class="top-actions">' +
      (ui.canAdmin ? '<button class="btn sm" data-act="admin-open">Painel da loja</button>' : '') +
      '<button class="btn primary" data-act="cart-open" aria-label="Abrir sacola">Sacola <span class="count" id="badge">' + cartCount() + '</span></button></div></div></header>';

    h += '<main id="main"><section class="hero-wrap"><div class="hero-glow" aria-hidden="true"></div><div class="wrap hero">';
    h += '<div class="hero-t"><span class="rule"></span>' +
      '<h1 class="rise" style="--d:120ms">' + esc(s.tagline || s.name) + '</h1>' +
      '<ol class="steps rise" style="--d:260ms"><li>Escolha as peças e o tamanho</li><li>Monte o pedido na sacola</li><li>Envie pelo WhatsApp e combine o pagamento</li></ol>' +
      '<div class="cta rise" style="--d:400ms"><a class="btn primary" href="#vitrine">Ver as peças</a>' +
      (wn ? '<a class="btn" href="https://wa.me/' + wn + '" target="_blank" rel="noopener">Falar no WhatsApp</a>' : '') + '</div></div>';
    if (s.logo) h += '<div class="hero-logo rise" id="hero-logo" style="--d:300ms"><img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '"></div>';
    h += '</div></section>';

    var items = ['Escolha online', 'Pedido pelo WhatsApp', 'Atendimento direto com a loja', 'Peças para o dia a dia'];
    var grp = '<div class="marquee-group">' + items.map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('') + '</div>';
    h += '<div class="marquee" aria-hidden="true"><div class="marquee-track">' + grp + grp + grp + grp + '</div></div>';

    h += '<section id="vitrine"><div class="wrap"><div class="sec-h reveal"><h2 class="sec-t">Vitrine</h2><span class="sec-n" id="count"></span></div>';
    h += '<div class="filters reveal"><div class="chips" id="chips" role="group" aria-label="Categorias"></div>' +
      '<input class="search" id="q" type="search" placeholder="Buscar peça" aria-label="Buscar peça" value="' + esc(ui.q) + '"></div>';
    h += '<div id="grid-box"></div></div></section></main>';

    h += '<footer class="foot"><div class="wrap">';
    h += '<div class="foot-top reveal">' + (s.logo ? '<img class="logo lg" src="' + esc(s.logo) + '" alt="' + esc(s.name) + '">' : '') +
      '<div><b>' + esc(s.name) + '</b><div>Pedidos pelo WhatsApp' + (s.whatsapp ? ' · ' + esc(L.fmtPhone(s.whatsapp)) : '') + '</div></div></div>';
    if (wn || s.instagram) {
      h += '<div class="contact reveal">';
      if (wn) h += '<a class="btn ok sm" href="https://wa.me/' + wn + '" target="_blank" rel="noopener">WhatsApp ' + esc(L.fmtPhone(s.whatsapp)) + '</a>';
      if (s.instagram) h += '<a class="btn sm" href="' + esc(s.instagram) + '" target="_blank" rel="noopener">Instagram @ximenes_store_</a>';
      h += '</div>';
    }
    h += '<div class="reveal">Esta página não processa pagamentos. Forma de pagamento, entrega e prazo são combinados direto com a loja na conversa.</div></div></footer>';

    if (wn) h += '<a class="fab" href="https://wa.me/' + wn + '?text=' + encodeURIComponent('Olá! Vim pelo site da ' + s.name + '.') + '" target="_blank" rel="noopener" aria-label="Conversar no WhatsApp">' + WA_ICON + '</a>';

    elPage.innerHTML = h;
    renderChips();
    renderGrid();
    revealAll();
    onScroll();
  }

  function renderChips() {
    var box = document.getElementById('chips');
    if (!box) return;
    var cs = cats();
    if (ui.cat !== 'Todos' && cs.indexOf(ui.cat) < 0) ui.cat = 'Todos';
    box.innerHTML = ['Todos'].concat(cs).map(function (c) {
      return '<button class="chip" data-act="cat" data-v="' + esc(c) + '" aria-pressed="' + (ui.cat === c) + '">' + esc(c) + '</button>';
    }).join('');
  }

  function filtered() {
    var q = ui.q.trim().toLowerCase();
    return store.products.filter(function (p) {
      if (ui.cat !== 'Todos' && p.category !== ui.cat) return false;
      if (q) return (p.name + ' ' + (p.category || '')).toLowerCase().indexOf(q) > -1;
      return true;
    });
  }

  function renderGrid() {
    var box = document.getElementById('grid-box');
    if (!box) return;
    var list = filtered(), h = '';
    if (!list.length) {
      h = '<div class="empty"><strong>' + (store.products.length ? 'Nada encontrado' : 'Novidades chegando') + '</strong>' +
        (store.products.length ? 'Tente outra categoria ou outro termo de busca.' : 'Os produtos da loja aparecem aqui assim que forem cadastrados.') + '</div>';
    } else {
      h = '<div class="grid">';
      list.forEach(function (p, i) {
        var imgs = p.images || [], sz = (p.sizes || []).join(' · ');
        h += '<button class="card reveal" data-act="open" data-id="' + esc(p.id) + '" style="--d:' + ((i % 4) * 80) + 'ms">' +
          '<span class="media">' + cover(p) +
          (imgs[1] ? '<img class="alt" src="' + imgs[1] + '" alt="" loading="lazy" decoding="async">' : '') +
          (p.soldOut ? '<span class="tag">Esgotado</span>' : '') + (p.demo ? '<span class="tag alt">Exemplo</span>' : '') +
          '<span class="peek">Ver peça</span></span>' +
          '<span class="info"><span class="name">' + esc(p.name) + '</span><span class="price">' + money(p.price) + '</span>' +
          (sz ? '<span class="sz">' + esc(sz) + '</span>' : '') + '</span></button>';
      });
      h += '</div>';
    }
    box.innerHTML = h;
    var c = document.getElementById('count');
    if (c) c.textContent = store.products.length ? list.length + (list.length === 1 ? ' peça' : ' peças') : '';
    revealAll();
  }

  /* ---------- Efeitos: entrada ao rolar, barra de progresso, paralaxe ---------- */
  var io = null;
  function revealAll() {
    var els = [].slice.call(document.querySelectorAll('.reveal:not(.shown)'));
    if (!('IntersectionObserver' in window) || L.reduceMotion) {
      els.forEach(function (el) { el.classList.add('shown'); });
      return;
    }
    if (!io) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    }
    els.forEach(function (el) { io.observe(el); });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var y = window.scrollY || 0;
      var top = document.getElementById('top'), pg = document.getElementById('progress'), hl = document.getElementById('hero-logo');
      if (top) top.classList.toggle('scrolled', y > 8);
      if (pg) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        pg.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, y / max) : 0) + ')';
      }
      if (hl && !L.reduceMotion && y < 900) hl.style.setProperty('--py', (y * 0.12).toFixed(1) + 'px');
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);

  function bump() {
    var b = document.getElementById('badge');
    if (!b) return;
    b.classList.remove('bump');
    void b.offsetWidth;
    b.classList.add('bump');
  }
  function updateBadge() {
    var b = document.getElementById('badge');
    if (b) b.textContent = cartCount();
  }
  /* A foto "voa" do produto até o botão da sacola. */
  function fly() {
    if (L.reduceMotion || !document.body.animate) { bump(); return; }
    var src = document.querySelector('.sheet .big img'), dst = document.querySelector('.top .btn.primary');
    if (!src || !dst) { bump(); return; }
    var a = src.getBoundingClientRect(), b = dst.getBoundingClientRect();
    var g = document.createElement('img');
    g.src = src.src; g.alt = ''; g.className = 'fly';
    g.style.cssText = 'left:' + a.left + 'px;top:' + a.top + 'px;width:' + a.width + 'px;height:' + a.height + 'px';
    document.body.appendChild(g);
    var dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    var an = g.animate(
      [{ transform: 'translate(0,0) scale(1)', opacity: 0.95 }, { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.05)', opacity: 0.2 }],
      { duration: 650, easing: 'cubic-bezier(.5,0,.8,.4)' }
    );
    an.onfinish = function () { g.remove(); bump(); };
  }

  /* ---------- Produto ---------- */
  function productModal(enter) {
    var p = prod(ui.openId);
    if (!p) { ui.openId = null; return ''; }
    var imgs = p.images || [], cur = imgs[ui.imgIdx] || imgs[0];
    var h = '<div class="scrim' + (enter ? ' enter' : '') + '" data-act="scrim"><div class="sheet" role="dialog" aria-modal="true" aria-label="' + esc(p.name) + '" tabindex="-1" id="focus-me">';
    h += '<button class="x" data-act="close-modal" aria-label="Fechar">×</button><div class="pm-media"><div class="big">' + (cur ? '<img src="' + cur + '" alt="' + esc(p.name) + '">' : ph(p)) + '</div>';
    if (imgs.length > 1) {
      h += '<div class="thumbs">';
      imgs.forEach(function (s, i) { h += '<button class="th' + (i === ui.imgIdx ? ' on' : '') + '" data-act="img" data-i="' + i + '" aria-label="Foto ' + (i + 1) + '"><img src="' + s + '" alt=""></button>'; });
      h += '</div>';
    }
    h += '</div><div class="pm-body"><div><div class="sz" style="margin-bottom:4px">' + esc(p.category || '') + '</div><h2>' + esc(p.name) + '</h2></div><div class="price pm-price">' + money(p.price) + '</div>';
    if (p.desc) h += '<p>' + esc(p.desc) + '</p>';
    if (p.soldOut) {
      h += '<p class="warn" style="padding-bottom:24px">Esta peça está esgotada no momento.</p>';
    } else {
      if ((p.sizes || []).length) {
        h += '<div><div class="lbl">Tamanho</div><div class="sizes">';
        p.sizes.forEach(function (s) { h += '<button class="size" data-act="size" data-v="' + esc(s) + '" aria-pressed="' + (ui.size === s) + '">' + esc(s) + '</button>'; });
        h += '</div>' + (ui.sizeErr ? '<p class="warn" style="margin-top:8px">Escolha um tamanho para continuar.</p>' : '') + '</div>';
      }
      h += '<div class="pm-actions"><div class="row" style="justify-content:space-between"><div class="lbl" style="margin:0">Quantidade</div><div class="qty"><button data-act="mq-dec" aria-label="Diminuir">−</button><span>' + ui.qty + '</span><button data-act="mq-inc" aria-label="Aumentar">+</button></div></div>';
      h += '<button class="btn primary" data-act="add">Adicionar à sacola · ' + money(p.price * ui.qty) + '</button></div>';
    }
    h += '</div></div></div>';
    return h;
  }

  /* ---------- Sacola e WhatsApp ---------- */
  function waText() {
    var ls = cartLines(), t = 'Olá! Quero fazer um pedido na ' + store.settings.name + ':\n\n';
    ls.forEach(function (l) { t += '• ' + l.qty + 'x ' + l.p.name + (l.size ? ' (' + l.size + ')' : '') + ' — ' + money(l.p.price * l.qty) + '\n'; });
    t += '\nTotal: ' + money(cartTotal());
    if (ui.cust.trim()) t += '\n\nNome: ' + ui.cust.trim();
    if (ui.obs.trim()) t += '\nObservações: ' + ui.obs.trim();
    return t;
  }
  function waLink() { return 'https://wa.me/' + L.waNumber(store.settings.whatsapp) + '?text=' + encodeURIComponent(waText()); }

  function cartPanel(enter) {
    var ls = cartLines(), has = ls.length > 0, num = L.waNumber(store.settings.whatsapp);
    var h = '<div class="scrim right' + (enter ? ' enter' : '') + '" data-act="scrim"><div class="cart" role="dialog" aria-modal="true" aria-label="Sacola" tabindex="-1" id="focus-me">';
    h += '<div class="cart-h"><h2>Sua sacola</h2><button class="x" data-act="close-cart" aria-label="Fechar">×</button></div><div class="cart-b">';
    if (!has) h += '<p class="note" style="padding:24px 0">A sacola está vazia. Escolha uma peça na vitrine para começar o pedido.</p>';
    ls.forEach(function (l) {
      var k = l.pid + '|' + (l.size || '');
      h += '<div class="line"><div class="t">' + ((l.p.images && l.p.images[0]) ? '<img src="' + l.p.images[0] + '" alt="">' : ph(l.p)) + '</div><div class="m"><b>' + esc(l.p.name) + '</b><span class="sz">' + (l.size ? 'Tamanho ' + esc(l.size) + ' · ' : '') + money(l.p.price) + '</span>';
      h += '<div class="row" style="justify-content:space-between"><div class="qty"><button data-act="c-dec" data-k="' + esc(k) + '" aria-label="Diminuir">−</button><span>' + l.qty + '</span><button data-act="c-inc" data-k="' + esc(k) + '" aria-label="Aumentar">+</button></div><b class="price">' + money(l.p.price * l.qty) + '</b></div>';
      h += '<button class="link" data-act="c-rm" data-k="' + esc(k) + '" style="justify-self:start">Remover</button></div></div>';
    });
    h += '</div><div class="cart-f">';
    if (has) {
      h += '<div class="total"><span>Total</span><b>' + money(cartTotal()) + '</b></div>';
      h += '<div class="field"><label for="cust">Seu nome (opcional)</label><input class="in" id="cust" value="' + esc(ui.cust) + '" autocomplete="name"></div>';
      h += '<div class="field"><label for="obs">Observações (opcional)</label><input class="in" id="obs" value="' + esc(ui.obs) + '" placeholder="Endereço, cor, retirada na loja…"></div>';
      if (num) {
        h += '<a class="btn ok" id="wa-send" href="' + esc(waLink()) + '" target="_blank" rel="noopener">Enviar pedido pelo WhatsApp</a>';
        h += '<button class="btn sm" data-act="copy">Copiar mensagem do pedido</button>';
        h += '<p class="note">O WhatsApp abre com a mensagem pronta. Confira e toque em enviar por lá. Conversa com ' + esc(L.fmtPhone(num)) + '.</p>';
      } else {
        h += '<p class="warn">O número de WhatsApp da loja ainda não foi cadastrado. Use o botão abaixo para copiar o pedido e enviar manualmente.</p><button class="btn sm" data-act="copy">Copiar mensagem do pedido</button>';
      }
      h += '<button class="link" data-act="c-clear" style="justify-self:center">Esvaziar sacola</button>';
    }
    h += '</div></div></div>';
    return h;
  }

  /* ---------- Camadas ---------- */
  function renderLayer(focus) {
    var keep = {};
    if (!ui.noKeep) {
      ['.sheet', '.cart-b', '.admin-b'].forEach(function (sel) {
        var e = elLayer.querySelector(sel);
        if (e) keep[sel] = e.scrollTop;
      });
    }
    ui.noKeep = false;
    var enter = ui.enter; ui.enter = false;
    var h = '';
    if (ui.openId) h += productModal(enter);
    if (ui.cart) h += cartPanel(enter);
    if (ui.admin && ui.draft && L.adminPanel) h += L.adminPanel(enter);
    elLayer.innerHTML = h;
    Object.keys(keep).forEach(function (sel) {
      var e = elLayer.querySelector(sel);
      if (e) e.scrollTop = keep[sel];
    });
    document.body.classList.toggle('lock', !!(ui.openId || ui.cart || ui.admin));
    if (focus) { var f = document.getElementById('focus-me'); if (f) f.focus(); }
  }
  L.renderLayer = renderLayer;
  L.renderPage = renderPage;

  /* ---------- Ações ---------- */
  A.cat = function (el) {
    ui.cat = el.dataset.v;
    renderChips();
    var g = document.getElementById('grid-box');
    renderGrid();
    if (g && g.getBoundingClientRect().top < 0) document.getElementById('vitrine').scrollIntoView();
  };
  A.open = function (el) {
    ui.openId = el.dataset.id; ui.imgIdx = 0; ui.qty = 1; ui.sizeErr = false; ui.enter = true;
    var p = prod(ui.openId);
    ui.size = (p && (p.sizes || []).length === 1) ? p.sizes[0] : null;
    renderLayer(true);
  };
  A.scrim = function () { ui.openId = null; ui.cart = false; renderLayer(); };
  A['close-modal'] = function () { ui.openId = null; renderLayer(); };
  A['close-cart'] = function () { ui.cart = false; renderLayer(); };
  A.img = function (el) { ui.imgIdx = +el.dataset.i; renderLayer(); };
  A.size = function (el) { ui.size = el.dataset.v; ui.sizeErr = false; renderLayer(); };
  A['mq-dec'] = function () { ui.qty = Math.max(1, ui.qty - 1); renderLayer(); };
  A['mq-inc'] = function () { ui.qty = Math.min(20, ui.qty + 1); renderLayer(); };
  A.add = function () {
    var q = prod(ui.openId);
    if (!q) return;
    if ((q.sizes || []).length && !ui.size) { ui.sizeErr = true; renderLayer(); return; }
    var sz = ui.size || '', ex = cart.find(function (l) { return l.pid === q.id && (l.size || '') === sz; });
    if (ex) ex.qty = Math.min(20, ex.qty + ui.qty); else cart.push({ pid: q.id, size: sz, qty: ui.qty });
    saveCart();
    updateBadge();
    fly();
    ui.openId = null;
    renderLayer();
    L.toast('Adicionado à sacola');
  };
  A['cart-open'] = function () { ui.cart = true; ui.enter = true; renderLayer(true); };
  function cartChange(el, mode) {
    var parts = el.dataset.k.split('|'), pid = parts[0], size = parts.slice(1).join('|');
    var i = cart.findIndex(function (l) { return l.pid === pid && (l.size || '') === size; });
    if (i < 0) return;
    if (mode === 'inc') cart[i].qty = Math.min(20, cart[i].qty + 1);
    else if (mode === 'dec') { cart[i].qty -= 1; if (cart[i].qty < 1) cart.splice(i, 1); }
    else cart.splice(i, 1);
    saveCart(); renderLayer(); updateBadge();
  }
  A['c-inc'] = function (el) { cartChange(el, 'inc'); };
  A['c-dec'] = function (el) { cartChange(el, 'dec'); };
  A['c-rm'] = function (el) { cartChange(el, 'rm'); };
  A['c-clear'] = function () { cart = []; saveCart(); renderLayer(); updateBadge(); };
  A.copy = function () {
    var t = waText();
    var fb = function () { L.toast('Selecione e copie a mensagem manualmente'); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(function () { L.toast('Mensagem copiada'); }, fb); else fb();
  };

  /* ---------- Eventos ---------- */
  root.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    if (el.dataset.act === 'scrim' && e.target !== el) return;
    var fn = A[el.dataset.act];
    if (fn) fn(el, e);
  });
  root.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'q') { ui.q = t.value; renderGrid(); return; }
    if (t.id === 'cust' || t.id === 'obs') {
      if (t.id === 'cust') ui.cust = t.value; else ui.obs = t.value;
      var a = document.getElementById('wa-send');
      if (a) a.href = waLink();
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || ui.admin) return;
    if (ui.openId) { ui.openId = null; renderLayer(); }
    else if (ui.cart) { ui.cart = false; renderLayer(); }
  });

  /* Deslizar a foto do produto no celular */
  var tx = null;
  root.addEventListener('touchstart', function (e) {
    tx = (e.target.closest('.big') && e.touches.length === 1) ? e.touches[0].clientX : null;
  }, { passive: true });
  root.addEventListener('touchend', function (e) {
    if (tx == null) return;
    var dx = e.changedTouches[0].clientX - tx; tx = null;
    var p = prod(ui.openId);
    if (!p || !p.images || p.images.length < 2 || Math.abs(dx) < 50) return;
    ui.imgIdx = (ui.imgIdx + (dx < 0 ? 1 : p.images.length - 1)) % p.images.length;
    renderLayer();
  }, { passive: true });

  /* Painel: abre quando o endereço termina em #admin */
  function enterAdmin() {
    if (location.hash === '#admin' && !ui.admin && L.openAdmin) {
      ui.canAdmin = true;
      renderPage();
      L.openAdmin();
    }
  }
  window.addEventListener('hashchange', enterAdmin);
  window.addEventListener('beforeunload', function (e) { if (ui.dirty) { e.preventDefault(); e.returnValue = ''; } });

  L.start = function () { renderPage(); renderLayer(); enterAdmin(); };
})();

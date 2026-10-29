/* Painel da loja: cadastrar, editar e remover produtos, e baixar os dados atualizados.
   Acesso: abrir o site com #admin no final do endereço. */
(function () {
  'use strict';
  var L = window.Loja, esc = L.esc, money = L.money, ui = L.ui, A = L.actions, clone = L.clone;
  var PRESETS = ['PP', 'P', 'M', 'G', 'GG', 'XG', '34', '36', '38', '40', '42', '44', 'Único'];

  function totalBytes() {
    var n = 0;
    (ui.draft ? ui.draft.products : []).forEach(function (p) { (p.images || []).forEach(function (i) { n += i.length; }); });
    if (ui.form) (ui.form.images || []).forEach(function (i) { n += i.length; });
    return n;
  }

  function barHtml() {
    var h = '<div class="wrap"><div class="st">';
    if (ui.confirmExit) h += '<b>Sair sem baixar?</b> As alterações feitas aqui serão perdidas.';
    else if (ui.dirty) h += '<b>Alterações ainda não estão no site.</b> Baixe os dados atualizados e envie o arquivo para a pasta js da hospedagem.';
    else h += 'Sem alterações. Adicione ou remova produtos e depois baixe os dados atualizados.';
    h += '</div><div class="row">';
    if (ui.confirmExit) {
      h += '<button class="btn sm" data-act="exit-back">Voltar</button><button class="btn sm danger" data-act="exit-now">Sair sem baixar</button>';
    } else {
      h += '<button class="btn sm" data-act="discard"' + (ui.dirty ? '' : ' disabled') + '>Descartar</button>' +
        '<button class="btn primary sm" data-act="publish"' + (ui.dirty && !ui.form ? '' : ' disabled') + '>Baixar dados atualizados</button>';
    }
    h += '</div></div>';
    return h;
  }
  function renderBar() { var b = document.getElementById('pubbar'); if (b) b.innerHTML = barHtml(); }
  function markDirty() { ui.dirty = true; ui.confirmExit = false; renderBar(); }

  function formHtml() {
    var f = ui.form, sizes = f.sizes || [], all = PRESETS.concat(sizes.filter(function (s) { return PRESETS.indexOf(s) < 0; }));
    var cl = [];
    ui.draft.products.forEach(function (p) { if (p.category && cl.indexOf(p.category) < 0) cl.push(p.category); });
    var h = '<div class="form"><h3>' + (f.isNew ? 'Novo produto' : 'Editar produto') + '</h3>';
    h += '<div class="cols"><div class="field"><label for="f-name">Nome do produto</label><input class="in" id="f-name" data-bind="name" value="' + esc(f.name) + '" maxlength="80"></div>';
    h += '<div class="field"><label for="f-price">Preço (R$)</label><input class="in" id="f-price" data-bind="price" inputmode="decimal" placeholder="89,90" value="' + esc(f.price) + '"></div></div>';
    h += '<div class="field"><label for="f-cat">Categoria</label><input class="in" id="f-cat" data-bind="category" list="f-cats" placeholder="Ex.: Camisetas" value="' + esc(f.category) + '" maxlength="40"><datalist id="f-cats">' + cl.map(function (c) { return '<option value="' + esc(c) + '">'; }).join('') + '</datalist></div>';
    h += '<div><div class="lbl">Tamanhos disponíveis</div><div class="sizes">';
    all.forEach(function (s) { h += '<button class="size" type="button" data-act="f-size" data-v="' + esc(s) + '" aria-pressed="' + (sizes.indexOf(s) > -1) + '">' + esc(s) + '</button>'; });
    h += '</div><div class="row" style="margin-top:10px"><input class="in" id="f-size-x" placeholder="Outro tamanho" style="max-width:180px" aria-label="Outro tamanho"><button class="btn sm" type="button" data-act="f-size-add">Adicionar</button></div></div>';
    h += '<div class="field"><label for="f-desc">Descrição</label><textarea class="in" id="f-desc" data-bind="desc" maxlength="600">' + esc(f.desc) + '</textarea></div>';
    h += '<div><div class="lbl">Fotos (a primeira é a capa)</div><div class="pics">';
    (f.images || []).forEach(function (s, i) {
      h += '<div class="pic"><img src="' + s + '" alt="Foto ' + (i + 1) + '"><button class="rm" type="button" data-act="f-img-rm" data-i="' + i + '" aria-label="Remover foto ' + (i + 1) + '">×</button>' + (i > 0 ? '<button class="cv" type="button" data-act="f-img-cover" data-i="' + i + '">Tornar capa</button>' : '') + '</div>';
    });
    if ((f.images || []).length < 5) h += '<label class="add-pic">+ Foto<input type="file" id="f-files" accept="image/*" multiple></label>';
    h += '</div><p class="note" style="margin-top:8px">Até 5 fotos por produto. As imagens são reduzidas automaticamente para carregar rápido.</p></div>';
    h += '<label class="check"><input type="checkbox" id="f-sold" data-bind="soldOut"' + (f.soldOut ? ' checked' : '') + '> Marcar como esgotado</label>';
    if (ui.formErr) h += '<p class="warn">' + esc(ui.formErr) + '</p>';
    h += '<div class="row"><button class="btn primary" type="button" data-act="f-save">Salvar produto</button><button class="btn" type="button" data-act="f-cancel">Cancelar</button></div></div>';
    return h;
  }

  function adminBody() {
    var d = ui.draft, h = '';
    if (ui.tab === 'loja') {
      var wnum = L.fmtPhone(d.settings.whatsapp);
      h += '<div class="form"><h3>Dados da loja</h3>';
      h += '<div class="field"><label for="s-name">Nome da loja</label><input class="in" id="s-name" data-set="name" value="' + esc(d.settings.name) + '" maxlength="40"></div>';
      h += '<div class="field"><label for="s-tag">Frase de destaque na página inicial</label><input class="in" id="s-tag" data-set="tagline" value="' + esc(d.settings.tagline) + '" maxlength="60"></div>';
      h += '<div class="field"><label for="s-wa">WhatsApp da loja (com DDD)</label><input class="in" id="s-wa" data-set="whatsapp" inputmode="tel" placeholder="11 91234-5678" value="' + esc(d.settings.whatsapp) + '"><p class="note" id="s-wa-note">' + (wnum ? 'Os pedidos chegam em: ' + esc(wnum) : 'Sem este número, o botão de enviar pelo WhatsApp não funciona.') + '</p></div>';
      h += '<div class="field"><label for="s-ig">Link do Instagram</label><input class="in" id="s-ig" data-set="instagram" inputmode="url" value="' + esc(d.settings.instagram) + '"></div></div>';
      return h;
    }
    if (ui.form) return formHtml();
    var demo = d.products.some(function (p) { return p.demo; });
    var mb = totalBytes() / 1048576;
    h += '<div class="row" style="justify-content:space-between"><div><b>' + d.products.length + '</b> produto' + (d.products.length === 1 ? '' : 's') + ' na loja</div><button class="btn primary" data-act="f-new">Adicionar produto</button></div>';
    h += '<div class="banner"><b>Como atualizar o site:</b> adicione ou remova produtos aqui, clique em Baixar dados atualizados e envie o arquivo <b>dados.js</b> para a pasta <b>js</b> da hospedagem, no lugar do antigo. Enquanto não enviar, os clientes continuam vendo a versão anterior.</div>';
    if (demo) h += '<div class="banner">Os produtos marcados como exemplo servem só para você ver como a loja fica. Remova-os antes de divulgar o link.</div>';
    if (mb > 9) h += '<div class="banner">As fotos já ocupam ' + mb.toFixed(1) + ' MB de cerca de 14 MB disponíveis. Remova fotos antigas se precisar de espaço.</div>';
    h += '<div class="rows">';
    if (!d.products.length) h += '<p class="note">Nenhum produto cadastrado. Use “Adicionar produto” para começar.</p>';
    d.products.forEach(function (p) {
      h += '<div class="prow"><div class="t">' + ((p.images && p.images[0]) ? '<img src="' + p.images[0] + '" alt="">' : L.ph(p)) + '</div><div class="m"><div><b>' + esc(p.name) + '</b>' + (p.demo ? ' <span class="sz">(exemplo)</span>' : '') + (p.soldOut ? ' <span class="sz">(esgotado)</span>' : '') + '<div class="sz">' + esc(p.category || 'Sem categoria') + ' · ' + money(p.price) + ' · ' + (p.images || []).length + ' foto' + ((p.images || []).length === 1 ? '' : 's') + '</div></div><div class="acts">';
      if (ui.delId === p.id) h += '<button class="btn sm danger" data-act="p-del-yes" data-id="' + esc(p.id) + '">Confirmar remoção</button><button class="btn sm" data-act="p-del-no">Manter</button>';
      else h += '<button class="btn sm" data-act="p-edit" data-id="' + esc(p.id) + '">Editar</button><button class="btn sm danger" data-act="p-del" data-id="' + esc(p.id) + '">Remover</button>';
      h += '</div></div></div>';
    });
    h += '</div>';
    return h;
  }

  L.adminPanel = function (enter) {
    var h = '<div class="admin' + (enter ? ' enter' : '') + '" role="dialog" aria-modal="true" aria-label="Painel da loja"><div class="admin-h"><div class="wrap"><h2>Painel da loja</h2><div class="row"><div class="tabs"><button class="tab" data-act="tab" data-v="produtos" aria-pressed="' + (ui.tab === 'produtos') + '">Produtos</button><button class="tab" data-act="tab" data-v="loja" aria-pressed="' + (ui.tab === 'loja') + '">Loja</button></div><button class="btn sm" data-act="admin-close">Fechar</button></div></div></div>';
    h += '<div class="admin-b"><div class="wrap">' + adminBody() + '</div></div><div class="pubbar" id="pubbar">' + barHtml() + '</div></div>';
    return h;
  };

  L.openAdmin = function () {
    ui.draft = clone(L.getStore()); ui.dirty = false; ui.form = null; ui.delId = null; ui.confirmExit = false;
    ui.tab = 'produtos'; ui.admin = true; ui.enter = true; ui.noKeep = true;
    L.renderLayer();
  };
  function closeAdmin() {
    ui.admin = false; ui.draft = null; ui.form = null; ui.dirty = false; ui.confirmExit = false;
    L.renderLayer();
  }
  function redraw(reset) { if (reset) ui.noKeep = true; L.renderLayer(); }

  /* ---------- Imagens: reduz e comprime antes de guardar ---------- */
  function compress(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var max = 900, w = img.naturalWidth, h = img.naturalHeight, s = Math.min(1, max / Math.max(w, h));
        w = Math.round(w * s); h = Math.round(h * s);
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        var x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('img')); };
      img.src = url;
    });
  }
  async function addImages(files) {
    var f = ui.form;
    if (!f) return;
    for (var i = 0; i < files.length; i++) {
      if (f.images.length >= 5) { L.toast('Máximo de 5 fotos por produto'); break; }
      if (totalBytes() > 14e6) { L.toast('Limite de tamanho da loja atingido. Remova fotos antigas.'); break; }
      try { f.images.push(await compress(files[i])); } catch (e) { L.toast('Não foi possível ler "' + files[i].name + '"'); }
    }
    redraw();
  }

  /* ---------- Baixar os dados atualizados (js/dados.js) ---------- */
  function publish() {
    try {
      var d = ui.draft;
      var txt = '/* Dados da loja Ximenes Store.\n   Este arquivo e gerado pelo Painel da loja (abra o site com #admin no final do endereco).\n   Para atualizar o site, substitua este arquivo na hospedagem por um novo baixado do painel. */\n' +
        'window.LOJA_DADOS = ' + JSON.stringify(d, null, 1) + ';\n';
      var blob = new Blob([txt], { type: 'text/javascript' }), a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = 'dados.js';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
      L.setStore(clone(d)); ui.dirty = false;
      renderBar(); L.renderPage();
      L.toast('Arquivo dados.js baixado');
    } catch (e) { L.toast('Não foi possível gerar o arquivo. Tente de novo.'); }
  }

  /* ---------- Ações do painel ---------- */
  A['admin-open'] = function () { L.openAdmin(); };
  A['admin-close'] = function () { if (ui.dirty) { ui.confirmExit = true; renderBar(); } else closeAdmin(); };
  A['exit-back'] = function () { ui.confirmExit = false; renderBar(); };
  A['exit-now'] = function () { closeAdmin(); };
  A.tab = function (el) { ui.tab = el.dataset.v; ui.form = null; redraw(true); };
  A.discard = function () { ui.draft = clone(L.getStore()); ui.dirty = false; ui.form = null; ui.delId = null; redraw(true); };
  A.publish = publish;
  A['f-new'] = function () {
    ui.formErr = '';
    ui.form = { id: null, isNew: true, name: '', price: '', category: '', sizes: [], desc: '', images: [], soldOut: false };
    redraw(true);
  };
  A['p-edit'] = function (el) {
    var pe = ui.draft.products.find(function (x) { return x.id === el.dataset.id; });
    if (!pe) return;
    ui.formErr = '';
    ui.form = { id: pe.id, isNew: false, name: pe.name, price: String(pe.price).replace('.', ','), category: pe.category || '', sizes: (pe.sizes || []).slice(), desc: pe.desc || '', images: (pe.images || []).slice(), soldOut: !!pe.soldOut };
    redraw(true);
  };
  A['p-del'] = function (el) { ui.delId = el.dataset.id; redraw(); };
  A['p-del-no'] = function () { ui.delId = null; redraw(); };
  A['p-del-yes'] = function (el) {
    ui.draft.products = ui.draft.products.filter(function (x) { return x.id !== el.dataset.id; });
    ui.delId = null; markDirty(); redraw();
  };
  A['f-size'] = function (el) {
    var f = ui.form, v = el.dataset.v, ix = f.sizes.indexOf(v);
    if (ix > -1) f.sizes.splice(ix, 1); else f.sizes.push(v);
    redraw();
  };
  A['f-size-add'] = function () {
    var inp = document.getElementById('f-size-x'), val = (inp.value || '').trim();
    if (val && ui.form.sizes.indexOf(val) < 0) ui.form.sizes.push(val);
    redraw();
  };
  A['f-img-rm'] = function (el) { ui.form.images.splice(+el.dataset.i, 1); redraw(); };
  A['f-img-cover'] = function (el) { var im = ui.form.images.splice(+el.dataset.i, 1)[0]; ui.form.images.unshift(im); redraw(); };
  A['f-cancel'] = function () { ui.form = null; ui.formErr = ''; redraw(true); renderBar(); };
  A['f-save'] = function () {
    var fm = ui.form, pr = L.parsePrice(fm.price);
    if (!fm.name.trim()) { ui.formErr = 'Informe o nome do produto.'; redraw(); return; }
    if (isNaN(pr) || !(pr >= 0)) { ui.formErr = 'Informe um preço válido, por exemplo 89,90.'; redraw(); return; }
    var obj = { id: fm.id || L.uid(), name: fm.name.trim(), price: Math.round(pr * 100) / 100, category: fm.category.trim(), sizes: fm.sizes.slice(), desc: fm.desc.trim(), images: fm.images.slice(), soldOut: !!fm.soldOut };
    var idx = ui.draft.products.findIndex(function (x) { return x.id === obj.id; });
    if (idx > -1) ui.draft.products[idx] = obj; else ui.draft.products.unshift(obj);
    ui.form = null; ui.formErr = ''; markDirty(); redraw(true);
  };

  /* ---------- Campos do painel ---------- */
  L.root.addEventListener('input', function (e) {
    var t = e.target;
    if (t.dataset.bind && ui.form) { ui.form[t.dataset.bind] = (t.type === 'checkbox') ? t.checked : t.value; return; }
    if (t.dataset.set && ui.draft) {
      ui.draft.settings[t.dataset.set] = t.value; markDirty();
      if (t.dataset.set === 'whatsapp') {
        var n = document.getElementById('s-wa-note'), f = L.fmtPhone(t.value);
        if (n) n.textContent = f ? 'Os pedidos chegam em: ' + f : 'Sem este número, o botão de enviar pelo WhatsApp não funciona.';
      }
    }
  });
  L.root.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'f-files' && t.files && t.files.length) { addImages([].slice.call(t.files)); t.value = ''; }
    else if (t.id === 'f-sold' && ui.form) { ui.form.soldOut = t.checked; }
  });
  L.root.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'f-size-x') { e.preventDefault(); A['f-size-add'](e.target, e); }
  });

  /* Tudo pronto: desenha a loja. */
  L.start();
})();

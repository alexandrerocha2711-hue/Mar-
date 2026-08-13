/* ==========================================================================
   MARÉ — interface
   Três comportamentos, todos como MELHORIA PROGRESSIVA:
   sem este arquivo, o cupom continua legível e selecionável, a primeira
   mensagem da topbar continua visível e o banner continua arrastável
   (scroll-snap é CSS). O JS só adiciona conforto por cima.

   Regras da plataforma: IIFE, sem framework, defer, e tudo desliga em
   prefers-reduced-motion.
   ========================================================================== */

(function () {
  'use strict';

  var reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1. Copiar o cupom — [data-mare-copiar] ------------------------------- */
  document.addEventListener('click', function (evento) {
    var btn = evento.target.closest('[data-mare-copiar]');
    if (!btn) return;

    var codigo = btn.getAttribute('data-mare-copiar');
    var alvo = btn.querySelector('.mare-topbar__codigo-txt') || btn;
    var original = alvo.textContent;

    function confirmar() {
      alvo.textContent = btn.getAttribute('data-mare-copiado') || 'Copiado';
      btn.classList.add('is-copiado');
      setTimeout(function () {
        alvo.textContent = original;
        btn.classList.remove('is-copiado');
      }, 2000);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(codigo).then(confirmar, function () {
        /* clipboard bloqueado: seleciona o texto para o toque longo copiar */
        var sel = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(alvo);
        sel.removeAllRanges();
        sel.addRange(range);
      });
    }
  });

  /* 2. Rodízio das mensagens da topbar — [data-mare-rodizio] -------------- */
  document.querySelectorAll('[data-mare-rodizio]').forEach(function (caixa) {
    var msgs = caixa.querySelectorAll('.mare-topbar__msg');
    if (msgs.length < 2 || reduzido) return;

    var i = 0;
    setInterval(function () {
      msgs[i].classList.remove('is-ativa');
      i = (i + 1) % msgs.length;
      msgs[i].classList.add('is-ativa');
    }, 4000);
  });

  /* 3. Banner em foto — [data-mare-banner] -------------------------------- */
  document.querySelectorAll('[data-mare-banner]').forEach(function (banner) {
    var trilho = banner.querySelector('[data-mare-trilho]');
    if (!trilho) return;

    var slides = Array.prototype.slice.call(trilho.children);
    var pontos = Array.prototype.slice.call(banner.querySelectorAll('[data-mare-ponto]'));
    if (slides.length < 2) return;

    var atual = 0;
    var timer = null;

    /* intervalo vem em segundos do schema; aceita ms por segurança */
    var bruto = Number(banner.getAttribute('data-mare-autoplay')) || 0;
    var ms = bruto > 0 && bruto < 1000 ? bruto * 1000 : bruto;

    function irPara(n) {
      var alvo = slides[n];
      if (!alvo) return;
      trilho.scrollTo({ left: alvo.offsetLeft, behavior: reduzido ? 'auto' : 'smooth' });
    }

    function parar() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    function rodar() {
      if (!ms || reduzido || timer) return;
      timer = setInterval(function () {
        irPara((atual + 1) % slides.length);
      }, ms);
    }

    pontos.forEach(function (p) {
      p.addEventListener('click', function () {
        parar(); /* interação manual encerra o rodízio — o cliente assumiu o controle */
        irPara(Number(p.getAttribute('data-mare-ponto')));
      });
    });

    /* slide visível define o pontinho ativo — funciona para autoplay,
       clique E arrasto com o dedo, sem recalcular nada */
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (!en.isIntersecting) return;
        atual = slides.indexOf(en.target);
        pontos.forEach(function (p, i) {
          p.classList.toggle('is-ativo', i === atual);
        });
      });
    }, { root: trilho, threshold: 0.6 });
    slides.forEach(function (s) { io.observe(s); });

    trilho.addEventListener('pointerdown', parar);
    trilho.addEventListener('focusin', parar);
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { parar(); } else { rodar(); }
    });

    rodar();
  });
})();

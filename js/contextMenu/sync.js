/**
 * sync.js — Sincronização elemento SVG → controles DOM (padrão Adapter)
 *
 * Responsabilidade única: ler atributos de um elemento SVG e atualizar
 * os controles do menu para refletir seus valores atuais.
 * Sentido único: elemento → controles (sem efeitos colaterais no SVG).
 */

/**
 * Normaliza qualquer valor de cor SVG para formato #rrggbb,
 * compatível com input[type="color"].
 *
 * @param {string} cor
 * @returns {string}
 */
export function normalizarHex(cor) {
  if (!cor || cor === 'none') return '#000000';
  if (cor.startsWith('#')) {
    if (cor.length === 4) {
      return '#' + cor[1] + cor[1] + cor[2] + cor[2] + cor[3] + cor[3];
    }
    return cor;
  }
  return '#000000';
}

/**
 * Lê os atributos do elemento SVG e popula todos os controles do menu.
 *
 * @param {SVGElement} el - Elemento sendo inspecionado
 * @param {Object} controles - Referências ao DOM do menu (retorno de criarMenuContexto)
 */
export function sincronizarControles(el, controles) {
  const {
    sliderOpacidade, valorOpacidade,
    inputFill, btnFillNone,
    inputStroke, btnStrokeNone,
    sliderEspessura, valorEspessura,
    dashBtns,
    grupoRx, sliderRx, valorRx,
  } = controles;

  // Opacidade
  const opacityAttr = el.getAttribute('opacity');
  const opacity = opacityAttr !== null ? parseFloat(opacityAttr) : 1;
  const pct = Math.round(Math.min(1, Math.max(0, opacity)) * 100);
  sliderOpacidade.value = String(pct);
  valorOpacidade.textContent = `${pct}%`;

  // Preenchimento
  const fill = el.getAttribute('fill');
  if (fill === 'none') {
    inputFill.disabled = true;
    btnFillNone.classList.add('menu-contexto__none-btn--ativo');
  } else {
    inputFill.disabled = false;
    btnFillNone.classList.remove('menu-contexto__none-btn--ativo');
    if (fill) inputFill.value = normalizarHex(fill);
  }

  // Cor da borda
  const stroke = el.getAttribute('stroke');
  if (stroke === 'none') {
    inputStroke.disabled = true;
    btnStrokeNone.classList.add('menu-contexto__none-btn--ativo');
  } else {
    inputStroke.disabled = false;
    btnStrokeNone.classList.remove('menu-contexto__none-btn--ativo');
    if (stroke) inputStroke.value = normalizarHex(stroke);
  }

  // Espessura
  const espessura = el.getAttribute('stroke-width') || '0';
  sliderEspessura.value = espessura;
  valorEspessura.textContent = espessura;

  // Estilo de borda (dasharray)
  const dash = (el.getAttribute('stroke-dasharray') || 'none').trim();
  dashBtns.forEach(btn => {
    btn.classList.toggle('menu-contexto__dash-btn--ativo', btn.dataset.dash === dash);
  });

  // Arredondamento rx (apenas rect)
  const isRect = el.tagName.toLowerCase() === 'rect';
  grupoRx.hidden = !isRect;
  if (isRect) {
    const rx = el.getAttribute('rx') || '0';
    sliderRx.value = rx;
    valorRx.textContent = rx;
  }
}

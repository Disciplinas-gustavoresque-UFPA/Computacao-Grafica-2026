/**
 * sync.js — Sincronização elemento SVG → controles DOM (padrão Adapter)
 *
 * Responsabilidade única: ler atributos de um elemento SVG e atualizar
 * os controles do menu para refletir seus valores atuais.
 * Sentido único: elemento → controles (sem efeitos colaterais no SVG).
 */

import { ehGradiente, obterInfoGradiente } from "../utils/gradientHelpers.js";

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
 * Marca o rádio correspondente ao tipo de preenchimento ('solido' | 'linear' | 'radial').
 *
 * @param {HTMLInputElement[]} radios
 * @param {string} tipo
 */
function definirTipoPreenchimentoRadio(radios, tipo) {
  radios.forEach(radio => {
    radio.checked = radio.value === tipo;
  });
}

/**
 * Lê os atributos do elemento SVG e popula todos os controles do menu.
 *
 * @param {SVGElement} el - Elemento sendo inspecionado
 * @param {Object} controles - Referências ao DOM do menu (retorno de criarMenuContexto)
 * @param {SVGSVGElement} [svgCanvas] - Canvas raiz, necessário para ler gradientes existentes
 */
export function sincronizarControles(el, controles, svgCanvas) {
  const {
    sliderOpacidade, valorOpacidade,
    inputFill, btnFillNone,
    radiosFillTipo, corWrapperSolido, gradRow, inputGradInicio, inputGradFim,
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
    definirTipoPreenchimentoRadio(radiosFillTipo, 'solido');
    corWrapperSolido.hidden = false;
    gradRow.hidden = true;
  } else if (ehGradiente(fill)) {
    inputFill.disabled = false;
    btnFillNone.classList.remove('menu-contexto__none-btn--ativo');
    const info = svgCanvas ? obterInfoGradiente(svgCanvas, el) : null;
    definirTipoPreenchimentoRadio(radiosFillTipo, info ? info.tipo : 'linear');
    corWrapperSolido.hidden = true;
    gradRow.hidden = false;
    if (info) {
      inputGradInicio.value = info.corInicio;
      inputGradFim.value = info.corFim;
    }
  } else {
    inputFill.disabled = false;
    btnFillNone.classList.remove('menu-contexto__none-btn--ativo');
    if (fill) inputFill.value = normalizarHex(fill);
    definirTipoPreenchimentoRadio(radiosFillTipo, 'solido');
    corWrapperSolido.hidden = false;
    gradRow.hidden = true;
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

/**
 * svgHelpers.js — Funções utilitárias para manipulação de elementos SVG.
 *
 * Centraliza operações comuns com o DOM SVG para evitar repetição
 * de código nos módulos de ferramentas.
 */

/** Namespace padrão do SVG, necessário para createElementNS. */
const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Cria um novo elemento SVG dinamicamente usando o namespace correto.
 *
 * @param {string} tag - Nome da tag SVG (ex: 'rect', 'circle', 'line', 'text').
 * @param {Object.<string, string|number>} [atributos={}] - Objeto com os atributos a serem definidos no elemento.
 * @returns {SVGElement} O novo elemento SVG criado.
 *
 * @example
 * const retangulo = criarElementoSVG('rect', {
 *   x: 10, y: 20, width: 100, height: 50,
 *   fill: '#4a90d9', stroke: '#1a1a2e', 'stroke-width': 2
 * });
 * document.getElementById('canvas').appendChild(retangulo);
 */
export function criarElementoSVG(tag, atributos = {}) {
  const elemento = document.createElementNS(SVG_NS, tag);

  Object.entries(atributos).forEach(([chave, valor]) => {
    elemento.setAttribute(chave, valor.toString());
  });

  return elemento;
}

/**
 * Retorna as coordenadas do mouse relativas ao elemento SVG,
 * levando em conta transformações de escala e pan do viewport.
 *
 * @param {MouseEvent} evento - Evento de mouse disparado no SVG.
 * @param {SVGSVGElement} svgElement - O elemento SVG raiz (#canvas).
 * @returns {{ x: number, y: number }} Coordenadas no espaço do SVG.
 */
export function obterCoordenadaSVG(evento, svgElement) {
  const ponto = svgElement.createSVGPoint();
  ponto.x = evento.clientX;
  ponto.y = evento.clientY;

  const matrizCTM = svgElement.getScreenCTM();

  if (!matrizCTM) {
    // Fallback para coordenadas do cliente caso a matriz não esteja disponível
    const rect = svgElement.getBoundingClientRect();
    return { x: evento.clientX - rect.left, y: evento.clientY - rect.top };
  }

  const matrizInversa = matrizCTM.inverse();
  const pontoTransformado = ponto.matrixTransform(matrizInversa);

  return { x: pontoTransformado.x, y: pontoTransformado.y };
}

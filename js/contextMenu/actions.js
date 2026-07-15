/**
 * actions.js — Ações do Menu de Contexto (padrão Command)
 *
 * Cada função é um comando independente e stateless: recebe tudo que
 * precisa via parâmetros, sem dependência de closure ou estado global.
 * Isso facilita testes e reutilização em outros contextos.
 */

/**
 * Aplica deslocamento de +10px na cópia de um elemento, adaptando
 * os atributos corretos conforme o tipo da tag SVG.
 *
 * @param {SVGElement} clone
 */
export function aplicarOffsetDuplicado(clone) {
  const tag = clone.tagName.toLowerCase();
  const offset = 10;

  if (tag === 'rect' || tag === 'text' || tag === 'image') {
    clone.setAttribute('x', String(parseFloat(clone.getAttribute('x') || '0') + offset));
    clone.setAttribute('y', String(parseFloat(clone.getAttribute('y') || '0') + offset));
  } else if (tag === 'circle' || tag === 'ellipse') {
    clone.setAttribute('cx', String(parseFloat(clone.getAttribute('cx') || '0') + offset));
    clone.setAttribute('cy', String(parseFloat(clone.getAttribute('cy') || '0') + offset));
  } else if (tag === 'line') {
    clone.setAttribute('x1', String(parseFloat(clone.getAttribute('x1') || '0') + offset));
    clone.setAttribute('y1', String(parseFloat(clone.getAttribute('y1') || '0') + offset));
    clone.setAttribute('x2', String(parseFloat(clone.getAttribute('x2') || '0') + offset));
    clone.setAttribute('y2', String(parseFloat(clone.getAttribute('y2') || '0') + offset));
  } else {
    const t = clone.getAttribute('transform') || '';
    clone.setAttribute('transform', `translate(${offset}, ${offset})${t ? ' ' + t : ''}`);
  }
}

/**
 * Move o elemento para o topo ou fundo da pilha de elementos no canvas SVG.
 *
 * @param {SVGElement} el
 * @param {SVGSVGElement} svgCanvas
 * @param {'frente'|'fundo'} direcao
 */
export function ordenarElemento(el, svgCanvas, direcao) {
  if (direcao === 'frente') {
    svgCanvas.appendChild(el);
  } else {
    svgCanvas.prepend(el);
  }
}

/**
 * Captura os atributos de estilo relevantes do elemento.
 *
 * @param {SVGElement} el
 * @returns {{ fill: string|null, stroke: string|null, opacity: string|null, 'stroke-width': string|null, 'stroke-dasharray': string|null }}
 */
export function copiarEstilos(el) {
  return {
    fill: el.getAttribute('fill'),
    stroke: el.getAttribute('stroke'),
    opacity: el.getAttribute('opacity'),
    'stroke-width': el.getAttribute('stroke-width'),
    'stroke-dasharray': el.getAttribute('stroke-dasharray'),
  };
}

/**
 * Aplica um conjunto de estilos copiados a um elemento SVG.
 *
 * @param {SVGElement} el
 * @param {ReturnType<typeof copiarEstilos>} estilos
 */
export function colarEstilos(el, estilos) {
  Object.entries(estilos).forEach(([attr, val]) => {
    if (val !== null) el.setAttribute(attr, val);
  });
}

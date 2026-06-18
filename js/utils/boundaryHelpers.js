/**
 * boundaryHelpers.js — Funções utilitárias para detecção de limites
 * e classificação de objetos dentro/fora da área da página.
 */

/**
 * Calcula o bounding box não-rotacionado de um elemento SVG
 * usando os atributos diretos do elemento.
 *
 * @param {SVGElement} el
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
function _bboxAtributos(el) {
  const tag = el.tagName.toLowerCase();

  if (tag === 'rect' || tag === 'image') {
    return {
      x: parseFloat(el.getAttribute('x') || 0),
      y: parseFloat(el.getAttribute('y') || 0),
      width: parseFloat(el.getAttribute('width') || 0),
      height: parseFloat(el.getAttribute('height') || 0),
    };
  }

  if (tag === 'circle') {
    const cx = parseFloat(el.getAttribute('cx') || 0);
    const cy = parseFloat(el.getAttribute('cy') || 0);
    const r = parseFloat(el.getAttribute('r') || 0);
    return { x: cx - r, y: cy - r, width: r * 2, height: r * 2 };
  }

  if (tag === 'ellipse') {
    const cx = parseFloat(el.getAttribute('cx') || 0);
    const cy = parseFloat(el.getAttribute('cy') || 0);
    const rx = parseFloat(el.getAttribute('rx') || 0);
    const ry = parseFloat(el.getAttribute('ry') || 0);
    return { x: cx - rx, y: cy - ry, width: rx * 2, height: ry * 2 };
  }

  if (tag === 'line') {
    const x1 = parseFloat(el.getAttribute('x1') || 0);
    const y1 = parseFloat(el.getAttribute('y1') || 0);
    const x2 = parseFloat(el.getAttribute('x2') || 0);
    const y2 = parseFloat(el.getAttribute('y2') || 0);
    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    return {
      x: minX,
      y: minY,
      width: Math.abs(x2 - x1) || 1,
      height: Math.abs(y2 - y1) || 1,
    };
  }

  if (tag === 'text') {
    const x = parseFloat(el.getAttribute('x') || 0);
    const y = parseFloat(el.getAttribute('y') || 0);
    try {
      const bbox = el.getBBox();
      return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
    } catch {
      return { x, y, width: 100, height: 20 };
    }
  }

  if (tag === 'g' || tag === 'path' || tag === 'polygon' || tag === 'polyline') {
    try {
      const bbox = el.getBBox();
      return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
    } catch {
      const dx = parseFloat(el.getAttribute('data-x') || 0);
      const dy = parseFloat(el.getAttribute('data-y') || 0);
      return { x: dx, y: dy, width: 50, height: 50 };
    }
  }

  try {
    const bbox = el.getBBox();
    return { x: bbox.x, y: bbox.y, width: bbox.width, height: bbox.height };
  } catch {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}

/**
 * Calcula o bounding box de um elemento SVG considerando rotação.
 * Obtém os 4 cantos do bbox local, aplica a matriz de transformação
 * e retorna o bbox axis-aligned resultante.
 *
 * @param {SVGElement} el
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
export function obterBoundingBox(el) {
  const local = _bboxAtributos(el);
  const transform = el.getAttribute('transform');

  if (!transform || !transform.includes('rotate')) {
    return local;
  }

  try {
    const ctm = el.getCTM();
    if (!ctm) return local;

    const svgRoot = el.ownerSVGElement || el;
    const corners = [
      svgRoot.createSVGPoint(),
      svgRoot.createSVGPoint(),
      svgRoot.createSVGPoint(),
      svgRoot.createSVGPoint(),
    ];

    corners[0].x = local.x;
    corners[0].y = local.y;
    corners[1].x = local.x + local.width;
    corners[1].y = local.y;
    corners[2].x = local.x + local.width;
    corners[2].y = local.y + local.height;
    corners[3].x = local.x;
    corners[3].y = local.y + local.height;

    const transformed = corners.map(p => p.matrixTransform(ctm));

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    transformed.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  } catch {
    return local;
  }
}

/**
 * Verifica se um elemento está totalmente dentro da área da página.
 *
 * @param {SVGElement} el
 * @param {{ x: number, y: number, width: number, height: number }} areaPagina
 * @returns {boolean}
 */
export function verificarDentroDaPagina(el, areaPagina) {
  const bbox = obterBoundingBox(el);
  return (
    bbox.x >= areaPagina.x &&
    bbox.y >= areaPagina.y &&
    bbox.x + bbox.width <= areaPagina.x + areaPagina.width &&
    bbox.y + bbox.height <= areaPagina.y + areaPagina.height
  );
}

/**
 * Classifica um array de elementos em dentro/fora da página.
 *
 * @param {SVGElement[]} elementos
 * @param {{ x: number, y: number, width: number, height: number }} areaPagina
 * @returns {{ dentro: SVGElement[], fora: SVGElement[] }}
 */
export function classificarElementos(elementos, areaPagina) {
  const dentro = [];
  const fora = [];

  elementos.forEach(el => {
    if (verificarDentroDaPagina(el, areaPagina)) {
      dentro.push(el);
    } else {
      fora.push(el);
    }
  });

  return { dentro, fora };
}

/**
 * Retorna apenas os elementos que estão dentro da área da página.
 *
 * @param {SVGElement} svgCanvas
 * @param {{ x: number, y: number, width: number, height: number }} areaPagina
 * @returns {SVGElement[]}
 */
export function obterElementosDentro(svgCanvas, areaPagina) {
  const todos = Array.from(svgCanvas.children).filter(el => {
    const tag = el.tagName.toLowerCase();
    return ['rect', 'ellipse', 'circle', 'line', 'path', 'text', 'image',
            'g', 'polygon', 'polyline'].includes(tag);
  });

  return todos.filter(el => verificarDentroDaPagina(el, areaPagina));
}

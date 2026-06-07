/**
 * alignHelpers.js — Funções de alinhamento para múltiplos elementos SVG selecionados.
 *
 * Suporta alinhamento horizontal (esquerda, centro, direita)
 * e vertical (topo, meio, base) com base no bounding box de cada elemento.
 */

/**
 * Obtém o bounding box de um elemento SVG no espaço do próprio SVG canvas.
 * Usa getBBox() que retorna coordenadas no espaço do elemento.
 *
 * @param {SVGGraphicsElement} el
 * @returns {{ x: number, y: number, width: number, height: number }}
 */
function getBBox(el) {
  try {
    const bbox = el.getBBox();
    return bbox;
  } catch {
    // Fallback para elementos sem suporte a getBBox (ex: <image>)
    const tag = el.tagName.toLowerCase();
    if (tag === 'rect' || tag === 'image' || tag === 'text') {
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
      return {
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
      };
    }
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}

/**
 * Move um elemento para uma nova posição de ancoragem.
 * @param {SVGElement} el
 * @param {{ x?: number, y?: number }} novaPos  x e/ou y do canto superior-esquerdo do bbox
 */
function moverElemento(el, novaPos) {
  const tag = el.tagName.toLowerCase();
  const bbox = getBBox(el);

  if ('x' in novaPos) {
    const dx = novaPos.x - bbox.x;
    if (tag === 'rect' || tag === 'image' || tag === 'text') {
      el.setAttribute('x', String(parseFloat(el.getAttribute('x') || 0) + dx));
    } else if (tag === 'circle' || tag === 'ellipse') {
      el.setAttribute('cx', String(parseFloat(el.getAttribute('cx') || 0) + dx));
    } else if (tag === 'line') {
      el.setAttribute('x1', String(parseFloat(el.getAttribute('x1') || 0) + dx));
      el.setAttribute('x2', String(parseFloat(el.getAttribute('x2') || 0) + dx));
    } else if (tag === 'g' || tag === 'path') {
      const current = el.getAttribute('transform') || '';
      const matchTranslate = current.match(/translate\(([^,]+),([^)]+)\)/);
      if (matchTranslate) {
        const tx = parseFloat(matchTranslate[1]) + dx;
        const ty = parseFloat(matchTranslate[2]);
        el.setAttribute('transform', current.replace(/translate\([^)]+\)/, `translate(${tx},${ty})`));
      } else {
        el.setAttribute('transform', `${current} translate(${dx},0)`.trim());
      }
    }
  }

  if ('y' in novaPos) {
    const bbox2 = getBBox(el); // Re-read after potential x update
    const dy = novaPos.y - bbox2.y;
    if (tag === 'rect' || tag === 'image' || tag === 'text') {
      el.setAttribute('y', String(parseFloat(el.getAttribute('y') || 0) + dy));
    } else if (tag === 'circle' || tag === 'ellipse') {
      el.setAttribute('cy', String(parseFloat(el.getAttribute('cy') || 0) + dy));
    } else if (tag === 'line') {
      el.setAttribute('y1', String(parseFloat(el.getAttribute('y1') || 0) + dy));
      el.setAttribute('y2', String(parseFloat(el.getAttribute('y2') || 0) + dy));
    } else if (tag === 'g' || tag === 'path') {
      const current = el.getAttribute('transform') || '';
      const matchTranslate = current.match(/translate\(([^,]+),([^)]+)\)/);
      if (matchTranslate) {
        const tx = parseFloat(matchTranslate[1]);
        const ty = parseFloat(matchTranslate[2]) + dy;
        el.setAttribute('transform', current.replace(/translate\([^)]+\)/, `translate(${tx},${ty})`));
      } else {
        el.setAttribute('transform', `${current} translate(0,${dy})`.trim());
      }
    }
  }
}

// =========================================================
// Funções de alinhamento horizontal
// =========================================================

/** Alinha todas ao bordo esquerdo do elemento mais à esquerda. */
export function alinharEsquerda(elementos) {
  if (!elementos || elementos.length < 2) return;
  const minX = Math.min(...elementos.map(el => getBBox(el).x));
  elementos.forEach(el => moverElemento(el, { x: minX }));
}

/** Alinha todos os centros horizontalmente ao centro médio. */
export function alinharCentroHorizontal(elementos) {
  if (!elementos || elementos.length < 2) return;
  const boxes = elementos.map(el => getBBox(el));
  const minX = Math.min(...boxes.map(b => b.x));
  const maxX = Math.max(...boxes.map(b => b.x + b.width));
  const centroX = (minX + maxX) / 2;
  elementos.forEach((el, i) => {
    moverElemento(el, { x: centroX - boxes[i].width / 2 });
  });
}

/** Alinha todas ao bordo direito do elemento mais à direita. */
export function alinharDireita(elementos) {
  if (!elementos || elementos.length < 2) return;
  const maxX = Math.max(...elementos.map(el => { const b = getBBox(el); return b.x + b.width; }));
  elementos.forEach(el => {
    const b = getBBox(el);
    moverElemento(el, { x: maxX - b.width });
  });
}

// =========================================================
// Funções de alinhamento vertical
// =========================================================

/** Alinha todas ao topo do elemento mais acima. */
export function alinharTopo(elementos) {
  if (!elementos || elementos.length < 2) return;
  const minY = Math.min(...elementos.map(el => getBBox(el).y));
  elementos.forEach(el => moverElemento(el, { y: minY }));
}

/** Alinha todos os centros verticalmente ao centro médio. */
export function alinharCentroVertical(elementos) {
  if (!elementos || elementos.length < 2) return;
  const boxes = elementos.map(el => getBBox(el));
  const minY = Math.min(...boxes.map(b => b.y));
  const maxY = Math.max(...boxes.map(b => b.y + b.height));
  const centroY = (minY + maxY) / 2;
  elementos.forEach((el, i) => {
    moverElemento(el, { y: centroY - boxes[i].height / 2 });
  });
}

/** Alinha todas à base do elemento mais abaixo. */
export function alinharBase(elementos) {
  if (!elementos || elementos.length < 2) return;
  const maxY = Math.max(...elementos.map(el => { const b = getBBox(el); return b.y + b.height; }));
  elementos.forEach(el => {
    const b = getBBox(el);
    moverElemento(el, { y: maxY - b.height });
  });
}

// =========================================================
// Distribuição
// =========================================================

/** Distribui horizontalmente com espaçamento igual entre elementos. */
export function distribuirHorizontalmente(elementos) {
  if (!elementos || elementos.length < 3) return;
  const sorted = [...elementos].sort((a, b) => getBBox(a).x - getBBox(b).x);
  const boxes = sorted.map(el => getBBox(el));
  const totalWidth = boxes.reduce((s, b) => s + b.width, 0);
  const minX = boxes[0].x;
  const maxX = boxes[boxes.length - 1].x + boxes[boxes.length - 1].width;
  const totalGap = (maxX - minX) - totalWidth;
  const gap = totalGap / (sorted.length - 1);
  let curX = minX;
  sorted.forEach((el, i) => {
    moverElemento(el, { x: curX });
    curX += boxes[i].width + gap;
  });
}

/** Distribui verticalmente com espaçamento igual entre elementos. */
export function distribuirVerticalmente(elementos) {
  if (!elementos || elementos.length < 3) return;
  const sorted = [...elementos].sort((a, b) => getBBox(a).y - getBBox(b).y);
  const boxes = sorted.map(el => getBBox(el));
  const totalHeight = boxes.reduce((s, b) => s + b.height, 0);
  const minY = boxes[0].y;
  const maxY = boxes[boxes.length - 1].y + boxes[boxes.length - 1].height;
  const totalGap = (maxY - minY) - totalHeight;
  const gap = totalGap / (sorted.length - 1);
  let curY = minY;
  sorted.forEach((el, i) => {
    moverElemento(el, { y: curY });
    curY += boxes[i].height + gap;
  });
}

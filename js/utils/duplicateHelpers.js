import { criarElementoSVG } from './svgHelpers.js';

const OFFSET_DEFAULT = 20;

const TAG_POS_ATTRS = {
  rect: { x: 'x', y: 'y' },
  image: { x: 'x', y: 'y' },
  text: { x: 'x', y: 'y' },
  circle: { x: 'cx', y: 'cy' },
  ellipse: { x: 'cx', y: 'cy' },
  line: { x: ['x1', 'x2'], y: ['y1', 'y2'] }
};

function ajustarPosicaoElemento(elemento, offsetX, offsetY) {
  const tag = elemento.tagName ? elemento.tagName.toLowerCase() : '';

  // Se for um grupo ou se não tiver atributos simples de posição mapeados (ex: path, polygon, polyline)
  const attrs = TAG_POS_ATTRS[tag];
  if (tag === 'g' || !attrs) {
    const transformAttr = elemento.getAttribute('transform') || '';
    let translateX = 0;
    let translateY = 0;

    if (transformAttr.includes('translate')) {
      // Tenta casar translate(X, Y) ou translate(X Y)
      const match = transformAttr.match(/translate\(([^,)]+)[,\s]+([^)]+)\)/);
      if (match) {
        translateX = parseFloat(match[1]) || 0;
        translateY = parseFloat(match[2]) || 0;
        const rest = transformAttr.replace(match[0], '').trim();
        elemento.setAttribute('transform', `translate(${translateX + offsetX}, ${translateY + offsetY}) ${rest}`.trim());
      } else {
        // Trata caso tenha apenas um valor no translate, ex: translate(X) (onde Y assume 0)
        const matchSingle = transformAttr.match(/translate\(([^)]+)\)/);
        if (matchSingle) {
          translateX = parseFloat(matchSingle[1]) || 0;
          const rest = transformAttr.replace(matchSingle[0], '').trim();
          elemento.setAttribute('transform', `translate(${translateX + offsetX}, ${offsetY}) ${rest}`.trim());
        } else {
          elemento.setAttribute('transform', `translate(${offsetX}, ${offsetY}) ${transformAttr}`.trim());
        }
      }
    } else {
      elemento.setAttribute('transform', `translate(${offsetX}, ${offsetY}) ${transformAttr}`.trim());
    }
    return;
  }

  // Se tiver atributos de posição simples mapeados, altera diretamente neles
  if (Array.isArray(attrs.x)) {
    attrs.x.forEach(attr => {
      const val = parseFloat(elemento.getAttribute(attr)) || 0;
      elemento.setAttribute(attr, val + offsetX);
    });
  } else if (attrs.x) {
    const xVal = parseFloat(elemento.getAttribute(attrs.x)) || 0;
    elemento.setAttribute(attrs.x, xVal + offsetX);
  }

  if (Array.isArray(attrs.y)) {
    attrs.y.forEach(attr => {
      const val = parseFloat(elemento.getAttribute(attr)) || 0;
      elemento.setAttribute(attr, val + offsetY);
    });
  } else if (attrs.y) {
    const yVal = parseFloat(elemento.getAttribute(attrs.y)) || 0;
    elemento.setAttribute(attrs.y, yVal + offsetY);
  }
}

function clonarRecursivamente(elemento, offsetX, offsetY) {
  const clone = elemento.cloneNode(true);
  ajustarPosicaoElemento(clone, offsetX, offsetY);
  return clone;
}

export function duplicarElemento(elemento, svgCanvas, offsetX = OFFSET_DEFAULT, offsetY = OFFSET_DEFAULT) {
  if (!elemento || !svgCanvas) {
    console.warn('duplicarElemento: elemento ou svgCanvas inválido');
    return null;
  }

  const clone = clonarRecursivamente(elemento, offsetX, offsetY);
  svgCanvas.appendChild(clone);

  return clone;
}
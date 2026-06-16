import { criarElementoSVG, converterCoordenadaClienteParaSVG } from '../utils/svgHelpers.js';

export class Selecao {
  constructor(overlaySvg) {
    this.overlaySvg = overlaySvg;
    this.bordaSelecao = null;
  }

  /**
   * Desenha a borda de seleção ao redor do conjunto de elementos.
   * @param {SVGElement[]} elementosSelecionados 
   */
  desenhar(elementosSelecionados) {
    this.limpar();

    if (!elementosSelecionados || elementosSelecionados.length === 0) return;

    if (elementosSelecionados.length > 1) {
      // Multi-selection: just draw a simple dashed rectangle
      const bounds = this._calcularBoundsUnificados(elementosSelecionados);
      this.bordaSelecao = criarElementoSVG('rect', {
        x: bounds.minX - 2,
        y: bounds.minY - 2,
        width: bounds.maxX - bounds.minX + 4,
        height: bounds.maxY - bounds.minY + 4,
        fill: 'none',
        stroke: "blue",
        'stroke-width': 1.5,
        'stroke-dasharray': '4 2',
        class: 'borda-rect'
      });
      this.overlaySvg.appendChild(this.bordaSelecao);
    } else {
      // Single selection: draw group with handles and rotate capability
      const el = elementosSelecionados[0];
      const bbox = el.getBBox();
      
      this.bordaSelecao = criarElementoSVG('g', {
        'pointer-events': 'none'
      });
      
      // Calculate scaled dimensions to fix Bug 1 (Handles scaling with element)
      const sx = parseFloat(el.getAttribute('data-scalex') || 1);
      const sy = parseFloat(el.getAttribute('data-scaley') || 1);
      const angle = parseFloat(el.getAttribute('data-angle') || 0);

      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;

      // We only apply rotate to the group, so it rotates correctly.
      // Scaling is baked into the x/y/width/height of the rect and handles.
      if (angle !== 0) {
        this.bordaSelecao.setAttribute('transform', `rotate(${angle}, ${cx}, ${cy})`);
      }

      // Scaled bounds
      const halfW = (bbox.width / 2) * sx;
      const halfH = (bbox.height / 2) * sy;
      
      const sX = cx - Math.abs(halfW);
      const sY = cy - Math.abs(halfH);
      const sWidth = Math.abs(halfW * 2);
      const sHeight = Math.abs(halfH * 2);

      // Retângulo principal
      const rect = criarElementoSVG('rect', {
        x: sX - 2,
        y: sY - 2,
        width: sWidth + 4,
        height: sHeight + 4,
        fill: 'none',
        stroke: "blue",
        'stroke-width': 1.5,
        'stroke-dasharray': '4 2',
        class: 'borda-rect'
      });
      this.bordaSelecao.appendChild(rect);

      // Handles de redimensionamento
      const handleProps = {
        width: 8,
        height: 8,
        fill: 'white',
        stroke: 'blue',
        'stroke-width': 1.5,
        'pointer-events': 'all'
      };

      const positions = {
        'nw': { x: sX - 2, y: sY - 2, cursor: 'nwse-resize' },
        'ne': { x: sX + sWidth + 2, y: sY - 2, cursor: 'nesw-resize' },
        'sw': { x: sX - 2, y: sY + sHeight + 2, cursor: 'nesw-resize' },
        'se': { x: sX + sWidth + 2, y: sY + sHeight + 2, cursor: 'nwse-resize' }
      };

      for (const [dir, pos] of Object.entries(positions)) {
        const handle = criarElementoSVG('rect', {
          ...handleProps,
          x: pos.x - 4,
          y: pos.y - 4,
          class: `handle resize-handle ${dir}`,
          'data-dir': dir,
          style: `cursor: ${pos.cursor};`
        });
        this.bordaSelecao.appendChild(handle);
      }

      // Handle de Rotação
      const pivotLine = criarElementoSVG('line', {
        x1: cx,
        y1: sY - 2,
        x2: cx,
        y2: sY - 25,
        stroke: 'blue',
        'stroke-width': 1.5,
        class: 'pivot-line'
      });
      this.bordaSelecao.appendChild(pivotLine);

      const rotateHandle = criarElementoSVG('circle', {
        cx: cx,
        cy: sY - 25,
        r: 5,
        fill: 'white',
        stroke: 'blue',
        'stroke-width': 1.5,
        class: 'handle rotate-handle',
        'pointer-events': 'all',
        style: 'cursor: crosshair;'
      });
      this.bordaSelecao.appendChild(rotateHandle);

      this.overlaySvg.appendChild(this.bordaSelecao);
    }
  }

  /**
   * Atualiza a posição e dimensões da borda de seleção para múltiplos elementos.
   * @param {SVGElement[]} elementosSelecionados 
   */
  atualizarPosicao(elementosSelecionados) {
    if (!this.bordaSelecao || !elementosSelecionados || elementosSelecionados.length === 0) return;

    if (elementosSelecionados.length > 1) {
      if (this.bordaSelecao.tagName !== 'rect') {
         // Switch from single to multi
         this.desenhar(elementosSelecionados);
         return;
      }
      const bounds = this._calcularBoundsUnificados(elementosSelecionados);
      this.bordaSelecao.setAttribute('x', String(bounds.minX - 2));
      this.bordaSelecao.setAttribute('y', String(bounds.minY - 2));
      this.bordaSelecao.setAttribute('width', String(bounds.maxX - bounds.minX + 4));
      this.bordaSelecao.setAttribute('height', String(bounds.maxY - bounds.minY + 4));
    } else {
      if (this.bordaSelecao.tagName !== 'g') {
         this.desenhar(elementosSelecionados);
         return;
      }
      const el = elementosSelecionados[0];
      const bbox = el.getBBox();
      
      const sx = parseFloat(el.getAttribute('data-scalex') || 1);
      const sy = parseFloat(el.getAttribute('data-scaley') || 1);
      const angle = parseFloat(el.getAttribute('data-angle') || 0);

      const cx = bbox.x + bbox.width / 2;
      const cy = bbox.y + bbox.height / 2;

      if (angle !== 0) {
        this.bordaSelecao.setAttribute('transform', `rotate(${angle}, ${cx}, ${cy})`);
      } else {
        this.bordaSelecao.removeAttribute('transform');
      }

      const halfW = (bbox.width / 2) * sx;
      const halfH = (bbox.height / 2) * sy;
      
      const sX = cx - Math.abs(halfW);
      const sY = cy - Math.abs(halfH);
      const sWidth = Math.abs(halfW * 2);
      const sHeight = Math.abs(halfH * 2);

      const rect = this.bordaSelecao.querySelector('.borda-rect');
      if (rect) {
        rect.setAttribute('x', String(sX - 2));
        rect.setAttribute('y', String(sY - 2));
        rect.setAttribute('width', String(sWidth + 4));
        rect.setAttribute('height', String(sHeight + 4));
      }

      const positions = {
        'nw': { x: sX - 2, y: sY - 2 },
        'ne': { x: sX + sWidth + 2, y: sY - 2 },
        'sw': { x: sX - 2, y: sY + sHeight + 2 },
        'se': { x: sX + sWidth + 2, y: sY + sHeight + 2 }
      };

      for (const [dir, pos] of Object.entries(positions)) {
        const handle = this.bordaSelecao.querySelector(`.resize-handle.${dir}`);
        if (handle) {
          handle.setAttribute('x', String(pos.x - 4));
          handle.setAttribute('y', String(pos.y - 4));
        }
      }

      const pivotLine = this.bordaSelecao.querySelector('.pivot-line');
      if (pivotLine) {
        pivotLine.setAttribute('x1', String(cx));
        pivotLine.setAttribute('y1', String(sY - 2));
        pivotLine.setAttribute('x2', String(cx));
        pivotLine.setAttribute('y2', String(sY - 25));
      }

      const rotateHandle = this.bordaSelecao.querySelector('.rotate-handle');
      if (rotateHandle) {
        rotateHandle.setAttribute('cx', String(cx));
        rotateHandle.setAttribute('cy', String(sY - 25));
      }
    }
  }

  /**
   * Calcula os limites (min/max) de um conjunto de elementos no espaço do SVG de overlay.
   * @private
   */
  _calcularBoundsUnificados(elementos) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    elementos.forEach(el => {
      const rect = el.getBoundingClientRect();
      const pt1 = converterCoordenadaClienteParaSVG(rect.left, rect.top, this.overlaySvg);
      const pt2 = converterCoordenadaClienteParaSVG(rect.right, rect.bottom, this.overlaySvg);

      minX = Math.min(minX, pt1.x, pt2.x);
      minY = Math.min(minY, pt1.y, pt2.y);
      maxX = Math.max(maxX, pt1.x, pt2.x);
      maxY = Math.max(maxY, pt1.y, pt2.y);
    });

    return { minX, minY, maxX, maxY };
  }

  limpar() {
    if (this.bordaSelecao && this.bordaSelecao.parentNode) {
      this.bordaSelecao.parentNode.removeChild(this.bordaSelecao);
    }
    this.bordaSelecao = null;
  }
}

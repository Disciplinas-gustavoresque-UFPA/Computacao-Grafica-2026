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
      'pointer-events': 'none'
    });
    this.overlaySvg.appendChild(this.bordaSelecao);
  }

  /**
   * Atualiza a posição e dimensões da borda de seleção para múltiplos elementos.
   * @param {SVGElement[]} elementosSelecionados 
   */
  atualizarPosicao(elementosSelecionados) {
    if (this.bordaSelecao && elementosSelecionados && elementosSelecionados.length > 0) {
      const bounds = this._calcularBoundsUnificados(elementosSelecionados);

      this.bordaSelecao.setAttribute('x', String(bounds.minX - 2));
      this.bordaSelecao.setAttribute('y', String(bounds.minY - 2));
      this.bordaSelecao.setAttribute('width', String(bounds.maxX - bounds.minX + 4));
      this.bordaSelecao.setAttribute('height', String(bounds.maxY - bounds.minY + 4));
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

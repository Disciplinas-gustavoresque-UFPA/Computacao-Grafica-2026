import { criarElementoSVG, converterCoordenadaClienteParaSVG } from '../utils/svgHelpers.js';

export class Selecao {
  constructor(overlaySvg) {
    this.overlaySvg = overlaySvg;
    this.bordaSelecao = null;
    this.grupoAlcas = null;
    this.alcaSkewX = null;
    this.alcaSkewY = null;
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

    this._criarAlcasSkew();
    this._posicionarAlcasSkew(bounds);
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

      this._posicionarAlcasSkew(bounds);
    }
  }

  /**
   * Expõe o cálculo de bounds unificados para uso externo (ex: SelecaoTool
   * precisa do mesmo pivô/centro para calcular o cisalhamento).
   * @param {SVGElement[]} elementos
   */
  obterBoundsSelecao(elementos) {
    return this._calcularBoundsUnificados(elementos);
  }

  /**
   * Cria (uma única vez) o grupo e as alças de cisalhamento (skew X e Y).
   * Precisa viver no overlay (não no #canvas real): o #canvas é fotografado
   * inteiro pelo HistoryManager a cada ação (svgCanvas.innerHTML), então
   * qualquer elemento de UI colocado lá acaba "gravado" no undo/redo e vira
   * órfão quando o innerHTML é substituído. As alças só recebem clique porque
   * o grupo tem pointer-events:all, mesmo o overlay como um todo tendo
   * pointer-events:none (ver main.js).
   * @private
   */
  _criarAlcasSkew() {
    if (this.alcaSkewX) return;

    this.grupoAlcas = criarElementoSVG('g', {
      id: 'selecao-alcas',
      style: 'pointer-events: all;'
    });

    this.alcaSkewX = criarElementoSVG('rect', {
      width: 8,
      height: 8,
      fill: 'white',
      stroke: '#4a90d9',
      'stroke-width': 1,
      class: 'skew-handle',
      style: 'cursor: ew-resize;'
    });

    this.alcaSkewY = criarElementoSVG('rect', {
      width: 8,
      height: 8,
      fill: 'white',
      stroke: '#4a90d9',
      'stroke-width': 1,
      class: 'skew-handle',
      style: 'cursor: ns-resize;'
    });

    this.grupoAlcas.appendChild(this.alcaSkewX);
    this.grupoAlcas.appendChild(this.alcaSkewY);
    this.overlaySvg.appendChild(this.grupoAlcas);
  }

  /**
   * Reposiciona as alças de skew: a de X centralizada no topo da borda,
   * a de Y centralizada na lateral esquerda da borda.
   * @private
   */
  _posicionarAlcasSkew(bounds) {
    if (!this.alcaSkewX || !this.alcaSkewY) return;

    const centroX = (bounds.minX + bounds.maxX) / 2;
    const centroY = (bounds.minY + bounds.maxY) / 2;
    const topoY = bounds.minY - 10;
    const esquerdaX = bounds.minX - 10;

    this.alcaSkewX.setAttribute('x', String(centroX - 4));
    this.alcaSkewX.setAttribute('y', String(topoY - 4));

    this.alcaSkewY.setAttribute('x', String(esquerdaX - 4));
    this.alcaSkewY.setAttribute('y', String(centroY - 4));
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

    if (this.grupoAlcas && this.grupoAlcas.parentNode) {
      this.grupoAlcas.parentNode.removeChild(this.grupoAlcas);
    }
    this.grupoAlcas = null;
    this.alcaSkewX = null;
    this.alcaSkewY = null;
  }
}

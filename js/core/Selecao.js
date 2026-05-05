import { criarElementoSVG } from '../utils/svgHelpers.js';

export class Selecao {
  constructor(overlaySvg) {
    this.overlaySvg = overlaySvg;
    this.bordaSelecao = null;
  }

  desenhar(elementoSelecionado) {
    this.limpar();

    if (!elementoSelecionado) return;

    const bbox = elementoSelecionado.getBBox();
    this.bordaSelecao = criarElementoSVG('rect', {
      x: bbox.x - 2,
      y: bbox.y - 2,
      width: bbox.width + 4,
      height: bbox.height + 4,
      fill: 'none',
      stroke: "blue",
      'stroke-width': 1.5,
      'stroke-dasharray': '4 2',
      'pointer-events': 'none'
    });
    this.overlaySvg.appendChild(this.bordaSelecao);
  }

  atualizarPosicao(elementoSelecionado) {
    if (this.bordaSelecao && elementoSelecionado) {
      const bbox = elementoSelecionado.getBBox();
      this.bordaSelecao.setAttribute('x', String(bbox.x - 2));
      this.bordaSelecao.setAttribute('y', String(bbox.y - 2));
    }
  }

  limpar() {
    if (this.bordaSelecao && this.bordaSelecao.parentNode) {
      this.bordaSelecao.parentNode.removeChild(this.bordaSelecao);
    }
    this.bordaSelecao = null;
  }
}

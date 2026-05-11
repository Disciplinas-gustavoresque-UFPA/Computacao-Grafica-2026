import { criarElementoSVG, converterCoordenadaClienteParaSVG } from '../utils/svgHelpers.js';

export class Selecao {
  constructor(overlaySvg) {
    this.overlaySvg = overlaySvg;
    this.bordaSelecao = null;
  }

  /**
   * Desenha a borda de seleção ao redor do elemento.
   * @param {SVGElement} elementoSelecionado 
   */
  desenhar(elementoSelecionado) {
    this.limpar();

    if (!elementoSelecionado) return;

    // Obtém o retângulo delimitador no sistema de coordenadas do viewport (tela)
    const rect = elementoSelecionado.getBoundingClientRect();
    
    // Converte os pontos do viewport para o sistema de coordenadas interno do SVG de overlay
    const ptSuperiorEsquerda = converterCoordenadaClienteParaSVG(rect.left, rect.top, this.overlaySvg);
    const ptInferiorDireita = converterCoordenadaClienteParaSVG(rect.right, rect.bottom, this.overlaySvg);

    const largura = ptInferiorDireita.x - ptSuperiorEsquerda.x;
    const altura = ptInferiorDireita.y - ptSuperiorEsquerda.y;

    this.bordaSelecao = criarElementoSVG('rect', {
      x: ptSuperiorEsquerda.x - 2,
      y: ptSuperiorEsquerda.y - 2,
      width: largura + 4,
      height: altura + 4,
      fill: 'none',
      stroke: "blue",
      'stroke-width': 1.5,
      'stroke-dasharray': '4 2',
      'pointer-events': 'none'
    });
    this.overlaySvg.appendChild(this.bordaSelecao);
  }

  /**
   * Atualiza a posição e dimensões da borda de seleção.
   * @param {SVGElement} elementoSelecionado 
   */
  atualizarPosicao(elementoSelecionado) {
    if (this.bordaSelecao && elementoSelecionado) {
      const rect = elementoSelecionado.getBoundingClientRect();
      const ptSuperiorEsquerda = converterCoordenadaClienteParaSVG(rect.left, rect.top, this.overlaySvg);
      const ptInferiorDireita = converterCoordenadaClienteParaSVG(rect.right, rect.bottom, this.overlaySvg);

      const largura = ptInferiorDireita.x - ptSuperiorEsquerda.x;
      const altura = ptInferiorDireita.y - ptSuperiorEsquerda.y;

      this.bordaSelecao.setAttribute('x', String(ptSuperiorEsquerda.x - 2));
      this.bordaSelecao.setAttribute('y', String(ptSuperiorEsquerda.y - 2));
      this.bordaSelecao.setAttribute('width', String(largura + 4));
      this.bordaSelecao.setAttribute('height', String(altura + 4));
    }
  }

  limpar() {
    if (this.bordaSelecao && this.bordaSelecao.parentNode) {
      this.bordaSelecao.parentNode.removeChild(this.bordaSelecao);
    }
    this.bordaSelecao = null;
  }
}

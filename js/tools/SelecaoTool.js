import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';

/**
 * Ferramenta de Seleção
 */
export class SelecaoTool extends ToolBase {
  constructor(svgCanvas, overlaySvg) {
    super();
    this.svgCanvas = svgCanvas;
    this.overlaySvg = overlaySvg;

    this.elementoSelecionado = null;
    this.bordaSelecao = null;

    this.isDragging = false;
    this.offsetX = 0;
    this.offsetY = 0;
  }

  onMouseDown(evento) {
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    const target = evento.target;

    // Limpa a seleção anterior
    this.limparSelecao();

    // Se o clique não foi no canvas vazio e for um rect, selecionamos o elemento
    if (
      target !== this.svgCanvas &&
      target !== this.overlaySvg &&
      target.parentNode === this.svgCanvas &&
      target.tagName.toLowerCase() === 'rect'
    ) {
      this.elementoSelecionado = target;

      // Lógica de Seleção: Utiliza .getBBox() para desenhar o outline no overlay
      const bbox = target.getBBox();
      this.bordaSelecao = criarElementoSVG('rect', {
        x: bbox.x - 2,
        y: bbox.y - 2,
        width: bbox.width + 4,
        height: bbox.height + 4,
        fill: 'none',
        stroke: "blue",
        'stroke-width': 1.5,
        'stroke-dasharray': '4 2', // Borda tracejada
        'pointer-events': 'none' // Garante que a borda não bloqueie eventos de mouse
      });
      this.overlaySvg.appendChild(this.bordaSelecao);

      // Inicia a Movimentação
      this.isDragging = true;

      // Movimentação: Cálculo do offset para que o arraste seja suave
      const elX = parseFloat(target.getAttribute('x') || 0);
      const elY = parseFloat(target.getAttribute('y') || 0);

      this.offsetX = pt.x - elX;
      this.offsetY = pt.y - elY;
    }
  }

  onMouseMove(evento) {
    if (!this.isDragging || !this.elementoSelecionado) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    // Calcula as novas coordenadas baseX e baseY, usando o offset
    const novoX = pt.x - this.offsetX;
    const novoY = pt.y - this.offsetY;

    // Atualiza x e y do elemento selecionado (sabemos que é 'rect')
    this.elementoSelecionado.setAttribute('x', novoX);
    this.elementoSelecionado.setAttribute('y', novoY);

    // Atualiza a posição da borda de seleção de forma otimizada sem getBBox()
    if (this.bordaSelecao) {
      this.bordaSelecao.setAttribute('x', novoX - 2);
      this.bordaSelecao.setAttribute('y', novoY - 2);
    }
  }

  onMouseUp(evento) {
    this.isDragging = false;
  }

  onDesativar() {
    this.limparSelecao();
  }

  limparSelecao() {
    if (this.bordaSelecao && this.bordaSelecao.parentNode) {
      this.bordaSelecao.parentNode.removeChild(this.bordaSelecao);
    }
    this.bordaSelecao = null;
    this.elementoSelecionado = null;
    this.isDragging = false;
  }
}

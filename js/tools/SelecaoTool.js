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

    const allowedTags = ['rect', 'text', 'image', 'circle', 'ellipse'];
    const tag = target.tagName ? target.tagName.toLowerCase() : '';

    // Se o clique não foi no canvas vazio e for um elemento permitido
    if (
      target !== this.svgCanvas &&
      target !== this.overlaySvg &&
      target.parentNode === this.svgCanvas &&
      allowedTags.includes(tag)
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
      let elX = 0, elY = 0;

      if (tag === 'rect' || tag === 'text' || tag === 'image') {
        elX = parseFloat(target.getAttribute('x') || 0);
        elY = parseFloat(target.getAttribute('y') || 0);
      } else if (tag === 'circle' || tag === 'ellipse') {
        elX = parseFloat(target.getAttribute('cx') || 0);
        elY = parseFloat(target.getAttribute('cy') || 0);
      }

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

    const tag = this.elementoSelecionado.tagName.toLowerCase();

    // Atualiza as propriedades dependendo da forma
    if (tag === 'rect' || tag === 'text' || tag === 'image') {
      this.elementoSelecionado.setAttribute('x', novoX);
      this.elementoSelecionado.setAttribute('y', novoY);
    } else if (tag === 'circle' || tag === 'ellipse') {
      this.elementoSelecionado.setAttribute('cx', novoX);
      this.elementoSelecionado.setAttribute('cy', novoY);
    }

    // Atualiza a posição da borda de seleção via getBBox() para generalizar para qualquer formato
    if (this.bordaSelecao) {
      const bbox = this.elementoSelecionado.getBBox();
      this.bordaSelecao.setAttribute('x', bbox.x - 2);
      this.bordaSelecao.setAttribute('y', bbox.y - 2);
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

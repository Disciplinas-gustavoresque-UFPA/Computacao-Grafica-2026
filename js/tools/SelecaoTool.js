import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { definirElementoSelecionado, atualizarPosicaoSelecaoVisual } from '../core/StateManager.js';

/**
 * Ferramenta de Seleção
 */
export class SelecaoTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;

    this.elementoSelecionado = null;

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
      target.parentNode === this.svgCanvas &&
      allowedTags.includes(tag)
    ) {
      this.elementoSelecionado = target;

      // Chama a função definindo o elemento selecionado no gerenciador de estado, o que atualiza a camada visual de seleção.
      definirElementoSelecionado(target);

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

    // Atualiza a posição da borda de seleção
    atualizarPosicaoSelecaoVisual();
  }

  onMouseUp(evento) {
    this.isDragging = false;
  }

  onDesativar() {
    this.limparSelecao();
  }

  limparSelecao() {
    this.elementoSelecionado = null;
    this.isDragging = false;
    definirElementoSelecionado(null);
  }
}

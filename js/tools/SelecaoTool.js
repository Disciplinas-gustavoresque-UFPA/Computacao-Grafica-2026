import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { 
  estado, 
  definirElementosSelecionados, 
  adicionarElementoSelecao, 
  removerElementoSelecao, 
  atualizarPosicaoSelecaoVisual 
} from '../core/StateManager.js';

/**
 * Ferramenta de Seleção
 */
export class SelecaoTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;

    this.isDragging = false;
    this.offsets = []; // Armazena offsets para múltiplos elementos
  }

  onMouseDown(evento) {
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    const target = evento.target;
    const isShift = evento.shiftKey;

    const allowedTags = ['rect', 'text', 'image', 'circle', 'ellipse', 'g', 'path', 'line'];
    const tag = target.tagName ? target.tagName.toLowerCase() : '';

    // Verifica se o clique foi em um elemento válido dentro do canvas
    const elementoAlvo = this._buscarElementoValido(target, allowedTags);

    if (elementoAlvo) {
      if (isShift) {
        // Alterna seleção com Shift
        if (estado.elementosSelecionados.includes(elementoAlvo)) {
          removerElementoSelecao(elementoAlvo);
        } else {
          adicionarElementoSelecao(elementoAlvo);
        }
      } else {
        // Seleção única: limpa se clicar em algo novo, mantém se clicar em um já selecionado (para drag)
        if (!estado.elementosSelecionados.includes(elementoAlvo)) {
          definirElementosSelecionados([elementoAlvo]);
        }
      }

      // Prepara o arraste se houver seleção
      if (estado.elementosSelecionados.length > 0) {
        this.isDragging = true;
        this._calcularOffsets(pt);
      }
    } else {
      // Clique no vazio limpa a seleção se não estiver usando Shift
      if (!isShift) {
        this.limparSelecao();
      }
    }
  }

  onMouseMove(evento) {
    if (!this.isDragging || estado.elementosSelecionados.length === 0) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    estado.elementosSelecionados.forEach((el, index) => {
      const offset = this.offsets[index];
      if (!offset) return;

      const novoX = pt.x - offset.x;
      const novoY = pt.y - offset.y;

      const tag = el.tagName.toLowerCase();

      // Atualiza coordenadas baseado no tipo de elemento
      if (tag === 'rect' || tag === 'text' || tag === 'image') {
        el.setAttribute('x', String(novoX));
        el.setAttribute('y', String(novoY));
      } else if (tag === 'circle' || tag === 'ellipse') {
        el.setAttribute('cx', String(novoX));
        el.setAttribute('cy', String(novoY));
      } else if (tag === 'line') {
          // Exemplo simplificado para linha (move mantendo comprimento)
          const dx = novoX - parseFloat(el.getAttribute('x1') || 0);
          const dy = novoY - parseFloat(el.getAttribute('y1') || 0);
          el.setAttribute('x1', String(novoX));
          el.setAttribute('y1', String(novoY));
          el.setAttribute('x2', String(parseFloat(el.getAttribute('x2') || 0) + dx));
          el.setAttribute('y2', String(parseFloat(el.getAttribute('y2') || 0) + dy));
      }
      // Grupos (g) e Paths seriam movidos via transform (não implementado aqui para simplicidade)
    });

    atualizarPosicaoSelecaoVisual();
  }

  onMouseUp(evento) {
    this.isDragging = false;
  }

  onDesativar() {
    this.limparSelecao();
  }

  limparSelecao() {
    this.isDragging = false;
    this.offsets = [];
    definirElementosSelecionados([]);
  }

  /**
   * Busca o elemento selecionável mais próximo na hierarquia.
   * @private
   */
  _buscarElementoValido(target, allowedTags) {
    if (target === this.svgCanvas) return null;

    let atual = target;
    while (atual && atual !== this.svgCanvas) {
      const tag = atual.tagName.toLowerCase();
      if (allowedTags.includes(tag)) {
        return atual;
      }
      atual = atual.parentNode;
    }
    return null;
  }

  /**
   * Calcula a distância entre o clique e a posição de cada elemento selecionado.
   * @private
   */
  _calcularOffsets(pontoMouse) {
    this.offsets = estado.elementosSelecionados.map(el => {
      const tag = el.tagName.toLowerCase();
      let elX = 0, elY = 0;

      if (tag === 'rect' || tag === 'text' || tag === 'image') {
        elX = parseFloat(el.getAttribute('x') || 0);
        elY = parseFloat(el.getAttribute('y') || 0);
      } else if (tag === 'circle' || tag === 'ellipse') {
        elX = parseFloat(el.getAttribute('cx') || 0);
        elY = parseFloat(el.getAttribute('cy') || 0);
      } else if (tag === 'line') {
        elX = parseFloat(el.getAttribute('x1') || 0);
        elY = parseFloat(el.getAttribute('y1') || 0);
      }

      return { x: pontoMouse.x - elX, y: pontoMouse.y - elY };
    });
  }
}

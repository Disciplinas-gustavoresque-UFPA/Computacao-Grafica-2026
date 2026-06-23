import { definirElementosSelecionados } from '../core/StateManager.js';
import { MementoSVG } from './MementoSVG.js';

export class HistoryManager {
  #svgCanvas;
  #undoStack = [];
  #redoStack = [];

  constructor(svgCanvas) {
    this.#svgCanvas = svgCanvas;

    // Assim que o editor inicia, salva a tela inicial, garantindo que sempre haja um ponto seguro para retornar no final do Ctrl+Z
    this.salvarEstado();
  }

  salvarEstado() {
    // Toda vez que o usuário faz uma NOVA ação, o futuro alternativo (Redo) é descartado
    this.#redoStack = [];

    // Tira a "foto" do HTML interno atual do canvas
    const snapshot = new MementoSVG(this.#svgCanvas.innerHTML);

    // Guarda na pilha principal
    this.#undoStack.push(snapshot);
  }

  /**
 * Indica se há ações disponíveis para desfazer.
 */
  podeDesfazer() {
    return this.#undoStack.length > 1;
  }

  /**
   * Indica se há ações disponíveis para refazer.
   */
  podeRefazer() {
    return this.#redoStack.length > 0;
  }

  /**
   * Volta um passo na linha do tempo (Ctrl+Z).
  */
  desfazer() {
    // Precisamos de no mínimo 2 itens: o estado que vamos remover e o anterior para onde vamos voltar
    if (this.#undoStack.length > 1) {
      // 1. Tira o estado atual do topo da pilha de Undo e guarda no Redo
      const estadoAtual = this.#undoStack.pop();
      this.#redoStack.push(estadoAtual);

      // 2. Olha para o estado que ficou no topo (sem remover)
      const estadoAnterior = this.#undoStack[this.#undoStack.length - 1];

      // 3. Substitui o Canvas por esse estado anterior
      this.#aplicarEstado(estadoAnterior.getConteudo());
    }
  }

  /**
   * Avança um passo na linha do tempo (Ctrl+Y ou Ctrl+Shift+Z).
   */
  refazer() {
    // Só podemos refazer se houver algo aguardando na pilha de Redo
    if (this.#redoStack.length > 0) {
      // 1. Tira o estado do topo do Redo
      const proximoEstado = this.#redoStack.pop();

      // 2. Devolve para a pilha de histórico principal (Undo)
      this.#undoStack.push(proximoEstado);

      // 3. Substitui o Canvas por esse próximo estado
      this.#aplicarEstado(proximoEstado.getConteudo());
    }
  }

  #aplicarEstado(conteudoSvg) {
    definirElementosSelecionados(null);
    this.#svgCanvas.innerHTML = conteudoSvg;
  }
}
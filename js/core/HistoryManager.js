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
}
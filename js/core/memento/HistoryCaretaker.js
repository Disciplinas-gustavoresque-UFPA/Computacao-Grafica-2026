/**
 * HistoryCaretaker — Gerencia pilhas de desfazer/refazer baseadas em mementos.
 */
export class HistoryCaretaker {
  /**
   * @param {import('./CanvasOriginator.js').CanvasOriginator} originator
   * @param {number} [limite=50]
   */
  constructor(originator, limite = 50) {
    this.originator = originator;
    this.limite = limite;
    this.undoStack = [];
    this.redoStack = [];
  }

  inicializar() {
    if (this.undoStack.length === 0) {
      this.undoStack.push(this.originator.createMemento());
    }
  }

  salvar() {
    const novoMemento = this.originator.createMemento();
    const ultimo = this.undoStack[this.undoStack.length - 1];

    if (ultimo && ultimo.svgMarkup === novoMemento.svgMarkup) {
      return false;
    }

    this.undoStack.push(novoMemento);
    if (this.undoStack.length > this.limite) {
      this.undoStack.shift();
    }

    this.redoStack = [];
    return true;
  }

  desfazer() {
    if (this.undoStack.length <= 1) {
      return false;
    }

    const atual = this.undoStack.pop();
    if (atual) {
      this.redoStack.push(atual);
    }

    const anterior = this.undoStack[this.undoStack.length - 1];
    return this.originator.restoreFromMemento(anterior);
  }

  refazer() {
    if (this.redoStack.length === 0) {
      return false;
    }

    const proximo = this.redoStack.pop();
    if (!proximo) {
      return false;
    }

    this.undoStack.push(proximo);
    return this.originator.restoreFromMemento(proximo);
  }
}

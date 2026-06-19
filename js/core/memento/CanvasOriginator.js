import { CanvasMemento } from './CanvasMemento.js';

/**
 * CanvasOriginator — Origina e restaura mementos do canvas SVG.
 */
export class CanvasOriginator {
  /**
   * @param {SVGSVGElement} svgCanvas
   */
  constructor(svgCanvas) {
    this.svgCanvas = svgCanvas;
  }

  /**
   * Cria um memento do estado atual do canvas.
   * @returns {CanvasMemento}
   */
  createMemento() {
    const overlaysRemovidos = this._removerOverlaysTemporarios();
    const snapshot = this.svgCanvas ? this.svgCanvas.innerHTML : '';
    this._restaurarOverlaysTemporarios(overlaysRemovidos);
    return new CanvasMemento(snapshot);
  }

  /**
   * Restaura o canvas a partir de um memento.
   * @param {CanvasMemento} memento
   * @returns {boolean}
   */
  restoreFromMemento(memento) {
    if (!this.svgCanvas || !memento || typeof memento.svgMarkup !== 'string') {
      return false;
    }

    this.svgCanvas.innerHTML = memento.svgMarkup;
    return true;
  }

  /**
   * Remove overlays temporários que não devem fazer parte do histórico.
   * @returns {{elemento: Element, parent: Node, nextSibling: Node | null}[]}
   */
  _removerOverlaysTemporarios() {
    if (!this.svgCanvas) return [];

    const removidos = [];
    const overlays = this.svgCanvas.querySelectorAll('#overlay-nodes');

    overlays.forEach((overlay) => {
      if (!overlay.parentNode) return;

      removidos.push({
        elemento: overlay,
        parent: overlay.parentNode,
        nextSibling: overlay.nextSibling,
      });

      overlay.parentNode.removeChild(overlay);
    });

    return removidos;
  }

  /**
   * Reinsere overlays removidos temporariamente.
   * @param {{elemento: Element, parent: Node, nextSibling: Node | null}[]} removidos
   */
  _restaurarOverlaysTemporarios(removidos) {
    removidos.forEach(({ elemento, parent, nextSibling }) => {
      if (nextSibling) {
        parent.insertBefore(elemento, nextSibling);
      } else {
        parent.appendChild(elemento);
      }
    });
  }
}

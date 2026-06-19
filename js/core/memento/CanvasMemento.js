/**
 * CanvasMemento — Representa um snapshot imutável do conteúdo do canvas.
 */
export class CanvasMemento {
  /**
   * @param {string} svgMarkup
   */
  constructor(svgMarkup) {
    this.svgMarkup = svgMarkup;
    this.timestamp = Date.now();
    Object.freeze(this);
  }
}

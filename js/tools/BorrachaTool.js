import { ToolBase } from './ToolBase.js';

/**
 * Ferramenta Borracha
 *
 * Remove elementos do canvas SVG ao clicar ou arrastar.
 */
export class BorrachaTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.isErasing = false;
  }

  onMouseDown(evento) {
    this.isErasing = true;
    this.apagarElemento(evento);
  }

  onMouseMove(evento) {
    if (!this.isErasing) return;
    this.apagarElemento(evento);
  }

  onMouseUp(evento) {
    this.isErasing = false;
  }

  apagarElemento(evento) {
    const target = evento.target;

    const allowedTags = ['rect', 'text', 'image', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline'];
    const tag = target.tagName ? target.tagName.toLowerCase() : '';

    if (
      target !== this.svgCanvas &&
      target.parentNode === this.svgCanvas &&
      allowedTags.includes(tag)
    ) {
      target.remove();
    }
  }

  onDesativar() {
    this.isErasing = false;
  }
}
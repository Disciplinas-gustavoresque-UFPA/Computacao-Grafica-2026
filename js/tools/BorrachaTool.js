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
  const allowedTags = ['rect', 'text', 'image', 'circle', 'ellipse', 'line', 'path', 'polyline', 'g', 'polygon'];

  let target = evento.target;

  while (target && target !== this.svgCanvas) {
    const tag = target.tagName ? target.tagName.toLowerCase() : '';

    if (allowedTags.includes(tag) && target.parentNode === this.svgCanvas) {
      target.remove();
      return;
    }

    target = target.parentNode;
  }
}

  onDesativar() {
    this.isErasing = false;
  }
}
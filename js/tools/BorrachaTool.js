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
    this.pathPoints = [];

    this.allowedTags = [
      'rect',
      'text',
      'image',
      'circle',
      'ellipse',
      'line',
      'path',
      'polygon',
      'polyline'
    ];
  }

  onMouseDown(evento) {
    this.isErasing = true;

    this.pathPoints = [
      this.getSvgPoint(evento)
    ];

    this.apagarNaPosicao(this.pathPoints[0]);
  }

  onMouseMove(evento) {
    if (!this.isErasing) return;
    this.apagarElemento(evento);
  }

  onMouseUp() {
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
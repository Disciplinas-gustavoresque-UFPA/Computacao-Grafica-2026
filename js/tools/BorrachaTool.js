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
    this.pathPoints = [];
  }

  onDesativar() {
    this.isErasing = false;
    this.pathPoints = [];
  }

  /**
   * Converte coordenadas da tela para coordenadas SVG
   */
  getSvgPoint(evento) {
    const pt = this.svgCanvas.createSVGPoint();

    pt.x = evento.clientX;
    pt.y = evento.clientY;

    const transformed = pt.matrixTransform(
      this.svgCanvas.getScreenCTM().inverse()
    );

    return {
      x: transformed.x,
      y: transformed.y
    };
  }
}
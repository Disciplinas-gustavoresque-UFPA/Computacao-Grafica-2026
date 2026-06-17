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

    const currentPoint = this.getSvgPoint(evento);
    const lastPoint = this.pathPoints[this.pathPoints.length - 1];

    this.pathPoints.push(currentPoint);

    this.apagarSegmento(lastPoint, currentPoint);
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

  /**
   * Apaga elementos atingidos por um segmento da trajetória
   */
  apagarSegmento(p1, p2) {
    const elementos = Array.from(this.svgCanvas.children);

    for (const elemento of elementos) {
      const tag = elemento.tagName?.toLowerCase();

      if (!this.allowedTags.includes(tag)) {
        continue;
      }

      if (this.segmentoInterceptaElemento(p1, p2, elemento)) {
        elemento.remove();
      }
    }
  }



  /**
   * Verifica se um segmento intercepta o bounding box do elemento
   */
  segmentoInterceptaElemento(p1, p2, elemento) {
    const bbox = elemento.getBBox();

    const x1 = bbox.x;
    const y1 = bbox.y;
    const x2 = bbox.x + bbox.width;
    const y2 = bbox.y + bbox.height;

    if (this.pontoDentroBBox(p1, bbox)) return true;
    if (this.pontoDentroBBox(p2, bbox)) return true;

    const edges = [
      [{ x: x1, y: y1 }, { x: x2, y: y1 }],
      [{ x: x2, y: y1 }, { x: x2, y: y2 }],
      [{ x: x2, y: y2 }, { x: x1, y: y2 }],
      [{ x: x1, y: y2 }, { x: x1, y: y1 }]
    ];

    return edges.some(([a, b]) =>
      this.segmentosIntersectam(p1, p2, a, b)
    );
  }

  pontoDentroBBox(point, bbox) {
    return (
      point.x >= bbox.x &&
      point.x <= bbox.x + bbox.width &&
      point.y >= bbox.y &&
      point.y <= bbox.y + bbox.height
    );
  }

  segmentosIntersectam(p1, p2, p3, p4) {
    const det =
      (p2.x - p1.x) * (p4.y - p3.y) -
      (p2.y - p1.y) * (p4.x - p3.x);

    if (det === 0) {
      return false;
    }

    const lambda =
      ((p4.y - p3.y) * (p4.x - p1.x) +
        (p3.x - p4.x) * (p4.y - p1.y)) /
      det;

    const gamma =
      ((p1.y - p2.y) * (p4.x - p1.x) +
        (p2.x - p1.x) * (p4.y - p1.y)) /
      det;

    return (
      lambda >= 0 &&
      lambda <= 1 &&
      gamma >= 0 &&
      gamma <= 1
    );
  }
}
import { ToolBase } from './ToolBase.js';

/**
 * Ferramenta Borracha
 *
 * Remove elementos do canvas SVG utilizando a trajetória
 * percorrida pelo cursor ou ao clicar.
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
   * Apaga elementos diretamente sob o cursor
   */
  apagarNaPosicao(point) {
    const elementos = Array.from(this.svgCanvas.children);

    for (const elemento of elementos) {
      const tag = elemento.tagName?.toLowerCase();

      if (!this.allowedTags.includes(tag)) {
        continue;
      }

      const bbox = elemento.getBBox();

      if (
        point.x >= bbox.x &&
        point.x <= bbox.x + bbox.width &&
        point.y >= bbox.y &&
        point.y <= bbox.y + bbox.height
      ) {
        elemento.remove();
      }
    }
  }

  /**
   * Verifica se um segmento intercepta o elemento
   */
  segmentoInterceptaElemento(p1, p2, elemento) {
    const distancia = Math.hypot(
      p2.x - p1.x,
      p2.y - p1.y
    );
  
    const passos = Math.max(1, Math.ceil(distancia / 2));
  
    for (let i = 0; i <= passos; i++) {
      const t = i / passos;
    
      const pontoSvg = this.svgCanvas.createSVGPoint();
      pontoSvg.x = p1.x + (p2.x - p1.x) * t;
      pontoSvg.y = p1.y + (p2.y - p1.y) * t;
    
      const pontoTela = pontoSvg.matrixTransform(
        this.svgCanvas.getScreenCTM()
      );
    
      const target = document.elementFromPoint(
        pontoTela.x,
        pontoTela.y
      );
    
      if (target === elemento) {
        return true;
      }
    }
  
    return false;
  }
}
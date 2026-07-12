import { ToolBase } from './ToolBase.js';

export class EspiralTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.isDrawing = false;
    this.centro = null;
    this.pathElement = null;
  }

  onAtivar() {
    this.svgCanvas.style.cursor = 'crosshair';
  }

  onDesativar() {
    this.resetarDesenho();
    this.svgCanvas.style.cursor = 'default';
  }

  onMouseDown() {
    // A lógica de início da espiral será implementada em uma etapa posterior.
  }

  onMouseMove() {
    // A pré-visualização da espiral será implementada em uma etapa posterior.
  }

  onMouseUp() {
    // A finalização da espiral será implementada em uma etapa posterior.
  }

  resetarDesenho() {
    if (this.pathElement) {
      this.pathElement.remove();
    }

    this.isDrawing = false;
    this.centro = null;
    this.pathElement = null;
  }
}

import { ToolBase } from './ToolBase.js';

export class BezierTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.pontos = [];
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
    // A lógica de criação da curva será implementada em uma etapa posterior.
  }

  onMouseMove() {
    // A pré-visualização da curva será implementada em uma etapa posterior.
  }

  onMouseUp() {
    // A finalização da curva será implementada em uma etapa posterior.
  }

  resetarDesenho() {
    if (this.pathElement) {
      this.pathElement.remove();
    }

    this.pontos = [];
    this.pathElement = null;
  }
}

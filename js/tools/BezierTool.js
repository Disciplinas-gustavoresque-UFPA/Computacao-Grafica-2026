import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';

export class BezierTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.pontos = [];
    this.pathElement = null;
    this.pontoPreview = null;
  }

  onAtivar() {
    this.svgCanvas.style.cursor = 'crosshair';
  }

  onDesativar() {
    this.resetarDesenho();
    this.svgCanvas.style.cursor = 'default';
  }

  onMouseDown(evento) {
    if (evento.detail > 1) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.pontos.push(pt);
    this.pontoPreview = null;

    if (!this.pathElement) {
      this.pathElement = criarElementoSVG('path', {
        d: this.criarPathData(),
        fill: 'none',
        stroke: '#000000',
        'stroke-width': 2,
      });

      this.svgCanvas.appendChild(this.pathElement);
      return;
    }

    this.atualizarPath();

    if (this.pontos.length === 4) {
      this.finalizarCurva();
    }
  }

  onMouseMove(evento) {
    if (!this.pathElement || this.pontos.length === 0 || this.pontos.length >= 4) return;

    this.pontoPreview = obterCoordenadaSVG(evento, this.svgCanvas);
    this.atualizarPath(this.pontoPreview);
  }

  onMouseUp() {
  }

  atualizarPath(pontoPreview = null) {
    if (!this.pathElement) return;

    this.pathElement.setAttribute('d', this.criarPathData(pontoPreview));
  }

  finalizarCurva() {
    if (!this.pathElement || this.pontos.length < 4) {
      this.resetarDesenho();
      return;
    }

    this.atualizarPath();
    this.pontos = [];
    this.pathElement = null;
    this.pontoPreview = null;
  }

  criarPathData(pontoPreview = null) {
    const pontosPath = this.montarPontosPath(pontoPreview);

    if (pontosPath.length === 0) return '';

    const inicio = pontosPath[0];
    const controle1 = pontosPath[1] || inicio;
    const controle2 = pontosPath[2] || controle1;
    const fim = pontosPath[3] || controle2;

    return `M ${inicio.x} ${inicio.y} C ${controle1.x} ${controle1.y} ${controle2.x} ${controle2.y} ${fim.x} ${fim.y}`;
  }

  montarPontosPath(pontoPreview = null) {
    const pontosPath = [...this.pontos];

    if (pontoPreview && pontosPath.length < 4) {
      pontosPath.push(pontoPreview);
    }

    return pontosPath;
  }

  resetarDesenho() {
    if (this.pathElement) {
      this.pathElement.remove();
    }

    this.pontos = [];
    this.pathElement = null;
    this.pontoPreview = null;
  }
}

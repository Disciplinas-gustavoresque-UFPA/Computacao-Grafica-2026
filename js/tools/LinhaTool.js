import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado, registrarAcaoHistorico } from '../core/StateManager.js';

const ESTILOS_LINHA = {
  continua: {},
  tracejada: {
    'stroke-dasharray': '12 6',
  },
  pontilhada: {
    'stroke-dasharray': '1 6',
    'stroke-linecap': 'round',
  },
};

export class LinhaTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.isDrawing = false;
    this.lineElement = null;
  }

  onMouseDown(evento) {
    this.isDrawing = true;
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.lineElement = criarElementoSVG('line', {
      x1: pt.x, y1: pt.y,
      x2: pt.x, y2: pt.y,
      stroke: estado.corBorda,
      'stroke-width': 2,
      ...this.obterAtributosEstiloLinha()
    });
    this.svgCanvas.appendChild(this.lineElement);
  }

  onMouseMove(evento) {
    if (!this.isDrawing || !this.lineElement) return;
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.lineElement.setAttribute('x2', pt.x);
    this.lineElement.setAttribute('y2', pt.y);
  }

  onMouseUp() {
    this.isDrawing = false;
    this.lineElement = null;

    // Integração com o History Manager
    registrarAcaoHistorico();
  }

  obterAtributosEstiloLinha() {
    return ESTILOS_LINHA[estado.estiloLinha] || ESTILOS_LINHA.continua;
  }
}

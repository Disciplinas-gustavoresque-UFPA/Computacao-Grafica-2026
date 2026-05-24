import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';

/**
 * ElipseTool
 * 
 * Ferramenta responsável por desenhar elipses no canvas SVG.
 */
export class ElipseTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.elipseElement = null;
  }

  onMouseDown(evento) {
    this.isDrawing = true;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.startX = pt.x;
    this.startY = pt.y;

    // Cria o elemento <ellipse>. 
    // Inicialmente com raios zero no ponto de clique.
    this.elipseElement = criarElementoSVG('ellipse', {
      cx: this.startX,
      cy: this.startY,
      rx: 0,
      ry: 0,
      fill: estado.corPreenchimento,
      stroke: estado.corBorda,
      'stroke-width': 2
    });

    this.svgCanvas.appendChild(this.elipseElement);
  }

  onMouseMove(evento) {
    if (!this.isDrawing || !this.elipseElement) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    // Cálculos matemáticos para a elipse
    // O raio é metade da distância absoluta entre o início e o cursor
    const rx = Math.abs(pt.x - this.startX) / 2;
    const ry = Math.abs(pt.y - this.startY) / 2;

    // O centro (cx, cy) deve ser o ponto médio entre o clique inicial e o cursor
    const cx = (this.startX + pt.x) / 2;
    const cy = (this.startY + pt.y) / 2;

    this.elipseElement.setAttribute('cx', cx);
    this.elipseElement.setAttribute('cy', cy);
    this.elipseElement.setAttribute('rx', rx);
    this.elipseElement.setAttribute('ry', ry);
  }

  onMouseUp(evento) {
    this.isDrawing = false;
    this.elipseElement = null;
    // Integração futura com HistoryManager aqui
  }

  onDesativar() {
    if (this.isDrawing && this.elipseElement) {
      this.elipseElement.remove();
      this.isDrawing = false;
      this.elipseElement = null;
    }
  }
}
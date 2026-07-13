import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';
import { registrarAcaoHistorico } from '../core/StateManager.js';

/**
 * Ferramenta/Tool responsável por desenhar estrelas no canvas SVG.
 * O clique define o centro e o arrasto define o raio externo.
 * Herda de ToolBase.
 */
export class EstrelaTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.isDrawing = false;
    this.centroX = 0;
    this.centroY = 0;
    this.raioAtual = 0;
    this.estrelaElement = null;
  }

  onMouseDown(evento) {
    this.isDrawing = true;

    // Obtém coordenadas exatas em relação ao SVG
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.centroX = pt.x;
    this.centroY = pt.y;
    this.raioAtual = 0;

    // Cria o elemento SVG <polygon> dinamicamente
    this.estrelaElement = criarElementoSVG('polygon', {
      points: '',
      'data-shape': 'estrela',
      fill: estado.corPreenchimento,
      stroke: estado.corBorda,
      'stroke-width': 2
    });

    this.svgCanvas.appendChild(this.estrelaElement);
  }

  onMouseMove(evento) {
    if (!this.isDrawing || !this.estrelaElement) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.raioAtual = Math.hypot(pt.x - this.centroX, pt.y - this.centroY);

    this.estrelaElement.setAttribute(
      'points',
      this._gerarPontos(this.centroX, this.centroY, this.raioAtual)
    );
  }

  onMouseUp(evento) {
    if (!this.isDrawing) return;

    // Um clique sem arrasto criaria uma estrela de raio ~0, invisível e
    // impossível de selecionar depois — descarta em vez de registrar
    if (this.estrelaElement && this.raioAtual < 2) {
      this.estrelaElement.remove();
      this.isDrawing = false;
      this.estrelaElement = null;
      return;
    }

    // Finaliza a operação de desenho
    this.isDrawing = false;
    this.estrelaElement = null;

    // Integração com o History Manager
    registrarAcaoHistorico();
  }

  onDesativar() {
    // Se a ferramenta for desativada no meio do desenho, cancela
    if (this.isDrawing && this.estrelaElement) {
      this.estrelaElement.remove();
      this.isDrawing = false;
      this.estrelaElement = null;
    }
  }

  /**
   * Gera os 2N vértices da estrela alternando entre o raio externo e o
   * interno, em ângulos igualmente espaçados. O -PI/2 faz a primeira
   * ponta apontar para cima.
   */
  _gerarPontos(cx, cy, raioExterno, numPontas = 5) {
    const raioInterno = raioExterno * 0.4;
    const pontos = [];

    for (let i = 0; i < 2 * numPontas; i++) {
      const raio = (i % 2 === 0) ? raioExterno : raioInterno;
      const angulo = -Math.PI / 2 + (i * Math.PI) / numPontas;
      pontos.push(`${cx + raio * Math.cos(angulo)},${cy + raio * Math.sin(angulo)}`);
    }

    return pontos.join(' ');
  }
}

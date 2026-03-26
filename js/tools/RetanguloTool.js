import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';

/**
 * FerramentaRetangulo
 *
 * Ferramenta responsável por desenhar retângulos no canvas SVG.
 * Herda de ToolBase.
 */
export class RetanguloTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.rectElement = null;
  }

  onMouseDown(evento) {
    this.isDrawing = true;

    // Obtém coordenadas exatas em relação ao SVG
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.startX = pt.x;
    this.startY = pt.y;

    // Cria o elemento SVG <rect> dinamicamente
    this.rectElement = criarElementoSVG('rect', {
      x: this.startX,
      y: this.startY,
      width: 0,
      height: 0,
      fill: estado.corPreenchimento,
      stroke: estado.corBorda,
      'stroke-width': 2
    });

    this.svgCanvas.appendChild(this.rectElement);
  }

  onMouseMove(evento) {
    if (!this.isDrawing || !this.rectElement) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    // Calcula largura e altura dinâmicas (lidando com arrasto negativo)
    const width = Math.abs(pt.x - this.startX);
    const height = Math.abs(pt.y - this.startY);

    // Atualiza a posição X e Y caso o arrasto passe do ponto inicial para trás
    const novoX = pt.x < this.startX ? pt.x : this.startX;
    const novoY = pt.y < this.startY ? pt.y : this.startY;

    this.rectElement.setAttribute('x', novoX);
    this.rectElement.setAttribute('y', novoY);
    this.rectElement.setAttribute('width', width);
    this.rectElement.setAttribute('height', height);
  }

  onMouseUp(evento) {
    // Finaliza a operação de desenho
    this.isDrawing = false;
    this.rectElement = null;
    
    // TODO: Aqui integraríamos com o HistoryManager.adicionar(estadoAtual) na Issue #10
  }

  onDesativar() {
    // Se a ferramenta for desativada no meio do desenho, cancela
    if (this.isDrawing && this.rectElement) {
      this.rectElement.remove();
      this.isDrawing = false;
      this.rectElement = null;
    }
  }
}

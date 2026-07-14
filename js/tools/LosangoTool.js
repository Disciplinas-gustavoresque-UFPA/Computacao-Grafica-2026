import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';
import { registrarAcaoHistorico } from '../core/StateManager.js';
import { definirElementosSelecionados } from '../core/StateManager.js';

/**
 * Ferramenta/Tool responsável por desenhar losangos no canvas SVG.
 * Herda de ToolBase.
 */
export class LosangoTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.losnElement = null;
  }

  onMouseDown(evento) {
    this.isDrawing = true;

    // Obtém coordenadas exatas em relação ao SVG
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.startX = pt.x;
    this.startY = pt.y;

    // Cria o elemento SVG <polygon> dinamicamente
    this.losnElement = criarElementoSVG('polygon', {
      x: this.startX,
      y: this.startY,
      'data-shape': 'losango',
      width: 0,
      height: 0,
      fill: estado.corPreenchimento,
      stroke: estado.corBorda,
      'stroke-width': 2
    });

    this.svgCanvas.appendChild(this.losnElement);
  }

  onMouseMove(evento) {
    if (!this.isDrawing || !this.losnElement) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    // Calcula largura e altura dinâmicas (lidando com arrasto negativo)
    const width = Math.abs(pt.x - this.startX);
    const height = Math.abs(pt.y - this.startY);

    // Atualiza a posição X e Y caso o arrasto passe do ponto inicial para trás
    const novoX = pt.x < this.startX ? pt.x : this.startX;
    const novoY = pt.y < this.startY ? pt.y : this.startY;

    this.losnElement.setAttribute('x', novoX);
    this.losnElement.setAttribute('y', novoY);
    this.losnElement.setAttribute('width', width);
    this.losnElement.setAttribute('height', height);

    // Cálculo e definição dos vértices do losango
    const centroX = novoX + width / 2;
    const centroY = novoY + height / 2;

    // Ordem dos pontos: Topo, Direita, Base, Esquerda
    const pontos = `${centroX},${novoY} ${novoX + width},${centroY} ${centroX},${novoY + height} ${novoX},${centroY}`;
    this.losnElement.setAttribute('points', pontos);
  }

  onMouseUp(evento) {
    // Finaliza a operação de desenho
    this.isDrawing = false;
    this.losnElement = null;

    // Integração com o History Manager
    registrarAcaoHistorico();
  }

  onDesativar() {
    // Se a ferramenta for desativada no meio do desenho, cancela
    if (this.isDrawing && this.losnElement) {
      this.losnElement.remove();
      this.isDrawing = false;
      this.losnElement = null;
    }
  }
}

import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';
import { registrarAcaoHistorico } from '../core/StateManager.js';
import { definirElementosSelecionados } from '../core/StateManager.js';

/**
 * ElipseTool
 * 
 * Ferramenta responsável por desenhar elipses no canvas SVG.
 *
 * Modificadores de teclado durante o desenho:
 * - Ctrl  -> Simetria: força um círculo perfeito (rx === ry).
 * - Shift -> Centralidade: o ponto inicial do clique vira o centro da
 *            elipse, em vez de um dos cantos do retângulo delimitador.
 * (Os dois podem ser usados juntos: círculo desenhado a partir do centro.)
 */
export class ElipseTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.isDrawing = false;
    this.startX = 0;
    this.startY = 0;
    this.elipseElement = null;

    // Último ponto do mouse conhecido, usado para recalcular a geometria
    // imediatamente quando o usuário pressiona/solta Ctrl ou Shift.
    this.ultimoPonto = null;

    // Estado dos modificadores de teclado
    this.ctrlPressionado = false;
    this.shiftPressionado = false;

    // Bindings para poder adicionar/remover os listeners corretamente
    this.onKeyDownBound = this.onKeyDown.bind(this);
    this.onKeyUpBound = this.onKeyUp.bind(this);
  }

  onAtivar() {
    window.addEventListener('keydown', this.onKeyDownBound);
    window.addEventListener('keyup', this.onKeyUpBound);
  }

  onMouseDown(evento) {
    this.isDrawing = true;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.startX = pt.x;
    this.startY = pt.y;
    this.ultimoPonto = pt;

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

    this.ultimoPonto = obterCoordenadaSVG(evento, this.svgCanvas);
    this._atualizarElipse();
  }

  onMouseUp(evento) {
    this.isDrawing = false;
    this.elipseElement = null;
    this.ultimoPonto = null;

    // Integração com o History Manager
    registrarAcaoHistorico();
  }

  onKeyDown(evento) {
    let alterou = false;

    if (evento.key === 'Control' && !this.ctrlPressionado) {
      this.ctrlPressionado = true;
      alterou = true;
    }

    if (evento.key === 'Shift' && !this.shiftPressionado) {
      this.shiftPressionado = true;
      alterou = true;
    }

    // Atualiza a elipse em tempo real, sem precisar mover o mouse
    if (alterou && this.isDrawing) {
      this._atualizarElipse();
    }
  }

  onKeyUp(evento) {
    let alterou = false;

    if (evento.key === 'Control') {
      this.ctrlPressionado = false;
      alterou = true;
    }

    if (evento.key === 'Shift') {
      this.shiftPressionado = false;
      alterou = true;
    }

    if (alterou && this.isDrawing) {
      this._atualizarElipse();
    }
  }

  onDesativar() {
    window.removeEventListener('keydown', this.onKeyDownBound);
    window.removeEventListener('keyup', this.onKeyUpBound);

    this.ctrlPressionado = false;
    this.shiftPressionado = false;

    if (this.isDrawing && this.elipseElement) {
      this.elipseElement.remove();
      this.isDrawing = false;
      this.elipseElement = null;
      this.ultimoPonto = null;
    }
  }

  /**
   * Recalcula e aplica cx, cy, rx e ry no elemento de elipse em desenho,
   * de acordo com o último ponto do mouse e os modificadores pressionados.
   * @private
   */
  _atualizarElipse() {
    if (!this.elipseElement || !this.ultimoPonto) return;

    const { cx, cy, rx, ry } = this._calcularGeometria(this.ultimoPonto);

    this.elipseElement.setAttribute('cx', cx);
    this.elipseElement.setAttribute('cy', cy);
    this.elipseElement.setAttribute('rx', rx);
    this.elipseElement.setAttribute('ry', ry);
  }

  /**
   * Calcula o centro (cx, cy) e os raios (rx, ry) da elipse a partir do
   * ponto inicial do clique, do ponto atual do mouse e dos modificadores
   * de teclado (Ctrl = simetria/círculo, Shift = desenho a partir do centro).
   * @private
   */
  _calcularGeometria(pt) {
    const dx = pt.x - this.startX;
    const dy = pt.y - this.startY;

    let cx, cy, rx, ry;

    if (this.shiftPressionado) {
      // Centralidade: o clique inicial é o centro da elipse
      cx = this.startX;
      cy = this.startY;
      rx = Math.abs(dx);
      ry = Math.abs(dy);
    } else {
      // Comportamento padrão: o clique inicial é um canto do retângulo delimitador
      cx = (this.startX + pt.x) / 2;
      cy = (this.startY + pt.y) / 2;
      rx = Math.abs(dx) / 2;
      ry = Math.abs(dy) / 2;
    }

    if (this.ctrlPressionado) {
      // Simetria: força um círculo perfeito, usando o maior raio calculado
      const raio = Math.max(rx, ry);
      rx = raio;
      ry = raio;
    }

    return { cx, cy, rx, ry };
  }
}
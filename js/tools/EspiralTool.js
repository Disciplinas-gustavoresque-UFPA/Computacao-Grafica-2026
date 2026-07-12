import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';

const VOLTAS_ESPIRAL = 4;
const PONTOS_POR_VOLTA = 28;
const RAIO_MINIMO = 4;

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

  onMouseDown(evento) {
    if (evento.detail > 1) return;

    this.isDrawing = true;
    this.centro = obterCoordenadaSVG(evento, this.svgCanvas);
    this.pathElement = criarElementoSVG('path', {
      d: '',
      fill: 'none',
      stroke: estado.corBorda,
      'stroke-width': 2,
      'stroke-linejoin': 'round',
      'stroke-linecap': 'round',
    });

    this.svgCanvas.appendChild(this.pathElement);
  }

  onMouseMove(evento) {
    if (!this.isDrawing || !this.pathElement || !this.centro) return;

    const pontoAtual = obterCoordenadaSVG(evento, this.svgCanvas);
    this.pathElement.setAttribute('d', this.criarPathData(this.centro, pontoAtual));
  }

  onMouseUp(evento) {
    if (!this.isDrawing || !this.pathElement || !this.centro) return;

    const pontoFinal = obterCoordenadaSVG(evento, this.svgCanvas);
    const pathData = this.criarPathData(this.centro, pontoFinal);

    if (!pathData) {
      this.resetarDesenho();
      return;
    }

    this.pathElement.setAttribute('d', pathData);
    this.limparEstadoInterno();
  }

  criarPathData(centro, pontoAtual) {
    const raio = this.calcularRaio(centro, pontoAtual);

    if (raio < RAIO_MINIMO) return '';

    const pontos = this.gerarPontosEspiral(centro, raio);
    if (pontos.length === 0) return '';

    const [inicio, ...restante] = pontos;
    return restante.reduce(
      (pathData, ponto) => `${pathData} L ${ponto.x} ${ponto.y}`,
      `M ${inicio.x} ${inicio.y}`
    );
  }

  calcularRaio(centro, pontoAtual) {
    const dx = pontoAtual.x - centro.x;
    const dy = pontoAtual.y - centro.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  gerarPontosEspiral(centro, raioFinal) {
    const totalPontos = VOLTAS_ESPIRAL * PONTOS_POR_VOLTA;
    const anguloFinal = VOLTAS_ESPIRAL * Math.PI * 2;
    const pontos = [];

    for (let indice = 0; indice <= totalPontos; indice += 1) {
      const progresso = indice / totalPontos;
      const angulo = progresso * anguloFinal;
      const raioAtual = progresso * raioFinal;

      pontos.push({
        x: centro.x + Math.cos(angulo) * raioAtual,
        y: centro.y + Math.sin(angulo) * raioAtual,
      });
    }

    return pontos;
  }

  resetarDesenho() {
    if (this.pathElement) {
      this.pathElement.remove();
    }

    this.limparEstadoInterno();
  }

  limparEstadoInterno() {
    this.isDrawing = false;
    this.centro = null;
    this.pathElement = null;
  }
}

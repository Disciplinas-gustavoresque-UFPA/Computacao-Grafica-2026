import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import {
  estado,
  definirElementosSelecionados,
  registrarAcaoHistorico
} from '../core/StateManager.js';

const VOLTAS_ESPIRAL = 4;
const SEGMENTOS_POR_VOLTA = 8;
const RAIO_MINIMO = 4;

const ESTILOS_LINHA_ESPIRAL = {
  continua: {},
  tracejada: {
    'stroke-dasharray': '12 6',
  },
  pontilhada: {
    'stroke-dasharray': '1 6',
    'stroke-linecap': 'round',
  },
};

export class EspiralTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.isDrawing = false;
    this.centro = null;
    this.pathElement = null;

    this.onKeyDownBound = this.onKeyDown.bind(this);
  }

  onAtivar() {
    window.addEventListener('keydown', this.onKeyDownBound);
    this.svgCanvas.style.cursor = 'crosshair';
  }

  onDesativar() {
    window.removeEventListener('keydown', this.onKeyDownBound);
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
      ...this.obterAtributosEstiloLinha(),
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
    const espiralFinal = this.pathElement;
    this.limparEstadoInterno();
    definirElementosSelecionados(espiralFinal);
    registrarAcaoHistorico();
  }

  onKeyDown(evento) {
    if (evento.key !== 'Escape') return;

    evento.preventDefault();
    this.resetarDesenho();
  }

  criarPathData(centro, pontoAtual) {
    const raio = this.calcularRaio(centro, pontoAtual);

    if (raio < RAIO_MINIMO) return '';

    return this.criarPathDataCurvo(centro, raio);
  }

  calcularRaio(centro, pontoAtual) {
    const dx = pontoAtual.x - centro.x;
    const dy = pontoAtual.y - centro.y;

    return Math.sqrt(dx * dx + dy * dy);
  }

  criarPathDataCurvo(centro, raioFinal) {
    const totalSegmentos = VOLTAS_ESPIRAL * SEGMENTOS_POR_VOLTA;
    const anguloFinal = VOLTAS_ESPIRAL * Math.PI * 2;
    const incrementoAngulo = anguloFinal / totalSegmentos;
    const inicio = this.calcularPontoEspiral(centro, raioFinal, 0, anguloFinal);
    let pathData = `M ${this.formatarPonto(inicio)}`;

    for (let indice = 1; indice <= totalSegmentos; indice += 1) {
      const anguloAnterior = (indice - 1) * incrementoAngulo;
      const anguloAtual = indice * incrementoAngulo;
      const pontoAnterior = this.calcularPontoEspiral(centro, raioFinal, anguloAnterior, anguloFinal);
      const pontoAtual = this.calcularPontoEspiral(centro, raioFinal, anguloAtual, anguloFinal);
      const tangenteAnterior = this.calcularTangenteEspiral(raioFinal, anguloAnterior, anguloFinal);
      const tangenteAtual = this.calcularTangenteEspiral(raioFinal, anguloAtual, anguloFinal);
      const fatorControle = incrementoAngulo / 3;
      const controle1 = {
        x: pontoAnterior.x + tangenteAnterior.x * fatorControle,
        y: pontoAnterior.y + tangenteAnterior.y * fatorControle,
      };
      const controle2 = {
        x: pontoAtual.x - tangenteAtual.x * fatorControle,
        y: pontoAtual.y - tangenteAtual.y * fatorControle,
      };

      pathData += ` C ${this.formatarPonto(controle1)} ${this.formatarPonto(controle2)} ${this.formatarPonto(pontoAtual)}`;
    }

    return pathData;
  }

  calcularPontoEspiral(centro, raioFinal, angulo, anguloFinal) {
    const raioAtual = (angulo / anguloFinal) * raioFinal;

    return {
      x: centro.x + Math.cos(angulo) * raioAtual,
      y: centro.y + Math.sin(angulo) * raioAtual,
    };
  }

  calcularTangenteEspiral(raioFinal, angulo, anguloFinal) {
    const crescimentoRaio = raioFinal / anguloFinal;
    const raioAtual = crescimentoRaio * angulo;

    return {
      x: crescimentoRaio * Math.cos(angulo) - raioAtual * Math.sin(angulo),
      y: crescimentoRaio * Math.sin(angulo) + raioAtual * Math.cos(angulo),
    };
  }

  formatarPonto(ponto) {
    return `${this.formatarNumero(ponto.x)} ${this.formatarNumero(ponto.y)}`;
  }

  formatarNumero(valor) {
    return Number(valor.toFixed(2));
  }

  obterAtributosEstiloLinha() {
    return ESTILOS_LINHA_ESPIRAL[estado.estiloLinha] || ESTILOS_LINHA_ESPIRAL.continua;
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

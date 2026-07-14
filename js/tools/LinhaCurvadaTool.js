import { ToolBase } from './ToolBase.js';
import { criarElementoSVG, obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado, registrarAcaoHistorico } from '../core/StateManager.js';
import { gerarPathDataSuave } from '../utils/curvaHelpers.js';

const ESTILOS_LINHA_CURVADA = {
  continua: {},
  tracejada: {
    'stroke-dasharray': '12 6',
  },
  pontilhada: {
    'stroke-dasharray': '1 6',
    'stroke-linecap': 'round',
  },
};

export class LinhaCurvadaTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.pontos = [];
    this.pathElement = null;
    this.ultimoPontoMouse = null;

    this.onKeyDownBound = this.onKeyDown.bind(this);
    this.onDoubleClickBound = this.onDoubleClick.bind(this);
  }

  onAtivar() {
    window.addEventListener('keydown', this.onKeyDownBound);
    this.svgCanvas.addEventListener('dblclick', this.onDoubleClickBound);
    this.svgCanvas.style.cursor = 'crosshair';
  }

  onDesativar() {
    window.removeEventListener('keydown', this.onKeyDownBound);
    this.svgCanvas.removeEventListener('dblclick', this.onDoubleClickBound);
    this.resetarDesenho();
    this.svgCanvas.style.cursor = 'default';
  }

  onMouseDown(evento) {
    if (evento.detail > 1) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    this.ultimoPontoMouse = pt;
    this.pontos.push(pt);

    if (!this.pathElement) {
      this.pathElement = criarElementoSVG('path', {
        d: this.criarPathData(pt),
        fill: 'none',
        stroke: estado.corBorda,
        'stroke-width': 2,
        'stroke-linejoin': 'round',
        'stroke-linecap': 'round',
        ...this.obterAtributosEstiloLinha(),
      });

      this.svgCanvas.appendChild(this.pathElement);
      return;
    }

    this.atualizarPath();
  }

  onMouseMove(evento) {
    if (!this.pathElement || this.pontos.length === 0) return;

    this.ultimoPontoMouse = obterCoordenadaSVG(evento, this.svgCanvas);
    this.atualizarPath(this.ultimoPontoMouse);
  }

  onKeyDown(evento) {
    if (evento.key !== 'Enter') return;

    evento.preventDefault();
    this.finalizarCurva(this.ultimoPontoMouse);
  }

  onDoubleClick(evento) {
    evento.preventDefault();

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    if (this.pontos.length > 1) {
      this.pontos.pop();
    }

    this.finalizarCurva(pt);
  }

  atualizarPath(pontoPreview = null) {
    if (!this.pathElement) return;

    this.pathElement.setAttribute('d', this.criarPathData(pontoPreview));
  }

  finalizarCurva(pontoFinal) {
    const pontosFinais = this.montarPontosPath(pontoFinal);

    if (!this.pathElement || pontosFinais.length < 2) {
      this.resetarDesenho();
      return;
    }

    this.atualizarPath(pontoFinal);
    this.salvarVerticesNoElemento(this.pathElement, pontosFinais);
    this.pathElement = null;
    this.pontos = [];
    this.ultimoPontoMouse = null;
    registrarAcaoHistorico();
  }

  salvarVerticesNoElemento(elemento, pontos) {
    elemento.dataset.tipoLinha = 'linhaCurvada';
    elemento.dataset.pontos = JSON.stringify(pontos);
  }

  resetarDesenho() {
    if (this.pathElement) {
      this.pathElement.remove();
    }

    this.pathElement = null;
    this.pontos = [];
    this.ultimoPontoMouse = null;
  }

  criarPathData(pontoPreview = null) {
    const pontosPath = this.montarPontosPath(pontoPreview);
    return gerarPathDataSuave(pontosPath);
  }

  montarPontosPath(pontoExtra = null) {
    const pontosPath = [...this.pontos];
    const ultimoPonto = pontosPath[pontosPath.length - 1];

    if (pontoExtra && (!ultimoPonto || !this.pontosSaoIguais(ultimoPonto, pontoExtra))) {
      pontosPath.push(pontoExtra);
    }

    return pontosPath;
  }

  pontosSaoIguais(pontoA, pontoB) {
    return pontoA.x === pontoB.x && pontoA.y === pontoB.y;
  }

  obterAtributosEstiloLinha() {
    return ESTILOS_LINHA_CURVADA[estado.estiloLinha] || ESTILOS_LINHA_CURVADA.continua;
  }
}

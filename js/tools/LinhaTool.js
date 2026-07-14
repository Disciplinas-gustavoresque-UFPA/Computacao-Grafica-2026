import { ToolBase } from './ToolBase.js';
import {
  criarElementoSVG,
  obterCoordenadaSVG
} from '../utils/svgHelpers.js';

import {
  estado,
  registrarAcaoHistorico
} from '../core/StateManager.js';

const ESTILOS_LINHA = {
  continua: {},

  tracejada: {
    'stroke-dasharray': '12 6'
  },

  pontilhada: {
    'stroke-dasharray': '1 6',
    'stroke-linecap': 'round'
  }
};

export class LinhaTool extends ToolBase {
  constructor(svgCanvas) {
    super();

    this.svgCanvas = svgCanvas;
    this.isDrawing = false;
    this.lineElement = null;
  }

  onMouseDown(evento) {
    if (!this.svgCanvas) {
      return;
    }

    const pt = obterCoordenadaSVG(
      evento,
      this.svgCanvas
    );

    this.isDrawing = true;

    this.lineElement = criarElementoSVG('line', {
      x1: pt.x,
      y1: pt.y,
      x2: pt.x,
      y2: pt.y,

      stroke: estado.corBorda,
      'stroke-width': 2,

      'pointer-events': 'stroke',
      'vector-effect': 'non-scaling-stroke',

      ...this.obterAtributosEstiloLinha()
    });

    this.lineElement.setAttribute(
      'stroke-linecap',
      'round'
    );

    this.svgCanvas.appendChild(
      this.lineElement
    );
  }

  
  onMouseMove(evento) {
    if (
      !this.isDrawing ||
      !this.lineElement
    ) {
      return;
    }

    const pt = obterCoordenadaSVG(
      evento,
      this.svgCanvas
    );

    this.lineElement.setAttribute(
      'x2',
      String(pt.x)
    );

    this.lineElement.setAttribute(
      'y2',
      String(pt.y)
    );
  }

  onMouseUp() {
    if (
      !this.isDrawing ||
      !this.lineElement
    ) {
      return;
    }

    this.isDrawing = false;
    this.lineElement = null;

    registrarAcaoHistorico();
  }

  obterAtributosEstiloLinha() {
    return (
      ESTILOS_LINHA[estado.estiloLinha] ||
      ESTILOS_LINHA.continua
    );
  }

  getPanel() {
    return document.getElementById(
      'line-options'
    );
  }

  isPanelOpen() {
    const panel = this.getPanel();

    if (!panel) {
      return false;
    }

    return !panel.classList.contains(
      'hidden'
    );
  }


  openPanel() {
    const panel = this.getPanel();

    if (!panel) {
      return;
    }


    panel.style.removeProperty('top');
    panel.style.removeProperty('left');
    panel.style.removeProperty('right');
    panel.style.removeProperty('bottom');

    panel.classList.remove('hidden');

    panel.setAttribute(
      'aria-hidden',
      'false'
    );
  }

  closePanel() {
    const panel = this.getPanel();

    if (!panel) {
      return;
    }

    panel.classList.add('hidden');

    panel.setAttribute(
      'aria-hidden',
      'true'
    );
  }


  togglePanel() {
    if (this.isPanelOpen()) {
      this.closePanel();
      return;
    }

    this.openPanel();
  }
   
  onAtivar() {
    this.openPanel();
  }

  onDesativar() {
    if (
      this.isDrawing &&
      this.lineElement
    ) {
      this.lineElement.remove();
    }

    this.isDrawing = false;
    this.lineElement = null;

    this.closePanel();
  }
}
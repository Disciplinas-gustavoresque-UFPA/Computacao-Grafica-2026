import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG, criarElementoSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';

export class TextoTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.inputTemporario = null; 
  }

  onAtivar() {
    this.svgCanvas.style.cursor = 'text';
  }

  onDesativar() {
    this.svgCanvas.style.cursor = 'crosshair';
    if (this.inputTemporario) {
      this.finalizarTexto();
    }
  }

  onMouseDown(evento) {
    this.isDrawing = true;
    if (this.inputTemporario) {
      this.finalizarTexto();
      return;
    }

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    
    this.criarInputTemporario(evento.clientX, evento.clientY, pt);
  }

  criarInputTemporario(telaX, telaY, pt) {
    this.inputTemporario = document.createElement('input');
    this.inputTemporario.type = 'text';
    
    this.inputTemporario.style.position = 'absolute';
    this.inputTemporario.style.left = `${telaX}px`;
    this.inputTemporario.style.top = `${telaY - 10}px`;
    this.inputTemporario.style.zIndex = '1000'; 
    this.inputTemporario.style.background = 'transparent';
    this.inputTemporario.style.color = estado.corPreenchimento || '#000000';
    this.inputTemporario.style.border = `1px dashed ${estado.corBorda || '#333'}`;
    this.inputTemporario.style.outline = 'none';
    this.inputTemporario.style.fontFamily = 'Arial, sans-serif';
    this.inputTemporario.style.fontSize = '16px';
    this.inputTemporario.style.padding = '5px';
    
    document.body.appendChild(this.inputTemporario);
    this.inputTemporario.focus();
    
    this.inputTemporario.dataset.svgX = pt.x;
    this.inputTemporario.dataset.svgY = pt.y;

    this.inputTemporario.addEventListener('keydown', this.tratarTeclaPressionada.bind(this));
  }

  tratarTeclaPressionada(evento) {
    if (evento.key === 'Enter') {
      this.finalizarTexto();
    } else if (evento.key === 'Escape') {
      this.removerInputTemporario();
    }
  }

  finalizarTexto() {
    if (!this.inputTemporario) return;

    const textoDigitado = this.inputTemporario.value.trim();
    const x = this.inputTemporario.dataset.svgX;
    const y = this.inputTemporario.dataset.svgY;

    if (textoDigitado !== '') {
      const elementoTextoSVG = criarElementoSVG('text', {
        x: x,
        y: y,
        fill: estado.corPreenchimento || '#000000',
        'font-family': 'Arial, sans-serif',
        'font-size': '16px',
        'dy': '.71em'
      });

      elementoTextoSVG.textContent = textoDigitado;
      this.svgCanvas.appendChild(elementoTextoSVG);
    }

    this.removerInputTemporario();
  }

  removerInputTemporario() {
    if (this.inputTemporario && this.inputTemporario.parentNode) {
      this.inputTemporario.parentNode.removeChild(this.inputTemporario);
      this.inputTemporario = null;
    }
  }
}
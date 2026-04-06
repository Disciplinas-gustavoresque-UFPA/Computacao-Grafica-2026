import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { estado } from '../core/StateManager.js';

/**
 * TextoTool
 *
 * Ferramenta responsável por inserir texto no canvas SVG.
 * Herda de ToolBase.
 */
export class TextoTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;
    this.inputTemporario = null; 
  }

  onAtivar() {
    // Muda o cursor para indicar que a ferramenta de texto está pronta
    this.svgCanvas.style.cursor = 'text';
  }

  onDesativar() {
    // Volta para o cursor padrão do editor
    this.svgCanvas.style.cursor = 'crosshair';
    this.removerInputTemporario();
  }

  onMouseDown(evento) { 
    // Se o usuário clicar novamente e já existir um input, vamos forçar a finalização do anterior
    if (this.inputTemporario) {
      this.finalizarTexto();
      return;
    }

    // Pegamos a coordenada exata dentro do universo do SVG
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    this.criarInputTemporario(evento.clientX, evento.clientY, pt);
  }

  criarInputTemporario(telaX, telaY, pt) {
    this.inputTemporario = document.createElement('input');
    this.inputTemporario.type = 'text';
    
    // estilizando o input 
    this.inputTemporario.style.position = 'absolute';
    this.inputTemporario.style.left = `${telaX}px`;
    this.inputTemporario.style.top = `${telaY - 10}px`; // Ajuste fino para o texto alinhar com o clique
    this.inputTemporario.style.zIndex = '100'; // Garante que fique por cima de tudo
    this.inputTemporario.style.background = 'transparent';
    this.inputTemporario.style.color = estado.corPreenchimento; // Usa a cor do StateManager
    this.inputTemporario.style.border = `1px dashed ${estado.corBorda}`;
    this.inputTemporario.style.outline = 'none';
    this.inputTemporario.style.fontFamily = 'Arial, sans-serif';
    this.inputTemporario.style.fontSize = '16px';
    
    // coloca o input no body do html (na tela)
    document.body.appendChild(this.inputTemporario);
    this.inputTemporario.focus();
    
    // Guarda a coordenada SVG no próprio elemento
    this.inputTemporario.dataset.svgX = pt.x;
    this.inputTemporario.dataset.svgY = pt.y;
  }

  finalizarTexto() {
    if (!this.inputTemporario) return;

    const textoDigitado = this.inputTemporario.value.trim();
    const x = this.inputTemporario.dataset.svgX;
    const y = this.inputTemporario.dataset.svgY;

    // Só cria o elemento SVG se algo foi digitado
    if (textoDigitado !== '') {
      const elementoTextoSVG = criarElementoSVG('text', {
        x: x,
        y: y,
        fill: estado.corPreenchimento,
        'font-family': 'Arial, sans-serif',
        'font-size': '16px',
        'dominant-baseline': 'text-before-edge' 
      });

      // pegando o texto e colocando no html
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
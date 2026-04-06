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
    // Guardará a referência da caixa de texto HTML que criaremos depois
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
    // se existe um input ativo nao permite criar outro
    if (this.inputTemporario) return;

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

  removerInputTemporario() {
    if (this.inputTemporario && this.inputTemporario.parentNode) {
      this.inputTemporario.parentNode.removeChild(this.inputTemporario);
      this.inputTemporario = null;
    }
  }

}
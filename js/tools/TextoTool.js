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
  }

  onMouseDown(evento) {
    // Pegamos a coordenada exata dentro do universo do SVG
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    console.log('Preparado para inserir texto na coordenada SVG:', pt.x, pt.y);
  }
}
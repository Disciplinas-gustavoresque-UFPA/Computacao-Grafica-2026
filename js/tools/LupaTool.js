import { ToolBase } from './ToolBase.js';
import { obterCoordenadasSVG } from '../utils/svgHelpers.js';

// Ferramenta responsavel por controlar zoom no canvas SVG via viewBox
export class LupaTool extends ToolBase {
  constructor(svg) {
    super();
    this.svg = svg;
    this.modo = 'click'; // zoom padrão do inkscape

    this.isDragging = false;
    this.start = null;
    this.dragButton = null;
    this.selectionRect = null;

    // Estado interno do SVG : "área visivel"  
    this.viewBox = {
      x: 0,
      y: 0,
      width: svg.clientWidth,
      height: svg.clientHeight
    }; // <-- viewBox

    this.initialViewBox = {
      ...this.viewBox
    }; // <-- initialViewBox (guardar a posição inicial)
  } // <-- constructor
  
  // Voltar à posição inicial do viewBox
  resetView() {
    this.viewBox = {
      ...this.initialViewBox
    };
    this.applyViewBox();
  } // <-- resetView

  // Define o modo de interação da lupa 
  setModo(modo) {
    this.modo = (this.modo === modo) ? 'click' : modo;
  } // <-- setModo

  // Remove elementos temporários e reseta o estado/modo da lupa 
  cleanup() {
    if (this.selectionRect && this.selectionRect.parentNode) {
      this.selectionRect.parentNode.removeChild(this.selectionRect);
    }

    this.selectionRect = null;
    this.isDragging = false;
    this.dragButton = null;
  } // <-- cleanup

  // Aplica o estado atual do viewBox no SVG : atualiza o "zoom"
  applyViewBox() {
    const {
      x,
      y,
      width,
      height
    } = this.viewBox;
    this.svg.setAttribute('viewBox','${x} ${y} ${width} ${height}');
  } // <-- applyViewBox

  // Realiza zoom mantendo o ponto (cx, cy) fixo como foco
  zoom(scale, cx, cy) {
    const newWidth = this.viewBox.width * scale;
    const newHeight = this.viewBox.height * scale;
  
    // Reposiciona o viewBox para manter o cursor fixo
    this.viewBox.x = cx - (cx - this.viewBox.x) * (newWidth / this.viewBox.width);
    this.viewBox.y = cy - (cy - this.viewBox.y) * (newHeight / this.viewBox.height);
    
    // Atualiza as dimensões do viewBox 
    this.viewBox.width = newWidth;
    this.viewBox.height = newHeight;

    this.applyViewBox();
  } // <-- zoom 
  
  onMouseDown(evento) {
    // Converte coordenadas do mouse (viewport) para o sistema (SVG)
    const coords = obterCoordenadasSVG(evento, this.svg);
    
    if (this.isDragging) {
      this.cleanup();
    }
    
    // BOTAO DO MEIO = Reset
    if (evento.button === 1) {
      this.resetView();
      return;
    }

    if (this.modo === 'click') {
      // Botão esquerdo : zoom in
      if (evento.button === 0) {
        this.zoom(0.9, coords.x, coords.y);
       }

       // Botão direito : zoom out
       if (evento.button === 2) {
        this.zoom(1.1, coords.x, coords.y);
       }

      return;
    } // <-- fim do modo de zoom padrão 

    if (this.modo === 'drag') {
      this.isDragging = true;
      this.start = coords;
      this.dragButton = evento.button;

      // Cria retangulo de seleção
      this.selectionRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      this.selectionRect.setAttribute("fill", "rgba(0,0,255,0.2)");
      this.selectionRect.setAttribute("stroke", "blue");
      this.selectionRect.setAttribute("stroke-dasharray", "4");

      this.svg.appendChild(this.selectionRect); 
    } // <-- fim do modo de zoom com  seleção
  } // <-- onMouseDown
  
  onMouseMove(evento) {
    if (!this.isDragging || this.modo !== 'drag' || !this.selectionRect) return;
    
    if ((evento.button !== (1 << this.dragButton)) {
      this.cleanup();
      return;
    } 

    const coords = obterCoordenadasSVG(evento, this.svg);

    const x = Math.min(this.start.x, coords.x);
    const y = Math.min(this.start.y, coords.y);
    const width = Math.abs(coords.x - this.start.x);
    const height = Math.abs(coords.y - this.start.y);

    this.selectionRect.setAttribute("x", x);
    this.selectionRect.setAttribute("y", y);
    this.selectionRect.setAttribute("width", width);
    this.selectionRect.setAttribute("height", height);
  } // <-- onMouseMove

  onMouseUp() {
  }

  onAtivar() {
  }

  onDesativar() {
  }
} // <-- class LupaTool



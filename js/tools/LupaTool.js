import { ToolBase } from './ToolBase.js';
import { obterCoordenadasSVG } from ''../utils/svgHelpers.js;

// ferramenta responsavel por controlar zoom no canvas SVG via viewBox
export class LupaTool extends ToolBase {
  constructor(svg) {
    super();
    this.svg = svg;

    // Estado interno do SVG : "área visivel"  
    this.viewBox = {
      x: 0,
      y: 0,
      width: svg.clientWidth,
      height: svg.clientHeight
    }; // <-- viewBox
  } // <-- constructor
  

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

    // Botão esquerdo : zoom in
    if (evento.button === 0) {
      this.zoom(0.9, coords.x, coords.y);
    }

    // Botão direito : zoom out
    if (evento.button === 2) {
      this.zoom(1.1, coords.x, coords.y);
    }
  } // <-- onMouseDown
} // <-- class LupaTool




/* ============================================
                  CameraSVG
============================================ */
export class CameraSVG {
  constructor(svgs = []) {

    // Guardar um ou mais SVGs
    this.svgs = Array.isArray(svgs) ? svgs : [svgs];

    const mainSVG = this.svgs[0]; 
    const hasViewBox = mainSVG.hasAttribute('viewBox');

    if (hasViewBox) {

      // Guarda valores base do viewbox atual (x,y,width,height)
      const vb = mainSVG.viewBox.baseVal;

      // Estado atual do viewbox de acordo com os valores base
      this.viewBox = {
        x: vb.width ? vb.x : 0,
        y: vb.height ? vb.y : 0,
        width: vb.width || mainSVG.clientWidth,
        height: vb.height || mainSVG.clientHeight
      };

    } else {

      // Define um viewBox para o svg se não houver um
      this.viewBox = {
        x: 0,
        y: 0,
        width: mainSVG.clientWidth,
        height: mainSVG.clientHeight
      };
      
    }

    // Guarda posição inicial do viewBox
    this.initialViewBox = { ...this.viewBox }; 
    this.applyViewBox();
    
  }

  // Aproxima o viewBox atual no SVG (aplica o "zoom")
  applyViewBox() {
    const { x, y, width, height } = this.viewBox;
    const viewBoxValue = `${x} ${y} ${width} ${height}`;

    // aplica em todos os SVGs
    this.svgs.forEach( (svg) => { 
      svg.setAttribute('viewBox', viewBoxValue);
    });
  }

  // Retorna a posição inicial do viewBox
  resetView() {
    this.viewBox = { ...this.initialViewBox };
    this.applyViewBox();
  } 

  // Retorna o nivel atual de zoom em relação ao viewbox inicial
  getZoomLevel() {
    const scale = this.initialViewBox.width / this.viewBox.width;
    return Math.round(scale * 100);
  }

  // Realiza zoom de acordo com a escal mantendo o ponto (cx, cy) fixo como foco
  zoom(scale, cx, cy) {
    const old = this.viewBox;

    const newWidth = old.width * scale;
    const newHeight = old.height * scale;
  
    // Reposiciona o viewBox para manter o cursor fixo
    this.viewBox.x = cx - (cx - old.x) * (newWidth / old.width);
    this.viewBox.y = cy - (cy - old.y) * (newHeight / old.height);
    
    // Atualiza as dimensões do viewBox 
    this.viewBox.width = newWidth;
    this.viewBox.height = newHeight;

    // aplica o zoom
    this.applyViewBox();
  } 

  // Zoom-In -> Modo 'drag'
  zoomToRect(x, y, width, height) {
    this.viewBox = {x, y, width, height};
    this.applyViewBox();
  }

  // Zoom-Out -> Modo 'drag'
  zoomOutFromRect(x, y, width, height) {
    const scale = Math.max(
      this.viewBox.width / width,
      this.viewBox.height / height
    );
    const newWidth = this.viewBox.width * scale;
    const newHeight = this.viewBox.height * scale;

    this.viewBox = {
      x: x - (newWidth - width) / 2,
      y: y - (newHeight - height) / 2,
      width: newWidth,
      height: newHeight
    };
    this.applyViewBox();
  }

}
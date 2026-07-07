// js/core/CameraSVG.js

/* ============================================
                  CameraSVG
============================================ */
export class CameraSVG {
  constructor(svgs = []) {
    // Guardar um ou mais SVGs
    this.svgs = Array.isArray(svgs) ? svgs : [svgs];

    const mainSVG = this.svgs[0];
    const hasViewBox = mainSVG.hasAttribute("viewBox");

    // Fallback: Evita valores zerados quando inicializado em display:none
    const fallbackWidth = mainSVG.clientWidth || 800;
    const fallbackHeight = mainSVG.clientHeight || 600;

    if (hasViewBox) {
      // Guarda valores base do viewbox atual (x,y,width,height)
      const vb = mainSVG.viewBox.baseVal;

      // Estado atual do viewbox de acordo com os valores base
      this.viewBox = {
        x: vb.width ? vb.x : 0,
        y: vb.height ? vb.y : 0,
        width: vb.width || fallbackWidth,
        height: vb.height || fallbackHeight,
      };
    } else {
      // Define um viewBox para o svg se não houver um
      this.viewBox = {
        x: 0,
        y: 0,
        width: fallbackWidth,
        height: fallbackHeight,
      };
    }
    this.minZoomLimit = 10; // Trava o Zoom Out em 10%
    this.maxZoomLimit = 4000; // Trava o Zoom In em 4000%

    // Guarda posição inicial do viewBox
    this.initialViewBox = { ...this.viewBox };
    this.applyViewBox();
  }

  // Aproxima o viewBox atual no SVG (aplica o "zoom")
  applyViewBox() {
    const { x, y, width, height } = this.viewBox;

    if (!isFinite(width) || !isFinite(height) || width <= 0 || height <= 0) {
      return;
    }

    const viewBoxValue = `${x} ${y} ${width} ${height}`;

    // aplica em todos os SVGs
    this.svgs.forEach((svg) => {
      svg.setAttribute("viewBox", viewBoxValue);
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

    let newWidth = old.width * scale;
    let newHeight = old.height * scale;

    // Zoom In = viewBox menor / Zoom Out = viewBox maior
    const minW = this.initialViewBox.width / (this.maxZoomLimit / 100);
    const maxW = this.initialViewBox.width / (this.minZoomLimit / 100);

    // Se passou do limite de aproximação (Zoom In)
    if (newWidth < minW) {
      if (old.width <= minW) return; // Já está no limite, ignora comando
      scale = minW / old.width; // Força a escala a bater exato no limite
      newWidth = minW;
      newHeight = old.height * scale;
    }
    // Se passou do limite de distanciamento (Zoom Out)
    else if (newWidth > maxW) {
      if (old.width >= maxW) return; // Já está no limite, ignora comando
      scale = maxW / old.width; // Força a escala a bater exato no limite
      newWidth = maxW;
      newHeight = old.height * scale;
    }

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
    if (!width || !height || width <= 0) return;

    const minW = this.initialViewBox.width / (this.maxZoomLimit / 100);

    // Se o usuário selecionou uma área minúscula que estouraria o limite:
    if (width < minW) {
      const correctionScale = minW / width;
      const newW = minW;
      const newH = height * correctionScale;

      // Centraliza o novo viewBox seguro no retângulo original
      x = x - (newW - width) / 2;
      y = y - (newH - height) / 2;
      width = newW;
      height = newH;
    }

    this.viewBox = { x, y, width, height };
    this.applyViewBox();
  }

  // Zoom-Out -> Modo 'drag'
  zoomOutFromRect(x, y, width, height) {
    if (!width || !height || width <= 0) return;

    let scale = Math.max(
      this.viewBox.width / width,
      this.viewBox.height / height,
    );

    let newWidth = this.viewBox.width * scale;
    let newHeight = this.viewBox.height * scale;

    // Qual é a maior largura permitida (10% de zoom)?
    const maxW = this.initialViewBox.width / (this.minZoomLimit / 100);

    // Se a operação for afastar a tela além dos 10%:
    if (newWidth > maxW) {
      scale = maxW / this.viewBox.width; // Recalcula escala limite
      newWidth = maxW;
      newHeight = this.viewBox.height * scale;
    }

    this.viewBox = {
      x: x - (newWidth - width) / 2,
      y: y - (newHeight - height) / 2,
      width: newWidth,
      height: newHeight,
    };
    this.applyViewBox();
  }
}

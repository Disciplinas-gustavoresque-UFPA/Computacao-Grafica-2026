export class Regua {
  constructor(container, svgCanvas) {
    this.container = container;
    this.svgCanvas = svgCanvas;
    this.ativa = false;

    this._criarElementos();
    this._registrarObservadores();
  }

  _criarElementos() {
    this.horizontal = document.createElement('div');
    this.horizontal.className = 'regua regua-horizontal oculto';

    this.vertical = document.createElement('div');
    this.vertical.className = 'regua regua-vertical oculto';

    this.canto = document.createElement('div');
    this.canto.className = 'regua-canto oculto';

    this.container.appendChild(this.horizontal);
    this.container.appendChild(this.vertical);
    this.container.appendChild(this.canto);
  }

  _registrarObservadores() {
    // Reage a mudanças no viewBox (zoom/pan feitos pela CameraSVG)
    this._mutationObserver = new MutationObserver((mutations) => {
      if (!this.ativa) return;
      for (const m of mutations) {
        if (m.attributeName === 'viewBox') {
          this.atualizar();
          break;
        }
      }
    });
    this._mutationObserver.observe(this.svgCanvas, {
      attributes: true,
      attributeFilter: ['viewBox'],
    });

    // Reage a redimensionamento do canvas (janela, toggle da sidebar, etc.)
    this._resizeObserver = new ResizeObserver(() => {
      if (this.ativa) this.atualizar();
    });
    this._resizeObserver.observe(this.svgCanvas);
  }

  /** Escolhe um "passo" (intervalo entre marcações) legível para a escala atual. */
  _calcularPasso(escalaPxPorUnidade) {
    const passosCandidatos = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000];
    const distanciaMinimaPx = 60; // espaço mínimo confortável entre marcações

    for (const passo of passosCandidatos) {
      if (passo * escalaPxPorUnidade >= distanciaMinimaPx) return passo;
    }
    return passosCandidatos[passosCandidatos.length - 1];
  }

  /** Lê o viewBox atual (ou assume 1 unidade de documento = 1px de tela, se não houver). */
  _obterViewBox() {
    const vb = this.svgCanvas.viewBox.baseVal;
    const rect = this.svgCanvas.getBoundingClientRect();

    if (vb && vb.width > 0 && vb.height > 0) {
      return { x: vb.x, y: vb.y, width: vb.width, height: vb.height, rect };
    }
    return { x: 0, y: 0, width: rect.width, height: rect.height, rect };
  }
}
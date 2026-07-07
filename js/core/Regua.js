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
}
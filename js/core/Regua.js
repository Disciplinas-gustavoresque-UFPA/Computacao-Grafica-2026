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

  /** Recalcula e redesenha as marcações das duas réguas. Chamado automaticamente. */
  atualizar() {
    if (!this.ativa) return;

    const { x, y, width, height, rect } = this._obterViewBox();
    console.log('[Regua] atualizar()', { x, y, width, height, rect });
    if (width <= 0 || height <= 0) {
      console.warn('[Regua] largura/altura inválida, abortando desenho', { width, height });
      return;
    }

    const escalaX = rect.width / width;
    const escalaY = rect.height / height;

    this._desenharEixo(this.horizontal, x, width, escalaX, 'horizontal');
    this._desenharEixo(this.vertical, y, height, escalaY, 'vertical');
  }

  _desenharEixo(elementoRegua, origem, extensao, escala, orientacao) {
    elementoRegua.innerHTML = '';
    const passo = this._calcularPasso(escala);

    const inicio = Math.floor(origem / passo) * passo;
    const fim = origem + extensao;

    for (let valor = inicio; valor <= fim; valor += passo) {
      const posicaoPx = (valor - origem) * escala;

      const marcador = document.createElement('div');
      marcador.className = 'regua-marcador';
      marcador.style[orientacao === 'horizontal' ? 'left' : 'top'] = `${posicaoPx}px`;

      const rotulo = document.createElement('span');
      rotulo.className = 'regua-rotulo';
      rotulo.textContent = Math.round(valor);
      marcador.appendChild(rotulo);

      elementoRegua.appendChild(marcador);
    }
  }

  mostrar() {
    this.ativa = true;
    this.horizontal.classList.remove('oculto');
    this.vertical.classList.remove('oculto');
    this.canto.classList.remove('oculto');
    console.log('[Regua] mostrar() — classes agora:', {
      horizontal: this.horizontal.className,
      vertical: this.vertical.className,
    });
    this.atualizar();
  }

  esconder() {
    this.ativa = false;
    this.horizontal.classList.add('oculto');
    this.vertical.classList.add('oculto');
    this.canto.classList.add('oculto');
    console.log('[Regua] esconder()');
  }

}
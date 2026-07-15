const ESPESSURA_REGUA_PX = 20;

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

  /** Recalcula e redesenha as marcações das duas réguas. Chamado automaticamente. */
  atualizar() {
    if (!this.ativa) return;

    // Obtém a matriz CTM nativa que mapeia coordenadas SVG para pixels da tela
    const matrix = this.svgCanvas.getScreenCTM();
    if (!matrix) return;

    // Calcula a escala real (pixels por unidade de SVG) em cada eixo
    const escalaX = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
    const escalaY = Math.sqrt(matrix.c * matrix.c + matrix.d * matrix.d);

    const rectContainer = this.container.getBoundingClientRect();

    // Encontra a posição na tela da origem (0,0) do SVG relativa ao container
    const origemXContainer = matrix.e - rectContainer.left;
    const origemYContainer = matrix.f - rectContainer.top;

    // As réguas começam deslocadas pela espessura da régua perpendicular (20px)
    const offsetReguaX = origemXContainer - ESPESSURA_REGUA_PX;
    const offsetReguaY = origemYContainer - ESPESSURA_REGUA_PX;

    // Determina a faixa de coordenadas SVG visíveis em cada régua
    const origemSvgX = -offsetReguaX / escalaX;
    const extensaoSvgX = (rectContainer.width - ESPESSURA_REGUA_PX) / escalaX;

    const origemSvgY = -offsetReguaY / escalaY;
    const extensaoSvgY = (rectContainer.height - ESPESSURA_REGUA_PX) / escalaY;

    this._desenharEixo(this.horizontal, origemSvgX, extensaoSvgX, escalaX, offsetReguaX, 'horizontal');
    this._desenharEixo(this.vertical, origemSvgY, extensaoSvgY, escalaY, offsetReguaY, 'vertical');
  }

  _desenharEixo(elementoRegua, origemSvg, extensaoSvg, escala, offsetRegua, orientacao) {
    elementoRegua.innerHTML = '';
    const passo = this._calcularPasso(escala);

    const inicio = Math.floor(origemSvg / passo) * passo;
    const fim = origemSvg + extensaoSvg;

    for (let valor = inicio; valor <= fim; valor += passo) {
      // Converte a coordenada SVG para a posição em pixels na régua
      const posicaoPx = valor * escala + offsetRegua;

      // Evita renderizar marcações fora da área visível da régua
      if (posicaoPx < 0) continue;

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

  /** Alterna visibilidade. Retorna o novo estado (true = visível). */
  alternar() {
    this.ativa ? this.esconder() : this.mostrar();
    return this.ativa;
  }
}
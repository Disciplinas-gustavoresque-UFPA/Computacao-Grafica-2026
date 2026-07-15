const ESPESSURA_REGUA_PX = 20;

export class Regua {
  constructor(container, svgCanvas) {
    this.container = container;
    this.svgCanvas = svgCanvas;
    this.ativa = false;

    this.mouse = {
      clientX: 0,
      clientY: 0,
      inside: false,
    };

    this._criarElementos();
    this._registrarObservadores();
  }

  _criarElementos() {
    this.horizontal = document.createElement("div");
    this.horizontal.className = "regua regua-horizontal oculto";

    this.vertical = document.createElement("div");
    this.vertical.className = "regua regua-vertical oculto";

    this.canto = document.createElement("div");
    this.canto.className = "regua-canto oculto";

    this.container.appendChild(this.horizontal);
    this.container.appendChild(this.vertical);
    this.container.appendChild(this.canto);

    this._criarOverlay();
  }

  _criarOverlay() {
    this.overlayHorizontal = document.createElement("div");
    this.overlayHorizontal.className = "regua-overlay-horizontal";

    this.overlayVertical = document.createElement("div");
    this.overlayVertical.className = "regua-overlay-vertical";

    this.overlayLabelHorizontal = document.createElement("span");
    this.overlayLabelHorizontal.className = "regua-overlay-label";

    this.overlayLabelVertical = document.createElement("span");
    this.overlayLabelVertical.className = "regua-overlay-label";

    this.overlayHorizontal.appendChild(this.overlayLabelHorizontal);
    this.overlayVertical.appendChild(this.overlayLabelVertical);

    this.horizontal.appendChild(this.overlayHorizontal);
    this.vertical.appendChild(this.overlayVertical);

    this._estilizarOverlay(this.overlayHorizontal, "horizontal", "1px");
    this._estilizarOverlay(this.overlayVertical, "vertical", "1px");
    this._estilizarLabelOverlay(this.overlayLabelHorizontal, "horizontal");
    this._estilizarLabelOverlay(this.overlayLabelVertical, "vertical");
  }

  _registrarObservadores() {
    // Reage a mudanças no viewBox (zoom/pan feitos pela CameraSVG)
    this._mutationObserver = new MutationObserver((mutations) => {
      if (!this.ativa) return;
      for (const m of mutations) {
        if (m.attributeName === "viewBox") {
          this.atualizar();
          break;
        }
      }
    });
    this._mutationObserver.observe(this.svgCanvas, {
      attributes: true,
      attributeFilter: ["viewBox"],
    });

    // Reage a redimensionamento do canvas (janela, toggle da sidebar, etc.)
    this._resizeObserver = new ResizeObserver(() => {
      if (this.ativa) this.atualizar();
    });
    this._resizeObserver.observe(this.svgCanvas);

    this.svgCanvas.addEventListener(
      "mousemove",
      this._atualizarOverlay.bind(this),
    );

    this.svgCanvas.addEventListener(
      "mouseleave",
      this._ocultarOverlay.bind(this),
    );
  }

  /** Escolhe um "passo" (intervalo entre marcações) legível para a escala atual. */
  _calcularPasso(escalaPxPorUnidade) {
    const passosCandidatos = [
      1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000,
    ];
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

  _telaParaCanvas(clientX, clientY) {
    const { x, y, width, height, rect } = this._obterViewBox();
    return {
      x: x + ((clientX - rect.left) / rect.width) * width,
      y: y + ((clientY - rect.top) / rect.height) * height,
    };
  }

  /** Recalcula e redesenha as marcações das duas réguas. Chamado automaticamente. */
  atualizar() {
    if (!this.ativa) return;

    const { x, y, width, height, rect } = this._obterViewBox();
    console.log("[Regua] atualizar()", { x, y, width, height, rect });
    if (width <= 0 || height <= 0) {
      console.warn("[Regua] largura/altura inválida, abortando desenho", {
        width,
        height,
      });
      return;
    }

    const escalaX = rect.width / width;
    const escalaY = rect.height / height;

    this._desenharEixo(this.horizontal, x, width, escalaX, "horizontal");
    this._desenharEixo(this.vertical, y, height, escalaY, "vertical");
    if (this.mouse.inside) {
      this._reposicionarOverlay();
    }
  }

  _estilizarOverlay(overlay, orientacao, tamanho) {
    overlay.style.position = "absolute";
    overlay.style.pointerEvents = "none";
    overlay.style.zIndex = "10";
    if (orientacao === "horizontal") {
      overlay.style.width = tamanho;
      overlay.style.top = "0";
      overlay.style.bottom = "0";
    } else if (orientacao === "vertical") {
      overlay.style.height = tamanho;
      overlay.style.left = "0";
      overlay.style.right = "0";
    }
  }

  _estilizarLabelOverlay(label, orientacao) {
    label.style.position = "absolute";
    label.style.background = "#6cf";
    label.style.color = "#fff";
    label.style.fontSize = "10px";
    label.style.padding = "2px 4px";
    label.style.whiteSpace = "nowrap";
    label.style.borderRadius = "2px";
    label.style.pointerEvents = "none";
    label.style.userSelect = "none";
    if (orientacao === "horizontal") {
      label.style.left = "4px";
      label.style.top = "2px";
    } else if (orientacao === "vertical") {
      label.style.left = "2px";
      label.style.top = "4px";
    }
  }

  _atualizarOverlay(e) {
    if (!this.ativa) return;

    this.mouse.clientX = e.clientX;
    this.mouse.clientY = e.clientY;
    this.mouse.inside = true;

    this._reposicionarOverlay();
  }

  _reposicionarOverlay() {
    if (!this.mouse.inside || !this.ativa) return;

    const world = this._telaParaCanvas(this.mouse.clientX, this.mouse.clientY);

    const { rect } = this._obterViewBox();

    const x = this.mouse.clientX - rect.left;
    const y = this.mouse.clientY - rect.top;

    this.overlayHorizontal.style.left = `${x}px`;
    this.overlayVertical.style.top = `${y}px`;

    this.overlayHorizontal.style.display = "";
    this.overlayVertical.style.display = "";

    this.overlayLabelHorizontal.textContent = Math.round(world.x);
    this.overlayLabelVertical.textContent = Math.round(world.y);
  }

  _ocultarOverlay() {
    this.mouse.inside = false;
    this.overlayHorizontal.style.display = "none";
    this.overlayVertical.style.display = "none";
  }

  _limparMarcadores(elementoRegua) {
    elementoRegua
      .querySelectorAll(".regua-marcador")
      .forEach((el) => el.remove());
  }

  _desenharEixo(elementoRegua, origem, extensao, escala, orientacao) {
    this._limparMarcadores(elementoRegua);

    const passo = this._calcularPasso(escala);

    const inicio = Math.floor(origem / passo) * passo;
    const fim = origem + extensao;

    for (let valor = inicio; valor <= fim; valor += passo) {
      const posicaoPx = (valor - origem) * escala;

      const marcador = document.createElement("div");
      marcador.className = "regua-marcador";
      marcador.style[orientacao === "horizontal" ? "left" : "top"] =
        `${posicaoPx}px`;

      const rotulo = document.createElement("span");
      rotulo.className = "regua-rotulo";
      rotulo.textContent = Math.round(valor);
      marcador.appendChild(rotulo);

      elementoRegua.appendChild(marcador);
    }
  }

  mostrar() {
    this.ativa = true;
    this.horizontal.classList.remove("oculto");
    this.vertical.classList.remove("oculto");
    this.canto.classList.remove("oculto");
    this._ocultarOverlay();
    console.log("[Regua] mostrar() — classes agora:", {
      horizontal: this.horizontal.className,
      vertical: this.vertical.className,
    });
    this.atualizar();
  }

  esconder() {
    this.ativa = false;
    this.horizontal.classList.add("oculto");
    this.vertical.classList.add("oculto");
    this.canto.classList.add("oculto");
    this._ocultarOverlay();
    console.log("[Regua] esconder()");
  }

  /** Alterna visibilidade. Retorna o novo estado (true = visível). */
  alternar() {
    this.ativa ? this.esconder() : this.mostrar();
    return this.ativa;
  }
}

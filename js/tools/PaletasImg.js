export class PaletaImg {
  constructor(container) {
    this.container = container;
    this.paletas = [];

    if (!this.container) return;

    this.btnImportar = document.getElementById("btn-importar-paletas");
    this.btnRemover = document.getElementById("btn-remover-paletas");
    this.inputPaleta = document.getElementById("input-imagem-referencia");

    this.qtdCores = 5;
    this.tamCard = "76px";
    this.paletaSelecionada = null;

    this.initUI();
    this.initEvents();
  }

  initUI() {
    this.container.style.display = "flex";
    this.container.style.flexWrap = "wrap";
    this.container.style.gap = "12px";
    this.container.style.padding = "10px";
    this.container.style.overflowY = "auto";
    this.container.style.minHeight = "150px";
    this.container.style.border = "1px dashed #555";

    // Texto de placeholder
    this.placeholder = document.createElement("span");
    this.placeholder.textContent = "Arraste imagens aqui";
    this.placeholder.style.color = "#888";
    this.placeholder.style.margin = "auto";
    this.container.appendChild(this.placeholder);

    if (this.btnRemover) {
      this.btnRemover.disabled = true;
    }
  }

  initEvents() {
    if (this.btnImportar && this.inputPaleta) {
      this.btnImportar.addEventListener("click", () => {
        this.inputPaleta.click();
      });

      this.inputPaleta.addEventListener("change", (e) => {
        const files = Array.from(e.target.files).filter((file) =>
          file.type.startsWith("image/"),
        );
        files.forEach((file) => this.carregarArquivo(file));

        e.target.value = "";
      });
    }

    if (this.btnRemover) {
      this.btnRemover.addEventListener("click", () => {
        this.removerSelecionado();
      });
    }

    this.container.addEventListener("dragover", (e) => {
      e.preventDefault();
      this.container.classList.add("dragover");
    });

    this.container.addEventListener("dragleave", () => {
      this.container.classList.remove("dragover");
    });

    this.container.addEventListener("drop", (e) => {
      e.preventDefault();
      this.container.classList.remove("dragover");

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/"),
      );

      files.forEach((file) => this.carregarArquivo(file));
    });
  }

  carregarArquivo(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      if (this.placeholder && this.placeholder.parentNode === this.container) {
        this.placeholder.remove();
      }

      // Container individual para agrupar Imagem e Paleta
      const card = document.createElement("div");
      card.className = "paleta-card";

      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.gap = "4px";
      card.style.width = this.tamCard;
      card.style.padding = "4px";
      card.style.borderRadius = "4px";
      card.style.transition = "background-color 0.2s";

      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.width = "68px";
      img.style.height = "68px";
      img.style.objectFit = "cover";
      img.style.cursor = "pointer";
      img.style.borderRadius = "4px";
      img.style.border = "1px solid transparent";

      card.appendChild(img);

      card.addEventListener("click", () => {
        this.paletas.forEach((item) => {
          item.element.classList.remove("selecionada");
          item.element.style.backgroundColor = "transparent";
        });

        card.classList.add("selecionada");
        card.style.backgroundColor = "rgba(102, 204, 255, 0.15)";

        this.paletaSelecionada = card;

        if (this.btnRemover) {
          this.btnRemover.disabled = false;
        }

        document.dispatchEvent(
          new CustomEvent("paletaSelecionada", {
            detail: img.src,
          }),
        );
      });

      // processa as cores dominantes
      img.onload = () => {
        const paleta = this.extrairCores(img, this.qtdCores);
        const paletaUI = this.criarPaletaUI(paleta);
        card.appendChild(paletaUI);
      };

      this.paletas.push({ file, element: card });
      this.container.appendChild(card);
    };

    reader.readAsDataURL(file);
  }

  // Remover o card selecionado
  removerSelecionado() {
    if (!this.paletaSelecionada) return;

    this.paletas = this.paletas.filter(
      (item) => item.element !== this.paletaSelecionada,
    );

    this.paletaSelecionada.remove();
    this.paletaSelecionada = null;

    if (this.btnRemover) {
      this.btnRemover.disabled = true;
    }

    if (this.paletas.length === 0 && this.placeholder) {
      this.container.appendChild(this.placeholder);
    }
  }

  extrairCores(imgElement, quantidadeCores = 5) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    canvas.width = 50;
    canvas.height = 50;

    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const colorCounts = {};

    for (let i = 0; i < imageData.length; i += 4) {
      const r = imageData[i];
      const g = imageData[i + 1];
      const b = imageData[i + 2];
      const a = imageData[i + 3];

      if (a < 128) continue;

      const step = 32;
      const rQuant = Math.round(r / step) * step;
      const gQuant = Math.round(g / step) * step;
      const bQuant = Math.round(b / step) * step;

      const hex = this.rgbParaHex(rQuant, gQuant, bQuant);
      colorCounts[hex] = (colorCounts[hex] || 0) + 1;
    }

    return Object.entries(colorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, quantidadeCores)
      .map((entry) => entry[0]);
  }

  criarPaletaUI(coresHex) {
    const paletaContainer = document.createElement("div");
    paletaContainer.style.display = "flex";
    paletaContainer.style.width = "100%";
    paletaContainer.style.height = "12px";
    paletaContainer.style.borderRadius = "2px";
    paletaContainer.style.overflow = "hidden";

    coresHex.forEach((cor) => {
      const swatch = document.createElement("div");
      swatch.style.flex = "1";
      swatch.style.backgroundColor = cor;
      swatch.title = cor;
      swatch.style.cursor = "pointer";

      swatch.addEventListener("click", (e) => {
        e.stopPropagation();

        const inputPreenchimento =
          document.querySelector("#cor-preenchimento") ||
          document.querySelector('input[type="color"]:first-of-type');
        const inputBorda =
          document.querySelector("#cor-borda") ||
          document.querySelector('input[type="color"]:last-of-type');

        const alvoInput = e.shiftKey ? inputBorda : inputPreenchimento;
        if (alvoInput) {
          alvoInput.value = cor;
          const eventoSintetico = new Event("input", { bubbles: true });
          alvoInput.dispatchEvent(eventoSintetico);
        }
      });

      paletaContainer.appendChild(swatch);
    });

    return paletaContainer;
  }

  rgbParaHex(r, g, b) {
    r = Math.min(255, Math.max(0, r));
    g = Math.min(255, Math.max(0, g));
    b = Math.min(255, Math.max(0, b));
    return (
      "#" +
      ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()
    );
  }
}

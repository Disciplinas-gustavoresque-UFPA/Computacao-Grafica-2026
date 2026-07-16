export class PaletaImg {
  constructor(container) {
    this.container = container;
    this.paletas = [];

    if (!this.container) return;

    this.btnImportar = document.getElementById("btn-importar-paletas");
    this.btnRemover = document.getElementById("btn-remover-paletas");
    this.inputPaleta = document.getElementById("input-arquivo-referencia");

    this.qtdCores = 10;
    this.paletaSelecionada = null;

    this.initUI();
    this.initEvents();
  }

  initUI() {
    this.container.classList.add("paleta-container");

    // Texto de placeholder
    this.placeholder = document.createElement("span");
    this.placeholder.className = "paleta-placeholder";
    this.placeholder.textContent = "Arraste imagens aqui";
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

      // Container individual (Card)
      const card = document.createElement("div");
      card.className = "paleta-card";

      const img = document.createElement("img");
      img.className = "paleta-img";

      img.onload = () => {
        const paleta = this.extrairCores(img, this.qtdCores);
        const paletaUI = this.criarPaletaUI(paleta);
        card.appendChild(paletaUI);
      };

      img.src = e.target.result;
      card.appendChild(img);

      card.addEventListener("click", () => {
        this.paletas.forEach((item) => {
          item.element.classList.remove("selecionada");
        });

        card.classList.add("selecionada");
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

      this.paletas.push({ file, element: card });
      this.container.appendChild(card);
    };

    reader.readAsDataURL(file);
  }

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
    const ctx = canvas.getContext("2d", {
      willReadFrequently: true,
    });

    const maxSize = 300;

    const scale = Math.min(
      maxSize / imgElement.width,
      maxSize / imgElement.height,
      1,
    );

    canvas.width = Math.round(imgElement.width * scale);
    canvas.height = Math.round(imgElement.height * scale);

    ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);

    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    const grupos = [];

    const sample = 2; // pula pixels
    const step = 16; // quantização

    for (let y = 0; y < canvas.height; y += sample) {
      for (let x = 0; x < canvas.width; x += sample) {
        const i = (y * canvas.width + x) * 4;

        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a < 128) continue;

        const rq = Math.round(r / step) * step;
        const gq = Math.round(g / step) * step;
        const bq = Math.round(b / step) * step;

        // ignora branco e preto
        if (rq > 245 && gq > 245 && bq > 245) continue;

        if (rq < 15 && gq < 15 && bq < 15) continue;

        let encontrado = false;

        for (const grupo of grupos) {
          const dist =
            Math.abs(grupo.r - rq) +
            Math.abs(grupo.g - gq) +
            Math.abs(grupo.b - bq);

          if (dist < 35) {
            grupo.r = (grupo.r * grupo.count + rq) / (grupo.count + 1);

            grupo.g = (grupo.g * grupo.count + gq) / (grupo.count + 1);

            grupo.b = (grupo.b * grupo.count + bq) / (grupo.count + 1);

            grupo.count++;

            encontrado = true;
            break;
          }
        }

        if (!encontrado) {
          grupos.push({
            r: rq,
            g: gq,
            b: bq,
            count: 1,
          });
        }
      }
    }

    grupos.sort((a, b) => b.count - a.count);

    return grupos
      .slice(0, quantidadeCores)
      .map((c) =>
        this.rgbParaHex(Math.round(c.r), Math.round(c.g), Math.round(c.b)),
      );
  }
  criarPaletaUI(coresHex) {
    const paletaContainer = document.createElement("div");
    paletaContainer.className = "paleta-ui";

    coresHex.forEach((cor) => {
      const swatch = document.createElement("div");
      swatch.className = "paleta-swatch";
      swatch.style.backgroundColor = cor;
      swatch.title = cor;

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

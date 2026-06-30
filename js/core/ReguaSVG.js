export class ReguaSVG {
  constructor(horizontalCanvas, verticalCanvas, camera) {
    this.hCanvas = horizontalCanvas;
    this.vCanvas = verticalCanvas;

    this.hCtx = this.hCanvas.getContext("2d");
    this.vCtx = this.vCanvas.getContext("2d");

    this.camera = camera;
    this.svg = camera.svgs[0];
    this.waitForLayout();
  }

  waitForLayout() {
    const check = () => {
      const svgRect = this.svg.getBoundingClientRect();

      console.log("SVG:", svgRect.width, svgRect.height);

      if (svgRect.width > 0 && svgRect.height > 0) {
        this.setupCanvas();

        this.render();

        console.log("Régua pronta");

        return;
      }

      requestAnimationFrame(check);
    };

    check();
  }

  setupCanvas() {
    const svgRect = this.svg.getBoundingClientRect();

    const rulerSize = 28;

    // Horizontal
    this.hCanvas.width = svgRect.width;

    this.hCanvas.height = rulerSize;

    // Vertical
    this.vCanvas.width = rulerSize;

    this.vCanvas.height = svgRect.height;

    console.log("Canvas configurado:", this.hCanvas.width, this.vCanvas.height);
  }

  getStep() {
    const vb = this.camera.viewBox;

    // unidades SVG existentes por pixel
    const unitsPerPixel = vb.width / this.hCanvas.width;

    // distãncia entre traços
    const targetPixels = 80;

    // step bruto
    const rawStep = unitsPerPixel * targetPixels;

    // normalização
    const pow10 = Math.pow(10, Math.floor(Math.log10(rawStep)));

    const normalized = rawStep / pow10;

    let step;

    if (normalized < 2) {
      step = 1;
    } else if (normalized < 5) {
      step = 2;
    } else {
      step = 5;
    }

    return step * pow10;
  }
  render() {
    this.renderHorizontal();
    this.renderVertical();
  }

  renderHorizontal() {
    const ctx = this.hCtx;

    const width = this.hCanvas.width;
    const height = this.hCanvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "#c9d1d9";
    ctx.fillStyle = "#414141";

    ctx.font = "12px sans-serif";

    const vb = this.camera.viewBox;

    const step = this.getStep();

    const start = Math.floor(vb.x / step) * step;

    for (let value = start; value <= vb.x + vb.width; value += step) {
      const x = ((value - vb.x) / vb.width) * width;

      const label = Math.round(value);

      // Traço
      ctx.beginPath();

      ctx.moveTo(x, height);
      ctx.lineTo(x, height - 10);

      ctx.stroke();

      // Texto
      ctx.fillText(label, x + 4, 10);
    }
  }

  renderVertical() {
    const ctx = this.vCtx;

    const width = this.vCanvas.width;
    const height = this.vCanvas.height;

    ctx.clearRect(0, 0, width, height);

    ctx.strokeStyle = "#c9d1d9"; // cor barra
    ctx.fillStyle = "#414141"; // cor texto

    ctx.font = "12px sans-serif";

    const vb = this.camera.viewBox;

    const step = this.getStep();

    const start = Math.floor(vb.y / step) * step;

    for (let value = start; value <= vb.y + vb.height; value += step) {
      const y = ((value - vb.y) / vb.height) * height;

      const label = Math.round(value);

      // Traço
      ctx.beginPath();

      ctx.moveTo(width, y);
      ctx.lineTo(width - 10, y);

      ctx.stroke();

      // Texto
      ctx.save();

      ctx.translate(10, y + 4);

      ctx.rotate(-Math.PI / 2);

      ctx.fillText(label, 0, 0);

      ctx.restore();
    }
  }
}

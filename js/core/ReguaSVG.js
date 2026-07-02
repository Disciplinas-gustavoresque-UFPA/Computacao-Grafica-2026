export class ReguaSVG {
  constructor(
    hBaseCanvas,
    hOverlayCanvas,
    vBaseCanvas,
    vOverlayCanvas,
    camera,
  ) {
    this.camera = camera;
    this.svg = camera.svgs[0];

    this.hCanvas = hBaseCanvas;
    this.vCanvas = vBaseCanvas;

    this.hCtx = this.hCanvas.getContext("2d");
    this.vCtx = this.vCanvas.getContext("2d");
    this.dpr = window.devicePixelRatio || 1;

    this.hOverlayCanvas = hOverlayCanvas;
    this.vOverlayCanvas = vOverlayCanvas;
    this.hOverlayCtx = this.hOverlayCanvas.getContext("2d");
    this.vOverlayCtx = this.vOverlayCanvas.getContext("2d");

    this.tickColor = "#fff";
    this.numberColor = "#fff";
    this.textFont = "10px system-ui";

    this.overlayColor = "#6cf";
    this.overlayTextColor = "#ffffff";
    this.overlayFont = "10px system-ui";

    this.rulerSize = 28;

    this.mouse = {
      screenX: 0,
      screenY: 0,
      worldX: 0,
      worldY: 0,
      inside: false,
    };

    this.overlayDirty = true;
    this.waitForLayout();
  }

  waitForLayout() {
    const check = () => {
      const svgRect = this.svg.getBoundingClientRect();

      if (svgRect.width > 0 && svgRect.height > 0) {
        this.setupCanvas();
        this.initEvents();
        this.render();
        this.overlayLoop();
        return;
      }

      requestAnimationFrame(check);
    };

    check();
  }

  setupCanvas() {
    const svgRect = this.svg.getBoundingClientRect();
    const dpr = this.dpr;
    const width = Math.round(svgRect.width);
    const height = Math.round(svgRect.height);

    if (width === 0 || height === 0) return;

    // Horizontal Base
    this.hCanvas.width = width * dpr;
    this.hCanvas.height = this.rulerSize * dpr;
    this.hCanvas.style.width = `${width}px`;
    this.hCanvas.style.height = `${this.rulerSize}px`;
    this.hCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.hCtx.scale(dpr, dpr);

    // Horizontal Overlay
    this.hOverlayCanvas.width = width * dpr;
    this.hOverlayCanvas.height = this.rulerSize * dpr;
    this.hOverlayCanvas.style.width = `${width}px`;
    this.hOverlayCanvas.style.height = `${this.rulerSize}px`;
    this.hOverlayCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.hOverlayCtx.scale(dpr, dpr);

    // Vertical Base
    this.vCanvas.width = this.rulerSize * dpr;
    this.vCanvas.height = height * dpr;
    this.vCanvas.style.width = `${this.rulerSize}px`;
    this.vCanvas.style.height = `${height}px`;
    this.vCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.vCtx.scale(dpr, dpr);

    // Vertical Overlay
    this.vOverlayCanvas.width = this.rulerSize * dpr;
    this.vOverlayCanvas.height = height * dpr;
    this.vOverlayCanvas.style.width = `${this.rulerSize}px`;
    this.vOverlayCanvas.style.height = `${height}px`;
    this.vOverlayCtx.setTransform(1, 0, 0, 1, 0, 0);
    this.vOverlayCtx.scale(dpr, dpr);
  }

  initEvents() {
    window.addEventListener("resize", () => {
      this.setupCanvas();
      this.render();
      this.overlayDirty = true;
    });

    this.svg.addEventListener("mousemove", this.handleMouseMove.bind(this));
    this.svg.addEventListener("mouseleave", this.handleMouseLeave.bind(this));

    this.camera.addListener(() => {
      this.render();
      this.overlayDirty = true;
    });
  }

  overlayLoop() {
    if (this.mouse.inside && this.overlayDirty) {
      this.renderOverlay();
      this.overlayDirty = false;
    }
    requestAnimationFrame(() => this.overlayLoop());
  }

  getScaleData() {
    const vb = this.camera.viewBox;
    const currentWidth = this.hCanvas.width / this.dpr;

    // Proteção estrita contra divisão por zero ou dados inválidos
    if (!vb || vb.width <= 0 || currentWidth <= 0) {
      return { majorStep: 100, minorStep: 20, microStep: 10 };
    }

    const pixelsPerUnit = currentWidth / vb.width;
    const targetMajorPx = 100;
    const rawMajor = targetMajorPx / pixelsPerUnit;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawMajor)));
    const normalized = rawMajor / magnitude;

    let major;
    if (normalized < 1.5) major = 1;
    else if (normalized < 3) major = 2;
    else if (normalized < 7) major = 5;
    else major = 10;

    major *= magnitude;
    const pxPerMajor = major * pixelsPerUnit;

    let subdivisions = 2;
    if (pxPerMajor > 400) subdivisions = 10;
    else if (pxPerMajor > 250) subdivisions = 5;
    else if (pxPerMajor > 140) subdivisions = 4;

    const minorStep = major / 2; // subdivisions;
    const microStep = minorStep / 5; // 2;

    return {
      majorStep: parseFloat(major.toPrecision(12)),
      minorStep: parseFloat(minorStep.toPrecision(12)),
      microStep: parseFloat(microStep.toPrecision(12)),
    };
  }

  getLabelPrecision(step) {
    if (step >= 1) return 0;
    return Math.ceil(Math.abs(Math.log10(step)));
  }

  screenToWorld(clientX, clientY) {
    const rect = this.svg.getBoundingClientRect();
    const vb = this.camera.viewBox;
    if (rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };

    const x = vb.x + ((clientX - rect.left) / rect.width) * vb.width;
    const y = vb.y + ((clientY - rect.top) / rect.height) * vb.height;
    return { x, y };
  }

  worldToScreenX(value) {
    const vb = this.camera.viewBox;
    const viewWidth = this.hCanvas.width / this.dpr;
    return ((value - vb.x) / vb.width) * viewWidth;
  }

  worldToScreenY(value) {
    const vb = this.camera.viewBox;
    const viewHeight = this.vCanvas.height / this.dpr;
    return ((value - vb.y) / vb.height) * viewHeight;
  }

  isMultiple(value, step) {
    if (step === 0) return false;
    const ratio = value / step;
    return Math.abs(ratio - Math.round(ratio)) < 0.00001;
  }

  handleMouseMove(event) {
    const rect = this.svg.getBoundingClientRect();
    this.mouse.screenX = event.clientX - rect.left;
    this.mouse.screenY = event.clientY - rect.top;

    const world = this.screenToWorld(event.clientX, event.clientY);
    this.mouse.worldX = world.x;
    this.mouse.worldY = world.y;
    this.mouse.inside = true;
    this.overlayDirty = true;
    this.renderOverlay();
  }

  handleMouseLeave() {
    this.mouse.inside = false;
    this.overlayDirty = true;
  }

  render() {
    if (this.hCanvas.width === 0 || this.vCanvas.height === 0) return;
    this.renderHorizontal();
    this.renderVertical();
  }

  renderOverlay() {
    if (this.hOverlayCanvas.width === 0 || this.vOverlayCanvas.height === 0)
      return;
    this.renderHorizontalOverlay();
    this.renderVerticalOverlay();
  }

  renderHorizontal() {
    const ctx = this.hCtx;
    const width = this.hCanvas.width / this.dpr;
    const height = this.hCanvas.height / this.dpr;
    const vb = this.camera.viewBox;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.hCanvas.width, this.hCanvas.height);
    ctx.scale(this.dpr, this.dpr);

    const { majorStep, minorStep, microStep } = this.getScaleData();
    if (microStep <= 0 || isNaN(microStep)) return;

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.tickColor;
    ctx.fillStyle = this.numberColor;
    ctx.font = this.textFont;

    // MICRO
    ctx.beginPath();
    const microStart = Math.floor(vb.x / microStep) * microStep;
    const microCount = Math.ceil(vb.width / microStep) + 4;

    for (let i = 0; i < microCount; i++) {
      const value = microStart + i * microStep;
      if (
        this.isMultiple(value, majorStep) ||
        this.isMultiple(value, minorStep)
      )
        continue;
      const x = Math.round(this.worldToScreenX(value));
      ctx.moveTo(x, height);
      ctx.lineTo(x, height - 4);
    }
    ctx.stroke();

    // MINOR
    ctx.beginPath();
    const minorStart = Math.floor(vb.x / minorStep) * minorStep;
    const minorCount = Math.ceil(vb.width / minorStep) + 4;

    for (let i = 0; i < minorCount; i++) {
      const value = minorStart + i * minorStep;
      if (this.isMultiple(value, majorStep)) continue;
      const x = Math.round(this.worldToScreenX(value));
      ctx.moveTo(x, height);
      ctx.lineTo(x, height - 7);
    }
    ctx.stroke();

    // MAJOR & LABELS
    const precision = this.getLabelPrecision(majorStep);
    ctx.beginPath();
    const majorStart = Math.floor(vb.x / majorStep) * majorStep;
    const majorCount = Math.ceil(vb.width / majorStep) + 4;

    for (let i = 0; i < majorCount; i++) {
      const value = majorStart + i * majorStep;
      const x = Math.round(this.worldToScreenX(value));
      ctx.moveTo(x, height);
      ctx.lineTo(x, height - 12);

      const label = Number(value.toFixed(precision));
      ctx.fillText(label, x + 4, 12);
    }
    ctx.stroke();
  }

  renderVertical() {
    const ctx = this.vCtx;
    const width = this.vCanvas.width / this.dpr;
    const height = this.vCanvas.height / this.dpr;
    const vb = this.camera.viewBox;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.vCanvas.width, this.vCanvas.height);
    ctx.scale(this.dpr, this.dpr);

    const { majorStep, minorStep, microStep } = this.getScaleData();
    if (microStep <= 0 || isNaN(microStep)) return;

    ctx.lineWidth = 1;
    ctx.strokeStyle = this.tickColor;
    ctx.fillStyle = this.numberColor;
    ctx.font = this.textFont;

    // MICRO
    ctx.beginPath();
    const microStart = Math.floor(vb.y / microStep) * microStep;
    const microCount = Math.ceil(vb.height / microStep) + 4;

    for (let i = 0; i < microCount; i++) {
      const value = microStart + i * microStep;
      if (
        this.isMultiple(value, majorStep) ||
        this.isMultiple(value, minorStep)
      )
        continue;
      const y = Math.round(this.worldToScreenY(value));
      ctx.moveTo(width, y);
      ctx.lineTo(width - 4, y);
    }
    ctx.stroke();

    // MINOR
    ctx.beginPath();
    const minorStart = Math.floor(vb.y / minorStep) * minorStep;
    const minorCount = Math.ceil(vb.height / minorStep) + 4;

    for (let i = 0; i < minorCount; i++) {
      const value = minorStart + i * minorStep;
      if (this.isMultiple(value, majorStep)) continue;
      const y = Math.round(this.worldToScreenY(value));
      ctx.moveTo(width, y);
      ctx.lineTo(width - 7, y);
    }
    ctx.stroke();

    // MAJOR & LABELS
    const precision = this.getLabelPrecision(majorStep);
    ctx.beginPath();
    const majorStart = Math.floor(vb.y / majorStep) * majorStep;
    const majorCount = Math.ceil(vb.height / majorStep) + 4;

    for (let i = 0; i < majorCount; i++) {
      const value = majorStart + i * majorStep;
      const y = Math.round(this.worldToScreenY(value));
      ctx.moveTo(width, y);
      ctx.lineTo(width - 12, y);

      const label = Number(value.toFixed(precision));
      ctx.save();
      ctx.translate(10, y + 4);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
    ctx.stroke();
  }

  renderHorizontalOverlay() {
    const ctx = this.hOverlayCtx;
    const width = this.hOverlayCanvas.width;
    const height = this.hOverlayCanvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.scale(this.dpr, this.dpr);

    if (!this.mouse.inside) return;

    const x = this.mouse.screenX;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height / this.dpr);
    ctx.strokeStyle = this.overlayColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = this.overlayColor;
    ctx.fillRect(x - 18, 0, 36, 16);

    ctx.fillStyle = this.overlayTextColor;
    ctx.font = this.overlayFont;
    ctx.fillText(Math.round(this.mouse.worldX), x - 12, 11);
  }

  renderVerticalOverlay() {
    const ctx = this.vOverlayCtx;
    const width = this.vOverlayCanvas.width;
    const height = this.vOverlayCanvas.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.scale(this.dpr, this.dpr);

    if (!this.mouse.inside) return;

    const y = this.mouse.screenY;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width / this.dpr, y);
    ctx.strokeStyle = this.overlayColor;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = this.overlayColor;
    ctx.fillRect(0, y - 20, 18, 32);

    ctx.save();
    ctx.translate(10, y + 6);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = this.overlayTextColor;
    ctx.font = this.overlayFont;
    ctx.fillText(Math.round(this.mouse.worldY), 0, 0);
    ctx.restore();
  }
}

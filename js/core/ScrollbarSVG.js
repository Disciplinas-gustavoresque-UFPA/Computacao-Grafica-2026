// js/core/ScrollbarSVG.js

/**
 * ScrollbarSVG
 *
 * Scrollbars customizadas que se integram ao CameraSVG.
 * Criadas como elementos HTML posicionados sobre as bordas do canvasContainer.
 *
 * - A scrollbar reflete a posição e o tamanho do viewBox atual.
 * - Arrastar o thumb chama camera.pan para mover o viewBox.
 * - Atualiza automaticamente ao zoom (Ctrl+Scroll ou LupaTool).
 *
 * Uso:
 *   const sb = new ScrollbarSVG(canvasContainer, svgCanvas, cameraGlobal);
 *   // Para atualizar manualmente (ex: após zoom externo):
 *   sb.atualizar();
 */
export class ScrollbarSVG {
  constructor(container, svgCanvas, camera) {
    this.container = container;
    this.svgCanvas  = svgCanvas;
    this.camera     = camera;

    // Tamanho virtual do canvas (área total navegável)
    // Usa as dimensões iniciais do viewBox * 4 como espaço total
    this.canvasVirtual = {
      x: -camera.initialViewBox.width,
      y: -camera.initialViewBox.height,
      width:  camera.initialViewBox.width  * 4,
      height: camera.initialViewBox.height * 4,
    };

    this._criarScrollbars();
    this._observarViewBox();
    this.atualizar();
  }

  // ─── Criação dos elementos ────────────────────────────────────

  _criarScrollbars() {
    const espessura = 10;

    // ── Horizontal ──
    this.trackH = document.createElement('div');
    Object.assign(this.trackH.style, {
      position: 'absolute',
      bottom: '0',
      left: '20px',   // respeita largura da régua
      right: `${espessura}px`,
      height: `${espessura}px`,
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '4px',
      zIndex: '10',
      cursor: 'default',
    });

    this.thumbH = document.createElement('div');
    Object.assign(this.thumbH.style, {
      position: 'absolute',
      top: '1px',
      height: `${espessura - 2}px`,
      background: 'rgba(255,255,255,0.35)',
      borderRadius: '4px',
      cursor: 'grab',
      transition: 'background 0.15s',
    });
    this.thumbH.addEventListener('mouseenter', () => {
      this.thumbH.style.background = 'rgba(255,255,255,0.6)';
    });
    this.thumbH.addEventListener('mouseleave', () => {
      this.thumbH.style.background = 'rgba(255,255,255,0.35)';
    });
    this.trackH.appendChild(this.thumbH);
    this.container.appendChild(this.trackH);

    // ── Vertical ──
    this.trackV = document.createElement('div');
    Object.assign(this.trackV.style, {
      position: 'absolute',
      right: '0',
      top: '20px',    // respeita altura da régua
      bottom: `${espessura}px`,
      width: `${espessura}px`,
      background: 'rgba(0,0,0,0.1)',
      borderRadius: '4px',
      zIndex: '10',
      cursor: 'default',
    });

    this.thumbV = document.createElement('div');
    Object.assign(this.thumbV.style, {
      position: 'absolute',
      left: '1px',
      width: `${espessura - 2}px`,
      background: 'rgba(255,255,255,0.35)',
      borderRadius: '4px',
      cursor: 'grab',
      transition: 'background 0.15s',
    });
    this.thumbV.addEventListener('mouseenter', () => {
      this.thumbV.style.background = 'rgba(255,255,255,0.6)';
    });
    this.thumbV.addEventListener('mouseleave', () => {
      this.thumbV.style.background = 'rgba(255,255,255,0.35)';
    });
    this.trackV.appendChild(this.thumbV);
    this.container.appendChild(this.trackV);

    // ── Drag handlers ──
    this._initDragH();
    this._initDragV();
  }

  // ─── Drag horizontal ─────────────────────────────────────────

  _initDragH() {
    let startX, startVBX;

    const onMove = (e) => {
      const dx = e.clientX - startX;
      const trackW = this.trackH.clientWidth;
      const cv = this.canvasVirtual;

      // converte pixels de drag → unidades SVG
      const ratio = cv.width / trackW;
      const novoX = Math.min(
        Math.max(startVBX + dx * ratio, cv.x),
        cv.x + cv.width - this.camera.viewBox.width
      );

      this.camera.viewBox.x = novoX;
      this.camera.applyViewBox();
      this.atualizar();
    };

    const onUp = () => {
      this.thumbH.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    this.thumbH.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startX   = e.clientX;
      startVBX = this.camera.viewBox.x;
      this.thumbH.style.cursor = 'grabbing';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  // ─── Drag vertical ───────────────────────────────────────────

  _initDragV() {
    let startY, startVBY;

    const onMove = (e) => {
      const dy = e.clientY - startY;
      const trackH = this.trackV.clientHeight;
      const cv = this.canvasVirtual;

      const ratio = cv.height / trackH;
      const novoY = Math.min(
        Math.max(startVBY + dy * ratio, cv.y),
        cv.y + cv.height - this.camera.viewBox.height
      );

      this.camera.viewBox.y = novoY;
      this.camera.applyViewBox();
      this.atualizar();
    };

    const onUp = () => {
      this.thumbV.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    this.thumbV.addEventListener('mousedown', (e) => {
      e.preventDefault();
      startY   = e.clientY;
      startVBY = this.camera.viewBox.y;
      this.thumbV.style.cursor = 'grabbing';
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    });
  }

  // ─── Atualizar posição e tamanho dos thumbs ──────────────────

  atualizar() {
    const vb = this.camera.viewBox;
    const cv = this.canvasVirtual;

    // expande canvas virtual se viewBox sair dos limites
    if (vb.x < cv.x) { cv.x = vb.x - 50; cv.width += (cv.x - vb.x + 50); }
    if (vb.y < cv.y) { cv.y = vb.y - 50; cv.height += (cv.y - vb.y + 50); }
    if (vb.x + vb.width  > cv.x + cv.width)  cv.width  = vb.x + vb.width  - cv.x + 50;
    if (vb.y + vb.height > cv.y + cv.height) cv.height = vb.y + vb.height - cv.y + 50;

    const trackW = this.trackH.clientWidth;
    const trackH = this.trackV.clientHeight;

    // ── Horizontal ──
    const ratioX    = (vb.x - cv.x) / cv.width;
    const ratioW    = vb.width / cv.width;
    const thumbW    = Math.max(ratioW * trackW, 20);
    const thumbLeft = Math.min(ratioX * trackW, trackW - thumbW);

    this.thumbH.style.left  = `${thumbLeft}px`;
    this.thumbH.style.width = `${thumbW}px`;

    // ── Vertical ──
    const ratioY    = (vb.y - cv.y) / cv.height;
    const ratioH    = vb.height / cv.height;
    const thumbTop  = ratioY * trackH;
    const thumbH2   = Math.max(ratioH * trackH, 20);

    this.thumbV.style.top    = `${thumbTop}px`;
    this.thumbV.style.height = `${thumbH2}px`;
  }

  // ─── Observa mudanças no viewBox do SVG ──────────────────────

  _observarViewBox() {
    const observer = new MutationObserver(() => this.atualizar());
    observer.observe(this.svgCanvas, {
      attributes: true,
      attributeFilter: ['viewBox'],
    });
  }
}

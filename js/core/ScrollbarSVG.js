// js/core/ScrollbarSVG.js

/**
 * ScrollbarSVG
 *
 * Scrollbars customizadas que se integram ao CameraSVG.
 * Criadas como elementos HTML posicionados sobre as bordas do canvasContainer.
 *
 * - A scrollbar reflete a posição e o tamanho do viewBox atual.
 * - Arrastar o thumb move o viewBox via camera.applyViewBox().
 * - Atualiza automaticamente ao zoom (Ctrl+Scroll ou LupaTool).
 * - Correção aplicada (carolinalimaal): thumbLeft/thumbTop calculados após
 *   thumbW/thumbH2 para evitar que o thumb ultrapasse a borda da trilha.
 *
 * Uso:
 *   const sb = new ScrollbarSVG(canvasContainer, svgCanvas, cameraGlobal);
 *   sb.atualizar(); // chame manualmente após zoom externo se necessário
 */
export class ScrollbarSVG {
  constructor(container, svgCanvas, camera) {
    this.container = container;
    this.svgCanvas = svgCanvas;
    this.camera    = camera;

    // Área total navegável (canvas virtual)
    this.canvasVirtual = {
      x:      -camera.initialViewBox.width,
      y:      -camera.initialViewBox.height,
      width:   camera.initialViewBox.width  * 4,
      height:  camera.initialViewBox.height * 4,
    };

    this._criarScrollbars();
    this._observarViewBox();
    this.atualizar();
  }

  // ─── Criação dos elementos ────────────────────────────────────

  _criarScrollbars() {
    const espessura = 12;

    // Cores do tema do editor
    const corTrack = '#0f3460';      // --cor-fundo-barra
    const corThumb = '#4a90d9';      // --cor-destaque
    const corThumbHover = '#72aaec'; // destaque mais claro no hover

    // ── Track Horizontal ──
    this.trackH = document.createElement('div');
    Object.assign(this.trackH.style, {
      position:     'absolute',
      bottom:       '0',
      left:         '20px',
      right:        `${espessura}px`,
      height:       `${espessura}px`,
      background:   corTrack,
      borderRadius: '6px',
      zIndex:       '10',
      cursor:       'default',
    });

    // ── Thumb Horizontal ──
    this.thumbH = document.createElement('div');
    Object.assign(this.thumbH.style, {
      position:     'absolute',
      top:          '2px',
      height:       `${espessura - 4}px`,
      background:   corThumb,
      borderRadius: '6px',
      cursor:       'grab',
      transition:   'background 0.15s',
      boxShadow:    '0 1px 4px rgba(0,0,0,0.4)',
    });
    this.thumbH.addEventListener('mouseenter', () => {
      this.thumbH.style.background = corThumbHover;
    });
    this.thumbH.addEventListener('mouseleave', () => {
      this.thumbH.style.background = corThumb;
    });
    this.trackH.appendChild(this.thumbH);
    this.container.appendChild(this.trackH);

    // ── Track Vertical ──
    this.trackV = document.createElement('div');
    Object.assign(this.trackV.style, {
      position:     'absolute',
      right:        '0',
      top:          '20px',
      bottom:       `${espessura}px`,
      width:        `${espessura}px`,
      background:   corTrack,
      borderRadius: '6px',
      zIndex:       '10',
      cursor:       'default',
    });

    // ── Thumb Vertical ──
    this.thumbV = document.createElement('div');
    Object.assign(this.thumbV.style, {
      position:     'absolute',
      left:         '2px',
      width:        `${espessura - 4}px`,
      background:   corThumb,
      borderRadius: '6px',
      cursor:       'grab',
      transition:   'background 0.15s',
      boxShadow:    '0 1px 4px rgba(0,0,0,0.4)',
    });
    this.thumbV.addEventListener('mouseenter', () => {
      this.thumbV.style.background = corThumbHover;
    });
    this.thumbV.addEventListener('mouseleave', () => {
      this.thumbV.style.background = corThumb;
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
      const dx     = e.clientX - startX;
      const trackW = this.trackH.clientWidth;
      const cv     = this.canvasVirtual;

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
      const dy     = e.clientY - startY;
      const trackH = this.trackV.clientHeight;
      const cv     = this.canvasVirtual;

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

    // Expande canvas virtual se viewBox sair dos limites
    if (vb.x < cv.x) { cv.width += cv.x - vb.x + 50; cv.x = vb.x - 50; }
    if (vb.y < cv.y) { cv.height += cv.y - vb.y + 50; cv.y = vb.y - 50; }
    if (vb.x + vb.width  > cv.x + cv.width)  cv.width  = vb.x + vb.width  - cv.x + 50;
    if (vb.y + vb.height > cv.y + cv.height) cv.height = vb.y + vb.height - cv.y + 50;

    const trackW = this.trackH.clientWidth;
    const trackH = this.trackV.clientHeight;

    // ── Horizontal (correção carolinalimaal: thumbW antes de thumbLeft) ──
    const ratioX = (vb.x - cv.x) / cv.width;
    const ratioW = vb.width / cv.width;
    const thumbW    = Math.max(ratioW * trackW, 20);
    const thumbLeft = Math.min(ratioX * trackW, trackW - thumbW);

    this.thumbH.style.width = `${thumbW}px`;
    this.thumbH.style.left  = `${thumbLeft}px`;

    // ── Vertical (correção carolinalimaal: thumbH2 antes de thumbTop) ──
    const ratioY = (vb.y - cv.y) / cv.height;
    const ratioH = vb.height / cv.height;
    const thumbH2  = Math.max(ratioH * trackH, 20);
    const thumbTop = Math.min(ratioY * trackH, trackH - thumbH2);

    this.thumbV.style.height = `${thumbH2}px`;
    this.thumbV.style.top    = `${thumbTop}px`;
  }

  // ─── Observa mudanças no viewBox do SVG ──────────────────────

  _observarViewBox() {
    const observer = new MutationObserver(() => this.atualizar());
    observer.observe(this.svgCanvas, {
      attributes:      true,
      attributeFilter: ['viewBox'],
    });
  }
}

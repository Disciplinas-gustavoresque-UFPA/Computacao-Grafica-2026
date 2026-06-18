import { criarElementoSVG } from '../utils/svgHelpers.js';

const TAMANHOS_PREDEFINIDOS = {
  livre: null,
  a4: { width: 800, height: 1131 },
  a3: { width: 1131, height: 1600 },
};

export class PageManager {
  constructor(overlaySvg, areaPagina) {
    this.overlaySvg = overlaySvg;
    this.areaPagina = areaPagina;
    this.onMudou = null;
    this.handleArrastando = null;
    this.handleOffsets = { x: 0, y: 0 };
    this.handles = [];

    this.interactionLayer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.interactionLayer.setAttribute('id', 'page-interaction-layer');
    this.interactionLayer.setAttribute('width', '100%');
    this.interactionLayer.setAttribute('height', '100%');
    this.interactionLayer.style.position = 'absolute';
    this.interactionLayer.style.top = '0';
    this.interactionLayer.style.left = '0';
    this.interactionLayer.style.pointerEvents = 'none';
    this.overlaySvg.parentNode.appendChild(this.interactionLayer);

    this._criarHandles();
    this._bindEvents();
  }

  _criarHandles() {
    this.handles = [];
    const posicoes = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

    posicoes.forEach(pos => {
      const handle = criarElementoSVG('rect', {
        width: 10,
        height: 10,
        fill: '#4a90d9',
        stroke: '#fff',
        'stroke-width': 1,
        rx: 2,
        'pointer-events': 'all',
        'data-handle': pos,
        style: 'cursor: ' + this._cursorParaPos(pos),
      });
      this.handles.push(handle);
      this.interactionLayer.appendChild(handle);
    });

    this.atualizarHandles();
  }

  _cursorParaPos(pos) {
    const mapa = {
      n: 'ns-resize', s: 'ns-resize',
      e: 'ew-resize', w: 'ew-resize',
      ne: 'nesw-resize', sw: 'nesw-resize',
      nw: 'nwse-resize', se: 'nwse-resize',
    };
    return mapa[pos] || 'default';
  }

  _bindEvents() {
    this.handles.forEach(handle => {
      handle.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        handle.style.pointerEvents = 'all';
        this.handleArrastando = handle.getAttribute('data-handle');
        this._iniciarArrasto(e);
      });
    });

    this.interactionLayer.addEventListener('mousemove', (e) => {
      if (this.handleArrastando) {
        this._aoArrastar(e);
      }
    });

    this.interactionLayer.addEventListener('mouseup', () => {
      this.handleArrastando = null;
    });

    this.interactionLayer.addEventListener('mouseleave', () => {
      this.handleArrastando = null;
    });
  }

  _iniciarArrasto(e) {
    const ponto = this._converterParaSVG(e.clientX, e.clientY);
    this.handleOffsets = {
      x: ponto.x,
      y: ponto.y,
      areaInicio: { ...this.areaPagina },
    };
  }

  _aoArrastar(e) {
    if (!this.handleArrastando) return;

    const ponto = this._converterParaSVG(e.clientX, e.clientY);
    const dx = ponto.x - this.handleOffsets.x;
    const dy = ponto.y - this.handleOffsets.y;
    const area = this.handleOffsets.areaInicio;
    const pos = this.handleArrastando;

    let novoX = area.x;
    let novoY = area.y;
    let novoW = area.width;
    let novoH = area.height;

    if (pos.includes('e')) {
      novoW = Math.max(50, area.width + dx);
    }
    if (pos.includes('w')) {
      novoW = Math.max(50, area.width - dx);
      if (novoW > 50) novoX = area.x + dx;
    }
    if (pos.includes('s')) {
      novoH = Math.max(50, area.height + dy);
    }
    if (pos.includes('n')) {
      novoH = Math.max(50, area.height - dy);
      if (novoH > 50) novoY = area.y + dy;
    }

    this.areaPagina = { x: novoX, y: novoY, width: novoW, height: novoH };
    this.atualizarHandles();
    if (this.onMudou) this.onMudou(this.areaPagina);
  }

  _converterParaSVG(clientX, clientY) {
    const ponto = this.interactionLayer.createSVGPoint();
    ponto.x = clientX;
    ponto.y = clientY;
    const ctm = this.interactionLayer.getScreenCTM();
    if (!ctm) return { x: clientX, y: clientY };
    const transformado = ponto.matrixTransform(ctm.inverse());
    return { x: transformado.x, y: transformado.y };
  }

  atualizarHandles() {
    const { x, y, width, height } = this.areaPagina;
    const s = 10;
    const metade = s / 2;

    const posicoes = {
      n:  { x: x + width / 2 - metade, y: y - metade },
      s:  { x: x + width / 2 - metade, y: y + height - metade },
      e:  { x: x + width - metade, y: y + height / 2 - metade },
      w:  { x: x - metade, y: y + height / 2 - metade },
      ne: { x: x + width - metade, y: y - metade },
      nw: { x: x - metade, y: y - metade },
      se: { x: x + width - metade, y: y + height - metade },
      sw: { x: x - metade, y: y + height - metade },
    };

    this.handles.forEach(handle => {
      const pos = handle.getAttribute('data-handle');
      const p = posicoes[pos];
      if (p) {
        handle.setAttribute('x', p.x);
        handle.setAttribute('y', p.y);
      }
    });
  }

  setAreaPagina(area) {
    this.areaPagina = { ...area };
    this.atualizarHandles();
  }

  aplicarPreDefinicao(nome) {
    const predef = TAMANHOS_PREDEFINIDOS[nome];
    if (!predef) return;
    this.areaPagina = { x: 0, y: 0, ...predef };
    this.atualizarHandles();
    if (this.onMudou) this.onMudou(this.areaPagina);
  }
}

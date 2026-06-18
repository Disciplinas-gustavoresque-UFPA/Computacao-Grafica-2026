import { criarElementoSVG } from '../utils/svgHelpers.js';

export class PageRenderer {
  constructor(svgCanvas, overlaySvg) {
    this.svgCanvas = svgCanvas;
    this.overlaySvg = overlaySvg;
    this.bgPagina = null;

    this.grupoOverlay = criarElementoSVG('g', { id: 'page-area-overlay' });
    this.overlaySvg.insertBefore(this.grupoOverlay, this.overlaySvg.firstChild);

    this.fundoExterno = null;
    this.bordaPagina = null;

    this._criarDefs();
    this._criarElementosOverlay();
  }

  _criarDefs() {
    const svgRoot = this.svgCanvas;

    if (!svgRoot.querySelector('#sombra-pagina')) {
      const defs = svgRoot.querySelector('defs') || criarElementoSVG('defs');
      if (!svgRoot.querySelector('defs')) {
        svgRoot.insertBefore(defs, svgRoot.firstChild);
      }

      const filtro = criarElementoSVG('filter', {
        id: 'sombra-pagina',
        x: '-10%',
        y: '-10%',
        width: '130%',
        height: '130%',
      });

      const sombra = criarElementoSVG('feDropShadow', {
        dx: 3,
        dy: 3,
        stdDeviation: 5,
        'flood-color': 'rgba(0,0,0,0.4)',
      });

      filtro.appendChild(sombra);
      defs.appendChild(filtro);

      const padrao = criarElementoSVG('pattern', {
        id: 'padrao-pontilhado',
        x: 0,
        y: 0,
        width: 20,
        height: 20,
        patternUnits: 'userSpaceOnUse',
      });

      const circulo = criarElementoSVG('circle', {
        cx: 10,
        cy: 10,
        r: 1,
        fill: 'rgba(255,255,255,0.15)',
      });

      padrao.appendChild(circulo);
      defs.appendChild(padrao);
    }
  }

  _criarElementosOverlay() {
    this.fundoExterno = criarElementoSVG('rect', {
      id: 'fundo-externo',
      fill: 'url(#padrao-pontilhado)',
      'pointer-events': 'none',
    });
    this.grupoOverlay.appendChild(this.fundoExterno);

    this.bordaPagina = criarElementoSVG('rect', {
      id: 'borda-pagina',
      fill: 'none',
      stroke: '#999',
      'stroke-width': 1,
      'stroke-dasharray': '6 3',
      'pointer-events': 'none',
    });
    this.grupoOverlay.appendChild(this.bordaPagina);
  }

  atualizar(areaPagina) {
    this._garantirBgPagina(areaPagina);
    this._atualizarBgPagina(areaPagina);

    const canvasWidth = this.svgCanvas.clientWidth || this.svgCanvas.getBoundingClientRect().width;
    const canvasHeight = this.svgCanvas.clientHeight || this.svgCanvas.getBoundingClientRect().height;

    this.fundoExterno.setAttribute('x', 0);
    this.fundoExterno.setAttribute('y', 0);
    this.fundoExterno.setAttribute('width', canvasWidth * 3);
    this.fundoExterno.setAttribute('height', canvasHeight * 3);

    this.bordaPagina.setAttribute('x', areaPagina.x);
    this.bordaPagina.setAttribute('y', areaPagina.y);
    this.bordaPagina.setAttribute('width', areaPagina.width);
    this.bordaPagina.setAttribute('height', areaPagina.height);
  }

  _garantirBgPagina(areaPagina) {
    let bg = this.svgCanvas.querySelector('#page-background');
    if (!bg) {
      bg = criarElementoSVG('rect', {
        id: 'page-background',
        fill: 'white',
        filter: 'url(#sombra-pagina)',
        'pointer-events': 'none',
      });
      this.svgCanvas.insertBefore(bg, this.svgCanvas.firstChild);
    }
    this.bgPagina = bg;
  }

  _atualizarBgPagina(areaPagina) {
    const bg = this.bgPagina;
    if (!bg || !bg.parentNode) {
      this._garantirBgPagina(areaPagina);
    }
    const b = this.bgPagina;
    b.setAttribute('x', areaPagina.x);
    b.setAttribute('y', areaPagina.y);
    b.setAttribute('width', areaPagina.width);
    b.setAttribute('height', areaPagina.height);
  }
}
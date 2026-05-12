import { criarElementoSVG } from '../utils/svgHelpers.js';

export class Selecao {
  constructor(overlaySvg) {
    this.overlaySvg = overlaySvg;
    this.bordaSelecao = null;
  }

  desenhar(elementoSelecionado) {
    this.limpar();

    if (!elementoSelecionado) return;

    const bbox = elementoSelecionado.getBBox();
    
    this.bordaSelecao = criarElementoSVG('g', {
      'pointer-events': 'none'
    });
    
    // Copiar transform para o grupo
    const transform = elementoSelecionado.getAttribute('transform');
    if (transform) {
      this.bordaSelecao.setAttribute('transform', transform);
    }

    // Retângulo principal
    const rect = criarElementoSVG('rect', {
      x: bbox.x - 2,
      y: bbox.y - 2,
      width: bbox.width + 4,
      height: bbox.height + 4,
      fill: 'none',
      stroke: "blue",
      'stroke-width': 1.5,
      'stroke-dasharray': '4 2',
      class: 'borda-rect'
    });
    this.bordaSelecao.appendChild(rect);

    // Handles de redimensionamento
    const handleProps = {
      width: 8,
      height: 8,
      fill: 'white',
      stroke: 'blue',
      'stroke-width': 1.5,
      'pointer-events': 'all'
    };

    const positions = {
      'nw': { x: bbox.x - 2, y: bbox.y - 2, cursor: 'nwse-resize' },
      'ne': { x: bbox.x + bbox.width + 2, y: bbox.y - 2, cursor: 'nesw-resize' },
      'sw': { x: bbox.x - 2, y: bbox.y + bbox.height + 2, cursor: 'nesw-resize' },
      'se': { x: bbox.x + bbox.width + 2, y: bbox.y + bbox.height + 2, cursor: 'nwse-resize' }
    };

    for (const [dir, pos] of Object.entries(positions)) {
      const handle = criarElementoSVG('rect', {
        ...handleProps,
        x: pos.x - 4,
        y: pos.y - 4,
        class: `handle resize-handle ${dir}`,
        'data-dir': dir,
        style: `cursor: ${pos.cursor};`
      });
      this.bordaSelecao.appendChild(handle);
    }

    // Handle de Rotação
    const pivotLine = criarElementoSVG('line', {
      x1: bbox.x + bbox.width / 2,
      y1: bbox.y - 2,
      x2: bbox.x + bbox.width / 2,
      y2: bbox.y - 25,
      stroke: 'blue',
      'stroke-width': 1.5,
      class: 'pivot-line'
    });
    this.bordaSelecao.appendChild(pivotLine);

    const rotateHandle = criarElementoSVG('circle', {
      cx: bbox.x + bbox.width / 2,
      cy: bbox.y - 25,
      r: 5,
      fill: 'white',
      stroke: 'blue',
      'stroke-width': 1.5,
      class: 'handle rotate-handle',
      'pointer-events': 'all',
      style: 'cursor: crosshair;'
    });
    this.bordaSelecao.appendChild(rotateHandle);

    this.overlaySvg.appendChild(this.bordaSelecao);
  }

  atualizarPosicao(elementoSelecionado) {
    if (this.bordaSelecao && elementoSelecionado) {
      const bbox = elementoSelecionado.getBBox();
      
      const transform = elementoSelecionado.getAttribute('transform');
      if (transform) {
        this.bordaSelecao.setAttribute('transform', transform);
      } else {
        this.bordaSelecao.removeAttribute('transform');
      }

      const rect = this.bordaSelecao.querySelector('.borda-rect');
      if (rect) {
        rect.setAttribute('x', String(bbox.x - 2));
        rect.setAttribute('y', String(bbox.y - 2));
        rect.setAttribute('width', String(bbox.width + 4));
        rect.setAttribute('height', String(bbox.height + 4));
      }

      const positions = {
        'nw': { x: bbox.x - 2, y: bbox.y - 2 },
        'ne': { x: bbox.x + bbox.width + 2, y: bbox.y - 2 },
        'sw': { x: bbox.x - 2, y: bbox.y + bbox.height + 2 },
        'se': { x: bbox.x + bbox.width + 2, y: bbox.y + bbox.height + 2 }
      };

      for (const [dir, pos] of Object.entries(positions)) {
        const handle = this.bordaSelecao.querySelector(`.resize-handle.${dir}`);
        if (handle) {
          handle.setAttribute('x', String(pos.x - 4));
          handle.setAttribute('y', String(pos.y - 4));
        }
      }

      const pivotLine = this.bordaSelecao.querySelector('.pivot-line');
      if (pivotLine) {
        pivotLine.setAttribute('x1', String(bbox.x + bbox.width / 2));
        pivotLine.setAttribute('y1', String(bbox.y - 2));
        pivotLine.setAttribute('x2', String(bbox.x + bbox.width / 2));
        pivotLine.setAttribute('y2', String(bbox.y - 25));
      }

      const rotateHandle = this.bordaSelecao.querySelector('.rotate-handle');
      if (rotateHandle) {
        rotateHandle.setAttribute('cx', String(bbox.x + bbox.width / 2));
        rotateHandle.setAttribute('cy', String(bbox.y - 25));
      }
    }
  }

  limpar() {
    if (this.bordaSelecao && this.bordaSelecao.parentNode) {
      this.bordaSelecao.parentNode.removeChild(this.bordaSelecao);
    }
    this.bordaSelecao = null;
  }
}

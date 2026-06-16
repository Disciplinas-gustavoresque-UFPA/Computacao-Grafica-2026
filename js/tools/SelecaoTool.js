import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { 
  estado, 
  definirElementosSelecionados, 
  adicionarElementoSelecao, 
  removerElementoSelecao, 
  atualizarPosicaoSelecaoVisual 
} from '../core/StateManager.js';

export class SelecaoTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;

    this.isDragging = false;
    this.action = 'none'; // 'move', 'resize', 'rotate'
    this.resizeDir = '';
    
    this.startX = 0;
    this.startY = 0;
    this.offsets = []; // Para mover múltiplos elementos
    
    this.startScaleX = 1;
    this.startScaleY = 1;
    this.cx = 0;
    this.cy = 0;
  }

  onMouseDown(evento) {
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    const target = evento.target;
    const isShift = evento.shiftKey;

    // Se o clique foi em um handle (apenas visível em single-selection)
    if (target.classList && target.classList.contains('handle')) {
      this.isDragging = true;
      this.startX = pt.x;
      this.startY = pt.y;
      
      const el = estado.elementosSelecionados[0];
      const bbox = el.getBBox();
      this.cx = bbox.x + bbox.width / 2;
      this.cy = bbox.y + bbox.height / 2;
      
      this.startScaleX = parseFloat(el.getAttribute('data-scalex') || 1);
      this.startScaleY = parseFloat(el.getAttribute('data-scaley') || 1);

      if (target.classList.contains('rotate-handle')) {
        this.action = 'rotate';
      } else if (target.classList.contains('resize-handle')) {
        this.action = 'resize';
        this.resizeDir = target.getAttribute('data-dir');
      }
      return; // Mantém a seleção
    }

    const allowedTags = ['rect', 'text', 'image', 'circle', 'ellipse', 'g', 'path', 'line'];
    const elementoAlvo = this._buscarElementoValido(target, allowedTags);

    if (elementoAlvo) {
      if (isShift) {
        if (estado.elementosSelecionados.includes(elementoAlvo)) {
          removerElementoSelecao(elementoAlvo);
        } else {
          adicionarElementoSelecao(elementoAlvo);
        }
      } else {
        if (!estado.elementosSelecionados.includes(elementoAlvo)) {
          definirElementosSelecionados([elementoAlvo]);
        }
      }

      if (estado.elementosSelecionados.length > 0) {
        this.isDragging = true;
        this.action = 'move';
        this._calcularOffsets(pt);
      }
    } else {
      if (!isShift) {
        this.limparSelecao();
      }
    }
  }

  onMouseMove(evento) {
    if (!this.isDragging || estado.elementosSelecionados.length === 0) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    if (this.action === 'move') {
      estado.elementosSelecionados.forEach((el, index) => {
        const offset = this.offsets[index];
        if (!offset) return;

        const novoX = pt.x - offset.x;
        const novoY = pt.y - offset.y;

        const tag = el.tagName.toLowerCase();

        if (tag === 'rect' || tag === 'text' || tag === 'image') {
          el.setAttribute('x', String(novoX));
          el.setAttribute('y', String(novoY));
        } else if (tag === 'circle' || tag === 'ellipse') {
          el.setAttribute('cx', String(novoX));
          el.setAttribute('cy', String(novoY));
        } else if (tag === 'line') {
            const dx = novoX - parseFloat(el.getAttribute('x1') || 0);
            const dy = novoY - parseFloat(el.getAttribute('y1') || 0);
            el.setAttribute('x1', String(novoX));
            el.setAttribute('y1', String(novoY));
            el.setAttribute('x2', String(parseFloat(el.getAttribute('x2') || 0) + dx));
            el.setAttribute('y2', String(parseFloat(el.getAttribute('y2') || 0) + dy));
        }
        
        // Reapply transform if any
        this.applyTransform(el);
      });
    } 
    else if (this.action === 'rotate' && estado.elementosSelecionados.length === 1) {
      const el = estado.elementosSelecionados[0];
      const dx = pt.x - this.cx;
      const dy = pt.y - this.cy;
      let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      el.setAttribute('data-angle', angle);
      this.applyTransform(el);
    }
    else if (this.action === 'resize' && estado.elementosSelecionados.length === 1) {
      const el = estado.elementosSelecionados[0];
      const bbox = el.getBBox();
      const angle = parseFloat(el.getAttribute('data-angle') || 0);
      
      const angleRad = -angle * Math.PI / 180;
      const localX = this.cx + (pt.x - this.cx) * Math.cos(angleRad) - (pt.y - this.cy) * Math.sin(angleRad);
      const localY = this.cy + (pt.x - this.cx) * Math.sin(angleRad) + (pt.y - this.cy) * Math.cos(angleRad);
      
      const halfW = bbox.width / 2;
      const halfH = bbox.height / 2;
      
      let sx = this.startScaleX;
      let sy = this.startScaleY;
      
      if (halfW > 0.1 && halfH > 0.1) {
          if (this.resizeDir === 'se') {
              sx = (localX - this.cx) / halfW;
              sy = (localY - this.cy) / halfH;
          } else if (this.resizeDir === 'nw') {
              sx = (this.cx - localX) / halfW;
              sy = (this.cy - localY) / halfH;
          } else if (this.resizeDir === 'ne') {
              sx = (localX - this.cx) / halfW;
              sy = (this.cy - localY) / halfH;
          } else if (this.resizeDir === 'sw') {
              sx = (this.cx - localX) / halfW;
              sy = (localY - this.cy) / halfH;
          }
      }
      
      el.setAttribute('data-scalex', sx);
      el.setAttribute('data-scaley', sy);
      this.applyTransform(el);
    }

    atualizarPosicaoSelecaoVisual();
  }

  onMouseUp(evento) {
    this.isDragging = false;
    this.action = 'none';
  }

  onDesativar() {
    this.limparSelecao();
  }

  limparSelecao() {
    this.isDragging = false;
    this.action = 'none';
    this.offsets = [];
    definirElementosSelecionados([]);
  }

  _buscarElementoValido(target, allowedTags) {
    if (target === this.svgCanvas) return null;

    let atual = target;
    while (atual && atual !== this.svgCanvas) {
      const tag = atual.tagName.toLowerCase();
      if (allowedTags.includes(tag)) {
        return atual;
      }
      atual = atual.parentNode;
    }
    return null;
  }

  _calcularOffsets(pontoMouse) {
    this.offsets = estado.elementosSelecionados.map(el => {
      const tag = el.tagName.toLowerCase();
      let elX = 0, elY = 0;

      if (tag === 'rect' || tag === 'text' || tag === 'image') {
        elX = parseFloat(el.getAttribute('x') || 0);
        elY = parseFloat(el.getAttribute('y') || 0);
      } else if (tag === 'circle' || tag === 'ellipse') {
        elX = parseFloat(el.getAttribute('cx') || 0);
        elY = parseFloat(el.getAttribute('cy') || 0);
      } else if (tag === 'line') {
        elX = parseFloat(el.getAttribute('x1') || 0);
        elY = parseFloat(el.getAttribute('y1') || 0);
      }

      return { x: pontoMouse.x - elX, y: pontoMouse.y - elY };
    });
  }
  
  applyTransform(el) {
    if (!el) return;
    
    const angle = parseFloat(el.getAttribute('data-angle') || 0);
    const sx = parseFloat(el.getAttribute('data-scalex') || 1);
    const sy = parseFloat(el.getAttribute('data-scaley') || 1);
    
    const bbox = el.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;
    
    if (angle === 0 && sx === 1 && sy === 1) {
        el.removeAttribute('transform');
        return;
    }
    
    const transformStr = `translate(${cx}, ${cy}) rotate(${angle}) scale(${sx}, ${sy}) translate(${-cx}, ${-cy})`;
    el.setAttribute('transform', transformStr);
  }
}

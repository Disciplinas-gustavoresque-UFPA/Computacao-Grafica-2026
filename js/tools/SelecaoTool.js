import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { definirElementoSelecionado, atualizarPosicaoSelecaoVisual } from '../core/StateManager.js';

/**
 * Ferramenta de Seleção
 */
export class SelecaoTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;

    this.elementoSelecionado = null;

    this.isDragging = false;
    this.action = 'none'; // 'move', 'resize', 'rotate'
    this.resizeDir = '';
    
    this.startX = 0;
    this.startY = 0;
    
    // For Move
    this.offsetX = 0;
    this.offsetY = 0;
    
    // For Scale
    this.startScaleX = 1;
    this.startScaleY = 1;
    
    // Initial Centroid
    this.cx = 0;
    this.cy = 0;
  }

  onMouseDown(evento) {
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    const target = evento.target;

    // Se o clique foi em um handle
    if (target.classList && target.classList.contains('handle')) {
      this.isDragging = true;
      this.startX = pt.x;
      this.startY = pt.y;
      
      const bbox = this.elementoSelecionado.getBBox();
      this.cx = bbox.x + bbox.width / 2;
      this.cy = bbox.y + bbox.height / 2;
      
      this.startScaleX = parseFloat(this.elementoSelecionado.getAttribute('data-scalex') || 1);
      this.startScaleY = parseFloat(this.elementoSelecionado.getAttribute('data-scaley') || 1);

      if (target.classList.contains('rotate-handle')) {
        this.action = 'rotate';
      } else if (target.classList.contains('resize-handle')) {
        this.action = 'resize';
        this.resizeDir = target.getAttribute('data-dir');
      }
      return; // Mantém a seleção
    }

    // Limpa a seleção anterior
    this.limparSelecao();

    const allowedTags = ['rect', 'text', 'image', 'circle', 'ellipse', 'path', 'polygon', 'polyline', 'g'];
    const tag = target.tagName ? target.tagName.toLowerCase() : '';

    // Se o clique não foi no canvas vazio e for um elemento permitido
    if (
      target !== this.svgCanvas &&
      target.closest('svg') === this.svgCanvas &&
      allowedTags.includes(tag)
    ) {
      this.elementoSelecionado = target;
      definirElementoSelecionado(target);

      this.isDragging = true;
      this.action = 'move';

      let elX = 0, elY = 0;
      if (tag === 'rect' || tag === 'text' || tag === 'image') {
        elX = parseFloat(target.getAttribute('x') || 0);
        elY = parseFloat(target.getAttribute('y') || 0);
      } else if (tag === 'circle' || tag === 'ellipse') {
        elX = parseFloat(target.getAttribute('cx') || 0);
        elY = parseFloat(target.getAttribute('cy') || 0);
      }

      this.offsetX = pt.x - elX;
      this.offsetY = pt.y - elY;
    }
  }

  onMouseMove(evento) {
    if (!this.isDragging || !this.elementoSelecionado) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    if (this.action === 'move') {
      const novoX = pt.x - this.offsetX;
      const novoY = pt.y - this.offsetY;

      const tag = this.elementoSelecionado.tagName.toLowerCase();

      if (tag === 'rect' || tag === 'text' || tag === 'image') {
        this.elementoSelecionado.setAttribute('x', novoX);
        this.elementoSelecionado.setAttribute('y', novoY);
      } else if (tag === 'circle' || tag === 'ellipse') {
        this.elementoSelecionado.setAttribute('cx', novoX);
        this.elementoSelecionado.setAttribute('cy', novoY);
      }
      
      this.applyTransform();
    } 
    else if (this.action === 'rotate') {
      const dx = pt.x - this.cx;
      const dy = pt.y - this.cy;
      let angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      this.elementoSelecionado.setAttribute('data-angle', angle);
      this.applyTransform();
    }
    else if (this.action === 'resize') {
      // Diferença do mouse a partir do centro
      const dx = pt.x - this.cx;
      const dy = pt.y - this.cy;
      
      const startDx = this.startX - this.cx;
      const startDy = this.startY - this.cy;
      
      let sx = this.startScaleX;
      let sy = this.startScaleY;
      
      // Impedir divisão por zero ou muito próximo de zero
      if (Math.abs(startDx) > 0.1) sx = this.startScaleX * (dx / startDx);
      if (Math.abs(startDy) > 0.1) sy = this.startScaleY * (dy / startDy);
      
      this.elementoSelecionado.setAttribute('data-scalex', sx);
      this.elementoSelecionado.setAttribute('data-scaley', sy);
      this.applyTransform();
    }

    atualizarPosicaoSelecaoVisual();
  }

  onMouseUp(evento) {
    this.isDragging = false;
    this.action = 'none';
    // TODO: Adicionar ao HistoryManager
  }

  onDesativar() {
    this.limparSelecao();
  }

  limparSelecao() {
    this.elementoSelecionado = null;
    this.isDragging = false;
    this.action = 'none';
    definirElementoSelecionado(null);
  }
  
  applyTransform() {
    if (!this.elementoSelecionado) return;
    
    const angle = parseFloat(this.elementoSelecionado.getAttribute('data-angle') || 0);
    const sx = parseFloat(this.elementoSelecionado.getAttribute('data-scalex') || 1);
    const sy = parseFloat(this.elementoSelecionado.getAttribute('data-scaley') || 1);
    
    // Precisamos do centroide exato atual (após o movimento)
    const bbox = this.elementoSelecionado.getBBox();
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;
    
    // Se não há transformação ativa, pode remover o atributo
    if (angle === 0 && sx === 1 && sy === 1) {
        this.elementoSelecionado.removeAttribute('transform');
        return;
    }
    
    // Combina as transformações em torno do centro (cx, cy)
    const transformStr = `translate(${cx}, ${cy}) rotate(${angle}) scale(${sx}, ${sy}) translate(${-cx}, ${-cy})`;
    this.elementoSelecionado.setAttribute('transform', transformStr);
  }
}

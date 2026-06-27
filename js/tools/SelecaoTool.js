import { ToolBase } from './ToolBase.js';
import { obterCoordenadaSVG } from '../utils/svgHelpers.js';
import { 
  estado, 
  definirElementosSelecionados, 
  adicionarElementoSelecao, 
  removerElementoSelecao, 
  atualizarPosicaoSelecaoVisual,
  registrarAcaoHistorico
} from '../core/StateManager.js';

/**
 * Ferramenta de Seleção
 */
export class SelecaoTool extends ToolBase {
  constructor(svgCanvas) {
    super();
    this.svgCanvas = svgCanvas;

    this.isDragging = false;
    this.offsets = [];
    this.estadoInicialMovimento = null;

    this.btnOpcaoBorda = document.getElementById('btn-opcao-borda');
    this.cardEdicaoBorda = document.getElementById('card-edicao-borda');
    this.sliderEspessura = document.getElementById('slider-espessura-borda');
    this.valorEspessuraText = document.getElementById('valor-espessura-borda');
    this.btnFecharCard = document.getElementById('btn-fechar-card-borda');

    this.elementoAtivoBorda = null; 
    this.comprimentoElemento = 0;

    this._initEventosBorda();
  }

  _initEventosBorda() {
    if (!this.btnOpcaoBorda) return;

    this.btnOpcaoBorda.addEventListener('click', (e) => {
      const rect = this.btnOpcaoBorda.getBoundingClientRect();
      this.cardEdicaoBorda.style.left = `${rect.right + 10}px`;
      this.cardEdicaoBorda.style.top = `${rect.top}px`;
      
      this.cardEdicaoBorda.classList.remove('oculto');
      this.btnOpcaoBorda.classList.add('oculto');
    });

    this.sliderEspessura.addEventListener('input', (e) => {
      if (!this.elementoAtivoBorda) return;
      
      const porcentagem = parseFloat(e.target.value);
      this.valorEspessuraText.textContent = `${porcentagem}%`;
      
      const novaEspessura = (porcentagem / 100) * this.comprimentoElemento;
      
      this.elementoAtivoBorda.setAttribute('stroke-width', String(novaEspessura));
    });

    this.sliderEspessura.addEventListener('change', () => {
        registrarAcaoHistorico();
    });

    this.btnFecharCard.addEventListener('click', () => {
      this.esconderOpcaoBorda();
    });
  }

  mostrarOpcaoBorda(elementoSVG, eventoMouse) {
    this.elementoAtivoBorda = elementoSVG;
    
    const bbox = this.elementoAtivoBorda.getBBox();
    
    this.comprimentoElemento = Math.max(bbox.width, bbox.height);
    
    this.btnOpcaoBorda.style.left = `${eventoMouse.clientX + 15}px`;
    this.btnOpcaoBorda.style.top = `${eventoMouse.clientY - 15}px`;
    this.btnOpcaoBorda.classList.remove('oculto');
    
    this.cardEdicaoBorda.classList.add('oculto'); 
  }

  esconderOpcaoBorda() {
    if(this.btnOpcaoBorda) this.btnOpcaoBorda.classList.add('oculto');
    if(this.cardEdicaoBorda) this.cardEdicaoBorda.classList.add('oculto');
    this.elementoAtivoBorda = null;
  }

  onMouseDown(evento) {
    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    const target = evento.target;
    const isShift = evento.shiftKey;

    const allowedTags = ['rect', 'text', 'image', 'circle', 'ellipse', 'g', 'path', 'line', 'lapis'];
    const tag = target.tagName ? target.tagName.toLowerCase() : '';

    // Verifica se o clique foi em um elemento válido dentro do canvas
    const elementoAlvo = this._buscarElementoValido(target, allowedTags);

    if (elementoAlvo) {
      if (isShift) {
        // Alterna seleção com Shift
        if (estado.elementosSelecionados.includes(elementoAlvo)) {
          removerElementoSelecao(elementoAlvo);
          this.esconderOpcaoBorda();
        } else {
          adicionarElementoSelecao(elementoAlvo);
          this.mostrarOpcaoBorda(elementoAlvo, evento);
        }
      } else {
        if (!estado.elementosSelecionados.includes(elementoAlvo)) {
          definirElementosSelecionados([elementoAlvo]);
        }
        this.mostrarOpcaoBorda(elementoAlvo, evento);
      }

      if (estado.elementosSelecionados.length > 0) {
        this.isDragging = true;
        this._calcularOffsets(pt);
        this._salvarEstadoInicialMovimento();
      }
    } else {
      this.esconderOpcaoBorda();
      if (!isShift) {
        this.limparSelecao();
      }
    }
  }

  onMouseMove(evento) {
    if (!this.isDragging || estado.elementosSelecionados.length === 0) return;

    this.esconderOpcaoBorda();

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);

    estado.elementosSelecionados.forEach((el, index) => {
      const offset = this.offsets[index];
      if (!offset) return;

      const novoX = pt.x - offset.x;
      const novoY = pt.y - offset.y;

      const tag = el.tagName.toLowerCase();

      // Atualiza coordenadas baseado no tipo de elemento
      if (tag === 'rect' || tag === 'text' || tag === 'image') {
        el.setAttribute('x', String(novoX));
        el.setAttribute('y', String(novoY));
      } else if (tag === 'circle' || tag === 'ellipse') {
        el.setAttribute('cx', String(novoX));
        el.setAttribute('cy', String(novoY));
      } else if (tag === 'line') {
          // Exemplo simplificado para linha (move mantendo comprimento)
          const dx = novoX - parseFloat(el.getAttribute('x1') || 0);
          const dy = novoY - parseFloat(el.getAttribute('y1') || 0);
          el.setAttribute('x1', String(novoX));
          el.setAttribute('y1', String(novoY));
          el.setAttribute('x2', String(parseFloat(el.getAttribute('x2') || 0) + dx));
          el.setAttribute('y2', String(parseFloat(el.getAttribute('y2') || 0) + dy));
      } else if (tag === 'path' || tag === 'g') {
          //Usa a tranformação de translação, a mesma que foi vista em sala :), pra mover o objeto
          el.setAttribute('transform', `translate(${novoX}, ${novoY})`);
          // Guarda a posição atual para o próximo clique
          el.setAttribute('data-x', String(novoX));
          el.setAttribute('data-y', String(novoY));
      }
    });

    atualizarPosicaoSelecaoVisual();
  }

  onMouseUp(evento) {
    if (this.isDragging) {
      const houveMovimento = this._houveMovimentoReal();
      if (houveMovimento) {
        registrarAcaoHistorico();
      } else if (estado.elementosSelecionados.length === 1) {
         this.mostrarOpcaoBorda(estado.elementosSelecionados[0], evento);
      }
    }
    this.isDragging = false;
    this.estadoInicialMovimento = null;
  }

  onKeyDown(evento) {
    if (evento.key === 'Delete' || evento.key === 'Backspace') {
      evento.preventDefault();
      this.deletarElementosSelecionados();
    }
  }

  deletarElementosSelecionados() {
    const elementos = [...estado.elementosSelecionados];
    if (elementos.length === 0) return;
    
    elementos.forEach(el => {
      if (el && el.parentNode) {
        el.remove();
      }
    });
    
    // Limpa a seleção
    definirElementosSelecionados([]);
    this.esconderOpcaoBorda();
    
    // Registrar a exclusão no histórico
    registrarAcaoHistorico();
  }

  onDesativar() {
    this.limparSelecao();
  }

  limparSelecao() {
    this.isDragging = false;
    this.offsets = [];
    this.estadoInicialMovimento = null;
    definirElementosSelecionados([]);
    this.esconderOpcaoBorda();
  }

  /**
   * @private
   */
  _salvarEstadoInicialMovimento() {
    this.estadoInicialMovimento = estado.elementosSelecionados.map(el => {
      const tag = el.tagName.toLowerCase();
      let x = 0, y = 0;
      
      if (tag === 'rect' || tag === 'text' || tag === 'image') {
        x = parseFloat(el.getAttribute('x') || 0);
        y = parseFloat(el.getAttribute('y') || 0);
      } else if (tag === 'circle' || tag === 'ellipse') {
        x = parseFloat(el.getAttribute('cx') || 0);
        y = parseFloat(el.getAttribute('cy') || 0);
      } else if (tag === 'line') {
        x = parseFloat(el.getAttribute('x1') || 0);
        y = parseFloat(el.getAttribute('y1') || 0);
      }
      
      return { elemento: el, x, y, tag };
    });
  }

  /**
   * @private
   */
  _houveMovimentoReal() {
    if (!this.estadoInicialMovimento) return false;
    
    for (const estadoInicial of this.estadoInicialMovimento) {
      const el = estadoInicial.elemento;
      const tag = estadoInicial.tag;
      let xAtual = 0, yAtual = 0;
      
      if (tag === 'rect' || tag === 'text' || tag === 'image') {
        xAtual = parseFloat(el.getAttribute('x') || 0);
        yAtual = parseFloat(el.getAttribute('y') || 0);
      } else if (tag === 'circle' || tag === 'ellipse') {
        xAtual = parseFloat(el.getAttribute('cx') || 0);
        yAtual = parseFloat(el.getAttribute('cy') || 0);
      } else if (tag === 'line') {
        xAtual = parseFloat(el.getAttribute('x1') || 0);
        yAtual = parseFloat(el.getAttribute('y1') || 0);
      }
      
      if (xAtual !== estadoInicial.x || yAtual !== estadoInicial.y) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * @private
   */
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

  /**
   * @private
   */
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
      } else if (tag === 'path' || tag === 'g') {
        elX = parseFloat(el.getAttribute('data-x') || 0);
        elY = parseFloat(el.getAttribute('data-y') || 0);
      }

      return { x: pontoMouse.x - elX, y: pontoMouse.y - elY };
    });
  }
}
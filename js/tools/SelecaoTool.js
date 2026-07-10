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
  }

  /**
   * Lê a translação X e Y real do elemento nativamente
   * @private
   */
  _obterTranslacao(el) {
    const transformList = el.transform.baseVal;
    for (let i = 0; i < transformList.numberOfItems; i++) {
      const item = transformList.getItem(i);
      if (item.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
        return { x: item.matrix.e, y: item.matrix.f };
      }
    }
    return { x: 0, y: 0 };
  }

  /**
   * Define a translação X e Y do elemento nativamente
   * @private
   */
  _definirTranslacao(el, x, y) {
    const transformList = el.transform.baseVal;
    let translateItem = null;

    for (let i = 0; i < transformList.numberOfItems; i++) {
      const item = transformList.getItem(i);
      if (item.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
        translateItem = item;
        break;
      }
    }

    // Se não existir, cria a propriedade Translate na matriz do elemento
    if (!translateItem) {
      const svgRef = el.ownerSVGElement || this.svgCanvas;
      translateItem = svgRef.createSVGTransform();
      translateItem.setTranslate(x, y);
      transformList.appendItem(translateItem);
    } else {
      translateItem.setTranslate(x, y);
    }
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
        this._calcularOffsets(pt);
        this._salvarEstadoInicialMovimento();
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
        // Aplica a translação nativa em vez de escrever string template
        this._definirTranslacao(el, novoX, novoY);
      }
    });

    atualizarPosicaoSelecaoVisual();
  }

  onMouseUp(evento) {
    if (this.isDragging) {
      const houveMovimento = this._houveMovimentoReal();
      if (houveMovimento) {
        registrarAcaoHistorico();
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
      } else if (tag === 'path' || tag === 'g') {
        x = parseFloat(el.getAttribute('data-x') || 0);
        y = parseFloat(el.getAttribute('data-y') || 0);
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
      } else if (tag === 'path' || tag === 'g') {
        xAtual = parseFloat(el.getAttribute('data-x') || 0);
        yAtual = parseFloat(el.getAttribute('data-y') || 0);
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
    if (target === this.svgCanvas || target.id === 'canvas') return null;

    // Em vez de usar closest(), vamos subir na árvore e salvar o grupo mais ALTO (externo)
    let grupoMaisExterno = null;
    let atualBuscaGrupo = target;

    while (atualBuscaGrupo && atualBuscaGrupo !== this.svgCanvas) {
      if (atualBuscaGrupo.tagName && atualBuscaGrupo.tagName.toLowerCase() === 'g') {
        grupoMaisExterno = atualBuscaGrupo; // Atualiza a variável toda vez que achar um <g>
      }
      atualBuscaGrupo = atualBuscaGrupo.parentNode;
    }

    // Se o elemento pertence a um ou mais grupos, seleciona o "Grupo Mestre" (o mais externo)
    if (grupoMaisExterno) {
      return grupoMaisExterno;
    }

    // Se não encontrou nenhum grupo, busca pela forma primitiva normal (rect, circle, etc)
    let atual = target;
    while (atual && atual !== this.svgCanvas) {
      const tag = atual.tagName ? atual.tagName.toLowerCase() : '';
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
        // Usa a leitura nativa em vez do atributo 'data-x'
        const translacao = this._obterTranslacao(el);
        elX = translacao.x;
        elY = translacao.y;
      }

      return { x: pontoMouse.x - elX, y: pontoMouse.y - elY };
    });
  }
}
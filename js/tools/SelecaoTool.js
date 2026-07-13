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
import { atualizarTransformacao } from '../utils/flipHelpers.js';

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
    const isCtrl = evento.ctrlKey || evento.metaKey;

    const allowedTags = ['rect', 'text', 'image', 'circle', 'ellipse', 'g', 'path', 'line', 'lapis', 'polygon'];
    const tag = target.tagName ? target.tagName.toLowerCase() : '';

    // Verifica se o clique foi em um elemento válido dentro do canvas
    let elementoAlvo = this._buscarElementoValido(target, allowedTags);

    // Fallback: se nada foi encontrado diretamente, tenta encontrar uma
    // linha próxima ao clique (área de seleção maior que a espessura visual)
    if (!elementoAlvo) {
      elementoAlvo = this._buscarLinhaProxima(pt);
    }

    if (elementoAlvo) {
      this._aplicarSelecaoComModificador(elementoAlvo, isShift, isCtrl);

      if (estado.elementosSelecionados.length > 0) {
        this.isDragging = true;
        this._calcularOffsets(pt);
        this._salvarEstadoInicialMovimento();
      }
    } else if (!isShift && !isCtrl) {
      this.limparSelecao();
    }
  }

  _aplicarSelecaoComModificador(elementoAlvo, isShift, isCtrl) {
    const usaModificador = isShift || isCtrl;

    if (!usaModificador) {
      if (!estado.elementosSelecionados.includes(elementoAlvo)) {
        definirElementosSelecionados([elementoAlvo]);
      }
      return;
    }

    if (estado.elementosSelecionados.includes(elementoAlvo)) {
      removerElementoSelecao(elementoAlvo);
    } else {
      adicionarElementoSelecao(elementoAlvo);
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
        atualizarTransformacao(el);
      } else if (tag === 'polygon' && el.dataset.shape === 'losango') {
    // Código atual do losango
    el.setAttribute('x', String(novoX));
    el.setAttribute('y', String(novoY));

    const w = parseFloat(el.getAttribute('width') || 0);
    const h = parseFloat(el.getAttribute('height') || 0);

    const centroX = novoX + w / 2;
    const centroY = novoY + h / 2;

    const novosPontos =
        `${centroX},${novoY} ${novoX + w},${centroY} ${centroX},${novoY + h} ${novoX},${centroY}`;

    el.setAttribute('points', novosPontos);

    atualizarTransformacao(el);
      }else if (tag === 'polygon' && el.dataset.shape === 'poligono') {
        this._definirTranslacao(el, novoX, novoY);
        atualizarTransformacao(el);
      }else if (tag === 'circle' || tag === 'ellipse') {
        el.setAttribute('cx', String(novoX));
        el.setAttribute('cy', String(novoY));
        atualizarTransformacao(el);
      } else if (tag === 'line') {
          // Exemplo simplificado para linha (move mantendo comprimento)
          const dx = novoX - parseFloat(el.getAttribute('x1') || 0);
          const dy = novoY - parseFloat(el.getAttribute('y1') || 0);
          el.setAttribute('x1', String(novoX));
          el.setAttribute('y1', String(novoY));
          el.setAttribute('x2', String(parseFloat(el.getAttribute('x2') || 0) + dx));
          el.setAttribute('y2', String(parseFloat(el.getAttribute('y2') || 0) + dy));
      } else if (tag === 'path' || tag === 'g' || tag == 'polygon') {
        // Aplica a translação nativa em vez de escrever string template
        this._definirTranslacao(el, novoX, novoY);
        atualizarTransformacao(el);
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
      } else if (tag === 'polygon') {
        if (el.dataset.shape === 'losango') {
        x = parseFloat(el.getAttribute('x') || 0);
        y = parseFloat(el.getAttribute('y') || 0);
      } else {
        const translacao = this._obterTranslacao(el);
        x = translacao.x;
        y = translacao.y;
      }
      } else if (tag === 'circle' || tag === 'ellipse') {
        x = parseFloat(el.getAttribute('cx') || 0);
        y = parseFloat(el.getAttribute('cy') || 0);
      } else if (tag === 'line') {
        x = parseFloat(el.getAttribute('x1') || 0);
        y = parseFloat(el.getAttribute('y1') || 0);
      } else if (tag === 'path' || tag === 'g') {
        const translacao = this._obterTranslacao(el);
        x = translacao.x;
        y = translacao.y;
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
      } 
      else if (tag === 'polygon') {
          if (el.dataset.shape === 'losango') {
          xAtual = parseFloat(el.getAttribute('x') || 0);
          yAtual = parseFloat(el.getAttribute('y') || 0);
        } else {
          const translacao = this._obterTranslacao(el);
          xAtual = translacao.x;
          yAtual = translacao.y;
        }
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

    // Se o elemento pertence a um ou mais grupos, seleciona o "Grupo Mestre" (o mais externo)
    const grupoMaisExterno = this._encontrarGrupoExterno(target);
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
   * Sobe na árvore a partir de um elemento e retorna o <g> mais externo
   * (o "grupo mestre") ao qual ele pertence, se houver algum.
   * @private
   */
  _encontrarGrupoExterno(elemento) {
    let grupoMaisExterno = null;
    let atual = elemento;

    while (atual && atual !== this.svgCanvas) {
      if (atual.tagName && atual.tagName.toLowerCase() === 'g') {
        grupoMaisExterno = atual; // Atualiza a variável toda vez que achar um <g>
      }
      atual = atual.parentNode;
    }

    return grupoMaisExterno;
  }

  /**
   * Fallback de seleção para linhas: como o hit-test nativo do SVG considera
   * apenas a espessura real do traço (stroke-width), linhas finas são muito
   * difíceis de clicar. Este método calcula a distância do ponto clicado até
   * cada segmento de linha do canvas e, se estiver dentro de uma tolerância
   * (a própria espessura da linha + uma margem extra em pixels de tela,
   * convertida para o espaço do SVG considerando o zoom atual), considera
   * a linha como alvo válido — sem alterar a espessura/estilo renderizado.
   * @private
   */
  _buscarLinhaProxima(pt) {
    const TOLERANCIA_EXTRA_PX = 6;
    const escala = this._obterEscalaSVG();
    const toleranciaExtra = TOLERANCIA_EXTRA_PX * escala;

    let linhaMaisProxima = null;
    let menorDistancia = Infinity;

    const linhas = this.svgCanvas.querySelectorAll('line');

    linhas.forEach((linha) => {
      const x1 = parseFloat(linha.getAttribute('x1')) || 0;
      const y1 = parseFloat(linha.getAttribute('y1')) || 0;
      const x2 = parseFloat(linha.getAttribute('x2')) || 0;
      const y2 = parseFloat(linha.getAttribute('y2')) || 0;

      const distancia = this._distanciaPontoSegmento(pt.x, pt.y, x1, y1, x2, y2);

      const espessura = parseFloat(linha.getAttribute('stroke-width')) || 1;
      const raioClicavel = espessura / 2 + toleranciaExtra;

      if (distancia <= raioClicavel && distancia < menorDistancia) {
        menorDistancia = distancia;
        linhaMaisProxima = linha;
      }
    });

    if (!linhaMaisProxima) return null;

    // Se a linha encontrada pertence a um grupo, seleciona o grupo mestre
    const grupoMaisExterno = this._encontrarGrupoExterno(linhaMaisProxima);
    return grupoMaisExterno || linhaMaisProxima;
  }

  /**
   * Calcula a menor distância entre um ponto (px, py) e um segmento de reta
   * definido por (x1, y1) - (x2, y2).
   * @private
   */
  _distanciaPontoSegmento(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const comprimentoQuadrado = dx * dx + dy * dy;

    let t = comprimentoQuadrado === 0
      ? 0
      : ((px - x1) * dx + (py - y1) * dy) / comprimentoQuadrado;
    t = Math.max(0, Math.min(1, t));

    const projX = x1 + t * dx;
    const projY = y1 + t * dy;

    return Math.hypot(px - projX, py - projY);
  }

  /**
   * Retorna o fator de escala atual entre o espaço do SVG (viewBox) e os
   * pixels de tela, para que a tolerância extra de clique se mantenha
   * visualmente consistente em qualquer nível de zoom.
   * @private
   */
  _obterEscalaSVG() {
    const viewBox = this.svgCanvas.viewBox && this.svgCanvas.viewBox.baseVal;
    if (viewBox && viewBox.width && this.svgCanvas.clientWidth) {
      return viewBox.width / this.svgCanvas.clientWidth;
    }
    return 1;
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
      }else if (tag === 'polygon') {
        if (el.dataset.shape === 'losango') {
        elX = parseFloat(el.getAttribute('x') || 0);
        elY = parseFloat(el.getAttribute('y') || 0);
      } else {
        const translacao = this._obterTranslacao(el);
        elX = translacao.x;
        elY = translacao.y;
      }} else if (tag === 'circle' || tag === 'ellipse') {
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
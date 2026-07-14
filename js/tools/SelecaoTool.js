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
  constructor(svgCanvas, selecaoVisual) {
    super();
    this.svgCanvas = svgCanvas;
    this.selecaoVisual = selecaoVisual;

    this.isDragging = false;
    this.offsets = [];
    this.estadoInicialMovimento = null;

    this.isSkewing = false;
    this.skewInicial = null;
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

    // Se não existir, cria a propriedade Translate na matriz do elemento.
    // Precisa ser inserida SEMPRE como o item mais externo (índice 0): se já
    // existir uma matriz de skew (aplicada primeiro, sobre a geometria local),
    // a translação tem que ser aplicada por último, ou o cisalhamento passa a
    // reagir à posição arrastada, deslocando a forma de forma espúria.
    if (!translateItem) {
      const svgRef = el.ownerSVGElement || this.svgCanvas;
      translateItem = svgRef.createSVGTransform();
      translateItem.setTranslate(x, y);
      transformList.insertItemBefore(translateItem, 0);
    } else {
      translateItem.setTranslate(x, y);
    }
  }

  /**
   * Lê a matriz de cisalhamento (skew) atual do elemento, se houver.
   * @private
   */
  _obterMatrizSkew(el) {
    const transformList = el.transform.baseVal;
    for (let i = 0; i < transformList.numberOfItems; i++) {
      const item = transformList.getItem(i);
      if (item.type === SVGTransform.SVG_TRANSFORM_MATRIX) {
        return item;
      }
    }
    return null;
  }

  /**
   * Aplica (ou atualiza) a matriz de cisalhamento combinada (X e Y) do
   * elemento, pivotada em `(cxLocal, cyLocal)` para que esse ponto não se
   * desloque visualmente. `kX` cisalha horizontalmente (varia com Y), `kY`
   * cisalha verticalmente (varia com X) — os dois convivem na mesma matriz.
   * @private
   */
  _aplicarSkewMatriz(el, kX, kY, cxLocal, cyLocal) {
    const transformList = el.transform.baseVal;
    const svgRef = el.ownerSVGElement || this.svgCanvas;
    let skewItem = this._obterMatrizSkew(el);

    if (!skewItem) {
      skewItem = svgRef.createSVGTransform();
      transformList.appendItem(skewItem);
    }

    const matriz = Object.assign(svgRef.createSVGMatrix(), {
      a: 1, b: kY, c: kX, d: 1, e: -kX * cyLocal, f: -kY * cxLocal
    });
    skewItem.setMatrix(matriz);
  }

  /**
   * Corrige o pivô de uma matriz de skew já existente após um arrasto que
   * mexeu diretamente em x/y/cx/cy (rect, circle, ellipse, text, image, line).
   * Esses elementos não têm uma translação nativa separada — arrastar move a
   * própria geometria local, então os termos `e`/`f` da matriz precisam se
   * mover junto para o cisalhamento continuar pivotado no mesmo ponto do
   * desenho.
   * @private
   */
  _ajustarSkewAoTransladar(el, dx, dy) {
    if (!dx && !dy) return;
    const skewItem = this._obterMatrizSkew(el);
    if (!skewItem) return;

    const svgRef = el.ownerSVGElement || this.svgCanvas;
    const m = skewItem.matrix;
    const matriz = Object.assign(svgRef.createSVGMatrix(), {
      a: 1, b: m.b, c: m.c, d: 1,
      e: m.e - m.c * dy,
      f: m.f - m.b * dx
    });
    skewItem.setMatrix(matriz);
  }

  /**
   * Inicia o cisalhamento (skew) a partir do arraste de uma das alças
   * próprias. Usa o mesmo centro (pivô) para todos os elementos
   * selecionados, para que a seleção cisalhe como um bloco rígido único, e
   * soma incrementalmente a um `k` inicial (caso o elemento já tenha sido
   * cisalhado antes nesse mesmo eixo).
   * @param {{x:number,y:number}} pt
   * @param {'x'|'y'} eixo
   * @private
   */
  _iniciarSkew(pt, eixo) {
    const bounds = this.selecaoVisual.obterBoundsSelecao(estado.elementosSelecionados);
    const cySelecao = (bounds.minY + bounds.maxY) / 2;
    const cxSelecao = (bounds.minX + bounds.maxX) / 2;

    this.skewInicial = {
      eixo,
      mouseInicial: eixo === 'x' ? pt.x : pt.y,
      denom: eixo === 'x' ? (bounds.minY - cySelecao) : (bounds.minX - cxSelecao),
      elementos: estado.elementosSelecionados.map(el => {
        const skewItem = this._obterMatrizSkew(el);
        const kXInicial = skewItem ? skewItem.matrix.c : 0;
        const kYInicial = skewItem ? skewItem.matrix.b : 0;
        const translacao = this._obterTranslacao(el);
        return {
          el,
          kXInicial,
          kYInicial,
          cxLocal: cxSelecao - translacao.x,
          cyLocal: cySelecao - translacao.y
        };
      })
    };
    this.isSkewing = true;
  }

  onMouseDown(evento) {
    const target = evento.target;

    // Alças de cisalhamento têm prioridade: sem isso, um <rect class="skew-handle">
    // seria confundido com uma forma arrastável pelo bloco abaixo.
    if (this.selecaoVisual && estado.elementosSelecionados.length > 0) {
      if (target === this.selecaoVisual.alcaSkewX) {
        this._iniciarSkew(obterCoordenadaSVG(evento, this.svgCanvas), 'x');
        return;
      }
      if (target === this.selecaoVisual.alcaSkewY) {
        this._iniciarSkew(obterCoordenadaSVG(evento, this.svgCanvas), 'y');
        return;
      }
    }

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
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
    if (this.isSkewing) {
      this._aplicarSkew(evento);
      return;
    }

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
        const dxAnterior = novoX - parseFloat(el.getAttribute('x') || 0);
        const dyAnterior = novoY - parseFloat(el.getAttribute('y') || 0);
        el.setAttribute('x', String(novoX));
        el.setAttribute('y', String(novoY));
        this._ajustarSkewAoTransladar(el, dxAnterior, dyAnterior);
        atualizarTransformacao(el);
      } else if (tag === 'polygon' && el.dataset.shape === 'losango') {
    // Código atual do losango
    const dxAnterior = novoX - parseFloat(el.getAttribute('x') || 0);
    const dyAnterior = novoY - parseFloat(el.getAttribute('y') || 0);
    el.setAttribute('x', String(novoX));
    el.setAttribute('y', String(novoY));

    const w = parseFloat(el.getAttribute('width') || 0);
    const h = parseFloat(el.getAttribute('height') || 0);

    const centroX = novoX + w / 2;
    const centroY = novoY + h / 2;

    const novosPontos =
        `${centroX},${novoY} ${novoX + w},${centroY} ${centroX},${novoY + h} ${novoX},${centroY}`;

    el.setAttribute('points', novosPontos);

    this._ajustarSkewAoTransladar(el, dxAnterior, dyAnterior);
    atualizarTransformacao(el);
      }else if (tag === 'polygon' && el.dataset.shape === 'poligono') {
        this._definirTranslacao(el, novoX, novoY);
        atualizarTransformacao(el);
      }else if (tag === 'circle' || tag === 'ellipse') {
        const dxAnterior = novoX - parseFloat(el.getAttribute('cx') || 0);
        const dyAnterior = novoY - parseFloat(el.getAttribute('cy') || 0);
        el.setAttribute('cx', String(novoX));
        el.setAttribute('cy', String(novoY));
        this._ajustarSkewAoTransladar(el, dxAnterior, dyAnterior);
        atualizarTransformacao(el);
      } else if (tag === 'line') {
          // Exemplo simplificado para linha (move mantendo comprimento)
          const dx = novoX - parseFloat(el.getAttribute('x1') || 0);
          const dy = novoY - parseFloat(el.getAttribute('y1') || 0);
          el.setAttribute('x1', String(novoX));
          el.setAttribute('y1', String(novoY));
          el.setAttribute('x2', String(parseFloat(el.getAttribute('x2') || 0) + dx));
          el.setAttribute('y2', String(parseFloat(el.getAttribute('y2') || 0) + dy));
          this._ajustarSkewAoTransladar(el, dx, dy);
      } else if (tag === 'path' || tag === 'g' || tag == 'polygon') {
        // Aplica a translação nativa em vez de escrever string template
        this._definirTranslacao(el, novoX, novoY);
        atualizarTransformacao(el);
      }
    });

    atualizarPosicaoSelecaoVisual();
  }

  /**
   * @private
   */
  _aplicarSkew(evento) {
    if (!this.skewInicial || this.skewInicial.denom === 0) return;

    const pt = obterCoordenadaSVG(evento, this.svgCanvas);
    const posicaoAtual = this.skewInicial.eixo === 'x' ? pt.x : pt.y;
    const incremento = (posicaoAtual - this.skewInicial.mouseInicial) / this.skewInicial.denom;

    this.skewInicial.elementos.forEach(({ el, kXInicial, kYInicial, cxLocal, cyLocal }) => {
      const kX = this.skewInicial.eixo === 'x' ? kXInicial + incremento : kXInicial;
      const kY = this.skewInicial.eixo === 'y' ? kYInicial + incremento : kYInicial;
      this._aplicarSkewMatriz(el, kX, kY, cxLocal, cyLocal);
    });

    atualizarPosicaoSelecaoVisual();
  }

  onMouseUp(evento) {
    if (this.isSkewing) {
      const houveSkew = this.skewInicial && this.skewInicial.elementos.some(({ el, kXInicial, kYInicial }) => {
        const skewItem = this._obterMatrizSkew(el);
        const kXFinal = skewItem ? skewItem.matrix.c : 0;
        const kYFinal = skewItem ? skewItem.matrix.b : 0;
        return kXFinal !== kXInicial || kYFinal !== kYInicial;
      });
      if (houveSkew) {
        registrarAcaoHistorico();
      }
      this.isSkewing = false;
      this.skewInicial = null;
      return;
    }

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
    this.isSkewing = false;
    this.skewInicial = null;
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
        const translacao = this._obterTranslacao(el);
        xAtual = translacao.x;
        yAtual = translacao.y;
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

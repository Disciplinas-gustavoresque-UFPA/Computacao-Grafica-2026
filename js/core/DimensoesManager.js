import { estado, registrarAcaoHistorico } from './StateManager.js';

export class DimensoesManager {
  constructor(selecaoVisual) {
    this.selecaoVisual = selecaoVisual;
    this.proporcaoTravada = false;
    this.proporcaoOriginal = 1;

    this.inputLargura = document.getElementById('input-largura');
    this.inputAltura  = document.getElementById('input-altura');
    this.btnCadeado   = document.getElementById('btn-cadeado');

    this.registrarEventos();
  }

  registrarEventos() {
    this.btnCadeado.addEventListener('click', () => this.mudaCadeado());
    this.inputLargura.addEventListener('change', () => this.mudarLargura());
    this.inputAltura.addEventListener('change',  () => this.mudarAltura());
  }

  mudaCadeado() {
    this.proporcaoTravada = !this.proporcaoTravada;
    this.btnCadeado.innerHTML = this.proporcaoTravada ? '&#128274;' : '&#128275;';

    if (this.proporcaoTravada) {
      const l = parseFloat(this.inputLargura.value);
      const a = parseFloat(this.inputAltura.value);
      if (a !== 0) this.proporcaoOriginal = l / a;
    }
  }

  mudarLargura() {
    const novaLargura = this.avaliarExpressao(this.inputLargura.value);
    if (!novaLargura) return;
    this.inputLargura.value = Number(novaLargura.toFixed(2));

    if (this.proporcaoTravada) {
      this.inputAltura.value = Number((novaLargura / this.proporcaoOriginal).toFixed(2));
    }
    this.aplicarDimensoesNoElemento();
  }

  mudarAltura() {
    const novaAltura = this.avaliarExpressao(this.inputAltura.value);
    if (!novaAltura) return;
    this.inputAltura.value = Number(novaAltura.toFixed(2));

    if (this.proporcaoTravada) {
      this.inputLargura.value = Number((novaAltura * this.proporcaoOriginal).toFixed(2));
    }
    this.aplicarDimensoesNoElemento();
  }

  avaliarExpressao(expressao) {
    const segura = String(expressao).replace(/[^0-9+\-*/.()]/g, '');
    try {
      const resultado = Function('"use strict"; return (' + segura + ')')();
      return isFinite(resultado) && resultado > 0 ? resultado : null;
    } catch {
      return null;
    }
  }

  aplicarDimensoesNoElemento() {
    const el = estado.elementosSelecionados[0];
    if (!el) return;

    const largura = parseFloat(this.inputLargura.value);
    const altura  = parseFloat(this.inputAltura.value);
    if (isNaN(largura) || isNaN(altura) || largura <= 0 || altura <= 0) return;

    this.aplicarDimensoes(el, largura, altura);
    this.selecaoVisual.desenhar(estado.elementosSelecionados);

    registrarAcaoHistorico();
  }

  aplicarDimensoes(el, largura, altura) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'rect' || tag === 'image') {
      el.setAttribute('width',  String(largura));
      el.setAttribute('height', String(altura));
    } else if (tag === 'circle') {
      el.setAttribute('r', String(largura / 2));
    } else if (tag === 'ellipse') {
      el.setAttribute('rx', String(largura / 2));
      el.setAttribute('ry', String(altura  / 2));
    } else if (tag === 'path' || tag === 'polygon' || tag === 'polyline') {
      const bbox = el.getBBox();
      if (bbox.width === 0 || bbox.height === 0) return;

      const scaleX = largura / bbox.width;
      const scaleY = altura  / bbox.height;

      // Escala a partir do canto superior esquerdo do elemento para não deslocá-lo
      el.setAttribute('transform',
        `translate(${bbox.x}, ${bbox.y}) scale(${scaleX}, ${scaleY}) translate(${-bbox.x}, ${-bbox.y})`
      );
    }
    // line: redimensionamento mais complicado, melhor abrir outra issue pra isso
  }

  // Pega a altura e a largura do elemento selecionado (só pra um elemento, por hora)
  atualizarInputs() {
    const selecionados = estado.elementosSelecionados;
    if (selecionados.length === 1) {
      const dimensoes = this.lerDimensoes(selecionados[0]);

      if (dimensoes) {
        this.inputLargura.value = Number(dimensoes.largura.toFixed(2));
        this.inputAltura.value  = Number(dimensoes.altura.toFixed(2));

        //Se estiver travado, recalcula a proporção baseada no novo elemento
        if (this.proporcaoTravada && dimensoes.altura !== 0) {
          this.proporcaoOriginal = dimensoes.largura / dimensoes.altura;
        }
        return;
      }
    }
    // se selecionar nenhum ou vários, não recebe nada
    this.inputLargura.value = '';
    this.inputAltura.value  = '';
  }

  lerDimensoes(elemento) {
    const tag = elemento.tagName.toLowerCase();
    if (tag === 'rect' || tag === 'image') {
      return {
        largura: parseFloat(elemento.getAttribute('width')  || 0),
        altura:  parseFloat(elemento.getAttribute('height') || 0),
      };
    } else if (tag === 'circle') {
      const r = parseFloat(elemento.getAttribute('r') || 0);
      return { largura: r * 2, altura: r * 2 };
    } else if (tag === 'ellipse') {
      return {
        largura: parseFloat(elemento.getAttribute('rx') || 0) * 2,
        altura:  parseFloat(elemento.getAttribute('ry') || 0) * 2,
      };
    } else if (tag === 'line') {
      const dx = parseFloat(elemento.getAttribute('x2') || 0) - parseFloat(elemento.getAttribute('x1') || 0);
      const dy = parseFloat(elemento.getAttribute('y2') || 0) - parseFloat(elemento.getAttribute('y1') || 0);
      return { largura: Math.abs(dx), altura: Math.abs(dy) };
    }
    // path, polygon, polyline — usa bounding box
    try {
      const bbox = elemento.getBBox();
      return { largura: bbox.width, altura: bbox.height };
    } catch {
      return null;
    }
  }
}
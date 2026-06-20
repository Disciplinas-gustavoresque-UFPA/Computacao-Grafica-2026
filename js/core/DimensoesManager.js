import { estado } from './StateManager.js';

export class DimensoesManager {
  constructor(selecaoVisual) {
    this.selecaoVisual = selecaoVisual;
    this.proporcaoTravada = false;
    this.proporcaoOriginal = 1;

    this.inputLargura = document.getElementById('input-largura');
    this.inputAltura  = document.getElementById('input-altura');
    this.btnCadeado   = document.getElementById('btn-cadeado');
  }

  //Pega a altura e a largura do elemento selecion (só pra um elemento, por hora)
  atualizarInputs(){
    const selecionados = estado.elementosSelecionados;
    if (selecionados.length === 1) {
      const dimensoes = this.lerDimensoes(selecionados[0]);
      if (dimensoes) {
        this.inputLargura.value = Number(dimensoes.largura.toFixed(2));
        this.inputAltura.value  = Number(dimensoes.altura.toFixed(2));
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
    try {
      const bbox = elemento.getBBox();
      return { largura: Math.round(bbox.width), altura: Math.round(bbox.height) };
    } catch {
      return null;
    }
  }
}
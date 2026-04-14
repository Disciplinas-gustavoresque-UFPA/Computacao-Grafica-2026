/**
 * main.js — Ponto de entrada da aplicação do Editor Vetorial.
 *
 * Responsabilidades:
 *  - Inicializar o estado global via StateManager
 *  - Registrar os event listeners globais no elemento SVG (#canvas)
 *  - Conectar os botões da barra de ferramentas ao StateManager
 */

import { estado, definirFerramenta, definirCorPreenchimento, definirCorBorda, definirGerenciadorSelecao } from './core/StateManager.js';
import { ColorPickerTool } from './tools/ColorPickerTool.js';
import { RetanguloTool } from './tools/RetanguloTool.js';
import { SelecaoTool } from './tools/SelecaoTool.js';
import { Selecao } from './core/Selecao.js';
import { LupaTool } from './tools/LupaTool.js';

// Referências aos elementos do DOM
const svgCanvas = document.getElementById('canvas');
const areaDesenho = document.getElementById('area-desenho');

// Wrapper para sincronizar perfeitamente as coordenadas do #canvas com o #overlay-canvas
const canvasContainer = document.createElement('div');
canvasContainer.style.position = 'relative';
canvasContainer.style.width = '100%';
canvasContainer.style.height = '100%';

// Encapsulando o svg original
svgCanvas.parentNode.insertBefore(canvasContainer, svgCanvas);
canvasContainer.appendChild(svgCanvas);

// 1. Camada de Interação: instanciar o novo SVG de overlay para seleções
const overlayCanvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
overlayCanvas.setAttribute('id', 'overlay-canvas');
overlayCanvas.setAttribute('width', '100%');
overlayCanvas.setAttribute('height', '100%');
overlayCanvas.style.position = 'absolute';
overlayCanvas.style.top = '0';
overlayCanvas.style.left = '0';
overlayCanvas.style.pointerEvents = 'none'; // Coordenado com o principal
canvasContainer.appendChild(overlayCanvas);

// Inicializar a classe de seleção
const selecaoVisual = new Selecao(overlayCanvas);
definirGerenciadorSelecao(selecaoVisual);



// Instâncias das ferramentas disponíveis
const instanciasFerramentas = {
  selecao: new SelecaoTool(svgCanvas),
  retangulo: new RetanguloTool(svgCanvas),
  "Conta-gotas": new ColorPickerTool(svgCanvas),
  // Futuras ferramentas (selecao, elipse, linha, texto) entrarão aqui
};


const botoesFerramenta = document.querySelectorAll('.btn-ferramenta');
const inputCorPreenchimento = (
  document.getElementById('cor-preenchimento')
);
const inputCorBorda = (
  document.getElementById('cor-borda')
);

const nomeFerramenta = document.getElementById('nome-ferramenta');


/**
 * Atualiza o estado visual dos botões da barra lateral,
 * destacando apenas o botão da ferramenta ativa.
 *
 * @param {string} nomeDaFerramenta - Identificador da ferramenta ativa.
 */
function atualizarBotaoAtivo(nomeDaFerramenta) {
  botoesFerramenta.forEach((btn) => {
    if (btn.getAttribute('data-ferramenta') === nomeDaFerramenta) {
      btn.classList.add('ativo');
    } else {
      btn.classList.remove('ativo');
    }
  });
  nomeFerramenta.textContent = nomeDaFerramenta || 'Nenhuma';
}

// --- Registro dos Event Listeners ---

// Seleciona a ferramenta ao clicar nos botões da barra lateral
botoesFerramenta.forEach((btn) => {
  btn.addEventListener('click', () => {
    const ferramentaId = btn.getAttribute('data-ferramenta');

    // Obtém a instância da ferramenta atual correspondente (se implementada)
    const ferramentaInstancia = instanciasFerramentas[ferramentaId] || null;

    definirFerramenta(ferramentaInstancia);
    atualizarBotaoAtivo(ferramentaId);
  });
});

// Atualiza a cor de preenchimento no estado global
inputCorPreenchimento.addEventListener('input', (evento) => {
  definirCorPreenchimento(inputCorPreenchimento.value);
});

// Atualiza a cor da borda no estado global
inputCorBorda.addEventListener('input', (evento) => {
  definirCorBorda(inputCorBorda.value);
});

// Event listeners globais do SVG (delegados para a ferramenta ativa)
svgCanvas.addEventListener('mousedown', (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseDown(evento);
  }
});

svgCanvas.addEventListener('mousemove', (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseMove(evento);
  }
});

svgCanvas.addEventListener('mouseup', (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseUp(evento);
  }
});

// Previne o menu de opções do botao direito no canvas
svgCanvas.addEventListener('contextmenu', (e) => {
  if (e.target.closest('#canvas')) {
    e.preventDefault();
  }
});

// Inicializa os valores dos inputs com os valores padrão do estado
inputCorPreenchimento.value = estado.corPreenchimento;
inputCorBorda.value = estado.corBorda;

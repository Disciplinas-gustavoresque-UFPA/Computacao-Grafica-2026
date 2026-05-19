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
import { exportarDesenho } from './utils/exportHelpers.js';
import { SelecaoTool } from './tools/SelecaoTool.js';
import { SideBar } from './core/SideBar.js';
import { Selecao } from './core/Selecao.js';

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

// Inicializar as abas da barra lateral direita
const sideBar = new SideBar();

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
  // Futuras ferramentas (elipse, linha, texto) entrarão aqui
};

const botoesFerramenta = document.querySelectorAll('.btn-ferramenta');
const inputCorPreenchimento = (
  document.getElementById('cor-preenchimento')
);
const inputCorBorda = (
  document.getElementById('cor-borda')
);

const nomeFerramenta = document.getElementById('nome-ferramenta');
const btnExportar = document.getElementById('btn-exportar');
const exportFormat = document.getElementById('export-format');

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


// Ouvir mudanças no input de preenchimento da Sidebar
inputCorPreenchimento.addEventListener('input', () => {
  const novaCor = inputCorPreenchimento.value;
  
  // Atualiza o estado global para as próximas formas que forem desenhadas
  definirCorPreenchimento(novaCor);

  // Se houver um objeto selecionado na tela, aplica a cor nele em tempo real
  if (estado.elementoSelecionado) {
    estado.elementoSelecionado.setAttribute('fill', novaCor);
  }
});

// Ouvir mudanças no input de borda da Sidebar
inputCorBorda.addEventListener('input', () => {
  const novaCor = inputCorBorda.value;
  
  // Atualiza o estado global para as próximas formas que forem desenhadas
  definirCorBorda(novaCor);

  // Se houver um objeto selecionado na tela, aplica a cor da borda nele em tempo real
  if (estado.elementoSelecionado) {
    estado.elementoSelecionado.setAttribute('stroke', novaCor);
  }
});

// Atualizar os inputs da barra lateral quando o usuário selecionar um objeto
// Usamos um MutationObserver ou interceptamos cliques no Canvas para capturar a seleção.
svgCanvas.addEventListener('mouseup', (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseUp(evento);
  }

  // Verifica se a ferramenta de seleção acabou de selecionar um elemento
  // Se houver um elemento selecionado, sincroniza a sidebar com as cores dele
  if (estado.elementoSelecionado) {
    const corPreenchimentoAtual = estado.elementoSelecionado.getAttribute('fill') || '#ffffff';
    const corBordaAtual = estado.elementoSelecionado.getAttribute('stroke') || '#000000';

    // Atualiza o valor visual dos inputs para bater com o objeto selecionado
    inputCorPreenchimento.value = corPreenchimentoAtual;
    inputCorBorda.value = corBordaAtual;

    // Atualiza também os valores armazenados no StateManager para consistência
    definirCorPreenchimento(corPreenchimentoAtual);
    definirCorBorda(corBordaAtual);
  }
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

// Inicializa os valores dos inputs com os valores padrão do estado
inputCorPreenchimento.value = estado.corPreenchimento;
inputCorBorda.value = estado.corBorda;

// Exportar / Salvar desenho
btnExportar.addEventListener('click', () => {
  const formato = exportFormat.value || 'png';
  exportarDesenho(svgCanvas, formato);
});

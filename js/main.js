/**
 * main.js — Ponto de entrada da aplicação do Editor Vetorial.
 *
 * Responsabilidades:
 * - Inicializar o estado global via StateManager
 * - Registrar os event listeners globais no elemento SVG (#canvas)
 * - Conectar os botões da barra de ferramentas ao StateManager
 */

import { 
  estado, 
  definirFerramenta, 
  definirCorPreenchimento, 
  definirCorBorda, 
  definirGerenciadorSelecao 
} from './core/StateManager.js';
import { ColorPickerTool } from './tools/ColorPickerTool.js';
import { RetanguloTool } from './tools/RetanguloTool.js';
import { SelecaoTool } from './tools/SelecaoTool.js';
import { Selecao } from './core/Selecao.js';
import { exportarDesenho } from './utils/exportHelpers.js';

const svgCanvas = document.getElementById('canvas');
const areaDesenho = document.getElementById('area-desenho');
const botoesFerramenta = document.querySelectorAll('.btn-ferramenta');
const btnImportarImagem = document.getElementById('btn-importar-imagem');
const inputImagem = document.getElementById('input-imagem');
const inputCorPreenchimento = document.getElementById('cor-preenchimento');
const inputCorBorda = document.getElementById('cor-borda');
const nomeFerramenta = document.getElementById('nome-ferramenta');
const btnExportar = document.getElementById('btn-exportar');
const exportFormat = document.getElementById('export-format');

// Wrapper para sincronizar perfeitamente as coordenadas do #canvas com o #overlay-canvas
const canvasContainer = document.createElement('div');
canvasContainer.style.position = 'relative';
canvasContainer.style.width = '100%';
canvasContainer.style.height = '100%';

// Encapsulando o svg original
svgCanvas.parentNode.insertBefore(canvasContainer, svgCanvas);
canvasContainer.appendChild(svgCanvas);

// Camada de Interação: instanciar o novo SVG de overlay para seleções
const overlayCanvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
overlayCanvas.setAttribute('id', 'overlay-canvas');
overlayCanvas.setAttribute('width', '100%');
overlayCanvas.setAttribute('height', '100%');
overlayCanvas.style.position = 'absolute';
overlayCanvas.style.top = '0';
overlayCanvas.style.left = '0';
overlayCanvas.style.pointerEvents = 'none'; // Coordenado com o principal
canvasContainer.appendChild(overlayCanvas);

// Inicializar a classe de seleção visual
const selecaoVisual = new Selecao(overlayCanvas);
definirGerenciadorSelecao(selecaoVisual);

// Instâncias das ferramentas disponíveis
const instanciasFerramentas = {
  selecao: new SelecaoTool(svgCanvas),
  retangulo: new RetanguloTool(svgCanvas),
  "Conta-gotas": new ColorPickerTool(svgCanvas),
  // Futuras ferramentas (elipse, linha, texto) entrarão aqui
};

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

// --- Barra de Ferramentas & Modos ---
botoesFerramenta.forEach((btn) => {
  btn.addEventListener('click', () => {
    const ferramentaId = btn.getAttribute('data-ferramenta');
    const ferramentaInstancia = instanciasFerramentas[ferramentaId] || null;

    definirFerramenta(ferramentaInstancia);
    atualizarBotaoAtivo(ferramentaId);
  });
});

// --- Importação de Imagens Raster ---
btnImportarImagem.addEventListener('click', () => {
  inputImagem.click();
});

inputImagem.addEventListener('change', (evento) => {
  const arquivo = evento.target.files[0];
  if (!arquivo) return;

  const reader = new FileReader();
  
  reader.onload = function(e) {
    const dataUrl = e.target.result;

    const svgImage = document.createElementNS('http://www.w3.org/2000/svg', 'image');
    svgImage.setAttribute('href', dataUrl);
    svgImage.setAttribute('x', '50');
    svgImage.setAttribute('y', '50');
    svgImage.setAttribute('width', '300');
    svgImage.setAttribute('height', '300');
    svgImage.classList.add('elemento-desenho'); 

    svgCanvas.appendChild(svgImage);
    inputImagem.value = ''; // Reseta para permitir re-upload do mesmo arquivo
  };

  reader.readAsDataURL(arquivo);
});

// --- Controles de Cor ---
inputCorPreenchimento.addEventListener('input', () => {
  definirCorPreenchimento(inputCorPreenchimento.value);
});

inputCorBorda.addEventListener('input', () => {
  definirCorBorda(inputCorBorda.value);
});

// --- Ações de Exportação ---
btnExportar.addEventListener('click', () => {
  const formato = exportFormat.value || 'png';
  exportarDesenho(svgCanvas, formato);
});

// --- Interações do Canvas (Delegação para a ferramenta ativa) ---
svgCanvas.addEventListener('mousedown', (evento) => {
  if (estado.ferramentaAtual) estado.ferramentaAtual.onMouseDown(evento);
});

svgCanvas.addEventListener('mousemove', (evento) => {
  if (estado.ferramentaAtual) estado.ferramentaAtual.onMouseMove(evento);
});

svgCanvas.addEventListener('mouseup', (evento) => {
  if (estado.ferramentaAtual) estado.ferramentaAtual.onMouseUp(evento);
});

inputCorPreenchimento.value = estado.corPreenchimento;
inputCorBorda.value = estado.corBorda;
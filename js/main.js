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
  definirGerenciadorSelecao,
  definirAreaPagina,
  obterAreaPagina,
} from './core/StateManager.js';
import { ColorPickerTool } from './tools/ColorPickerTool.js';
import { Lapis } from './tools/LapisTool.js';
import { RetanguloTool } from './tools/RetanguloTool.js';
import { TextoTool } from './tools/TextoTool.js';
import { exportarDesenho } from './utils/exportHelpers.js';
import { SelecaoTool } from './tools/SelecaoTool.js';
import { Selecao } from './core/Selecao.js';
import { BorrachaTool } from './tools/BorrachaTool.js';
import { NodeEditTool } from './tools/NodeEditTool.js';
import { LinhaTool } from './tools/LinhaTool.js';
import { ElipseTool } from './tools/ElipseTool.js';
import { LupaTool } from './tools/LupaTool.js';
import { inicializarImportadorImagem } from './tools/ImageImporter.js';
import { inicializarMenuInicial } from './core/UIManager.js';
import { PoligonoPolilinhaTool } from './tools/PoligonoPolilinhaTool.js';
import { PageManager } from './core/PageManager.js';
import { PageRenderer } from './core/PageRenderer.js';
import { abrirPreviewImpressao, imprimir } from './utils/printHelpers.js';

const svgCanvas = document.getElementById('canvas');

// Inicializar a tela de menu inicial
inicializarMenuInicial(svgCanvas);

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

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === 'viewBox') {
      const vb = svgCanvas.getAttribute('viewBox');
      if (vb) {
        overlayCanvas.setAttribute('viewBox', vb);
        if (pageManager && pageManager.interactionLayer) {
          pageManager.interactionLayer.setAttribute('viewBox', vb);
        }
      } else {
        overlayCanvas.removeAttribute('viewBox');
        if (pageManager && pageManager.interactionLayer) {
          pageManager.interactionLayer.removeAttribute('viewBox');
        }
      }
    }
  });
});
observer.observe(svgCanvas, { attributes: true, attributeFilter: ['viewBox'] });

// Inicializar a classe de seleção visual
const selecaoVisual = new Selecao(overlayCanvas);
definirGerenciadorSelecao(selecaoVisual);

// Inicializar o gerenciador e renderizador da área da página
const pageRenderer = new PageRenderer(svgCanvas, overlayCanvas);
const pageManager = new PageManager(overlayCanvas, obterAreaPagina());

pageManager.onMudou = (novaArea) => {
  definirAreaPagina(novaArea);
  pageRenderer.atualizar(novaArea);
  syncPageInputs(novaArea);
};

pageRenderer.atualizar(obterAreaPagina());

svgCanvas.addEventListener('canvas-cleared', () => {
  const area = obterAreaPagina();
  pageManager.setAreaPagina(area);
  pageRenderer.atualizar(area);
  syncPageInputs(area);
  if (window.cameraInstancia) {
    window.cameraInstancia.fitToPage(area);
    atualizarIndicadorZoom();
  }
});

// Instâncias das ferramentas disponíveis com todas as implementações da main
const instanciasFerramentas = {
  selecao: new SelecaoTool(svgCanvas),
  edicaoVertices: new NodeEditTool(svgCanvas),
  retangulo: new RetanguloTool(svgCanvas),
  linha: new LinhaTool(svgCanvas),    
  poligono: new PoligonoPolilinhaTool(svgCanvas),
  elipse: new ElipseTool(svgCanvas),  
  "Conta-gotas": new ColorPickerTool(svgCanvas),
  lupa: new LupaTool(svgCanvas, overlayCanvas),
  texto: new TextoTool(svgCanvas),
  borracha: new BorrachaTool(svgCanvas),
  lapis: new Lapis(svgCanvas),
};

// Expor a instância da câmera para uso em botões globais (fit-to-page)
window.cameraInstancia = instanciasFerramentas.lupa.camera;

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

// --- Controles de Cor ---
inputCorPreenchimento.addEventListener('input', () => {
  definirCorPreenchimento(inputCorPreenchimento.value);
});

inputCorBorda.addEventListener('input', () => {
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

// Previne o menu de opções do botão direito no canvas
svgCanvas.addEventListener('contextmenu', (e) => {
  if (e.target.closest('#canvas')) {
    e.preventDefault();
  }
});

// Inicializa os valores dos inputs com os valores padrão do estado
inputCorPreenchimento.value = estado.corPreenchimento;
inputCorBorda.value = estado.corBorda;

// Exportar / Salvar desenho
btnExportar.addEventListener('click', () => {
  const formato = exportFormat.value || 'png';
  const incluirExternos = document.getElementById('incluir-externos').checked;
  exportarDesenho(svgCanvas, formato, {
    incluirExternos,
    areaPagina: obterAreaPagina(),
  });
});

// Imprimir
const btnImprimir = document.getElementById('btn-imprimir');
btnImprimir.addEventListener('click', () => {
  abrirPreviewImpressao(svgCanvas, obterAreaPagina());
});

// Ajustar zoom à página
const btnFitPage = document.getElementById('btn-fit-page');
btnFitPage.addEventListener('click', () => {
  if (window.cameraInstancia) {
    window.cameraInstancia.fitToPage(obterAreaPagina());
    atualizarIndicadorZoom();
  }
});

function atualizarIndicadorZoom() {
  if (window.cameraInstancia) {
    const el = document.getElementById('zoom-indicator');
    if (el) el.textContent = `Zoom: ${window.cameraInstancia.getZoomLevel()}%`;
  }
}

// Controles de tamanho da página
const inputPageWidth = document.getElementById('page-width');
const inputPageHeight = document.getElementById('page-height');

function syncPageInputs(area) {
  inputPageWidth.value = Math.round(area.width);
  inputPageHeight.value = Math.round(area.height);
}

inputPageWidth.addEventListener('change', () => {
  const w = Math.max(50, parseInt(inputPageWidth.value) || 800);
  inputPageWidth.value = w;
  const area = obterAreaPagina();
  const novaArea = { ...area, width: w };
  definirAreaPagina(novaArea);
  pageManager.setAreaPagina(novaArea);
  pageRenderer.atualizar(novaArea);
});

inputPageHeight.addEventListener('change', () => {
  const h = Math.max(50, parseInt(inputPageHeight.value) || 1131);
  inputPageHeight.value = h;
  const area = obterAreaPagina();
  const novaArea = { ...area, height: h };
  definirAreaPagina(novaArea);
  pageManager.setAreaPagina(novaArea);
  pageRenderer.atualizar(novaArea);
});

// --- Controle de Camadas (Z-Index) ---
const btnSendToBack = document.getElementById('btn-send-to-back');
const btnStepBackward = document.getElementById('btn-step-backward');
const btnStepForward = document.getElementById('btn-step-forward');
const btnBringToFront = document.getElementById('btn-bring-to-front');

function moverCamada(acao) {
  const el = estado.elementoSelecionado;
  if (!el) return;

  const pai = el.parentNode;
  if (!pai) return;

  switch (acao) {
    case 'fundo':
      pai.prepend(el);
      break;
    case 'recuar':
      if (el.previousElementSibling) {
        el.previousElementSibling.before(el);
      }
      break;
    case 'avancar':
      if (el.nextElementSibling) {
        el.nextElementSibling.after(el);
      }
      break;
    case 'frente':
      pai.appendChild(el);
      break;
  }
}

btnSendToBack.addEventListener('click', () => moverCamada('fundo'));
btnStepBackward.addEventListener('click', () => moverCamada('recuar'));
btnStepForward.addEventListener('click', () => moverCamada('avancar'));
btnBringToFront.addEventListener('click', () => moverCamada('frente'));

// Atalhos de Teclado (Tool Selection)
window.addEventListener("keydown", (e) => {
  const elementoAtivo = document.activeElement;
  const tagAtiva = elementoAtivo.tagName.toLocaleLowerCase();

  if (["input", "textarea", "select"].includes(tagAtiva) || elementoAtivo.isContentEditable)
    return;

  // Ctrl+Shift+P: Imprimir
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
    e.preventDefault();
    abrirPreviewImpressao(svgCanvas, obterAreaPagina());
    return;
  }
  
  const mapaTeclas = {
    "s" : "selecao",
    "r" : "retangulo",
    "e" : "elipse",
    "l" : "linha",
    "p" : "poligono",
    "t" : "texto",
    "i" : "conta-gotas"
  }

  const teclaPressionada = e.key.toLowerCase();
  const ferramentaAlvo = mapaTeclas[teclaPressionada];
  
  if (ferramentaAlvo) {
    e.preventDefault();
    const botao = document.querySelector(`.btn-ferramenta[data-ferramenta="${ferramentaAlvo}"]`);
    if (botao) {
      botao.click();
    }
  }
});

// Importação de imagens
btnImportarImagem.addEventListener('click', () => {
  inputImagem.click();
});

inicializarImportadorImagem(svgCanvas, inputImagem);
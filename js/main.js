/**
 * main.js — Ponto de entrada da aplicação do Editor Vetorial.
 *
 * Responsabilidades:
 * - Inicializar o estado global via StateManager
 * - Registrar event listeners globais no elemento SVG (#canvas)
 * - Conectar os controles da interface ao estado da aplicação
 */

import { 
  estado, 
  definirFerramenta, 
  definirCorPreenchimento, 
  definirCorBorda, 
  definirGerenciadorSelecao,
  removerElementoSelecionado 
} from './core/StateManager.js';

import { ColorPickerTool } from './tools/ColorPickerTool.js';
import { RetanguloTool } from './tools/RetanguloTool.js';
import { LinhaTool } from './tools/LinhaTool.js';
import { ElipseTool } from './tools/ElipseTool.js';
import { SelecaoTool } from './tools/SelecaoTool.js';

import { exportarDesenho } from './utils/exportHelpers.js';
import { Selecao } from './core/Selecao.js';

/* ============================================================================
 * REFERÊNCIAS AO DOM
 * ========================================================================== */

const svgCanvas = document.getElementById('canvas');
const areaDesenho = document.getElementById('area-desenho');

const botoesFerramenta = document.querySelectorAll('.btn-ferramenta');
const inputCorPreenchimento = document.getElementById('cor-preenchimento');
const inputCorBorda = document.getElementById('cor-borda');

const nomeFerramenta = document.getElementById('nome-ferramenta');
const btnExportar = document.getElementById('btn-exportar');
const exportFormat = document.getElementById('export-format');

/* ============================================================================
 * CONFIGURAÇÃO DO CANVAS (WRAPPER + OVERLAY)
 * ========================================================================== */

/**
 * Cria um container para sincronizar coordenadas entre o canvas principal
 * e o canvas de overlay (usado para seleção).
 */
const canvasContainer = document.createElement('div');
canvasContainer.style.position = 'relative';
canvasContainer.style.width = '100%';
canvasContainer.style.height = '100%';

/**
 * Encapsula o SVG principal dentro do container.
 */
svgCanvas.parentNode.insertBefore(canvasContainer, svgCanvas);
canvasContainer.appendChild(svgCanvas);

/**
 * Cria o SVG de overlay responsável por elementos visuais de interação
 * (ex: seleção), sem interferir nos eventos do canvas principal.
 */
const overlayCanvas = document.createElementNS(
  'http://www.w3.org/2000/svg',
  'svg'
);

overlayCanvas.setAttribute('id', 'overlay-canvas');
overlayCanvas.setAttribute('width', '100%');
overlayCanvas.setAttribute('height', '100%');

overlayCanvas.style.position = 'absolute';
overlayCanvas.style.top = '0';
overlayCanvas.style.left = '0';
overlayCanvas.style.pointerEvents = 'none';

canvasContainer.appendChild(overlayCanvas);

/* ============================================================================
 * INICIALIZAÇÃO DO SISTEMA DE SELEÇÃO
 * ========================================================================== */

/**
 * Instancia o gerenciador de seleção visual e registra no estado global.
 */
const selecaoVisual = new Selecao(overlayCanvas);
definirGerenciadorSelecao(selecaoVisual);

/* ============================================================================
 * INSTÂNCIAS DAS FERRAMENTAS
 * ========================================================================== */

/**
 * Mapeamento das ferramentas disponíveis na aplicação.
 */
const instanciasFerramentas = {
  selecao: new SelecaoTool(svgCanvas),
  retangulo: new RetanguloTool(svgCanvas),
  linha: new LinhaTool(svgCanvas),
  elipse: new ElipseTool(svgCanvas),
  'Conta-gotas': new ColorPickerTool(svgCanvas),
};

/* ============================================================================
 * FUNÇÕES AUXILIARES DE UI
 * ========================================================================== */

/**
 * Atualiza o estado visual dos botões da barra lateral,
 * destacando apenas o botão da ferramenta ativa.
 *
 * @param {string} nomeDaFerramenta - Identificador da ferramenta ativa
 */
function atualizarBotaoAtivo(nomeDaFerramenta) {
  botoesFerramenta.forEach((btn) => {
    const ferramenta = btn.getAttribute('data-ferramenta');

    btn.classList.toggle('ativo', ferramenta === nomeDaFerramenta);
  });

  nomeFerramenta.textContent = nomeDaFerramenta || 'Nenhuma';
}

/* ============================================================================
 * REGISTRO DE EVENT LISTENERS
 * ========================================================================== */

/**
 * Seleção de ferramentas via interface (botões).
 */
botoesFerramenta.forEach((btn) => {
  btn.addEventListener('click', () => {
    const ferramentaId = btn.getAttribute('data-ferramenta');
    const ferramentaInstancia = instanciasFerramentas[ferramentaId] || null;

    definirFerramenta(ferramentaInstancia);
    atualizarBotaoAtivo(ferramentaId);
  });
});

/**
 * Atualização das cores no estado global.
 */
inputCorPreenchimento.addEventListener('input', () => {
  definirCorPreenchimento(inputCorPreenchimento.value);
});

inputCorBorda.addEventListener('input', () => {
  definirCorBorda(inputCorBorda.value);
});

/**
 * Delegação de eventos do mouse para a ferramenta ativa.
 */
svgCanvas.addEventListener('mousedown', (evento) => {
  estado.ferramentaAtual?.onMouseDown(evento);
});

svgCanvas.addEventListener('mousemove', (evento) => {
  estado.ferramentaAtual?.onMouseMove(evento);
});

svgCanvas.addEventListener('mouseup', (evento) => {
  estado.ferramentaAtual?.onMouseUp(evento);
});

/**
 * Inicializa inputs com valores do estado global.
 */
inputCorPreenchimento.value = estado.corPreenchimento;
inputCorBorda.value = estado.corBorda;

/**
 * Exportação do desenho.
 */
btnExportar.addEventListener('click', () => {
  const formato = exportFormat.value || 'png';
  exportarDesenho(svgCanvas, formato);
});

/* ============================================================================
 * ATALHOS DE TECLADO
 * ========================================================================== */

/**
 * Remove elemento selecionado ao pressionar Delete/Backspace,
 * exceto quando o foco está em campos de entrada.
 */
window.addEventListener('keydown', (evento) => {
  const tagAtiva = evento.target.tagName.toLowerCase();

  if (tagAtiva === 'input' || tagAtiva === 'textarea') return;

  if (evento.key === 'Delete' || evento.key === 'Backspace') {
    removerElementoSelecionado();
  }
});
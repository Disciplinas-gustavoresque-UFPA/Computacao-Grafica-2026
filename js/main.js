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
  definirOpacidadePreenchimento,
  definirOpacidadeBorda,
  definirEstiloLinha,
  definirGerenciadorSelecao,
  definirElementosSelecionados,
  definirGerenciadorHistorico,
  desfazerAcao,
  refazerAcao,
  registrarAcaoHistorico,
  definirCallbackPainelAlinhamento,
  atualizarPosicaoSelecaoVisual,
  definirEspessuraLapis,
} from "./core/StateManager.js";
import { ColorPickerTool } from "./tools/ColorPickerTool.js";
import { Lapis } from "./tools/LapisTool.js";
import { RetanguloTool } from "./tools/RetanguloTool.js";
import { TextoTool } from "./tools/TextoTool.js";
import { exportarDesenho } from "./utils/exportHelpers.js";
import { SelecaoTool } from "./tools/SelecaoTool.js";
import { Selecao } from "./core/Selecao.js";
import { BorrachaTool } from "./tools/BorrachaTool.js";
import { NodeEditTool } from "./tools/NodeEditTool.js";
import { LinhaTool } from "./tools/LinhaTool.js";
import { LinhaCurvadaTool } from "./tools/LinhaCurvadaTool.js";
import { BezierTool } from "./tools/BezierTool.js";
import { ElipseTool } from "./tools/ElipseTool.js";
import { EspiralTool } from "./tools/EspiralTool.js";
import { LupaTool } from "./tools/LupaTool.js";
import { inicializarImportadorImagem } from "./tools/ImageImporter.js";
import { inicializarMenuInicial } from "./core/UIManager.js";
import { duplicarElemento } from "./utils/duplicateHelpers.js";
import { PoligonoPolilinhaTool } from "./tools/PoligonoPolilinhaTool.js";
import { SideBar } from "./core/SideBar.js";
import { PincelTool } from "./tools/PincelTool.js";
import { CameraSVG } from "./core/CameraSVG.js";
import { ScrollbarSVG } from "./core/ScrollbarSVG.js";
import { obterCoordenadaSVG } from "./utils/svgHelpers.js";
import { HistoryManager } from "./core/HistoryManager.js";
import { Regua } from "./core/Regua.js";
import { LosangoTool } from "./tools/LosangoTool.js";
import { agruparElementos, desagruparElementos } from "./core/GroupManager.js";
import { espelharHorizontal, espelharVertical } from "./utils/flipHelpers.js";
import { salvarRascunho, marcarSalvo } from "./utils/autoSave.js";
import { ImageTracerManager } from "./tools/ImageTracerManager.js";
import { MedidorTool } from "./tools/MedidorTool.js";

const svgCanvas = document.getElementById("canvas");

// Instancia HistoryManager
const historyManager = new HistoryManager(svgCanvas);
definirGerenciadorHistorico(historyManager);

// Inicializar a tela de menu inicial
inicializarMenuInicial(svgCanvas);

// Inicializar a sidebar
const barraLateral = new SideBar();

const areaDesenho = document.getElementById("area-desenho");
const botoesFerramenta = document.querySelectorAll(".btn-ferramenta");
const btnImportarImagem = document.getElementById("btn-importar-imagem");
const inputImagem = document.getElementById("input-imagem");
const inputCorPreenchimento = document.getElementById("cor-preenchimento");
const inputCorBorda = document.getElementById("cor-borda");
const botoesEstiloLinha = document.querySelectorAll(".btn-line-style");
const nomeFerramenta = document.getElementById("nome-ferramenta");
const btnExportar = document.getElementById("btn-exportar");
const exportFormat = document.getElementById("export-format");
const inputEspessuraLapis = document.getElementById("espessura-lapis");

const indicadorNaoSalvo = document.getElementById("indicador-nao-salvo");
function mostrarIndicadorNaoSalvo() {
  if (indicadorNaoSalvo) indicadorNaoSalvo.classList.remove("oculto");
}
function ocultarIndicadorNaoSalvo() {
  if (indicadorNaoSalvo) indicadorNaoSalvo.classList.add("oculto");
}

// Botões de histórico
const btnDesfazer = document.getElementById("btn-desfazer");
const btnRefazer = document.getElementById("btn-refazer");

// Função para atualizar o estado dos botões de histórico
function atualizarBotoesHistorico() {
  if (!historyManager) return;

  const podeDesfazer = historyManager.podeDesfazer();
  const podeRefazer = historyManager.podeRefazer();

  if (btnDesfazer) {
    btnDesfazer.disabled = !podeDesfazer;
    btnDesfazer.title = podeDesfazer ? "Desfazer (Ctrl+Z)" : "Nada para desfazer";
  }

  if (btnRefazer) {
    btnRefazer.disabled = !podeRefazer;
    btnRefazer.title = podeRefazer ? "Refazer (Ctrl+Y / Ctrl+Shift+Z)" : "Nada para refazer";
  }
}

// Sobrescrever o método salvarEstado do historyManager para atualizar os botões
const salvarEstadoOriginal = historyManager.salvarEstado.bind(historyManager);
historyManager.salvarEstado = function () {
  const resultado = salvarEstadoOriginal();
  atualizarBotoesHistorico();
  return resultado;
};

const desfazerOriginal = historyManager.desfazer.bind(historyManager);
historyManager.desfazer = function () {
  const resultado = desfazerOriginal();
  atualizarBotoesHistorico();
  return resultado;
};

const refazerOriginal = historyManager.refazer.bind(historyManager);
historyManager.refazer = function () {
  const resultado = refazerOriginal();
  atualizarBotoesHistorico();
  return resultado;
};

if (btnDesfazer) {
  btnDesfazer.addEventListener("click", () => {
    desfazerAcao();
    atualizarBotoesHistorico();
  });
}

if (btnRefazer) {
  btnRefazer.addEventListener("click", () => {
    refazerAcao();
    atualizarBotoesHistorico();
  });
}

// Novos botões de "Nenhum" e Sliders de opacidade
const btnPreenchimentoNenhum = document.getElementById("btn-preenchimento-nenhum");
const btnBordaNenhum = document.getElementById("btn-borda-nenhum");
const sliderOpacidadePreenchimento = document.getElementById("opacity-preenchimento");
const sliderOpacidadeBorda = document.getElementById("opacity-borda");
const txtOpacidadePreenchimento = document.getElementById('val-opacity-fill');
const txtOpacidadeBorda = document.getElementById('val-opacity-stroke');

// Wrapper para sincronizar perfeitamente as coordenadas do #canvas com o #overlay-canvas
const canvasContainer = document.createElement("div");
canvasContainer.style.position = "relative";
canvasContainer.style.width = "100%";
canvasContainer.style.height = "100%";
canvasContainer.style.paddingTop = "20px";
canvasContainer.style.paddingLeft = "20px";

svgCanvas.parentNode.insertBefore(canvasContainer, svgCanvas);
canvasContainer.appendChild(svgCanvas);

const overlayCanvas = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
overlayCanvas.setAttribute('id', 'overlay-canvas');
overlayCanvas.setAttribute('width', '100%');
overlayCanvas.setAttribute('height', '100%');
overlayCanvas.style.position = 'absolute';
overlayCanvas.style.top = '0';
overlayCanvas.style.left = '0';
overlayCanvas.style.pointerEvents = 'none'; // Coordenado com o principal
canvasContainer.appendChild(overlayCanvas);

// Réguas de medida
const regua = new Regua(canvasContainer, svgCanvas);
const btnToggleRegua = document.getElementById("btn-toggle-regua");
if (btnToggleRegua) {
  btnToggleRegua.addEventListener("click", () => {
    const ativa = regua.alternar();
    btnToggleRegua.classList.toggle("ativo", ativa);
  });
}

const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.attributeName === "viewBox") {
      const vb = svgCanvas.getAttribute("viewBox");
      if (vb) {
        overlayCanvas.setAttribute("viewBox", vb);
      } else {
        overlayCanvas.removeAttribute("viewBox");
      }
    }
  });
});
observer.observe(svgCanvas, { attributes: true, attributeFilter: ["viewBox"] });

const selecaoVisual = new Selecao(overlayCanvas);
definirGerenciadorSelecao(selecaoVisual);

const cameraGlobal = new CameraSVG([svgCanvas, overlayCanvas]);
const scrollbar = new ScrollbarSVG(canvasContainer, svgCanvas, cameraGlobal);
const instanciasFerramentas = {
  selecao: new SelecaoTool(svgCanvas, selecaoVisual),
  edicaoVertices: new NodeEditTool(svgCanvas),
  retangulo: new RetanguloTool(svgCanvas),
  linha: new LinhaTool(svgCanvas),
  linhaCurvada: new LinhaCurvadaTool(svgCanvas),
  bezier: new BezierTool(svgCanvas),
  poligono: new PoligonoPolilinhaTool(svgCanvas),
  elipse: new ElipseTool(svgCanvas),
  espiral: new EspiralTool(svgCanvas),
  "Conta-gotas": new ColorPickerTool(svgCanvas),
  lupa: new LupaTool(svgCanvas, overlayCanvas, cameraGlobal),
  texto: new TextoTool(svgCanvas),
  borracha: new BorrachaTool(svgCanvas),
  lapis: new Lapis(svgCanvas),
  losango: new LosangoTool(svgCanvas),
  pincel: new PincelTool(svgCanvas),
  medidor: new MedidorTool(svgCanvas, cameraGlobal),
};

function atualizarBotaoAtivo(nomeDaFerramenta) {
  let btnAtivo = null;
  botoesFerramenta.forEach((btn) => {
    if (btn.getAttribute("data-ferramenta") === nomeDaFerramenta) {
      btn.classList.add("ativo");
      btnAtivo = btn;
    } else {
      btn.classList.remove("ativo");
    }
  });
  nomeFerramenta.textContent = btnAtivo?.dataset.nome || "Nenhuma";
}

botoesFerramenta.forEach((btn) => {
  btn.addEventListener("click", () => {
    const ferramentaId = btn.getAttribute("data-ferramenta");
    if (!ferramentaId) return;

    const ferramentaInstancia = instanciasFerramentas[ferramentaId] || null;

    if (
      ferramentaId === "linha" &&
      estado.ferramentaAtual === ferramentaInstancia &&
      typeof ferramentaInstancia.openPanel === "function"
    ) {
      ferramentaInstancia.openPanel();
      return;
    }

    definirFerramenta(ferramentaInstancia);
    atualizarBotaoAtivo(ferramentaId);
  });
});

inputCorPreenchimento.addEventListener("input", () => {
  const novaCor = inputCorPreenchimento.value;
  definirCorPreenchimento(novaCor);
  estado.elementosSelecionados.forEach((el) => {
    el.setAttribute("fill", novaCor);
  });
});

inputCorBorda.addEventListener("input", () => {
  const novaCor = inputCorBorda.value;
  definirCorBorda(novaCor);
  estado.elementosSelecionados.forEach((el) => {
    el.setAttribute("stroke", novaCor);
  });
});

function atualizarBotaoEstiloLinhaAtivo(estiloLinha) {
  botoesEstiloLinha.forEach((btn) => {
    btn.classList.toggle("ativo", btn.dataset.estiloLinha === estiloLinha);
  });
}

botoesEstiloLinha.forEach((btn) => {
  btn.addEventListener("click", () => {
    const estiloLinha = btn.dataset.estiloLinha;
    definirEstiloLinha(estiloLinha);
    atualizarBotaoEstiloLinhaAtivo(estiloLinha);
  });
});

svgCanvas.addEventListener("mouseup", (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseUp(evento);
  }

  const primeiroSelecionado = estado.elementosSelecionados[0];
  if (primeiroSelecionado) {
    const corPreenchimentoAtual = primeiroSelecionado.getAttribute('fill') || '#ffffff';
    const corBordaAtual = primeiroSelecionado.getAttribute('stroke') || '#000000';
    const opacidadePreenchimentoAtual = primeiroSelecionado.getAttribute('fill-opacity') || '1';
    const opacidadeBordaAtual = primeiroSelecionado.getAttribute('stroke-opacity') || '1';

    if (corPreenchimentoAtual !== "none" && corPreenchimentoAtual.startsWith("#")) {
      inputCorPreenchimento.value = corPreenchimentoAtual;
    }
    if (corBordaAtual !== "none" && corBordaAtual.startsWith("#")) {
      inputCorBorda.value = corBordaAtual;
    }

    if (sliderOpacidadePreenchimento) sliderOpacidadePreenchimento.value = opacidadePreenchimentoAtual;
    if (sliderOpacidadeBorda) sliderOpacidadeBorda.value = opacidadeBordaAtual;
    if (txtOpacidadePreenchimento) txtOpacidadePreenchimento.textContent = `${Math.round(opacidadePreenchimentoAtual * 100)}%`;
    if (txtOpacidadeBorda) txtOpacidadeBorda.textContent = `${Math.round(opacidadeBordaAtual * 100)}%`;

    definirCorPreenchimento(corPreenchimentoAtual);
    definirCorBorda(corBordaAtual);
    definirOpacidadePreenchimento(opacidadePreenchimentoAtual);
    definirOpacidadeBorda(opacidadeBordaAtual);
  }

  salvarRascunho(svgCanvas, estado, "editor");
  mostrarIndicadorNaoSalvo();
});

// --- Listeners de Cor Nula e Opacidade ---
if (btnPreenchimentoNenhum) {
  btnPreenchimentoNenhum.addEventListener('click', () => {
    definirCorPreenchimento('none');
    estado.elementosSelecionados.forEach(el => el.setAttribute('fill', 'none'));
    registrarAcaoHistorico();
    atualizarBotoesHistorico();
  });
}

if (btnBordaNenhum) {
  btnBordaNenhum.addEventListener('click', () => {
    definirCorBorda('none');
    estado.elementosSelecionados.forEach(el => el.setAttribute('stroke', 'none'));
    registrarAcaoHistorico();
    atualizarBotoesHistorico();
  });
}

if (sliderOpacidadePreenchimento) {
  sliderOpacidadePreenchimento.addEventListener("input", () => {
    const valor = sliderOpacidadePreenchimento.value;
    definirOpacidadePreenchimento(valor);
    if (txtOpacidadePreenchimento) txtOpacidadePreenchimento.textContent = `${Math.round(valor * 100)}%`;
    estado.elementosSelecionados.forEach(el => el.setAttribute('fill-opacity', valor));
  });

  sliderOpacidadePreenchimento.addEventListener('change', () => {
    registrarAcaoHistorico();
    atualizarBotoesHistorico();
  });
}

if (sliderOpacidadeBorda) {
  sliderOpacidadeBorda.addEventListener("input", () => {
    const valor = sliderOpacidadeBorda.value;
    definirOpacidadeBorda(valor);
    if (txtOpacidadeBorda) txtOpacidadeBorda.textContent = `${Math.round(valor * 100)}%`;
    estado.elementosSelecionados.forEach(el => el.setAttribute('stroke-opacity', valor));
  });

  sliderOpacidadeBorda.addEventListener("change", () => {
    registrarAcaoHistorico();
    atualizarBotoesHistorico();
  });
}

// Event listeners globais do SVG (delegados para a ferramenta ativa)
svgCanvas.addEventListener("mousedown", (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseDown(evento);
  }
});

svgCanvas.addEventListener("mousemove", (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseMove(evento);
  }
});

svgCanvas.addEventListener("dblclick", (evento) => {
  if (estado.ferramentaAtual && typeof estado.ferramentaAtual.onDblClick === 'function') {
    estado.ferramentaAtual.onDblClick(evento);
  }
});

overlayCanvas.addEventListener("mousedown", (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseDown(evento);
  }
});

overlayCanvas.addEventListener("mousemove", (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseMove(evento);
  }
});

overlayCanvas.addEventListener("mouseup", (evento) => {
  if (estado.ferramentaAtual) {
    estado.ferramentaAtual.onMouseUp(evento);
  }
  salvarRascunho(svgCanvas, estado, "editor");
  mostrarIndicadorNaoSalvo();
});

svgCanvas.addEventListener("contextmenu", (e) => {
  if (e.target.closest("#canvas")) {
    e.preventDefault();
  }
});

inputCorPreenchimento.value = estado.corPreenchimento;
inputCorBorda.value = estado.corBorda;
atualizarBotaoEstiloLinhaAtivo(estado.estiloLinha);

btnExportar.addEventListener("click", () => {
  const formato = exportFormat.value || "png";
  exportarDesenho(svgCanvas, formato);
});

const valorEspessura = document.getElementById("valor-espessura-lapis");
if (inputEspessuraLapis) {
  inputEspessuraLapis.addEventListener("input", (e) => {
    definirEspessuraLapis(e.target.value);
    if (valorEspessura) valorEspessura.textContent = e.target.value;
  });
}

// --- Controle de Camadas (Z-Index) ---
const btnSendToBack = document.getElementById("btn-send-to-back");
const btnStepBackward = document.getElementById("btn-step-backward");
const btnStepForward = document.getElementById("btn-step-forward");
const btnBringToFront = document.getElementById("btn-bring-to-front");

function moverCamada(acao) {
  const elementos = estado.elementosSelecionados;
  if (!elementos || elementos.length === 0) return;

  const el = elementos[0];
  if (!el) return;

  const pai = el.parentNode;
  if (!pai) return;

  switch (acao) {
    case "fundo": pai.prepend(el); break;
    case "recuar": if (el.previousElementSibling) el.previousElementSibling.before(el); break;
    case "avancar": if (el.nextElementSibling) el.nextElementSibling.after(el); break;
    case "frente": pai.appendChild(el); break;
  }

  registrarAcaoHistorico();
  atualizarBotoesHistorico();
}

if (btnSendToBack) btnSendToBack.addEventListener("click", () => moverCamada("fundo"));
if (btnStepBackward) btnStepBackward.addEventListener("click", () => moverCamada("recuar"));
if (btnStepForward) btnStepForward.addEventListener("click", () => moverCamada("avancar"));
if (btnBringToFront) btnBringToFront.addEventListener("click", () => moverCamada("frente"));

const btnFlipHorizontal = document.getElementById("btn-flip-horizontal");
const btnFlipVertical = document.getElementById("btn-flip-vertical");

if (btnFlipHorizontal) {
  btnFlipHorizontal.addEventListener("click", () => {
    estado.elementosSelecionados.forEach(el => espelharHorizontal(el));
    atualizarPosicaoSelecaoVisual();
    registrarAcaoHistorico();
  });
}

if (btnFlipVertical) {
  btnFlipVertical.addEventListener("click", () => {
    estado.elementosSelecionados.forEach(el => espelharVertical(el));
    atualizarPosicaoSelecaoVisual();
    registrarAcaoHistorico();
  });
}

// --- Atalhos de Teclado ---
window.addEventListener("keydown", (e) => {
  const elementoAtivo = document.activeElement;
  const tagAtiva = elementoAtivo.tagName.toLocaleLowerCase();

  if (["input", "textarea", "select"].includes(tagAtiva) || elementoAtivo.isContentEditable) return;

  if (e.ctrlKey || e.metaKey) {
    if (e.key.toLowerCase() === "g") {
      e.preventDefault();
      if (e.shiftKey) {
        desagruparElementos();
      } else {
        agruparElementos();
      }
      atualizarBotoesHistorico();
      return;
    }
    if (e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) refazerAcao(); else desfazerAcao();
      atualizarBotoesHistorico();
      return;
    }
    if (e.key.toLowerCase() === "y") {
      e.preventDefault();
      refazerAcao();
      atualizarBotoesHistorico();
      return;
    }
    if (e.key === "]" || e.key === "}") {
      e.preventDefault();
      moverCamada(e.shiftKey ? "frente" : "avancar");
      return;
    }
    if (e.key === "[" || e.key === "{") {
      e.preventDefault();
      moverCamada(e.shiftKey ? "fundo" : "recuar");
      return;
    }
    if (['c', 'v', 'd'].includes(e.key.toLowerCase())) return;
  }

  const teclaPressionada = e.key.toLowerCase();

  if (e.shiftKey) {
    const mapaTeclasShift = { c: "bezier", e: "espiral" };

    if (teclaPressionada === "z") {
      e.preventDefault();
      const btnDrag = document.getElementById("btn-drag");
      if (btnDrag) {
        btnDrag.click();
      } else {
        const botaoZoom = document.querySelector('.btn-ferramenta[data-ferramenta="lupa"]');
        if (botaoZoom) {
          botaoZoom.click();
          setTimeout(() => document.getElementById("btn-drag")?.click(), 0);
        }
      }
    } else if (teclaPressionada === "i") {
      e.preventDefault();
      btnImportarImagem?.click();
    } else if (teclaPressionada === "h") {
      e.preventDefault();
      btnFlipHorizontal?.click();
    } else if (teclaPressionada === "v") {
      e.preventDefault();
      btnFlipVertical?.click();
    } else if (teclaPressionada === "r") {
      e.preventDefault();
      btnToggleRegua?.click();
    } else if (mapaTeclasShift[teclaPressionada]) {
      e.preventDefault();
      document.querySelector(`.btn-ferramenta[data-ferramenta="${mapaTeclasShift[teclaPressionada]}"]`)?.click();
    }
    return;
  }

  const mapaTeclas = {
    s: "selecao", r: "retangulo", e: "elipse", l: "linha",
    c: "linhaCurvada", g: "poligono", p: "lapis", t: "texto",
    i: "Conta-gotas", b: "borracha", v: "edicaoVertices", z: "lupa",
    d: "pincel", h: "losango", m: "medidor",
  };

  if (e.key === "Delete" || e.key === "Backspace") {
    if (estado.elementosSelecionados && estado.elementosSelecionados.length > 0) {
      estado.elementosSelecionados.forEach((el) => el.remove());
      definirElementosSelecionados([]);
      atualizarPosicaoSelecaoVisual();
      registrarAcaoHistorico();
      atualizarBotoesHistorico();
    }
    return;
  }

  const ferramentaAlvo = mapaTeclas[teclaPressionada];
  if (ferramentaAlvo) {
    e.preventDefault();
    document.querySelector(`.btn-ferramenta[data-ferramenta="${ferramentaAlvo}"]`)?.click();
  }
});

// --- Área de Transferência (Copiar / Colar) ---
let clipboard = [];       
let pasteCount = 0;       
const PASTE_OFFSET = 20;  

function handlerDuplicar() {
  const el = estado.elementosSelecionados[0];
  if (el) {
    const clone = duplicarElemento(el, svgCanvas);
    if (clone) definirElementosSelecionados(clone);
  }
}

document.addEventListener('keydown', (evento) => {
  if (!(evento.ctrlKey || evento.metaKey)) return;
  const tecla = evento.key.toLowerCase();

  if (tecla === 'd') {
    evento.preventDefault();
    handlerDuplicar();
    return;
  }

  if (tecla === 'c') {
    if (estado.elementosSelecionados.length === 0) return;
    evento.preventDefault();
    clipboard = estado.elementosSelecionados.map(el => el.cloneNode(true));
    pasteCount = 0;
    return;
  }

  if (tecla === 'v') {
    if (clipboard.length === 0) return;
    evento.preventDefault();
    pasteCount++;
    const offset = PASTE_OFFSET * pasteCount;
    const novosElementos = [];

    clipboard.forEach(original => {
      const clone = duplicarElemento(original, svgCanvas, offset, offset);
      if (clone) novosElementos.push(clone);
    });

    if (novosElementos.length > 0) {
      definirElementosSelecionados(novosElementos);
      registrarAcaoHistorico();
      atualizarBotoesHistorico();
    }
    return;
  }
});

if (btnImportarImagem) {
  btnImportarImagem.addEventListener("click", () => inputImagem.click());
}
inicializarImportadorImagem(svgCanvas, inputImagem);

const tracerManager = new ImageTracerManager(svgCanvas, inputImagem);
const tabTracer = document.getElementById("tab-tracer");
if (tabTracer) {
  const observerTab = new MutationObserver(() => {
    if (tabTracer.classList.contains('ativo')) tracerManager.atualizarLista();
  });
  observerTab.observe(tabTracer, { attributes: true, attributeFilter: ['class'] });
}

atualizarBotoesHistorico();

svgCanvas.addEventListener("wheel", (e) => {
  if (!e.ctrlKey) return;
  e.preventDefault();
  const coords = obterCoordenadaSVG(e, svgCanvas);
  const fator = 0.1;
  const escala = e.deltaY > 0 ? 1 + fator : 1 - fator;

  cameraGlobal.zoom(escala, coords.x, coords.y);
  if (scrollbar && typeof scrollbar.atualizar === 'function') {
      scrollbar.atualizar();
  }
}, { passive: false });
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
  adicionarCorRecente, 
} from "./core/StateManager.js";
import { rgbToHex } from "./utils/colorHelpers.js";
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
import { inicializarMenuContexto } from "./contextMenu/index.js";
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
import {
  alinharEsquerda,
  alinharCentroHorizontal,
  alinharDireita,
  alinharTopo,
  alinharCentroVertical,
  alinharBase,
  distribuirHorizontalmente,
  distribuirVerticalmente,
} from "./utils/alignHelpers.js";
import { salvarRascunho, marcarSalvo } from "./utils/autoSave.js";
import { ImageTracerManager } from "./tools/ImageTracerManager.js";
import { MedidorTool } from "./tools/MedidorTool.js";
import { ToolbarGroup } from "./core/ToolbarGroup.js";
import { PaletaImg } from "./tools/PaletasImg.js";
import {
  aplicarGradientePreenchimento,
  obterInfoGradiente,
  ehGradiente,
  definirGradientePadrao,
} from "./utils/gradientHelpers.js";

const svgCanvas = document.getElementById("canvas");

// Instancia HistoryManager
const historyManager = new HistoryManager(svgCanvas);
definirGerenciadorHistorico(historyManager);

// Inicializar a tela de menu inicial
inicializarMenuInicial(svgCanvas);

// Inicializar a sidebar
const barraLateral = new SideBar();
const toolbarGroup = new ToolbarGroup();

const areaDesenho = document.getElementById("area-desenho");
const botoesFerramenta = document.querySelectorAll(".btn-ferramenta");
const btnImportarImagem = document.getElementById("btn-importar-imagem");
const inputImagem = document.getElementById("input-imagem");
const inputCorPreenchimento = document.getElementById("cor-preenchimento");
const inputCorBorda = document.getElementById("cor-borda");

// Controles de tipo de preenchimento (sólido / gradiente linear / gradiente radial)
const radiosTipoPreenchimento = document.querySelectorAll('input[name="tipo-preenchimento"]');
const linhaPreenchimentoSolido = document.getElementById("preenchimento-solido-row");
const linhaPreenchimentoGradiente = document.getElementById("preenchimento-gradiente-row");
const inputCorGradienteInicio = document.getElementById("cor-gradiente-inicio");
const inputCorGradienteFim = document.getElementById("cor-gradiente-fim");

const popupCores = document.getElementById("popup-cores");
const popupCorPreenchimento = document.getElementById("popup-cor-preenchimento");
const popupFillTipo = document.getElementById("popup-fill-tipo");
const popupGradienteCores = document.getElementById("popup-gradiente-cores");
const popupCorGradienteInicio = document.getElementById("popup-cor-gradiente-inicio");
const popupCorGradienteFim = document.getElementById("popup-cor-gradiente-fim");
const popupCorBorda = document.getElementById("popup-cor-borda");
const popupStrokeWidth = document.getElementById("popup-stroke-width");
const popupBotoesEstilo = document.querySelectorAll(".btn-estilo-borda");
const botoesEstiloLinha = document.querySelectorAll(".btn-line-style");
const nomeFerramenta = document.getElementById("nome-ferramenta");
const btnExportar = document.getElementById("btn-exportar");
const exportFormat = document.getElementById("export-format");
const inputEspessuraLapis = document.getElementById("espessura-lapis");


const indicadorNaoSalvo = document.getElementById("indicador-nao-salvo");

const painelPaleta = document.getElementById("paleta-cores");
const paletaImg = new PaletaImg(painelPaleta);

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
    btnDesfazer.title = podeDesfazer
      ? "Desfazer (Ctrl+Z)"
      : "Nada para desfazer";
  }

  if (btnRefazer) {
    btnRefazer.disabled = !podeRefazer;
    btnRefazer.title = podeRefazer
      ? "Refazer (Ctrl+Y / Ctrl+Shift+Z)"
      : "Nada para refazer";
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

// Configurar event listeners dos botões de histórico
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

// Novos botões de "Nenhum"
const btnPreenchimentoNenhum = document.getElementById(
  "btn-preenchimento-nenhum",
);
const btnBordaNenhum = document.getElementById("btn-borda-nenhum");

// Novos Sliders de opacidade
const sliderOpacidadePreenchimento = document.getElementById(
  "opacity-preenchimento",
);
const sliderOpacidadeBorda = document.getElementById("opacity-borda");

// Wrapper para sincronizar perfeitamente as coordenadas do #canvas com o #overlay-canvas
const canvasContainer = document.createElement("div");
canvasContainer.style.position = "relative";
canvasContainer.style.width = "100%";
canvasContainer.style.height = "100%";
canvasContainer.style.paddingTop = "20px";
canvasContainer.style.paddingLeft = "20px";

// Encapsulando o svg original
svgCanvas.parentNode.insertBefore(canvasContainer, svgCanvas);
canvasContainer.appendChild(svgCanvas);

// Camada de Interação: instanciar o novo SVG de overlay para seleções
const overlayCanvas = document.createElementNS(
  "http://www.w3.org/2000/svg",
  "svg",
);
overlayCanvas.setAttribute("id", "overlay-canvas");
overlayCanvas.setAttribute("width", "100%");
overlayCanvas.setAttribute("height", "100%");
overlayCanvas.style.position = "absolute";
overlayCanvas.style.top = "0";
overlayCanvas.style.left = "0";
overlayCanvas.style.pointerEvents = "none"; // Coordenado com o principal
canvasContainer.appendChild(overlayCanvas);

// Réguas de medida (em pixels) nas bordas do canvas
const regua = new Regua(canvasContainer, svgCanvas);
const btnToggleRegua = document.getElementById("btn-toggle-regua");
if (btnToggleRegua) {
  btnToggleRegua.addEventListener("click", () => {
    const ativa = regua.alternar();
    btnToggleRegua.classList.toggle("ativo", ativa);
  });
}

// Sincronizar viewBox entre canvas principal e overlay quando necessário
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

// Inicializar a classe de seleção visual
const selecaoVisual = new Selecao(overlayCanvas);
definirGerenciadorSelecao(selecaoVisual);

// Instâncias das ferramentas disponíveis com todas as implementações da main
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

/**
 * Atualiza o estado visual dos botões da sidebar,
 * destacando apenas o botão da ferramenta ativa.
 *
 * @param {string} nomeDaFerramenta - Identificador da ferramenta ativa.
 */
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

// --- Barra de Ferramentas & Modos ---
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

// --- Popup de Cores ---

function normalizarCorHex(cor, fallback) {
  if (!cor || cor === "none" || cor === "transparent") return fallback;
  if (cor.startsWith("#"))
    return cor.length === 4
      ? "#" +
          cor
            .slice(1)
            .split("")
            .map((c) => c + c)
            .join("")
      : cor;
  if (cor.startsWith("rgb")) return rgbToHex(cor);
  return fallback;
}

function atualizarBotaoEstiloAtivo(estilo) {
  popupBotoesEstilo.forEach((btn) => {
    btn.classList.toggle("ativo", btn.getAttribute("data-dash") === estilo);
  });
}

function detectarEstiloBorda(el) {
  const linecap = el.getAttribute("stroke-linecap");
  const dash = el.getAttribute("stroke-dasharray");
  if (linecap === "round" && dash && dash.startsWith("0 ")) return "dot";
  if (!dash || dash === "none") return "none";
  return dash;
}

function aplicarEstiloBorda(el, estilo) {
  if (estilo === "none") {
    el.removeAttribute("stroke-dasharray");
    el.removeAttribute("stroke-linecap");
  } else if (estilo === "dot") {
    const sw = Math.max(1, Number(el.getAttribute("stroke-width") || 2));
    el.setAttribute("stroke-linecap", "round");
    el.setAttribute("stroke-dasharray", `0 ${sw * 2.5}`);
  } else {
    el.setAttribute("stroke-dasharray", estilo);
    el.removeAttribute("stroke-linecap");
  }
}

function sincronizarInputsCores(elementos) {
  const el = elementos[0];
  const fillAttr = el.getAttribute('fill');
  const stroke = normalizarCorHex(el.getAttribute('stroke'), estado.corBorda);
  const strokeWidth = el.getAttribute('stroke-width') || '2';
  const fillOpacity = el.getAttribute('fill-opacity') || '1';
  const strokeOpacity = el.getAttribute('stroke-opacity') || '1';

  if (ehGradiente(fillAttr)) {
    const info = obterInfoGradiente(svgCanvas, el);
    const tipo = info ? info.tipo : 'linear';

    popupFillTipo.value = tipo;
    popupCorPreenchimento.classList.add('oculto');
    popupGradienteCores.classList.remove('oculto');

    if (info) {
      popupCorGradienteInicio.value = info.corInicio;
      popupCorGradienteFim.value = info.corFim;
      inputCorGradienteInicio.value = info.corInicio;
      inputCorGradienteFim.value = info.corFim;
    }

    const radioAlvo = document.getElementById(`tipo-preenchimento-${tipo}`);
    if (radioAlvo) radioAlvo.checked = true;
    atualizarVisibilidadeControlesPreenchimento(tipo);

    definirCorPreenchimento(fillAttr);
  } else {
    const fill = normalizarCorHex(fillAttr, estado.corPreenchimento);

    popupFillTipo.value = 'solido';
    popupCorPreenchimento.classList.remove('oculto');
    popupGradienteCores.classList.add('oculto');
    popupCorPreenchimento.value = fill;
    inputCorPreenchimento.value = fill;

    document.getElementById('tipo-preenchimento-solido').checked = true;
    atualizarVisibilidadeControlesPreenchimento('solido');

    definirCorPreenchimento(fill);
  }

  popupCorBorda.value = stroke;
  inputCorBorda.value = stroke;
  popupStrokeWidth.value = strokeWidth;
  
// Se o preenchimento do objeto selecionado for um gradiente, sincroniza
    // o alternador Sólido/Gradiente e os color-pickers "De"/"Para".
    if (typeof ehGradiente === 'function' && ehGradiente(corPreenchimentoAtual)) {
      const infoGradiente = obterInfoGradiente(svgCanvas, primeiroSelecionado);
      if (infoGradiente) {
        const radioAlvo = document.getElementById(`tipo-preenchimento-${infoGradiente.tipo}`);
        if (radioAlvo) radioAlvo.checked = true;
        if (inputCorGradienteInicio) inputCorGradienteInicio.value = infoGradiente.corInicio;
        if (inputCorGradienteFim) inputCorGradienteFim.value = infoGradiente.corFim;
        atualizarVisibilidadeControlesPreenchimento(infoGradiente.tipo);
      }
    } else {
      const radioSolido = document.getElementById("tipo-preenchimento-solido");
      if (radioSolido) radioSolido.checked = true;
      if (typeof atualizarVisibilidadeControlesPreenchimento === 'function') {
        atualizarVisibilidadeControlesPreenchimento("solido");
      }
    }

    // Atualiza visualmente os Sliders de Opacidade na UI com segurança (sua branch)
    if (sliderOpacidadePreenchimento) {
      sliderOpacidadePreenchimento.value = opacidadePreenchimentoAtual;
    }
    if (sliderOpacidadeBorda) {
      sliderOpacidadeBorda.value = opacidadeBordaAtual;
    }
    if (txtOpacidadePreenchimento) {
      txtOpacidadePreenchimento.textContent = `${Math.round(opacidadePreenchimentoAtual * 100)}%`;
    }
    if (txtOpacidadeBorda) {
      txtOpacidadeBorda.textContent = `${Math.round(opacidadeBordaAtual * 100)}%`;
    }
  atualizarBotaoEstiloAtivo(detectarEstiloBorda(el));

  definirCorBorda(stroke);
  definirOpacidadePreenchimento(fillOpacity);
  definirOpacidadeBorda(strokeOpacity);
}

document.addEventListener("selecao-mudou", (e) => {
  const elementos = e.detail.elementos;
  if (elementos.length > 0) {
    sincronizarInputsCores(elementos);
    popupCores.classList.add("visivel");
  } else {
    popupCores.classList.remove('visivel');
    popupFillTipo.value = 'solido';
    popupCorPreenchimento.classList.remove('oculto');
    popupGradienteCores.classList.add('oculto');
    if (!ehGradiente(estado.corPreenchimento) && estado.corPreenchimento !== 'none') {
      popupCorPreenchimento.value = estado.corPreenchimento;
    }
    popupCorBorda.value = estado.corBorda;
  }
});

popupCorPreenchimento.addEventListener("input", () => {
  const novaCor = popupCorPreenchimento.value;
  definirCorPreenchimento(novaCor);
  inputCorPreenchimento.value = novaCor;
  estado.elementosSelecionados.forEach(el => el.setAttribute('fill', novaCor));
});

/**
 * Aplica o preenchimento escolhido no popup (sólido ou gradiente) aos
 * elementos selecionados, e mantém a sidebar sincronizada com a mesma
 * escolha.
 */
function aplicarPreenchimentoPopup() {
  const tipo = popupFillTipo.value;

  if (tipo === 'solido') {
    const cor = popupCorPreenchimento.value;
    definirCorPreenchimento(cor);
    inputCorPreenchimento.value = cor;
    estado.elementosSelecionados.forEach(el => el.setAttribute('fill', cor));
  } else {
    const corInicio = popupCorGradienteInicio.value;
    const corFim = popupCorGradienteFim.value;
    estado.elementosSelecionados.forEach(el => {
      aplicarGradientePreenchimento(svgCanvas, el, tipo, corInicio, corFim);
    });
    inputCorGradienteInicio.value = corInicio;
    inputCorGradienteFim.value = corFim;
  }

  popupCorPreenchimento.classList.toggle('oculto', tipo !== 'solido');
  popupGradienteCores.classList.toggle('oculto', tipo === 'solido');

  // Mantém o painel lateral sincronizado com a mesma escolha
  const radioAlvo = document.getElementById(`tipo-preenchimento-${tipo}`);
  if (radioAlvo) radioAlvo.checked = true;
  atualizarVisibilidadeControlesPreenchimento(tipo);
}

popupFillTipo.addEventListener('change', aplicarPreenchimentoPopup);
popupCorGradienteInicio.addEventListener('input', aplicarPreenchimentoPopup);
popupCorGradienteFim.addEventListener('input', aplicarPreenchimentoPopup);

popupCorBorda.addEventListener('input', () => {
  const novaCor = popupCorBorda.value;
  definirCorBorda(novaCor);
  inputCorBorda.value = novaCor;
  estado.elementosSelecionados.forEach((el) =>
    el.setAttribute("stroke", novaCor),
  );
});

popupStrokeWidth.addEventListener("input", () => {
  const largura = Math.max(0, Number(popupStrokeWidth.value));
  estado.elementosSelecionados.forEach((el) => {
    el.setAttribute("stroke-width", largura);
    // Pontilhado: recalcula o espaço entre pontos para manter a aparência
    if (detectarEstiloBorda(el) === "dot") {
      el.setAttribute("stroke-dasharray", `0 ${Math.max(1, largura) * 2.5}`);
    }
  });
});

popupBotoesEstilo.forEach((btn) => {
  btn.addEventListener("click", () => {
    const estilo = btn.getAttribute("data-dash");
    estado.elementosSelecionados.forEach((el) =>
      aplicarEstiloBorda(el, estilo),
    );
    atualizarBotaoEstiloAtivo(estilo);
  });
});

// Ouvir mudanças no input de cor de preenchimento da sidebar
inputCorPreenchimento.addEventListener("input", () => {
  const novaCor = inputCorPreenchimento.value;
  definirCorPreenchimento(novaCor);
  // Preenche cada elemento selecionado com a cor desejada
  estado.elementosSelecionados.forEach((el) => {
    el.setAttribute("fill", novaCor);
  });
});

inputCorPreenchimento.addEventListener("change", () => {
  registrarAcaoHistorico();
  atualizarBotoesHistorico();
});

// --- Preenchimento em Gradiente (linear/radial) ---

/**
 * Retorna o tipo de preenchimento selecionado no rádio da sidebar
 * ('solido' | 'linear' | 'radial').
 */
function obterTipoPreenchimentoSelecionado() {
  const radioMarcado = Array.from(radiosTipoPreenchimento).find(r => r.checked);
  return radioMarcado ? radioMarcado.value : "solido";
}

/**
 * Mostra/esconde as linhas de cor sólida x gradiente conforme o tipo escolhido.
 */
function atualizarVisibilidadeControlesPreenchimento(tipo) {
  const ehGradienteSelecionado = tipo === "linear" || tipo === "radial";
  linhaPreenchimentoSolido.classList.toggle("oculto", ehGradienteSelecionado);
  linhaPreenchimentoGradiente.classList.toggle("oculto", !ehGradienteSelecionado);
}

/**
 * Aplica o preenchimento (sólido ou gradiente, conforme o tipo selecionado)
 * a todos os elementos atualmente selecionados. Se não houver nenhum
 * elemento selecionado, apenas define o preenchimento "corrente", que será
 * usado automaticamente pelas PRÓXIMAS formas desenhadas.
 */
function aplicarPreenchimentoAtual() {
  const tipo = obterTipoPreenchimentoSelecionado();
  const haSelecao = estado.elementosSelecionados.length > 0;

  if (tipo === "solido") {
    const cor = inputCorPreenchimento.value;
    definirCorPreenchimento(cor);
    if (haSelecao) {
      estado.elementosSelecionados.forEach(el => el.setAttribute("fill", cor));
    }
  } else {
    const corInicio = inputCorGradienteInicio.value;
    const corFim = inputCorGradienteFim.value;

    if (haSelecao) {
      // Cada elemento selecionado ganha (ou atualiza) seu próprio gradiente.
      estado.elementosSelecionados.forEach(el => {
        aplicarGradientePreenchimento(svgCanvas, el, tipo, corInicio, corFim);
      });
    } else {
      // Sem seleção: define o gradiente como preenchimento padrão, para que
      // a próxima forma desenhada já nasça com ele.
      const referenciaGradiente = definirGradientePadrao(svgCanvas, tipo, corInicio, corFim);
      definirCorPreenchimento(referenciaGradiente);
    }
  }

  if (haSelecao) {
    registrarAcaoHistorico();
    atualizarBotoesHistorico();
    salvarRascunho(svgCanvas, estado, "editor");
    mostrarIndicadorNaoSalvo();
  }
}

radiosTipoPreenchimento.forEach(radio => {
  radio.addEventListener("change", () => {
    atualizarVisibilidadeControlesPreenchimento(radio.value);
    aplicarPreenchimentoAtual();
  });
});

inputCorGradienteInicio.addEventListener("input", aplicarPreenchimentoAtual);
inputCorGradienteFim.addEventListener("input", aplicarPreenchimentoAtual);

// Ouvir mudanças no input de cor de borda da sidebar
inputCorBorda.addEventListener("input", () => {
  const novaCor = inputCorBorda.value;
  definirCorBorda(novaCor);
  // Colore a borda de cada elemento selecionado com a cor desejada
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

// Atualizar os inputs da sidebar quando o usuário selecionar um objeto
// Usamos um MutationObserver ou interceptamos cliques no Canvas para capturar a seleção.
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

    // Se o preenchimento do objeto selecionado for um gradiente, sincroniza
    // o alternador Sólido/Gradiente e os color-pickers "De"/"Para".
    if (typeof ehGradiente === 'function' && ehGradiente(corPreenchimentoAtual)) {
      const infoGradiente = obterInfoGradiente(svgCanvas, primeiroSelecionado);
      if (infoGradiente) {
        const radioAlvo = document.getElementById(`tipo-preenchimento-${infoGradiente.tipo}`);
        if (radioAlvo) radioAlvo.checked = true;
        if (inputCorGradienteInicio) inputCorGradienteInicio.value = infoGradiente.corInicio;
        if (inputCorGradienteFim) inputCorGradienteFim.value = infoGradiente.corFim;
        atualizarVisibilidadeControlesPreenchimento(infoGradiente.tipo);
      }
    } else {
      const radioSolido = document.getElementById("tipo-preenchimento-solido");
      if (radioSolido) radioSolido.checked = true;
      if (typeof atualizarVisibilidadeControlesPreenchimento === 'function') {
        atualizarVisibilidadeControlesPreenchimento("solido");
      }
    }

    // Atualiza visualmente os Sliders de Opacidade na UI com segurança
    if (sliderOpacidadePreenchimento) {
      sliderOpacidadePreenchimento.value = opacidadePreenchimentoAtual;
    }
    if (sliderOpacidadeBorda) {
      sliderOpacidadeBorda.value = opacidadeBordaAtual;
    }
    if (txtOpacidadePreenchimento) {
      txtOpacidadePreenchimento.textContent = `${Math.round(opacidadePreenchimentoAtual * 100)}%`;
    }
    if (txtOpacidadeBorda) {
      txtOpacidadeBorda.textContent = `${Math.round(opacidadeBordaAtual * 100)}%`;
    }
    
    definirCorPreenchimento(corPreenchimentoAtual);
    definirCorBorda(corBordaAtual);
    definirOpacidadePreenchimento(opacidadePreenchimentoAtual);
    definirOpacidadeBorda(opacidadeBordaAtual);
  }

  salvarRascunho(svgCanvas, estado, "editor");
  mostrarIndicadorNaoSalvo();
});

btnPreenchimentoNenhum.addEventListener("click", () => {
  definirCorPreenchimento("none");

  estado.elementosSelecionados.forEach((el) => {
    el.setAttribute("fill", "none");
  });

  document.getElementById("tipo-preenchimento-solido").checked = true;
  atualizarVisibilidadeControlesPreenchimento("solido");
  
  registrarAcaoHistorico();
  atualizarBotoesHistorico();
});

btnBordaNenhum.addEventListener("click", () => {
  definirCorBorda("none");

  estado.elementosSelecionados.forEach((el) => {
    el.setAttribute("stroke", "none");
  });

  registrarAcaoHistorico();
  atualizarBotoesHistorico();
});

// listeners de opacidade
if (sliderOpacidadePreenchimento) {
  sliderOpacidadePreenchimento.addEventListener("input", () => {
    const valor = sliderOpacidadePreenchimento.value;
    definirOpacidadePreenchimento(valor);
    if (txtOpacidadePreenchimento) txtOpacidadePreenchimento.textContent = `${Math.round(valor * 100)}%`;
    
    estado.elementosSelecionados.forEach(el => {
      el.setAttribute('fill-opacity', valor);
    });
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
    
    estado.elementosSelecionados.forEach(el => {
      el.setAttribute('stroke-opacity', valor);
    });
  });

  sliderOpacidadeBorda.addEventListener("change", () => {
    registrarAcaoHistorico();
    atualizarBotoesHistorico();
  });
}

sliderOpacidadePreenchimento.addEventListener("input", () => {
  const valor = sliderOpacidadePreenchimento.value;
  
  estado.elementosSelecionados.forEach(el => {
    el.setAttribute('fill-opacity', valor);
  });
});

sliderOpacidadePreenchimento.addEventListener('change', () => {
  // Salva no histórico apenas quando o usuário soltar o slider
  registrarAcaoHistorico();
  atualizarBotoesHistorico();
});

sliderOpacidadeBorda.addEventListener("input", () => {
  const valor = sliderOpacidadeBorda.value;
  
  estado.elementosSelecionados.forEach(el => {
    el.setAttribute('stroke-opacity', valor);
  });
});

sliderOpacidadeBorda.addEventListener("change", () => {
  registrarAcaoHistorico();
  atualizarBotoesHistorico();
});

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
  if (
    estado.ferramentaAtual &&
    typeof estado.ferramentaAtual.onDblClick === "function"
  ) {
    estado.ferramentaAtual.onDblClick(evento);
  }
});

// O overlay tem pointer-events:none, exceto nos elementos de UI habilitados de forma explícita
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
  // Auto-save silencioso após ações realizadas via overlay (ex: mover seleções, lápis)
  salvarRascunho(svgCanvas, estado, "editor");
  mostrarIndicadorNaoSalvo();
});

// Previne o menu de opções do botão direito no canvas
svgCanvas.addEventListener("contextmenu", (e) => {
  if (e.target.closest("#canvas")) {
    e.preventDefault();
  }
});

// Inicializa os valores dos inputs com os valores padrão do estado
inputCorPreenchimento.value = estado.corPreenchimento;
inputCorBorda.value = estado.corBorda;
popupFillTipo.value = 'solido';
popupCorPreenchimento.value = estado.corPreenchimento;
popupCorBorda.value = estado.corBorda;
atualizarBotaoEstiloLinhaAtivo(estado.estiloLinha);

// Exportar / Salvar desenho
btnExportar.addEventListener("click", () => {
  const formato = exportFormat.value || "png";
  exportarDesenho(svgCanvas, formato);
});

const valorEspessura = document.getElementById("valor-espessura-lapis");

inputEspessuraLapis.addEventListener("input", (e) => {
  definirEspessuraLapis(e.target.value);
  valorEspessura.textContent = e.target.value;
});

// --- Controle de Camadas (Z-Index) ---
const btnSendToBack = document.getElementById("btn-send-to-back");
const btnStepBackward = document.getElementById("btn-step-backward");
const btnStepForward = document.getElementById("btn-step-forward");
const btnBringToFront = document.getElementById("btn-bring-to-front");

function moverCamada(acao) {
  const elementos = estado.elementosSelecionados;
  if (!elementos || elementos.length === 0) return;

  // Move o primeiro elemento selecionado (para simplicidade)
  const el = elementos[0];
  if (!el) return;

  const pai = el.parentNode;
  if (!pai) return;

  switch (acao) {
    case "fundo":
      pai.prepend(el);
      break;
    case "recuar":
      if (el.previousElementSibling) {
        el.previousElementSibling.before(el);
      }
      break;
    case "avancar":
      if (el.nextElementSibling) {
        el.nextElementSibling.after(el);
      }
      break;
    case "frente":
      pai.appendChild(el);
      break;
  }

  registrarAcaoHistorico();
  atualizarBotoesHistorico();
}

btnSendToBack.addEventListener("click", () => moverCamada("fundo"));
btnStepBackward.addEventListener("click", () => moverCamada("recuar"));
btnStepForward.addEventListener("click", () => moverCamada("avancar"));
btnBringToFront.addEventListener("click", () => moverCamada("frente"));

// --- Configurar Espelhamento ---
const btnFlipHorizontal = document.getElementById("btn-flip-horizontal");
const btnFlipVertical = document.getElementById("btn-flip-vertical");

btnFlipHorizontal.addEventListener("click", () => {
  estado.elementosSelecionados.forEach((el) => {
    espelharHorizontal(el);
  });
  atualizarPosicaoSelecaoVisual();
  registrarAcaoHistorico();
});

btnFlipVertical.addEventListener("click", () => {
  estado.elementosSelecionados.forEach((el) => {
    espelharVertical(el);
  });
  atualizarPosicaoSelecaoVisual();
  registrarAcaoHistorico();
});

// Atalhos de Teclado (Tool Selection)
window.addEventListener("keydown", (e) => {
  // Prevenção de conflitos
  // Verifica se o usuário está focado em um campo de texto ou input de cor.
  const elementoAtivo = document.activeElement;
  const tagAtiva = elementoAtivo.tagName.toLocaleLowerCase();

  // Se o foco estiver em um input, textArea, select ou contentEditable, ignora o atalho.
  if (
    ["input", "textarea", "select"].includes(tagAtiva) ||
    elementoAtivo.isContentEditable
  )
    return;

  // Atalhos de teclado para o histórico
  if (e.ctrlKey || e.metaKey) {
    if (e.key.toLowerCase() === "g") {
      e.preventDefault();
      if (e.shiftKey) {
        desagruparElementos();
      } else {
        agruparElementos();
      }
      atualizarBotoesHistorico(); // Sincroniza a interface de histórico
      return;
    }
    if (e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) {
        refazerAcao();
      } else {
        desfazerAcao();
      }
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
    // Ctrl+C / Ctrl+V / Ctrl+D são tratados em outro listener — apenas impede
    // que caiam no mapa de atalhos de ferramenta abaixo.
    if (["c", "v", "d"].includes(e.key.toLowerCase())) {
      return;
    }
  }

  const teclaPressionada = e.key.toLowerCase();

  // Atalhos com Shift
  if (e.shiftKey) {
    const mapaTeclasShift = {
      c: "bezier",
      e: "espiral",
    };

    if (teclaPressionada === "z") {
      e.preventDefault();
      const btnDrag = document.getElementById("btn-drag");
      if (btnDrag) {
        btnDrag.click();
      } else {
        const botaoZoom = document.querySelector(
          '.btn-ferramenta[data-ferramenta="lupa"]',
        );
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
      const botao = document.querySelector(
        `.btn-ferramenta[data-ferramenta="${mapaTeclasShift[teclaPressionada]}"]`,
      );
      if (botao) {
        botao.click();
      }
    }
    return;
  }

  const mapaTeclas = {
    s: "selecao",
    r: "retangulo",
    e: "elipse",
    l: "linha",
    c: "linhaCurvada",
    g: "poligono",
    p: "lapis",
    t: "texto",
    i: "Conta-gotas",
    b: "borracha",
    v: "edicaoVertices",
    z: "lupa",
    d: "pincel",
    h: "losango",
    m: "medidor",
  };

  // --- LÓGICA DE DELEÇÃO ---
  if (e.key === "Delete" || e.key === "Backspace") {
    if (
      estado.elementosSelecionados &&
      estado.elementosSelecionados.length > 0
    ) {
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
    const botao = document.querySelector(
      `.btn-ferramenta[data-ferramenta="${ferramentaAlvo}"]`,
    );
    if (botao) {
      botao.click();
    }
  }
});

// --- Área de Transferência (Copiar / Colar) ---
let clipboard = [];
let pasteCount = 0;
const PASTE_OFFSET = 20;

// --- Duplicar elemento ---
function handlerDuplicar() {
  const el = estado.elementosSelecionados[0];
  if (el) {
    const clone = duplicarElemento(el, svgCanvas);
    if (clone) {
      definirElementosSelecionados(clone);
    }
  }
}

document.addEventListener("keydown", (evento) => {
  if (!(evento.ctrlKey || evento.metaKey)) return;

  const tecla = evento.key.toLowerCase();

  // Ctrl+D — Duplicar
  if (tecla === "d") {
    evento.preventDefault();
    handlerDuplicar();
    return;
  }

  // Ctrl+C — Copiar elementos selecionados para a área de transferência interna
  if (tecla === "c") {
    if (estado.elementosSelecionados.length === 0) return;
    evento.preventDefault();
    clipboard = estado.elementosSelecionados.map((el) => el.cloneNode(true));
    pasteCount = 0;
    return;
  }

  // Ctrl+V — Colar elementos da área de transferência interna
  if (tecla === "v") {
    if (clipboard.length === 0) return;
    evento.preventDefault();
    pasteCount++;
    const offset = PASTE_OFFSET * pasteCount;
    const novosElementos = [];

    clipboard.forEach((original) => {
      const clone = duplicarElemento(original, svgCanvas, offset, offset);
      if (clone) {
        novosElementos.push(clone);
      }
    });

    if (novosElementos.length > 0) {
      definirElementosSelecionados(novosElementos);
      registrarAcaoHistorico();
      atualizarBotoesHistorico();
    }
    return;
  }
});

const txtOpacidadePreenchimento = document.getElementById('val-opacity-fill');
const txtOpacidadeBorda = document.getElementById('val-opacity-stroke');

// Importação de imagens
btnImportarImagem.addEventListener("click", () => {
  inputImagem.click();
});

inicializarImportadorImagem(svgCanvas, inputImagem);

// --- Inicialização do ImageTracer ---
const tracerManager = new ImageTracerManager(svgCanvas, inputImagem);
// Assiste a aba do Tracer para atualizar a lista de imagens quando ela for ativada
const tabTracer = document.getElementById("tab-tracer");
if (tabTracer) {
  const observerTab = new MutationObserver(() => {
    // Verifica se a classe 'ativo' foi adicionada pela SideBar.js
    if (tabTracer.classList.contains("ativo")) {
      tracerManager.atualizarLista();
    }
  });
  observerTab.observe(tabTracer, {
    attributes: true,
    attributeFilter: ["class"],
  });
}

const containerCoresRecentes = document.getElementById("cores-recentes-container");

// 1. Função de Renderização Corrigida (com "Ar" e verificações robustas)
function renderizarCoresRecentes(cores) {
  if (!containerCoresRecentes) return;
  
  containerCoresRecentes.innerHTML = ""; // Limpa a UI antiga
  
  cores.forEach(cor => {
    const botaoCor = document.createElement("button");
    botaoCor.className = "cor-recente-item";
    botaoCor.style.backgroundColor = cor;
    
    // Tooltip com dica de usabilidade
    botaoCor.title = `Cor ${cor}\n• Clique para Preenchimento\n• Shift + Clique para Borda`;
    
    botaoCor.addEventListener("click", (evento) => {
      const eBorda = evento.shiftKey;
      
      if (eBorda) {
        // Aplica na Borda
        definirCorBorda(cor);
        if (inputCorBorda) inputCorBorda.value = cor;
        if (popupCorBorda) popupCorBorda.value = cor;
        
        estado.elementosSelecionados.forEach(el => {
          el.setAttribute("stroke", cor);
        });
      } else {
        // Aplica no Preenchimento
        definirCorPreenchimento(cor);
        if (inputCorPreenchimento) inputCorPreenchimento.value = cor;
        if (popupCorPreenchimento) popupCorPreenchimento.value = cor;
        
        estado.elementosSelecionados.forEach(el => {
          el.setAttribute("fill", cor);
        });
      }
      
      // Salva no histórico de ações do canvas
      if (typeof registrarAcaoHistorico === 'function') registrarAcaoHistorico();
      if (typeof atualizarBotoesHistorico === 'function') atualizarBotoesHistorico();
    });
    
    containerCoresRecentes.appendChild(botaoCor);
  });
}
// Escuta as atualizações do estado para redesenhar a UI
document.addEventListener('cores-recentes-mudou', (e) => {
  renderizarCoresRecentes(e.detail.cores);
});

// Captura quando o usuário altera a cor no input principal para salvar no histórico
inputCorPreenchimento.addEventListener("change", () => {
  adicionarCorRecente(inputCorPreenchimento.value);
});

inputCorBorda.addEventListener("change", () => {
  adicionarCorRecente(inputCorBorda.value);
});

// Captura também as mudanças que vêm do popup flutuante
popupCorPreenchimento.addEventListener("change", () => {
  adicionarCorRecente(popupCorPreenchimento.value);
});

popupCorBorda.addEventListener("change", () => {
  adicionarCorRecente(popupCorBorda.value);
});
// Inicializar o estado dos botões de histórico
atualizarBotoesHistorico();

// Ctrl + Scroll — Zoom global (funciona com qualquer ferramenta ativa)
svgCanvas.addEventListener(
  "wheel",
  (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();

    const coords = obterCoordenadaSVG(e, svgCanvas);
    const fator = 0.1;
    const escala =
      e.deltaY > 0
        ? 1 + fator // scroll para baixo = zoom out
        : 1 - fator; // scroll para cima  = zoom in

    cameraGlobal.zoom(escala, coords.x, coords.y);
    scrollbar.atualizar();
  },
  { passive: false },
);

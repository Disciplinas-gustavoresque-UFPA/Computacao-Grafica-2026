/**
 * index.js — Fachada do Menu de Contexto (padrão Façade)
 *
 * Ponto de entrada público do módulo. Orquestra os três submódulos:
 *   builder  → constrói o DOM
 *   sync     → lê atributos SVG e atualiza controles
 *   actions  → executa comandos sobre os elementos
 *
 * Gerencia o estado de closure (elementoAtual, estilosCopiados, timer)
 * e conecta cada controle ao seu comportamento via event listeners.
 */

import { registrarAcaoHistorico } from "../core/StateManager.js";
import { criarMenuContexto } from "./builder.js";
import { sincronizarControles, normalizarHex } from "./sync.js";
import {
  aplicarOffsetDuplicado,
  ordenarElemento,
  copiarEstilos,
  colarEstilos,
} from "./actions.js";

const MARGEM_VISTA = 12;
const DESLOCAMENTO_CURSOR = 2;
const TAGS_VALIDAS = new Set([
  "rect",
  "circle",
  "ellipse",
  "line",
  "path",
  "text",
  "image",
  "polygon",
  "polyline",
]);

function isRightButton(evento) {
  return evento.button === 2 || evento.buttons === 2;
}

function encontrarElementoSVG(target, svgCanvas) {
  let el = target;
  while (el && el !== svgCanvas) {
    if (el.nodeType === 1 && TAGS_VALIDAS.has(el.tagName.toLowerCase()))
      return el;
    el = el.parentNode;
  }
  return null;
}

/**
 * Inicializa o menu de contexto e registra todos os event listeners.
 *
 * @param {SVGSVGElement} svgCanvas
 * @returns {{ abrir: Function, fechar: Function } | null}
 */
export function inicializarMenuContexto(svgCanvas) {
  if (!svgCanvas) return null;

  const {
    menu: menuContexto,
    sliderOpacidade,
    valorOpacidade,
    inputFill,
    btnFillNone,
    inputStroke,
    btnStrokeNone,
    sliderEspessura,
    valorEspessura,
    dashBtns,
    grupoRx,
    sliderRx,
    valorRx,
    btnFrente,
    btnFundo,
    btnDuplicar,
    btnCopiarEstilos,
    btnColarEstilos,
    btnExcluir,
  } = criarMenuContexto();

  // Estado interno do menu
  let elementoAtual = null;
  let estilosCopiados = null;
  let timerConfirmacao = null;

  const controles = {
    sliderOpacidade,
    valorOpacidade,
    inputFill,
    btnFillNone,
    inputStroke,
    btnStrokeNone,
    sliderEspessura,
    valorEspessura,
    dashBtns,
    grupoRx,
    sliderRx,
    valorRx,
  };

  // --- Função auxiliar de registro ---
  function executarComHistorico(callback) {
    callback();
    registrarAcaoHistorico();
  }

  // --- Ciclo de vida do menu ---

  function resetarBotaoExcluir() {
    clearTimeout(timerConfirmacao);
    timerConfirmacao = null;
    btnExcluir.textContent = "Excluir";
    btnExcluir.classList.remove("menu-contexto__deletar--confirmando");
  }

  function fecharMenuContexto() {
    menuContexto.hidden = true;
    menuContexto.setAttribute("aria-hidden", "true");
    menuContexto.style.visibility = "hidden";
    resetarBotaoExcluir();
  }

  function abrirMenuContexto(evento) {
    evento.preventDefault();

    const alvo = encontrarElementoSVG(evento.target, svgCanvas);
    if (!alvo) return;

    elementoAtual = alvo;
    resetarBotaoExcluir();
    sincronizarControles(elementoAtual, controles);

    // Posicionamento: torna visível fora da tela para medir dimensões
    menuContexto.hidden = false;
    menuContexto.setAttribute("aria-hidden", "false");
    menuContexto.style.visibility = "hidden";
    menuContexto.style.left = "0px";
    menuContexto.style.top = "0px";

    const largura = menuContexto.offsetWidth;
    const altura = menuContexto.offsetHeight;

    let x = evento.clientX + DESLOCAMENTO_CURSOR;
    let y = evento.clientY + DESLOCAMENTO_CURSOR;

    if (x + largura + MARGEM_VISTA > window.innerWidth)
      x = evento.clientX - largura - DESLOCAMENTO_CURSOR;
    if (y + altura + MARGEM_VISTA > window.innerHeight)
      y = evento.clientY - altura - DESLOCAMENTO_CURSOR;

    x = Math.max(
      MARGEM_VISTA,
      Math.min(x, window.innerWidth - largura - MARGEM_VISTA),
    );
    y = Math.max(
      MARGEM_VISTA,
      Math.min(y, window.innerHeight - altura - MARGEM_VISTA),
    );

    menuContexto.style.left = `${Math.round(x)}px`;
    menuContexto.style.top = `${Math.round(y)}px`;
    menuContexto.style.visibility = "visible";

    menuContexto.querySelector("input:not([disabled]), button")?.focus();
  }

  // --- Listeners: controles de ESTILO ---

  sliderOpacidade.addEventListener("input", () => {
    if (!elementoAtual) return;

    elementoAtual.setAttribute("opacity", String(sliderOpacidade.value / 100));
    valorOpacidade.textContent = `${sliderOpacidade.value}%`;
  });

  inputFill.addEventListener("input", () => {
    if (!elementoAtual) return;

    elementoAtual.setAttribute("fill", inputFill.value);
    btnFillNone.classList.remove("menu-contexto__none-btn--ativo");
  });

  btnFillNone.addEventListener("click", () => {
    if (!elementoAtual) return;

    if (elementoAtual.getAttribute("fill") === "none") {
      elementoAtual.setAttribute("fill", inputFill.value);
      btnFillNone.classList.remove("menu-contexto__none-btn--ativo");
      inputFill.disabled = false;
    } else {
      elementoAtual.setAttribute("fill", "none");
      btnFillNone.classList.add("menu-contexto__none-btn--ativo");
      inputFill.disabled = true;
    }
  });

  inputStroke.addEventListener("input", () => {
    if (!elementoAtual) return;

    elementoAtual.setAttribute("stroke", inputStroke.value);
    btnStrokeNone.classList.remove("menu-contexto__none-btn--ativo");
  });

  btnStrokeNone.addEventListener("click", () => {
    if (!elementoAtual) return;

    if (elementoAtual.getAttribute("stroke") === "none") {
      elementoAtual.setAttribute("stroke", inputStroke.value);
      btnStrokeNone.classList.remove("menu-contexto__none-btn--ativo");
      inputStroke.disabled = false;
    } else {
      elementoAtual.setAttribute("stroke", "none");
      btnStrokeNone.classList.add("menu-contexto__none-btn--ativo");
      inputStroke.disabled = true;
    }
  });

  sliderEspessura.addEventListener("input", () => {
    if (!elementoAtual) return;

    elementoAtual.setAttribute("stroke-width", sliderEspessura.value);
    valorEspessura.textContent = sliderEspessura.value;
  });

  dashBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      if (!elementoAtual) return;

      elementoAtual.setAttribute("stroke-dasharray", btn.dataset.dash);
      dashBtns.forEach((b) =>
        b.classList.remove("menu-contexto__dash-btn--ativo"),
      );
      btn.classList.add("menu-contexto__dash-btn--ativo");
    });
  });

  sliderRx.addEventListener("input", () => {
    if (!elementoAtual) return;

    elementoAtual.setAttribute("rx", sliderRx.value);
    elementoAtual.setAttribute("ry", sliderRx.value);

    valorRx.textContent = sliderRx.value;
  });

  // --- Listeners: ORDEM ---

    btnFrente.addEventListener("click", () => executarComHistorico(() => {
      if (!elementoAtual) return;

      ordenarElemento(elementoAtual, svgCanvas, "frente");
      fecharMenuContexto();
    }));

    btnFundo.addEventListener("click", () => executarComHistorico(() => {
      if (!elementoAtual) return;

      ordenarElemento(elementoAtual, svgCanvas, "fundo");
      fecharMenuContexto();
    }));

    // --- Listeners: AÇÕES ---

    btnDuplicar.addEventListener("click", () => executarComHistorico(() => {
      if (!elementoAtual) return;

      const clone = elementoAtual.cloneNode(true);
      aplicarOffsetDuplicado(clone);
      svgCanvas.appendChild(clone);
      fecharMenuContexto();
    }));

    btnCopiarEstilos.addEventListener("click", () => {
      if (!elementoAtual) return;
      estilosCopiados = copiarEstilos(elementoAtual);
      fecharMenuContexto();
    });

    btnColarEstilos.addEventListener("click", () => executarComHistorico(() => {
      if (!elementoAtual || !estilosCopiados) return;
      colarEstilos(elementoAtual, estilosCopiados);
      fecharMenuContexto();
    }));

    btnExcluir.addEventListener("click", () => {
      if (!elementoAtual) return;
      if (btnExcluir.classList.contains("menu-contexto__deletar--confirmando")) {
        executarComHistorico(() => {
          elementoAtual.remove();
          elementoAtual = null;
          fecharMenuContexto();
        });
      } else {
        btnExcluir.textContent = "Confirmar?";
        btnExcluir.classList.add("menu-contexto__deletar--confirmando");
        timerConfirmacao = setTimeout(resetarBotaoExcluir, 3000);
      }
    });

  // --- Listeners: GLOBAIS ---

  function bloquearBotaoDireito(evento) {
    if (!isRightButton(evento)) return;
    evento.preventDefault();
    evento.stopImmediatePropagation();
  }

  function fecharAoClicarFora(evento) {
    if (menuContexto.hidden) return;
    if (menuContexto.contains(evento.target)) return;
    if (evento.button === 0) fecharMenuContexto();
  }

  svgCanvas.addEventListener("mousedown", bloquearBotaoDireito, true);
  svgCanvas.addEventListener("mousemove", bloquearBotaoDireito, true);
  svgCanvas.addEventListener("mouseup", bloquearBotaoDireito, true);
  svgCanvas.addEventListener("contextmenu", abrirMenuContexto);

  document.addEventListener("pointerdown", fecharAoClicarFora, true);
  menuContexto.addEventListener("pointerdown", (evento) =>
    evento.stopPropagation(),
  );

  window.addEventListener("keydown", (evento) => {
    if (evento.key === "Escape") fecharMenuContexto();
  });

  return { abrir: abrirMenuContexto, fechar: fecharMenuContexto };
}

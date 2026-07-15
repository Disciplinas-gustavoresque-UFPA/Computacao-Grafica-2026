/**
 * gradientHelpers.js — Utilitários para criação e edição de gradientes SVG
 * (lineares e radiais) usados como preenchimento (fill) das formas.
 *
 * A ideia é simples: em vez de `fill="#4a90d9"`, o elemento passa a ter
 * `fill="url(#gradiente-xxxx)"`, apontando para um `<linearGradient>` ou
 * `<radialGradient>` guardado dentro de um `<defs>` no próprio `#canvas`.
 *
 * Cada elemento que usa gradiente possui seu PRÓPRIO gradiente (não
 * compartilhado), assim editar as cores de um objeto nunca afeta outro.
 */

const SVG_NS = "http://www.w3.org/2000/svg";
const REGEX_URL_GRADIENTE = /^url\(#(.+)\)$/;

let contador = 0;

/**
 * Retorna o <defs> do canvas, criando um novo (como primeiro filho) se
 * ainda não existir.
 *
 * @param {SVGSVGElement} svgCanvas
 * @returns {SVGDefsElement}
 */
function obterOuCriarDefs(svgCanvas) {
  let defs = svgCanvas.querySelector("defs");
  if (!defs) {
    defs = document.createElementNS(SVG_NS, "defs");
    svgCanvas.insertBefore(defs, svgCanvas.firstChild);
  }
  return defs;
}

/**
 * Extrai o id de um gradiente a partir do valor de um atributo `fill`
 * (ex: "url(#gradiente-123)" -> "gradiente-123"). Retorna null se o valor
 * não for uma referência de gradiente (cor sólida, "none", etc).
 *
 * @param {string} fill
 * @returns {string|null}
 */
export function extrairIdGradiente(fill) {
  if (!fill) return null;
  const match = fill.match(REGEX_URL_GRADIENTE);
  return match ? match[1] : null;
}

/**
 * Cria (na primeira vez) ou reaproveita o gradiente já associado a um
 * elemento, atualiza seu tipo/cores e aplica no atributo `fill` do elemento.
 *
 * @param {SVGSVGElement} svgCanvas - Canvas raiz (onde fica o <defs>).
 * @param {SVGElement} elemento - Forma que vai receber o gradiente.
 * @param {'linear'|'radial'} tipo
 * @param {string} corInicio - Cor inicial em hexadecimal.
 * @param {string} corFim - Cor final em hexadecimal.
 * @returns {string} id do elemento de gradiente usado.
 */
export function aplicarGradientePreenchimento(svgCanvas, elemento, tipo, corInicio, corFim) {
  const defs = obterOuCriarDefs(svgCanvas);
  const tagEsperada = tipo === "radial" ? "radialGradient" : "linearGradient";

  const idAtual = extrairIdGradiente(elemento.getAttribute("fill"));
  let gradienteEl = idAtual ? defs.querySelector(`#${CSS.escape(idAtual)}`) : null;

  // Se o elemento ainda não tinha gradiente próprio, ou o tipo mudou
  // (linear <-> radial), criamos um elemento de gradiente novo.
  if (!gradienteEl || gradienteEl.tagName !== tagEsperada) {
    if (gradienteEl) gradienteEl.remove();

    const novoId = `gradiente-${Date.now()}-${contador++}`;
    gradienteEl = document.createElementNS(SVG_NS, tagEsperada);
    gradienteEl.setAttribute("id", novoId);

    if (tipo === "radial") {
      gradienteEl.setAttribute("cx", "50%");
      gradienteEl.setAttribute("cy", "50%");
      gradienteEl.setAttribute("r", "50%");
    } else {
      gradienteEl.setAttribute("x1", "0%");
      gradienteEl.setAttribute("y1", "0%");
      gradienteEl.setAttribute("x2", "100%");
      gradienteEl.setAttribute("y2", "0%");
    }

    defs.appendChild(gradienteEl);
  }

  atualizarStops(gradienteEl, corInicio, corFim);

  const id = gradienteEl.getAttribute("id");
  elemento.setAttribute("fill", `url(#${id})`);
  return id;
}

/**
 * Garante que o gradiente tenha exatamente dois <stop> (início/fim) e
 * atualiza suas cores.
 *
 * @param {SVGElement} gradienteEl
 * @param {string} corInicio
 * @param {string} corFim
 */
function atualizarStops(gradienteEl, corInicio, corFim) {
  let stops = gradienteEl.querySelectorAll("stop");

  if (stops.length < 2) {
    gradienteEl.textContent = "";
    const stop1 = document.createElementNS(SVG_NS, "stop");
    stop1.setAttribute("offset", "0%");
    const stop2 = document.createElementNS(SVG_NS, "stop");
    stop2.setAttribute("offset", "100%");
    gradienteEl.appendChild(stop1);
    gradienteEl.appendChild(stop2);
    stops = gradienteEl.querySelectorAll("stop");
  }

  stops[0].setAttribute("stop-color", corInicio);
  stops[stops.length - 1].setAttribute("stop-color", corFim);
}

/**
 * Lê as informações do gradiente aplicado a um elemento (se houver),
 * útil para repopular a UI quando o usuário seleciona um objeto.
 *
 * @param {SVGSVGElement} svgCanvas
 * @param {SVGElement} elemento
 * @returns {{tipo: 'linear'|'radial', corInicio: string, corFim: string}|null}
 */
export function obterInfoGradiente(svgCanvas, elemento) {
  const id = extrairIdGradiente(elemento.getAttribute("fill"));
  if (!id) return null;

  const gradienteEl = svgCanvas.querySelector(`#${CSS.escape(id)}`);
  if (!gradienteEl) return null;

  const stops = gradienteEl.querySelectorAll("stop");
  if (stops.length < 2) return null;

  return {
    tipo: gradienteEl.tagName === "radialGradient" ? "radial" : "linear",
    corInicio: stops[0].getAttribute("stop-color") || "#000000",
    corFim: stops[stops.length - 1].getAttribute("stop-color") || "#ffffff",
  };
}

/**
 * Diz se o valor de um atributo `fill` é uma referência a gradiente.
 * @param {string} fill
 * @returns {boolean}
 */
export function ehGradiente(fill) {
  return extrairIdGradiente(fill) !== null;
}

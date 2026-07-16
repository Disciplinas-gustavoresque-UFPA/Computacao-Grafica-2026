/**
 * builder.js — Construção do DOM do Menu de Contexto (padrão Builder)
 *
 * Responsabilidade única: criar e retornar a estrutura HTML do menu
 * com referências diretas a todos os controles. Sem estado, sem lógica.
 */

// --- Helpers de elementos ---

function criarSecao(titulo) {
  const sec = document.createElement('section');
  sec.className = 'menu-contexto__secao';
  const p = document.createElement('p');
  p.className = 'menu-contexto__titulo';
  p.textContent = titulo;
  sec.appendChild(p);
  return sec;
}

function criarGrupo(labelText) {
  const div = document.createElement('div');
  div.className = 'menu-contexto__grupo';
  const lbl = document.createElement('span');
  lbl.className = 'menu-contexto__label';
  lbl.textContent = labelText;
  div.appendChild(lbl);
  return div;
}

function criarSliderWrapper(slider, valorSpan) {
  const div = document.createElement('div');
  div.className = 'menu-contexto__slider-wrapper';
  div.appendChild(slider);
  div.appendChild(valorSpan);
  return div;
}

function criarCorWrapper(inputColor, btnNone) {
  const div = document.createElement('div');
  div.className = 'menu-contexto__cor-wrapper';
  div.appendChild(inputColor);
  div.appendChild(btnNone);
  return div;
}

function criarSeparador() {
  const div = document.createElement('div');
  div.className = 'menu-contexto__separador';
  div.appendChild(document.createElement('hr'));
  return div;
}

function criarSlider(min, max, valor) {
  const el = document.createElement('input');
  el.type = 'range';
  el.className = 'menu-contexto__slider';
  el.min = String(min);
  el.max = String(max);
  el.value = String(valor);
  return el;
}

function criarSpanValor(texto) {
  const span = document.createElement('span');
  span.className = 'menu-contexto__valor';
  span.textContent = texto;
  return span;
}

function criarBtnNone(texto) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-contexto__none-btn';
  btn.textContent = texto;
  btn.setAttribute('role', 'menuitem');
  return btn;
}

function criarAcaoBtn(texto, acao) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'menu-contexto__acao-btn';
  btn.dataset.acao = acao;
  btn.textContent = texto;
  btn.setAttribute('role', 'menuitem');
  return btn;
}

function criarGradienteStopLabel(texto, inputColor) {
  const lbl = document.createElement('label');
  lbl.className = 'menu-contexto__gradiente-label';
  lbl.appendChild(document.createTextNode(texto));
  lbl.appendChild(inputColor);
  return lbl;
}

// --- Builder principal ---

/**
 * Constrói o DOM completo do menu de contexto e retorna referências
 * diretas a todos os controles interativos.
 *
 * @returns {{ menu: HTMLElement, [controles]: HTMLElement }}
 */
export function criarMenuContexto() {
  const menu = document.createElement('aside');
  menu.id = 'menu-contexto';
  menu.className = 'menu-contexto';
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-label', 'Menu de contexto');
  menu.setAttribute('aria-hidden', 'true');
  menu.hidden = true;

  // === Seção: Estilo ===
  const secaoEstilo = criarSecao('Estilo');

  const sliderOpacidade = criarSlider(0, 100, 100);
  const valorOpacidade = criarSpanValor('100%');
  const grupoOpacidade = criarGrupo('Opacidade');
  grupoOpacidade.appendChild(criarSliderWrapper(sliderOpacidade, valorOpacidade));
  secaoEstilo.appendChild(grupoOpacidade);

  const inputFill = document.createElement('input');
  inputFill.type = 'color'; inputFill.value = '#4a90d9';
  const btnFillNone = criarBtnNone('Nenhum');
  const grupoFill = criarGrupo('Preenchimento');

  // Alternador Sólida / Gradiente Linear / Gradiente Radial
  const radiosFillTipo = [];
  const fillTypeRow = document.createElement('div');
  fillTypeRow.className = 'menu-contexto__fill-type-row';
  fillTypeRow.setAttribute('role', 'radiogroup');
  fillTypeRow.setAttribute('aria-label', 'Tipo de preenchimento');
  [['solido', 'Sólida'], ['linear', 'Linear'], ['radial', 'Radial']].forEach(([valor, label], i) => {
    const lbl = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'menu-contexto-tipo-preenchimento';
    radio.value = valor;
    if (i === 0) radio.checked = true;
    lbl.appendChild(radio);
    lbl.appendChild(document.createTextNode(label));
    fillTypeRow.appendChild(lbl);
    radiosFillTipo.push(radio);
  });
  grupoFill.appendChild(fillTypeRow);

  const corWrapperSolido = criarCorWrapper(inputFill, btnFillNone);
  grupoFill.appendChild(corWrapperSolido);

  const inputGradInicio = document.createElement('input');
  inputGradInicio.type = 'color'; inputGradInicio.value = '#4a90d9';
  const inputGradFim = document.createElement('input');
  inputGradFim.type = 'color'; inputGradFim.value = '#ffffff';
  const gradRow = document.createElement('div');
  gradRow.className = 'menu-contexto__cor-wrapper menu-contexto__gradiente-row';
  gradRow.hidden = true;
  gradRow.appendChild(criarGradienteStopLabel('De', inputGradInicio));
  gradRow.appendChild(criarGradienteStopLabel('Para', inputGradFim));
  grupoFill.appendChild(gradRow);

  secaoEstilo.appendChild(grupoFill);

  const inputStroke = document.createElement('input');
  inputStroke.type = 'color'; inputStroke.value = '#1a1a2e';
  const btnStrokeNone = criarBtnNone('Nenhuma');
  const grupoStroke = criarGrupo('Cor da Borda');
  grupoStroke.appendChild(criarCorWrapper(inputStroke, btnStrokeNone));
  secaoEstilo.appendChild(grupoStroke);

  const sliderEspessura = criarSlider(0, 50, 2);
  const valorEspessura = criarSpanValor('2');
  const grupoEspessura = criarGrupo('Espessura');
  grupoEspessura.appendChild(criarSliderWrapper(sliderEspessura, valorEspessura));
  secaoEstilo.appendChild(grupoEspessura);

  const dashBtns = [];
  const dashOpcoes = document.createElement('div');
  dashOpcoes.className = 'menu-contexto__dash-opcoes';
  [['Sólida', 'none'], ['Tracej.', '8 4'], ['Pont.', '2 4']].forEach(([label, value]) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'menu-contexto__dash-btn';
    btn.textContent = label;
    btn.dataset.dash = value;
    btn.setAttribute('role', 'menuitem');
    dashBtns.push(btn);
    dashOpcoes.appendChild(btn);
  });
  const grupoDash = criarGrupo('Estilo Borda');
  grupoDash.appendChild(dashOpcoes);
  secaoEstilo.appendChild(grupoDash);

  const sliderRx = criarSlider(0, 50, 0);
  const valorRx = criarSpanValor('0');
  const grupoRx = criarGrupo('Arredondamento');
  grupoRx.hidden = true;
  grupoRx.appendChild(criarSliderWrapper(sliderRx, valorRx));
  secaoEstilo.appendChild(grupoRx);

  menu.appendChild(secaoEstilo);
  menu.appendChild(criarSeparador());

  // === Seção: Ordem ===
  const secaoOrdem = criarSecao('Ordem');
  const btnFrente = criarAcaoBtn('Trazer para Frente', 'frente');
  const btnFundo = criarAcaoBtn('Enviar para Trás', 'fundo');
  const ordemGrupo = document.createElement('div');
  ordemGrupo.className = 'menu-contexto__acao-grupo';
  ordemGrupo.appendChild(btnFrente);
  ordemGrupo.appendChild(btnFundo);
  secaoOrdem.appendChild(ordemGrupo);
  menu.appendChild(secaoOrdem);
  menu.appendChild(criarSeparador());

  // === Seção: Ações ===
  const secaoAcoes = criarSecao('Ações');
  const btnDuplicar = criarAcaoBtn('Duplicar', 'duplicar');
  const btnCopiarEstilos = criarAcaoBtn('Copiar Estilos', 'copiar-estilos');
  const btnColarEstilos = criarAcaoBtn('Colar Estilos', 'colar-estilos');
  const btnExcluir = criarAcaoBtn('Excluir', 'excluir');
  btnExcluir.classList.add('menu-contexto__deletar');
  secaoAcoes.appendChild(btnDuplicar);
  secaoAcoes.appendChild(btnCopiarEstilos);
  secaoAcoes.appendChild(btnColarEstilos);
  secaoAcoes.appendChild(btnExcluir);
  menu.appendChild(secaoAcoes);

  document.body.appendChild(menu);

  return {
    menu,
    sliderOpacidade, valorOpacidade,
    inputFill, btnFillNone,
    radiosFillTipo, corWrapperSolido, gradRow, inputGradInicio, inputGradFim,
    inputStroke, btnStrokeNone,
    sliderEspessura, valorEspessura,
    dashBtns,
    grupoRx, sliderRx, valorRx,
    btnFrente, btnFundo,
    btnDuplicar, btnCopiarEstilos, btnColarEstilos, btnExcluir,
  };
}

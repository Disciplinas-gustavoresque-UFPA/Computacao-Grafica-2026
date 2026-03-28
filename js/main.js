/**
 * main.js — Ponto de entrada da aplicação do Editor Vetorial.
 *
 * Responsabilidades:
 *  - Inicializar o estado global via StateManager
 *  - Registrar os event listeners globais no elemento SVG (#canvas)
 *  - Conectar os botões da barra de ferramentas ao StateManager
 */

import { estado, definirFerramenta, definirCorPreenchimento, definirCorBorda } from './core/StateManager.js';
import { LupaTool } from './tools/LupaTool.js';

// Referências aos elementos do DOM
const svgCanvas = document.getElementById('canvas');
const botoesFerramenta = document.querySelectorAll('.btn-ferramenta');
const inputCorPreenchimento = document.getElementById('cor-preenchimento');
const inputCorBorda = document.getElementById('cor-borda');
const nomeFerramenta = document.getElementById('nome-ferramenta');
const lupaTool = new LupaTool(svgCanvas);


/**
 * Atualiza o estado visual dos botões da barra lateral,
 * destacando apenas o botão da ferramenta ativa.
 *
 * @param {string} nomeDaFerramenta - Identificador da ferramenta ativa.
 */
function atualizarBotaoAtivo(nomeDaFerramenta) {
  botoesFerramenta.forEach((btn) => {
    if (btn.dataset.ferramenta === nomeDaFerramenta) {
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
    const ferramenta = btn.dataset.ferramenta;
    // definirFerramenta(ferramenta); // <-- correto 
    if (ferramenta === 'lupa') {
      definirFerramenta(lupaTool);
    } else {
      definirFerramenta(ferramenta);
    }
    atualizarBotaoAtivo(ferramenta);
  });
});

// Atualiza a cor de preenchimento no estado global
inputCorPreenchimento.addEventListener('input', (evento) => {
  definirCorPreenchimento(evento.target.value);
});

// Atualiza a cor da borda no estado global
inputCorBorda.addEventListener('input', (evento) => {
  definirCorBorda(evento.target.value);
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

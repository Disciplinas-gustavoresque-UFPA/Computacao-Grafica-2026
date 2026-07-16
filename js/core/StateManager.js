/**
 * StateManager.js — Gerenciador de Estado Global da aplicação.
 *
 * Centraliza o estado compartilhado entre todos os módulos,
 * evitando variáveis globais soltas e facilitando a depuração.
 *
 * Propriedades do estado:
 * - ferramentaAtual {ToolBase|null} - Instância da ferramenta de desenho ativa.
 * - corPreenchimento {string}       - Cor de preenchimento dos elementos (formato hex).
 * - corBorda {string}               - Cor da borda/stroke dos elementos (formato hex).
 * - estiloLinha {string}            - Estilo visual usado pela ferramenta de linha.
 * - elementosSelecionados {SVGElement[]} - Elementos SVG atualmente selecionados.
 * - interfaceAtual {string}         - Flag para sabermos a tela onde o usuário está.
 */

/** @type {{ ferramentaAtual: import('../tools/ToolBase.js').ToolBase|null, corPreenchimento: string, corBorda: string, opacidadePreenchimento: string, opacidadeBorda: string, estiloLinha: string, elementosSelecionados: SVGElement[], interfaceAtual: string }} */
export const estado = {
  ferramentaAtual: null,
  corPreenchimento: '#4a90d9',
  corBorda: '#1a1a2e',
  opacidadePreenchimento: '1', // Adicionado: 100% opaco por padrão
  opacidadeBorda: '1',        // Adicionado: 100% opaco por padrão
  estiloLinha: 'continua',
  interfaceAtual: 'inicio', 
  elementosSelecionados: [],
  espessuraLapis: 2,
  coresRecentes: [],
};

let gerenciadorSelecaoVisual = null;
let callbackPainelAlinhamento = null;


export function definirEspessuraLapis(espessura) {
  estado.espessuraLapis = Number(espessura);
}

export function definirGerenciadorSelecao(selecao) {
  gerenciadorSelecaoVisual = selecao;
}

export function definirCallbackPainelAlinhamento(fn) {
  callbackPainelAlinhamento = fn;
}

function _notificarPainelAlinhamento() {
  if (typeof callbackPainelAlinhamento === 'function') {
    callbackPainelAlinhamento(estado.elementosSelecionados.length);
  }
}

export function atualizarPosicaoSelecaoVisual() {
  if (gerenciadorSelecaoVisual && estado.elementosSelecionados.length > 0) {
    gerenciadorSelecaoVisual.atualizarPosicao(estado.elementosSelecionados);
  }
}

/**
 * Define a ferramenta de desenho ativa.
 * Invoca os métodos de ciclo de vida `onDesativar` na ferramenta anterior
 * e `onAtivar` na nova ferramenta, quando aplicável.
 *
 * @param {import('../tools/ToolBase.js').ToolBase|string|null} ferramenta
 * Instância de uma ferramenta (ToolBase) ou string identificadora.
 */
export function definirFerramenta(ferramenta) {
  const anterior = estado.ferramentaAtual;

  // Notifica a ferramenta anterior antes de trocar
  if (anterior && typeof anterior.onDesativar === 'function') {
    anterior.onDesativar();
  }

  estado.ferramentaAtual = ferramenta;

  // Notifica a nova ferramenta após a troca
  if (ferramenta && typeof ferramenta.onAtivar === 'function') {
    ferramenta.onAtivar();
  }
}

/**
 * Define a cor de preenchimento ativa.
 *
 * @param {string} cor - Cor em formato hexadecimal (ex: '#ff0000').
 */
export function definirCorPreenchimento(cor) {
  estado.corPreenchimento = cor;
}

/**
 * Define a cor da borda/stroke ativa.
 *
 * @param {string} cor - Cor em formato hexadecimal (ex: '#000000').
 */
export function definirCorBorda(cor) {
  estado.corBorda = cor;
}

export function definirEstiloLinha(estilo) {
  estado.estiloLinha = estilo;
}

/**
 * Define os elementos SVG atualmente selecionados.
 *
 * @param {SVGElement|SVGElement[]|null} elementos - Elemento(s) SVG selecionado(s) ou null para limpar.
 */
export function definirElementosSelecionados(elementos) {
  if (!elementos) {
    estado.elementosSelecionados = [];
  } else if (Array.isArray(elementos)) {
    estado.elementosSelecionados = elementos;
  } else {
    estado.elementosSelecionados = [elementos];
  }

  if (gerenciadorSelecaoVisual) {
    gerenciadorSelecaoVisual.desenhar(estado.elementosSelecionados);
  }

  document.dispatchEvent(new CustomEvent('selecao-mudou', {
    detail: { elementos: estado.elementosSelecionados }
  }));
  _notificarPainelAlinhamento();
}

/**
 * Alias para compatibilidade ou seleção única.
 * @deprecated Use definirElementosSelecionados
 */
export function definirElementoSelecionado(elemento) {
  definirElementosSelecionados(elemento);
}

/**
 * Adiciona um elemento à seleção atual.
 *
 * @param {SVGElement} elemento
 */
export function adicionarElementoSelecao(elemento) {
  if (!estado.elementosSelecionados.includes(elemento)) {
    estado.elementosSelecionados.push(elemento);
    if (gerenciadorSelecaoVisual) {
      gerenciadorSelecaoVisual.desenhar(estado.elementosSelecionados);
    }
    document.dispatchEvent(new CustomEvent('selecao-mudou', {
      detail: { elementos: estado.elementosSelecionados }
    }));
    _notificarPainelAlinhamento();
  }
}

/**
 * Remove um elemento da seleção atual.
 *
 * @param {SVGElement} elemento
 */
export function removerElementoSelecao(elemento) {
  estado.elementosSelecionados = estado.elementosSelecionados.filter(el => el !== elemento);
  if (gerenciadorSelecaoVisual) {
    gerenciadorSelecaoVisual.desenhar(estado.elementosSelecionados);
  }
  document.dispatchEvent(new CustomEvent('selecao-mudou', {
    detail: { elementos: estado.elementosSelecionados }
  }));
  _notificarPainelAlinhamento();
}

export function definirInterface(novaInterface) {
  estado.interfaceAtual = novaInterface;
}

let gerenciadorHistorico = null;

/**
 * Injeta a instância do HistoryManager no estado global.
 * Chamado apenas uma vez pelo main.js.
 */
export function definirGerenciadorHistorico(manager) {
  gerenciadorHistorico = manager;
}

/**
 * Função global para as ferramentas avisarem que o canvas foi alterado.
 */
export function registrarAcaoHistorico() {
  if (gerenciadorHistorico) {
    gerenciadorHistorico.salvarEstado();
  }
}

/**
 * Funções para os atalhos de teclado (Ctrl+Z / Ctrl+Y) chamarem.
 */
export function desfazerAcao() {
  if (gerenciadorHistorico) gerenciadorHistorico.desfazer();
}

export function refazerAcao() {
  if (gerenciadorHistorico) gerenciadorHistorico.refazer();
}

/**
 * Define a opacidade do preenchimento ativa.
 * @param {string|number} opacidade - Valor entre '0' e '1'
 */
export function definirOpacidadePreenchimento(opacidade) {
  estado.opacidadePreenchimento = String(opacidade);
}

/**
 * Define a opacidade da borda ativa.
 * @param {string|number} opacidade - Valor entre '0' e '1'
 */
export function definirOpacidadeBorda(opacidade) {
  estado.opacidadeBorda = String(opacidade);
}

/**
 * Adiciona uma cor ao histórico de recentes se ela já não for a última adicionada.
 * @param {string} cor - Hexadecimal da cor
 */
export function adicionarCorRecente(cor) {
  if (!cor || cor === 'none' || cor === 'transparent') return;
  
  cor = cor.toLowerCase();
  
  // Remove a cor se ela já existir na lista (para movê-la para o topo)
  estado.coresRecentes = estado.coresRecentes.filter(c => c !== cor);
  
  // Adiciona no início da lista
  estado.coresRecentes.unshift(cor);
  
  // Limita o histórico a, por exemplo, 10 cores
  if (estado.coresRecentes.length > 10) {
    estado.coresRecentes.pop();
  }

  // Dispara um evento para avisar a UI que a lista mudou
  document.dispatchEvent(new CustomEvent('cores-recentes-mudou', {
    detail: { cores: estado.coresRecentes }
  }));
}
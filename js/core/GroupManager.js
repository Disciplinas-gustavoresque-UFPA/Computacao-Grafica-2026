import { estado, registrarAcaoHistorico } from './StateManager.js';
import { criarElementoSVG } from '../utils/svgHelpers.js';

/**
 * Agrupa os elementos selecionados dentro de uma tag <g>
 */
export function agruparElementos() {
    const elementos = estado.elementosSelecionados;
    
    // Só faz sentido agrupar se houver 2 ou mais elementos selecionados
    if (!elementos || elementos.length < 2) return;

    // 1. ORDENAR PELO Z-INDEX (Ordem no DOM)
    // Isso garante que a sobreposição visual não quebre,
    // não importa a ordem em que o usuário clicou nos elementos.
    const elementosOrdenados = [...elementos].sort((a, b) => {
        // Se 'a' vem antes de 'b' no DOM, a constante FOLLOWING é ativada
        if (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) {
            return -1;
        }
        return 1;
    });

    // Cria o elemento de grupo <g>
    const grupo = criarElementoSVG('g', {});
    
    // 2. DESCOBRIR ONDE INSERIR O GRUPO
    // Pegamos o elemento que estava mais à frente (o último do array ordenado).
    // Inserimos o grupo logo após ele para preservar o Z-Index global.
    const elementoMaisAFrente = elementosOrdenados[elementosOrdenados.length - 1];
    const pai = elementoMaisAFrente.parentNode;
    pai.insertBefore(grupo, elementoMaisAFrente.nextSibling);

    // 3. MOVER OS ELEMENTOS
    // Como agora eles estão ordenados pelo DOM, o appendChild vai
    // preservar perfeitamente a ordem interna entre eles.
    elementosOrdenados.forEach(el => {
        grupo.appendChild(el);
    });

    // Atualiza o estado da seleção: agora o grupo inteiro é o selecionado
    estado.elementosSelecionados = [grupo];
    
    // Refaz o desenho da borda azul ao redor do novo grupo
    if (estado.gerenciadorSelecao) {
        estado.gerenciadorSelecao.desenhar(estado.elementosSelecionados);
    }

    // Registra a criação do grupo para o Ctrl+Z funcionar
    registrarAcaoHistorico();
}

/**
 * Desagrupa os elementos, removendo a tag <g> selecionada
 */
export function desagruparElementos() {
    const elementos = estado.elementosSelecionados;
    if (!elementos || elementos.length === 0) return;

    let ocorreuDesagrupamento = false;
    const novaSelecao = [];

    elementos.forEach(el => {
        // Verifica se o elemento selecionado é de fato um grupo
        if (el.tagName.toLowerCase() === 'g') {
            ocorreuDesagrupamento = true;
            const pai = el.parentNode;
            
            // Pega todos os filhos de dentro do grupo
            const filhos = Array.from(el.childNodes);
            
            // Move os filhos para fora do grupo (para o mesmo nível hierárquico do <g>)
            filhos.forEach(filho => {
                pai.insertBefore(filho, el);
                novaSelecao.push(filho); // Adiciona os filhos soltos na nova seleção
            });
            
            // Remove a tag <g> que agora ficou vazia
            pai.removeChild(el);
        } else {
            // Se o usuário selecionou algo que não é um grupo, apenas mantém na seleção
            novaSelecao.push(el);
        }
    });

    // Se pelo menos um grupo foi desfeito, atualiza o estado e o histórico
    if (ocorreuDesagrupamento) {
        estado.elementosSelecionados = novaSelecao;
        
        if (estado.gerenciadorSelecao) {
            estado.gerenciadorSelecao.desenhar(estado.elementosSelecionados);
        }
        
        registrarAcaoHistorico();
    }
}
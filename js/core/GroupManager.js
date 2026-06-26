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
 * Aplica o deslocamento do grupo (dx, dy) diretamente nas coordenadas 
 * do elemento filho para preservar sua posição visual.
 */
function aplicarTranslacaoAoFilho(el, dx, dy) {
    if (dx === 0 && dy === 0) return;

    const tag = el.tagName.toLowerCase();

    // Repassa o valor diretamente para as propriedades primitivas
    if (tag === 'rect' || tag === 'text' || tag === 'image') {
        el.setAttribute('x', String(parseFloat(el.getAttribute('x') || 0) + dx));
        el.setAttribute('y', String(parseFloat(el.getAttribute('y') || 0) + dy));
    } else if (tag === 'circle' || tag === 'ellipse') {
        el.setAttribute('cx', String(parseFloat(el.getAttribute('cx') || 0) + dx));
        el.setAttribute('cy', String(parseFloat(el.getAttribute('cy') || 0) + dy));
    } else if (tag === 'line') {
        el.setAttribute('x1', String(parseFloat(el.getAttribute('x1') || 0) + dx));
        el.setAttribute('y1', String(parseFloat(el.getAttribute('y1') || 0) + dy));
        el.setAttribute('x2', String(parseFloat(el.getAttribute('x2') || 0) + dx));
        el.setAttribute('y2', String(parseFloat(el.getAttribute('y2') || 0) + dy));
    } else if (tag === 'path' || tag === 'g') {
        // Para path e subgrupos, usamos a API nativa do SVG (igual na SelecaoTool)
        const transformList = el.transform.baseVal;
        let translateItem = null;

        for (let i = 0; i < transformList.numberOfItems; i++) {
            const item = transformList.getItem(i);
            if (item.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                translateItem = item;
                break;
            }
        }

        if (!translateItem) {
            const svgRef = el.ownerSVGElement;
            translateItem = svgRef.createSVGTransform();
            translateItem.setTranslate(dx, dy);
            transformList.appendItem(translateItem);
        } else {
            // Soma a translação existente com a translação do grupo pai
            translateItem.setTranslate(translateItem.matrix.e + dx, translateItem.matrix.f + dy);
        }
    }
}

/**
 * Desagrupa os elementos, repassando o deslocamento visual e removendo a tag <g>
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
            
            // 1. Descobre qual foi o deslocamento sofrido pelo grupo
            let grupoDx = 0;
            let grupoDy = 0;
            const transformList = el.transform.baseVal;
            for (let i = 0; i < transformList.numberOfItems; i++) {
                const item = transformList.getItem(i);
                if (item.type === SVGTransform.SVG_TRANSFORM_TRANSLATE) {
                    grupoDx = item.matrix.e;
                    grupoDy = item.matrix.f;
                    break;
                }
            }
            
            // Pega todos os filhos de dentro do grupo
            const filhos = Array.from(el.childNodes);
            
            // 2. Move os filhos para fora aplicando o deslocamento
            filhos.forEach(filho => {
                aplicarTranslacaoAoFilho(filho, grupoDx, grupoDy);
                
                pai.insertBefore(filho, el);
                novaSelecao.push(filho); // Adiciona os filhos soltos na nova seleção
            });
            
            // 3. Remove a tag <g>
            pai.removeChild(el);
        } else {
            novaSelecao.push(el); // Se o usuário selecionou algo que não é um grupo, apenas mantém na seleção
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
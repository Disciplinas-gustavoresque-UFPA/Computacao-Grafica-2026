import { definirInterface } from './StateManager.js';

/**
 * Inicializa os ouvintes de evento para a Tela Inicial
 * @param {SVGSVGElement} svgCanvas - A referência ao canvas principal
 */
export function inicializarMenuInicial(svgCanvas) {
    const telaInicial = document.getElementById('tela-inicial');
    const telaEditor = document.getElementById('app');
    
    const btnNovoDoc = document.getElementById('btn-novo-doc');
    const btnAbrirArq = document.getElementById('btn-abrir-arq');
    const selectTamanho = document.getElementById('select-tamanho');

    // Função central para transição de tela
    function irParaEditor() {
        telaInicial.classList.add('oculto');
        telaEditor.classList.remove('oculto');
        definirInterface('editor');
    }

    // 1. Lógica: Criar Novo Documento
    btnNovoDoc.addEventListener('click', () => {
        const tamanho = selectTamanho.value;
        
        // Aplica o tamanho selecionado alterando a ViewBox do SVG
        if (tamanho === 'a4') {
            svgCanvas.setAttribute('viewBox', '0 0 800 1131');
            svgCanvas.style.backgroundColor = '#ffffff'; // Imita papel
        } else if (tamanho === 'a3') {
            svgCanvas.setAttribute('viewBox', '0 0 1131 1600');
            svgCanvas.style.backgroundColor = '#ffffff';
        } else {
            // Documento Livre
            svgCanvas.removeAttribute('viewBox');
            svgCanvas.style.backgroundColor = 'var(--cor-fundo-canvas)';
        }
        
        // Garante que começamos com um canvas limpo
        svgCanvas.innerHTML = '';
        irParaEditor();
    });

    // 2. Lógica: Abrir Arquivo (Lê um SVG do computador do usuário)
    btnAbrirArq.addEventListener('click', () => {
        // Criamos um input de arquivo invisível dinamicamente
        const inputFalso = document.createElement('input');
        inputFalso.type = 'file';
        inputFalso.accept = '.svg';

        inputFalso.addEventListener('change', (evento) => {
            const arquivo = evento.target.files[0];
            if (!arquivo) return;

            const leitor = new FileReader();
            leitor.onload = (e) => {
                const conteudoSvg = e.target.result;
                
                // Transforma o texto do arquivo lido em Elementos DOM de verdade
                const parser = new DOMParser();
                const docSvg = parser.parseFromString(conteudoSvg, "image/svg+xml");
                const svgImportado = docSvg.documentElement;

                // Injeta o conteúdo no nosso canvas
                svgCanvas.innerHTML = svgImportado.innerHTML;
                
                // Preserva o viewBox original do arquivo, se existir
                if (svgImportado.hasAttribute('viewBox')) {
                    svgCanvas.setAttribute('viewBox', svgImportado.getAttribute('viewBox'));
                }
                
                irParaEditor();
            };
            leitor.readAsText(arquivo);
        });

        // Simula o clique do usuário para abrir a janela do Windows/Linux
        inputFalso.click(); 
    });

    // 3. Stubs (Para as futuras issues)
    document.getElementById('btn-modelos').addEventListener('click', () => {
        alert('As opções de Template serão lançadas na versão 1.2!');
    });
    document.getElementById('btn-config').addEventListener('click', () => {
        alert('As configurações avançadas serão implementadas em breve.');
    });
}
const driverObj = window.driver.js.driver({
    showProgress: true,
    animate: true,
    allowClose: true,
    steps: [
        {
            element: '#btn-selecionar',
            popover: {
                title: 'Ferramenta de Seleção',
                description: 'Use esta ferramenta para selecionar e mover objetos já existentes.'
            }
        },
         {
            element: '#btn-edicao-vertices',
            popover: {
                title: 'Edição por Vértices',
                description: 'Clique nesta ferramenta e depois em um objeto para editar seus vértices.'
            }
        },
        {
            element: '#btn-criar-retangulo',
            popover: {
                title: 'Retângulo',
                description: 'Clique nesta ferramenta e depois na área de desenho para criar retângulos.'
            }
        },
        {
            element: '#btn-criar-losango',
            popover: {
                title: 'Losango',
                description: 'Clique nesta ferramenta e depois na área de desenho para criar losangos.'
            }
        },
        {
            element: '#btn-criar-elipse',
            popover: {
                title: 'Elipse',
                description: 'Permite criar círculos e elipses.'
            }
        },
        {
            element: '#btn-criar-linha',
            popover: {
                title: 'Linha',
                description: 'Desenhe linhas entre dois pontos.'
            },
            onHighlighted: () => {
                document.getElementById('btn-criar-linha').click();
            }
        },
        {
            element: '#btn-line-continua',
            popover: {
                title: 'Linha Contínua',
                description: 'Para uma linha contínua, selecione esta opção antes de desenhar.'
            }
        },
        {
            element: '#btn-line-tracejada',
            popover: {
                title: 'Linha Tracejada',
                description: 'Para uma linha tracejada, selecione esta opção antes de desenhar.'
            }
        },
        {
            element: '#btn-line-pontilhada',
            popover: {
                title: 'Linha Pontilhada',
                description: 'Para uma linha pontilhada, selecione esta opção antes de desenhar.'
            },
            onDeselected: () => {
                window.linhaTool.closePanel();
            }
        },
        {
            element: "#btn-criar-linha-curvada",
            popover: {
                title: 'Linha Curvada',
                description: 'Desenhe linhas curvas entre dois pontos.'
            }
        },
        {
            element: "#btn-criar-bezier",
            popover: {
                title: 'Curva de Bézier',
                description: 'Desenhe curvas suaves entre dois pontos.'
            }
        },
        {
            element: "#btn-criar-polilinha",
            popover: {
                title: 'Polilinha',
                description: 'Desenhe linhas conectadas entre vários pontos.'
            }
        },
        {
            element: '#btn-criar-texto',
            popover: {
                title: 'Texto',
                description: 'Insira textos diretamente no desenho.'
            }
        },
        {
            element: '#btn-pintar',
            popover: {
                title: 'Conta-gotas',
                description: 'Captura uma cor já existente para reutilização.'
            }
        },
        {
            element: '#btn-borracha',
            popover: {
                title: 'Borracha',
                description: 'Remove objetos do desenho.'
            }
        },
        {
            element: "#btn-lapis",
            popover: {
                title: 'Lápis',
                description: 'Desenhe de forma livre.'
            }
        },
        {
            element: "#btn-pincel",
            popover: {
                title: 'Pincel',
                description: 'Pinte como quiser no projeto.'
            }
        },
        {
            element: '#btn-zoom-click',
            popover: {
                title: 'Zoom',
                description: 'Aproxime ou afaste a visualização da área de trabalho.'
            }
        },
        {
            element: '#btn-importar-imagem',
            popover: {
                title: 'Importar Imagem',
                description: 'Importe imagens PNG, JPG ou SVG para o projeto.'
            }
        }
    ]
});

document
    .getElementById('btn-primeiros-passos')
    .addEventListener('click', () => {
        driverObj.drive();
    });
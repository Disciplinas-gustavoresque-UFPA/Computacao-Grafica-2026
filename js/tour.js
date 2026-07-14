(() => {
    'use strict';

    function inicializarTour() {
        const criarDriver = window.driver?.js?.driver;

        if (typeof criarDriver !== 'function') {
            console.error(
                'Driver.js não foi carregado. Verifique se driver.js.iife.js está sendo carregado antes de tour.js.'
            );
            return;
        }

        const btnPrimeirosPassos = document.getElementById(
            'btn-primeiros-passos'
        );

        if (!btnPrimeirosPassos) {
            console.error(
                'Botão #btn-primeiros-passos não foi encontrado.'
            );
            return;
        }

        let driverObj = null;

        function obterPainelLinha() {
            return document.getElementById('line-options');
        }

        /**
         * Informa se o painel está aberto.
         */
        function painelLinhaEstaAberto() {
            const painel = obterPainelLinha();

            return Boolean(
                painel &&
                !painel.classList.contains('hidden')
            );
        }

        /**
         * Abre o painel sem chamar LinhaTool.openPanel().
         *
         * Isso é importante porque openPanel() altera top e left,
         * podendo deslocar o painel durante o tour.
         */
        function abrirPainelLinha() {
            const painel = obterPainelLinha();

            if (!painel) {
                console.warn(
                    'Painel #line-options não foi encontrado.'
                );
                return;
            }

            if (!painelLinhaEstaAberto()) {
                painel.classList.remove('hidden');
            }

            painel.setAttribute('aria-hidden', 'false');
        }

        /**
         * Fecha o painel sem alterar sua posição.
         */
        function fecharPainelLinha() {
            const painel = obterPainelLinha();

            if (!painel) {
                return;
            }

            if (painelLinhaEstaAberto()) {
                painel.classList.add('hidden');
            }

            painel.setAttribute('aria-hidden', 'true');
        }

        /**
         * Atualiza a posição do destaque do Driver.js depois que
         * o navegador terminar de exibir o submenu.
         */
        function atualizarDestaqueDoTour() {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (
                        driverObj &&
                        driverObj.isActive()
                    ) {
                        driverObj.refresh();
                    }
                });
            });
        }

        /**
         * Abre o painel antes de destacar um dos seus filhos.
         */
        function prepararPainelLinha() {
            abrirPainelLinha();
            atualizarDestaqueDoTour();
        }

        driverObj = criarDriver({
            showProgress: true,
            animate: true,
            allowClose: true,

            nextBtnText: 'Próximo',
            prevBtnText: 'Anterior',
            doneBtnText: 'Concluir',

            progressText: '{{current}} de {{total}}',

            /**
             * Garante que o painel não fique aberto quando o usuário:
             * - concluir o tour;
             * - clicar no X;
             * - clicar fora;
             * - pressionar Esc.
             */
            onDestroyed: () => {
                fecharPainelLinha();
            },

            steps: [
                {
                    element: '#btn-selecionar',
                    popover: {
                        title: 'Ferramenta de Seleção',
                        description:
                            'Use esta ferramenta para selecionar e mover objetos já existentes.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-edicao-vertices',
                    popover: {
                        title: 'Edição por Vértices',
                        description:
                            'Clique nesta ferramenta e depois em um objeto para editar seus vértices.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-criar-retangulo',
                    popover: {
                        title: 'Retângulo',
                        description:
                            'Clique nesta ferramenta e depois na área de desenho para criar retângulos.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-criar-losango',
                    popover: {
                        title: 'Losango',
                        description:
                            'Clique nesta ferramenta e depois na área de desenho para criar losangos.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-criar-elipse',

                    /*
                     * Ao voltar da ferramenta Linha para Elipse,
                     * fecha o submenu.
                     */
                    onHighlightStarted: () => {
                        fecharPainelLinha();
                    },

                    popover: {
                        title: 'Elipse',
                        description:
                            'Permite criar círculos e elipses.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-criar-linha',

                    /*
                     * Abre o submenu antes de destacar o botão Linha.
                     * Não dispara click e não ativa/desativa a ferramenta.
                     */
                    onHighlightStarted: () => {
                        abrirPainelLinha();
                    },

                    onHighlighted: () => {
                        atualizarDestaqueDoTour();
                    },

                    popover: {
                        title: 'Linha',
                        description:
                            'Desenhe linhas entre dois pontos. As opções ao lado permitem escolher o estilo da linha.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-line-continua',

                    /*
                     * Necessário principalmente quando o usuário
                     * retorna para esta etapa usando "Anterior".
                     */
                    onHighlightStarted: () => {
                        abrirPainelLinha();
                    },

                    onHighlighted: () => {
                        atualizarDestaqueDoTour();
                    },

                    popover: {
                        title: 'Linha Contínua',
                        description:
                            'Selecione esta opção para desenhar uma linha contínua.',
                        side: 'right',
                        align: 'center'
                    }
                },

                {
                    element: '#btn-line-tracejada',

                    onHighlightStarted: () => {
                        abrirPainelLinha();
                    },

                    onHighlighted: () => {
                        atualizarDestaqueDoTour();
                    },

                    popover: {
                        title: 'Linha Tracejada',
                        description:
                            'Selecione esta opção para desenhar uma linha tracejada.',
                        side: 'right',
                        align: 'center'
                    }
                },

                {
                    element: '#btn-line-pontilhada',

                    onHighlightStarted: () => {
                        abrirPainelLinha();
                    },

                    onHighlighted: () => {
                        atualizarDestaqueDoTour();
                    },

                    popover: {
                        title: 'Linha Pontilhada',
                        description:
                            'Selecione esta opção para desenhar uma linha pontilhada.',
                        side: 'right',
                        align: 'center'
                    }
                },

                {
                    element: '#btn-criar-linha-curvada',

                    /*
                     * Esta é a primeira etapa depois dos três filhos.
                     * O painel é fechado antes de destacar a linha curvada.
                     */
                    onHighlightStarted: () => {
                        fecharPainelLinha();
                    },

                    onHighlighted: () => {
                        atualizarDestaqueDoTour();
                    },

                    popover: {
                        title: 'Linha Curvada',
                        description:
                            'Desenhe linhas curvas entre dois pontos.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-criar-bezier',
                    popover: {
                        title: 'Curva de Bézier',
                        description:
                            'Desenhe curvas suaves entre dois pontos.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-criar-espiral',
                    popover: {
                        title: 'Espiral',
                        description:
                            'Crie formas em espiral na área de desenho.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-criar-polilinha',
                    popover: {
                        title: 'Polilinha',
                        description:
                            'Desenhe linhas conectadas entre vários pontos.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-criar-texto',
                    popover: {
                        title: 'Texto',
                        description:
                            'Insira textos diretamente no desenho.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-pintar',
                    popover: {
                        title: 'Conta-gotas',
                        description:
                            'Captura uma cor já existente para reutilização.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-borracha',
                    popover: {
                        title: 'Borracha',
                        description:
                            'Remove objetos do desenho.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-lapis',
                    popover: {
                        title: 'Lápis',
                        description:
                            'Desenhe livremente na área de trabalho.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-pincel',
                    popover: {
                        title: 'Pincel',
                        description:
                            'Pinte livremente utilizando o pincel dinâmico.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-zoom-click',
                    popover: {
                        title: 'Zoom',
                        description:
                            'Aproxime ou afaste a visualização da área de trabalho.',
                        side: 'right',
                        align: 'start'
                    }
                },

                {
                    element: '#btn-importar-imagem',
                    popover: {
                        title: 'Importar Imagem',
                        description:
                            'Importe imagens PNG, JPG ou SVG para o projeto.',
                        side: 'right',
                        align: 'start'
                    }
                }
            ]
        });

        btnPrimeirosPassos.addEventListener('click', () => {
            /*
             * Sempre inicia o tour em um estado conhecido.
             */
            fecharPainelLinha();

            /*
             * Evita iniciar duas instâncias sobrepostas.
             */
            if (driverObj.isActive()) {
                driverObj.destroy();
            }

            driverObj.drive();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            inicializarTour,
            { once: true }
        );
    } else {
        inicializarTour();
    }
})();


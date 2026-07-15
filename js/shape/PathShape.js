import { ShapeBase } from './ShapeBase.js';

export class PathShape extends ShapeBase {
    constructor(svgCanvas) {
        super(svgCanvas);
        this.parsedPath = []; // Guardará o estado atual dos comandos do path
    }

    /**
     * Divide a string do atributo 'd' em um array de comandos e seus respectivos números.
     * Facilita a edição pontual sem quebrar as curvas e retas do SVG.
     */
    _parseD(d) {
        const regex = /([a-zA-Z])([^a-zA-Z]*)/g;
        let match;
        const parsed = [];
        
        while ((match = regex.exec(d)) !== null) {
            const tipo = match[1];
            // Extrai todos os números usando regex para lidar com casos onde números 
            // negativos estão colados (ex: 10-20 em vez de 10 -20)
            const numString = match[2];
            const numMatches = numString.match(/-?\d*\.?\d+/g) || [];
            const nums = numMatches.map(Number);
            
            parsed.push({ tipo, nums });
        }
        return parsed;
    }

    /**
     * Remonta o array de comandos transformando-o novamente em uma string válida para o SVG
     */
    _buildD(parsed) {
        return parsed.map(cmd => cmd.tipo + ' ' + cmd.nums.join(' ')).join(' ');
    }

    renderizarTodosHandles(targetElement) {
        const d = targetElement.getAttribute('d');
        if (!d) return;

        this.parsedPath = this._parseD(d);

        // Percorre os comandos e gera um handle para cada par ordenado (x, y)
        this.parsedPath.forEach((cmd, cmdIndex) => {
            // Itera os parâmetros dos comandos em pares (como coordenadas de um plano)
            for (let i = 0; i < cmd.nums.length; i += 2) {
                if (i + 1 < cmd.nums.length) {
                    
                    // Comandos de Arco (A/a) possuem flags booleanas no meio dos parâmetros. Ignoramos elas.
                    if (cmd.tipo.toUpperCase() === 'A' && (i === 2 || i === 4)) {
                        continue;
                    }

                    const x = cmd.nums[i];
                    const y = cmd.nums[i+1];
                    const id = `${cmdIndex}_${i}`; // Ex: comando 0, valor no índice 0 e 1

                    super.renderizarHandle({ x, y, id });
                }
            }
        });
    }

    atualizarForma(coords, targetElement, activeNode) {
        if (!this.parsedPath.length) return;

        // Recupera qual comando e qual par de números estamos alterando via ID
        const partes = activeNode.split('_');
        if (partes.length !== 2) return;

        const cmdIndex = parseInt(partes[0], 10);
        const numIndex = parseInt(partes[1], 10);

        // Substitui os valores antigos pela nova posição do mouse
        this.parsedPath[cmdIndex].nums[numIndex] = coords.x;
        this.parsedPath[cmdIndex].nums[numIndex + 1] = coords.y;

        // Remonta e aplica o novo path
        const novoD = this._buildD(this.parsedPath);
        targetElement.setAttribute('d', novoD);

        this.sincronizarTodosOsHandles();
    }

    sincronizarTodosOsHandles() {
        if (!this.grupoOverlay || !this.parsedPath.length) return;

        this.parsedPath.forEach((cmd, cmdIndex) => {
            for (let i = 0; i < cmd.nums.length; i += 2) {
                 if (cmd.tipo.toUpperCase() === 'A' && (i === 2 || i === 4)) continue;
                 
                 const id = `${cmdIndex}_${i}`;
                 const handle = this.grupoOverlay.querySelector(`[data-node-id="${id}"]`);
                 
                 if (handle) {
                     handle.setAttribute('x', cmd.nums[i] - 4);
                     handle.setAttribute('y', cmd.nums[i+1] - 4);
                 }
            }
        });
    }
    
    removeOverlay() {
        super.removeOverlay();
        this.parsedPath = []; // Limpa a memória quando sai da ferramenta
    }
}
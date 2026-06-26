/**
 * Gera os 8 vértices de um cubo centrado na origem, com tamanho `size`.
 * @param {number} size - Metade do comprimento de cada aresta.
 * @returns {{ x, y, z }[]}
 */
export function getCubeVertices(size = 1) {
  const h = size / 2;
  return [
    { x: -h, y: -h, z: -h }, // 0: fundo-esquerda-trás
    { x:  h, y: -h, z: -h }, // 1: fundo-direita-trás
    { x:  h, y:  h, z: -h }, // 2: topo-direita-trás
    { x: -h, y:  h, z: -h }, // 3: topo-esquerda-trás
    { x: -h, y: -h, z:  h }, // 4: fundo-esquerda-frente
    { x:  h, y: -h, z:  h }, // 5: fundo-direita-frente
    { x:  h, y:  h, z:  h }, // 6: topo-direita-frente
    { x: -h, y:  h, z:  h }, // 7: topo-esquerda-frente
  ];
}

/**
 * Define as 6 faces do cubo.
 * Cada face é um array de 4 índices de vértice, em ordem anti-horária
 * vista de fora — isso garante que a normal aponte para fora.
 */
export const CUBE_FACES = [
  { indices: [4, 5, 6, 7], label: 'frente'  },
  { indices: [1, 0, 3, 2], label: 'trás'    },
  { indices: [0, 4, 7, 3], label: 'esquerda' },
  { indices: [5, 1, 2, 6], label: 'direita'  },
  { indices: [7, 6, 2, 3], label: 'topo'     },
  { indices: [0, 1, 5, 4], label: 'fundo'    },
];

/**
 * Define as 12 arestas do cubo (para debug ou modo wireframe).
 */
export const CUBE_EDGES = [
  [0,1],[1,2],[2,3],[3,0], // face traseira
  [4,5],[5,6],[6,7],[7,4], // face frontal
  [0,4],[1,5],[2,6],[3,7], // conexões frente-trás
];
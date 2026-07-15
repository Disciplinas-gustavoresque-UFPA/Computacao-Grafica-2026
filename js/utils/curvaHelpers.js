/**
 * curvaHelpers.js
 *
 * Lógica de geração do atributo `d` de um <path> suavizado a partir de uma
 * lista de vértices. Extraído de LinhaCurvadaTool para ser reutilizado
 * também na edição de vértices (LinhaCurvadaShape), garantindo que desenhar
 * e editar produzam exatamente a mesma curva.
 */

export function gerarPathDataSuave(pontos) {
  if (!pontos || pontos.length === 0) return '';

  const [inicio] = pontos;

  if (pontos.length === 1) {
    return `M ${inicio.x} ${inicio.y}`;
  }

  if (pontos.length === 2) {
    const fim = pontos[1];
    return `M ${inicio.x} ${inicio.y} L ${fim.x} ${fim.y}`;
  }

  let d = `M ${inicio.x} ${inicio.y}`;

  for (let i = 1; i < pontos.length - 1; i += 1) {
    const controle = pontos[i];
    const proximo = pontos[i + 1];
    const ehUltimoControle = i === pontos.length - 2;
    const fim = ehUltimoControle ? proximo : calcularPontoMedio(controle, proximo);

    d += ` Q ${controle.x} ${controle.y} ${fim.x} ${fim.y}`;
  }

  return d;
}

export function calcularPontoMedio(pontoA, pontoB) {
  return {
    x: (pontoA.x + pontoB.x) / 2,
    y: (pontoA.y + pontoB.y) / 2,
  };
}
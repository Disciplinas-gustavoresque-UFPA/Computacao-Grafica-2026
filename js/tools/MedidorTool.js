// /js/tools/MedidorTool.js
import { ToolBase } from "./ToolBase.js";
import { obterCoordenadaSVG } from "../utils/svgHelpers.js";

export class MedidorTool extends ToolBase {
  constructor(svg, overlaySvg, camera = null) {
    super();

    this.svg = svg;
    this.overlaySvg = overlaySvg;
    this.camera = camera;

    this.ativo = false;
    this.medindo = false;

    // Distâncias
    this.start = { x: 0, y: 0 };
    this.current = { x: 0, y: 0 };

    this.overlayGroup = null;
    this.baseLine = null;
    this.measureLine = null;
    this.angleArc = null;
    this.distText = null;
    this.angleText = null;
    this.baseText = null;
  }

  criarElementosMedidor() {
    this.removerElementosMedidor();
    this.overlayGroup = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "g",
    );
    this.overlayGroup.setAttribute("id", "medidor-overlay");
    this.overlayGroup.style.pointerEvents = "none";

    // Linha da Base (vermelha pontilhada)
    this.baseLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    this.baseLine.setAttribute("stroke", "#ff6666");
    this.baseLine.setAttribute("stroke-width", "2");
    this.baseLine.setAttribute("stroke-dasharray", "4,4");

    // Linha de Medição (azul)
    this.measureLine = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "line",
    );
    this.measureLine.setAttribute("stroke", "#6666ff");
    this.measureLine.setAttribute("stroke-width", "2");

    // Arco do ângulo
    this.angleArc = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    this.angleArc.setAttribute("fill", "none");
    this.angleArc.setAttribute("stroke", "#58a192");
    this.angleArc.setAttribute("stroke-width", "12");

    // Texto de Distância (Linha Azul)
    this.distText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    this.distText.setAttribute("fill", "#6666ff");
    this.distText.setAttribute("font-size", "12px");
    this.distText.setAttribute("font-family", "system-ui");

    // Texto da Base (Linha Vermelha)
    this.baseText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    this.baseText.setAttribute("fill", "#ff6666");
    this.baseText.setAttribute("font-size", "12px");
    this.baseText.setAttribute("font-family", "system-ui");

    // Texto de Ângulo
    this.angleText = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text",
    );
    this.angleText.setAttribute("fill", "#58a192");
    this.angleText.setAttribute("font-size", "12px");
    this.angleText.setAttribute("font-family", "system-ui");

    // Monta o grupo
    this.overlayGroup.appendChild(this.baseLine);
    this.overlayGroup.appendChild(this.measureLine);
    this.overlayGroup.appendChild(this.angleArc);
    this.overlayGroup.appendChild(this.distText);
    this.overlayGroup.appendChild(this.baseText);
    this.overlayGroup.appendChild(this.angleText);

    this.overlaySvg.appendChild(this.overlayGroup);
  }

  removerElementosMedidor() {
    if (this.overlayGroup && this.overlayGroup.parentNode) {
      this.overlayGroup.parentNode.removeChild(this.overlayGroup);
    }
    this.overlayGroup = null;
    this.baseLine = null;
    this.measureLine = null;
    this.angleArc = null;
    this.distText = null;
    this.baseText = null;
    this.angleText = null;
  }

  onMouseDown(evento) {
    if (evento.button !== 0) return;

    this.medindo = true;
    const coords = obterCoordenadaSVG(evento, this.svg);
    this.start = coords;
    this.current = coords;

    this.criarElementosMedidor();
    this.updateRender(this.current);
  }

  onMouseMove(evento) {
    if (!this.medindo || !this.overlayGroup) return;

    this.current = obterCoordenadaSVG(evento, this.svg);
    this.updateRender(this.current);
  }

  onMouseUp(evento) {
    if (!this.medindo) return;
    this.medindo = false;
  }

  updateRender(currentPoint) {
    if (!this.overlayGroup) return;

    const dx = currentPoint.x - this.start.x;
    const dy = currentPoint.y - this.start.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    let angleRad = Math.atan2(dy, dx);
    let angleDeg = angleRad * (180 / Math.PI);
    if (angleDeg < 0) angleDeg += 360;

    const zoomScale = this.camera
      ? this.camera.viewBox.width / this.svg.getBoundingClientRect().width
      : 1;

    const strokeW = Math.max(1 * zoomScale, 0.5);
    const fontS = Math.max(12 * zoomScale, 6);

    if (distance < 2) {
      this.baseLine.setAttribute("stroke-width", "0");
      this.measureLine.setAttribute("stroke-width", "0");
      this.angleArc.style.display = "none";
      this.distText.textContent = "";
      this.baseText.textContent = "";
      this.angleText.textContent = "";
      return;
    }

    // Atualiza Linhas
    this.baseLine.setAttribute("x1", this.start.x);
    this.baseLine.setAttribute("y1", this.start.y);
    this.baseLine.setAttribute("x2", currentPoint.x);
    this.baseLine.setAttribute("y2", this.start.y);
    this.baseLine.setAttribute("stroke-width", strokeW);

    this.measureLine.setAttribute("x1", this.start.x);
    this.measureLine.setAttribute("y1", this.start.y);
    this.measureLine.setAttribute("x2", currentPoint.x);
    this.measureLine.setAttribute("y2", currentPoint.y);
    this.measureLine.setAttribute("stroke-width", strokeW);

    const arcRadius = Math.min(30 * zoomScale, distance * 0.4);
    const arcStartX = this.start.x + arcRadius;
    const arcStartY = this.start.y;
    const arcEndX = this.start.x + arcRadius * Math.cos(angleRad);
    const arcEndY = this.start.y + arcRadius * Math.sin(angleRad);

    // Determina se o ângulo está no semicírculo inferior (dy >= 0) ou superior (dy < 0)
    // Isso define se o arco deve rodar no sentido horário (1) ou anti-horário (0)
    const sweepFlag = dy >= 0 ? 1 : 0;

    let largeArcFlag = 0;
    if (dy >= 0 && angleDeg > 180) {
      largeArcFlag = 1;
    } else if (dy < 0 && angleDeg < 180) {
      largeArcFlag = 1;
    }
    const pathData = `M ${this.start.x} ${this.start.y} L ${arcStartX} ${arcStartY} A ${arcRadius} ${arcRadius} 0 ${largeArcFlag} ${sweepFlag} ${arcEndX} ${arcEndY} Z`;

    this.angleArc.setAttribute("d", pathData);
    this.angleArc.setAttribute("fill", "rgba(88, 161, 146, 0.25)");
    this.angleArc.setAttribute("stroke-width", strokeW * 1.2);
    this.angleArc.style.display = "block";

    const labelOffsetX = 10 * zoomScale;

    // Texto de Distância (Linha Azul)
    this.distText.textContent = `${distance.toFixed(2)} px`;
    this.distText.setAttribute("x", currentPoint.x + labelOffsetX);
    this.distText.setAttribute("y", currentPoint.y);
    this.distText.setAttribute("font-size", `${fontS}px`);

    // Texto da Base (Linha Vermelha)
    this.baseText.textContent = `${Math.abs(dx).toFixed(2)} px`;
    this.baseText.setAttribute("x", this.start.x + dx / 2);
    this.baseText.setAttribute(
      "y",
      this.start.y + (dy >= 0 ? -8 : 16) * zoomScale,
    ); // Joga o texto para cima ou para baixo para não encavalar
    this.baseText.setAttribute("font-size", `${fontS}px`);
    this.baseText.setAttribute("text-anchor", "middle");

    // Texto de Ângulo
    this.angleText.textContent = `${angleDeg.toFixed(2)}°`;
    const textRadius = Math.min(45 * zoomScale, distance * 0.65);
    const midAngleRad = angleRad / 2;
    this.angleText.setAttribute(
      "x",
      this.start.x + textRadius * Math.cos(midAngleRad),
    );
    this.angleText.setAttribute(
      "y",
      this.start.y + textRadius * Math.sin(midAngleRad),
    );
    this.angleText.setAttribute("font-size", `${fontS}px`);
  }

  onAtivar() {
    this.ativo = true;
    this.medindo = false;
    this.svg.style.cursor = "precision";

    const btnMedidor = document.getElementById("btn-medidor");
    if (btnMedidor) btnMedidor.classList.add("ativo");
  }

  onDesativar() {
    this.ativo = false;
    this.medindo = false;

    this.removerElementosMedidor();

    const btnMedidor = document.getElementById("btn-medidor");
    if (btnMedidor) btnMedidor.classList.remove("ativo");

    this.svg.style.cursor = "default";
  }
}

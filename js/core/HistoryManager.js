import { MementoSVG } from './MementoSVG.js';

export class HistoryManager {
  #svgCanvas;
  #undoStack = [];
  #redoStack = [];

  constructor(svgCanvas) {
    this.#svgCanvas = svgCanvas;
  }
}
/**
 * SvgHistoryObserver — Observa mutações relevantes no #canvas e salva histórico.
 */
export class SvgHistoryObserver {
  /**
   * @param {SVGSVGElement} svgCanvas
   * @param {() => boolean} onCommit
   * @param {{ debounceMs?: number }} [options]
   */
  constructor(svgCanvas, onCommit, options = {}) {
    this.svgCanvas = svgCanvas;
    this.onCommit = onCommit;
    this.debounceMs = options.debounceMs ?? 150;
    this.isPaused = false;
    this.isPressing = false;
    this.hasPendingDragMutation = false;
    this.commitTimer = null;
    this.observer = null;

    this.handleMouseDown = this._handleMouseDown.bind(this);
    this.handleMouseUp = this._handleMouseUp.bind(this);

    this.attributeFilter = [
      "x",
      "y",
      "cx",
      "cy",
      "x1",
      "y1",
      "x2",
      "y2",
      "transform",
      "points",
      "d",
      "width",
      "height",
      "rx",
      "ry",
    ];
  }

  start() {
    if (!this.svgCanvas || this.observer) return;

    globalThis.addEventListener("mouseup", this.handleMouseUp, true);
    globalThis.addEventListener("mousedown", this.handleMouseDown, true);

    this.observer = new MutationObserver((mutations) => {
      if (this.isPaused) return;

      const hasMutation = mutations.some((mutation) =>
        this._isRelevantMutation(mutation),
      );

      if (!hasMutation) return;

      if (this.isPressing) {
        this.hasPendingDragMutation = true;
        return;
      }

      this._scheduleCommit();
    });

    this.observer.observe(this.svgCanvas, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: this.attributeFilter,
    });
  }

  stop() {
    this._clearTimer();

    globalThis.removeEventListener("mouseup", this.handleMouseUp, true);
    globalThis.removeEventListener("mousedown", this.handleMouseDown, true);

    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  pause() {
    this.isPaused = true;
    this.hasPendingDragMutation = false;
    this._clearTimer();
  }

  resume() {
    this.isPaused = false;
  }

  _handleMouseDown() {
    this.isPressing = true;
    this.hasPendingDragMutation = false;
    this._clearTimer();
  }

  _handleMouseUp() {
    this.isPressing = false;

    if (this.hasPendingDragMutation) {
      this.hasPendingDragMutation = false;
      this._scheduleCommit();
    }
  }

  _scheduleCommit() {
    this._clearTimer();
    this.commitTimer = setTimeout(() => {
      if (!this.isPaused) {
        this.onCommit();
      }
    }, this.debounceMs);
  }

  _clearTimer() {
    if (!this.commitTimer) return;

    clearTimeout(this.commitTimer);

    this.commitTimer = null;
  }

  /**
   * @param {MutationRecord} mutation
   */
  _isRelevantMutation(mutation) {
    if (mutation.type === "attributes") {
      const target = mutation.target;

      if (!(target instanceof Element)) return false;

      if (this._isIgnoredElement(target)) return false;

      return this.attributeFilter.includes(mutation.attributeName || "");
    }

    if (mutation.type === "childList") {
      const added = Array.from(mutation.addedNodes).some((node) =>
        this._isRelevantNode(node),
      );

      if (added) return true;

      const removed = Array.from(mutation.removedNodes).some((node) =>
        this._isRelevantNode(node),
      );

      return removed;
    }

    return false;
  }

  /**
   * @param {Node} node
   */
  _isRelevantNode(node) {
    if (!(node instanceof Element)) return false;

    if (this._isIgnoredElement(node)) return false;

    const tag = node.tagName.toLowerCase();

    const allowedTags = [
      "rect",
      "ellipse",
      "line",
      "path",
      "text",
      "image",
      "circle",
      "polygon",
      "polyline",
      "g",
    ];

    return allowedTags.includes(tag);
  }

  /**
   * @param {Element} element
   */
  _isIgnoredElement(element) {
    if (element.id === "overlay-nodes") return true;

    if (element.classList.contains("node-handle")) return true;

    if (element.closest("#overlay-nodes")) return true;

    return false;
  }
}

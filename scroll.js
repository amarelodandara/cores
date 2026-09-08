// Liga o scroll aos steps definidos em index.html (data-ano-min/data-ano-max)
// ao grafo em graph.js. Sem lógica de tema ainda -- só realça faixa de anos.

(function () {
  const scroller = scrollama();

  function handleResize() {
    scroller.resize();
  }

  function handleStepEnter(response) {
    const el = response.element;
    const anoMin = Number(el.dataset.anoMin);
    const anoMax = Number(el.dataset.anoMax);
    document.querySelectorAll(".step").forEach((s) => s.classList.remove("is-active"));
    el.classList.add("is-active");
    Grafo.realcarFaixa(anoMin, anoMax);
  }

  function init() {
    scroller
      .setup({
        step: ".step",
        offset: 0.6,
      })
      .onStepEnter(handleStepEnter);

    window.addEventListener("resize", handleResize);
  }

  window.addEventListener("load", init);
})();

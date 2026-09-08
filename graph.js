// v1: colunas de ano, largura igual, 2009-2025. Nós entram depois --
// por ora só o eixo de tempo. Ver PLANO.md.

const Grafo = (() => {
  async function iniciar() {
    const dados = await d3.json("data/songs.json");

    const largura = () => document.getElementById("graphic").clientWidth;
    const altura = () => document.getElementById("graphic").clientHeight;

    const svg = d3.select("#grafo");
    const margemInferior = 40;

    const [anoMin, anoMax] = d3.extent(dados, (d) => d.ano);
    const anos = d3.range(anoMin, anoMax + 1);

    const xScale = d3.scaleBand().domain(anos).range([0, largura()]).paddingOuter(0);

    const grupoAnos = svg.append("g").attr("class", "year-columns");

    function desenharColunas() {
      xScale.range([0, largura()]);
      const h = altura() - margemInferior;
      const passo = xScale.step();

      const linhas = grupoAnos
        .selectAll("line")
        .data(anos, (d) => d)
        .join("line")
        .attr("class", "year-line")
        .attr("x1", (d) => xScale(d))
        .attr("x2", (d) => xScale(d))
        .attr("y1", 0)
        .attr("y2", h);

      grupoAnos
        .selectAll("line.year-line-end")
        .data([anoMax])
        .join("line")
        .attr("class", "year-line year-line-end")
        .attr("x1", xScale(anoMax) + passo)
        .attr("x2", xScale(anoMax) + passo)
        .attr("y1", 0)
        .attr("y2", h);

      grupoAnos
        .selectAll("text")
        .data(anos, (d) => d)
        .join("text")
        .attr("class", "year-label")
        .attr("x", (d) => xScale(d) + passo / 2)
        .attr("y", h + 16)
        .attr("text-anchor", "middle")
        .text((d) => d);
    }

    desenharColunas();

    window.addEventListener("resize", desenharColunas);
  }

  return { iniciar };
})();

Grafo.iniciar();

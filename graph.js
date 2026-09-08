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

    const centro = (ano) => xScale(ano) + xScale.bandwidth() / 2;

    const radius = d3
      .scaleSqrt()
      .domain([0, d3.max(dados, (d) => d.palavras)])
      .range([3, xScale.bandwidth() / 2 - 2]);

    const nodeSel = svg
      .append("g")
      .selectAll("circle")
      .data(dados, (d) => d.id)
      .join("circle")
      .attr("class", "node")
      .attr("r", (d) => radius(d.palavras));

    nodeSel
      .append("title")
      .text((d) => `${d.titulo} — ${d.album} (${d.ano}) · ${d.palavras} palavras`);

    const simulation = d3
      .forceSimulation(dados)
      .force("x", d3.forceX((d) => centro(d.ano)).strength(0.9))
      .force("y", d3.forceY(altura() / 2).strength(0.04))
      .force(
        "collide",
        d3.forceCollide((d) => radius(d.palavras) + 1.5)
      )
      .on("tick", () => {
        nodeSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      });

    window.addEventListener("resize", () => {
      desenharColunas();
      radius.range([3, xScale.bandwidth() / 2 - 2]);
      nodeSel.attr("r", (d) => radius(d.palavras));
      simulation.force("y", d3.forceY(altura() / 2).strength(0.04));
      simulation.alpha(0.3).restart();
    });
  }

  return { iniciar };
})();

Grafo.iniciar();

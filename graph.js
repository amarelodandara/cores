// v1: discografia inteira no eixo do tempo. Sem tema/cor por valor ainda --
// isso entra quando scraper/exportar_grafo.py (repo valores) ganhar esses
// campos. Ver PLANO.md.

const Grafo = (() => {
  let simulation, xScale, radius, svg, nodeSel;

  async function iniciar() {
    const dados = await d3.json("data/songs.json");

    const largura = () => document.getElementById("graphic").clientWidth;
    const altura = () => document.getElementById("graphic").clientHeight;

    svg = d3.select("#grafo");

    xScale = d3
      .scaleLinear()
      .domain(d3.extent(dados, (d) => d.ano))
      .range([60, largura() - 40]);

    radius = d3
      .scaleSqrt()
      .domain([0, d3.max(dados, (d) => d.palavras)])
      .range([3, 22]);

    const eixoX = d3.axisBottom(xScale).tickFormat(d3.format("d")).ticks(8);
    const grupoEixo = svg
      .append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0, ${altura() - 40})`)
      .call(eixoX);

    nodeSel = svg
      .append("g")
      .selectAll("circle")
      .data(dados, (d) => d.id)
      .join("circle")
      .attr("class", "node")
      .attr("r", (d) => radius(d.palavras));

    nodeSel
      .append("title")
      .text((d) => `${d.titulo} — ${d.album} (${d.ano}) · ${d.palavras} palavras`);

    simulation = d3
      .forceSimulation(dados)
      .force("x", d3.forceX((d) => xScale(d.ano)).strength(0.9))
      .force("y", d3.forceY(altura() / 2).strength(0.04))
      .force(
        "collide",
        d3.forceCollide((d) => radius(d.palavras) + 1.5)
      )
      .on("tick", () => {
        nodeSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
      });

    window.addEventListener("resize", () => {
      xScale.range([60, largura() - 40]);
      grupoEixo
        .attr("transform", `translate(0, ${altura() - 40})`)
        .call(eixoX);
      simulation.alpha(0.3).restart();
    });
  }

  function realcarFaixa(anoMin, anoMax) {
    if (!nodeSel) return;
    nodeSel.classed("dim", (d) => d.ano < anoMin || d.ano > anoMax);
  }

  return { iniciar, realcarFaixa };
})();

Grafo.iniciar();

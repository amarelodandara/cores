// v1: discografia inteira no eixo do tempo, com linhas verticais marcando o ano
// de cada lançamento. Sem tema/cor por valor ainda -- isso entra quando
// scraper/exportar_grafo.py (repo valores) ganhar esses campos. Ver PLANO.md.

const Grafo = (() => {
  async function iniciar() {
    const dados = await d3.json("data/songs.json");

    const largura = () => document.getElementById("graphic").clientWidth;
    const altura = () => document.getElementById("graphic").clientHeight;

    const svg = d3.select("#grafo");
    const margemInferior = 40;

    const xScale = d3
      .scaleLinear()
      .domain(d3.extent(dados, (d) => d.ano))
      .range([60, largura() - 40]);

    const radius = d3
      .scaleSqrt()
      .domain([0, d3.max(dados, (d) => d.palavras)])
      .range([3, 22]);

    const [anoMin, anoMax] = d3.extent(dados, (d) => d.ano);
    const anos = d3.range(anoMin, anoMax + 1);

    const grupoAnos = svg.append("g").attr("class", "year-lines");

    function desenharLinhasDeAno() {
      const h = altura() - margemInferior;

      const linhas = grupoAnos
        .selectAll("line")
        .data(anos, (d) => d)
        .join("line")
        .attr("class", "year-line")
        .attr("x1", (d) => xScale(d))
        .attr("x2", (d) => xScale(d))
        .attr("y1", 0)
        .attr("y2", h);

      const labels = grupoAnos
        .selectAll("text")
        .data(anos, (d) => d)
        .join("text")
        .attr("class", "year-label")
        .attr("x", (d) => xScale(d))
        .attr("y", h + 16)
        .attr("text-anchor", "middle")
        .text((d) => d);

      return { linhas, labels };
    }

    desenharLinhasDeAno();

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
      desenharLinhasDeAno();
      simulation.alpha(0.3).restart();
    });
  }

  return { iniciar };
})();

Grafo.iniciar();

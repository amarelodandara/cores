// v1: colunas de ano, largura igual, 2009-2025. Nós entram depois --
// por ora só o eixo de tempo. Ver PLANO.md.

function slugify(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

    const grupoDestaque = svg.append("g").attr("class", "album-highlight");
    const destaqueRect = grupoDestaque
      .append("rect")
      .attr("class", "highlight-rect")
      .attr("y", 0)
      .style("opacity", 0);

    const margemSuperior = 16;
    const capaMax = 96;

    const albunsPorAno = new Map();
    dados.forEach((d) => {
      if (!albunsPorAno.has(d.ano)) albunsPorAno.set(d.ano, []);
      const lista = albunsPorAno.get(d.ano);
      if (!lista.includes(d.album)) lista.push(d.album);
    });

    const grupoCapas = svg.append("g").attr("class", "album-covers");

    function desenharCapas() {
      const passo = xScale.step();
      const entradas = [];

      anos.forEach((ano) => {
        const albuns = albunsPorAno.get(ano);
        if (!albuns) return;
        const largSlot = passo / albuns.length;
        const tamanho = Math.min(capaMax, largSlot - 8);
        albuns.forEach((album, i) => {
          entradas.push({
            chave: `${ano}__${album}`,
            ano,
            album,
            slug: slugify(album),
            tamanho,
            x: xScale(ano) + largSlot * i + largSlot / 2 - tamanho / 2,
            slotX: xScale(ano) + largSlot * i,
            slotWidth: largSlot,
          });
        });
      });

      const grupos = grupoCapas
        .selectAll("g.cover")
        .data(entradas, (d) => d.chave)
        .join((enter) => {
          const g = enter.append("g").attr("class", "cover");
          g.append("rect").attr("class", "cover-placeholder");
          g.append("image").attr("class", "cover-image");
          g.append("text").attr("class", "cover-label");
          g.append("title");
          return g;
        });

      grupos.attr("transform", (d) => `translate(${d.x}, ${margemSuperior})`);

      grupos.select("title").text((d) => `${d.album} (${d.ano})`);

      grupos
        .select("rect.cover-placeholder")
        .attr("width", (d) => d.tamanho)
        .attr("height", (d) => d.tamanho);

      grupos
        .select("image.cover-image")
        .attr("width", (d) => d.tamanho)
        .attr("height", (d) => d.tamanho)
        .attr("href", (d) => `capas/${d.slug}.jpg`)
        .style("display", null)
        .on("error", function () {
          d3.select(this).style("display", "none");
        });

      grupos
        .select("text.cover-label")
        .attr("x", (d) => d.tamanho / 2)
        .attr("y", (d) => d.tamanho + 16)
        .attr("text-anchor", "middle")
        .text((d) => d.album);

      grupos
        .on("mouseenter", function (event, d) {
          nodeSel.classed("dim", (s) => s.album !== d.album);
          d3.select(this).select("text.cover-label").classed("is-visible", true);
          destaqueRect
            .attr("x", d.slotX)
            .attr("width", d.slotWidth)
            .attr("height", altura() - margemInferior)
            .style("opacity", 1);
        })
        .on("mouseleave", function () {
          nodeSel.classed("dim", false);
          d3.select(this).select("text.cover-label").classed("is-visible", false);
          destaqueRect.style("opacity", 0);
        });
    }

    desenharCapas();

    const centro = (ano) => xScale(ano) + xScale.bandwidth() / 2;

    const raioMax = () => Math.min(12, xScale.bandwidth() / 2 - 2);

    const radius = d3
      .scaleSqrt()
      .domain([0, d3.max(dados, (d) => d.palavras)])
      .range([2, raioMax()]);

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
      desenharCapas();
      radius.range([2, raioMax()]);
      nodeSel.attr("r", (d) => radius(d.palavras));
      simulation.force("y", d3.forceY(altura() / 2).strength(0.04));
      simulation.alpha(0.3).restart();
    });
  }

  return { iniciar };
})();

Grafo.iniciar();

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
        .attr("x", (d) => xScale(d) + 4)
        .attr("y", h - 8)
        .attr("text-anchor", "start")
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

    // Tamanho-base da capa, teto ajustado depois pra largura da coluna/banda.
    const tamanhoCapa = 72;

    const albunsPorAno = new Map();
    const faixasPorChave = new Map();
    dados.forEach((d) => {
      if (!albunsPorAno.has(d.ano)) albunsPorAno.set(d.ano, []);
      const lista = albunsPorAno.get(d.ano);
      if (!lista.includes(d.album)) lista.push(d.album);
      const chave = `${d.ano}__${d.album}`;
      faixasPorChave.set(chave, (faixasPorChave.get(chave) ?? 0) + 1);
    });

    // Coluna do ano divide em bandas horizontais, uma por álbum (empilhadas
    // de cima pra baixo). Com só 1 álbum a banda é a coluna inteira. Cada
    // capa fica colada na borda esquerda, alinhada ao cluster do seu álbum.
    function centroYAlbum(ano, album) {
      const albuns = albunsPorAno.get(ano);
      const total = albuns.length;
      if (total <= 1) return altura() / 2;
      const h = altura() - margemInferior;
      const usableTop = margemSuperior + 8;
      const usableBottom = h - 8;
      const bandHeight = (usableBottom - usableTop) / total;
      const i = albuns.indexOf(album);
      return usableTop + bandHeight * (i + 0.5);
    }

    const grupoCapas = svg.append("g").attr("class", "album-covers");

    function desenharCapas() {
      const passo = xScale.step();
      const h = altura() - margemInferior;
      const entradas = [];

      anos.forEach((ano) => {
        const albuns = albunsPorAno.get(ano);
        if (!albuns) return;
        const total = albuns.length;
        const usableTop = margemSuperior + 8;
        const usableBottom = h - 8;
        const bandHeight = (usableBottom - usableTop) / total;

        albuns.forEach((album, i) => {
          const tamanho = Math.min(tamanhoCapa, passo / 2 - 8, bandHeight - 12);
          const x = xScale(ano) + 4;
          const y = centroYAlbum(ano, album) - tamanho / 2;

          const chave = `${ano}__${album}`;

          entradas.push({
            chave,
            ano,
            album,
            slug: slugify(album),
            faixas: faixasPorChave.get(chave) ?? 0,
            tamanho,
            x,
            y,
            slotX: xScale(ano),
            slotWidth: passo,
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
          const badge = g.append("g").attr("class", "count-badge").attr("opacity", 0);
          badge.append("circle").attr("class", "node count-circle").attr("r", 14);
          badge.append("text").attr("class", "count-label");
          g.append("title");
          return g;
        });

      grupos.attr("transform", (d) => `translate(${d.x}, ${d.y})`);

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

      // badge fica acima da capa, não em cima da arte
      grupos
        .select("g.count-badge")
        .attr("transform", (d) => `translate(${d.tamanho / 2}, -22)`)
        .select("text.count-label")
        .text((d) => d.faixas);

      grupos
        .on("mouseenter", function (event, d) {
          nodeSel.classed("dim", (s) => s.album !== d.album);
          d3.select(this).select("text.cover-label").classed("is-visible", true);
          d3.select(this).select("g.count-badge").attr("opacity", 1);
          destaqueRect
            .attr("x", d.slotX)
            .attr("width", d.slotWidth)
            .attr("height", altura() - margemInferior)
            .style("opacity", 1);
        })
        .on("mouseleave", function () {
          nodeSel.classed("dim", false);
          d3.select(this).select("text.cover-label").classed("is-visible", false);
          d3.select(this).select("g.count-badge").attr("opacity", 0);
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

    // A capa se ancora na bolinha mais alta do próprio álbum: só os 15% de
    // baixo dela cobrem o topo do cluster, o resto sobe pra fora.
    function posicionarCapas() {
      const topoPorAlbum = new Map();
      dados.forEach((d) => {
        const chave = `${d.ano}__${d.album}`;
        const topo = d.y - radius(d.palavras);
        const atual = topoPorAlbum.get(chave);
        if (atual === undefined || topo < atual) topoPorAlbum.set(chave, topo);
      });

      grupoCapas.selectAll("g.cover").attr("transform", (c) => {
        const topo = topoPorAlbum.get(c.chave);
        const y = topo === undefined ? c.y : topo - c.tamanho * 0.85;
        return `translate(${c.x}, ${y})`;
      });
    }

    const simulation = d3
      .forceSimulation(dados)
      .force("x", d3.forceX((d) => centro(d.ano)).strength(0.9))
      .force("y", d3.forceY((d) => centroYAlbum(d.ano, d.album)).strength(0.08))
      .force(
        "collide",
        d3.forceCollide((d) => radius(d.palavras) + 1.5)
      )
      .on("tick", () => {
        nodeSel.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
        posicionarCapas();
      });

    window.addEventListener("resize", () => {
      desenharColunas();
      desenharCapas();
      radius.range([2, raioMax()]);
      nodeSel.attr("r", (d) => radius(d.palavras));
      simulation.force("y", d3.forceY((d) => centroYAlbum(d.ano, d.album)).strength(0.08));
      simulation.alpha(0.3).restart();
    });
  }

  return { iniciar };
})();

Grafo.iniciar();

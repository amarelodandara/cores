# Cores

Scrollytelling sobre a obra do Emicida: um grafo de rede com eixo do tempo, onde cada
ponto é uma faixa lançada. Vibe [The Pudding](https://pudding.cool/).

## v1 (atual)

Só a discografia inteira posicionada por ano de lançamento, tamanho do nó = contagem
de palavras da letra. Sem tema, sem cor por valor, sem aresta entre músicas — isso
depende da análise de valores, que está em andamento no repo
[`valores`](https://github.com/amarelodandara/valores) (privado).

`data/songs.json` é gerado por `scraper/exportar_grafo.py` no repo `valores` e copiado
pra cá manualmente por enquanto. Contém só dado derivado (título, álbum, ano, tipo de
lançamento, contagem de palavras) — nunca letra.

## Stack

Vanilla JS + [D3](https://d3js.org/) (força + eixo) + [Scrollama](https://github.com/russellsamora/scrollama)
(scroll-trigger), sem bundler. Abrir com qualquer servidor estático:

```bash
python3 -m http.server 8000
```

## Próximos passos

- Reexportar `data/songs.json` quando a análise de `valores` cobrir uma fatia
  significativa das 116 músicas — ganha `tema`, `cor`, `tema_estrofe`.
- Cor do nó por tema dominante; aresta em topologia de estrela por tema (evita clique
  O(n²) — ver plano).
- Versão mobile simplificada, se o grafo interativo não se sustentar em tela pequena.

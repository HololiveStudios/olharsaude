# Crawler — clinicaolharsaude.com.br

Gera um `site-dump/` com páginas, assets e um `manifest.json` completo, pronto para
servir de insumo à reconstrução em HTML/CSS/JS puro.

## Uso

```bash
bun install
bun run crawler.ts https://clinicaolharsaude.com.br ./site-dump
```

Isso roda **localmente na sua máquina** (o ambiente onde estou não tem acesso de
rede a domínios arbitrários, só consigo analisar o site via ferramenta de busca/fetch
pontual — por isso o crawler precisa ser executado por você).

## O que o script já resolve em relação ao seu plano original

- **Rate limit / 409**: o site bloqueia requests em sequência sem espaçamento.
  O script usa delay aleatório (1.2–2.8s) entre requests + retry com backoff
  exponencial em 409/429/503, e um User-Agent de navegador real.
- **`redirecionamento.php`**: não é baixado como página — o script segue o
  redirect manualmente e grava a URL de destino real em `manifest.json > external`
  (é o CTA "Agendar Consulta" de todo o site, provavelmente um link de WhatsApp).
- **YouTube e Google Maps**: detectados via `<iframe>` e links diretos, registrados
  como `external` (não baixados, permanecem embed).
- **SEO**: extrai `<title>`, meta description, `og:image`, canonical e
  `application/ld+json` de cada página, e gera `_redirects` (formato Cloudflare
  Pages) mapeando as rotas antigas (`/blog.php?id=2`) para as novas
  (`/blog/2/`) com 301 — sem isso você perde indexação/ranking existente.
- **CSS**: baixa as folhas de estilo e também resolve `url(...)` internos
  (`background-image` etc.), não só `<img>`.
- **Imagens**: gera automaticamente uma versão `.webp` de cada `.jpg`/`.png`
  baixado (mantém o original para fallback via `<picture>`).

## O que ainda exige revisão manual sua

1. **Confira `manifest.json > external`** antes de qualquer coisa — especialmente
   o item de `redirecionamento.php`. Se ele resolver para `wa.me/...`, você tem
   o número e a mensagem pré-preenchida usados no funil de agendamento.
2. **Google Maps**: o script marca páginas/unidades que têm link ou embed de mapa,
   mas a associação "qual unidade é qual mapa" precisa ser conferida à mão —
   isso depende de como o HTML original nomeia cada bloco.
3. **Fontes**: se o `<head>` carregar Google Fonts via `<link>` externo (fora do
   domínio do site), o script não intercepta — baixe manualmente e sirva local
   para não depender de request externo.
4. **Analytics/Pixels**: confira manualmente se há GA4, Meta Pixel ou pixel do
   WhatsApp Business no HTML bruto salvo em `pages-raw/`. Isso é rastreamento de
   conversão de um site de captação de leads; se sumir na reconstrução, o
   cliente perde visibilidade de origem de tráfego sem perceber.

## Depois do dump

1. Revise `site-dump/manifest.json` e `site-dump/_redirects`.
2. Use `site-dump/pages-raw/**/*.html` como referência de estrutura/conteúdo —
   não é para publicar, é insumo para reescrever em HTML limpo.
3. Reconstrua CSS em `variables.css / reset.css / layout.css / components.css /
   pages.css / animations.css / responsive.css`, usando as imagens em
   `assets/images/*.webp`.
4. Publique `_redirects` junto com o novo site no Cloudflare Pages, para não
   perder SEO das URLs antigas.
5. (Opcional, próximo passo) script de diff visual com Playwright +
   pixelmatch: screenshot do site antigo vs. novo, página por página, desktop
   e mobile — posso montar esse script também se quiser.

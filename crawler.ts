#!/usr/bin/env bun
/**
 * Crawler para clonar clinicaolharsaude.com.br em site-dump/ (páginas + assets + manifest.json)
 *
 * Uso:
 *   bun install
 *   bun run crawler.ts https://clinicaolharsaude.com.br ./site-dump
 *
 * O que ele faz:
 *  - Percorre todas as páginas internas (BFS a partir da home)
 *  - Respeita rate limit (o site retorna 409 em requests em sequência) com delay + retry/backoff
 *  - Mapeia rotas PHP -> rotas limpas (blog.php?id=2 -> /blog/2/) e registra 301 em _redirects
 *  - Baixa imagens, CSS, JS, fontes; extrai url(...) de dentro dos arquivos CSS
 *  - Gera versão .webp de cada imagem raster baixada
 *  - Extrai <title>, meta description, og:image, canonical e JSON-LD de cada página
 *  - Detecta embeds de YouTube e Google Maps e registra como "external" (não baixa)
 *  - Resolve /redirecionamento.php (não baixa o HTML, segue o redirect e grava o destino real,
 *    ex.: link de WhatsApp) — é o CTA "Agendar Consulta" do site inteiro
 */

import * as cheerio from "cheerio";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

// ------------------------- CONFIG -------------------------
const START_URL = process.argv[2] ?? "https://clinicaolharsaude.com.br/";
const OUT_DIR = process.argv[3] ?? "./site-dump";
const MIN_DELAY_MS = 1200;
const MAX_DELAY_MS = 2800;
const MAX_RETRIES = 5;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const origin = new URL(START_URL).origin;

// Rotas que não são páginas de verdade, são redirects funcionais (ex: botão de WhatsApp)
const REDIRECT_ONLY_PATHS = new Set(["/redirecionamento.php"]);

// Renomeações especiais de rota (fora do padrão genérico "remove .php")
const ROUTE_RENAME: Record<string, string> = {
  "/index.php": "/",
  "/politica-de-privacidade.php": "/privacidade/",
  "/equipe.php": "/equipe/",
  "/sobre.php": "/sobre/",
  "/exames.php": "/exames/",
  "/depoimentos.php": "/depoimentos/",
  "/blog.php": "/blog/",
};

// ------------------------- TIPOS -------------------------
type Manifest = {
  pages: Array<{
    url: string;
    local: string;
    title?: string;
    description?: string;
    ogImage?: string;
    canonical?: string;
    jsonLd?: unknown[];
  }>;
  assets: Array<{ url: string; local: string; type: string }>;
  external: Array<Record<string, unknown>>;
  redirects: Array<{ from: string; to: string; status: number }>;
};

const manifest: Manifest = { pages: [], assets: [], external: [], redirects: [] };
const visited = new Set<string>();
const queue: string[] = [START_URL];
const assetSeen = new Set<string>();

// ------------------------- FETCH COM RATE LIMIT -------------------------
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function jitterDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

async function politeFetch(url: string, init: RequestInit = {}, attempt = 0): Promise<Response> {
  await sleep(jitterDelay());
  const res = await fetch(url, {
    ...init,
    redirect: init.redirect ?? "follow",
    headers: {
      "User-Agent": USER_AGENT,
      "Accept-Language": "pt-BR,pt;q=0.9",
      Referer: origin + "/",
      ...(init.headers ?? {}),
    },
  });

  if ((res.status === 409 || res.status === 429 || res.status === 503) && attempt < MAX_RETRIES) {
    const backoff = jitterDelay() * Math.pow(2, attempt + 1);
    console.warn(
      `[retry] ${res.status} em ${url} — aguardando ${(backoff / 1000).toFixed(1)}s (tentativa ${attempt + 1})`
    );
    await sleep(backoff);
    return politeFetch(url, init, attempt + 1);
  }

  return res;
}

// ------------------------- MAPEAMENTO DE ROTAS -------------------------
function toLocalPageInfo(rawUrl: string): { local: string; canonical: string; redirectFrom?: string } {
  const u = new URL(rawUrl);
  const search = u.search;
  const pathname = u.pathname;

  if (pathname === "/blog.php" && u.searchParams.has("id")) {
    const id = u.searchParams.get("id")!;
    return {
      local: path.join("blog", id, "index.html"),
      canonical: `/blog/${id}/`,
      redirectFrom: `${pathname}${search}`,
    };
  }

  const renamed = ROUTE_RENAME[pathname];
  if (renamed) {
    const local = renamed === "/" ? "index.html" : path.join(renamed.replace(/^\/|\/$/g, ""), "index.html");
    return { local, canonical: renamed, redirectFrom: pathname !== renamed ? pathname : undefined };
  }

  if (pathname.endsWith(".php")) {
    const slug = pathname.replace(/^\//, "").replace(/\.php$/, "");
    return { local: path.join(slug, "index.html"), canonical: `/${slug}/`, redirectFrom: pathname };
  }

  const slug = pathname.replace(/^\/|\/$/g, "");
  return { local: slug ? path.join(slug, "index.html") : "index.html", canonical: pathname };
}

function assetLocalPath(assetUrl: string): { local: string; type: string } {
  const u = new URL(assetUrl);
  const ext = path.extname(u.pathname).toLowerCase().replace(".", "");
  const filename = path.basename(u.pathname);

  const fontExt = ["woff", "woff2", "ttf", "otf"];
  const imageExt = ["jpg", "jpeg", "png", "webp", "avif", "gif", "svg", "ico"];
  const videoExt = ["mp4", "webm"];
  const audioExt = ["mp3"];

  if (u.pathname.endsWith(".css")) return { local: path.join("css", filename), type: "css" };
  if (u.pathname.endsWith(".js")) return { local: path.join("js", filename), type: "js" };
  if (fontExt.includes(ext)) return { local: path.join("assets/fonts", filename), type: "font" };
  if (imageExt.includes(ext)) return { local: path.join("assets/images", filename), type: "image" };
  if (videoExt.includes(ext)) return { local: path.join("assets/videos", filename), type: "video" };
  if (audioExt.includes(ext)) return { local: path.join("assets/audio", filename), type: "audio" };
  return { local: path.join("assets/misc", filename), type: "other" };
}

// ------------------------- DOWNLOAD DE ASSETS -------------------------
async function ensureDir(filePath: string) {
  await mkdir(path.dirname(filePath), { recursive: true });
}

async function downloadAsset(assetUrl: string) {
  if (assetSeen.has(assetUrl)) return;
  assetSeen.add(assetUrl);

  const { local, type } = assetLocalPath(assetUrl);
  const outPath = path.join(OUT_DIR, local);
  if (existsSync(outPath)) {
    manifest.assets.push({ url: assetUrl, local, type });
    return;
  }

  try {
    const res = await politeFetch(assetUrl);
    if (!res.ok) {
      console.warn(`[asset] falhou (${res.status}): ${assetUrl}`);
      return;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await ensureDir(outPath);
    await writeFile(outPath, buf);
    manifest.assets.push({ url: assetUrl, local, type });

    // Gera versão .webp mantendo o original (permite <picture> com fallback)
    if (type === "image" && /\.(jpe?g|png)$/i.test(outPath)) {
      const webpPath = outPath.replace(/\.(jpe?g|png)$/i, ".webp");
      await sharp(buf)
        .webp({ quality: 82 })
        .toFile(webpPath)
        .catch((e) => console.warn(`[webp] falhou em ${outPath}: ${e.message}`));
    }
  } catch (e: any) {
    console.warn(`[asset] erro em ${assetUrl}: ${e.message}`);
  }
}

async function extractAndQueueCssAssets(cssUrl: string, cssText: string) {
  const urlRegex = /url\(\s*['"]?([^'")]+)['"]?\s*\)/g;
  let match;
  while ((match = urlRegex.exec(cssText))) {
    const ref = match[1];
    if (ref.startsWith("data:")) continue;
    try {
      const abs = new URL(ref, cssUrl).toString();
      if (new URL(abs).origin === origin) await downloadAsset(abs);
    } catch {}
  }
}

// ------------------------- PROCESSAMENTO DE PÁGINA -------------------------
async function processPage(rawUrl: string) {
  if (visited.has(rawUrl)) return;
  visited.add(rawUrl);

  const u = new URL(rawUrl);

  // /redirecionamento.php: não é página, é o CTA de agendamento (provável link de WhatsApp)
  if (REDIRECT_ONLY_PATHS.has(u.pathname)) {
    const res = await politeFetch(rawUrl, { redirect: "manual" });
    const location = res.headers.get("location");
    manifest.external.push({
      type: location?.includes("wa.me") || location?.includes("whatsapp") ? "whatsapp" : "redirect",
      source: u.pathname + u.search,
      resolvedUrl: location ?? null,
    });
    console.log(`[external] ${u.pathname} -> ${location}`);
    return;
  }

  console.log(`[page] ${rawUrl}`);
  const res = await politeFetch(rawUrl);
  if (!res.ok) {
    console.warn(`[page] falhou (${res.status}): ${rawUrl}`);
    return;
  }
  const html = await res.text();
  const $ = cheerio.load(html);

  const { local, canonical, redirectFrom } = toLocalPageInfo(rawUrl);

  const title = $("title").text().trim();
  const description = $('meta[name="description"]').attr("content");
  const ogImage = $('meta[property="og:image"]').attr("content");
  const canonicalTag = $('link[rel="canonical"]').attr("href");
  const jsonLd = $('script[type="application/ld+json"]')
    .map((_, el) => {
      try {
        return JSON.parse($(el).contents().text());
      } catch {
        return null;
      }
    })
    .get()
    .filter(Boolean);

  manifest.pages.push({ url: rawUrl, local, title, description, ogImage, canonical: canonicalTag, jsonLd });
  if (redirectFrom) manifest.redirects.push({ from: redirectFrom, to: canonical, status: 301 });

  // YouTube + Google Maps via iframe
  $("iframe").each((_, el) => {
    const src = $(el).attr("src") ?? "";
    const yt = src.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
    if (yt) manifest.external.push({ type: "youtube", videoId: yt[1], page: rawUrl });
    if (/google\.com\/maps|maps\.google/.test(src)) {
      manifest.external.push({ type: "google-maps", embedSrc: src, page: rawUrl });
    }
  });

  // Google Maps via link direto ("Abrir Rota no Google Maps")
  $('a[href*="google.com/maps"], a[href*="goo.gl/maps"]').each((_, el) => {
    manifest.external.push({ type: "google-maps", url: $(el).attr("href"), page: rawUrl });
  });

  // Imagens (src + srcset)
  const imgSrcs: string[] = [];
  $("img").each((_, el) => {
    const src = $(el).attr("src");
    if (src) imgSrcs.push(src);
    const srcset = $(el).attr("srcset");
    if (srcset) {
      srcset.split(",").forEach((entry) => {
        const candidate = entry.trim().split(" ")[0];
        if (candidate) imgSrcs.push(candidate);
      });
    }
  });
  for (const src of imgSrcs) {
    try {
      const abs = new URL(src, rawUrl).toString();
      if (new URL(abs).origin === origin) await downloadAsset(abs);
    } catch {}
  }

  // CSS (+ assets referenciados dentro do CSS, ex: background-image)
  const cssHrefs = $('link[rel="stylesheet"]')
    .map((_, el) => $(el).attr("href"))
    .get()
    .filter(Boolean) as string[];
  for (const href of cssHrefs) {
    try {
      const abs = new URL(href, rawUrl).toString();
      if (new URL(abs).origin !== origin) continue;
      await downloadAsset(abs);
      const cssRes = await politeFetch(abs);
      if (cssRes.ok) await extractAndQueueCssAssets(abs, await cssRes.text());
    } catch {}
  }

  // JS
  const jsSrcs = $("script[src]")
    .map((_, el) => $(el).attr("src"))
    .get()
    .filter(Boolean) as string[];
  for (const src of jsSrcs) {
    try {
      const abs = new URL(src, rawUrl).toString();
      if (new URL(abs).origin === origin) await downloadAsset(abs);
    } catch {}
  }

  // Salva o HTML bruto como referência (não é o entregável final, é insumo pra reconstrução)
  const rawOutPath = path.join(OUT_DIR, "pages-raw", local);
  await ensureDir(rawOutPath);
  await writeFile(rawOutPath, html, "utf-8");

  // Descobre novos links internos
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href")!;
    try {
      const abs = new URL(href, rawUrl).toString();
      const absUrl = new URL(abs);
      if (absUrl.origin !== origin) return;
      if (/\.(pdf|jpe?g|png|zip|docx?)$/i.test(absUrl.pathname)) return;
      const clean = abs.split("#")[0];
      if (!visited.has(clean) && !queue.includes(clean)) queue.push(clean);
    } catch {}
  });
}

// ------------------------- MAIN -------------------------
async function main() {
  console.log(`Iniciando crawl de ${START_URL} -> ${OUT_DIR}`);
  await mkdir(OUT_DIR, { recursive: true });

  while (queue.length > 0) {
    const next = queue.shift()!;
    await processPage(next);
  }

  const manifestPath = path.join(OUT_DIR, "manifest.json");
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

  // _redirects para Cloudflare Pages (URLs antigas .php -> rotas novas)
  const redirectsLines = manifest.redirects.map((r) => `${r.from}  ${r.to}  ${r.status}`);
  await writeFile(path.join(OUT_DIR, "_redirects"), redirectsLines.join("\n") + "\n", "utf-8");

  console.log(`\nConcluído.`);
  console.log(
    `Páginas: ${manifest.pages.length} | Assets: ${manifest.assets.length} | Externos: ${manifest.external.length} | Redirects: ${manifest.redirects.length}`
  );
  console.log(`Manifest: ${manifestPath}`);
  console.log(`\nRevise manualmente manifest.json > external — principalmente o item "redirecionamento.php",`);
  console.log(`que é o CTA "Agendar Consulta" do site inteiro (provavelmente um link de WhatsApp).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

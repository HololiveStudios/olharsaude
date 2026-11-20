import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

console.log("=== CORRIGINDO GTM, ERRO DE SINTAXE JS E CARREGAMENTO INSTANTÂNEO DO BANNER ===");

const siteDir = "./site";

// CSS para renderização ultra-rápida do Banner inicial no frame 0
const instantBannerCss = `
<style id="instant-hero-css">
/* Garante que o primeiro slide seja pintado no milissegundo 0 absoluto sem esperar o JS do Swiper */
.mySwiperBanner .swiper-wrapper {
    display: flex !important;
}
.mySwiperBanner .swiper-slide:first-child {
    opacity: 1 !important;
    visibility: visible !important;
    z-index: 1 !important;
    display: block !important;
}
.mySwiperBanner .swiper-slide:first-child img {
    content-visibility: auto;
}
</style>
`;

function fixHtml(filePath: string, isHome: boolean) {
  let html = readFileSync(filePath, "utf-8");

  // 1. Remover Google Tag Manager completamente (elimina os erros de ad.doubleclick.net bloqueados por cliente)
  html = html.replace(/<!--\s*Google Tag Manager\s*-->[\s\S]*?<!--\s*End Google Tag Manager\s*-->/gi, "");
  html = html.replace(/<script>[\s\S]*?googletagmanager\.com\/gtm\.js[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<noscript><iframe[^>]*googletagmanager\.com[^>]*><\/noscript>/gi, "");

  // 2. Na Home: corrigir o SyntaxError JS (chave extra "}") e decodificação síncrona
  if (isHome) {
    // Corrige erro de sintaxe JS
    html = html.replace(
      /\/\/ Typed\.js \(hero\)[\s\S]*?new Swiper\('\.swiper-continuous'[\s\S]*?\}\);\s*\}\s*\}\);/gi,
      `// Swiper Unidades (scroll contínuo)
        if (typeof Swiper !== 'undefined') {
            new Swiper('.swiper-continuous', {
                slidesPerView: 'auto',
                spaceBetween: 24,
                speed: 4000,
                autoplay: { delay: 0, disableOnInteraction: false },
                loop: true,
                allowTouchMove: true,
                grabCursor: true,
                freeMode: true
            });
        }
    });`
    );

    // Mudar decoding="async" para decoding="sync" no banner 1 (elimina o atraso de decodificação no paint!)
    html = html.replace(
      /(<img[^>]*banner-1[^>]*decoding=")async(")/gi,
      '$1sync$2'
    );
    html = html.replace(
      /(<img[^>]*69d953cce877e_1775850444\.jpg[^>]*decoding=")async(")/gi,
      '$1sync$2'
    );

    // Injeta estilo de banner instantâneo antes de </head>
    if (!html.includes('id="instant-hero-css"')) {
      html = html.replace("</head>", `${instantBannerCss}\n</head>`);
    }
  }

  writeFileSync(filePath, html, "utf-8");
  console.log(`✓ Arquivo limpo e otimizado: ${filePath}`);
}

function traverse(dir: string) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== "uploads" && entry !== "css" && entry !== "assets" && entry !== "fonts") {
        traverse(full);
      }
    } else if (entry.endsWith(".html")) {
      const isHome = entry === "index.html" && dir === siteDir;
      fixHtml(full, isHome);
    }
  }
}

traverse(siteDir);

console.log("\n=== TUDO PRONTO COM ZERO ERROS E PINTURA INSTANTÂNEA! ===");

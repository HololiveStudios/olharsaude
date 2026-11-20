import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, copyFileSync } from "fs";
import { join } from "path";

const siteDir = "./site";

// 1. Corrigir fonte no critical.css
const criticalCssPath = join(siteDir, "css", "critical.css");
let criticalCss = readFileSync(criticalCssPath, "utf-8");
criticalCss = criticalCss.replace(
  /src:\s*url\([^)]+\)[^;]*;/g,
  "src: url('/fonts/inter-var-latin.woff2') format('woff2');"
);
writeFileSync(criticalCssPath, criticalCss, "utf-8");
console.log("✓ Fonte atualizada no critical.css");

// 2. Garantir pastas de compatibilidade (/assets/css, /assets/fonts, /assets/js)
mkdirSync(join(siteDir, "assets", "css"), { recursive: true });
mkdirSync(join(siteDir, "assets", "fonts"), { recursive: true });
mkdirSync(join(siteDir, "assets", "js"), { recursive: true });

for (const file of readdirSync(join(siteDir, "css"))) {
  copyFileSync(join(siteDir, "css", file), join(siteDir, "assets", "css", file));
}
for (const file of readdirSync(join(siteDir, "fonts"))) {
  copyFileSync(join(siteDir, "fonts", file), join(siteDir, "assets", "fonts", file));
}
for (const file of readdirSync(join(siteDir, "js"))) {
  copyFileSync(join(siteDir, "js", file), join(siteDir, "assets", "js", file));
}
console.log("✓ Pastas de compatibilidade criadas (/assets/css, /assets/fonts, /assets/js)");

// 3. Inline do critical.css em todos os HTMLs
function processHtmlFiles(dir: string) {
  const entries = readdirSync(dir);
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      if (entry !== "assets") processHtmlFiles(fullPath);
    } else if (entry.endsWith(".html")) {
      let content = readFileSync(fullPath, "utf-8");
      
      // Substitui placeholder de critical css se presente
      if (content.includes("/* critical.css will be inlined here */")) {
        content = content.replace(
          /<style>[\s\S]*?\/\*\s*critical\.css will be inlined here\s*\*\/[\s\S]*?<\/style>/i,
          `<style>\n${criticalCss}\n</style>`
        );
      }

      // Normalizar link preload de fonte para inter-var-latin.woff2
      content = content.replace(
        /<link\s+rel="preload"\s+href="[^"]*inter[^"]*"\s+as="font"[^>]*>/gi,
        '<link rel="preload" href="/fonts/inter-var-latin.woff2" as="font" type="font/woff2" crossorigin>'
      );

      // Normalizar link para main.css se necessário
      content = content.replace(
        /href="\/assets\/css\/main\.css"/g,
        'href="/css/main.css"'
      );

      writeFileSync(fullPath, content, "utf-8");
      console.log(`✓ Inlined & otimizado: ${fullPath}`);
    }
  }
}
processHtmlFiles(siteDir);

// 4. Gerar sitemap.xml
const sitemapPages = [
  { loc: "https://olharsaude.pages.dev/", priority: "1.0", changefreq: "weekly" },
  { loc: "https://olharsaude.pages.dev/sobre/", priority: "0.8", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/exames/", priority: "0.9", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/equipe/", priority: "0.8", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/depoimentos/", priority: "0.7", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/blog/", priority: "0.8", changefreq: "weekly" },
  { loc: "https://olharsaude.pages.dev/blog/6/", priority: "0.7", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/blog/5/", priority: "0.7", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/blog/4/", priority: "0.7", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/blog/3/", priority: "0.7", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/blog/2/", priority: "0.7", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/blog/1/", priority: "0.7", changefreq: "monthly" },
  { loc: "https://olharsaude.pages.dev/privacidade/", priority: "0.5", changefreq: "yearly" }
];

const today = new Date().toISOString().split("T")[0];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPages
  .map(
    (p) => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

writeFileSync(join(siteDir, "sitemap.xml"), sitemapXml, "utf-8");
console.log("✓ sitemap.xml gerado");

// 5. Gerar _redirects
const waUrl = "https://api.whatsapp.com/send/?phone=559820180161&text=Ol%C3%A1%2C+vim+do+site+da+clinica+olhar+sa%C3%BAde%2C+gostaria+de+obter+uma+informacao.&type=phone_number&app_absent=0";

const redirects = [
  `/redirecionamento.php  ${waUrl}  302`,
  `/redirecionamento      ${waUrl}  302`,
  `/index.php             /         301`,
  `/sobre.php             /sobre/    301`,
  `/exames.php            /exames/   301`,
  `/equipe.php            /equipe/   301`,
  `/depoimentos.php       /depoimentos/ 301`,
  `/blog.php              /blog/     301`,
  `/blog.php?id=6         /blog/6/   301`,
  `/blog.php?id=5         /blog/5/   301`,
  `/blog.php?id=4         /blog/4/   301`,
  `/blog.php?id=3         /blog/3/   301`,
  `/blog.php?id=2         /blog/2/   301`,
  `/blog.php?id=1         /blog/1/   301`,
  `/politica-de-privacidade.php /privacidade/ 301`
];

writeFileSync(join(siteDir, "_redirects"), redirects.join("\n") + "\n", "utf-8");
console.log("✓ _redirects gerado com redirecionamento de WhatsApp e SEO 301");

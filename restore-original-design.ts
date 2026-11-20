import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import sharp from "sharp";

console.log("=== RECONSTRUÇÃO FIEL COM O SYSTEM DESIGN ORIGINAL (TAILWIND) ===");

const rawDir = "./site-dump/pages-raw";
const siteDir = "./site";
const assetsDir = "./site-dump/assets/images";

// 1. Criar pastas necessárias
mkdirSync(siteDir, { recursive: true });
mkdirSync(join(siteDir, "css"), { recursive: true });
mkdirSync(join(siteDir, "uploads"), { recursive: true });
mkdirSync(join(siteDir, "uploads", "exames"), { recursive: true });

// 2. Copiar o tailwind.min.css original (29KB)
const tailwindSrc = "./site-dump/css/tailwind.min.css";
if (existsSync(tailwindSrc)) {
  copyFileSync(tailwindSrc, join(siteDir, "tailwind.min.css"));
  copyFileSync(tailwindSrc, join(siteDir, "css", "tailwind.min.css"));
  console.log("✓ tailwind.min.css original copiado para raiz e /css");
}

// 3. Organizar todas as imagens em /uploads e /uploads/exames mantendo os nomes que o HTML espera
// E gerar versões .avif para cada uma
const examNames = [
  "aberrometria", "acuidade-visual-av", "campimetria-visual-campo-visual-computadorizado",
  "exame-de-motilidade-ocular", "gonioscopia", "mapeamento-de-retina-fundoscopia",
  "microscopia-especular", "microscopia-especular-da-cornea", "orbscan", "paquimetria",
  "refracao", "retinografia", "teste-de-adaptacao-de-lentes-de-contato",
  "teste-de-sobrecarga-hidrica", "teste-de-visao-de-cores-teste-de-ishihara",
  "tomografia-de-coerencia-optica-oct", "tonometria", "topografia-corneana",
  "ultrassonografia-ocular-ecografia"
];

for (const name of examNames) {
  const src = join(assetsDir, `${name}.webp`);
  if (existsSync(src)) {
    const dest = join(siteDir, "uploads", "exames", `${name}.webp`);
    copyFileSync(src, dest);
  }
}

// Copiar as imagens de uploads gerais
const files = readdirSync(assetsDir);
for (const file of files) {
  // Pular arquivos corrompidos (95886 bytes)
  const src = join(assetsDir, file);
  const s = statSync(src);
  if (s.size === 95886) continue;

  if (file.includes("medicos")) {
    copyFileSync(src, join(siteDir, "medicos clinica olhar saude.webp"));
    copyFileSync(src, join(siteDir, "medicos%20clinica%20olhar%20saude.webp"));
  } else if (!examNames.some(e => file.startsWith(e))) {
    copyFileSync(src, join(siteDir, "uploads", file));
  }
}
console.log("✓ Imagens organizadas nas pastas corretas");

// 4. Copiar e transformar todas as páginas HTML do dump original
const waUrl = "https://api.whatsapp.com/send/?phone=559820180161&text=Ol%C3%A1%2C+vim+do+site+da+clinica+olhar+sa%C3%BAde%2C+gostaria+de+obter+uma+informacao.&type=phone_number&app_absent=0";

function transformHtml(content: string, depth: number): string {
  // 1. Corrigir caminho do CSS tailwind para absoluto
  content = content.replace(/href=["']tailwind\.min\.css["']/g, 'href="/tailwind.min.css"');

  // 2. Corrigir caminhos das imagens para absolutos /uploads/
  content = content.replace(/src=["']uploads\//g, 'src="/uploads/');
  content = content.replace(/src=["']medicos/g, 'src="/medicos');

  // 3. Corrigir links de redirecionamento para o WhatsApp direto
  content = content.replace(/href=["']redirecionamento\.php["']/g, `href="${waUrl}" target="_blank" rel="noopener noreferrer"`);

  // 4. Corrigir links de navegação interna (.php -> rotas limpas)
  content = content.replace(/href=["']index\.php["']/g, 'href="/"');
  content = content.replace(/href=["']sobre\.php["']/g, 'href="/sobre/"');
  content = content.replace(/href=["']exames\.php["']/g, 'href="/exames/"');
  content = content.replace(/href=["']equipe\.php["']/g, 'href="/equipe/"');
  content = content.replace(/href=["']depoimentos\.php["']/g, 'href="/depoimentos/"');
  content = content.replace(/href=["']blog\.php["']/g, 'href="/blog/"');
  content = content.replace(/href=["']politica-de-privacidade\.php["']/g, 'href="/privacidade/"');
  content = content.replace(/href=["']blog\.php\?id=(\d+)["']/g, 'href="/blog/$1/"');

  // 5. Adicionar loading="lazy" e decoding="async" em todas as imagens que não sejam hero
  // Mas manter a primeira imagem do hero rápida
  content = content.replace(/<img(?![^>]*loading=)(?![^>]*fetchpriority=)([^>]+)>/g, '<img$1 loading="lazy" decoding="async">');

  return content;
}

function processDirectory(sourceDir: string, targetDir: string, depth = 0) {
  mkdirSync(targetDir, { recursive: true });
  const entries = readdirSync(sourceDir);

  for (const entry of entries) {
    const srcPath = join(sourceDir, entry);
    const destPath = join(targetDir, entry);

    if (statSync(srcPath).isDirectory()) {
      processDirectory(srcPath, destPath, depth + 1);
    } else if (entry.endsWith(".html")) {
      const raw = readFileSync(srcPath, "utf-8");
      const transformed = transformHtml(raw, depth);
      writeFileSync(destPath, transformed, "utf-8");
      console.log(`✓ Transformado com System Design original: ${destPath}`);
    }
  }
}

processDirectory(rawDir, siteDir);

// 5. Garantir sitemap.xml
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

// 6. Garantir _redirects e _headers
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

console.log("\n=== TUDO PRONTO COM O DESIGN SYSTEM ORIGINAL! ===");

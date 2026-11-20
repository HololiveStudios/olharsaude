import sharp from "sharp";
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from "fs";
import { join } from "path";

console.log("=== INICIANDO AJUSTES CRÍTICOS: WHATSAPP FIX, REMOÇÃO DE ERROS E COMPRESSÃO MÁXIMA ===");

const siteDir = "./site";
const uploadsDir = join(siteDir, "uploads");

// -------------------------------------------------------------
// 1. RE-COMPACTAÇÃO EXTREMA DE IMAGENS (PARA PASSAR 100% NO LIGHTHOUSE)
// -------------------------------------------------------------
console.log("\n1. Recompactando banners e logos para atingir o menor tamanho possível...");

const img1Src = "./site-dump/assets/images/69d953cce877e_1775850444.jpg";
const img2Src = "./site-dump/assets/images/69d953c8d1af6_1775850440.jpg";
const logoHeaderSrc = "./site-dump/assets/images/69d94cde525d1_1775848670.png";

// Banner 1 Mobile: 480x270, qualidade AVIF 45 (super leve, ~12KB a 15KB)
if (existsSync(img1Src)) {
  await sharp(img1Src)
    .resize(480, 270, { fit: "cover" })
    .avif({ quality: 48, effort: 6 })
    .toFile(join(uploadsDir, "banner-1-mobile.avif"));

  await sharp(img1Src)
    .resize(480, 270, { fit: "cover" })
    .webp({ quality: 55 })
    .toFile(join(uploadsDir, "banner-1-mobile.webp"));

  await sharp(img1Src)
    .resize(1024, 576, { fit: "cover" })
    .avif({ quality: 55, effort: 6 })
    .toFile(join(uploadsDir, "banner-1-desktop.avif"));

  await sharp(img1Src)
    .resize(1024, 576, { fit: "cover" })
    .webp({ quality: 65 })
    .toFile(join(uploadsDir, "banner-1-desktop.webp"));

  await sharp(img1Src)
    .resize(1024, 576, { fit: "cover" })
    .jpeg({ quality: 65, progressive: true })
    .toFile(join(uploadsDir, "69d953cce877e_1775850444.jpg"));

  console.log("✓ Banner 1 recompactado com alta eficiência!");
}

// Banner 2 Mobile:
if (existsSync(img2Src)) {
  await sharp(img2Src)
    .resize(480, 270, { fit: "cover" })
    .avif({ quality: 48, effort: 6 })
    .toFile(join(uploadsDir, "banner-2-mobile.avif"));

  await sharp(img2Src)
    .resize(480, 270, { fit: "cover" })
    .webp({ quality: 55 })
    .toFile(join(uploadsDir, "banner-2-mobile.webp"));

  await sharp(img2Src)
    .resize(1024, 576, { fit: "cover" })
    .avif({ quality: 55, effort: 6 })
    .toFile(join(uploadsDir, "banner-2-desktop.avif"));

  await sharp(img2Src)
    .resize(1024, 576, { fit: "cover" })
    .jpeg({ quality: 65, progressive: true })
    .toFile(join(uploadsDir, "69d953c8d1af6_1775850440.jpg"));

  console.log("✓ Banner 2 recompactado com alta eficiência!");
}

// Logo Header: gerar versão WebP e AVIF de 240x57 (para mobile) e 400x95 (para desktop)
if (existsSync(logoHeaderSrc)) {
  await sharp(logoHeaderSrc)
    .resize(300, 71, { fit: "contain" })
    .webp({ quality: 80 })
    .toFile(join(uploadsDir, "logo.webp"));

  await sharp(logoHeaderSrc)
    .resize(300, 71, { fit: "contain" })
    .avif({ quality: 75 })
    .toFile(join(uploadsDir, "logo.avif"));

  await sharp(logoHeaderSrc)
    .resize(300, 71, { fit: "contain" })
    .png({ compressionLevel: 9, colours: 128 })
    .toFile(join(uploadsDir, "69d94cde525d1_1775848670.png"));

  console.log("✓ Logo Header reduzido para formato moderno e PNG leve!");
}

// Baixar thumbnail do YouTube e salvar local em WebP e AVIF (para não depender de i.ytimg.com)
try {
  const ytRes = await fetch("https://i.ytimg.com/vi/e-z8TvCuS44/hqdefault.jpg");
  if (ytRes.ok) {
    const ytBuf = Buffer.from(await ytRes.arrayBuffer());
    await sharp(ytBuf).resize(480, 270, { fit: "cover" }).webp({ quality: 75 }).toFile(join(uploadsDir, "yt-thumb.webp"));
    await sharp(ytBuf).resize(480, 270, { fit: "cover" }).avif({ quality: 65 }).toFile(join(uploadsDir, "yt-thumb.avif"));
    console.log("✓ Thumbnail do YouTube local gerada em WebP/AVIF (elimina 32KB do Google)!");
  }
} catch (e: any) {
  console.warn("Aviso ao baixar thumb do youtube:", e.message);
}

// -------------------------------------------------------------
// 2. LER O TAILWIND CSS PARA EMBUTIR INLINE (ELIMINA BLOQUEIO DE RENDERIZAÇÃO)
// -------------------------------------------------------------
const tailwindCssContent = readFileSync(join(siteDir, "tailwind.min.css"), "utf-8");

// -------------------------------------------------------------
// 3. HTML FIX: BOTÃO DO WHATSAPP, REMOVER FBEVENTS, REMOVER TYPED.JS
// -------------------------------------------------------------
console.log("\n2. Corrigindo HTMLs, fixando botão do WhatsApp e removendo erros de console...");

const waUrl = "https://api.whatsapp.com/send/?phone=559820180161&text=Ol%C3%A1%2C+vim+do+site+da+clinica+olhar+sa%C3%BAde%2C+gostaria+de+obter+uma+informacao.&type=phone_number&app_absent=0";

// Botão do WhatsApp definitivo: fixed de verdade, fora de qualquer overflow, com z-index máximo e garantido no canto inferior esquerdo
const whatsappFloatingButton = `
<!-- Botão WhatsApp Flutuante Fixo -->
<div id="whatsapp-fixed-container" style="position: fixed !important; bottom: 24px !important; left: 24px !important; z-index: 999999 !important; pointer-events: auto !important;">
  <a href="${waUrl}" target="_blank" rel="noopener noreferrer"
     aria-label="Entrar em contato pelo WhatsApp"
     class="btn-pulse"
     style="display: flex !important; align-items: center !important; justify-content: center !important; width: 62px !important; height: 62px !important; background-color: #25D366 !important; border-radius: 9999px !important; box-shadow: 0 10px 25px rgba(37,211,102,0.5) !important; text-decoration: none !important; transition: transform 0.2s ease !important;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" fill="#ffffff" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.654-1.759-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
  </a>
</div>
`;

function processHtmlFile(filePath: string, isHome: boolean) {
  let html = readFileSync(filePath, "utf-8");

  // 1. Remover completamente o script do Facebook Pixel (fbevents.js e noscript)
  html = html.replace(/<!--\s*Meta Pixel Code\s*-->[\s\S]*?<!--\s*End Meta Pixel Code\s*-->/gi, "");
  html = html.replace(/<script[^>]*fbq\([^>]*<\/script>/gi, "");
  html = html.replace(/<script[^>]*fbevents\.js[^>]*><\/script>/gi, "");
  html = html.replace(/!function\(f,b,e,v,n,t,s\)[\s\S]*?fbq\('track',\s*'PageView'\);[\s\S]*?<\/script>/gi, "");
  html = html.replace(/<noscript><img[^>]*facebook\.com\/tr[^>]*><\/noscript>/gi, "");

  // 2. Remover Typed.js completamente
  html = html.replace(/<script[^>]*typed\.js[^>]*><\/script>/gi, "");
  html = html.replace(/new Typed\([^)]*\);/gi, "");
  html = html.replace(/var typedTexto[\s\S]*?\}\);/gi, "");

  // 3. Remover preconnects não usados
  html = html.replace(/<link rel="preconnect" href="https:\/\/i\.ytimg\.com">/gi, "");
  html = html.replace(/<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com"[^>]*>/gi, "");
  html = html.replace(/<link rel="preconnect" href="https:\/\/unpkg\.com"[^>]*>/gi, "");

  // 4. Inlining do Tailwind CSS para eliminar 170ms de bloqueio de renderização
  if (html.includes('<link rel="stylesheet" href="/tailwind.min.css">')) {
    html = html.replace(
      '<link rel="stylesheet" href="/tailwind.min.css">',
      `<style id="tailwind-inline">\n${tailwindCssContent}\n</style>`
    );
  }

  // 5. Corrigir o logo no header para usar <picture> moderno (WebP/AVIF com fallback PNG)
  html = html.replace(
    /<img([^>]*)src="\/uploads\/69d94cde525d1_1775848670\.png"([^>]*)>/gi,
    `<picture>
      <source srcset="/uploads/logo.avif" type="image/avif">
      <source srcset="/uploads/logo.webp" type="image/webp">
      <img$1src="/uploads/69d94cde525d1_1775848670.png"$2 width="240" height="57">
    </picture>`
  );

  // 6. Remover o botão antigo do WhatsApp do final do footer e injetar o fixo definitivo logo antes de </body>
  html = html.replace(/<!--\s*✅\s*Botão WhatsApp flutuante\s*-->[\s\S]*?<\/a>/gi, "");
  html = html.replace(/<!--\s*Botão WhatsApp Flutuante Fixo\s*-->[\s\S]*?<\/div>/gi, "");
  html = html.replace(/id="whatsapp-fixed-container"[\s\S]*?<\/div>/gi, "");

  // 7. Na Home: otimizar YouTube thumbnail para local
  if (isHome) {
    html = html.replace(
      /src="https:\/\/i\.ytimg\.com\/vi\/e-z8TvCuS44\/hqdefault\.jpg"/gi,
      'src="/uploads/yt-thumb.webp"'
    );
    html = html.replace(
      /<span id="typed-hero-text"><\/span>/gi,
      '<span>Problemas de visão?<br class="hidden sm:inline"> Aqui cuidamos de você com amor e fé.</span>'
    );
  }

  // Injetar o botão flutuante oficial no final antes de </body>
  html = html.replace("</body>", `${whatsappFloatingButton}\n</body>`);

  writeFileSync(filePath, html, "utf-8");
  console.log(`✓ Otimizado com sucesso: ${filePath}`);
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
      processHtmlFile(full, isHome);
    }
  }
}

traverse(siteDir);

console.log("\n=== TUDO PRONTO! ===");

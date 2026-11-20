import sharp from "sharp";
import { readFileSync, copyFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

console.log("=== REFINANDO LOGO CIRCULAR OFICIAL (ZERO ARTEFATOS / ZERO CORTES) ===");

const inputPath = "C:/Users/Carlos/.gemini/antigravity/brain/ae6660e7-6730-452e-94b6-eb1f7c517c7e/.user_uploaded/media_1790543295751.png";
const artifactDir = "C:/Users/Carlos/.gemini/antigravity/brain/ae6660e7-6730-452e-94b6-eb1f7c517c7e";
const siteDir = "./site";

// 1. Carregar a imagem original (180x180)
const original = sharp(inputPath);

// 2. Fazer crop exato e perfeitamente centralizado em (90, 90) de 92x92
const cropped = await original
  .extract({ left: 44, top: 44, width: 92, height: 92 })
  .toBuffer();

// 3. Tornar o fundo branco do símbolo transparente com transição suave nos contornos
const { data, info } = await sharp(cropped).raw().toBuffer({ resolveWithObject: true });
const cleanData = Buffer.from(data);
for (let i = 0; i < cleanData.length; i += 4) {
  const r = cleanData[i];
  const g = cleanData[i + 1];
  const b = cleanData[i + 2];

  if (r > 245 && g > 245 && b > 245) {
    cleanData[i + 3] = 0;
  } else if (r > 220 && g > 220 && b > 220) {
    const maxDiff = Math.max(255 - r, 255 - g, 255 - b);
    cleanData[i + 3] = Math.min(255, Math.round(maxDiff * 7.5));
  }
}

// 4. Redimensionar o símbolo com background TRANSPARENTE garantido (evita faixas pretas)
const symbolSize = 470;
const transparentSymbol = await sharp(cleanData, {
  raw: { width: info.width, height: info.height, channels: 4 }
})
  .resize(symbolSize, symbolSize, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 0 },
    kernel: "lanczos3"
  })
  .png()
  .toBuffer();

const canvasSize = 512;
const cx = 256;
const cy = 256;
const circleRadius = 252; // Círculo quase encostando na borda (252 de 256 = 98.4% da área), sem clip de antialiasing

// 5. Círculo branco vetorial de alta definição
const circleSvg = `
<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${circleRadius}" fill="#ffffff"/>
</svg>
`;

// Máscara perfeitamente circular dest-in para eliminar 100% de qualquer pixel excedente
const maskSvg = `
<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${circleRadius}" fill="#ffffff"/>
</svg>
`;

const symbolOffset = Math.round((canvasSize - symbolSize) / 2);

// Composição: Círculo Branco + Símbolo do Olho
const composed = await sharp(Buffer.from(circleSvg))
  .composite([
    {
      input: transparentSymbol,
      top: symbolOffset,
      left: symbolOffset
    }
  ])
  .png()
  .toBuffer();

// Aplicação de máscara circular dest-in
const finalImageBuffer = await sharp(composed)
  .composite([
    {
      input: Buffer.from(maskSvg),
      blend: "dest-in"
    }
  ])
  .png()
  .toBuffer();

const outputLogoPath = join(siteDir, "logo-circular.png");
const artifactLogoPath = join(artifactDir, "logo-circular.png");

await sharp(finalImageBuffer).toFile(outputLogoPath);
copyFileSync(outputLogoPath, artifactLogoPath);
console.log("✓ Logo circular aperfeiçoada salva em:", outputLogoPath);

// 6. Atualizar todos os favicons e ícones da aplicação web
console.log("Atualizando favicons e ícones PWA...");
await sharp(finalImageBuffer).resize(16, 16).png().toFile(join(siteDir, "favicon-16x16.png"));
await sharp(finalImageBuffer).resize(32, 32).png().toFile(join(siteDir, "favicon-32x32.png"));
await sharp(finalImageBuffer).resize(48, 48).png().toFile(join(siteDir, "favicon.png"));
await sharp(finalImageBuffer).resize(48, 48).toFile(join(siteDir, "favicon.ico"));
await sharp(finalImageBuffer).resize(180, 180).png().toFile(join(siteDir, "apple-touch-icon.png"));
await sharp(finalImageBuffer).resize(192, 192).png().toFile(join(siteDir, "android-chrome-192x192.png"));
await sharp(finalImageBuffer).resize(512, 512).png().toFile(join(siteDir, "android-chrome-512x512.png"));
console.log("✓ Favicons atualizados!");

// 7. Atualizar imagem oficial de compartilhamento (Open Graph para WhatsApp e Google)
const ogCanvasWidth = 1200;
const ogCanvasHeight = 630;

const ogBackgroundSvg = `
<svg width="${ogCanvasWidth}" height="${ogCanvasHeight}" viewBox="0 0 ${ogCanvasWidth} ${ogCanvasHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f1e40"/>
      <stop offset="50%" stop-color="#1b3668"/>
      <stop offset="100%" stop-color="#12254a"/>
    </linearGradient>
  </defs>
  <rect width="${ogCanvasWidth}" height="${ogCanvasHeight}" fill="url(#bg)"/>
  <circle cx="1000" cy="180" r="300" fill="rgba(64,151,157,0.12)"/>
  <circle cx="180" cy="480" r="220" fill="rgba(64,151,157,0.08)"/>
  
  <text x="600" y="420" font-family="system-ui, -apple-system, sans-serif" font-size="52" font-weight="bold" fill="#ffffff" text-anchor="middle">
    Clínica Olhar Saúde
  </text>
  <text x="600" y="475" font-family="system-ui, -apple-system, sans-serif" font-size="26" font-weight="500" fill="#40979d" text-anchor="middle">
    Referência em Oftalmologia no Maranhão
  </text>
  <text x="600" y="530" font-family="system-ui, -apple-system, sans-serif" font-size="20" fill="#94a3b8" text-anchor="middle">
    Consultas • 19 Exames Especializados • Cirurgias Oculares
  </text>
</svg>
`;

const ogLogoResized = await sharp(finalImageBuffer)
  .resize(230, 230, { fit: "contain" })
  .toBuffer();

await sharp(Buffer.from(ogBackgroundSvg))
  .composite([
    {
      input: ogLogoResized,
      top: 130,
      left: Math.round((ogCanvasWidth - 230) / 2)
    }
  ])
  .jpeg({ quality: 92 })
  .toFile(join(siteDir, "og-image.jpg"));

copyFileSync(join(siteDir, "og-image.jpg"), join(siteDir, "og-image.png"));
console.log("✓ Open Graph imagem (og-image.jpg / og-image.png) atualizada!");

// 8. Limpar arquivos temporários
const tempFiles = [
  "./site/test-logo-420.png",
  "./site/test-logo-450.png",
  "./site/test-logo-470.png",
  "./site/test-preview-dark.png"
];
for (const f of tempFiles) {
  if (existsSync(f)) {
    unlinkSync(f);
  }
}

console.log("=== TUDO PRONTO COM PERFEIÇÃO! ===");

import sharp from "sharp";
import { readFileSync, copyFileSync } from "fs";
import { join } from "path";

console.log("=== CRIANDO LOGO CIRCULAR (FUNDO TRANSPARENTE + CÍRCULO BRANCO + SÍMBOLO GRANDE SEM MARGEM) ===");

const inputPath = "C:/Users/Carlos/.gemini/antigravity/brain/ae6660e7-6730-452e-94b6-eb1f7c517c7e/.user_uploaded/media_1790543295751.png";
const artifactDir = "C:/Users/Carlos/.gemini/antigravity/brain/ae6660e7-6730-452e-94b6-eb1f7c517c7e";
const siteDir = "./site";

// 1. Carregar os pixels brutos da imagem original
const { data, info } = await sharp(inputPath).raw().toBuffer({ resolveWithObject: true });

// 2. Tornar o fundo branco transparente preservando as cores e o antialiasing do olho
const transparentData = Buffer.from(data);
for (let i = 0; i < transparentData.length; i += 4) {
  const r = transparentData[i];
  const g = transparentData[i + 1];
  const b = transparentData[i + 2];

  if (r > 240 && g > 240 && b > 240) {
    transparentData[i + 3] = 0; // Transparente
  } else if (r > 215 && g > 215 && b > 215) {
    const diff = Math.min(255 - r, 255 - g, 255 - b);
    transparentData[i + 3] = Math.min(255, Math.round(diff * 5));
  }
}

// 3. Recortar exatamente o símbolo do olho com as duas mãos (eliminando as bordas brancas vazias originais)
const croppedSymbol = await sharp(transparentData, {
  raw: { width: info.width, height: info.height, channels: 4 }
})
  .extract({ left: 47, top: 46, width: 86, height: 88 })
  .png()
  .toBuffer();

// 4. Montar a imagem de alta definição (512x512)
// O círculo branco tem diâmetro de 512px (encosta perfeitamente nas bordas da imagem, sem margem externa!)
// O fundo fora do círculo é 100% transparente.
const canvasSize = 512;
const circleRadius = canvasSize / 2;

const circleSvg = `
<svg width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${circleRadius}" cy="${circleRadius}" r="${circleRadius}" fill="#ffffff"/>
</svg>
`;

// O símbolo do olho é dimensionado para preencher ao máximo o círculo (460x460 dentro de 512x512)
// mantendo proporção e quase encostando na borda do círculo como o usuário pediu ("sem margem tanto da logo pro círculo quanto do círculo pro limite da imagem")
const symbolSize = 465;
const resizedSymbol = await sharp(croppedSymbol)
  .resize(symbolSize, symbolSize, { fit: "contain", kernel: "lanczos3" })
  .toBuffer();

const symbolOffset = Math.round((canvasSize - symbolSize) / 2);

const outputLogoPath = join(siteDir, "logo-circular.png");
const artifactLogoPath = join(artifactDir, "logo-circular.png");

// Compor círculo branco sobre tela transparente + símbolo do olho grande
await sharp(Buffer.from(circleSvg))
  .composite([
    {
      input: resizedSymbol,
      top: symbolOffset,
      left: symbolOffset
    }
  ])
  .png()
  .toFile(outputLogoPath);

// Copiar para a pasta de artefatos
copyFileSync(outputLogoPath, artifactLogoPath);
console.log("✓ Logo circular gerada em:", outputLogoPath);

// 5. Atualizar os Favicons e ícones da página com a nova logo circular
console.log("\n5. Atualizando todos os favicons e ícones da página com a nova logo circular...");

const circleLogoBuffer = readFileSync(outputLogoPath);

await sharp(circleLogoBuffer).resize(16, 16).png().toFile(join(siteDir, "favicon-16x16.png"));
await sharp(circleLogoBuffer).resize(32, 32).png().toFile(join(siteDir, "favicon-32x32.png"));
await sharp(circleLogoBuffer).resize(48, 48).png().toFile(join(siteDir, "favicon.png"));
await sharp(circleLogoBuffer).resize(48, 48).toFile(join(siteDir, "favicon.ico"));
await sharp(circleLogoBuffer).resize(180, 180).png().toFile(join(siteDir, "apple-touch-icon.png"));
await sharp(circleLogoBuffer).resize(192, 192).png().toFile(join(siteDir, "android-chrome-192x192.png"));
await sharp(circleLogoBuffer).resize(512, 512).png().toFile(join(siteDir, "android-chrome-512x512.png"));

// 6. Atualizar a imagem oficial de compartilhamento (WhatsApp, Google, Facebook)
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

const ogLogoResized = await sharp(circleLogoBuffer)
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
console.log("✓ Imagem de compartilhamento (WhatsApp / Google) atualizada com o novo logo circular!");

console.log("\n=== TUDO CONCLUÍDO COM SUCESSO! ===");

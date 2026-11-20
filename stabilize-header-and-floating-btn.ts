import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

console.log("=== BLINDANDO HEADER E BOTÃO DO WHATSAPP CONTRA FLICKERING E DESAPARECIMENTO NO SCROLL ===");

const siteDir = "./site";

// CSS de Aceleração por Hardware e Estabilidade Absoluta de Header e Botão Fixo
const hardwareFixedCss = `
<style id="hardware-acceleration-fix">
/* Garante que Header e Botão Flutuante fiquem permanentemente visíveis na GPU sem piscar nem sumir */
header, .site-header {
    position: sticky !important;
    top: 0 !important;
    z-index: 1000 !important;
    transform: translateZ(0) !important;
    -webkit-transform: translateZ(0) !important;
    will-change: transform !important;
    backface-visibility: hidden !important;
    -webkit-backface-visibility: hidden !important;
    transition: none !important; /* Elimina o pulo/salto quando a barra de endereço do celular recolhe */
    background-color: rgba(255, 255, 255, 0.98) !important; /* Fundo sólido e leve: elimina o cálculo pesado de backdrop-filter que fazia sumir */
}

#whatsapp-fixed-container {
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    left: auto !important;
    z-index: 999999 !important;
    transform: translateZ(0) !important;
    -webkit-transform: translateZ(0) !important;
    will-change: transform !important;
    backface-visibility: hidden !important;
    -webkit-backface-visibility: hidden !important;
    pointer-events: auto !important;
}

/* Evita que o scroll mobile quebre a posição dos elementos fixos */
html, body {
    overflow-x: clip !important;
    -webkit-overflow-scrolling: touch !important;
}
</style>
`;

function stabilizeHtml(filePath: string) {
  let html = readFileSync(filePath, "utf-8");

  // Injetar o CSS de aceleração de hardware no <head>
  if (!html.includes('id="hardware-acceleration-fix"')) {
    html = html.replace("</head>", `${hardwareFixedCss}\n</head>`);
  } else {
    html = html.replace(/<style id="hardware-acceleration-fix">[\s\S]*?<\/style>/i, hardwareFixedCss);
  }

  // Remover transition-all duration-300 do header
  html = html.replace(
    /(<header[^>]*class="[^"]*)transition-all duration-300([^"]*")/gi,
    '$1$2'
  );

  // Garantir que o container do WhatsApp tenha os estilos de aceleração inline
  html = html.replace(
    /id="whatsapp-fixed-container"[^>]*>/gi,
    'id="whatsapp-fixed-container" style="position: fixed !important; bottom: 20px !important; right: 20px !important; left: auto !important; z-index: 999999 !important; transform: translateZ(0) !important; -webkit-transform: translateZ(0) !important; will-change: transform !important; pointer-events: auto !important;">'
  );

  writeFileSync(filePath, html, "utf-8");
  console.log(`✓ Estabilizado: ${filePath}`);
}

function traverse(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!['uploads','css','assets','fonts'].includes(entry)) {
        traverse(full);
      }
    } else if (entry.endsWith(".html")) {
      stabilizeHtml(full);
    }
  }
}

traverse(siteDir);

console.log("\n=== HEADER E BOTÃO DO WHATSAPP 100% BLINDADOS NA GPU! ===");

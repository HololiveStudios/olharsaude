import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

console.log("=== RESOLVENDO ROLAGEM MOBILE (SCROLL JANK) E APLICANDO FOOTER ULTRA-COMPACTO ===");

const siteDir = "./site";
const waUrl = "https://api.whatsapp.com/send/?phone=559820180161&text=Ol%C3%A1%2C+vim+do+site+da+clinica+olhar+sa%C3%BAde%2C+gostaria+de+obter+uma+informacao.&type=phone_number&app_absent=0";

// 1. NOVO FOOTER ULTRA-COMPACTO (MINIMALISTA, ELEGANTE E SUPER CURTO NO MOBILE)
const ultraCompactFooter = `
<footer style="background:#12254a;" class="text-slate-300 py-6 px-4 border-t border-white/10">
  <div style="max-width:80rem; margin:0 auto; display:flex; flex-direction:column; gap:1rem;">
    
    <!-- Linha Principal: Logo, Links em Linha e Contato -->
    <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem;">
      <!-- Logo -->
      <a href="/" style="display:flex; align-items:center;" aria-label="Clínica Olhar Saúde">
        <img src="/uploads/69d950e4ba052_1775849700.png"
             alt="Clínica Olhar Saúde" width="150" height="35"
             style="height:32px; width:auto; object-fit:contain;" loading="lazy">
      </a>

      <!-- Links Rápidos em Linha Única -->
      <nav style="display:flex; flex-wrap:wrap; justify-content:center; gap:0.75rem 1.25rem; font-size:0.8rem;">
        <a href="/" style="color:#cbd5e1; text-decoration:none;">Início</a>
        <a href="/sobre/" style="color:#cbd5e1; text-decoration:none;">Sobre</a>
        <a href="/exames/" style="color:#cbd5e1; text-decoration:none;">Exames</a>
        <a href="/equipe/" style="color:#cbd5e1; text-decoration:none;">Equipe</a>
        <a href="/depoimentos/" style="color:#cbd5e1; text-decoration:none;">Depoimentos</a>
        <a href="/blog/" style="color:#cbd5e1; text-decoration:none;">Blog</a>
        <a href="/privacidade/" style="color:#cbd5e1; text-decoration:none;">Privacidade</a>
      </nav>

      <!-- Central de Atendimento -->
      <div style="display:flex; align-items:center; gap:0.75rem; font-size:0.8rem;">
        <a href="tel:9820180161" style="color:#ffffff; font-weight:700; text-decoration:none; display:flex; align-items:center; gap:0.35rem;">
          <span style="color:#40979d;">📞</span> (98) 2018-0161
        </a>
        <a href="${waUrl}" target="_blank" rel="noopener noreferrer"
           style="background:#40979d; color:#ffffff; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; padding:0.4rem 0.9rem; border-radius:9999px; text-decoration:none;">
          WhatsApp
        </a>
      </div>
    </div>

    <!-- Linha Secundária: Dados Legais e Copyright em Linha Discreta -->
    <div style="border-top:1px solid rgba(255,255,255,0.06); padding-top:0.75rem; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:0.5rem; font-size:0.72rem; color:#94a3b8;">
      <p style="margin:0;">
        Dr. Álvaro Bruno Botentuit (CRM 6778 RQE 3277) • CNPJ: 25.136.323/0002-19 • Unidades: Ponta D'Areia, Pinheiro, Anjo da Guarda, Rosário e Maiobão
      </p>
      <p style="margin:0; color:#64748b;">
        &copy; 2026 Clínica Olhar Saúde. Todos os direitos reservados.
      </p>
    </div>

  </div>
</footer>
`;

// 2. CSS PARA ROLAGEM 100% FLUIDA E NATIVA NO MOBILE (SEM TRAVAMENTOS)
const fluidScrollCss = `
<style id="fluid-scroll-fix">
/* Garante física nativa de 120Hz em iOS e Android sem engasgos */
html {
    -webkit-overflow-scrolling: touch !important;
    scroll-behavior: auto !important; /* Desativa smooth forçado que causa lag no toque mobile */
}

body {
    -webkit-overflow-scrolling: touch !important;
    overflow-x: hidden !important;
    overscroll-behavior-y: auto !important;
}

/* touch-action pan-y garante que carrosséis NUNCA bloqueiem a rolagem vertical da página */
.swiper, .swiper-wrapper, .swiper-slide, .swiper-continuous {
    touch-action: pan-y !important;
}

/* Scroll snap suave e sem lag */
.swiper-continuous {
    touch-action: pan-y !important;
    -webkit-user-select: none;
    user-select: none;
}
</style>
`;

// 3. SCRIPT OTIMIZADO DO SWIPER COM LIBERAÇÃO DE TOQUE VERTICAL
const swiperConfigFix = `
        // Swiper Unidades com rolagem vertical livre (touch-action pan-y)
        if (typeof Swiper !== 'undefined') {
            new Swiper('.swiper-continuous', {
                slidesPerView: 'auto',
                spaceBetween: 20,
                speed: 3500,
                autoplay: { delay: 1500, disableOnInteraction: false, pauseOnMouseEnter: true },
                loop: true,
                allowTouchMove: true,
                touchReleaseOnEdges: true,
                touchAngle: 35, // Permite rolagem vertical livre mesmo se o dedo estiver sobre o carrossel
                grabCursor: true
            });
        }
`;

function processFile(filePath: string, isHome: boolean) {
  let html = readFileSync(filePath, "utf-8");

  // A. Substituir footer pelo novo Ultra-Compacto
  html = html.replace(/<footer[\s\S]*?<\/footer>/i, ultraCompactFooter);

  // B. Injetar correção de rolagem no <head>
  if (!html.includes('id="fluid-scroll-fix"')) {
    html = html.replace("</head>", `${fluidScrollCss}\n</head>`);
  } else {
    html = html.replace(/<style id="fluid-scroll-fix">[\s\S]*?<\/style>/i, fluidScrollCss);
  }

  // C. Remover classes ou estilos que possam travar o scroll vertical
  html = html.replace(/scroll-behavior:\s*smooth\s*;/gi, "/* scroll-behavior: auto */");

  // D. Na Home, atualizar a configuração do Swiper para não sequestrar o touch vertical
  if (isHome) {
    html = html.replace(
      /\/\/\s*Swiper Unidades[\s\S]*?new Swiper\('\.swiper-continuous'[\s\S]*?\}\);/gi,
      swiperConfigFix
    );
  }

  writeFileSync(filePath, html, "utf-8");
  console.log(`✓ Otimizado com rolagem fluida e footer ultra-compacto: ${filePath}`);
}

function traverse(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!['uploads','css','assets','fonts'].includes(entry)) {
        traverse(full);
      }
    } else if (entry.endsWith(".html")) {
      const isHome = entry === "index.html" && dir === siteDir;
      processFile(full, isHome);
    }
  }
}

traverse(siteDir);

console.log("\n=== TUDO PRONTO COM ROLAGEM 100% FLUIDA E FOOTER ULTRA COMPACTO! ===");

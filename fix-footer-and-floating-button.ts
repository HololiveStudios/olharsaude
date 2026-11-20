import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

console.log("=== VERIFICANDO E CORRIGINDO BUGS VISUAIS, FOOTER COMPACTO E BOTÃO WHATSAPP NA DIREITA ===");

const siteDir = "./site";

// Novo Footer Compacto e Moderno para Mobile + Desktop
const waUrl = "https://api.whatsapp.com/send/?phone=559820180161&text=Ol%C3%A1%2C+vim+do+site+da+clinica+olhar+sa%C3%BAde%2C+gostaria+de+obter+uma+informacao.&type=phone_number&app_absent=0";

const newFooterHtml = `
<footer style="background:#12254a;" class="text-white">
  <!-- Faixa Superior Compacta: Logo + Botão WhatsApp -->
  <div style="border-bottom:1px solid rgba(255,255,255,0.08); padding: 1.25rem 1.5rem;">
    <div style="max-width:80rem; margin:0 auto; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:1rem;">
      <a href="/" style="display:flex; align-items:center;" aria-label="Clínica Olhar Saúde">
        <img src="/uploads/69d950e4ba052_1775849700.png"
             alt="Clínica Olhar Saúde" width="180" height="42"
             style="height:38px; width:auto; object-fit:contain;" loading="lazy">
      </a>
      <a href="${waUrl}" target="_blank" rel="noopener noreferrer"
         style="display:inline-flex; align-items:center; gap:0.5rem; background:#40979d; color:#fff; padding:0.55rem 1.25rem; border-radius:9999px; font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; text-decoration:none; transition:all 0.2s;"
         onmouseover="this.style.background='#1b3668'"
         onmouseout="this.style.background='#40979d'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.654-1.759-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        Agendar Consulta
      </a>
    </div>
  </div>

  <!-- Corpo do Footer: Em mobile vira 2 colunas organizadas (em vez de 1 coluna gigante) -->
  <div style="max-width:80rem; margin:0 auto; padding: 1.5rem 1.5rem 1rem 1.5rem;">
    <div class="footer-grid-layout" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1.5rem;">
      
      <!-- Coluna 1: Contato e Horários -->
      <div style="min-width: 220px;">
        <p style="color:#40979d; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.6rem;">Atendimento</p>
        <p style="color:#cbd5e1; font-size:0.8rem; line-height:1.5; margin-bottom:0.75rem;">
          Referência em oftalmologia no Maranhão com tecnologia de ponta e acolhimento.
        </p>
        <div style="display:flex; flex-direction:column; gap:0.4rem; font-size:0.8rem;">
          <a href="tel:9820180161" style="display:flex; align-items:center; gap:0.5rem; color:#e2e8f0; text-decoration:none;">
            <span style="color:#40979d;">📞</span> <strong>(98) 2018-0161</strong> <span style="font-size:0.7rem; color:#94a3b8;">(Central 24h)</span>
          </a>
          <a href="mailto:sac@clinicaolharsaude.com.br" style="display:flex; align-items:center; gap:0.5rem; color:#e2e8f0; text-decoration:none; font-size:0.78rem;">
            <span style="color:#40979d;">✉️</span> sac@clinicaolharsaude.com.br
          </a>
          <p style="color:#94a3b8; font-size:0.75rem; margin-top:0.25rem;">
            🕒 Seg–Sex: 08h às 17h | Sábado: 08h às 12h
          </p>
        </div>
      </div>

      <!-- Coluna 2: Navegação Rápida -->
      <div>
        <p style="color:#40979d; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.6rem;">Navegação</p>
        <nav style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.8rem;">
          <a href="/" style="color:#cbd5e1; text-decoration:none;">Início</a>
          <a href="/sobre/" style="color:#cbd5e1; text-decoration:none;">Sobre Nós</a>
          <a href="/exames/" style="color:#cbd5e1; text-decoration:none;">Exames</a>
          <a href="/equipe/" style="color:#cbd5e1; text-decoration:none;">Equipe Médica</a>
          <a href="/depoimentos/" style="color:#cbd5e1; text-decoration:none;">Depoimentos</a>
          <a href="/blog/" style="color:#cbd5e1; text-decoration:none;">Blog & Dicas</a>
          <a href="/privacidade/" style="color:#cbd5e1; text-decoration:none;">Privacidade</a>
        </nav>
      </div>

      <!-- Coluna 3: Unidades -->
      <div>
        <p style="color:#40979d; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.6rem;">Unidades</p>
        <div style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.8rem; color:#cbd5e1;">
          <span>📍 Ponta D'Areia</span>
          <span>📍 Pinheiro</span>
          <span>📍 Anjo da Guarda</span>
          <span>📍 Rosário</span>
          <span>📍 Maiobão</span>
        </div>
      </div>

      <!-- Coluna 4: Dados Legais Condensados -->
      <div style="font-size:0.75rem; color:#94a3b8; line-height:1.45;">
        <p style="color:#40979d; font-size:0.72rem; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:0.6rem;">Institucional</p>
        <p style="color:#e2e8f0; font-weight:600; margin-bottom:0.25rem;">Dr. Álvaro Bruno Botentuit</p>
        <p style="color:#cbd5e1; margin-bottom:0.25rem;">CRM 6778 – RQE 3277 (Diretor Técnico)</p>
        <p style="color:#cbd5e1; margin-bottom:0.25rem;">CLINICA SAUDE E VISAO LTDA</p>
        <p style="margin-bottom:0.25rem;">CNPJ: 25.136.323/0002-19</p>
        <p style="font-size:0.72rem; color:#64748b;">Av. 13, 05, Qd 157, Maiobão — Paço do Lumiar, MA</p>
      </div>

    </div>
  </div>

  <!-- Faixa Inferior Compacta de Copyright -->
  <div style="border-top:1px solid rgba(255,255,255,0.06); padding:0.6rem 1.5rem; text-align:center; font-size:0.72rem; color:#64748b;">
    <div style="max-width:80rem; margin:0 auto; display:flex; flex-wrap:wrap; justify-content:space-between; gap:0.5rem;">
      <p>&copy; 2026 Clínica Olhar Saúde. Todos os direitos reservados.</p>
      <p>Cuidando da sua visão com tecnologia e dedicação</p>
    </div>
  </div>
</footer>
`;

// Botão do WhatsApp fixado estritamente no CANTO INFERIOR DIREITO
const newWhatsappFloatingButton = `
<!-- Botão WhatsApp Flutuante Fixo (Canto Inferior Direito) -->
<div id="whatsapp-fixed-container" style="position: fixed !important; bottom: 20px !important; right: 20px !important; left: auto !important; z-index: 999999 !important; pointer-events: auto !important;">
  <a href="${waUrl}" target="_blank" rel="noopener noreferrer"
     aria-label="Agendar consulta pelo WhatsApp"
     class="btn-pulse"
     style="display: flex !important; align-items: center !important; justify-content: center !important; width: 60px !important; height: 60px !important; background-color: #25D366 !important; border-radius: 9999px !important; box-shadow: 0 8px 24px rgba(37,211,102,0.45) !important; text-decoration: none !important; transition: transform 0.2s ease !important;"
     onmouseover="this.style.transform='scale(1.08)'"
     onmouseout="this.style.transform='scale(1)'">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="#ffffff" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.305-.885-.653-1.482-1.46-1.654-1.759-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
  </a>
</div>
`;

function processHtml(filePath: string) {
  let html = readFileSync(filePath, "utf-8");

  // 1. Remover botão de voltar ao topo (qualquer ocorrência)
  html = html.replace(/<!--\s*✅\s*Botão Voltar ao Topo\s*-->[\s\S]*?<\/button>/gi, "");
  html = html.replace(/<button[^>]*aria-label="Voltar ao topo[^>]*>[\s\S]*?<\/button>/gi, "");
  html = html.replace(/<button[^>]*onclick="window\.scrollTo[\s\S]*?<\/button>/gi, "");

  // 2. Substituir o footer antigo pelo novo footer compacto
  html = html.replace(/<footer[\s\S]*?<\/footer>/i, newFooterHtml);

  // 3. Atualizar o botão do WhatsApp flutuante para a DIREITA
  html = html.replace(/<!--\s*Botão WhatsApp Flutuante Fixo[^>]*-->[\s\S]*?<\/div>/gi, "");
  html = html.replace(/<div id="whatsapp-fixed-container"[\s\S]*?<\/div>/gi, "");
  html = html.replace("</body>", `${newWhatsappFloatingButton}\n</body>`);

  writeFileSync(filePath, html, "utf-8");
  console.log(`✓ Atualizado (footer compacto + WhatsApp à direita + sem botão topo): ${filePath}`);
}

function traverse(dir: string) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (!['uploads','css','assets','fonts'].includes(entry)) {
        traverse(full);
      }
    } else if (entry.endsWith(".html")) {
      processHtml(full);
    }
  }
}

traverse(siteDir);

console.log("\n=== CONCLUÍDO COM SUCESSO! ===");

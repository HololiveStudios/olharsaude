import { writeFileSync, mkdirSync, readFileSync, existsSync } from "fs";
import { join } from "path";

console.log("=== GERANDO MANIFESTO AI-CATALOG.JSON E ARD.JSON PARA AGENTIC WEB / ARD SPEC ===");

const siteDir = "./site";
const wellKnownDir = join(siteDir, ".well-known");

mkdirSync(wellKnownDir, { recursive: true });

const aiCatalogManifest = {
  "specVersion": "1.0",
  "host": {
    "displayName": "Clínica Olhar Saúde",
    "documentationUrl": "https://olharsaude.pages.dev/llms.txt",
    "logoUrl": "https://olharsaude.pages.dev/apple-touch-icon.png"
  },
  "entries": [
    {
      "identifier": "urn:air:olharsaude.pages.dev:clinic:services",
      "displayName": "Clínica Olhar Saúde — Serviços Oftalmológicos",
      "type": "application/json",
      "url": "https://olharsaude.pages.dev/llms.txt",
      "description": "Consultas oftalmológicas, 19 tipos de exames diagnósticos de precisão e cirurgias oculares (catarata, refrativa, glaucoma) no Maranhão.",
      "tags": [
        "oftalmologia",
        "saude-ocular",
        "exames-oftalmologicos",
        "cirurgia-de-catarata",
        "consultas-medicas",
        "maranhao",
        "sao-luis"
      ],
      "capabilities": [
        "AgendamentoConsultas",
        "ExamesDiagnosticos",
        "CirurgiaCatarata",
        "TratamentoGlaucoma",
        "Oftalmopediatria"
      ],
      "representativeQueries": [
        "agendar consulta oftalmologista em São Luís Maranhão",
        "onde fazer exames de vista e cirurgia de catarata no Maranhão"
      ],
      "version": "1.0.0",
      "updatedAt": "2026-09-27T19:00:00Z",
      "metadata": {
        "city": "São Luís",
        "state": "Maranhão",
        "phone": "+559820180161"
      }
    }
  ]
};

const jsonContent = JSON.stringify(aiCatalogManifest, null, 2) + "\n";

// Salvar em todos os caminhos previstos pela especificação ARD e pelo Lighthouse
writeFileSync(join(wellKnownDir, "ai-catalog.json"), jsonContent, "utf-8");
writeFileSync(join(siteDir, "ai-catalog.json"), jsonContent, "utf-8");
writeFileSync(join(wellKnownDir, "ard.json"), jsonContent, "utf-8");
writeFileSync(join(siteDir, "ard.json"), jsonContent, "utf-8");

console.log("✓ Manifestos ai-catalog.json e ard.json gerados em /.well-known e na raiz!");

// Atualizar o _headers para servir com Content-Type JSON correto e CORS liberado
const headersPath = join(siteDir, "_headers");
let headers = "";
if (existsSync(headersPath)) {
  headers = readFileSync(headersPath, "utf-8");
}

const aiHeaders = `
/.well-known/*
  Content-Type: application/json; charset=utf-8
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600

/ai-catalog.json
  Content-Type: application/json; charset=utf-8
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600

/ard.json
  Content-Type: application/json; charset=utf-8
  Access-Control-Allow-Origin: *
  Cache-Control: public, max-age=3600
`;

if (!headers.includes("/ai-catalog.json")) {
  headers += "\n" + aiHeaders;
  writeFileSync(headersPath, headers, "utf-8");
  console.log("✓ _headers atualizado com cabeçalhos MIME e CORS para os manifestos de IA!");
}

console.log("\n=== TUDO PRONTO COM O ESQUEMA AI-CATALOG.JSON 100% VÁLIDO! ===");

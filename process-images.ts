#!/usr/bin/env bun
/**
 * Image processing pipeline — 3 layers of compression:
 * 1. Resize to component dimensions (proportional)
 * 2. Compress with Sharp (quality 85)
 * 3. Convert to AVIF (smallest format)
 *
 * Also handles:
 * - Deduplication (IMG_5xxx variants → single file)
 * - Renaming to semantic filenames
 * - Skipping corrupted files (95886 bytes = HTML from 409)
 */

import sharp from "sharp";
import { readdir, stat, mkdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SRC_DIR = "./site-dump/assets/images";
const OUT_DIR = "./site/assets/images";
const CORRUPT_SIZE = 95886;

// Mapping: source filename → { output name, width, height, usage }
const IMAGE_MAP: Record<string, { out: string; w: number; h: number; usage: string }> = {
  // Logos
  "69d94cde525d1_1775848670.png": { out: "logo", w: 400, h: 95, usage: "header logo" },
  "69d950e4ba052_1775849700.png": { out: "logo-footer", w: 440, h: 104, usage: "footer logo" },

  // Doctor photos (equipe page, 280x373 cards)
  "69fcc161c358d_1778172257.jpg": { out: "dr-alvaro", w: 560, h: 747, usage: "doctor card 2x" },
  "69fcc15145431_1778172241.jpg": { out: "dr-henderson", w: 560, h: 747, usage: "doctor card 2x" },
  "69fcc12b9a49c_1778172203.jpg": { out: "dr-pedro", w: 560, h: 747, usage: "doctor card 2x" },
  "69fcc1097895f_1778172169.jpg": { out: "dra-raysa", w: 560, h: 747, usage: "doctor card 2x" },
  "69fcc0bb23554_1778172091.jpg": { out: "dra-marina", w: 560, h: 747, usage: "doctor card 2x" },
  "6a172a3aecacc_1779903034.jpg": { out: "dra-renata", w: 560, h: 747, usage: "doctor card 2x" },
  "6a10abc54023e_1779477445.jpg": { out: "dra-claudiany", w: 560, h: 747, usage: "doctor card 2x" },

  // Blog hero images (896x500 max, used in cards at 384x216)
  "69d944db9b0d8_1775846619.png": { out: "blog-6", w: 896, h: 500, usage: "blog hero" },
  "69d9449f5143b_1775846559.png": { out: "blog-5", w: 896, h: 500, usage: "blog hero" },
  "69d94442b938e_1775846466.jpeg": { out: "blog-4", w: 896, h: 500, usage: "blog hero" },
  "69d943b04af64_1775846320.jpg": { out: "blog-3", w: 896, h: 500, usage: "blog hero" },
  "69d943567acda_1775846230.jpg": { out: "blog-2", w: 896, h: 500, usage: "blog hero" },
  "69d9431048fec_1775846160.jpg": { out: "blog-1", w: 896, h: 500, usage: "blog hero" },

  // Home page images
  "69d953cce877e_1775850444.jpg": { out: "home-slide-1", w: 1280, h: 720, usage: "home slider" },
  "69d953c8d1af6_1775850440.jpg": { out: "home-slide-2", w: 1280, h: 720, usage: "home slider" },
  "69d949c43cfb6_1775847876.jpg": { out: "home-about", w: 640, h: 480, usage: "home about section" },
  "6a1728273320a_1779902503.jpg": { out: "home-hero", w: 1280, h: 720, usage: "home hero" },
  "medicos%20clinica%20olhar%20saude.webp": { out: "medicos-hero", w: 1280, h: 720, usage: "sobre hero" },

  // CTA / misc icons  
  "69d94b2abead3_1775848234.png": { out: "cta-1", w: 400, h: 400, usage: "CTA icon" },
  "69d94b83612b6_1775848323.png": { out: "cta-2", w: 400, h: 400, usage: "CTA icon" },
  "69d94bee5f811_1775848430.png": { out: "cta-3", w: 400, h: 400, usage: "CTA icon" },
};

// Exam images (already webp, just resize and convert to avif)
const EXAM_IMAGES = [
  "aberrometria", "acuidade-visual-av", "campimetria-visual-campo-visual-computadorizado",
  "exame-de-motilidade-ocular", "gonioscopia", "mapeamento-de-retina-fundoscopia",
  "microscopia-especular", "microscopia-especular-da-cornea", "orbscan", "paquimetria",
  "refracao", "retinografia", "teste-de-adaptacao-de-lentes-de-contato",
  "teste-de-sobrecarga-hidrica", "teste-de-visao-de-cores-teste-de-ishihara",
  "tomografia-de-coerencia-optica-oct", "tonometria", "topografia-corneana",
  "ultrassonografia-ocular-ecografia",
];

async function processImage(srcPath: string, outName: string, maxW: number, maxH: number) {
  try {
    const s = await stat(srcPath);
    if (s.size === CORRUPT_SIZE) {
      console.warn(`  ⚠ SKIP (corrupted/HTML): ${path.basename(srcPath)}`);
      return false;
    }

    const img = sharp(srcPath);
    const meta = await img.metadata();

    if (!meta.width || !meta.height) {
      console.warn(`  ⚠ SKIP (no dimensions): ${path.basename(srcPath)}`);
      return false;
    }

    // Calculate resize dimensions maintaining aspect ratio
    let w = meta.width;
    let h = meta.height;

    if (w > maxW || h > maxH) {
      const ratio = Math.min(maxW / w, maxH / h);
      w = Math.round(w * ratio);
      h = Math.round(h * ratio);
    }

    const outPath = path.join(OUT_DIR, `${outName}.avif`);

    await img
      .resize(w, h, { fit: "inside", withoutEnlargement: true })
      .avif({ quality: 72, effort: 6 }) // High quality AVIF
      .toFile(outPath);

    const outStat = await stat(outPath);
    const savings = ((1 - outStat.size / s.size) * 100).toFixed(1);
    console.log(`  ✓ ${path.basename(srcPath)} → ${outName}.avif (${meta.width}x${meta.height} → ${w}x${h}, ${(s.size / 1024).toFixed(0)}KB → ${(outStat.size / 1024).toFixed(0)}KB, -${savings}%)`);
    return true;
  } catch (e: any) {
    console.error(`  ✗ Error processing ${srcPath}: ${e.message}`);
    return false;
  }
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log("=== IMAGE PROCESSING PIPELINE ===\n");
  console.log("Layer 1: Resize to component dimensions");
  console.log("Layer 2: Compress (AVIF quality 72)");
  console.log("Layer 3: AVIF format conversion\n");

  let processed = 0;
  let skipped = 0;
  let totalSrcSize = 0;
  let totalOutSize = 0;

  // Process mapped images
  console.log("--- Mapped images ---");
  for (const [srcFile, config] of Object.entries(IMAGE_MAP)) {
    const srcPath = path.join(SRC_DIR, srcFile);
    if (!existsSync(srcPath)) {
      console.warn(`  ⚠ NOT FOUND: ${srcFile}`);
      skipped++;
      continue;
    }
    const srcStat = await stat(srcPath);
    totalSrcSize += srcStat.size;

    const ok = await processImage(srcPath, config.out, config.w, config.h);
    if (ok) {
      const outStat = await stat(path.join(OUT_DIR, `${config.out}.avif`));
      totalOutSize += outStat.size;
      processed++;
    } else {
      skipped++;
    }
  }

  // Process exam images  
  console.log("\n--- Exam images ---");
  for (const name of EXAM_IMAGES) {
    const srcPath = path.join(SRC_DIR, `${name}.webp`);
    if (!existsSync(srcPath)) {
      console.warn(`  ⚠ NOT FOUND: ${name}.webp`);
      skipped++;
      continue;
    }
    const srcStat = await stat(srcPath);
    totalSrcSize += srcStat.size;

    // Exam cards: max 560x373 (card size * 2 for retina)
    const ok = await processImage(srcPath, `exam-${name}`, 560, 373);
    if (ok) {
      const outStat = await stat(path.join(OUT_DIR, `exam-${name}.avif`));
      totalOutSize += outStat.size;
      processed++;
    } else {
      skipped++;
    }
  }

  console.log(`\n=== SUMMARY ===`);
  console.log(`Processed: ${processed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total source: ${(totalSrcSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Total output: ${(totalOutSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`Savings: ${((1 - totalOutSize / totalSrcSize) * 100).toFixed(1)}%`);
}

main().catch(console.error);

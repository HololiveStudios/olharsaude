#!/usr/bin/env bun
/**
 * Re-downloads images that came back as HTML (409 response)
 * Uses longer delays to avoid rate limiting
 */

import { writeFile, readFile, stat } from "node:fs/promises";
import path from "node:path";

const OUT_DIR = "./site-dump/assets/images";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";

const CORRUPT_SIZE = 95886; // All corrupted files have this exact size

// URLs to re-download (the originals that returned 409/HTML)
const URLS_TO_REDOWNLOAD = [
  "https://clinicaolharsaude.com.br/wp-content/uploads/2025/05/IMG_5137-3-scaled.jpg",
  "https://clinicaolharsaude.com.br/wp-content/uploads/2025/05/IMG_5121-2-scaled.jpg",
  "https://clinicaolharsaude.com.br/wp-content/uploads/2025/05/IMG_5136-2.jpg",
  "https://clinicaolharsaude.com.br/wp-content/uploads/2025/05/IMG_5134-2-1024x768.jpg",
  "https://clinicaolharsaude.com.br/wp-content/uploads/2024/05/LOGO2.png",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function download(url: string, attempt = 0): Promise<Buffer | null> {
  const delay = 4000 + Math.random() * 3000; // 4-7s between requests
  await sleep(delay);

  console.log(`[${attempt + 1}] Downloading: ${url}`);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept": "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://clinicaolharsaude.com.br/",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
    });

    if (res.status === 409 || res.status === 429 || res.status === 503) {
      if (attempt < 5) {
        const backoff = (8000 + Math.random() * 5000) * Math.pow(2, attempt);
        console.warn(`  ⚠ ${res.status} — retry in ${(backoff / 1000).toFixed(1)}s`);
        await sleep(backoff);
        return download(url, attempt + 1);
      }
      console.error(`  ✗ Failed after ${attempt + 1} attempts`);
      return null;
    }

    if (!res.ok) {
      console.error(`  ✗ HTTP ${res.status}`);
      return null;
    }

    const buf = Buffer.from(await res.arrayBuffer());

    // Check if we got HTML instead of image
    const header = buf.slice(0, 20).toString("ascii");
    if (header.includes("<!DOCTYPE") || header.includes("<html") || header.includes("<?xml")) {
      console.warn(`  ⚠ Got HTML instead of image (${buf.length} bytes)`);
      if (attempt < 5) {
        const backoff = (10000 + Math.random() * 5000) * Math.pow(2, attempt);
        console.warn(`  Retrying in ${(backoff / 1000).toFixed(1)}s...`);
        await sleep(backoff);
        return download(url, attempt + 1);
      }
      return null;
    }

    console.log(`  ✓ ${buf.length} bytes`);
    return buf;
  } catch (e: any) {
    console.error(`  ✗ Error: ${e.message}`);
    if (attempt < 3) {
      await sleep(5000);
      return download(url, attempt + 1);
    }
    return null;
  }
}

async function main() {
  console.log("Re-downloading corrupted images...\n");

  for (const url of URLS_TO_REDOWNLOAD) {
    const filename = path.basename(new URL(url).pathname);
    const outPath = path.join(OUT_DIR, filename);

    // Check if file exists and is corrupted
    try {
      const s = await stat(outPath);
      if (s.size !== CORRUPT_SIZE) {
        console.log(`⏭ ${filename} — already valid (${s.size} bytes), skipping`);
        continue;
      }
    } catch {}

    const buf = await download(url);
    if (buf) {
      await writeFile(outPath, buf);
      console.log(`  💾 Saved: ${outPath}\n`);
    } else {
      console.error(`  ✗ Could not download: ${filename}\n`);
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);

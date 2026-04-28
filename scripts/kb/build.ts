/**
 * KB Builder — consolida todos los archivos del knowledge base en un solo system prompt
 * para Claude Sonnet 4.6 con prompt caching.
 *
 * Uso:
 *   npx tsx scripts/kb/build.ts
 *
 * Output:
 *   scripts/kb/output/system-prompt.md  (markdown legible)
 *   scripts/kb/output/system-prompt.txt (texto plano para inyectar en Claude)
 *   scripts/kb/output/stats.json        (conteo de tokens y palabras)
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const KB_DIR = join(process.cwd(), 'scripts', 'kb');
const OUTPUT_DIR = join(KB_DIR, 'output');
const PARCIALES_DIR = join(KB_DIR, 'parciales-hermano');
const SOURCES_DIR = join(KB_DIR, 'sources');

// Archivos en orden de inclusión (el orden importa para coherencia)
const KB_FILES = [
  '00-system-prompt.md',     // Identidad + reglas + formato
  '01-core-mined.md',         // Sistema MINED + AVANZO
  '02-universidades-sv.md',   // Universidades
  '03-espanol-salvadoreno.md',// Reglas de tono
  '04-prompts-por-modo.md',   // Detalle por modo
];

function loadFile(filename: string): string {
  const fullPath = join(KB_DIR, filename);
  if (!existsSync(fullPath)) {
    console.warn(`⚠️  Archivo no encontrado: ${filename}`);
    return '';
  }
  return readFileSync(fullPath, 'utf-8');
}

function loadDirectory(dir: string, label: string): string {
  if (!existsSync(dir)) return '';
  const files = readdirSync(dir).filter(f => /\.(md|txt|json)$/i.test(f));
  if (files.length === 0) return '';

  let content = `\n\n---\n\n# ${label}\n\n`;
  for (const file of files) {
    const fileContent = readFileSync(join(dir, file), 'utf-8');
    content += `\n## Fuente: ${file}\n\n${fileContent}\n`;
  }
  return content;
}

// Estimación simple de tokens (Claude usa ~3-4 chars por token en español)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 3.5);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

console.log('🔨 Construyendo Knowledge Base de Chero...\n');

// 1. Cargar archivos base
let fullKB = '';
for (const file of KB_FILES) {
  const content = loadFile(file);
  if (content) {
    fullKB += content + '\n\n---\n\n';
    console.log(`✅ Cargado: ${file} (${content.length} chars, ~${estimateTokens(content)} tokens)`);
  }
}

// 2. Cargar parciales del hermano (si existen)
const hermanoContent = loadDirectory(PARCIALES_DIR, 'PARCIALES REALES ESEN — Banco de exámenes del hermano de Milton');
if (hermanoContent) {
  fullKB += hermanoContent;
  console.log(`📚 Parciales hermano: ${hermanoContent.length} chars, ~${estimateTokens(hermanoContent)} tokens`);
} else {
  console.log('⏳ Carpeta parciales-hermano vacía — esperando aporte del hermano');
}

// 3. Cargar sources adicionales (Quizlet sets, etc.)
const sourcesContent = loadDirectory(SOURCES_DIR, 'FUENTES ADICIONALES — Quizlet, repositorios oficiales, sintéticos');
if (sourcesContent) {
  fullKB += sourcesContent;
  console.log(`📖 Sources: ${sourcesContent.length} chars, ~${estimateTokens(sourcesContent)} tokens`);
}

// 4. Stats finales
const totalTokens = estimateTokens(fullKB);
const totalWords = countWords(fullKB);

console.log('\n📊 Estadísticas finales:');
console.log(`   Caracteres: ${fullKB.length.toLocaleString()}`);
console.log(`   Palabras:   ${totalWords.toLocaleString()}`);
console.log(`   Tokens:     ~${totalTokens.toLocaleString()} (estimado)`);

// 5. Verificación de límite
const TOKEN_TARGET = 120_000;
const TOKEN_HARD_LIMIT = 180_000;

if (totalTokens > TOKEN_HARD_LIMIT) {
  console.error(`\n❌ KB EXCEDE LÍMITE DURO (${TOKEN_HARD_LIMIT.toLocaleString()} tokens). Hay que recortar.`);
  process.exit(1);
} else if (totalTokens > TOKEN_TARGET) {
  console.warn(`\n⚠️  KB excede target (${TOKEN_TARGET.toLocaleString()} tokens). Considerar recorte.`);
} else {
  console.log(`\n✅ KB dentro de target (${totalTokens.toLocaleString()} / ${TOKEN_TARGET.toLocaleString()} tokens)`);
}

// 6. Escribir outputs
const stats = {
  built_at: new Date().toISOString(),
  files_loaded: KB_FILES,
  parciales_hermano_count: existsSync(PARCIALES_DIR)
    ? readdirSync(PARCIALES_DIR).length
    : 0,
  characters: fullKB.length,
  words: totalWords,
  tokens_estimated: totalTokens,
  tokens_target: TOKEN_TARGET,
  tokens_hard_limit: TOKEN_HARD_LIMIT,
  within_target: totalTokens <= TOKEN_TARGET,
};

writeFileSync(join(OUTPUT_DIR, 'system-prompt.md'), fullKB);
writeFileSync(join(OUTPUT_DIR, 'system-prompt.txt'), fullKB.replace(/\r\n/g, '\n'));
writeFileSync(join(OUTPUT_DIR, 'stats.json'), JSON.stringify(stats, null, 2));

// También escribimos el KB como JSON importable para que las API routes
// puedan hacer `import systemPrompt from '@/lib/kb/system-prompt.json'`
// sin depender de fs.readFileSync en runtime.
const KB_LIB_DIR = join(process.cwd(), 'src', 'lib', 'kb');
const kbJsonPath = join(KB_LIB_DIR, 'system-prompt.json');
writeFileSync(
  kbJsonPath,
  JSON.stringify(
    {
      built_at: stats.built_at,
      tokens_estimated: stats.tokens_estimated,
      content: fullKB.replace(/\r\n/g, '\n'),
    },
    null,
    0,
  ),
);

console.log('\n✅ KB consolidado guardado en:');
console.log(`   - scripts/kb/output/system-prompt.md (${fullKB.length} chars)`);
console.log(`   - scripts/kb/output/system-prompt.txt`);
console.log(`   - scripts/kb/output/stats.json`);
console.log(`   - src/lib/kb/system-prompt.json (importable desde routes)`);
console.log('\n🎉 Build completo.');

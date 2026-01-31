#!/usr/bin/env node

/**
 * C-slop Frontend Compiler CLI
 * Compiles .ui files to JavaScript + CSS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseComponent } from './parser.js';
import { generateCode } from './codegen.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function compileFile(filepath, outputDir) {
  try {
    const source = await fs.promises.readFile(filepath, 'utf8');
    const name = path.basename(filepath, '.ui');

    console.log(`Compiling ${name}.ui...`);

    // Parse
    const ast = parseComponent(source);

    // Generate
    const { js, css } = generateCode(ast, name);

    // Ensure output directories exist
    const jsDir = path.join(outputDir, 'js');
    const cssDir = path.join(outputDir, 'css');

    await fs.promises.mkdir(jsDir, { recursive: true });
    await fs.promises.mkdir(cssDir, { recursive: true });

    // Write output
    await fs.promises.writeFile(path.join(jsDir, `${name}.js`), js);
    await fs.promises.writeFile(path.join(cssDir, `${name}.css`), css);

    console.log(`  ✓ ${name}.js`);
    console.log(`  ✓ ${name}.css`);

    return { name, js, css };
  } catch (error) {
    console.error(`  ✗ Error compiling ${filepath}:`, error.message);
    throw error;
  }
}

async function compileDirectory(inputDir, outputDir) {
  const files = await fs.promises.readdir(inputDir);
  const uiFiles = files.filter(f => f.endsWith('.ui'));

  console.log(`Found ${uiFiles.length} .ui files\n`);

  for (const file of uiFiles) {
    await compileFile(path.join(inputDir, file), outputDir);
  }

  // Copy runtime files
  console.log('\nCopying runtime...');
  const runtimeDir = path.join(__dirname, '..', 'runtime');
  const runtimeOutput = path.join(outputDir, 'js');

  const runtimeFiles = ['signals.js', 'dom.js'];
  for (const file of runtimeFiles) {
    const src = path.join(runtimeDir, file);
    const dest = path.join(runtimeOutput, file);
    await fs.promises.copyFile(src, dest);
    console.log(`  ✓ ${file}`);
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node cli.js <input-dir> [output-dir]');
    console.log('Example: node cli.js ./components ./dist');
    process.exit(1);
  }

  const inputDir = path.resolve(args[0]);
  const outputDir = path.resolve(args[1] || './dist');

  console.log('C-slop Frontend Compiler');
  console.log('========================\n');
  console.log(`Input:  ${inputDir}`);
  console.log(`Output: ${outputDir}\n`);

  await compileDirectory(inputDir, outputDir);

  console.log('\n✓ Compilation complete!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

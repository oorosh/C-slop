#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { compile } = require('./compiler');
const { createRuntime } = require('./runtime');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: cslop <file.slop>');
  console.log('       cslop run <file.slop>');
  console.log('       cslop build <file.slop> -o <output.js>');
  process.exit(1);
}

const command = args[0];

if (command === 'build') {
  // Build mode: cslop build file.slop -o output.js
  const filePath = args[1];
  const outputPath = args[3] || filePath.replace('.slop', '.js');

  if (!filePath) {
    console.error('Error: Please provide a .slop file');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const code = fs.readFileSync(fullPath, 'utf8');

  try {
    const compiled = compile(code, {
      filename: filePath,
      basePath: path.dirname(fullPath)
    });

    fs.writeFileSync(outputPath, compiled);
    console.log(`Compiled ${filePath} -> ${outputPath}`);

  } catch (error) {
    console.error('Compilation error:', error.message);
    process.exit(1);
  }

} else if (command === 'run' || command.endsWith('.slop')) {
  // Run mode: cslop run file.slop or cslop file.slop
  const filePath = command.endsWith('.slop') ? command : args[1];

  if (!filePath) {
    console.error('Error: Please provide a .slop file');
    process.exit(1);
  }

  const fullPath = path.resolve(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`Error: File not found: ${filePath}`);
    process.exit(1);
  }

  const code = fs.readFileSync(fullPath, 'utf8');

  try {
    const compiled = compile(code, {
      filename: filePath,
      basePath: path.dirname(fullPath)
    });

    // Execute the compiled code with runtime
    const runtime = createRuntime({
      basePath: path.dirname(fullPath)
    });

    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('runtime', 'require', '__dirname', '__filename', compiled);

    fn(runtime, require, path.dirname(fullPath), fullPath).catch(err => {
      console.error('Runtime error:', err);
      process.exit(1);
    });

  } catch (error) {
    console.error('Compilation error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }

} else {
  console.error(`Unknown command: ${command}`);
  process.exit(1);
}

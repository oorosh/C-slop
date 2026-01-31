#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { compile } = require('./compiler');
const { createRuntime } = require('./runtime');
const { spawn } = require('child_process');
const http = require('http');

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('C-slop - Token-minimal web framework');
  console.log('');
  console.log('Usage:');
  console.log('  cslop start              Start app (compile frontend + run backend)');
  console.log('  cslop watch              Start with hot reload (like Vite)');
  console.log('  cslop <file.slop>        Run a .slop file');
  console.log('  cslop build <file.slop>  Compile to JavaScript');
  console.log('');
  console.log('Project structure:');
  console.log('  slop.json                Config file');
  console.log('  api.slop                 Backend API');
  console.log('  components/*.ui          Frontend components');
  console.log('  public/                  Static files output');
  process.exit(1);
}

const command = args[0];

// Helper: Compile frontend components
function compileFrontend(componentsDir, outputDir) {
  const frontendDir = path.join(__dirname, '..', 'frontend');
  const parserPath = path.join(frontendDir, 'parser.js');
  const codegenPath = path.join(frontendDir, 'codegen.js');

  // Dynamic import for ES modules
  return import(parserPath).then(({ parseComponent }) => {
    return import(codegenPath).then(({ generateCode }) => {
      // Get .ui files
      if (!fs.existsSync(componentsDir)) return [];

      const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.ui'));
      const compiled = [];

      for (const file of files) {
        const source = fs.readFileSync(path.join(componentsDir, file), 'utf8');
        const name = path.basename(file, '.ui');

        const ast = parseComponent(source);
        const { js, css } = generateCode(ast, name);

        // Ensure output directories
        const jsDir = path.join(outputDir, 'js');
        const cssDir = path.join(outputDir, 'css');
        fs.mkdirSync(jsDir, { recursive: true });
        fs.mkdirSync(cssDir, { recursive: true });

        // Write files
        fs.writeFileSync(path.join(jsDir, `${name}.js`), js);
        fs.writeFileSync(path.join(cssDir, `${name}.css`), css);

        compiled.push(name);
      }

      // Copy runtime
      const runtimeDir = path.join(__dirname, '..', 'runtime');
      const runtimeFiles = ['signals.js', 'dom.js'];
      for (const file of runtimeFiles) {
        const src = path.join(runtimeDir, file);
        const dest = path.join(outputDir, 'js', file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }

      return compiled;
    });
  });
}

if (command === 'start') {
  // Start mode: cslop start
  // 1. Read slop.json for config
  // 2. Compile frontend components
  // 3. Run backend API

  const cwd = process.cwd();
  const configPath = path.join(cwd, 'slop.json');

  if (!fs.existsSync(configPath)) {
    console.error('Error: slop.json not found in current directory');
    console.log('Create a slop.json with your project configuration');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

  console.log('C-slop Starting...');
  console.log('');

  // Find API file
  const apiFile = fs.readdirSync(cwd).find(f => f.endsWith('.slop'));
  if (!apiFile) {
    console.error('Error: No .slop file found in current directory');
    process.exit(1);
  }

  // Compile frontend if components directory exists
  const componentsDir = path.join(cwd, 'components');
  const publicDir = path.join(cwd, config.server?.static || 'public');

  if (fs.existsSync(componentsDir)) {
    console.log('Compiling frontend components...');
    compileFrontend(componentsDir, publicDir)
      .then(compiled => {
        if (compiled.length > 0) {
          compiled.forEach(name => console.log(`  ✓ ${name}.ui`));
        }
        console.log('');
        runBackend(path.join(cwd, apiFile));
      })
      .catch(err => {
        console.error('Frontend compilation error:', err.message);
        process.exit(1);
      });
  } else {
    runBackend(path.join(cwd, apiFile));
  }

  function runBackend(fullPath) {
    const code = fs.readFileSync(fullPath, 'utf8');

    try {
      const compiled = compile(code, {
        filename: path.basename(fullPath),
        basePath: path.dirname(fullPath)
      });

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
      console.error('Backend compilation error:', error.message);
      process.exit(1);
    }
  }

} else if (command === 'watch') {
  // Watch mode: cslop watch
  // Like Vite - hot reload for .ui files, server restart for .slop files

  const cwd = process.cwd();
  const configPath = path.join(cwd, 'slop.json');

  if (!fs.existsSync(configPath)) {
    console.error('Error: slop.json not found in current directory');
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const componentsDir = path.join(cwd, 'components');
  const publicDir = path.join(cwd, config.server?.static || 'public');
  const wsPort = 35729; // Live reload WebSocket port

  // Find API file
  const apiFile = fs.readdirSync(cwd).find(f => f.endsWith('.slop'));
  if (!apiFile) {
    console.error('Error: No .slop file found in current directory');
    process.exit(1);
  }

  console.log('\x1b[36m');
  console.log('  ╔═══════════════════════════════════════╗');
  console.log('  ║         C-slop Watch Mode             ║');
  console.log('  ╚═══════════════════════════════════════╝');
  console.log('\x1b[0m');

  // WebSocket server for live reload
  const WebSocket = require('ws');
  const wss = new WebSocket.Server({ port: wsPort });
  let wsClients = [];

  wss.on('connection', (ws) => {
    wsClients.push(ws);
    ws.on('close', () => {
      wsClients = wsClients.filter(c => c !== ws);
    });
  });

  function notifyClients(type, file) {
    const message = JSON.stringify({ type, file });
    wsClients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Inject live reload script into HTML files
  function injectLiveReload(publicDir) {
    const liveReloadScript = `
<script>
(function() {
  const ws = new WebSocket('ws://localhost:${wsPort}');
  ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    if (data.type === 'reload') {
      console.log('[C-slop] Reloading...', data.file);
      location.reload();
    } else if (data.type === 'css') {
      console.log('[C-slop] CSS updated:', data.file);
      document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
        link.href = link.href.split('?')[0] + '?t=' + Date.now();
      });
    }
  };
  ws.onopen = () => console.log('[C-slop] Hot reload connected');
  ws.onclose = () => console.log('[C-slop] Hot reload disconnected, retrying...');
})();
</script>
</head>`;

    // Find and modify index.html
    const indexPath = path.join(publicDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      let html = fs.readFileSync(indexPath, 'utf8');
      if (!html.includes('ws://localhost:' + wsPort)) {
        html = html.replace('</head>', liveReloadScript);
        fs.writeFileSync(indexPath, html);
        console.log('  \x1b[32m✓\x1b[0m Injected live reload script');
      }
    }
  }

  // Compile a single .ui file
  async function compileUIFile(filePath) {
    const frontendDir = path.join(__dirname, '..', 'frontend');
    const { parseComponent } = await import(path.join(frontendDir, 'parser.js'));
    const { generateCode } = await import(path.join(frontendDir, 'codegen.js'));

    const source = fs.readFileSync(filePath, 'utf8');
    const name = path.basename(filePath, '.ui');

    const ast = parseComponent(source);
    const { js, css } = generateCode(ast, name);

    const jsDir = path.join(publicDir, 'js');
    const cssDir = path.join(publicDir, 'css');
    fs.mkdirSync(jsDir, { recursive: true });
    fs.mkdirSync(cssDir, { recursive: true });

    fs.writeFileSync(path.join(jsDir, `${name}.js`), js);
    fs.writeFileSync(path.join(cssDir, `${name}.css`), css);

    return name;
  }

  // Backend server process
  let serverProcess = null;

  function startServer() {
    const apiPath = path.join(cwd, apiFile);

    // Create a temporary runner script
    const runnerCode = `
const { compile } = require('./compiler');
const { createRuntime } = require('./runtime');
const fs = require('fs');
const path = require('path');

const fullPath = '${apiPath.replace(/\\/g, '\\\\')}';
const code = fs.readFileSync(fullPath, 'utf8');

try {
  const compiled = compile(code, {
    filename: path.basename(fullPath),
    basePath: path.dirname(fullPath)
  });

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
  console.error('Backend compilation error:', error.message);
  process.exit(1);
}
`;

    const runnerPath = path.join(__dirname, '.runner.tmp.js');
    fs.writeFileSync(runnerPath, runnerCode);

    serverProcess = spawn('node', [runnerPath], {
      stdio: 'inherit',
      cwd: __dirname
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.log('  \x1b[31m✗\x1b[0m Server crashed, waiting for changes...');
      }
    });
  }

  function restartServer() {
    if (serverProcess) {
      serverProcess.kill();
      serverProcess = null;
    }
    setTimeout(() => {
      console.log('  \x1b[33m↻\x1b[0m Restarting server...');
      startServer();
    }, 100);
  }

  // Watch .ui files
  function watchComponents() {
    if (!fs.existsSync(componentsDir)) return;

    console.log(`  \x1b[34m◉\x1b[0m Watching: components/*.ui`);

    fs.watch(componentsDir, { persistent: true }, async (eventType, filename) => {
      if (!filename || !filename.endsWith('.ui')) return;

      const filePath = path.join(componentsDir, filename);
      if (!fs.existsSync(filePath)) return;

      console.log(`  \x1b[33m↻\x1b[0m ${filename} changed`);

      try {
        const name = await compileUIFile(filePath);
        console.log(`  \x1b[32m✓\x1b[0m Compiled ${name}.ui`);
        notifyClients('reload', filename);
      } catch (err) {
        console.log(`  \x1b[31m✗\x1b[0m Error: ${err.message}`);
      }
    });
  }

  // Watch .slop files
  function watchBackend() {
    console.log(`  \x1b[34m◉\x1b[0m Watching: *.slop`);

    const slopFiles = fs.readdirSync(cwd).filter(f => f.endsWith('.slop'));

    slopFiles.forEach(file => {
      const filePath = path.join(cwd, file);
      fs.watch(filePath, { persistent: true }, (eventType) => {
        if (eventType === 'change') {
          console.log(`  \x1b[33m↻\x1b[0m ${file} changed`);
          restartServer();
          // Also notify clients to reload (API might have changed)
          setTimeout(() => notifyClients('reload', file), 500);
        }
      });
    });
  }

  // Initial compile
  async function initialCompile() {
    if (fs.existsSync(componentsDir)) {
      console.log('  Compiling frontend components...');
      const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.ui'));

      for (const file of files) {
        try {
          const name = await compileUIFile(path.join(componentsDir, file));
          console.log(`  \x1b[32m✓\x1b[0m ${name}.ui`);
        } catch (err) {
          console.log(`  \x1b[31m✗\x1b[0m ${file}: ${err.message}`);
        }
      }

      // Copy runtime files
      const runtimeDir = path.join(__dirname, '..', 'runtime');
      const runtimeFiles = ['signals.js', 'dom.js'];
      for (const file of runtimeFiles) {
        const src = path.join(runtimeDir, file);
        const dest = path.join(publicDir, 'js', file);
        if (fs.existsSync(src)) {
          fs.copyFileSync(src, dest);
        }
      }
    }

    // Inject live reload script
    injectLiveReload(publicDir);

    console.log('');
    console.log(`  \x1b[32m✓\x1b[0m Live reload on ws://localhost:${wsPort}`);
  }

  // Start everything
  initialCompile().then(() => {
    watchComponents();
    watchBackend();
    console.log('');
    startServer();
  }).catch(err => {
    console.error('Error during initial compile:', err);
    process.exit(1);
  });

  // Cleanup on exit
  process.on('SIGINT', () => {
    console.log('\n  Shutting down...');
    if (serverProcess) serverProcess.kill();
    wss.close();

    // Clean up temp runner
    const runnerPath = path.join(__dirname, '.runner.tmp.js');
    if (fs.existsSync(runnerPath)) {
      fs.unlinkSync(runnerPath);
    }

    process.exit(0);
  });

} else if (command === 'build') {
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

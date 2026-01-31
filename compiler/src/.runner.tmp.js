
const { compile } = require('./compiler');
const { createRuntime } = require('./runtime');
const fs = require('fs');
const path = require('path');

const fullPath = '/Users/bogdanchayka/Projects/C-slop/compiler/examples/api.slop';
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

/**
 * C-slop Main Entry Point
 */

const { compile, Compiler } = require('./compiler');
const { createRuntime, Database, utils } = require('./runtime');

module.exports = {
  compile,
  Compiler,
  createRuntime,
  Database,
  utils
};

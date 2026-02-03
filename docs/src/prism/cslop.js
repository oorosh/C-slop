/**
 * Prism language definition for C-slop (.slop backend files)
 */
export default function defineCslopLanguage(Prism) {
  Prism.languages.cslop = {
    'comment': {
      pattern: /\/\/.*|\/\*[\s\S]*?\*\//,
      greedy: true
    },
    'string': {
      pattern: /(["'])(?:\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
      greedy: true
    },
    'route-method': {
      pattern: /\*[\w\/\-\:\{\}]+(?:\s*[\+\^\-])?/,
      inside: {
        'method-symbol': /[\+\^\-]$/,
        'route-param': /:\w+|\{\w+\}/,
        'route-symbol': /^\*/,
        'route-path': /[\w\/\-]+/
      }
    },
    'database-op': {
      pattern: /@\w+(?:\[[^\]]+\])?(?:\?[^\s>]+)?(?:![^\s>]+)?/,
      inside: {
        'db-symbol': /^@/,
        'db-table': /^\w+/,
        'db-index': /\[[^\]]+\]/,
        'db-query': /\?[^\s>!]+/,
        'db-mutation': /![^\s>]+/
      }
    },
    'request-data': {
      pattern: /\$\.?\w*/,
      alias: 'variable'
    },
    'response': {
      pattern: /#\w+/,
      alias: 'keyword'
    },
    'pipeline': {
      pattern: />/,
      alias: 'operator'
    },
    'punctuation': /[{}[\];(),]/,
    'number': /\b\d+\b/
  };

  // Alias for code blocks using 'slop' language
  Prism.languages.slop = Prism.languages.cslop;
}

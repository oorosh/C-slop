/**
 * Prism language definition for C-slop UI (.ui frontend files)
 */
export default function defineUiLanguage(Prism) {
  Prism.languages.slopui = {
    'comment': /\/\/.*/,
    'template-separator': /^<\?$/m,
    'effect-line': {
      pattern: /^~.+$/m,
      inside: {
        'effect-symbol': /^~/,
        'pipeline': />/,
        'state-var': /\$\w+/,
        'keyword': /\b(?:fetch|true|false)\b/,
        'string': /"[^"]*"/,
        'punctuation': /[()]/
      }
    },
    'state-decl': {
      pattern: /^\$\w+:.+$/m,
      inside: {
        'state-var': /\$\w+/,
        'punctuation': /:/,
        'string': /"[^"]*"/,
        'number': /-?\d+(?:\.\d+)?/,
        'boolean': /\b(?:true|false)\b/,
        'bracket': /[\[\]{}]/
      }
    },
    'conditional': {
      pattern: /^\s*\?.+$/m,
      inside: {
        'condition-symbol': /\?/,
        'state-var': /\$\w+/,
        'operator': /[<>=!]+/,
        'number': /\d+/
      }
    },
    'component-use': /@@\w+/,
    'interpolation': {
      pattern: /@\{[^}]+\}/,
      inside: {
        'inter-delim': /@\{|\}/,
        'state-var': /\$\w+/,
        'operator': /[+\-*/%]/
      }
    },
    'event-handler': {
      pattern: /@\s+[^\]]+(?=\])/,
      inside: {
        'event-symbol': /^@/,
        'http-method': /\b(?:post|get|put|delete|patch):/,
        'state-var': /\$\w+/,
        'property-ref': /:\w+/,
        'pipeline': />/,
        'keyword': /\b(?:clear)\b/,
        'operator': /[+\-]/,
        'punctuation': /[{}]/
      }
    },
    'property-ref': /:\w+/,
    'state-var': /\$\w+/,
    'element-tag': /\b(?:div|span|p|h[1-6]|a|button|input|form|ul|ol|li|table|tr|td|th|thead|tbody|img|nav|header|footer|main|section|article|aside|label|textarea|select|option)\b/,
    'class-name': /\.[a-zA-Z_][\w-]*/,
    'string': /"[^"]*"/,
    'number': /-?\d+(?:\.\d+)?/,
    'boolean': /\b(?:true|false)\b/,
    'operator': /[+\-*/%<>=!]+/,
    'bracket': /[\[\]{}]/,
    'punctuation': /[(),]/
  };

  Prism.languages.ui = Prism.languages.slopui;
}

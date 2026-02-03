import defineCslopLanguage from './cslop';
import defineUiLanguage from './ui';

export function registerLanguages(Prism) {
  defineCslopLanguage(Prism);
  defineUiLanguage(Prism);
}

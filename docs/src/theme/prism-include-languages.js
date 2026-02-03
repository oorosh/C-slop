import siteConfig from '@generated/docusaurus.config';
import defineCslopLanguage from '../prism/cslop';
import defineUiLanguage from '../prism/ui';

export default function prismIncludeLanguages(PrismObject) {
  const {
    themeConfig: { prism },
  } = siteConfig;

  const additionalLanguages = prism.additionalLanguages ?? [];

  // Add default languages that Docusaurus includes
  globalThis.Prism = PrismObject;

  additionalLanguages.forEach((lang) => {
    if (lang === 'php') {
      require('prismjs/components/prism-markup-templating.js');
    }
    require(`prismjs/components/prism-${lang}`);
  });

  // Register C-slop custom languages
  defineCslopLanguage(PrismObject);
  defineUiLanguage(PrismObject);

  delete globalThis.Prism;
}

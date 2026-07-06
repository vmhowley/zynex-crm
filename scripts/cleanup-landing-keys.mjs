import { readFileSync, writeFileSync } from 'fs'

const oldKeys = [
  "landing_cta",
  "landing_ctaBottom",
  "landing_ctaBottomSubtitle",
  "landing_ctaSecondary",
  "landing_faq",
  "landing_features",
  "landing_featuresSubtitle",
  "landing_heroSubtitle",
  "landing_heroTitle",
  "landing_howItWorks",
  "landing_howItWorksSubtitle",
  "landing_noCreditCard",
  "landing_pricing",
  "landing_pricingSubtitle",
  "landing_step1Desc",
  "landing_step1Title",
  "landing_step2Desc",
  "landing_step2Title",
  "landing_step3Desc",
  "landing_step3Title",
]

for (const lang of ['es', 'en']) {
  const path = `src/messages/${lang}.json`
  const dict = JSON.parse(readFileSync(path, 'utf-8'))
  
  // Remove old keys
  for (const k of oldKeys) {
    delete dict[k]
  }

  // Add nav_faq if missing
  if (!('nav_faq' in dict)) {
    if (lang === 'es') {
      dict.nav_faq = 'FAQ'
    } else {
      dict.nav_faq = 'FAQ'
    }
  }

  // Sort
  const sorted = Object.keys(dict).sort().reduce((a, k) => { a[k] = dict[k]; return a }, {})
  writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n')
  console.log(`${path}: ${Object.keys(sorted).length} keys`)
}

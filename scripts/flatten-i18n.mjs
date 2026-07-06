import { readFileSync, writeFileSync } from 'fs'

function flatten(obj, prefix = '') {
  const result = {}
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}_${key}` : key
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flatten(value, newKey))
    } else {
      result[newKey] = value
    }
  }
  return result
}

for (const file of ['es.json', 'en.json']) {
  const path = `src/messages/${file}`
  const data = JSON.parse(readFileSync(path, 'utf-8'))
  const flat = flatten(data)
  const sorted = Object.keys(flat).sort().reduce((acc, k) => {
    acc[k] = flat[k]
    return acc
  }, {})
  writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n')
  console.log(`✓ ${file} — ${Object.keys(flat).length} keys (flattened + sorted)`)
}

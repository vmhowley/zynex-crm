import { readFileSync, writeFileSync } from 'fs'

const es = JSON.parse(readFileSync('src/messages/es.json', 'utf-8'))
const en = JSON.parse(readFileSync('src/messages/en.json', 'utf-8'))

const additions = {
  es: {
    nav_notifications: "Notificaciones",
    role_owner: "Dueño",
    role_admin: "Admin",
    role_agent: "Agente",
    role_viewer: "Visor",
    sidebar_profile: "Perfil",
    sidebar_signOut: "Cerrar Sesión",
    sidebar_beta: "Beta",
    sidebar_closeMenu: "Cerrar menú",
    nav_pagos: "Pagos",
  },
  en: {
    nav_notifications: "Notifications",
    role_owner: "Owner",
    role_admin: "Admin",
    role_agent: "Agent",
    role_viewer: "Viewer",
    sidebar_profile: "Profile",
    sidebar_signOut: "Sign Out",
    sidebar_beta: "Beta",
    sidebar_closeMenu: "Close menu",
    nav_pagos: "Payments",
  }
}

let esAdded = 0, enAdded = 0
for (const [key, value] of Object.entries(additions.es)) {
  if (!(key in es)) {
    es[key] = value
    esAdded++
  }
}
for (const [key, value] of Object.entries(additions.en)) {
  if (!(key in en)) {
    en[key] = value
    enAdded++
  }
}

const esSorted = Object.keys(es).sort().reduce((a, k) => { a[k] = es[k]; return a }, {})
const enSorted = Object.keys(en).sort().reduce((a, k) => { a[k] = en[k]; return a }, {})

writeFileSync('src/messages/es.json', JSON.stringify(esSorted, null, 2) + '\n')
writeFileSync('src/messages/en.json', JSON.stringify(enSorted, null, 2) + '\n')

console.log(`es.json: +${esAdded} keys (now ${Object.keys(esSorted).length})`)
console.log(`en.json: +${enAdded} keys (now ${Object.keys(enSorted).length})`)

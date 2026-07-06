import { readFileSync, writeFileSync } from 'fs'

const files = [
  'src/app/(auth)/signup/page.tsx',
  'src/components/layout/header.tsx',
  'src/app/(auth)/login/page.tsx',
  'src/app/(dashboard)/dashboard/page.tsx',
  'src/app/(auth)/forgot-password/page.tsx',
  'src/app/page.tsx',
  'src/app/(dashboard)/contacts/page.tsx',
  'src/app/(dashboard)/flows/page.tsx',
  'src/app/(dashboard)/admin/payments/page.tsx',
  'src/app/(dashboard)/automations/page.tsx',
  'src/app/(dashboard)/notifications/page.tsx',
  'src/app/(dashboard)/pipelines/page.tsx',
  'src/app/(dashboard)/broadcasts/page.tsx',
  'src/app/(dashboard)/inbox/page.tsx',
]

const replacements = {
  'auth.atLeast6Chars': 'auth_atLeast6Chars',
  'auth.backToSignIn': 'auth_backToSignIn',
  'auth.checkEmail': 'auth_checkEmail',
  'auth.confirmationEmail': 'auth_confirmationEmail',
  'auth.confirmPassword': 'auth_confirmPassword',
  'auth.createAccount': 'auth_createAccount',
  'auth.createAccountAndJoin': 'auth_createAccountAndJoin',
  'auth.creatingAccount': 'auth_creatingAccount',
  'auth.email': 'auth_email',
  'auth.enterEmailDescription': 'auth_enterEmailDescription',
  'auth.enterPassword': 'auth_enterPassword',
  'auth.forgotPassword': 'auth_forgotPassword',
  'auth.getStartedZynex': 'auth_getStartedZynex',
  'auth.haveAccount': 'auth_haveAccount',
  'auth.login': 'auth_login',
  'auth.noAccount': 'auth_noAccount',
  'auth.password': 'auth_password',
  'auth.passwordsDontMatch': 'auth_passwordsDontMatch',
  'auth.passwordTooShort': 'auth_passwordTooShort',
  'auth.recoveryEmail': 'auth_recoveryEmail',
  'auth.repeatPassword': 'auth_repeatPassword',
  'auth.resetPassword': 'auth_resetPassword',
  'auth.sending': 'auth_sending',
  'auth.sendLink': 'auth_sendLink',
  'auth.signIn': 'auth_signIn',
  'auth.signInAndWellTakeYou': 'auth_signInAndWellTakeYou',
  'auth.signInToAccept': 'auth_signInToAccept',
  'auth.signInToZynex': 'auth_signInToZynex',
  'auth.signingIn': 'auth_signingIn',
  'auth.signUp': 'auth_signUp',
  'auth.verifyEmailAndAccept': 'auth_verifyEmailAndAccept',
  'auth.welcomeBack': 'auth_welcomeBack',
  'admin.pendingPayments': 'admin_pendingPayments',
  'automations.title': 'automations_title',
  'broadcasts.title': 'broadcasts_title',
  'contacts.manageContactList': 'contacts_manageContactList',
  'contacts.title': 'contacts_title',
  'contacts.totalContacts': 'contacts_totalContacts',
  'dashboard.activeConversations': 'dashboard_activeConversations',
  'dashboard.liveAnalytics': 'dashboard_liveAnalytics',
  'dashboard.messagesSentToday': 'dashboard_messagesSentToday',
  'dashboard.newContactsToday': 'dashboard_newContactsToday',
  'dashboard.newTodayVsYesterday': 'dashboard_newTodayVsYesterday',
  'dashboard.openDeal': 'dashboard_openDeal',
  'dashboard.openDeals': 'dashboard_openDeals',
  'dashboard.openDealsValue': 'dashboard_openDealsValue',
  'dashboard.vsYesterday': 'dashboard_vsYesterday',
  'flows.title': 'flows_title',
  'inbox.whatsappNotConnected': 'inbox_whatsappNotConnected',
  'landing.aboutUs': 'landing_aboutUs',
  'landing.contact': 'landing_contact',
  'landing.footerTagline': 'landing_footerTagline',
  'landing.help': 'landing_help',
  'landing.terms': 'landing_terms',
  'nav.automations': 'nav_automations',
  'nav.broadcasts': 'nav_broadcasts',
  'nav.contacts': 'nav_contacts',
  'nav.dashboard': 'nav_dashboard',
  'nav.flows': 'nav_flows',
  'nav.inbox': 'nav_inbox',
  'nav.logout': 'nav_logout',
  'nav.pipelines': 'nav_pipelines',
  'nav.profile': 'nav_profile',
  'nav.settings': 'nav_settings',
  'notifications.title': 'notifications_title',
  'pipelines.manage': 'pipelines_manage',
  'plans.mostPopular': 'plans_mostPopular',
  'settings.fullName': 'settings_fullName',
}

let total = 0
for (const file of files) {
  let content = readFileSync(file, 'utf-8')
  const orig = content
  for (const [from, to] of Object.entries(replacements)) {
    const dq = `t("${from}")`
    const sq = `t('${from}')`
    let c = content
    c = c.split(dq).join(`t("${to}")`)
    c = c.split(sq).join(`t('${to}')`)
    content = c
  }
  if (content !== orig) {
    writeFileSync(file, content)
    total++
    console.log(`✓ ${file.replace('src/', '')}`)
  }
}
console.log(`\nDone. ${total} files updated.`)

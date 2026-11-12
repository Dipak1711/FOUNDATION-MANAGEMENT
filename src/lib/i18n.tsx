import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Lang, Pair } from '@/types'

/** UI strings, [English, हिंदी]. Module/field labels live beside their config. */
const UI = {
  // auth
  welcome: ['Welcome back', 'पुनः स्वागत है'],
  signInTitle: ['Sign in to your portal', 'अपने पोर्टल में लॉगिन करें'],
  signInLead: ['Choose your role and continue to the foundation workspace.', 'अपनी भूमिका चुनें और फाउंडेशन पोर्टल में प्रवेश करें।'],
  roleAdmin: ['Administrator', 'मुख्य प्रशासक'], roleAdminSub: ['Full system access', 'संपूर्ण सिस्टम अधिकार'],
  roleAgent: ['Field Agent', 'क्षेत्रीय एजेंट'], roleAgentSub: ['Applications & collections', 'आवेदन व संकलन'],
  branch: ['Branch / Office', 'शाखा / कार्यालय'],
  branchMain: ['Purbiya Balika Foundation (Head Office)', 'पूर्बिया बालिका फाउंडेशन (मुख्य कार्यालय)'],
  branchKot: ['Kotputli Branch Office', 'कोटपुतली शाखा कार्यालय'], branchBeh: ['Behror Divisional Branch', 'बहरोड विभागीय शाखा'],
  userId: ['User ID or mobile number', 'यूज़र आईडी या मोबाइल नंबर'], password: ['Password', 'पासवर्ड'],
  remember: ['Keep me signed in', 'मुझे लॉगिन रखें'], signIn: ['Sign in securely', 'सुरक्षित लॉगिन करें'],
  badLogin: ['Incorrect user ID or password.', 'यूज़र आईडी या पासवर्ड गलत है।'],
  agentBlocked: ['This agent account is not active. Contact the administrator.', 'यह एजेंट खाता सक्रिय नहीं है। कृपया प्रशासक से संपर्क करें।'],
  fillBoth: ['Enter your user ID and password.', 'यूज़र आईडी और पासवर्ड दर्ज करें।'],
  secure: ['Encrypted session · Digital foundation ERP', 'सुरक्षित सत्र · डिजिटल फाउंडेशन ईआरपी'],
  heroEyebrow: ['One platform · Every workflow', 'एक मंच · हर कार्यप्रवाह'],
  heroTitle: ['Empowering girls. Building a transparent foundation.', 'सशक्त बालिका, समृद्ध समाज — पारदर्शी फाउंडेशन'],
  heroText: ['Marriage assistance, suraksha insurance, agent commissions and beneficiary records — managed accurately from one secure place.', 'विवाह सहायता, सुरक्षा बीमा, एजेंट कमिशन और लाभार्थियों का सटीक प्रबंधन — एक ही सुरक्षित स्थान से।'],
  heroP1: ['Centralised dashboard & live statistics', 'केंद्रीकृत डैशबोर्ड व लाइव आँकड़े'],
  heroP2: ['Ten welfare schemes with approval workflows', 'अनुमोदन सहित दस कल्याणकारी योजनाएँ'],
  heroP3: ['Agent network, commissions & bulk EMI collection', 'एजेंट नेटवर्क, कमिशन व सामूहिक ईएमआई'],
  copyright: ['© 2026 Foundation Management ERP · Dedicated to girl-child empowerment', '© 2026 फाउंडेशन मैनेजमेंट ईआरपी · बालिका सशक्तिकरण को समर्पित'],
  signOut: ['Sign out', 'लॉग आउट'], signOutQ: ['Sign out of the portal?', 'पोर्टल से लॉग आउट करें?'],
  signOutText: ['You will need to sign in again to continue.', 'आगे बढ़ने के लिए आपको दोबारा लॉगिन करना होगा।'],
  // shell
  searchPh: ['Search ID, name, Aadhaar, mobile, place…', 'आईडी, नाम, आधार, मोबाइल, स्थान खोजें…'],
  noResults: ['No matching records', 'कोई मिलता-जुलता रिकॉर्ड नहीं'],
  grpMain: ['Main', 'मुख्य'], grpSchemes: ['Welfare schemes', 'कल्याणकारी योजनाएँ'], grpAgents: ['Agents', 'एजेंट'],
  grpBulk: ['Bulk EMI collection', 'सामूहिक संकलन'], grpFinance: ['Accounts & finance', 'हिशाब व वित्त'],
  adminRole: ['Administrator', 'मुख्य व्यवस्थापक'], agentRole: ['Field Agent', 'क्षेत्रीय एजेंट'],
  notifications: ['Notifications', 'सूचनाएँ'], allCaughtUp: ['All caught up — nothing needs review.', 'सब ठीक है — कुछ भी समीक्षा के लिए लंबित नहीं।'],
  openMenu: ['Open menu', 'मेनू खोलें'], notFound: ['Page not found', 'पृष्ठ नहीं मिला'], backHome: ['Back to dashboard', 'डैशबोर्ड पर लौटें'],
  // generic
  save: ['Save', 'सहेजें'], cancel: ['Cancel', 'रद्द करें'], close: ['Close', 'बंद करें'], delete: ['Delete', 'हटाएँ'], view: ['View', 'देखें'],
  approve: ['Approve', 'स्वीकृत करें'], reject: ['Reject', 'अस्वीकृत करें'], print: ['Print', 'प्रिंट'], exportCsv: ['Export CSV', 'CSV निर्यात'],
  all: ['All', 'सभी'], searchTable: ['Search this list…', 'इस सूची में खोजें…'], showing: ['Showing', 'दिखा रहे हैं'], of: ['of', 'में से'],
  records: ['records', 'रिकॉर्ड'], actions: ['Actions', 'कार्रवाई'], details: ['Details', 'विवरण'], statusL: ['Status', 'स्थिति'],
  emptyTitle: ['Nothing here yet', 'अभी कुछ नहीं है'], emptyText: ['Records you add will appear here.', 'आप जो रिकॉर्ड जोड़ेंगे वे यहाँ दिखेंगे।'],
  emptyFiltered: ['No records match your search or filter.', 'आपकी खोज या फ़िल्टर से कोई रिकॉर्ड मेल नहीं खाता।'],
  required: ['This field is required', 'यह फ़ील्ड आवश्यक है'], invalidMobile: ['Enter a valid 10-digit mobile number', '10 अंकों का सही मोबाइल नंबर दर्ज करें'],
  invalidAadhaar: ['Aadhaar must be 12 digits', 'आधार 12 अंकों का होना चाहिए'], invalidEmail: ['Enter a valid email', 'सही ईमेल दर्ज करें'],
  invalidAmount: ['Enter an amount greater than 0', '0 से अधिक राशि दर्ज करें'], invalidIfsc: ['Invalid IFSC code', 'अमान्य IFSC कोड'],
  saved: ['Saved successfully', 'सफलतापूर्वक सहेजा गया'], deleted: ['Record deleted', 'रिकॉर्ड हटाया गया'], updated: ['Updated', 'अद्यतन हुआ'],
  confirmDelete: ['Delete this record?', 'यह रिकॉर्ड हटाएँ?'], confirmDeleteText: ['This action cannot be undone.', 'यह कार्रवाई वापस नहीं की जा सकती।'],
  printReport: ['Print report', 'रिपोर्ट प्रिंट करें'], submittedBy: ['Submitted by agent', 'जमा करने वाला एजेंट'], directEntry: ['Direct (office)', 'सीधे (कार्यालय)'],
  // dashboard
  dashTitle: ['Foundation Management System', 'फाउंडेशन मैनेजमेंट सिस्टम'],
  dashText: ['Marriage, Mayra, suraksha insurance, self-employment and girl-child upliftment — all in one workspace.', 'कन्या विवाह, मायरा, सुरक्षा बीमा, स्वरोजगार व बालिका उत्थान — सब एक ही कार्यक्षेत्र में।'],
  statTotal: ['Total applications', 'कुल आवेदन'], statApproved: ['Approved / completed', 'स्वीकृत / पूर्ण'], statPending: ['Pending review', 'लंबित समीक्षा'],
  statDisbursed: ['Aid disbursed', 'वितरित सहायता'], statAgents: ['Active agents', 'सक्रिय एजेंट'], statEmi: ['EMI & premium collected', 'ईएमआई व प्रीमियम संकलन'],
  recentApps: ['Recent applications', 'हालिया आवेदन'], recentTxns: ['Recent transactions', 'हालिया लेनदेन'], viewAll: ['View all', 'सभी देखें'],
  ledgerBtn: ['Open ledger', 'भुगतान बही'], byScheme: ['Applications by scheme', 'योजनावार आवेदन'], cashflow: ['Cash flow · last 6 months', 'नकद प्रवाह · पिछले 6 महीने'],
  incoming: ['Collected', 'आवक'], outgoing: ['Disbursed', 'जावक'], noChart: ['Charts appear once you record applications and payments.', 'आवेदन और भुगतान दर्ज होने पर चार्ट दिखेंगे।'],
  myStats: ['Your activity', 'आपकी गतिविधि'],
  // columns reused
  amount: ['Amount', 'राशि'], date: ['Date', 'दिनांक'], scheme: ['Scheme', 'योजना'], type: ['Type', 'प्रकार'], mode: ['Mode / Ref', 'माध्यम / संदर्भ'],
  txnNo: ['Txn no.', 'लेनदेन सं.'], party: ['Beneficiary / Party', 'लाभार्थी / पक्ष'], applicant: ['Applicant', 'आवेदक'], appId: ['Application', 'आवेदन सं.'],
  dirIn: ['Incoming', 'आवक'], dirOut: ['Outgoing', 'जावक'], dateTime: ['Date & time', 'दिनांक व समय'],
  // loan
  recordEmi: ['Record EMI', 'ईएमआई दर्ज करें'], emiAmount: ['EMI amount', 'ईएमआई राशि'], paidBal: ['Paid / Balance', 'जमा / शेष'],
  emiOver: ['Amount exceeds the outstanding balance.', 'राशि बकाया शेष से अधिक है।'], emiPerMonth: ['/ month', '/ माह'],
  paidLbl: ['Paid', 'जमा'], balLbl: ['Balance', 'शेष'], payMode: ['Payment mode', 'भुगतान माध्यम'], refNo: ['Reference no.', 'संदर्भ सं.'],
  // agents
  grant: ['Grant access', 'अनुमति दें'], suspend: ['Suspend', 'रोकें'], payCommission: ['Pay commission', 'कमिशन भुगतान'],
  commGenerated: ['Commission generated', 'कुल सृजित कमिशन'], commPaid: ['Commission paid', 'कुल भुगतान किया गया'], commPending: ['Commission pending', 'कुल देय कमिशन'],
  rates: ['Commission rates', 'कमिशन दरें'], ratesText: ['Flat commission an agent earns for each approved record of a scheme. Rates start at ₹0 until you set them.', 'किसी योजना के प्रत्येक स्वीकृत रिकॉर्ड पर एजेंट को मिलने वाला निश्चित कमिशन। दरें तय होने तक ₹0 रहती हैं।'],
  saveRates: ['Save rates', 'दरें सहेजें'], editRates: ['Edit rates', 'दरें बदलें'], selectAgent: ['Select agent', 'एजेंट चुनें'],
  payoutExceeds: ['Amount exceeds pending commission.', 'राशि देय कमिशन से अधिक है।'], pendingLbl: ['Pending', 'देय'],
  noAgents: ['Register an agent first.', 'पहले एजेंट पंजीकृत करें।'], permLevel: ['Permission level', 'अनुमति स्तर'],
  agentPassword: ['Login password', 'लॉगिन पासवर्ड'], agentPasswordHint: ['The agent signs in with mobile number + this password.', 'एजेंट मोबाइल नंबर + इस पासवर्ड से लॉगिन करेगा।'],
  // receipts
  receiptNo: ['Receipt no.', 'रसीद सं.'], authSign: ['Authorised signatory', 'अधिकृत हस्ताक्षरकर्ता'], recvSign: ['Recipient signature', 'प्राप्तकर्ता हस्ताक्षर'],
  ackSlip: ['Acknowledgement slip', 'पावती पर्ची'], receiptT: ['Official receipt', 'आधिकारिक रसीद'], printed: ['Printed', 'प्रिंट दिनांक'],
} as const satisfies Record<string, Pair>

export type UIKey = keyof typeof UI

interface LangCtx {
  lang: Lang
  setLang: (l: Lang) => void
  t: (k: UIKey) => string
  L: (p: Pair | string) => string
}
const Ctx = createContext<LangCtx | null>(null)

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('fm_lang') as Lang) || 'en' } catch { return 'en' }
  })
  useEffect(() => { document.documentElement.lang = lang }, [lang])
  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try { localStorage.setItem('fm_lang', l) } catch { /* storage unavailable */ }
  }, [])
  const value = useMemo<LangCtx>(() => {
    const L = (p: Pair | string) => (typeof p === 'string' ? p : lang === 'hi' ? p[1] || p[0] : p[0])
    return { lang, setLang, L, t: (k) => L(UI[k]) }
  }, [lang, setLang])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLang must be used inside LangProvider')
  return c
}

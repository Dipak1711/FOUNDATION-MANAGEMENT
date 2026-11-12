import type { ReactNode } from 'react'
import {
  Award, Banknote, Bike, Briefcase, Coins, Gift, Heart, Layers, Receipt as ReceiptIcon, Scissors,
  ShieldCheck, Sparkles, type LucideIcon,
} from 'lucide-react'
import type { BaseRecord, CollectionName, FieldDef, Lang, Pair, Status } from '@/types'
import type { ReceiptData } from '@/components/ui/Receipt'
import { StatusBadge } from '@/components/ui/Badge'
import { fmtDate, inr, num, today } from '@/lib/utils'

export type Row = BaseRecord & Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

export interface Ctx {
  L: (p: Pair | string) => string
  lang: Lang
  rows: (c: CollectionName) => BaseRecord[]
  agentName: (id?: string) => string
}

export interface ColumnDef {
  key: string
  h: Pair
  r: (row: Row, ctx: Ctx) => ReactNode
  csv?: (row: Row, ctx: Ctx) => unknown
  align?: 'right'
}

export type Group = 'schemes' | 'agents' | 'bulk' | 'finance'

export interface ModuleDef {
  id: string
  group: Group
  icon: LucideIcon
  title: Pair
  desc: Pair
  coll: CollectionName
  prefix: string
  /** application = approval workflow · payment = disbursal/receipt entry · collection = bulk EMI batch */
  kind: 'application' | 'payment' | 'collection'
  addLabel: Pair
  formTitle: Pair
  fields: FieldDef[]
  defaultStatus: Status
  /** Approval workflow. Absent for entries that are final on creation. */
  flow?: { approveLabel: Pair; approveStatus: Status; statuses: Status[] }
  columns: ColumnDef[]
  print?: { label: Pair; build: (row: Row, ctx: Ctx) => ReceiptData }
  /** Short scheme name used in the ledger. */
  short: Pair
  /** Money movement for the unified ledger. */
  txn?: (row: Row) => { dir: 'in' | 'out'; party: string; amount: number; mode: string }
  /** Records created here can be attributed to a field agent (and earn commission). */
  agentLinked?: boolean
  /** Name of the amount field, used for dashboard roll-ups. */
  extra?: 'loanEmi'
}

/* ---------- small helpers ---------- */
const pair = (en: string, hi: string): Pair => [en, hi]
const opt = (v: string, en: string, hi: string) => [v, en, hi] as const
const text = (name: string, en: string, hi: string, o: Partial<FieldDef> = {}): FieldDef => ({ name, label: [en, hi], required: true, ...o })
const mobile = (): FieldDef => text('mobile', 'Mobile number', 'मोबाइल नंबर', { type: 'tel', valid: 'mobile', ph: ['10-digit mobile', '10 अंकों का मोबाइल'] })
const aadhaar = (required = false): FieldDef => text('aadhaar', 'Aadhaar number', 'आधार नंबर', { required, valid: 'aadhaar', ph: ['XXXX XXXX XXXX', 'XXXX XXXX XXXX'] })
const money = (name: string, en: string, hi: string, def?: number): FieldDef => text(name, en, hi, { type: 'number', valid: 'amount', def })
const date = (name: string, en: string, hi: string, def?: () => string): FieldDef => text(name, en, hi, { type: 'date', def })
const mode = (options: ReadonlyArray<readonly [string, string, string]>): FieldDef =>
  text('paymentMode', 'Payment mode', 'भुगतान माध्यम', { type: 'select', options, def: options[0][0] })
const col = (key: string, h: Pair, r: ColumnDef['r'], extra: Partial<ColumnDef> = {}): ColumnDef => ({ key, h, r, ...extra })

const main = (a: ReactNode, b?: ReactNode) => (
  <>
    <div className="max-w-36 truncate font-semibold">{a}</div>
    {b ? <div className="mt-px max-w-36 truncate text-xs text-ink-500">{b}</div> : null}
  </>
)
const id = (row: Row) => <span className="whitespace-nowrap font-bold tabular-nums text-brand-700">{row.id}</span>
const amt = (v: unknown) => <span className="whitespace-nowrap font-bold tabular-nums">{inr(v)}</span>
const status = (row: Row) => <StatusBadge status={row.status} />
const statusCol = col('status', ['Status', 'स्थिति'], status, { csv: (r) => r.status })
const idCol = (h: Pair = ['ID', 'आईडी']) => col('id', h, id, { csv: (r) => r.id })
const dateCol = (key: string, h: Pair, field = 'date') => col(key, h, (r, c) => fmtDate(r[field] || r.createdAt, c.lang), { csv: (r) => r[field] || r.createdAt })
const modeCol = col('mode', ['Mode / Ref', 'माध्यम / संदर्भ'], (r) => main(r.paymentMode, r.utrNo || r.transactionId || r.bankRef || r.receiptBatch), {
  csv: (r) => `${r.paymentMode ?? ''} ${r.utrNo || r.transactionId || ''}`.trim(),
})
const agentCol = col('agent', ['Agent', 'एजेंट'], (r, c) => (r.agentId ? c.agentName(r.agentId) : <span className="text-ink-400">—</span>), { csv: (r, c) => c.agentName(r.agentId) })

const bankModes = [opt('Bank Transfer (NEFT)', 'Bank transfer (NEFT / RTGS)', 'बैंक ट्रांसफर (NEFT / RTGS)'), opt('Cheque', 'Cheque', 'चेक'), opt('Direct Cash', 'Cash', 'नकद'), opt('UPI', 'UPI', 'UPI')]

const ack = (title: Pair, rows: (r: Row, c: Ctx) => Array<[string, string]>, amount?: (r: Row) => number): ModuleDef['print'] => ({
  label: ['Slip', 'पर्ची'],
  build: (r, c) => ({ title: c.L(title), no: r.id, rows: rows(r, c), amount: amount?.(r) }),
})

/* ============================================================
   MODULES
   ============================================================ */
export const MODULES: ModuleDef[] = [
  /* ---------------- Schemes: applications & payments ---------------- */
  {
    id: 'marriage-app', group: 'schemes', icon: Heart, coll: 'marriage', prefix: 'MRG', kind: 'application', agentLinked: true,
    title: pair('General Marriage Application', 'सामान्य आवेदन'),
    desc: pair('Register and approve new applications under the marriage assistance scheme.', 'विवाह सहायता योजना अंतर्गत नए आवेदन पंजीकरण एवं स्वीकृति।'),
    short: pair('Marriage', 'विवाह'), addLabel: pair('New marriage application', 'नया विवाह आवेदन'), formTitle: pair('New marriage application', 'नया विवाह आवेदन पत्र'),
    defaultStatus: 'Pending', flow: { approveLabel: pair('Approve', 'स्वीकृत'), approveStatus: 'Approved', statuses: ['Pending', 'Approved', 'Rejected'] },
    fields: [
      { ...text('brideName', 'Bride name', 'दुल्हन का नाम'), section: ['Family details', 'परिवार विवरण'] },
      text('groomName', 'Groom name', 'दूल्हे का नाम'), text('fatherName', "Father / guardian's name", 'पिता / संरक्षक का नाम'), mobile(), aadhaar(),
      { ...date('marriageDate', 'Marriage date', 'विवाह तिथि'), section: ['Event & address', 'कार्यक्रम व पता'] },
      text('village', 'Village / town', 'गाँव / शहर'), text('district', 'District', 'जिला'), money('amountRequested', 'Amount requested', 'मांगी गई राशि', 51000),
      { ...text('bankName', 'Bank name', 'बैंक का नाम', { required: false, ph: ['SBI / PNB / Bank of Baroda', 'SBI / PNB / बैंक ऑफ बड़ौदा'] }), section: ['Bank details', 'बैंक विवरण'] },
      text('accountNo', 'Account number', 'खाता संख्या', { required: false }), text('ifsc', 'IFSC code', 'IFSC कोड', { required: false, valid: 'ifsc' }),
    ],
    columns: [
      idCol(),
      col('bride', ['Bride & family', 'दुल्हन व परिवार'], (r, c) => main(r.brideName, `${c.L(['Groom', 'वर'])}: ${r.groomName} · ${c.L(['Father', 'पिता'])}: ${r.fatherName}`), { csv: (r) => r.brideName }),
      col('contact', ['Mobile & place', 'मोबाइल व पता'], (r) => main(r.mobile, r.village === r.district ? r.village : `${r.village}, ${r.district}`), { csv: (r) => r.mobile }),
      dateCol('mdate', ['Marriage date', 'विवाह तिथि'], 'marriageDate'),
      col('amt', ['Requested', 'मांगी गई राशि'], (r) => amt(r.amountRequested), { csv: (r) => r.amountRequested }),
      agentCol, statusCol,
    ],
    print: {
      label: ['Certificate', 'प्रमाण पत्र'],
      build: (r, c) => ({
        title: c.L(['Marriage assistance certificate', 'विवाह सहायता प्रमाण पत्र']), no: r.id, amount: num(r.amountRequested),
        rows: [[c.L(['Bride', 'दुल्हन']), r.brideName], [c.L(['Groom', 'दूल्हा']), r.groomName], [c.L(["Father / guardian", 'पिता / संरक्षक']), r.fatherName], [c.L(['Marriage date', 'विवाह तिथि']), fmtDate(r.marriageDate, c.lang)], [c.L(['Status', 'स्थिति']), r.status ?? '']],
        note: c.L(['This is to certify that the above application has been registered with the foundation under the marriage assistance scheme.', 'प्रमाणित किया जाता है कि उक्त आवेदन फाउंडेशन की विवाह सहायता योजना के अंतर्गत पंजीकृत किया गया है।']),
      }),
    },
  },
  {
    id: 'marriage-pay', group: 'schemes', icon: Gift, coll: 'marriagePay', prefix: 'MPY', kind: 'payment',
    title: pair('Marriage Congratulations Payment', 'विवाह फॉर्म आवेदन पत्र'),
    desc: pair('Issue congratulation letters and record disbursal of the assistance amount.', 'विवाह बधाई पत्र जारी करना एवं सहायता राशि का संवितरण।'),
    short: pair('Marriage payment', 'विवाह भुगतान'), addLabel: pair('Record payment', 'बधाई भुगतान दर्ज करें'), formTitle: pair('Record marriage payment', 'बधाई भुगतान दर्ज करें'),
    defaultStatus: 'Paid',
    fields: [text('beneficiaryName', 'Beneficiary name', 'लाभार्थी का नाम'), text('relation', 'Relation', 'संबंध', { required: false, def: 'Daughter (Bride)' }), money('amount', 'Amount', 'राशि', 51000), date('date', 'Payment date', 'भुगतान तिथि', today),
      mode(bankModes), text('utrNo', 'UTR / cheque number', 'UTR / चेक नंबर', { required: false })],
    columns: [
      idCol(['Payment ID', 'भुगतान आईडी']), col('who', ['Beneficiary', 'लाभार्थी'], (r) => main(r.beneficiaryName, r.relation), { csv: (r) => r.beneficiaryName }),
      col('cert', ['Certificate no.', 'बधाई पत्र सं.'], (r) => <span className="font-semibold tabular-nums">BDH-{r.id.split('-')[1]}</span>),
      col('amt', ['Disbursed', 'संवितरित राशि'], (r) => amt(r.amount), { csv: (r) => r.amount }), dateCol('date', ['Date', 'तिथि']), modeCol, statusCol,
    ],
    print: {
      label: ['Certificate', 'पत्र'],
      build: (r, c) => ({
        title: c.L(['Congratulation letter', 'बधाई पत्र']), no: `BDH-${r.id.split('-')[1]}`, amount: num(r.amount),
        rows: [[c.L(['Beneficiary', 'लाभार्थी']), r.beneficiaryName], [c.L(['Date', 'तिथि']), fmtDate(r.date, c.lang)], [c.L(['Mode', 'माध्यम']), `${r.paymentMode}${r.utrNo ? ' · ' + r.utrNo : ''}`]],
        note: c.L(['Congratulations on this auspicious occasion. The foundation extends its blessings and the above assistance.', 'इस शुभ अवसर पर हार्दिक बधाई। फाउंडेशन की ओर से आशीर्वाद सहित उक्त सहायता राशि भेंट की गई।']),
      }),
    },
    txn: (r) => ({ dir: 'out', party: r.beneficiaryName, amount: num(r.amount), mode: r.paymentMode }),
  },
  {
    id: 'sewing-dist', group: 'schemes', icon: Scissors, coll: 'sewing', prefix: 'SEW', kind: 'application', agentLinked: true,
    title: pair('Sewing Machine Distribution', 'विवाह सिलाई मशीन वितरण'), desc: pair('Free sewing machines to girls and women for self-reliance.', 'स्वावलंबन हेतु निःशुल्क सिलाई मशीन वितरण योजना।'),
    short: pair('Sewing machine', 'सिलाई मशीन'), addLabel: pair('New sewing machine application', 'नया सिलाई मशीन आवेदन'), formTitle: pair('Sewing machine distribution application', 'निःशुल्क सिलाई मशीन वितरण आवेदन'),
    defaultStatus: 'Pending', flow: { approveLabel: pair('Mark distributed', 'वितरित करें'), approveStatus: 'Distributed', statuses: ['Pending', 'Distributed', 'Rejected'] },
    fields: [text('applicantName', 'Applicant name', 'आवेदिका का नाम'), text('husbandFatherName', "Husband / father's name", 'पति / पिता का नाम'), mobile(), aadhaar(), text('address', 'Address', 'पता', { full: true }),
      text('category', 'Category', 'श्रेणी', { type: 'select', def: 'BPL / EWS', options: [opt('BPL / EWS', 'BPL / EWS', 'BPL / EWS'), opt('Widow / Orphan', 'Widow / Orphan', 'विधवा / अनाथ'), opt('Divyang', 'Divyang', 'दिव्यांग'), opt('General', 'General', 'सामान्य')] }),
      text('trainingReceived', 'Training received', 'प्रशिक्षण प्राप्त', { type: 'select', def: 'Yes', options: [opt('Yes', 'Yes (SHG / ITI / certificate)', 'हाँ (SHG / ITI / प्रमाणपत्र)'), opt('Basic Experience', 'Basic experience', 'बुनियादी अनुभव')] }),
      text('machineSerialNo', 'Machine serial number', 'सिलाई मशीन क्रमांक', { required: false, ph: ['e.g. USHA-2024-XXXX', 'उदा. USHA-2024-XXXX'] })],
    columns: [idCol(['Application', 'आवेदन सं.']), col('who', ['Applicant', 'आवेदिका'], (r) => main(r.applicantName, r.husbandFatherName), { csv: (r) => r.applicantName }),
      col('contact', ['Contact & address', 'संपर्क व पता'], (r) => main(r.mobile, r.address), { csv: (r) => r.mobile }),
      col('cat', ['Category', 'श्रेणी'], (r) => r.category), col('serial', ['Machine no.', 'मशीन क्रमांक'], (r) => r.machineSerialNo || '—'), agentCol, statusCol],
    print: ack(pair('Sewing machine acknowledgement', 'सिलाई मशीन पावती'), (r) => [['Applicant', r.applicantName], ['Mobile', r.mobile], ['Category', r.category], ['Machine no.', r.machineSerialNo || '—'], ['Status', r.status ?? '']]),
  },
  {
    id: 'mayra-app', group: 'schemes', icon: Sparkles, coll: 'mayra', prefix: 'MYR', kind: 'application', agentLinked: true,
    title: pair('Mayra General Application', 'मायरा फॉर्म आवेदन पत्र'), desc: pair('Application and verification for the Bhaat / Mayra social assistance scheme.', 'भात / मायरा सामाजिक सहायता योजना आवेदन व सत्यापन।'),
    short: pair('Mayra', 'मायरा'), addLabel: pair('New Mayra application', 'नया मायरा आवेदन'), formTitle: pair('Mayra (Bhaat) scheme application', 'मायरा (भात) योजना - आवेदन पत्र'),
    defaultStatus: 'Pending', flow: { approveLabel: pair('Approve', 'स्वीकृत'), approveStatus: 'Approved', statuses: ['Pending', 'Approved', 'Rejected'] },
    fields: [text('sisterName', 'Sister name', 'बहन का नाम'), text('brotherMamaName', "Brother / maternal uncle's name", 'भाई / मामा का नाम'), text('gotra', 'Gotra', 'गोत्र'), mobile(), aadhaar(),
      date('eventDate', 'Event date', 'कार्यक्रम तिथि'), text('village', 'Village', 'गाँव'), money('requestedAmount', 'Assistance amount', 'सहायता राशि', 21000)],
    columns: [idCol(['Application', 'आवेदन आईडी']), col('who', ['Sister & brother', 'बहन व भाई/मामा'], (r) => main(r.sisterName, r.brotherMamaName), { csv: (r) => r.sisterName }),
      col('gotra', ['Gotra', 'गोत्र'], (r) => r.gotra), col('contact', ['Contact & village', 'संपर्क व गाँव'], (r) => main(r.mobile, r.village), { csv: (r) => r.mobile }),
      dateCol('edate', ['Event date', 'कार्यक्रम तिथि'], 'eventDate'), col('amt', ['Amount', 'सहायता राशि'], (r) => amt(r.requestedAmount), { csv: (r) => r.requestedAmount }), agentCol, statusCol],
    print: ack(pair('Mayra acknowledgement', 'मायरा पावती'), (r, c) => [['Sister', r.sisterName], ['Brother / uncle', r.brotherMamaName], ['Gotra', r.gotra], ['Event date', fmtDate(r.eventDate, c.lang)], ['Status', r.status ?? '']], (r) => num(r.requestedAmount)),
  },
  {
    id: 'mayra-pay', group: 'schemes', icon: Award, coll: 'mayraPay', prefix: 'MYP', kind: 'payment',
    title: pair('Mayra Congratulations Payment', 'मायरा बधाई पत्र'), desc: pair('Distribute Mayra letters, silver coin and clothing kits.', 'मायरा बधाई पत्र, चांदी सिक्का व पोशाक किट संवितरण।'),
    short: pair('Mayra payment', 'मायरा भुगतान'), addLabel: pair('Record Mayra payment', 'मायरा बधाई भुगतान दर्ज करें'), formTitle: pair('Mayra letter & disbursal', 'मायरा बधाई पत्र व संवितरण प्रविष्टि'),
    defaultStatus: 'Paid',
    fields: [text('sisterName', 'Sister name', 'बहन का नाम'), text('brotherMamaName', 'Brother / maternal uncle', 'भाई / मामा का नाम'), money('amount', 'Amount', 'राशि', 21000), date('date', 'Date', 'तिथि', today),
      text('badhaiItems', 'Gift items', 'उपहार सामग्री', { required: false, def: 'Silver Coin + Poshak + Cash' }),
      mode([opt('Direct Cash & Kit', 'Cash & kit', 'नकद व किट'), opt('Bank Transfer', 'Bank transfer', 'बैंक ट्रांसफर')])],
    columns: [idCol(['Payment ID', 'भुगतान आईडी']), col('who', ['Sister / brother', 'बहन / भाई'], (r) => main(r.sisterName, r.brotherMamaName), { csv: (r) => r.sisterName }),
      col('cert', ['Letter no.', 'पत्र सं.'], (r) => <span className="font-semibold tabular-nums">MBD-{r.id.split('-')[1]}</span>),
      col('amt', ['Disbursed', 'संवितरित राशि'], (r) => amt(r.amount), { csv: (r) => r.amount }), col('items', ['Gift items', 'उपहार सामग्री'], (r) => r.badhaiItems || '—'), dateCol('date', ['Date', 'तिथि']), statusCol],
    print: ack(pair('Mayra congratulation letter', 'मायरा बधाई पत्र'), (r, c) => [['Sister', r.sisterName], ['Brother / uncle', r.brotherMamaName], ['Gift items', r.badhaiItems], ['Date', fmtDate(r.date, c.lang)]], (r) => num(r.amount)),
    txn: (r) => ({ dir: 'out', party: r.sisterName, amount: num(r.amount), mode: r.paymentMode }),
  },
  {
    id: 'bima-app', group: 'schemes', icon: ShieldCheck, coll: 'bima', prefix: 'PBF-SB', kind: 'application', agentLinked: true,
    title: pair('Insurance (Bima) Application', 'सुरक्षा बीमा हेतु सामान्य आवेदन'), desc: pair('Foundation suraksha cover and girl-child life-insurance policy applications.', 'फाउंडेशन सुरक्षा कवच व बालिका जीवन बीमा पॉलिसी आवेदन।'),
    short: pair('Bima', 'बीमा'), addLabel: pair('New insurance application', 'नया बीमा आवेदन'), formTitle: pair('Suraksha Bima — policy application', 'सुरक्षा बीमा योजना - पॉलिसी आवेदन'),
    defaultStatus: 'Pending', flow: { approveLabel: pair('Approve', 'स्वीकृत'), approveStatus: 'Approved', statuses: ['Pending', 'Approved', 'Rejected'] },
    fields: [text('policyHolder', 'Policy holder', 'बीमाधारक का नाम'), text('fatherHusband', "Father / husband's name", 'पिता / पति का नाम'), date('dob', 'Date of birth', 'जन्मतिथि'), mobile(), aadhaar(),
      text('planType', 'Plan type', 'पॉलिसी प्लान', { type: 'select', def: 'Suraksha Kavach (₹2,00,000)', options: [opt('Suraksha Kavach (₹2,00,000)', 'Suraksha Kavach (₹2,00,000 cover)', 'सुरक्षा कवच (₹2,00,000 कवर)'), opt('Balika Suraksha Golden (₹5,00,000)', 'Balika Suraksha Golden (₹5,00,000 cover)', 'बालिका सुरक्षा गोल्डन (₹5,00,000 कवर)')] }),
      money('yearlyPremium', 'Yearly premium', 'वार्षिक प्रीमियम', 500),
      { ...text('nomineeName', 'Nominee name', 'नॉमिनी का नाम'), section: ['Nominee', 'नॉमिनी'] }, text('nomineeRelation', 'Nominee relation', 'नॉमिनी से संबंध', { ph: ['Son / husband / mother', 'पुत्र / पति / माता'] })],
    columns: [idCol(['Policy ID', 'पॉलिसी आईडी']), col('who', ['Policy holder', 'बीमाधारक'], (r) => main(r.policyHolder, r.fatherHusband), { csv: (r) => r.policyHolder }),
      col('contact', ['Mobile & DOB', 'मोबाइल व जन्मतिथि'], (r, c) => main(r.mobile, fmtDate(r.dob, c.lang)), { csv: (r) => r.mobile }), col('plan', ['Plan', 'प्लान'], (r) => r.planType),
      col('prem', ['Yearly premium', 'वार्षिक प्रीमियम'], (r) => amt(r.yearlyPremium), { csv: (r) => r.yearlyPremium }), col('nom', ['Nominee', 'नॉमिनी'], (r) => main(r.nomineeName, r.nomineeRelation), { csv: (r) => r.nomineeName }), agentCol, statusCol],
    print: {
      label: ['Policy card', 'पॉलिसी कार्ड'],
      build: (r, c) => ({ title: c.L(['Suraksha Bima policy card', 'सुरक्षा बीमा पॉलिसी कार्ड']), no: r.id, amount: num(r.yearlyPremium), signLeft: c.L(['Policy holder', 'बीमाधारक']),
        rows: [['Policy holder', r.policyHolder], ['Plan', r.planType], ['Date of birth', fmtDate(r.dob, c.lang)], ['Nominee', `${r.nomineeName} (${r.nomineeRelation})`], ['Status', r.status ?? '']] }),
    },
  },
  {
    id: 'bima-pay', group: 'schemes', icon: ReceiptIcon, coll: 'bimaPay', prefix: 'BPR', kind: 'payment',
    title: pair('Insurance Premium Payment', 'सुरक्षा बीमा योजना'), desc: pair('Collect premiums and issue official policy receipts.', 'बीमा प्रीमियम संकलन एवं आधिकारिक पॉलिसी रसीद।'),
    short: pair('Bima premium', 'बीमा प्रीमियम'), addLabel: pair('Record premium', 'प्रीमियम भुगतान दर्ज करें'), formTitle: pair('Record premium payment', 'बीमा प्रीमियम भुगतान प्रविष्टि'),
    defaultStatus: 'Paid',
    fields: [text('policyId', 'Policy number', 'पॉलिसी क्रमांक', { ph: ['PBF-SB-XXXX', 'PBF-SB-XXXX'] }), text('holderName', 'Policy holder name', 'बीमाधारक का नाम'), money('premiumAmount', 'Premium amount', 'प्रीमियम राशि', 500), date('date', 'Deposit date', 'जमा तिथि', today),
      mode([opt('UPI / PhonePe', 'UPI / PhonePe / GPay', 'UPI / PhonePe / GPay'), opt('Cash', 'Cash', 'नकद'), opt('Bank Deposit', 'Bank challan / NEFT', 'बैंक चालान / NEFT')]),
      text('transactionId', 'UPI / reference no.', 'UPI / संदर्भ सं.', { required: false })],
    columns: [idCol(['Receipt ID', 'रसीद आईडी']), col('pol', ['Policy no.', 'पॉलिसी क्र.'], (r) => <span className="font-semibold">{r.policyId}</span>), col('who', ['Holder', 'बीमाधारक'], (r) => r.holderName),
      col('amt', ['Premium', 'प्रीमियम राशि'], (r) => amt(r.premiumAmount), { csv: (r) => r.premiumAmount }), dateCol('date', ['Deposited', 'जमा तिथि']), modeCol, statusCol],
    print: ack(pair('Premium receipt', 'प्रीमियम रसीद'), (r, c) => [['Policy no.', r.policyId], ['Policy holder', r.holderName], ['Date', fmtDate(r.date, c.lang)], ['Mode', `${r.paymentMode}${r.transactionId ? ' · ' + r.transactionId : ''}`]], (r) => num(r.premiumAmount)),
    txn: (r) => ({ dir: 'in', party: r.holderName, amount: num(r.premiumAmount), mode: r.paymentMode }),
  },
  {
    id: 'cycle-dist', group: 'schemes', icon: Bike, coll: 'cycle', prefix: 'CYC', kind: 'application', agentLinked: true,
    title: pair('Free Cycle Distribution', 'निःशुल्क साइकिल वितरण'), desc: pair('Cycles and tricycles for girls with disability or long school commutes.', 'दिव्यांग एवं जरूरतमंद बालिकाओं को साइकिल / ट्राइसाइकिल वितरण।'),
    short: pair('Cycle', 'साइकिल'), addLabel: pair('New cycle application', 'नया साइकिल आवेदन'), formTitle: pair('Free cycle / tricycle application', 'निःशुल्क साइकिल / ट्राइसाइकिल आवेदन'),
    defaultStatus: 'Pending', flow: { approveLabel: pair('Mark distributed', 'वितरित करें'), approveStatus: 'Distributed', statuses: ['Pending', 'Distributed', 'Rejected'] },
    fields: [text('balikaName', 'Girl name', 'बालिका का नाम'), text('fatherName', "Father's name", 'पिता का नाम'), text('age', 'Age', 'आयु', { type: 'number', def: 15 }), text('schoolName', 'School / college', 'विद्यालय / कॉलेज'), mobile(), aadhaar(),
      text('disabilityOrNeed', 'Need / disability category', 'आवश्यकता / दिव्यांगता श्रेणी', { type: 'select', def: 'Physical Handicap 40%+', options: [opt('Physical Handicap 40%+', 'Physical disability 40%+ (locomotor)', 'शारीरिक दिव्यांगता 40%+'), opt('Long Distance Rural School (5+ KM)', 'Rural school 5+ km away', 'लंबी दूरी की ग्रामीण छात्रा (5+ KM)'), opt('Underprivileged Balika', 'Destitute / BPL student', 'निराश्रित / बीपीएल छात्रा')] }),
      text('cycleType', 'Cycle type', 'साइकिल प्रकार', { type: 'select', def: 'Standard Lady Bicycle', options: [opt('Standard Lady Bicycle', 'Lady bicycle (26T)', 'महिला साइकिल (26T)'), opt('Special Tricycle with Hand Pedals', 'Special hand-pedal tricycle', 'विशेष हैंड पेडल ट्राइसाइकिल')] })],
    columns: [idCol(['Application', 'आवेदन सं.']), col('who', ['Girl & age', 'बालिका व आयु'], (r, c) => main(r.balikaName, `${c.L(['Age', 'आयु'])} ${r.age} · ${r.fatherName}`), { csv: (r) => r.balikaName }),
      col('school', ['School / college', 'विद्यालय / कॉलेज'], (r) => main(r.schoolName, r.mobile), { csv: (r) => r.schoolName }), col('need', ['Need category', 'आवश्यकता श्रेणी'], (r) => r.disabilityOrNeed),
      col('type', ['Cycle', 'साइकिल'], (r) => r.cycleType), agentCol, statusCol],
    print: ack(pair('Cycle distribution acknowledgement', 'साइकिल वितरण पावती'), (r) => [['Girl', r.balikaName], ['School / college', r.schoolName], ['Cycle', r.cycleType], ['Status', r.status ?? '']]),
  },
  {
    id: 'loan-app', group: 'schemes', icon: Coins, coll: 'loan', prefix: 'LN', kind: 'application', agentLinked: true, extra: 'loanEmi',
    title: pair('Balika Loan Application', 'बालिका ऋण आवेदन फॉर्म'), desc: pair('Easy-instalment loans for higher education and self-employment.', 'उच्च शिक्षा एवं स्वरोजगार हेतु आसान किस्तों पर ऋण।'),
    short: pair('Loan', 'ऋण'), addLabel: pair('New loan application', 'बालिका ऋण आवेदन'), formTitle: pair('Balika self-reliance & education loan', 'बालिका स्वावलंबन व शिक्षा ऋण आवेदन'),
    defaultStatus: 'Pending', flow: { approveLabel: pair('Sanction', 'स्वीकृत'), approveStatus: 'Approved', statuses: ['Pending', 'Approved', 'Rejected'] },
    fields: [text('applicantName', 'Applicant name', 'आवेदिका का नाम'), text('fatherHusband', "Father / husband's name", 'पिता / पति का नाम'), text('purpose', 'Loan purpose', 'ऋण का उद्देश्य', { full: true, ph: ['Beauty parlour, tailoring centre, higher education…', 'ब्यूटी पार्लर, सिलाई केंद्र, उच्च शिक्षा…'] }), mobile(), aadhaar(),
      money('loanAmount', 'Loan amount', 'ऋण राशि', 30000),
      text('tenureMonths', 'Tenure', 'अवधि', { type: 'select', def: '12', options: ['6', '10', '12', '18'].map((m) => opt(m, `${m} months`, `${m} महीने`)) })],
    columns: [idCol(['Loan account', 'ऋण खाता क्र.']), col('who', ['Applicant', 'आवेदिका'], (r) => main(r.applicantName, `${r.mobile} · ${r.fatherHusband}`), { csv: (r) => r.applicantName }),
      col('purpose', ['Purpose', 'ऋण का उद्देश्य'], (r) => r.purpose), col('amt', ['Sanctioned', 'स्वीकृत राशि'], (r) => amt(r.loanAmount), { csv: (r) => r.loanAmount }),
      col('emi', ['EMI & tenure', 'ईएमआई व अवधि'], (r, c) => main(`${inr(Math.ceil(num(r.loanAmount) / num(r.tenureMonths)))} ${c.L(['/ month', '/ माह'])}`, `${r.tenureMonths} ${c.L(['months', 'महीने'])}`)),
      col('bal', ['Paid / balance', 'जमा / शेष'], (r, c) => {
        const paid = c.rows('loanEmi').filter((e) => e.loanId === r.id).reduce((s, e) => s + num(e.amount), 0)
        return main(inr(paid), `${c.L(['Balance', 'शेष'])} ${inr(num(r.loanAmount) - paid)}`)
      }), agentCol, statusCol],
    print: ack(pair('Loan acknowledgement', 'ऋण पावती'), (r) => [['Applicant', r.applicantName], ['Purpose', r.purpose], ['Tenure', `${r.tenureMonths} months`], ['Status', r.status ?? '']], (r) => num(r.loanAmount)),
  },
  {
    id: 'finance-app', group: 'schemes', icon: Briefcase, coll: 'aid', prefix: 'AID', kind: 'payment',
    title: pair('Financial Aid Payment', 'वित्त सहायता आवेदन'), desc: pair('Emergency medical and social-crisis relief grants.', 'आपातकालीन चिकित्सा व सामाजिक संकट निवारण अनुदान।'),
    short: pair('Financial aid', 'वित्त सहायता'), addLabel: pair('Record aid grant', 'सहायता अनुदान दर्ज करें'), formTitle: pair('Record financial aid sanction', 'वित्त सहायता संस्वीकृति प्रविष्टि'),
    defaultStatus: 'Paid',
    fields: [text('beneficiaryName', 'Beneficiary name', 'लाभार्थी का नाम'), text('fatherHusband', "Father / husband's name", 'पिता / पति का नाम', { required: false }), mobile(), text('needCategory', 'Need category', 'आवश्यकता प्रकार', { def: 'Medical / emergency aid' }),
      money('amountProvided', 'Amount provided', 'राशि', 10000), date('date', 'Sanction date', 'स्वीकृति तिथि', today),
      mode([opt('Direct Bank Transfer', 'Bank transfer', 'बैंक ट्रांसफर'), opt('Cash Support', 'Cash disbursal', 'नकद संवितरण')])],
    columns: [idCol(['Aid ID', 'सहायता आईडी']), col('who', ['Beneficiary', 'लाभार्थी'], (r) => main(r.beneficiaryName, r.fatherHusband), { csv: (r) => r.beneficiaryName }), col('mob', ['Mobile', 'मोबाइल'], (r) => r.mobile),
      col('need', ['Need', 'आवश्यकता'], (r) => r.needCategory), col('amt', ['Disbursed', 'संवितरित राशि'], (r) => amt(r.amountProvided), { csv: (r) => r.amountProvided }), dateCol('date', ['Sanctioned', 'स्वीकृति तिथि']), statusCol],
    print: ack(pair('Financial aid receipt', 'वित्त सहायता रसीद'), (r, c) => [['Beneficiary', r.beneficiaryName], ['Need', r.needCategory], ['Date', fmtDate(r.date, c.lang)], ['Mode', r.paymentMode]], (r) => num(r.amountProvided)),
    txn: (r) => ({ dir: 'out', party: r.beneficiaryName, amount: num(r.amountProvided), mode: r.paymentMode }),
  },

  /* ---------------- Bulk EMI collections ---------------- */
  bulk('bulk-marriage', 'bulkMarriage', 'BM', Layers, pair('Bulk Marriage EMI', 'बल्क विवाह ईएमआई'), pair('Group marriage contributions / EMI collected at cluster level.', 'क्षेत्रीय स्तर पर सामूहिक विवाह अंशदान / ईएमआई संकलन।'),
    pair('Marriage EMI', 'विवाह ईएमआई'), 'totalMembers', pair('Members', 'सदस्य'), 'totalAmount', 'bankRef', pair('Bank deposit ref', 'बैंक जमा संदर्भ'), 'DEP-XXXX', 10),
  bulk('bulk-bima', 'bulkBima', 'BB', ShieldCheck, pair('Bulk Suraksha Bima EMI', 'बल्क सुरक्षा बीमा ईएमआई'), pair('Group insurance premium collection and challan records.', 'सामूहिक सुरक्षा बीमा प्रीमियम संग्रह व चालान।'),
    pair('Bima EMI', 'बीमा ईएमआई'), 'totalPolicies', pair('Policies', 'पॉलिसियां'), 'totalPremium', 'receiptBatch', pair('Challan no.', 'चालान संख्या'), 'BATCH-BIMA-XXXX', 20),
  bulk('bulk-mayra', 'bulkMayra', 'BY', Banknote, pair('Bulk Mayra EMI', 'बल्क मायरा ईएमआई'), pair('Mayra group contributions and assistance collection.', 'मायरा सामूहिक अंशदान एवं सहायता संग्रह।'),
    pair('Mayra EMI', 'मायरा ईएमआई'), 'totalContributors', pair('Contributors', 'अंशदाता'), 'totalAmount', 'receiptBatch', pair('Batch ref', 'बैच संदर्भ'), 'BATCH-MYR-XXXX', 15),
]

/** Factory for the three structurally identical bulk-collection modules. */
function bulk(
  moduleId: string, coll: CollectionName, prefix: string, icon: LucideIcon, title: Pair, desc: Pair, short: Pair,
  countField: string, countLabel: Pair, amountField: string, refField: string, refLabel: Pair, refPh: string, defCount: number,
): ModuleDef {
  return {
    id: moduleId, group: 'bulk', icon, coll, prefix, kind: 'collection', agentLinked: true, title, desc, short,
    addLabel: pair('New bulk entry', 'नई बल्क प्रविष्टि'), formTitle: title, defaultStatus: 'Deposited',
    fields: [date('collectionDate', 'Collection date', 'संकलन तिथि', today), text('clusterArea', 'Cluster / panchayat', 'क्लस्टर / पंचायत'),
      text(countField, countLabel[0], countLabel[1], { type: 'number', valid: 'amount', def: defCount }), money(amountField, 'Total collected', 'कुल संकलित राशि', defCount * 1000),
      text(refField, refLabel[0], refLabel[1], { required: false, ph: [refPh, refPh] })],
    columns: [idCol(['Batch', 'बैच सं.']), dateCol('cd', ['Collected', 'संकलन तिथि'], 'collectionDate'), agentCol, col('area', ['Cluster', 'क्लस्टर / पंचायत'], (r) => r.clusterArea),
      col('cnt', countLabel, (r) => <span className="font-semibold tabular-nums">{r[countField]}</span>, { csv: (r) => r[countField] }),
      col('amt', ['Total', 'कुल राशि'], (r) => amt(r[amountField]), { csv: (r) => r[amountField] }), col('ref', refLabel, (r) => r[refField] || '—'), statusCol],
    print: ack(title, (r, c) => [['Collected on', fmtDate(r.collectionDate, c.lang)], ['Agent', c.agentName(r.agentId)], ['Cluster', r.clusterArea], [countLabel[0], String(r[countField])], ['Reference', r[refField] || '—']], (r) => num(r[amountField])),
    txn: (r) => ({ dir: 'in', party: `${r.clusterArea}`, amount: num(r[amountField]), mode: r[refField] || 'Deposit' }),
  }
}

export const MODULE_BY_ID = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<string, ModuleDef>
export const MODULE_BY_COLL = Object.fromEntries(MODULES.map((m) => [m.coll, m])) as Partial<Record<CollectionName, ModuleDef>>

/** Collections that carry an `agentId` and earn commission on completion. */
export const COMMISSION_COLLS: CollectionName[] = MODULES.filter((m) => m.agentLinked).map((m) => m.coll)

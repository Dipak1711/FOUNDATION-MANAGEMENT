/**
 * Demo dataset. Seeded on first load so the portal never opens empty in a client demo.
 * Records from the reference portal (Pooja Sharma, Geeta Devi, Anita Rawat, agents AGT-101…104 …)
 * are carried over; the rest is realistic filler in the same style. Dates are relative to "today"
 * so dashboards and charts always show recent activity.
 */
import type { CollectionName } from '@/types'
import { hashPw } from '@/lib/utils'

type Rec = Record<string, unknown>
interface DB {
  c: Partial<Record<CollectionName, Array<Rec & { id: string; createdAt: string }>>>
  seq: Partial<Record<CollectionName, number>>
  rates: Partial<Record<CollectionName, number>>
  admin: { username: string; name: string; hash: string }
}

const DAY = 864e5
const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * DAY).toISOString()
const ymd = (daysAgo: number) => iso(daysAgo).slice(0, 10)
const ahead = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10)
const pad = (n: number, w = 4) => String(n).padStart(w, '0')

export function buildSeed(): DB {
  const db: DB = { c: {}, seq: {}, rates: {}, admin: { username: 'admin', name: 'Mukesh Purbiya', hash: hashPw('admin123') } }
  const add = (coll: CollectionName, prefix: string, daysAgo: number, data: Rec) => {
    const n = (db.seq[coll] = (db.seq[coll] || 0) + 1)
    const rec = { id: `${prefix}-${1000 + n}`, createdAt: iso(daysAgo), ...data }
    ;(db.c[coll] = db.c[coll] || []).push(rec)
    return rec.id
  }
  let k = 0
  const pick = <T,>(a: readonly T[]) => a[k++ % a.length]
  const aadhaar = (i: number) => `${4000 + ((i * 137) % 5000)} ${1000 + ((i * 911) % 8999)} ${2000 + ((i * 523) % 7999)}`
  const mobile = (i: number) => `${['98', '97', '96', '94', '90', '82'][i % 6]}${pad(10000000 + ((i * 7919) % 89999999), 8)}`.slice(0, 10)

  /* ---------- agents (reference AGT-101…104 + two more) ---------- */
  const agentSeed = [
    ['Ramesh Kumar', '9876500001', 'Jaipur', 'Kotputli', 'Panchayat A, B, C', 'ramesh.agent@pbf.org', 640],
    ['Pooja Verma', '9876500002', 'Alwar', 'Behror', 'Ward 1 to 8', 'pooja.agent@pbf.org', 610],
    ['Sunil Joshi', '9876500003', 'Dausa', 'Bandikui', 'Rural Cluster 1', 'sunil.agent@pbf.org', 575],
    ['Vikram Rathore', '9876500004', 'Sikar', 'Neem Ka Thana', 'Ward 9 to 14', 'vikram.agent@pbf.org', 330],
    ['Kavita Choudhary', '9876500005', 'Rewari', 'Bawal', 'Gram Panchayat Bawal', 'kavita.agent@pbf.org', 260],
  ] as const
  const agentIds = agentSeed.map(([name, mob, district, block, pan, email, joined], i) => {
    const id = add('agents', 'AGT', joined, { name, mobile: mob, aadhaar: `${1234 + i * 1111} ${4321 + i * 1111} ${5678 + i * 1111}`, email, district, block, assignedPanchayats: pan, status: 'Active', permission: i === 2 ? 'View & Submit Only' : 'Full Access', hash: hashPw('agent123') })
    return id
  })
  add('agents', 'AGT', 4, { name: 'Anjali Meena', mobile: '9876500006', aadhaar: '6789 1234 5678', email: 'anjali.agent@pbf.org', district: 'Dausa', block: 'Lalsot', assignedPanchayats: 'Pending allocation', status: 'Pending', permission: 'Awaiting approval', hash: hashPw('agent123') })
  const ag = () => pick(agentIds)

  /* ---------- marriage applications ---------- */
  const brides = [
    ['Pooja Sharma', 'Rahul Verma', 'Suresh Sharma', 'Sonipat', 'Sonipat', 'State Bank of India', 'SBIN0001234'],
    ['Sunita Devi', 'Amit Singh', 'Mahesh Pal', 'Alwar', 'Alwar', 'Punjab National Bank', 'PUNB0123400'],
    ['Meena Kumari', 'Dinesh Meena', 'Ramswaroop Meena', 'Dausa', 'Dausa', 'Bank of Baroda', 'BARB0DAUSAX'],
    ['Laxmi Yadav', 'Mukesh Yadav', 'Hari Singh Yadav', 'Kotputli', 'Jaipur', 'State Bank of India', 'SBIN0004521'],
    ['Rekha Choudhary', 'Naresh Choudhary', 'Bhanwar Lal', 'Behror', 'Alwar', 'Bank of Baroda', 'BARB0BEHROR'],
    ['Savita Rajput', 'Vijay Rathore', 'Narendra Singh', 'Sikar', 'Sikar', 'HDFC Bank', 'HDFC0001147'],
    ['Kamla Gurjar', 'Bablu Gurjar', 'Ramdhan Gurjar', 'Bandikui', 'Dausa', 'State Bank of India', 'SBIN0007788'],
    ['Neha Saini', 'Ankit Saini', 'Pritam Saini', 'Rewari', 'Rewari', 'Punjab National Bank', 'PUNB0210500'],
    ['Durga Kumari', 'Hemraj Jat', 'Lichhma Ram', 'Neem Ka Thana', 'Sikar', 'Union Bank of India', 'UBIN0536741'],
    ['Santosh Bai', 'Kailash Prajapat', 'Mangi Lal', 'Shahpura', 'Jaipur', 'Bank of Baroda', 'BARB0SHAHPU'],
    ['Anita Kanwar', 'Pratap Singh', 'Gajender Singh', 'Mahendragarh', 'Mahendragarh', 'State Bank of India', 'SBIN0003365'],
    ['Poonam Jangid', 'Rakesh Jangid', 'Shyam Sundar', 'Kotputli', 'Jaipur', 'Punjab National Bank', 'PUNB0456200'],
    ['Radha Devi', 'Sanjay Gupta', 'Om Prakash Gupta', 'Behror', 'Alwar', 'HDFC Bank', 'HDFC0002290'],
    ['Manju Bala', 'Deepak Kumar', 'Satbir Singh', 'Narnaul', 'Mahendragarh', 'State Bank of India', 'SBIN0009911'],
  ] as const
  const mStatus = ['Approved', 'Approved', 'Approved', 'Pending', 'Approved', 'Approved', 'Rejected', 'Approved', 'Pending', 'Approved', 'Approved', 'Pending', 'Approved', 'Pending'] as const
  const marriageIds: string[] = []
  brides.forEach(([bride, groom, father, village, district, bank, ifsc], i) => {
    const days = 150 - i * 10
    marriageIds.push(add('marriage', 'MRG', days, {
      brideName: bride, groomName: groom, fatherName: father, mobile: i === 0 ? '9876543210' : mobile(i), aadhaar: aadhaar(i), marriageDate: ahead(30 + i * 9 - 120 + (i % 4) * 25),
      village, district, amountRequested: i % 3 === 1 ? 31000 : 51000, bankName: bank, accountNo: `${pad(10000000 + i * 3319713, 11)}`, ifsc, status: mStatus[i], agentId: agentIds[i % 3],
    }))
  })
  brides.forEach(([bride], i) => {
    if (mStatus[i] !== 'Approved' || i > 10) return
    add('marriagePay', 'MPY', 140 - i * 10 - 6, {
      beneficiaryName: bride, relation: 'Daughter (Bride)', amount: i % 3 === 1 ? 31000 : 51000, date: ymd(140 - i * 10 - 6),
      paymentMode: pick(['Bank Transfer (NEFT)', 'Bank Transfer (NEFT)', 'Cheque', 'UPI']), utrNo: i % 3 === 2 ? `CHQ-${654321 + i}` : `UTR${8947230198 + i * 3719}`, status: 'Paid',
    })
  })

  /* ---------- sewing machine ---------- */
  const sew = [
    ['Rekha Yadav', 'Rajender Yadav', 'Ward 4, Rewari', 'BPL / EWS', 'Yes', 'USHA-PRO-7842', 'Distributed'],
    ['Mamta Sharma', 'Kailash Sharma', 'Near Temple, Jhunjhunu', 'General', 'Yes', '', 'Pending'],
    ['Sarla Devi', 'Birbal Singh', 'Gram Kotputli, Jaipur', 'Widow / Orphan', 'Basic Experience', 'USHA-PRO-7851', 'Distributed'],
    ['Imarti Bai', 'Ghasi Ram', 'Ward 2, Behror', 'BPL / EWS', 'Yes', 'USHA-PRO-7860', 'Distributed'],
    ['Jyoti Kumari', 'Sohan Lal', 'Bandikui, Dausa', 'Divyang', 'Yes', '', 'Pending'],
    ['Phoolwati', 'Late Ramesh', 'Neem Ka Thana, Sikar', 'Widow / Orphan', 'Basic Experience', '', 'Rejected'],
    ['Seema Rani', 'Jagdish Prasad', 'Bawal, Rewari', 'BPL / EWS', 'Yes', 'USHA-PRO-7873', 'Distributed'],
    ['Guddi Devi', 'Mohan Lal', 'Shahpura, Jaipur', 'General', 'Basic Experience', '', 'Pending'],
  ] as const
  sew.forEach(([n, h, addr, cat, tr, serial, st], i) => add('sewing', 'SEW', 110 - i * 12, { applicantName: n, husbandFatherName: h, mobile: mobile(20 + i), aadhaar: aadhaar(20 + i), address: addr, category: cat, trainingReceived: tr, machineSerialNo: serial, status: st, agentId: ag() }))

  /* ---------- mayra ---------- */
  const mayra = [
    ['Geeta Devi', 'Vikram Singh', 'Purbiya / Rathore', 'Kotputli'], ['Radha Kumari', 'Govind Ram', 'Chauhan', 'Behror'], ['Sarita Devi', 'Mool Chand', 'Gurjar', 'Dausa'],
    ['Babita Kanwar', 'Bhawani Singh', 'Shekhawat', 'Sikar'], ['Kusum Lata', 'Hanuman Sahay', 'Meena', 'Bandikui'], ['Shanti Devi', 'Ratan Lal', 'Saini', 'Rewari'],
    ['Pushpa Rani', 'Girraj Prasad', 'Jangid', 'Shahpura'], ['Indra Devi', 'Chhotu Ram', 'Jat', 'Neem Ka Thana'], ['Mohini Bai', 'Prahlad Singh', 'Rajput', 'Narnaul'], ['Chanda Devi', 'Sohan Pal', 'Yadav', 'Bawal'],
  ] as const
  const myStatus = ['Approved', 'Approved', 'Approved', 'Pending', 'Approved', 'Approved', 'Pending', 'Approved', 'Rejected', 'Pending'] as const
  mayra.forEach(([s, b, g, v], i) => add('mayra', 'MYR', 125 - i * 11, { sisterName: s, brotherMamaName: b, gotra: g, mobile: mobile(40 + i), aadhaar: aadhaar(40 + i), eventDate: ahead(20 + i * 6 - 60), village: v, requestedAmount: 21000, status: myStatus[i], agentId: agentIds[(i + 1) % 4] }))
  ;[0, 1, 2, 4, 5].forEach((i, j) => add('mayraPay', 'MYP', 120 - i * 11 - 5 + j, { sisterName: mayra[i][0], brotherMamaName: mayra[i][1], amount: 21000, date: ymd(120 - i * 11 - 5 + j), badhaiItems: 'Silver Coin (10g) + Cash Assistance + Mayra Poshak', paymentMode: j % 2 ? 'Bank Transfer' : 'Direct Cash & Kit', status: 'Paid' }))

  /* ---------- bima + premiums ---------- */
  const bima = [
    ['Anita Rawat', 'Prakash Rawat', '1994-06-12', 'Suraksha Kavach (₹2,00,000)', 500, 'Rohit Rawat', 'Son'],
    ['Kavita Saini', 'Manoj Saini', '1998-09-22', 'Balika Suraksha Golden (₹5,00,000)', 1200, 'Manoj Saini', 'Husband'],
    ['Seema Chauhan', 'Rajveer Chauhan', '1991-03-04', 'Suraksha Kavach (₹2,00,000)', 500, 'Rajveer Chauhan', 'Husband'],
    ['Nirmala Devi', 'Shiv Charan', '1985-11-30', 'Suraksha Kavach (₹2,00,000)', 500, 'Pinki Kumari', 'Daughter'],
    ['Ritu Yadav', 'Satyaveer Yadav', '2001-01-17', 'Balika Suraksha Golden (₹5,00,000)', 1200, 'Satyaveer Yadav', 'Father'],
    ['Sunita Meena', 'Ramkesh Meena', '1989-07-08', 'Suraksha Kavach (₹2,00,000)', 500, 'Ramkesh Meena', 'Husband'],
    ['Pinky Sharma', 'Anil Sharma', '1996-12-25', 'Suraksha Kavach (₹2,00,000)', 500, 'Aarav Sharma', 'Son'],
    ['Mamta Jat', 'Dhanraj Jat', '1993-05-19', 'Balika Suraksha Golden (₹5,00,000)', 1200, 'Dhanraj Jat', 'Husband'],
    ['Kiran Bala', 'Sumer Singh', '1999-08-02', 'Suraksha Kavach (₹2,00,000)', 500, 'Sumer Singh', 'Father'],
    ['Lalita Gurjar', 'Mohan Gurjar', '1987-02-14', 'Suraksha Kavach (₹2,00,000)', 500, 'Rinku Gurjar', 'Son'],
    ['Bhanwari Devi', 'Late Kishna', '1980-10-10', 'Suraksha Kavach (₹2,00,000)', 500, 'Mahesh Kumar', 'Son'],
    ['Vandana Rajput', 'Karan Singh', '2000-04-28', 'Balika Suraksha Golden (₹5,00,000)', 1200, 'Karan Singh', 'Father'],
  ] as const
  const bStatus = ['Approved', 'Approved', 'Approved', 'Approved', 'Pending', 'Approved', 'Approved', 'Approved', 'Pending', 'Approved', 'Rejected', 'Pending'] as const
  bima.forEach(([h, f, dob, plan, prem, nom, rel], i) => {
    const days = 170 - i * 13
    const id = add('bima', 'PBF-SB', days, { policyHolder: h, fatherHusband: f, dob, mobile: mobile(60 + i), aadhaar: aadhaar(60 + i), planType: plan, yearlyPremium: prem, nomineeName: nom, nomineeRelation: rel, status: bStatus[i], agentId: agentIds[(i * 2) % 5] })
    if (bStatus[i] === 'Approved') add('bimaPay', 'BPR', days - 1, { policyId: id, holderName: h, premiumAmount: prem, date: ymd(days - 1), paymentMode: pick(['UPI / PhonePe', 'Cash', 'UPI / PhonePe', 'Bank Deposit']), transactionId: `UPI${9823412048 + i * 5197}`, status: 'Paid' })
  })

  /* ---------- cycle ---------- */
  const cyc = [
    ['Kiran Kumari', 'Babu Lal', 15, 'Govt Girls Sr Sec School, Kotputli', 'Physical Handicap 40%+', 'Special Tricycle with Hand Pedals', 'Distributed'],
    ['Priya Saini', 'Kishan Saini', 14, 'Govt High School, Behror', 'Long Distance Rural School (5+ KM)', 'Standard Lady Bicycle', 'Approved'],
    ['Komal Meena', 'Hari Ram', 16, 'Govt Girls School, Dausa', 'Underprivileged Balika', 'Standard Lady Bicycle', 'Distributed'],
    ['Nisha Gurjar', 'Ramdev', 13, 'Govt Upper Primary, Bandikui', 'Long Distance Rural School (5+ KM)', 'Standard Lady Bicycle', 'Pending'],
    ['Sonam Kanwar', 'Pappu Singh', 17, 'Govt Girls College, Sikar', 'Physical Handicap 40%+', 'Special Tricycle with Hand Pedals', 'Pending'],
    ['Anjali Jat', 'Mangal Ram', 15, 'Govt Sr Sec School, Neem Ka Thana', 'Underprivileged Balika', 'Standard Lady Bicycle', 'Distributed'],
    ['Pooja Prajapat', 'Dinesh Prajapat', 14, 'Govt High School, Shahpura', 'Long Distance Rural School (5+ KM)', 'Standard Lady Bicycle', 'Rejected'],
  ] as const
  cyc.forEach(([n, f, age, sch, need, type, st], i) => add('cycle', 'CYC', 100 - i * 11, { balikaName: n, fatherName: f, age, schoolName: sch, mobile: mobile(80 + i), aadhaar: aadhaar(80 + i), disabilityOrNeed: need, cycleType: type, status: st, agentId: ag() }))

  /* ---------- loans + EMIs ---------- */
  const loans = [
    ['Rani Tanwar', 'Deepak Tanwar', 'Beauty Parlour & Tailoring Startup', 50000, 12, 'Approved', 5],
    ['Sushila Sharma', 'Mohan Sharma', 'B.Ed College Higher Education Fees', 35000, 10, 'Approved', 2],
    ['Babli Yadav', 'Sukhbir Yadav', 'Dairy Unit (2 buffaloes)', 40000, 12, 'Approved', 4],
    ['Reena Kumari', 'Jaipal Singh', 'General Store Setup', 30000, 6, 'Approved', 6],
    ['Poonam Rani', 'Dalip Singh', 'Nursing Course Fees', 45000, 18, 'Pending', 0],
    ['Chitra Devi', 'Mahaveer Prasad', 'Sewing Centre Expansion', 25000, 10, 'Approved', 3],
    ['Manisha Jat', 'Ramavtar Jat', 'Computer Course & Equipment', 20000, 6, 'Pending', 0],
    ['Gita Rathore', 'Bhim Singh', 'Poultry Farm', 35000, 12, 'Rejected', 0],
  ] as const
  loans.forEach(([n, f, purpose, amt, ten, st, paidMonths], i) => {
    const days = Math.max(160 - i * 14, 30 * paidMonths + 25)
    const id = add('loan', 'LN', days, { applicantName: n, fatherHusband: f, purpose, mobile: mobile(100 + i), aadhaar: aadhaar(100 + i), loanAmount: amt, tenureMonths: String(ten), status: st, agentId: agentIds[(i + 2) % 5] })
    const emi = Math.ceil(amt / ten)
    for (let m = 0; m < paidMonths; m++) add('loanEmi', 'EMI', days - 30 * (m + 1), { loanId: id, borrower: n, amount: Math.min(emi, amt - emi * m), date: ymd(days - 30 * (m + 1)), paymentMode: pick(['Cash', 'UPI', 'Cash']) })
  })

  /* ---------- financial aid ---------- */
  ;[
    ['Shanti Bai', 'Late Ramu Ram', 'Medical Treatment & Child Nutrition', 15000, 'Direct Bank Transfer'], ['Kamlesh Devi', 'Late Hukam Chand', 'Emergency Surgery Support', 25000, 'Direct Bank Transfer'],
    ['Bimla Devi', 'Ganga Ram', 'Fire Damage Relief', 12000, 'Cash Support'], ['Roshni Bano', 'Late Salim Khan', 'Child Education Support', 8000, 'Direct Bank Transfer'],
    ['Santra Devi', 'Mool Singh', 'Medical Treatment', 10000, 'Cash Support'], ['Lakshmi Bai', 'Late Bhura Ram', 'Widow Pension Gap Support', 6000, 'Direct Bank Transfer'],
  ].forEach(([n, f, need, amt, mode], i) => add('aid', 'AID', 135 - i * 22, { beneficiaryName: n, fatherHusband: f, mobile: mobile(120 + i), needCategory: need, amountProvided: amt, date: ymd(135 - i * 22), paymentMode: mode, status: 'Paid' }))

  /* ---------- bulk EMI batches ---------- */
  const clusters = ['Kotputli Block – Panchayat A', 'Behror – Ward 1–4', 'Bandikui Rural Cluster 1', 'Neem Ka Thana – Ward 9', 'Bawal Gram Panchayat', 'Shahpura Cluster 2']
  clusters.forEach((cl, i) => {
    const d = 150 - i * 24
    add('bulkMarriage', 'BM', d, { collectionDate: ymd(d), clusterArea: cl, totalMembers: 18 + i * 4, totalAmount: (18 + i * 4) * 500, bankRef: `DEP-${4410 + i * 37}`, status: 'Deposited', agentId: agentIds[i % 5] })
    add('bulkBima', 'BB', d - 3, { collectionDate: ymd(d - 3), clusterArea: cl, totalPolicies: 22 + i * 5, totalPremium: (22 + i * 5) * 500, receiptBatch: `BATCH-BIMA-${210 + i}`, status: 'Deposited', agentId: agentIds[(i + 1) % 5] })
    add('bulkMayra', 'BY', d - 6, { collectionDate: ymd(d - 6), clusterArea: cl, totalContributors: 15 + i * 3, totalAmount: (15 + i * 3) * 400, receiptBatch: `BATCH-MYR-${310 + i}`, status: 'Deposited', agentId: agentIds[(i + 2) % 5] })
  })

  /* ---------- commission: ₹200 flat per completed record (the reference's effective rate) ---------- */
  const rateColls: CollectionName[] = ['marriage', 'sewing', 'mayra', 'bima', 'cycle', 'loan', 'bulkMarriage', 'bulkBima', 'bulkMayra']
  rateColls.forEach((c) => (db.rates[c] = 200))
  const done = new Set(['Approved', 'Distributed', 'Paid', 'Deposited'])
  const share = [1, 0.75, 0.6, 0, 0.5]
  agentIds.forEach((aid, i) => {
    const earned = rateColls.reduce((s, c) => s + (db.c[c] || []).filter((r) => r.agentId === aid && done.has(String(r.status))).length * 200, 0)
    const pay = Math.floor((earned * share[i]) / 100) * 100
    if (pay <= 0) return
    const first = Math.floor(pay / 2 / 100) * 100
    ;[[first, 70, 'Direct Bank NEFT'], [pay - first, 22, 'UPI']].forEach(([amount, d, mode]) => {
      if (amount) add('payouts', 'PAY', d as number, { agentId: aid, agentName: agentSeed[i][0], amount, date: ymd(d as number), paymentMode: mode, remarks: 'Commission settlement' })
    })
  })

  return db
}

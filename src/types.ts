export type Lang = 'en' | 'hi'
/** A bilingual label: [English, हिंदी]. */
export type Pair = readonly [string, string]

export type Role = 'admin' | 'agent'
export interface SessionUser {
  id: string
  role: Role
  name: string
}

export type Status =
  | 'Pending' | 'Approved' | 'Rejected' | 'Distributed' | 'Paid'
  | 'Deposited' | 'Active' | 'Inactive' | 'Suspended'

export interface BaseRecord {
  id: string
  createdAt: string
  status?: Status
  agentId?: string
  [key: string]: unknown
}

export type CollectionName =
  | 'marriage' | 'marriagePay' | 'sewing' | 'mayra' | 'mayraPay' | 'bima' | 'bimaPay'
  | 'cycle' | 'loan' | 'loanEmi' | 'aid' | 'agents' | 'payouts'
  | 'bulkMarriage' | 'bulkBima' | 'bulkMayra'

export interface Agent extends BaseRecord {
  name: string
  mobile: string
  email?: string
  district: string
  block: string
  assignedPanchayats?: string
  permission: string
  hash: string
}

export type FieldType = 'text' | 'tel' | 'number' | 'date' | 'email' | 'password' | 'select' | 'textarea'
export type Validator = 'mobile' | 'aadhaar' | 'email' | 'ifsc' | 'amount'

export interface FieldDef {
  name: string
  label: Pair
  type?: FieldType
  required?: boolean
  valid?: Validator
  def?: string | number | (() => string | number)
  ph?: Pair
  hint?: Pair
  full?: boolean
  section?: Pair
  options?: ReadonlyArray<readonly [string, string, string]>
}

export interface Txn {
  id: string
  date: string
  dir: 'in' | 'out'
  party: string
  scheme: Pair
  amount: number
  mode: string
}

export interface Rabbit {
  id: string
  rabbit_id: string // New: RB-001, RB-002, etc.
  name: string
  gender: "male" | "female"
  breed: string
  color: string
  birthDate: string
  weight: number
  hutch_id: string
  parentMale?: string
  parentFemale?: string
  isPregnant: boolean
  lastMatingDate?: string
  matedWith?: string
  expectedBirthDate?: string
  totalLitters: number
  totalKits: number
  healthRecords: HealthRecord[]
  feedingSchedule: FeedingSchedule
  createdAt?: string
}

export interface HealthRecord {
  id: string
  type: string
  description: string
  date: string
  nextDue?: string
  status: "completed" | "pending" | "overdue"
  veterinarian?: string
  notes?: string
}

export interface FeedingSchedule {
  dailyAmount: string
  feedType: string
  times: string[]
  lastFed: string
  specialDiet?: string
}

export interface Hutch {
  id: string
  rowName: string // New: Mercury, Venus, etc.
  level: string
  position: number
  size: string
  material: string
  features: string[]
  isOccupied: boolean
  lastCleaned?: string
  createdAt?: string
}

export interface Row {
  name: string
  description: string
  capacity: number
  occupied: number
  createdAt?: string
}

export interface BreedingRecord {
  id: string
  doeId: string
  buckId: string
  matingDate: string
  expectedBirthDate: string
  actualBirthDate?: string
  numberOfKits?: number
  notes?: string
}

export interface RemovalRecord {
  rabbit_id: string
  hutch_id: string
  reason: string
  notes: string
  date: string
  removedAt: string
}

export interface EarningsRecord {
  id: string
  type: "rabbit_sale" | "urine_sale" | "manure_sale" | "other"
  rabbit_id?: string
  amount: number
  currency: string
  date: string
  weight?: number
  saleType?: "whole" | "meat_only" | "skin_only" | "meat_and_skin"
  includesUrine?: boolean
  includesManure?: boolean
  buyerName?: string
  notes?: string
  createdAt: string
}

export interface ProductionRecord {
  id: string
  type: "urine" | "manure"
  quantity: number
  unit: string
  date: string
  source?: string // hutch or rabbit ID
  notes?: string
  createdAt: string
}

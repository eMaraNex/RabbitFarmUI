export interface Rabbit {
  id?: string;
  rabbit_id?: string;
  farm_id: string;
  name: string;
  gender: "male" | "female";
  breed: string;
  color: string;
  birth_date?: string;
  weight: number;
  hutch_id: string;
  parent_male?: string;
  parent_female?: string;
  is_pregnant: boolean;
  last_mating_date?: string;
  mated_with?: string;
  expected_birth_date?: string;
  total_litters?: number;
  total_kits?: number;
  healthRecords?: HealthRecord[];
  feedingSchedule?: FeedingSchedule;
  created_at?: string;
  status?: "active" | "inactive" | "sold" | "removed";
  notes?: string;
  actual_birth_date?: string;
  pregnancy_start_date?: string;
}

export interface HealthRecord {
  id: string;
  type: string;
  description: string;
  date: string;
  nextDue?: string;
  status: "completed" | "pending" | "overdue";
  veterinarian?: string;
  notes?: string;
}

export interface FeedingSchedule {
  dailyAmount: string;
  feedType: string;
  times: string[];
  lastFed: string;
  specialDiet?: string;
}

export interface Hutch {
  id: string;
  farm_id?: string;
  row_name: string;
  level: string;
  position: number;
  size: string;
  material: string;
  features: string[];
  is_occupied: boolean;
  last_cleaned?: string;
  created_at?: string;
  is_deleted?: number;
}

export interface Row {
  name: string;
  farm_id?: string;
  description?: string;
  capacity: number;
  occupied?: number;
  levels: string[];
  created_at?: string;
  updated_at?: string;
}

export interface BreedingRecord {
  id: string;
  doeId: string;
  buckId: string;
  matingDate: string;
  expected_birth_date: string;
  actualBirthDate?: string;
  numberOfKits?: number;
  notes?: string;
}

export interface RemovalRecord {
  rabbit_id?: string;
  hutch_id: string;
  reason: string;
  notes: string;
  date: string;
}

export interface EarningsRecord {
  id?: string;
  type: "rabbit_sale" | "urine_sale" | "manure_sale" | "other";
  rabbit_id?: string;
  amount: number;
  currency: string;
  date: string;
  weight?: number;
  sale_type?: "whole" | "meat_only" | "skin_only" | "meat_and_skin";
  includes_urine?: boolean;
  includes_manure?: boolean;
  buyer_name?: string;
  notes?: string;
  created_at?: string;
  farm_id: string;
  hutch_id?: string;
}

export interface ProductionRecord {
  id?: string;
  type: "urine" | "manure";
  quantity: number;
  unit: string;
  date: string;
  source?: string;
  notes?: string;
  created_at?: string;
}
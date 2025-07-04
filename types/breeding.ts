import { Rabbit } from "./rabbits";

export interface BreedingRecord {
  id: string;
  farm_id: string;
  doe_id: string;
  buck_id: string;
  doe_name: string;
  buck_name: string;
  mating_date: string;
  is_pregnant: boolean;
  expected_birth_date?: string;
  notes?: string;
  actualBirthDate?: string;
  numberOfKits?: number;
}

export interface BreedingManagerProps {
  rabbits: Rabbit[];
  onRabbitsUpdate: (updatedRabbits: Rabbit[]) => void;
}

export interface CompatibilityResult {
  compatible: boolean;
  reason: string;
}
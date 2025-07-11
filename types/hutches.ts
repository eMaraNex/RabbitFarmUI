import { Rabbit } from "./rabbits";
import { Row } from "./rows";

export interface Hutch {
  name: string;
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

export interface HutchLayoutProps {
  hutches: Hutch[];
  rabbits: Rabbit[];
  rows: Row[];
  onRabbitSelect: (rabbit: Rabbit) => void;
  onRowAdded?: () => void;
  handleAddRow: () => void;
}
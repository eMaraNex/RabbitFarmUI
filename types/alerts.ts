import { Rabbit } from "./rabbits";

export interface Alert {
  type: string;
  message: string;
  variant: "destructive" | "secondary" | "outline";
}

export interface ServerAlert {
  id: string;
  name: string;
  alert_start_date: string;
  alert_end_date?: string;
  alert_type: string;
  severity: "low" | "medium" | "high";
  message: string;
  status: "pending" | "sent" | "completed" | "rejected";
  farm_id: string;
  user_id?: string;
  rabbit_id?: string;
  hutch_id?: string;
  created_on: string;
  updated_on: string;
  is_active: boolean;
  is_deleted: boolean;
  rabbit?: Rabbit;
}
import { Rabbit } from "./rabbits";

export interface FeedingSchedule {
  dailyAmount: string;
  feedType: string;
  times: string[];
  lastFed: string;
  specialDiet?: string;
}

export interface FeedingScheduleProps {
  rabbits: Rabbit[]
}

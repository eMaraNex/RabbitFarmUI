import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate sequential rabbit IDs
export function generateRabbitId(): string {
  const existingIds = JSON.parse(localStorage.getItem("rabbit_farm_rabbits") || "[]")
  const maxId = existingIds.reduce((max: number, rabbit: any) => {
    const idNum = Number.parseInt(rabbit.rabbit_id?.replace("RB-", "") || "0")
    return Math.max(max, idNum)
  }, 0)

  return `RB-${String(maxId + 1).padStart(3, "0")}`
}

// Generate rabbit names for large scale operations
export function generateRabbitName(id: string): string {
  // For large operations, use ID as name
  return id
}

// Calculate age in months
export function calculateAge(birth_date: string): number {
  const birth = new Date(birth_date)
  const now = new Date()
  const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
  return months
}

// Format date for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString()
}

// Check if rabbit is ready for breeding
export function isBreedingReady(rabbit: any): boolean {
  const ageInMonths = calculateAge(rabbit.birth_date)
  if (rabbit.gender === "female") {
    return ageInMonths >= 6 && !rabbit.is_pregnant
  } else {
    return ageInMonths >= 6
  }
}

export const baseUrl = process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_API_URL : "http://localhost:5000";
export const apiUrl = `${baseUrl}/api/v1`;

export function formatRabbitCount(does: number, bucks: number): string {
  const doeText = does === 1 ? "1 doe" : does > 1 ? `${does} does` : "";
  const buckText = bucks === 1 ? "1 buck" : bucks > 1 ? `${bucks} bucks` : "";

  if (doeText && buckText) {
    return `${doeText}, ${buckText}`;
  }
  return doeText || buckText;
}
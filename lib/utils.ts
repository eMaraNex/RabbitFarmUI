import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate sequential rabbit IDs
export function generateRabbitId(): string {
  const existingIds = JSON.parse(localStorage.getItem("rabbit_farm_rabbits") || "[]")
  const maxId = existingIds.reduce((max: number, rabbit: any) => {
    const idNum = Number.parseInt(rabbit.rabbitId?.replace("RB-", "") || "0")
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
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate)
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
  const ageInMonths = calculateAge(rabbit.birthDate)
  if (rabbit.gender === "female") {
    return ageInMonths >= 6 && !rabbit.isPregnant
  } else {
    return ageInMonths >= 6
  }
}

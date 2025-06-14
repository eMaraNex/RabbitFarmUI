import axios from "axios";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate sequential rabbit IDs
export function generateRabbitId(): string {
  let maxId = 0;

  // Iterate through all localStorage keys
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    // Check for keys matching the rabbit farm pattern
    if (key?.startsWith("rabbit_farm_rabbits_")) {
      try {
        const rabbits = JSON.parse(localStorage.getItem(key) || "[]");
        // Find the max ID from this set of rabbits
        const localMaxId = rabbits.reduce((max: number, rabbit: any) => {
          const idNum = Number.parseInt(rabbit.rabbit_id?.replace("RB-", "") || "0");
          return Math.max(max, idNum);
        }, 0);
        maxId = Math.max(maxId, localMaxId);
      } catch (error) {
        console.error(`Error parsing rabbits from ${key}:`, error);
      }
    }
  }

  return `RB-${String(maxId + 1).padStart(3, "0")}`;
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

export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser."));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("Permission to access location was denied."));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Location information is unavailable."));
            break;
          case error.TIMEOUT:
            reject(new Error("The request to get location timed out."));
            break;
          default:
            reject(new Error("An unknown error occurred while fetching location."));
            break;
        }
      }
    );
  });
};

export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string> => {
  try {
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
    );
    return response.data.display_name || "Address not found";
  } catch (error) {
    throw new Error("Failed to fetch address from coordinates.");
  }
};
import axios from "axios";
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Rabbit, Alert } from "@/types";

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
    const suburb = response.data.address.suburb || response.data.address.city || response.data.address.town;
    const state = response.data.address.state || response.data.address.region;
    const country = response.data.address.country || response.data.address.country_code;
    return `${suburb} - ${state}, ${country}` || "Address not found";
  } catch (error) {
    throw new Error("Failed to fetch address from coordinates.");
  }
};

// Breeding and age-related constants
export const MIN_BREEDING_AGE_MONTHS = 4; // Minimum age for breeding in months
export const PREGNANCY_DURATION_DAYS = 31; // Average rabbit pregnancy duration
export const NESTING_BOX_START_DAYS = 26; // When to add nesting box (days after mating)
export const NESTING_BOX_END_DAYS = 30; // End of nesting box addition period
export const WEANING_PERIOD_DAYS = 42; // Weaning period after birth
export const POST_WEANING_BREEDING_DELAY_DAYS = 7; // Days after weaning before doe can breed again
export const BIRTH_EXPECTED_WINDOW_DAYS = { before: 7, after: 2 }; // Birth expected alert window (7 days before, 2 days after)
export const FOSTERING_DAYS_AFTER_BIRTH = 20;

// Calculate age in months
export const calculateAgeInMonths = (birthDate: string | undefined): number => {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  const diff = now.getTime() - birth.getTime();
  return diff / (1000 * 60 * 60 * 24 * 30.42); // Approximate months
};

// Check if rabbit is mature for breeding
export const isRabbitMature = (rabbit: { birth_date?: string }): { isMature: boolean; reason: string } => {
  if (!rabbit.birth_date) {
    return { isMature: false, reason: "Birth date not available" };
  }
  const ageInMonths = calculateAgeInMonths(rabbit.birth_date);
  return ageInMonths >= MIN_BREEDING_AGE_MONTHS
    ? { isMature: true, reason: "Rabbit is mature" }
    : { isMature: false, reason: `Rabbit is too young (${Math.round(ageInMonths)} months)` };
};

export const generateAlerts = (
  rabbits: Rabbit[],
  setAlerts: (alerts: Alert[]) => void,
  setOverdueRabbits: (rabbits: Rabbit[]) => void,
  notifiedRabbitsRef: React.MutableRefObject<Set<string>>,
): void => {
  const currentDate = new Date();
  const alertsList: Alert[] = [];
  const overdueRabbitsList: Rabbit[] = [];

  rabbits.forEach((rabbit) => {
    // Skip immature female rabbits for pregnancy-related alerts
    const maturity = isRabbitMature(rabbit);
    if (!maturity.isMature && rabbit.gender === "female") {
      return;
    }

    // --- Pregnancy Noticed Alert ---
    // Notifies when a doe is confirmed pregnant (from pregnancy_start_date to day 25)
    if (rabbit.is_pregnant && rabbit.pregnancy_start_date) {
      let pregnancyStart;
      try {
        pregnancyStart = new Date(rabbit.pregnancy_start_date);
        if (isNaN(pregnancyStart.getTime())) {
          console.error(`Invalid pregnancy_start_date for ${rabbit.name}:`, rabbit.pregnancy_start_date);
          pregnancyStart = currentDate;
        }
      } catch (e) {
        console.error(`Error parsing pregnancy_start_date for ${rabbit.name}:`, e);
        pregnancyStart = currentDate;
      }
      const timeDiff = currentDate.getTime() - pregnancyStart.getTime();
      const daysSincePregnancy = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (daysSincePregnancy >= 0 && daysSincePregnancy < (NESTING_BOX_START_DAYS || 25)) {
        alertsList.push({
          type: "Pregnancy Noticed",
          message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Confirmed pregnant since ${pregnancyStart.toLocaleDateString()}`,
          variant: "secondary",
        });
      }

      // --- Nesting Box Needed Alert ---
      // Reminds to add a nesting box when pregnancy reaches days 25-28
      if (daysSincePregnancy >= (NESTING_BOX_START_DAYS || 25) && daysSincePregnancy < (NESTING_BOX_END_DAYS || 28)) {
        alertsList.push({
          type: "Nesting Box Needed",
          message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Add nesting box, ${daysSincePregnancy} days since mating`,
          variant: "secondary",
        });
      }

      // --- Birth Expected Alert ---
      // Alerts when birth is expected (days 28-31) or overdue
      if (rabbit.expected_birth_date && !rabbit.actual_birth_date) {
        let expectedDate;
        try {
          expectedDate = new Date(rabbit.expected_birth_date);
          if (isNaN(expectedDate.getTime())) throw new Error("Invalid expected_birth_date");
        } catch (e) {
          console.error(`Invalid expected_birth_date for ${rabbit.name}:`, rabbit.expected_birth_date);
          expectedDate = new Date(currentDate.getTime() + (PREGNANCY_DURATION_DAYS || 30) * 24 * 60 * 60 * 1000);
        }
        const daysToBirth = Math.ceil((expectedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSincePregnancy >= 28 && daysSincePregnancy <= 31) {
          alertsList.push({
            type: "Birth Expected",
            message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Expected to give birth ${daysToBirth === 0 ? "today" : daysToBirth > 0 ? `in ${daysToBirth} days` : `overdue by ${Math.abs(daysToBirth)} days`}`,
            variant: daysToBirth <= 0 ? "destructive" : "secondary",
          });
        }

        // --- Overdue Birth Toast Notification ---
        // Shows a toast when expected birth date is exceeded (overdue)
        if (daysToBirth < 0 && !notifiedRabbitsRef.current.has(rabbit.rabbit_id ?? '')) {
          overdueRabbitsList.push(rabbit);
        }
      }
    }

    // --- Fostering Needed Alert ---
    // Suggests fostering kits 20 days after birth
    if (rabbit.actual_birth_date) {
      let birthDate;
      try {
        birthDate = new Date(rabbit.actual_birth_date);
        if (isNaN(birthDate.getTime())) throw new Error("Invalid actual_birth_date");
      } catch (e) {
        console.error(`Invalid actual_birth_date for ${rabbit.name}:`, rabbit.actual_birth_date);
        birthDate = currentDate;
      }
      const timeDiff = currentDate.getTime() - birthDate.getTime();
      const daysSinceBirth = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (daysSinceBirth === (FOSTERING_DAYS_AFTER_BIRTH || 20)) {
        alertsList.push({
          type: "Fostering Needed",
          message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Consider fostering kits to other does`,
          variant: "secondary",
        });
      }

      // --- Weaning and Nesting Box Removal Alert ---
      // Reminds to wean kits and remove nesting box 42 days after birth
      if (daysSinceBirth === (WEANING_PERIOD_DAYS || 42)) {
        alertsList.push({
          type: "Weaning and Nesting Box Removal",
          message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Wean kits and move to new hutches, remove nesting box`,
          variant: "secondary",
        });
      }
    }

    // --- Breeding Ready Alert ---
    // Notifies when a mature doe is ready for the next breeding cycle
    if (rabbit.gender === "female" && !rabbit.is_pregnant && maturity.isMature) {
      const lastBirth = rabbit.actual_birth_date ? new Date(rabbit.actual_birth_date) : null;
      const weaningDate = lastBirth
        ? new Date(lastBirth.getTime() + (WEANING_PERIOD_DAYS || 42) * 24 * 60 * 60 * 1000)
        : null;
      const oneWeekAfterWeaning = weaningDate
        ? new Date(weaningDate.getTime() + (POST_WEANING_BREEDING_DELAY_DAYS || 7) * 24 * 60 * 60 * 1000)
        : null;
      if (
        (!rabbit.pregnancy_start_date ||
          (rabbit.pregnancy_start_date &&
            currentDate.getTime() > new Date(rabbit.pregnancy_start_date).getTime() + ((PREGNANCY_DURATION_DAYS || 30) + (WEANING_PERIOD_DAYS || 42)) * 24 * 60 * 60 * 1000)) &&
        (!oneWeekAfterWeaning || currentDate > oneWeekAfterWeaning)
      ) {
        alertsList.push({
          type: "Breeding Ready",
          message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Ready for next breeding cycle`,
          variant: "outline",
        });
      }
    }

    // --- Medication Due Alert ---
    // Notifies when a rabbit's vaccination is overdue
    // if (rabbit.next_due) {
    //   const nextDueDate = new Date(rabbit.next_due);
    //   const daysDiff = Math.ceil((nextDueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
    //   if (daysDiff <= 0) {
    //     alertsList.push({
    //       type: "Medication Due",
    //       message: `${rabbit.name} (${rabbit.hutch_id}) - Vaccination overdue by ${Math.abs(daysDiff)} days`,
    //       variant: "destructive",
    //     });
    //   }
    // }
  });

  // Sort alerts by urgency (overdue > upcoming > ready)
  alertsList.sort((a, b) => {
    const order = { destructive: 0, secondary: 1, outline: 2 } as const;
    return order[a.variant] - order[b.variant];
  });
  setAlerts([...alertsList.slice(0, 15)]); // Force re-render
  setOverdueRabbits(overdueRabbitsList);
};

// export const getRabbitDynamicFarmName = () => {
//   const farmDetails = localStorage.getItem("rabbit_farm_data");
//   const farm = farmDetails ? JSON.parse(farmDetails) : null;
//   return farm ? `${farm.name}` : "Rabbit Farm";
// }
export const getRabbitDynamicFarmName = () => {
  try {
    const farmDetails = localStorage.getItem("rabbit_farm_data");
    const farm = farmDetails ? JSON.parse(farmDetails) : null;
    return farm && farm.name ? farm.name : "Rabbit Farm";
  } catch (error) {
    console.error("Error parsing rabbit_farm_data:", error);
    return "Rabbit Farm";
  }
};
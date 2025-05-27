// Simulated database using localStorage for persistence

export const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(`rabbit_farm_${key}`, JSON.stringify(data))
    return true
  } catch (error) {
    console.error("Error saving to storage:", error)
    return false
  }
}

export const loadFromStorage = (key: string, defaultValue: any = []) => {
  try {
    const stored = localStorage.getItem(`rabbit_farm_${key}`)
    return stored ? JSON.parse(stored) : defaultValue
  } catch (error) {
    console.error("Error loading from storage:", error)
    return defaultValue
  }
}

export const removeFromStorage = (key: string) => {
  try {
    localStorage.removeItem(`rabbit_farm_${key}`)
    return true
  } catch (error) {
    console.error("Error removing from storage:", error)
    return false
  }
}

// Initialize storage with default data if empty
export const initializeStorage = () => {
  const keys = ["rabbits", "hutches", "rows", "rabbit_removals"]

  keys.forEach((key) => {
    const existing = localStorage.getItem(`rabbit_farm_${key}`)
    if (!existing) {
      localStorage.setItem(`rabbit_farm_${key}`, JSON.stringify([]))
    }
  })
}

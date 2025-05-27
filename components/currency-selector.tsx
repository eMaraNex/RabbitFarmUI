"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign } from "lucide-react"
import { useCurrency } from "@/lib/currency-context"

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency()

  const currencies = [
    { value: "USD", label: "USD ($)", flag: "🇺🇸" },
    { value: "EUR", label: "EUR (€)", flag: "🇪🇺" },
    { value: "GBP", label: "GBP (£)", flag: "🇬🇧" },
    { value: "KES", label: "KES (KSh)", flag: "🇰🇪" },
  ]

  return (
    <div className="flex items-center space-x-2">
      <DollarSign className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
        <SelectTrigger className="w-32 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
          {currencies.map((curr) => (
            <SelectItem key={curr.value} value={curr.value}>
              <div className="flex items-center space-x-2">
                <span>{curr.flag}</span>
                <span>{curr.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign } from 'lucide-react'
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
    <div className="flex items-center w-full">
      <DollarSign className="h-4 w-4 text-muted-foreground mr-2" />
      <Select value={currency} onValueChange={(value: any) => setCurrency(value)}>
        <SelectTrigger className="w-full bg-muted border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
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
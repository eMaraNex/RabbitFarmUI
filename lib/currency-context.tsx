"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Currency = "USD" | "EUR" | "GBP" | "KES"

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  formatAmount: (amount: number) => string
  convertToBaseCurrency: (amount: number, fromCurrency: Currency) => number
  getCurrencySymbol: () => string
  getCurrencyRates: () => Record<Currency, number>
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

// Exchange rates (simplified - in real app, fetch from API)
const CURRENCY_RATES: Record<Currency, number> = {
  USD: 1, // Base currency
  EUR: 0.91, // 1 USD = 0.91 EUR
  GBP: 0.79, // 1 USD = 0.79 GBP
  KES: 149.5, // 1 USD = 149.5 KES
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  KES: "KSh",
}

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("KES")

  useEffect(() => {
    // Load saved currency preference
    const savedCurrency = localStorage.getItem("rabbit_farm_currency") as Currency
    if (savedCurrency && Object.keys(CURRENCY_RATES).includes(savedCurrency)) {
      setCurrencyState(savedCurrency)
    }
  }, [])

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem("rabbit_farm_currency", newCurrency)
  }

  const formatAmount = (amount: number) => {
    const symbol = CURRENCY_SYMBOLS[currency]
    const convertedAmount = convertFromBaseCurrency(amount, currency)

    if (currency === "KES") {
      return `${symbol} ${convertedAmount.toLocaleString("en-KE", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }

    return `${symbol}${convertedAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const convertToBaseCurrency = (amount: number, fromCurrency: Currency) => {
    return amount / CURRENCY_RATES[fromCurrency]
  }

  const convertFromBaseCurrency = (amount: number, toCurrency: Currency) => {
    return amount * CURRENCY_RATES[toCurrency]
  }

  const getCurrencySymbol = () => CURRENCY_SYMBOLS[currency]

  const getCurrencyRates = () => CURRENCY_RATES

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatAmount,
        convertToBaseCurrency,
        getCurrencySymbol,
        getCurrencyRates,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider")
  }
  return context
}

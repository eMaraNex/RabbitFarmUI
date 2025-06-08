"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, PieChart, Calendar } from "lucide-react"
import { loadFromStorage } from "@/lib/storage"
import { useCurrency } from "@/lib/currency-context"
import type { Rabbit, EarningsRecord } from "@/lib/types"

export default function AnalyticsCharts() {
  const { formatAmount, convertToBaseCurrency } = useCurrency()
  const [rabbits, setRabbits] = useState<Rabbit[]>([])
  const [earnings, setEarnings] = useState<EarningsRecord[]>([])
  const [timeRange, setTimeRange] = useState("6months")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = () => {
    const rabbitsData = loadFromStorage("rabbits", [])
    const earningsData = loadFromStorage("earnings", [])
    setRabbits(rabbitsData)
    setEarnings(earningsData)
  }

  const getTimeRangeData = () => {
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case "3months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
        break
      case "6months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
        break
      case "1year":
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        break
      default:
        startDate = new Date(0)
    }

    return {
      earnings: earnings.filter((e) => new Date(e.date) >= startDate),
      rabbits: rabbits.filter((r) => new Date(r.created_at || r.birth_date) >= startDate),
    }
  }

  const getMonthlyEarnings = () => {
    const { earnings: filteredEarnings } = getTimeRangeData()
    const monthlyData: Record<string, number> = {}

    filteredEarnings.forEach((earning) => {
      const date = new Date(earning.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
      const amountInBase = convertToBaseCurrency(earning.amount, earning.currency as any)

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0
      }
      monthlyData[monthKey] += amountInBase
    })

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, amount]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        amount,
      }))
  }

  const getEarningsByType = () => {
    const { earnings: filteredEarnings } = getTimeRangeData()
    const typeData: Record<string, number> = {}

    filteredEarnings.forEach((earning) => {
      const amountInBase = convertToBaseCurrency(earning.amount, earning.currency as any)
      if (!typeData[earning.type]) {
        typeData[earning.type] = 0
      }
      typeData[earning.type] += amountInBase
    })

    return Object.entries(typeData).map(([type, amount]) => ({
      type: type.replace("_", " ").toUpperCase(),
      amount,
      percentage: (amount / Object.values(typeData).reduce((sum, val) => sum + val, 0)) * 100,
    }))
  }

  const getBreedPerformance = () => {
    const breedData: Record<string, { count: number; totalKits: number; avgWeight: number; totalWeight: number }> = {}

    rabbits.forEach((rabbit) => {
      if (!breedData[rabbit.breed]) {
        breedData[rabbit.breed] = { count: 0, totalKits: 0, avgWeight: 0, totalWeight: 0 }
      }
      breedData[rabbit.breed].count++
      breedData[rabbit.breed].totalKits += rabbit?.totalKits || 0
      breedData[rabbit.breed].totalWeight += rabbit.weight
    })

    return Object.entries(breedData)
      .map(([breed, data]) => ({
        breed,
        count: data.count,
        totalKits: data.totalKits,
        avgWeight: data.totalWeight / data.count,
        avgKitsPerRabbit: data.totalKits / data.count,
      }))
      .sort((a, b) => b.totalKits - a.totalKits)
      .slice(0, 6)
  }

  const getProductionTrends = () => {
    const monthlyProduction: Record<string, { births: number; sales: number }> = {}
    const { rabbits: filteredRabbits, earnings: filteredEarnings } = getTimeRangeData()

    // Track births
    filteredRabbits.forEach((rabbit) => {
      const date = new Date(rabbit.birth_date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

      if (!monthlyProduction[monthKey]) {
        monthlyProduction[monthKey] = { births: 0, sales: 0 }
      }
      monthlyProduction[monthKey].births++
    })

    // Track sales
    filteredEarnings
      .filter((e) => e.type === "rabbit_sale")
      .forEach((sale) => {
        const date = new Date(sale.date)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!monthlyProduction[monthKey]) {
          monthlyProduction[monthKey] = { births: 0, sales: 0 }
        }
        monthlyProduction[monthKey].sales++
      })

    return Object.entries(monthlyProduction)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: new Date(month + "-01").toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        births: data.births,
        sales: data.sales,
      }))
  }

  const monthlyEarnings = getMonthlyEarnings()
  const earningsByType = getEarningsByType()
  const breedPerformance = getBreedPerformance()
  const productionTrends = getProductionTrends()

  const maxEarnings = Math.max(...monthlyEarnings.map((d) => d.amount), 1)
  const maxProduction = Math.max(...productionTrends.map((d) => Math.max(d.births, d.sales)), 1)
  const maxKits = Math.max(...breedPerformance.map((d) => d.totalKits), 1)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-gray-100">Analytics Dashboard</span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="3months">Last 3 Months</SelectItem>
                  <SelectItem value="6months">Last 6 Months</SelectItem>
                  <SelectItem value="1year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Earnings Chart */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
              <span className="text-gray-900 dark:text-gray-100">Monthly Earnings Trend</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthlyEarnings.length > 0 ? (
                monthlyEarnings.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.month}</span>
                      <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {formatAmount(data.amount)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(data.amount / maxEarnings) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No earnings data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Earnings by Type Chart */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="text-gray-900 dark:text-gray-100">Revenue by Source</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {earningsByType.length > 0 ? (
                earningsByType.map((data, index) => {
                  const colors = [
                    "from-pink-500 to-red-500",
                    "from-yellow-500 to-orange-500",
                    "from-green-500 to-teal-500",
                    "from-blue-500 to-purple-500",
                  ]
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.type}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                            {formatAmount(data.amount)}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                            ({data.percentage.toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className={`bg-gradient-to-r ${colors[index % colors.length]} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${data.percentage}%` }}
                        />
                      </div>
                    </div>
                  )
                })
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No earnings data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Breed Performance Chart */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-gray-100">Top Performing Breeds</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {breedPerformance.length > 0 ? (
                breedPerformance.map((data, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.breed}</span>
                      <div className="text-right">
                        <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                          {data.totalKits} kits
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">({data.count} rabbits)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(data.totalKits / maxKits) * 100}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      Avg: {data.avgKitsPerRabbit.toFixed(1)} kits/rabbit • {data.avgWeight.toFixed(1)}kg avg weight
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No breed data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Production Trends Chart */}
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              <span className="text-gray-900 dark:text-gray-100">Production vs Sales</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {productionTrends.length > 0 ? (
                productionTrends.map((data, index) => (
                  <div key={index} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{data.month}</span>
                      <div className="text-right text-xs">
                        <span className="text-green-600 dark:text-green-400">+{data.births}</span>
                        <span className="text-red-600 dark:text-red-400 ml-2">-{data.sales}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-green-600 dark:text-green-400 w-12">Births</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-green-400 to-green-600 h-1.5 rounded-full"
                            style={{ width: `${(data.births / maxProduction) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-8">{data.births}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-red-600 dark:text-red-400 w-12">Sales</span>
                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-red-400 to-red-600 h-1.5 rounded-full"
                            style={{ width: `${(data.sales / maxProduction) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 w-8">{data.sales}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No production data available</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

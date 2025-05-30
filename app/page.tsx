"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Rabbit, Heart, Pill, AlertTriangle, Building, LogOut, User } from "lucide-react"
import HutchLayout from "@/components/hutch-layout"
import RabbitProfile from "@/components/rabbit-profile"
import BreedingManager from "@/components/breeding-manager"
import HealthTracker from "@/components/health-tracker"
import FeedingSchedule from "@/components/feeding-schedule"
import EarningsTracker from "@/components/earnings-tracker"
import ReportsDashboard from "@/components/reports-dashboard"
import AnalyticsCharts from "@/components/analytics-charts"
import CurrencySelector from "@/components/currency-selector"
import AddRowDialog from "@/components/add-row-dialog"
import ProtectedRoute from "@/components/auth/protected-route"
import ThemeToggle from "@/components/theme-toggle"
import { AuthProvider, useAuth } from "@/lib/auth-context"
import { ThemeProvider } from "@/lib/theme-context"
import { CurrencyProvider } from "@/lib/currency-context"
import axios from "axios"
import * as utils from "@/lib/utils"

function DashboardContent() {
  const { user, logout } = useAuth()
  const [selectedRabbit, setSelectedRabbit] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [rabbits, setRabbits] = useState<any[]>([])
  const [hutches, setHutches] = useState<any[]>([])
  const [rows, setRows] = useState<any[]>([])
  const [dataLoaded, setDataLoaded] = useState(false)

  const loadFromStorage = useCallback((farmId: string) => {
    try {
      const cachedRows = localStorage.getItem(`rabbit_farm_rows_${farmId}`)
      const cachedHutches = localStorage.getItem(`rabbit_farm_hutches_${farmId}`)
      const cachedRabbits = localStorage.getItem(`rabbit_farm_rabbits_${farmId}`)
      return {
        rows: cachedRows ? JSON.parse(cachedRows) : [],
        hutches: cachedHutches ? JSON.parse(cachedHutches) : [],
        rabbits: cachedRabbits ? JSON.parse(cachedRabbits) : [],
      }
    } catch (error) {
      console.error("Error loading from storage:", error)
      return { rows: [], hutches: [], rabbits: [] }
    }
  }, [])

  const saveToStorage = useCallback((farmId: string, data: { rows: any[], hutches: any[], rabbits: any[] }) => {
    try {
      localStorage.setItem(`rabbit_farm_rows_${farmId}`, JSON.stringify(data.rows))
      localStorage.setItem(`rabbit_farm_hutches_${farmId}`, JSON.stringify(data.hutches))
      localStorage.setItem(`rabbit_farm_rabbits_${farmId}`, JSON.stringify(data.rabbits))
    } catch (error) {
      console.error("Error saving to storage:", error)
    }
  }, [])

  const loadData = useCallback(async () => {
    if (!user?.farm_id) return;

    // Check local storage first
    const cachedData = loadFromStorage(user.farm_id)
    if (cachedData.rows.length || cachedData.hutches.length || cachedData.rabbits.length) {
      setRows(cachedData.rows)
      setHutches(cachedData.hutches)
      setRabbits(cachedData.rabbits)
      setDataLoaded(true)
      // Optionally, fetch fresh data in the background
    }

    try {
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Fetch fresh data from API
      const [rowsResponse, hutchesResponse, rabbitsResponse] = await Promise.all([
        axios.get(`${utils.apiUrl}/rows/${user.farm_id}`),
        axios.get(`${utils.apiUrl}/hutches/${user.farm_id}`),
        axios.get(`${utils.apiUrl}/rabbits/${user.farm_id}`),
      ])

      const newRows = rowsResponse.data.data || []
      const newHutches = hutchesResponse.data.data || []
      const newRabbits = rabbitsResponse.data.data || []

      // Update state
      setRows(newRows)
      setHutches(newHutches)
      setRabbits(newRabbits)

      // Save to local storage
      saveToStorage(user.farm_id, {
        rows: newRows,
        hutches: newHutches,
        rabbits: newRabbits,
      })

      setDataLoaded(true)
    } catch (error) {
      console.error("Error fetching data:", error)
      if (cachedData.rows.length || cachedData.hutches.length || cachedData.rabbits.length) {
        setRows(cachedData.rows)
        setHutches(cachedData.hutches)
        setRabbits(cachedData.rabbits)
      }
      setDataLoaded(true)
    }
  }, [user, loadFromStorage, saveToStorage])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRowAdded = useCallback(() => {
    loadData()
  }, [loadData])

  const totalRabbits = rabbits.length
  const does = rabbits.filter((r) => r.gender === "female").length
  const bucks = rabbits.filter((r) => r.gender === "male").length
  const pregnantDoes = rabbits.filter((r) => r.is_pregnant).length
  const upcomingBirths = rabbits.filter(
    (r) => r.expected_birth_date && new Date(r.expected_birth_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  ).length

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Rabbit className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 animate-bounce mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading Rabbit Farm Data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                <Rabbit className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  Karagani Rabbit Farming
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                  Professional Rabbit Management System
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Badge variant="outline" className="bg-white/50 dark:bg-gray-700/50 hidden sm:flex">
                <Building className="h-3 w-3 mr-1" />
                {rows.length} Rows Active
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 rounded-lg px-3 py-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{user?.name}</span>
              </div>
              <CurrencySelector />
              <ThemeToggle />
              <AddRowDialog onRowAdded={handleRowAdded} />
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="bg-white/50 dark:bg-gray-700/50 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
          <TabsList className="grid w-full grid-cols-4 sm:grid-cols-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="hutches"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm"
            >
              Hutches
            </TabsTrigger>
            <TabsTrigger
              value="breeding"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm"
            >
              Breeding
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm"
            >
              Health
            </TabsTrigger>
            <TabsTrigger
              value="feeding"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm"
            >
              Feeding
            </TabsTrigger>
            <TabsTrigger
              value="earnings"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm"
            >
              Earnings
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm"
            >
              Reports
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 sm:space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Total Rabbits</CardTitle>
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Rabbit className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {totalRabbits}
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    {does} does, {bucks} bucks
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Pregnant Does</CardTitle>
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg">
                    <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                    {pregnantDoes}
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    {upcomingBirths} due this week
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Health Alerts</CardTitle>
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                    <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    3
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Medication due</p>
                </CardContent>
              </Card>

              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Active Rows</CardTitle>
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                    <Building className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    {rows.length}
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    {hutches.length} total hutches
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Alerts */}
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-sm sm:text-base dark:text-gray-200">
                  <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                  <span>Recent Alerts & Reminders</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div>
                      <p className="font-medium text-red-800 dark:text-red-300 text-sm sm:text-base">Medication Due</p>
                      <p className="text-xs sm:text-sm text-red-600 dark:text-red-400">
                        RB-001 (Earth-A1) - Vaccination overdue by 2 days
                      </p>
                    </div>
                    <Badge variant="destructive" className="text-xs">
                      Overdue
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-300 text-sm sm:text-base">
                        Birth Expected
                      </p>
                      <p className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
                        RB-002 (Earth-B2) - Expected to give birth in 3 days
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Upcoming
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-300 text-sm sm:text-base">
                        Breeding Ready
                      </p>
                      <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400">
                        RB-003 (Earth-C1) - Ready for next breeding cycle
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Ready
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hutches">
            <HutchLayout hutches={hutches} rabbits={rabbits} rows={rows} onRabbitSelect={setSelectedRabbit} />
            {selectedRabbit && <RabbitProfile rabbit_id={selectedRabbit} onClose={() => setSelectedRabbit(null)} />}
          </TabsContent>

          <TabsContent value="breeding">
            <BreedingManager rabbits={rabbits} />
          </TabsContent>

          <TabsContent value="health">
            <HealthTracker rabbits={rabbits} />
          </TabsContent>

          <TabsContent value="feeding">
            <FeedingSchedule rabbits={rabbits} />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsTracker />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsCharts />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}

export default function RabbitFarmDashboard() {
  return (
    <CurrencyProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProtectedRoute>
            <DashboardContent />
          </ProtectedRoute>
        </AuthProvider>
      </ThemeProvider>
    </CurrencyProvider>
  )
}

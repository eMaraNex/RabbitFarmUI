"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Heart, Plus, AlertTriangle } from "lucide-react"
import axios from "axios"
import * as utils from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import type { Rabbit } from "@/lib/types"

interface BreedingManagerProps {
  rabbits: Rabbit[]
}

export default function BreedingManager({ rabbits: initialRabbits }: BreedingManagerProps) {
  const { user } = useAuth()
  const [selectedDoe, setSelectedDoe] = useState("")
  const [selectedBuck, setSelectedBuck] = useState("")
  const [rabbits, setRabbits] = useState<Rabbit[]>(initialRabbits)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const does = rabbits.filter((r) => r.gender === "female")
  const bucks = rabbits.filter((r) => r.gender === "male")
  const pregnantDoes = does.filter((r) => r.isPregnant)
  const availableDoes = does.filter((r) => !r.isPregnant)

  const checkInbreeding = (doe: Rabbit, buck: Rabbit) => {
    if (doe.parentMale === buck.id || doe.parentFemale === buck.id) return true
    if (buck.parentMale === doe.id || buck.parentFemale === doe.id) return true
    if (doe.parentMale === buck.parentMale && doe.parentMale) return true
    if (doe.parentFemale === buck.parentFemale && doe.parentFemale) return true
    return false
  }

  const getBreedingCompatibility = (doeId: string, buckId: string) => {
    const doe = rabbits.find((r) => r.id === doeId)
    const buck = rabbits.find((r) => r.id === buckId)

    if (!doe || !buck) return { compatible: false, reason: "Invalid selection" }

    if (checkInbreeding(doe, buck)) {
      return { compatible: false, reason: "Potential inbreeding detected" }
    }

    if (doe.isPregnant) {
      return { compatible: false, reason: "Doe is currently pregnant" }
    }

    return { compatible: true, reason: "Compatible for breeding" }
  }

  const handleScheduleBreeding = async () => {
    if (!selectedDoe || !selectedBuck || !user?.farm_id) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const doe = rabbits.find((r) => r.id === selectedDoe)
      const buck = rabbits.find((r) => r.id === selectedBuck)
      if (!doe || !buck) throw new Error("Invalid rabbit selection")

      const matingDate = new Date().toISOString().split("T")[0] // Current date in YYYY-MM-DD
      const expectedBirthDate = new Date(new Date().setDate(new Date().getDate() + 31)).toISOString().split("T")[0] // Approx 31 days gestation

      const response = await axios.post(`${utils.apiUrl}/breeds`, {
        farm_id: user.farm_id,
        doe_id: doe.rabbit_id,
        buck_id: buck.rabbit_id,
        mating_date: matingDate,
        expected_birth_date: expectedBirthDate,
        notes: `Scheduled on ${matingDate}`,
      })

      if (response.status === 201) {
        setSuccess("Breeding scheduled successfully!")
        setSelectedDoe("")
        setSelectedBuck("")
        // Update local rabbit state to reflect pregnancy (simplified)
        setRabbits(
          rabbits.map((r) =>
            r.id === selectedDoe
              ? { ...r, isPregnant: true, lastMatingDate: matingDate, expectedBirthDate, matedWith: buck.name }
              : r
          )
        )
      }
    } catch (err) {
      // setError(err.response?.data?.message || "Failed to schedule breeding. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user?.farm_id) {
      const fetchRabbits = async () => {
        try {
          const response = await axios.get(`${utils.apiUrl}/rabbits/${user.farm_id}`)
          setRabbits(response.data.data || [])
        } catch (err) {
          console.error("Error fetching rabbits:", err)
          setRabbits(initialRabbits) // Fallback to props if API fails
        }
      }
      fetchRabbits()
    }
  }, [user?.farm_id, initialRabbits])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Available Does</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
              {availableDoes.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ready for breeding</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Pregnant Does</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 bg-clip-text text-transparent">
              {pregnantDoes.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Currently expecting</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Active Bucks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {bucks.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Available for breeding</p>
          </CardContent>
        </Card>
      </div>

      {/* Breeding Planner */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-50/80 to-red-50/80 dark:from-pink-900/30 dark:to-red-900/30 border-b border-gray-200 dark:border-gray-600">
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            <span className="text-gray-900 dark:text-gray-100">Breeding Planner</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Select Doe</label>
              <Select value={selectedDoe} onValueChange={setSelectedDoe}>
                <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Choose a doe" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {availableDoes.map((doe) => (
                    <SelectItem key={doe.id} value={doe.id}>
                      {doe.name} ({doe.hutch_id}) - {doe.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Select Buck</label>
              <Select value={selectedBuck} onValueChange={setSelectedBuck}>
                <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Choose a buck" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {bucks.map((buck) => (
                    <SelectItem key={buck.id} value={buck.id}>
                      {buck.name} ({buck.hutch_id}) - {buck.breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedDoe && selectedBuck && (
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60">
              {(() => {
                const compatibility = getBreedingCompatibility(selectedDoe, selectedBuck)
                return (
                  <div className="flex items-center space-x-3">
                    {compatibility.compatible ? (
                      <Badge variant="default" className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        Compatible
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Compatible
                      </Badge>
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">{compatibility.reason}</span>
                  </div>
                )
              })()}
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
            disabled={!selectedDoe || !selectedBuck || isLoading}
            onClick={handleScheduleBreeding}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? "Scheduling..." : "Schedule Breeding"}
          </Button>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">{success}</div>}
        </CardContent>
      </Card>

      {/* Pregnant Does */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Pregnant Does - Expected Births</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pregnantDoes.map((doe) => (
              <div
                key={doe.id}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-pink-50/80 to-pink-100/80 dark:from-pink-900/30 dark:to-pink-800/30"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{doe.name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Hutch {doe.hutch_id} • Mated with {doe.matedWith}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Mating Date: {doe.lastMatingDate ? new Date(doe.lastMatingDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {doe.expectedBirthDate ? new Date(doe.expectedBirthDate).toLocaleDateString() : "TBD"}
                  </p>
                  <Badge
                    variant="outline"
                    className="bg-white/50 dark:bg-gray-800/50 border-pink-200 dark:border-pink-700 text-pink-800 dark:text-pink-300"
                  >
                    {doe.expectedBirthDate
                      ? `${Math.ceil((new Date(doe.expectedBirthDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days`
                      : "TBD"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Breeding History */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Recent Breeding History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rabbits
              .filter((r) => r.lastMatingDate)
              .sort((a, b) => new Date(b.lastMatingDate!).getTime() - new Date(a.lastMatingDate!).getTime())
              .slice(0, 5)
              .map((rabbit) => (
                <div
                  key={rabbit.id}
                  className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {rabbit.name} × {rabbit.matedWith}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(rabbit.lastMatingDate!).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={rabbit.isPregnant ? "default" : "outline"}
                    className={
                      rabbit.isPregnant
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                        : "bg-white/50 dark:bg-gray-800/50"
                    }
                  >
                    {rabbit.isPregnant ? "Pregnant" : "Completed"}
                  </Badge>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
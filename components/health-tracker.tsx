"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Pill, AlertTriangle, Calendar, Plus } from "lucide-react"
import type { Rabbit } from "@/lib/types"

interface HealthTrackerProps {
  rabbits: Rabbit[]
}

export default function HealthTracker({ rabbits }: HealthTrackerProps) {
  const getHealthStatus = (rabbit: Rabbit) => {
    const now = new Date()
    const overdueMedications = rabbit.healthRecords.filter((record) => {
      if (record.nextDue) {
        return new Date(record.nextDue) < now && record.status !== "completed"
      }
      return false
    })

    if (overdueMedications.length > 0) return "overdue"

    const upcomingMedications = rabbit.healthRecords.filter((record) => {
      if (record.nextDue) {
        const dueDate = new Date(record.nextDue)
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
        return dueDate <= threeDaysFromNow && dueDate >= now && record.status !== "completed"
      }
      return false
    })

    if (upcomingMedications.length > 0) return "upcoming"
    return "good"
  }

  const overdueRabbits = rabbits.filter((r) => getHealthStatus(r) === "overdue")
  const upcomingRabbits = rabbits.filter((r) => getHealthStatus(r) === "upcoming")
  const healthyRabbits = rabbits.filter((r) => getHealthStatus(r) === "good")

  return (
    <div className="space-y-6">
      {/* Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 dark:text-red-400">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">
              {overdueRabbits.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Medications overdue</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-amber-600 dark:text-amber-400">Upcoming</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              {upcomingRabbits.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Due in 3 days</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-green-600 dark:text-green-400">Healthy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
              {healthyRabbits.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Up to date</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Medications */}
      {overdueRabbits.length > 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 border-b border-red-200 dark:border-red-700">
            <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              <span>Overdue Medications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
            <div className="space-y-4">
              {overdueRabbits.map((rabbit) => (
                <div
                  key={rabbit.id}
                  className="p-4 border border-red-200 dark:border-red-700 bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{rabbit.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hutch {rabbit.hutchId}</p>
                      <div className="mt-2 space-y-1">
                        {rabbit.healthRecords
                          .filter(
                            (record) =>
                              record.nextDue && new Date(record.nextDue) < new Date() && record.status !== "completed",
                          )
                          .map((record, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{record.type}</span> -
                              <span className="text-red-600 dark:text-red-400 ml-1">
                                Overdue by{" "}
                                {Math.ceil(
                                  (new Date().getTime() - new Date(record.nextDue!).getTime()) / (1000 * 60 * 60 * 24),
                                )}{" "}
                                days
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                    >
                      <Pill className="h-4 w-4 mr-2" />
                      Administer
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Medications */}
      {upcomingRabbits.length > 0 && (
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-amber-50/80 to-amber-100/80 dark:from-amber-900/30 dark:to-amber-800/30 border-b border-amber-200 dark:border-amber-700">
            <CardTitle className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
              <span>Upcoming Medications</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
            <div className="space-y-4">
              {upcomingRabbits.map((rabbit) => (
                <div
                  key={rabbit.id}
                  className="p-4 border border-amber-200 dark:border-amber-700 bg-gradient-to-r from-amber-50/80 to-amber-100/80 dark:from-amber-900/30 dark:to-amber-800/30 rounded-lg"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">{rabbit.name}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hutch {rabbit.hutchId}</p>
                      <div className="mt-2 space-y-1">
                        {rabbit.healthRecords
                          .filter((record) => {
                            if (record.nextDue) {
                              const dueDate = new Date(record.nextDue)
                              const threeDaysFromNow = new Date(new Date().getTime() + 3 * 24 * 60 * 60 * 1000)
                              return (
                                dueDate <= threeDaysFromNow && dueDate >= new Date() && record.status !== "completed"
                              )
                            }
                            return false
                          })
                          .map((record, index) => (
                            <div key={index} className="text-sm">
                              <span className="font-medium text-gray-900 dark:text-gray-100">{record.type}</span> -
                              <span className="text-amber-600 dark:text-amber-400 ml-1">
                                Due {new Date(record.nextDue!).toLocaleDateString()}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/50 dark:bg-gray-700/50 border-amber-300 dark:border-amber-600 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Rabbits Health Status */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-gray-900 dark:text-gray-100">All Rabbits Health Status</span>
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Health Record
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rabbits.map((rabbit) => {
              const status = getHealthStatus(rabbit)
              return (
                <div
                  key={rabbit.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{rabbit.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Hutch {rabbit.hutchId} • {rabbit.breed} • {rabbit.gender === "female" ? "Doe" : "Buck"}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last health check:{" "}
                        {rabbit.healthRecords.length > 0
                          ? new Date(rabbit.healthRecords[rabbit.healthRecords.length - 1].date).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={status === "overdue" ? "destructive" : status === "upcoming" ? "secondary" : "default"}
                      className={
                        status === "good"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : status === "overdue"
                            ? "bg-gradient-to-r from-red-500 to-red-600"
                            : "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                      }
                    >
                      {status === "overdue" ? "Overdue" : status === "upcoming" ? "Upcoming" : "Up to date"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      View Records
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

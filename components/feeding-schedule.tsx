"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Utensils, Clock, Plus } from "lucide-react"
import type { Rabbit } from "@/lib/types"

interface FeedingScheduleProps {
  rabbits: Rabbit[]
}

export default function FeedingSchedule({ rabbits }: FeedingScheduleProps) {
  const getCurrentFeedingStatus = (rabbit: Rabbit) => {
    const now = new Date()
    const lastFed = new Date(rabbit?.feedingSchedule?.lastFed)
    const hoursSinceLastFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60)

    if (hoursSinceLastFed > 24) return "overdue"
    if (hoursSinceLastFed > 12) return "due"
    return "fed"
  }

  const overdueRabbits = rabbits?.filter((r) => getCurrentFeedingStatus(r) === "overdue")
  const dueRabbits = rabbits?.filter((r) => getCurrentFeedingStatus(r) === "due")
  const fedRabbits = rabbits?.filter((r) => getCurrentFeedingStatus(r) === "fed")

  const getTotalDailyFeed = () => {
    return rabbits?.reduce((total, rabbit) => {
      const amount = Number.parseFloat(rabbit?.feedingSchedule?.dailyAmount.replace(/[^\d.]/g, ""))
      return total + (isNaN(amount) ? 0 : amount)
    }, 0)
  }

  return (
    <div className="space-y-6">
      {/* Feeding Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-red-600 dark:text-red-400">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-red-700 dark:from-red-400 dark:to-red-500 bg-clip-text text-transparent">
              {overdueRabbits?.length ?? 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Not fed in 24+ hours</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-amber-600 dark:text-amber-400">Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
              {dueRabbits?.length ?? 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Due for feeding</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-green-600 dark:text-green-400">Recently Fed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-700 dark:from-green-400 dark:to-green-500 bg-clip-text text-transparent">
              {fedRabbits?.length ?? 0}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Fed today</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Daily Feed Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {getTotalDailyFeed().toFixed(1)}g
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total daily requirement</p>
          </CardContent>
        </Card>
      </div>

      {/* Feeding Schedule by Time */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 border-b border-gray-200 dark:border-gray-600">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-gray-900 dark:text-gray-100">Today's Feeding Schedule</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["Morning (6:00 AM)", "Afternoon (2:00 PM)", "Evening (6:00 PM)"].map((timeSlot, index) => (
              <div key={timeSlot} className="space-y-3">
                <h4 className="font-medium text-lg text-gray-900 dark:text-gray-100">{timeSlot}</h4>
                <div className="space-y-2">
                  {rabbits
                    .filter((rabbit) =>
                      rabbit?.feedingSchedule?.times.some((time) => {
                        if (index === 0) return time.includes("6:00") && time.includes("AM")
                        if (index === 1) return time.includes("2:00") && time.includes("PM")
                        return time.includes("6:00") && time.includes("PM")
                      }),
                    )
                    .map((rabbit) => {
                      const status = getCurrentFeedingStatus(rabbit)
                      return (
                        <div
                          key={rabbit?.id}
                          className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-600 rounded bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60"
                        >
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{rabbit?.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {rabbit?.hutch_id} • {rabbit?.feedingSchedule?.dailyAmount}
                            </p>
                          </div>
                          <Badge
                            variant={status === "overdue" ? "destructive" : status === "due" ? "secondary" : "default"}
                            className={
                              status === "fed"
                                ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                                : status === "overdue"
                                  ? "bg-gradient-to-r from-red-500 to-red-600"
                                  : "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                            }
                          >
                            {status === "overdue" ? "Overdue" : status === "due" ? "Due" : "Fed"}
                          </Badge>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Rabbit Feeding Status */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="text-gray-900 dark:text-gray-100">Individual Feeding Status</span>
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Record Feeding
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rabbits?.map((rabbit) => {
              const status = getCurrentFeedingStatus(rabbit)
              const lastFed = new Date(rabbit?.feedingSchedule?.lastFed)
              const hoursSinceLastFed = Math.floor((new Date().getTime() - lastFed.getTime()) / (1000 * 60 * 60))

              return (
                <div
                  key={rabbit.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{rabbit.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Hutch {rabbit?.hutch_id} • {rabbit?.breed} • {rabbit?.gender === "female" ? "Doe" : "Buck"}
                    </p>
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Daily Amount:</span> {rabbit?.feedingSchedule?.dailyAmount}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Feed Type:</span> {rabbit?.feedingSchedule?.feedType}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Schedule:</span> {rabbit?.feedingSchedule?.times.join(", ")}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">Last Fed:</span> {lastFed.toLocaleDateString()} at{" "}
                        {lastFed.toLocaleTimeString()}
                        <span className="text-gray-500 dark:text-gray-500 ml-1">({hoursSinceLastFed}h ago)</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant={status === "overdue" ? "destructive" : status === "due" ? "secondary" : "default"}
                      className={
                        status === "fed"
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : status === "overdue"
                            ? "bg-gradient-to-r from-red-500 to-red-600"
                            : "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                      }
                    >
                      {status === "overdue" ? "Overdue" : status === "due" ? "Due" : "Fed"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                    >
                      <Utensils className="h-4 w-4 mr-2" />
                      Feed Now
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Feed Inventory */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Feed Inventory & Requirements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="font-medium mb-3 text-blue-800 dark:text-blue-300">Daily Requirements</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Pellets:</span>
                  <span className="text-gray-900 dark:text-gray-100">{(getTotalDailyFeed() * 0.7).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Hay:</span>
                  <span className="text-gray-900 dark:text-gray-100">{(getTotalDailyFeed() * 0.2).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Vegetables:</span>
                  <span className="text-gray-900 dark:text-gray-100">{(getTotalDailyFeed() * 0.1).toFixed(1)}g</span>
                </div>
                <div className="flex justify-between font-medium border-t border-blue-200 dark:border-blue-700 pt-2">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-gray-900 dark:text-gray-100">{getTotalDailyFeed().toFixed(1)}g</span>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 rounded-lg border border-green-200 dark:border-green-700">
              <h4 className="font-medium mb-3 text-green-800 dark:text-green-300">Weekly Requirements</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Pellets:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {((getTotalDailyFeed() * 0.7 * 7) / 1000).toFixed(2)}kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Hay:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {((getTotalDailyFeed() * 0.2 * 7) / 1000).toFixed(2)}kg
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Vegetables:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {((getTotalDailyFeed() * 0.1 * 7) / 1000).toFixed(2)}kg
                  </span>
                </div>
                <div className="flex justify-between font-medium border-t border-green-200 dark:border-green-700 pt-2">
                  <span className="text-gray-900 dark:text-gray-100">Total:</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {((getTotalDailyFeed() * 7) / 1000).toFixed(2)}kg
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

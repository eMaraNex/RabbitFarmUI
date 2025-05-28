"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { X, Calendar, Heart, Pill, Utensils, Edit } from "lucide-react"
import { mockRabbits } from "@/lib/mock-data"

interface RabbitProfileProps {
  rabbit_id: string
  onClose: () => void
}

export default function RabbitProfile({ rabbit_id, onClose }: RabbitProfileProps) {
  const rabbit = mockRabbits.find((r) => r.id === rabbit_id)

  if (!rabbit) return null

  const calculateAge = (birthDate: string) => {
    const birth = new Date(birthDate)
    const now = new Date()
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth())
    return months
  }

  return (
    <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/30 dark:to-blue-900/30 border-b border-gray-200 dark:border-gray-600">
          <CardTitle className="flex items-center space-x-3">
            <span className="text-gray-900 dark:text-gray-100">{rabbit.name}</span>
            <Badge
              variant={rabbit.gender === "female" ? "default" : "secondary"}
              className={
                rabbit.gender === "female"
                  ? "bg-gradient-to-r from-pink-500 to-pink-600 text-white"
                  : "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              }
            >
              {rabbit.gender === "female" ? "Doe" : "Buck"}
            </Badge>
            {rabbit.isPregnant && (
              <Badge
                variant="outline"
                className="bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-800 dark:text-pink-300"
              >
                Pregnant
              </Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-gray-100 dark:hover:bg-gray-700">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card className="bg-gradient-to-br from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800 dark:text-blue-300">Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Hutch:</span>
                  <span className="text-gray-700 dark:text-gray-300">{rabbit.hutch_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Breed:</span>
                  <span className="text-gray-700 dark:text-gray-300">{rabbit.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Color:</span>
                  <span className="text-gray-700 dark:text-gray-300">{rabbit.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Birth Date:</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(rabbit.birthDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Age:</span>
                  <span className="text-gray-700 dark:text-gray-300">{calculateAge(rabbit.birthDate)} months</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Weight:</span>
                  <span className="text-gray-700 dark:text-gray-300">{rabbit.weight} kg</span>
                </div>
              </CardContent>
            </Card>

            {/* Breeding Information */}
            <Card className="bg-gradient-to-br from-pink-50/80 to-pink-100/80 dark:from-pink-900/30 dark:to-pink-800/30 border-pink-200 dark:border-pink-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                  <span className="text-pink-800 dark:text-pink-300">Breeding Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {rabbit.lastMatingDate && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Last Mating:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(rabbit.lastMatingDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {rabbit.matedWith && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Mated With:</span>
                    <span className="text-gray-700 dark:text-gray-300">{rabbit.matedWith}</span>
                  </div>
                )}
                {rabbit.expectedBirthDate && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Expected Birth:</span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {new Date(rabbit.expectedBirthDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Total Litters:</span>
                  <span className="text-gray-700 dark:text-gray-300">{rabbit.totalLitters}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Total Kits:</span>
                  <span className="text-gray-700 dark:text-gray-300">{rabbit.totalKits}</span>
                </div>
                {rabbit.parentMale && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Father:</span>
                    <span className="text-gray-700 dark:text-gray-300">{rabbit.parentMale}</span>
                  </div>
                )}
                {rabbit.parentFemale && (
                  <div className="flex justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100">Mother:</span>
                    <span className="text-gray-700 dark:text-gray-300">{rabbit.parentFemale}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Health Records */}
          <Card className="bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Pill className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-green-800 dark:text-green-300">Health Records</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {rabbit.healthRecords.map((record, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 bg-white/60 dark:bg-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{record.type}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{record.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                      <Badge variant="outline" className="text-xs bg-white/50 dark:bg-gray-800/50">
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Feeding Schedule */}
          <Card className="bg-gradient-to-br from-orange-50/80 to-orange-100/80 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Utensils className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                <span className="text-orange-800 dark:text-orange-300">Feeding Schedule</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Daily Feed Amount:</span>
                  <span className="text-gray-700 dark:text-gray-300">{rabbit.feedingSchedule.dailyAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Feed Type:</span>
                  <span className="text-gray-700 dark:text-gray-300">{rabbit.feedingSchedule.feedType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Feeding Times:</span>
                  <span className="text-gray-700 dark:text-gray-300">{rabbit.feedingSchedule.times.join(", ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">Last Fed:</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {new Date(rabbit.feedingSchedule.lastFed).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3">
            <Button
              variant="outline"
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Activity
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

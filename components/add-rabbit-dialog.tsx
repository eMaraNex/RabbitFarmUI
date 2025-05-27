"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Rabbit } from "lucide-react"
import { saveToStorage } from "@/lib/storage"
import { mockRabbits } from "@/lib/mock-data"
import { generateRabbitId } from "@/lib/utils"

interface AddRabbitDialogProps {
  hutchId: string
  onClose: () => void
}

export default function AddRabbitDialog({ hutchId, onClose }: AddRabbitDialogProps) {
  const [formData, setFormData] = useState({
    rabbitId: generateRabbitId(),
    gender: "",
    breed: "",
    color: "",
    birthDate: "",
    weight: "",
    parentMale: "",
    parentFemale: "",
  })

  const breeds = [
    "New Zealand White",
    "Californian",
    "Dutch",
    "Flemish Giant",
    "Mini Rex",
    "Angora",
    "Havana",
    "Lionhead",
    "Silver Fox",
    "Checkered Giant",
    "English Spot",
    "Cinnamon",
    "American",
    "Thrianta",
    "Satin",
  ]

  const colors = [
    "White",
    "Black",
    "Brown",
    "Gray",
    "Chocolate brown",
    "Golden",
    "Silver",
    "Blue",
    "Rust colored",
    "Orange-red",
    "Ivory",
    "White with black points",
    "Black and white",
    "White with black spots",
    "Black and white spotted",
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newRabbit = {
      id: Date.now().toString(),
      rabbitId: formData.rabbitId,
      name: formData.rabbitId, // Using ID as name for large scale
      gender: formData.gender as "male" | "female",
      breed: formData.breed,
      color: formData.color,
      birthDate: formData.birthDate,
      weight: Number.parseFloat(formData.weight) || 0,
      hutchId: hutchId,
      parentMale: formData.parentMale || undefined,
      parentFemale: formData.parentFemale || undefined,
      isPregnant: false,
      totalLitters: 0,
      totalKits: 0,
      healthRecords: [],
      feedingSchedule: {
        dailyAmount: formData.gender === "male" ? "170g" : "150g",
        feedType: "Pellets + Hay",
        times: ["6:00 AM", "6:00 PM"],
        lastFed: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    }

    // Save to storage
    const updatedRabbits = [...mockRabbits, newRabbit]
    saveToStorage("rabbits", updatedRabbits)

    console.log("New rabbit added:", newRabbit)
    onClose()

    // Refresh to show new data
    window.location.reload()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/30 dark:to-blue-900/30 -m-6 mb-6 p-6 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
          <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
            <Rabbit className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Add Rabbit to {hutchId}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rabbitId" className="text-gray-900 dark:text-gray-100">
                Rabbit ID
              </Label>
              <Input
                id="rabbitId"
                value={formData.rabbitId}
                onChange={(e) => setFormData({ ...formData, rabbitId: e.target.value })}
                className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-gray-900 dark:text-gray-100">
                Gender
              </Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="female">Female (Doe)</SelectItem>
                  <SelectItem value="male">Male (Buck)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="breed" className="text-gray-900 dark:text-gray-100">
                Breed
              </Label>
              <Select value={formData.breed} onValueChange={(value) => setFormData({ ...formData, breed: value })}>
                <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Select breed" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {breeds.map((breed) => (
                    <SelectItem key={breed} value={breed}>
                      {breed}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="color" className="text-gray-900 dark:text-gray-100">
                Color
              </Label>
              <Select value={formData.color} onValueChange={(value) => setFormData({ ...formData, color: value })}>
                <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {colors.map((color) => (
                    <SelectItem key={color} value={color}>
                      {color}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="birthDate" className="text-gray-900 dark:text-gray-100">
                Birth Date
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                required
              />
            </div>
            <div>
              <Label htmlFor="weight" className="text-gray-900 dark:text-gray-100">
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="e.g., 3.5"
                value={formData.weight}
                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="parentMale" className="text-gray-900 dark:text-gray-100">
                Father ID (Optional)
              </Label>
              <Input
                id="parentMale"
                placeholder="e.g., RB-001"
                value={formData.parentMale}
                onChange={(e) => setFormData({ ...formData, parentMale: e.target.value })}
                className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="parentFemale" className="text-gray-900 dark:text-gray-100">
                Mother ID (Optional)
              </Label>
              <Input
                id="parentFemale"
                placeholder="e.g., RB-002"
                value={formData.parentFemale}
                onChange={(e) => setFormData({ ...formData, parentFemale: e.target.value })}
                className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Auto-Generated Settings</h4>
            <ul className="text-sm text-green-700 dark:text-green-400 space-y-1">
              <li>• Feeding schedule: {formData.gender === "male" ? "170g" : "150g"} daily</li>
              <li>• Health records: Empty (ready for first checkup)</li>
              <li>• Breeding status: Not pregnant</li>
              <li>• Hutch assignment: {hutchId}</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
            >
              Add Rabbit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Building } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import axios from "axios"
import * as utils from "@/lib/utils"

const planetNames = [
  "Mercury",
  "Venus",
  "Earth",
  "Mars",
  "Jupiter",
  "Saturn",
  "Uranus",
  "Neptune",
  "Pluto",
  "Ceres",
  "Eris",
  "Makemake",
  "Haumea",
  "Sedna",
  "Quaoar",
  "Orcus",
  "Varuna",
  "Ixion",
  "Chaos",
  "Huya",
  "Altjira",
  "Salacia",
  "Varda",
  "Gongong",
]

interface AddRowDialogProps {
  onRowAdded?: () => void
}

export default function AddRowDialog({ onRowAdded }: AddRowDialogProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  })
  const [existingRows, setExistingRows] = useState<any[]>([])
  const [existingHutches, setExistingHutches] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadFromStorage = (farmId: string) => {
    try {
      const cachedRows = localStorage.getItem(`rabbit_farm_rows_${farmId}`)
      const cachedHutches = localStorage.getItem(`rabbit_farm_hutches_${farmId}`)
      return {
        rows: cachedRows ? JSON.parse(cachedRows) : [],
        hutches: cachedHutches ? JSON.parse(cachedHutches) : [],
      }
    } catch (error) {
      console.error("Error loading from storage:", error)
      return { rows: [], hutches: [] }
    }
  }

  const saveToStorage = (farmId: string, data: { rows: any[], hutches: any[] }) => {
    try {
      localStorage.setItem(`rabbit_farm_rows_${farmId}`, JSON.stringify(data.rows))
      localStorage.setItem(`rabbit_farm_hutches_${farmId}`, JSON.stringify(data.hutches))
    } catch (error) {
      console.error("Error saving to storage:", error)
    }
  }

  useEffect(() => {
    if (open && user?.farm_id) {
      // Check local storage first
      const cachedData = loadFromStorage(user.farm_id)
      if (cachedData.rows.length || cachedData.hutches.length) {
        console.log("Using cached rows and hutches")
        setExistingRows(cachedData.rows)
        setExistingHutches(cachedData.hutches)
      }

      // Fetch fresh data from API
      const fetchData = async () => {
        try {
          const [rowsResponse, hutchesResponse] = await Promise.all([
            axios.get(`${utils.apiUrl}/rows/${user.farm_id}`),
            axios.get(`${utils.apiUrl}/hutches/${user.farm_id}`),
          ])
          const newRows = rowsResponse.data.data || []
          const newHutches = hutchesResponse.data.data || []
          setExistingRows(newRows)
          setExistingHutches(newHutches)
          console.log("Loaded existing rows:", newRows)
          console.log("Loaded existing hutches:", newHutches)
          // Save to local storage
          saveToStorage(user.farm_id ?? '', { rows: newRows, hutches: newHutches })
        } catch (error) {
          console.error("Error fetching data:", error)
          if (cachedData.rows.length || cachedData.hutches.length) {
            setExistingRows(cachedData.rows)
            setExistingHutches(cachedData.hutches)
          }
        }
      }
      fetchData()
    }
  }, [open, user])

  const getNextPlanetName = () => {
    const usedNames = existingRows.map((row) => row.name)
    const availableName = planetNames.find((name) => !usedNames.includes(name))
    return availableName || `Row-${existingRows.length + 1}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.farm_id) {
      alert("Farm ID is missing. Please log in again.")
      return
    }
    setIsSubmitting(true)

    try {
      const newRowName = formData.name.trim() || getNextPlanetName()

      // Check if row name already exists
      if (existingRows.some((row) => row.name === newRowName)) {
        alert(`Row "${newRowName}" already exists. Please choose a different name.`)
        setIsSubmitting(false)
        return
      }

      console.log("Creating new row:", newRowName)

      // Create new row
      const newRow = {
        name: newRowName,
        farm_id: user.farm_id,
        description: formData.description || `${newRowName} row with 18 hutches across 3 levels`,
        capacity: 18,
        occupied: 0,
      }

      const rowResponse = await axios.post(`${utils.apiUrl}/rows`, newRow)
      if (!rowResponse.data.success) {
        throw new Error("Failed to create row")
      }

      // Create 18 hutches for the new row (6 per level, 3 levels)
      const levels = ["A", "B", "C"]
      const positions = [1, 2, 3, 4, 5, 6]
      const newHutches = []

      for (const level of levels) {
        for (const position of positions) {
          const hutchId = `${newRowName}-${level}${position}`
          newHutches.push({
            id: hutchId,
            farm_id: user.farm_id,
            row_name: newRowName,
            level,
            position,
            size: "medium",
            material: "wire",
            features: ["water bottle", "feeder"],
            is_occupied: false,
          })
        }
      }

      console.log("Creating hutches:", newHutches)

      // Save hutches
      for (const hutch of newHutches) {
        await axios.post(`${utils.apiUrl}/hutches`, hutch)
      }

      console.log("Successfully created row and hutches")

      // Update local storage with new data
      const updatedRows = [...existingRows, rowResponse.data.data]
      const updatedHutches = [...existingHutches, ...newHutches]
      saveToStorage(user.farm_id, { rows: updatedRows, hutches: updatedHutches })
      setExistingRows(updatedRows)
      setExistingHutches(updatedHutches)

      // Reset form
      setFormData({ name: "", description: "" })
      setOpen(false)

      // Show success message
      alert(`Successfully created "${newRowName}" row with 18 empty hutches!`)

      // Call callback to refresh parent component
      if (onRowAdded) {
        onRowAdded()
      }
    } catch (error: any) {
      console.error("Error creating row:", error)
      alert(error.response?.data?.message || "Error creating row. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add New Row
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/30 dark:to-blue-900/30 -m-6 mb-6 p-6 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
          <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
            <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Add New Row (18 Empty Hutches)</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">
              Row Name
            </Label>
            <Input
              id="name"
              placeholder={`Suggested: ${getNextPlanetName()}`}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Leave empty to use next planet name: {getNextPlanetName()}
            </p>
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-900 dark:text-gray-100">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Describe this row's purpose or location..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              rows={3}
            />
          </div>

          <div className="bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
            <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Row Configuration</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
              <li>• 3 Levels (A, B, C) - Top, Middle, Bottom</li>
              <li>• 6 Hutches per level</li>
              <li>• Total: 18 empty hutches per row</li>
              <li>• Each hutch includes water bottle and feeder</li>
            </ul>
          </div>

          <div className="bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-lg border border-green-200 dark:border-green-700">
            <h4 className="font-medium text-green-800 dark:text-green-300 mb-2">Current Status</h4>
            <p className="text-sm text-green-700 dark:text-green-400">
              Existing rows: {existingRows.length} | Total hutches: {existingHutches.length}
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">
              Next row will be: <strong>{getNextPlanetName()}</strong>
            </p>
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Row & Hutches"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
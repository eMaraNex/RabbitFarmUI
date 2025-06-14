"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, AlertTriangle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import axios from "axios"
import * as utils from "@/lib/utils"

export default function AddHutchDialog() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    rowName: "",
    level: "",
    position: "",
    size: "",
    material: "",
    features: "",
  })
  const [rows, setRows] = useState<any[]>([])
  const [hutches, setHutches] = useState<any[]>([])

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
        setRows(cachedData.rows)
        setHutches(cachedData.hutches)
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
          setRows(newRows)
          setHutches(newHutches)
          saveToStorage(user.farm_id ?? '', { rows: newRows, hutches: newHutches })
        } catch (error) {
          console.error("Error fetching data:", error)
          if (cachedData.rows.length || cachedData.hutches.length) {
            setRows(cachedData.rows)
            setHutches(cachedData.hutches)
          }
        }
      }
      fetchData()
    }
  }, [open, user])

  const getRowHutchCount = (rowName: string) => {
    return hutches.filter((hutch) => hutch.row_name === rowName).length
  }

  const getAvailableRows = () => {
    return rows.filter((row) => getRowHutchCount(row.name) < 18)
  }

  const getNextAvailablePosition = (rowName: string, level: string) => {
    const existingPositions = hutches
      .filter((hutch) => hutch.row_name === rowName && hutch.level === level)
      .map((hutch) => hutch.position)

    for (let i = 1; i <= 6; i++) {
      if (!existingPositions.includes(i)) {
        return i.toString()
      }
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.farm_id) {
      alert("Farm ID is missing. Please log in again.")
      return
    }

    const currentHutchCount = getRowHutchCount(formData.rowName)
    if (currentHutchCount >= 18) {
      alert("This row is full! Please add a new row first.")
      return
    }

    const newHutch = {
      id: `${formData.rowName}-${formData.level}${formData.position}`,
      farm_id: user.farm_id,
      row_name: formData.rowName,
      level: formData.level,
      position: Number.parseInt(formData.position),
      size: formData.size,
      material: formData.material,
      features: formData.features
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f),
      is_occupied: false,
    }

    try {
      const response = await axios.post(`${utils.apiUrl}/hutches/${user.farm_id}`, newHutch)
      if (response.data.success) {
        // Update local storage
        const updatedHutches = [...hutches, response.data.data]
        saveToStorage(user.farm_id, { rows, hutches: updatedHutches })
        setHutches(updatedHutches)
        setOpen(false)
        setFormData({
          rowName: "",
          level: "",
          position: "",
          size: "",
          material: "",
          features: "",
        })
      } else {
        throw new Error("Failed to create hutch")
      }
    } catch (error: any) {
      console.error("Error creating hutch:", error)
      alert(error.response?.data?.message || "Error creating hutch. Please try again.")
    }
  }

  const availableRows = getAvailableRows()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
          <Plus className="h-4 w-4 mr-2" />
          Add Hutch
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle>Add New Hutch</DialogTitle>
        </DialogHeader>

        {availableRows.length === 0 ? (
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800">All Rows Full</h4>
                <p className="text-sm text-amber-700 mt-1">
                  All existing rows have reached their maximum capacity of 18 hutches. Please add a new row first before
                  adding more hutches.
                </p>
                <Button className="mt-3 bg-amber-600 hover:bg-amber-700" size="sm" onClick={() => setOpen(false)}>
                  Add New Row Instead
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="rowName">Row</Label>
              <Select
                value={formData.rowName}
                onValueChange={(value) => {
                  setFormData({ ...formData, rowName: value, position: "" })
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select row" />
                </SelectTrigger>
                <SelectContent>
                  {availableRows.map((row) => (
                    <SelectItem key={row.name} value={row.name}>
                      {row.name} ({getRowHutchCount(row.name)}/18 hutches)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="level">Level</Label>
                <Select
                  value={formData.level}
                  onValueChange={(value) => {
                    const nextPosition = formData.rowName ? getNextAvailablePosition(formData.rowName, value) : ""
                    setFormData({ ...formData, level: value, position: nextPosition })
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Level A (Top)</SelectItem>
                    <SelectItem value="B">Level B (Middle)</SelectItem>
                    <SelectItem value="C">Level C (Bottom)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Select
                  value={formData.position}
                  onValueChange={(value) => setFormData({ ...formData, position: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => {
                      const isOccupied =
                        formData.rowName &&
                        formData.level &&
                        hutches.some(
                          (h) => h.row_name === formData.rowName && h.level === formData.level && h.position === num
                        )
                      return (
                        <SelectItem key={num} value={num.toString()} >
                          {/* disabled={isOccupied} */}
                          Position {num} {isOccupied ? "(Occupied)" : ""}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="size">Hutch Size</Label>
              <Select value={formData.size} onValueChange={(value) => setFormData({ ...formData, size: value })}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (30" x 24" x 18")</SelectItem>
                  <SelectItem value="medium">Medium (36" x 30" x 18")</SelectItem>
                  <SelectItem value="large">Large (48" x 36" x 18")</SelectItem>
                  <SelectItem value="extra-large">Extra Large (60" x 36" x 24")</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="material">Material</Label>
              <Select
                value={formData.material}
                onValueChange={(value) => setFormData({ ...formData, material: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select material" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wire">Wire Mesh</SelectItem>
                  <SelectItem value="wood">Wood Frame</SelectItem>
                  <SelectItem value="plastic">Plastic</SelectItem>
                  <SelectItem value="metal">Metal Frame</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input
                id="features"
                placeholder="e.g., water bottle, feeder, nesting box"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-2 sm:gap-0 space-x-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.rowName || !formData.level || !formData.position}>
                Add Hutch
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

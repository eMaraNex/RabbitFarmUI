"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, AlertTriangle } from "lucide-react"
import { saveToStorage } from "@/lib/storage"
import { mockRows, mockHutches } from "@/lib/mock-data"

export default function AddHutchDialog() {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState({
    rowName: "",
    level: "",
    position: "",
    size: "",
    material: "",
    features: "",
  })

  const getRowHutchCount = (rowName: string) => {
    return mockHutches.filter((hutch) => hutch.rowName === rowName).length
  }

  const getAvailableRows = () => {
    return mockRows.filter((row) => getRowHutchCount(row.name) < 18)
  }

  const getNextAvailablePosition = (rowName: string, level: string) => {
    const existingPositions = mockHutches
      .filter((hutch) => hutch.rowName === rowName && hutch.level === level)
      .map((hutch) => hutch.position)

    for (let i = 1; i <= 6; i++) {
      if (!existingPositions.includes(i)) {
        return i.toString()
      }
    }
    return ""
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedRow = mockRows.find((row) => row.name === formData.rowName)
    if (!selectedRow) return

    const currentHutchCount = getRowHutchCount(formData.rowName)
    if (currentHutchCount >= 18) {
      alert("This row is full! Please add a new row first.")
      return
    }

    const newHutch = {
      id: `${formData.rowName}-${formData.level}${formData.position}`,
      rowName: formData.rowName,
      level: formData.level,
      position: Number.parseInt(formData.position),
      size: formData.size,
      material: formData.material,
      features: formData.features
        .split(",")
        .map((f) => f.trim())
        .filter((f) => f),
      isOccupied: false,
      createdAt: new Date().toISOString(),
    }

    // Save to storage
    const updatedHutches = [...mockHutches, newHutch]
    saveToStorage("hutches", updatedHutches)

    console.log("New hutch created:", newHutch)

    setOpen(false)
    setFormData({
      rowName: "",
      level: "",
      position: "",
      size: "",
      material: "",
      features: "",
    })

    // Refresh the page to show new data
    window.location.reload()
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
                        mockHutches.some(
                          (h) => h.rowName === formData.rowName && h.level === formData.level && h.position === num,
                        )
                      return (
                        <SelectItem key={num} value={num.toString()} disabled={isOccupied}>
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

            <div className="flex justify-end space-x-3">
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

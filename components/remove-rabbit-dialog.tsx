"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertTriangle, Trash2, DollarSign } from "lucide-react"
import { saveToStorage } from "@/lib/storage"
import { mockRabbits } from "@/lib/mock-data"
import type { Rabbit, EarningsRecord } from "@/lib/types"

interface RemoveRabbitDialogProps {
  hutch_id: string
  rabbit: Rabbit | undefined
  onClose: () => void
}

export default function RemoveRabbitDialog({ hutch_id, rabbit, onClose }: RemoveRabbitDialogProps) {
  const [formData, setFormData] = useState({
    reason: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    // Sale-specific fields
    saleAmount: "",
    currency: "USD",
    weight: "",
    saleType: "",
    includesUrine: false,
    includesManure: false,
    buyerName: "",
    saleNotes: "",
  })

  const reasons = [
    "Sale",
    "Death - Natural",
    "Death - Disease",
    "Death - Accident",
    "Transfer to another farm",
    "Breeding loan",
    "Retirement",
    "Health issues",
    "Other",
  ]

  const saleTypes = [
    { value: "whole", label: "Whole Rabbit" },
    { value: "meat_only", label: "Meat Only" },
    { value: "skin_only", label: "Skin Only" },
    { value: "meat_and_skin", label: "Meat and Skin" },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!rabbit) return

    // Create removal record
    const removalRecord = {
      rabbit_id: rabbit.rabbit_id,
      hutch_id: hutch_id,
      reason: formData.reason,
      notes: formData.notes,
      date: formData.date,
      removedAt: new Date().toISOString(),
    }

    // If it's a sale, create earnings record
    if (formData.reason === "Sale" && formData.saleAmount) {
      const earningsRecord: EarningsRecord = {
        id: Date.now().toString(),
        type: "rabbit_sale",
        rabbit_id: rabbit.rabbit_id,
        amount: Number.parseFloat(formData.saleAmount),
        currency: formData.currency,
        date: formData.date,
        weight: formData.weight ? Number.parseFloat(formData.weight) : rabbit.weight,
        saleType: formData.saleType as any,
        includesUrine: formData.includesUrine,
        includesManure: formData.includesManure,
        buyerName: formData.buyerName,
        notes: formData.saleNotes,
        createdAt: new Date().toISOString(),
      }

      // Save earnings record
      const existingEarnings = JSON.parse(localStorage.getItem("rabbit_farm_earnings") || "[]")
      existingEarnings.push(earningsRecord)
      saveToStorage("earnings", existingEarnings)
    }

    // Remove rabbit from active list
    const updatedRabbits = mockRabbits.filter((r) => r.id !== rabbit.id)

    // Save removal record
    const removalRecords = JSON.parse(localStorage.getItem("rabbit_farm_rabbit_removals") || "[]")
    removalRecords.push(removalRecord)

    saveToStorage("rabbits", updatedRabbits)
    saveToStorage("rabbit_removals", removalRecords)

    console.log("Rabbit removed:", removalRecord)
    onClose()

    // Refresh to show updated data
    window.location.reload()
  }

  if (!rabbit) {
    return null
  }

  const isSale = formData.reason === "Sale"

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 -m-6 mb-6 p-6 rounded-t-lg border-b border-red-200 dark:border-red-700">
          <DialogTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span>Remove Rabbit from {hutch_id}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 p-4 rounded-lg border border-red-200 dark:border-red-700 mb-4">
          <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">Rabbit Details</h4>
          <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
            <p>
              <strong>ID:</strong> {rabbit.rabbit_id}
            </p>
            <p>
              <strong>Breed:</strong> {rabbit.breed}
            </p>
            <p>
              <strong>Gender:</strong> {rabbit.gender === "female" ? "Doe" : "Buck"}
            </p>
            <p>
              <strong>Weight:</strong> {rabbit.weight}kg
            </p>
            <p>
              <strong>Age:</strong>{" "}
              {Math.floor((new Date().getTime() - new Date(rabbit.birthDate).getTime()) / (1000 * 60 * 60 * 24 * 30))}{" "}
              months
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="reason" className="text-gray-900 dark:text-gray-100">
              Reason for Removal *
            </Label>
            <Select value={formData.reason} onValueChange={(value) => setFormData({ ...formData, reason: value })}>
              <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                {reasons.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Sale-specific fields */}
          {isSale && (
            <div className="bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 p-4 rounded-lg border border-green-200 dark:border-green-700 space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                <h4 className="font-medium text-green-800 dark:text-green-300">Sale Details</h4>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="saleAmount" className="text-gray-900 dark:text-gray-100">
                    Sale Amount *
                  </Label>
                  <Input
                    id="saleAmount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.saleAmount}
                    onChange={(e) => setFormData({ ...formData, saleAmount: e.target.value })}
                    className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    required={isSale}
                  />
                </div>
                <div>
                  <Label htmlFor="currency" className="text-gray-900 dark:text-gray-100">
                    Currency
                  </Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="KES">KES (KSh)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="weight" className="text-gray-900 dark:text-gray-100">
                    Sale Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder={rabbit.weight.toString()}
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="saleType" className="text-gray-900 dark:text-gray-100">
                    Sale Type
                  </Label>
                  <Select
                    value={formData.saleType}
                    onValueChange={(value) => setFormData({ ...formData, saleType: value })}
                  >
                    <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Select sale type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      {saleTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="buyerName" className="text-gray-900 dark:text-gray-100">
                  Buyer Name
                </Label>
                <Input
                  id="buyerName"
                  placeholder="Enter buyer's name"
                  value={formData.buyerName}
                  onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
                  className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.includesUrine}
                    onChange={(e) => setFormData({ ...formData, includesUrine: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Includes Urine</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.includesManure}
                    onChange={(e) => setFormData({ ...formData, includesManure: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Includes Manure</span>
                </label>
              </div>

              <div>
                <Label htmlFor="saleNotes" className="text-gray-900 dark:text-gray-100">
                  Sale Notes
                </Label>
                <Textarea
                  id="saleNotes"
                  placeholder="Additional sale details..."
                  value={formData.saleNotes}
                  onChange={(e) => setFormData({ ...formData, saleNotes: e.target.value })}
                  className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  rows={2}
                />
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="notes" className="text-gray-900 dark:text-gray-100">
              Additional Notes
            </Label>
            <Textarea
              id="notes"
              placeholder="Add any additional details about the removal..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="date" className="text-gray-900 dark:text-gray-100">
              Date of Removal
            </Label>
            <input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div className="bg-gradient-to-r from-amber-50/80 to-amber-100/80 dark:from-amber-900/30 dark:to-amber-800/30 p-4 rounded-lg border border-amber-200 dark:border-amber-700">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Warning</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  This action will permanently remove the rabbit from the active hutch. The removal will be logged for
                  record keeping{isSale ? " and earnings will be recorded." : "."}
                </p>
              </div>
            </div>
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
              variant="destructive"
              disabled={!formData.reason || (isSale && !formData.saleAmount)}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Rabbit
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

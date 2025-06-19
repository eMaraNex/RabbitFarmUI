"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Rabbit, Plus, Trash2, History, Eye, AlertTriangle, DollarSign } from "lucide-react";
import axios from "axios";
import * as utils from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useSnackbar } from "notistack";
import type { Hutch as HutchType, Rabbit as RabbitType, Row as RowType, EarningsRecord } from "@/lib/types";
import AddRabbitDialog from "@/components/add-rabbit-dialog";

// RemoveRabbitDialog Component
interface RemoveRabbitDialogProps {
  hutch_id: string;
  rabbit: RabbitType | undefined;
  onClose: () => void;
  onRemovalSuccess?: (rabbitId: string) => void;
}

export default function RemoveRabbitDialog({ hutch_id, rabbit, onClose, onRemovalSuccess }: RemoveRabbitDialogProps) {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [formData, setFormData] = useState({
    reason: "",
    notes: "",
    date: new Date().toISOString().split("T")[0],
    saleAmount: "",
    currency: "USD",
    saleWeight: "",
    sale_type: undefined as "whole" | "meat_only" | "skin_only" | "meat_and_skin" | undefined,
    includes_urine: false,
    includes_manure: false,
    sold_to: "",
    sale_notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
  ];

  const saleTypes = [
    { value: "whole", label: "Whole Rabbit" },
    { value: "meat_only", label: "Meat Only" },
    { value: "skin_only", label: "Skin Only" },
    { value: "meat_and_skin", label: "Meat and Skin" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!rabbit || !user?.farm_id) {
      enqueueSnackbar("Missing rabbit or farm ID. Please try again.", { variant: "error" });
      return;
    }

    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Create removal record - update rabbit removals table
      const removalRecord = {
        rabbit_id: rabbit.rabbit_id,
        hutch_id,
        farm_id: user.farm_id,
        reason: formData.reason,
        notes: formData.notes,
        date: formData.date,
        ...(formData.reason === "Sale" && {
          sale_amount: Number.parseFloat(formData.saleAmount),
          sale_weight: formData.saleWeight ? Number.parseFloat(formData.saleWeight) : null,
          sold_to: formData.sold_to || "",
          sale_notes: formData.sale_notes || "",
          currency: formData.currency,
          sale_type: formData.sale_type,
        }),
      };

      await axios.post(`${utils.apiUrl}/rabbits/rabbit_removals/${user.farm_id}/${rabbit.rabbit_id}`, removalRecord, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // If it's a sale, create earnings record
      if (formData.reason === "Sale" && formData.saleAmount && user?.farm_id) {
        const earningsRecord: EarningsRecord = {
          type: "rabbit_sale",
          rabbit_id: rabbit.rabbit_id,
          amount: Number.parseFloat(formData.saleAmount),
          currency: formData.currency,
          date: formData.date,
          weight: formData.saleWeight ? Number.parseFloat(formData.saleWeight) : rabbit.weight,
          sale_type: formData.sale_type,
          includes_urine: formData.includes_urine,
          includes_manure: formData.includes_manure,
          buyer_name: formData.sold_to,
          notes: formData.sale_notes,
          farm_id: user.farm_id,
          hutch_id,
        };

        await axios.post(`${utils.apiUrl}/earnings/${user.farm_id}`, earningsRecord, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }

      // Fetch the latest removal history for the hutch
      const response = await axios.get(`${utils.apiUrl}/hutches/${user.farm_id}/${hutch_id ?? removalRecord?.hutch_id}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newRemovalRecords = response.data?.data || [];
      const newFilteredRecords = newRemovalRecords.filter((record: any) => record?.removed_at !== null);
      localStorage.setItem("rabbit_farm_rabbit_removals", JSON.stringify(newFilteredRecords));

      // Update local storage for rabbits and hutches
      const cachedRabbits = JSON.parse(localStorage.getItem(`rabbit_farm_rabbits_${user.farm_id}`) || "[]") as RabbitType[];
      const updatedRabbits = cachedRabbits.filter((r: RabbitType) => r.rabbit_id !== rabbit.rabbit_id);
      localStorage.setItem(`rabbit_farm_rabbits_${user.farm_id}`, JSON.stringify(updatedRabbits));

      const cachedHutches = JSON.parse(localStorage.getItem(`rabbit_farm_hutches_${user.farm_id}`) || "[]") as any[];
      const updatedHutches = cachedHutches.map((h: any) =>
        h.id === hutch_id ? { ...h, isOccupied: false } : h
      );
      localStorage.setItem(`rabbit_farm_hutches_${user.farm_id}`, JSON.stringify(updatedHutches));

      // Show success snackbar
      enqueueSnackbar(`Rabbit ${rabbit.rabbit_id} removed successfully!`, { variant: "success" });

      // Notify parent component of successful removal with rabbit ID
      onRemovalSuccess?.(rabbit.rabbit_id || "");

      onClose();
    } catch (error: any) {
      console.error("Error removing rabbit:", error);
      enqueueSnackbar(error.response?.data?.message || "Error removing rabbit. Please try again.", { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rabbit) {
    return null;
  }

  const isSale = formData.reason === "Sale";

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 -m-6 mb-6 p-6 rounded-t-lg border-b border-red-200 dark:border-red-700">
          <DialogTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-red-600 dark:text-red-400">Remove Rabbit from {hutch_id}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="bg-gradient-to-r from-red-50/80 to-red-100/80 dark:from-red-600/30 dark:to-red-700/30 p-4 rounded-lg border border-red-200 dark:border-red-600 mb-4">
          <h4 className="font-medium text-red-800 dark:text-red-300 mb-2">Rabbit Details</h4>
          <div className="text-sm text-red-700 dark:text-red-400 space-y-1">
            <p><strong>ID:</strong> {rabbit.id}</p>
            <p><strong>Rabbit ID:</strong> {rabbit.rabbit_id}</p>
            <p><strong>Breed:</strong> {rabbit.breed}</p>
            <p><strong>Gender:</strong> {rabbit.gender === "female" ? "Doe" : "Buck"}</p>
            <p><strong>Weight:</strong> {rabbit.weight}kg</p>
            <p>
              <strong>Age:</strong>{" "}
              {Math.floor((new Date().getTime() - new Date(rabbit.birth_date ?? new Date()).getTime()) / (1000 * 60 * 60 * 24 * 30))}{' '}
              months
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div>
            <Label htmlFor="date" className="text-gray-900 dark:text-gray-100">
              Date of Removal *
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              required
            />
          </div>
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
                  <Label htmlFor="saleWeight" className="text-gray-900 dark:text-gray-100">
                    Sale Weight (kg)
                  </Label>
                  <Input
                    id="saleWeight"
                    type="number"
                    step="0.1"
                    placeholder={rabbit.weight.toString()}
                    value={formData.saleWeight}
                    onChange={(e) => setFormData({ ...formData, saleWeight: e.target.value })}
                    className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <Label htmlFor="sale_type" className="text-gray-900 dark:text-gray-100">
                    Sale Type *
                  </Label>
                  <Select
                    value={formData.sale_type}
                    onValueChange={(value: "whole" | "meat_only" | "skin_only" | "meat_and_skin") =>
                      setFormData({ ...formData, sale_type: value })}
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
                <Label htmlFor="sold_to" className="text-gray-900 dark:text-gray-100">
                  Sold To
                </Label>
                <Input
                  id="sold_to"
                  type="text"
                  placeholder="Enter buyer's name..."
                  value={formData.sold_to}
                  onChange={(e) => setFormData({ ...formData, sold_to: e.target.value })}
                  className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includes_urine}
                    onChange={(e) => setFormData({ ...formData, includes_urine: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Includes Urine</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.includes_manure}
                    onChange={(e) => setFormData({ ...formData, includes_manure: e.target.checked })}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-900 dark:text-gray-100">Includes Manure</span>
                </label>
              </div>

              <div>
                <Label htmlFor="sale_notes" className="text-gray-900 dark:text-gray-100">
                  Sale Notes
                </Label>
                <Textarea
                  id="sale_notes"
                  placeholder="Additional sale details..."
                  value={formData.sale_notes}
                  onChange={(e) => setFormData({ ...formData, sale_notes: e.target.value })}
                  className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  rows={3}
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
              name="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100"
              required
            />
          </div>

          <div className="bg-gradient-to-r from-amber-50/80 to-amber-100/80 dark:from-amber-900/30 dark:to-amber-800/30 p-4 rounded-lg border-amber-lg border-200 dark:border-amber-700">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 dark:text-amber-300">Warning</h4>
                <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                  This action will permanently remove the rabbit from the active hutch. The removal will be logged in for
                  keeping{isSale ? " and earnings will be recorded." : "."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 sm:gap-0 space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={!formData.reason || (isSale && !formData.saleAmount) || isSubmitting}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {isSubmitting ? "Removing..." : "Remove Rabbit"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
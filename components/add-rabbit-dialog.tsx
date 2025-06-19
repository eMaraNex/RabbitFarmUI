"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Rabbit as RabbitIcon } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { generateRabbitId } from "@/lib/utils"
import axios from "axios"
import * as utils from "@/lib/utils"
import { Rabbit } from "@/lib/types"

interface AddRabbitDialogProps {
  hutch_id: string;
  onClose: () => void;
  onRabbitAdded: (newRabbit: Rabbit) => void;
}

export default function AddRabbitDialog({ hutch_id, onClose, onRabbitAdded }: AddRabbitDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    rabbit_id: generateRabbitId(),
    gender: "",
    breed: "",
    color: "",
    birth_date: "",
    weight: "",
    pair: "",
    parent_male_id: "",
    parent_female_id: "",
  });

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

  const saveToStorage = (farmId: string, rabbits: Rabbit[]) => {
    try {
      localStorage.setItem(`rabbit_farm_rabbits_${farmId}`, JSON.stringify(rabbits));
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.farm_id) {
      alert("Farm ID is missing. Please log in again.");
      return;
    }

    const newRabbit: Rabbit = {
      rabbit_id: formData.rabbit_id,
      farm_id: user.farm_id,
      name: formData.rabbit_id,
      gender: formData.gender as "male" | "female",
      breed: formData.breed,
      color: formData.color,
      birth_date: formData.birth_date,
      weight: Number.parseFloat(formData.weight) || 0,
      hutch_id: hutch_id,
      parent_male_id: formData.parent_male_id || undefined,
      parent_female_id: formData.parent_female_id || undefined,
      is_pregnant: false,
      status: "active"
    };

    try {
      const response = await axios.post(`${utils.apiUrl}/rabbits/${user.farm_id}`, newRabbit, {
        headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` },
      });
      if (response.data.success) {
        const addedRabbit: Rabbit = response.data.data;
        // Update local storage
        const cachedRabbits = localStorage.getItem(`rabbit_farm_rabbits_${user.farm_id}`);
        const existingRabbits: Rabbit[] = cachedRabbits ? JSON.parse(cachedRabbits) : [];
        const updatedRabbits = [...existingRabbits, addedRabbit];
        saveToStorage(user.farm_id, updatedRabbits);
        onRabbitAdded(addedRabbit);
        onClose();
      } else {
        throw new Error("Failed to create rabbit");
      }
    } catch (error: any) {
      console.error("Error creating rabbit:", error);
      alert(error.response?.data?.message || "Error creating rabbit. Please try again.");
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 max-h-[80vh] overflow-y-auto shadow-2xl">
        <DialogHeader className="bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/30 dark:to-blue-900/30 -m-6 mb-6 p-6 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
          <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
            <RabbitIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span>Add Rabbit to {hutch_id}</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rabbit_id" className="text-gray-900 dark:text-gray-100">
                Rabbit ID
              </Label>
              <Input
                id="rabbit_id"
                value={formData.rabbit_id}
                onChange={(e) => setFormData({ ...formData, rabbit_id: e.target.value })}
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
              <Label htmlFor="birth_date" className="text-gray-900 dark:text-gray-100">
                Birth Date
              </Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
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
              <Label htmlFor="parent_male_id" className="text-gray-900 dark:text-gray-100">
                Father ID (Optional)
              </Label>
              <Input
                id="parent_male_id"
                placeholder="e.g., RB-001"
                value={formData.parent_male_id}
                onChange={(e) => setFormData({ ...formData, parent_male_id: e.target.value })}
                className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="parent_female_id" className="text-gray-900 dark:text-gray-100">
                Mother ID (Optional)
              </Label>
              <Input
                id="parent_female_id"
                placeholder="e.g., RB-002"
                value={formData.parent_female_id}
                onChange={(e) => setFormData({ ...formData, parent_female_id: e.target.value })}
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
              <li>• Hutch assignment: {hutch_id}</li>
            </ul>
          </div>

          <div className="flex justify-end gap-2 sm:gap-0 space-x-3">
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
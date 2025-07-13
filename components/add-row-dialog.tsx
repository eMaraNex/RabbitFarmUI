"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import * as utils from "@/lib/utils";
import FarmCreationModal from "@/components/farm-creation-modal";
import type { Row, Hutch } from "@/types";
import { useSnackbar } from "notistack";
import { AddRowDialogProps } from "@/types";
import { planetNames } from "@/lib/constants";

export default function AddRowDialog({ open, onClose, onRowAdded, }: AddRowDialogProps) {
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const { toast } = useToast();
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    capacity: "6",
    levels: "3",
  });
  const [existingRows, setExistingRows] = useState<Row[]>([]);
  const [existingHutches, setExistingHutches] = useState<Hutch[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const loadFromStorage = (farmId: string) => {
    try {
      const cachedRows = localStorage.getItem(`rabbit_farm_rows_${farmId}`);
      const cachedHutches = localStorage.getItem(`rabbit_farm_hutches_${farmId}`);
      return {
        rows: cachedRows ? JSON.parse(cachedRows) : [],
        hutches: cachedHutches ? JSON.parse(cachedHutches) : [],
      };
    } catch (error) {
      console.error("Error loading from storage:", error);
      enqueueSnackbar("Failed to load cached data.", { variant: "error" });
      return { rows: [], hutches: [] };
    }
  };
  const getValidLevels = (capacity: number) => {
    const possibleLevels = [2, 3, 4, 5, 6];
    return possibleLevels.filter(level => capacity % level === 0);
  };

 
  const saveToStorage = (farmId: string, data: { rows: Row[]; hutches: Hutch[] }) => {
    try {
      localStorage.setItem(`rabbit_farm_rows_${farmId}`, JSON.stringify(data.rows));
      localStorage.setItem(`rabbit_farm_hutches_${farmId}`, JSON.stringify(data.hutches));
    } catch (error) {
      console.error("Error saving to storage:", error);
      enqueueSnackbar("Failed to save data to storage.", { variant: "error" });
    }
  };

  useEffect(() => {
    if (!open || !user?.farm_id) return;

    const cachedData = loadFromStorage(user.farm_id);
    if (cachedData.rows.length || cachedData.hutches.length) {
      setExistingRows(cachedData.rows);
      setExistingHutches(cachedData.hutches);
    }

    const fetchData = async () => {
      try {
        const token = localStorage.getItem("rabbit_farm_token");
        if (!token) throw new Error("Authentication token missing");

        const [rowsResponse, hutchesResponse] = await Promise.all([
          axios.get(`${utils.apiUrl}/rows/list/${user.farm_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${utils.apiUrl}/hutches/${user.farm_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        const newRows: Row[] = rowsResponse.data.data || [];
        const newHutches: Hutch[] = hutchesResponse.data.data || [];
        setExistingRows(newRows);
        setExistingHutches(newHutches);
        saveToStorage(user.farm_id ?? '', { rows: newRows, hutches: newHutches });
      } catch (error) {
        console.error("Error fetching data:", error);
        enqueueSnackbar("Failed to fetch rows or hutches. Using cached data.", { variant: "warning" });
        if (cachedData.rows.length || cachedData.hutches.length) {
          setExistingRows(cachedData.rows);
          setExistingHutches(cachedData.hutches);
        }
      }
    };
    fetchData();
  }, [open, user]);

  const getNextPlanetName = () => {
    const usedNames = existingRows.map((row) => row.name);
    const availableName = planetNames.find((name) => !usedNames.includes(name));
    return availableName || `Row-${existingRows.length + 1}`;
  };

  const generateLevels = (numLevels: number) => {
    return Array.from({ length: numLevels }, (_, i) => String.fromCharCode(65 + i));
  };

  // const distributeHutches = (capacity: number, numLevels: number) => {
  //   const levels = generateLevels(numLevels);
  //   const baseHutchesPerLevel = Math.floor(capacity / numLevels);
  //   const remainder = capacity % numLevels;
  //   const distribution: { [key: string]: number } = {};

  //   levels.forEach((level, index) => {
  //     distribution[level] = baseHutchesPerLevel + (index < remainder ? 1 : 0);
  //   });

  //   return distribution;
  // };

  const distributeHutches = (capacity: number, numLevels: number) => {
    const levels = generateLevels(numLevels);
    const hutchesPerLevel = capacity / numLevels; // This will now always be an integer due to validation
    const distribution: { [key: string]: number } = {};

    levels.forEach(level => {
      distribution[level] = hutchesPerLevel;
    });

    return distribution;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const capacity = parseInt(formData.capacity);
    const levels = parseInt(formData.levels);

    if (formData.name && existingRows.some((row) => row.name === formData.name.trim())) {
      newErrors.name = `Row "${formData.name}" already exists.`;
    }
    if (isNaN(capacity) || capacity < 1) {
      newErrors.capacity = "Capacity must be a positive number.";
    }
    if (isNaN(levels) || levels < 1) {
      newErrors.levels = "Number of levels must be a positive number.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const farmId = localStorage.getItem("rabbit_farm_id");
    if (!farmId) {
      setIsFarmModalOpen(true);
      return;
    }

    if (!user?.farm_id) {
      enqueueSnackbar("Farm ID is missing. Please log in again.", { variant: "error" });
      return;
    }

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const newRowName = formData.name.trim() || getNextPlanetName();
      const capacity = parseInt(formData.capacity);
      const numLevels = parseInt(formData.levels);

      if (existingRows.some((row) => row.name === newRowName)) {
        enqueueSnackbar(`Row "${newRowName}" already exists. Please choose a different name.`, { variant: "error" });
        setIsSubmitting(false);
        return;
      }

      const distribution = distributeHutches(capacity, numLevels);
      const newRow: Row = {
        name: newRowName,
        farm_id: user.farm_id,
        description: formData.description || `${newRowName} row with ${capacity} hutches across ${numLevels} levels`,
        capacity,
        levels: Object.keys(distribution),
      };

      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) throw new Error("Authentication token missing");

      const response = await axios.post(`${utils.apiUrl}/rows/create/${user.farm_id}`, newRow, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to create row");
      }

      const newHutches: Hutch[] = [];
      for (const [level, count] of Object.entries(distribution)) {
        for (let position = 1; position <= count; position++) {
          const hutch_id = `${newRowName}-${level}${position}`;
          newHutches.push({
            id: hutch_id,
            farm_id: user.farm_id,
            row_name: newRowName,
            level,
            position,
            size: "medium",
            material: "wire",
            features: ["water bottle", "feeder"],
            is_occupied: false,
            is_deleted: 0,
            name: ""
          });
        }
      }

      // Uncomment if you want to create hutches via API
      // for (const hutch of newHutches) {
      //   await axios.post(`${utils.apiUrl}/hutches`, hutch, {
      //     headers: { Authorization: `Bearer ${token}` },
      //   });
      // }

      const updatedRows = [...existingRows, response.data.data];
      const updatedHutches = [...existingHutches, ...newHutches];
      saveToStorage(user.farm_id, { rows: updatedRows, hutches: updatedHutches });
      setExistingRows(updatedRows);
      setExistingHutches(updatedHutches);

      setFormData({ name: "", description: "", capacity: "6", levels: "3" });
      onClose();

      enqueueSnackbar(`Successfully created row "${newRowName}" with ${capacity} hutches across ${numLevels} levels!`, {
        variant: "success",
      });

      if (onRowAdded) {
        onRowAdded();
      }
    } catch (error: any) {
      console.error("Error creating row:", error);
      const errorMessage = error.response?.data?.message || "Error creating row. Please try again.";
      setErrors({ submit: errorMessage });
      enqueueSnackbar(errorMessage, { variant: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const capacity = parseInt(formData.capacity);
    const levels = parseInt(formData.levels);
    const validLevels = getValidLevels(capacity);
    if (!validLevels.includes(levels)) {
      setFormData(prev => ({
        ...prev,
        levels: validLevels.length > 0 ? validLevels[0].toString() : "3",
      }));
    }
  }, [formData.capacity]);

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-gray-900 rounded-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
              Add Row
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-medium dark:text-gray-200"
              >
                Row Name
              </Label>
              <Input
                id="name"
                placeholder={`Suggested: ${getNextPlanetName()}`}
                value={formData.name}
                onChange={e =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 dark:text-gray-100"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Leave empty to use: {getNextPlanetName()}
              </p>
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="capacity"
                className="text-sm font-medium dark:text-gray-200"
              >
                Capacity
              </Label>
              <Select
                value={formData.capacity}
                onValueChange={value =>
                  setFormData({ ...formData, capacity: value })
                }
              >
                <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select capacity" />
                </SelectTrigger>
                <SelectContent>
                  {[6, 8, 12, 15, 18, 24].map(cap => (
                    <SelectItem key={cap} value={cap.toString()}>
                      {cap} Hutches
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.capacity && (
                <p className="text-xs text-red-500">{errors.capacity}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="levels"
                className="text-sm font-medium dark:text-gray-200"
              >
                Number of Levels
              </Label>
              {/* <Select
                value={formData.levels}
                onValueChange={(value) => setFormData({ ...formData, levels: value })}
              >
                <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select number of levels" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Levels
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select> */}
              <Select
                value={formData.levels}
                onValueChange={value =>
                  setFormData({ ...formData, levels: value })
                }
              >
                <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <SelectValue placeholder="Select number of levels" />
                </SelectTrigger>
                <SelectContent>
                  {getValidLevels(parseInt(formData.capacity)).map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} Levels
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.levels && (
                <p className="text-xs text-red-500">{errors.levels}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="description"
                className="text-sm font-medium dark:text-gray-200"
              >
                Description
              </Label>
              <Textarea
                id="description"
                placeholder="Describe this row's purpose or location..."
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600 dark:text-gray-100"
                rows={3}
              />
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">
                Row Configuration
              </h4>
              <ul className="text-sm text-blue-700 dark:text-blue-500 space-y-1">
                <li>
                  · {formData.levels} Levels (
                  {generateLevels(parseInt(formData.levels)).join(", ")})
                </li>
                <li>· {formData.capacity} Total Hutches</li>
                <li>· Each hutch includes water bottle and feeder</li>
              </ul>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border-green-200 dark:border-green-800">
              <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">
                Current Status
              </h4>
              <p className="text-sm text-green-700 dark:text-green-500">
                Existing rows: {existingRows.length} | Total hutches:{" "}
                {existingHutches.length}
              </p>
              {/* <p className="text-sm text-green-700 dark:text-green-500 mt-1">
                Next row will be: <strong>{getNextPlanetName()}</strong>
              </p> */}
            </div>
            {errors.submit && (
              <div className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-400 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {errors.submit}
              </div>
            )}
            <DialogFooter className="flex justify-end gap-2 sm:gap-0 space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="dark:border-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
              >
                {isSubmitting ? "Creating..." : "Create Row & Hutches"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <FarmCreationModal
        isOpen={isFarmModalOpen}
        onClose={() => {
          setIsFarmModalOpen(false);
          onClose();
        }}
        onFarmCreated={() => {
          setIsFarmModalOpen(false);
        }}
      />
    </>
  );
}
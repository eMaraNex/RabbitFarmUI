"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from '@/lib/toast-provider';
import { Rabbit, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import * as utils from "@/lib/utils";
import axios from "axios";
import type { AddKitDialogProps, KitFormData } from "@/types";
import { colors } from "@/lib/constants";

export default function AddKitDialog({ rabbit, doeId, doeName, buckName, onClose, onKitAdded }: AddKitDialogProps) {
    const { user } = useAuth();
    const { showSuccess, showError } = useToast();
    const [actualBirthDate, setActualBirthDate] = useState<string>(new Date().toISOString().split("T")[0]);
    const [kits, setKits] = useState<KitFormData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [nextKitNumber, setNextKitNumber] = useState<number>(1);
    const [buckOptions, setBuckOptions] = useState<any>([]);
    const [selectedBuckOption, setSelectedBuckOption] = useState<any | null>(null);

    // Fetch existing kits to determine next kit_number
    useEffect(() => {
        if (!user?.farm_id) return;

        const fetchInitialData = async () => {
            try {
                const breedingResponse = await axios.get(`${utils.apiUrl}/breeds/history/${user.farm_id}/${doeId}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` },
                });
                const breedingData = breedingResponse.data.data || [];
                const breedingArray = Array.isArray(breedingData) ? breedingData : [breedingData];
                const validBreedingRecords = breedingArray
                    .filter((record: any) => record && record.buck_id && record.doe_id === doeId)
                    .sort((a: any, b: any) => new Date(b.mating_date).getTime() - new Date(a.mating_date).getTime());

                const uniqueBucks = new Map<string, any>();
                for (const record of validBreedingRecords) {
                    if (!uniqueBucks.has(record.buck_id)) {
                        uniqueBucks.set(record.buck_id, {
                            buck_id: record.buck_id,
                            buck_name: record.buck_id,
                            breeding_record_id: record.id,
                            mating_date: record.mating_date,
                            expected_birth_date: record.expected_birth_date,
                        });
                    }
                }

                const buckOptionsArray = Array.from(uniqueBucks.values());
                setBuckOptions(buckOptionsArray);
                if (buckOptionsArray.length > 0) {
                    setSelectedBuckOption(buckOptionsArray[0]);
                }
            } catch (error) {
                showError('Error', "Could not fetch breeding history. You can still proceed.");
            }
        };

        fetchInitialData();
    }, [user]);

    // Memoized function to add a new kit
    const addKit = useCallback(() => {
        setKits((prev) => [
            ...prev,
            {
                kit_number: `RB-${nextKitNumber.toString().padStart(3, "0")}`,
                birth_weight: "",
                gender: "",
                color: "",
                status: "alive",
                notes: "",
            },
        ]);
        setNextKitNumber((prev) => prev + 1);
    }, [nextKitNumber]);

    // Memoized function to remove a kit by index
    const removeKit = useCallback((index: number) => {
        setKits((prev) => {
            const newKits = prev.filter((_, i) => i !== index);
            return newKits;
        });
    }, []);

    // Memoized function to update a kit's field
    const updateKit = useCallback((index: number, field: keyof KitFormData, value: string) => {
        setKits((prev) =>
            prev.map((kit, i) =>
                i === index ? { ...kit, [field]: value } : kit
            )
        );
    }, []);

    const validateKits = (): boolean => {
        if (!actualBirthDate || isNaN(new Date(actualBirthDate).getTime())) {
            showError('Error', "A valid actual birth date is required.");
            return false;
        }
        if (kits.length === 0) {
            showError('Error', "At least one kit is required.");
            return false;
        }
        for (const kit of kits) {
            if (!kit.kit_number || !kit.status) {
                showError('Error', `Kit number and status are required for kit ${kit.kit_number || 'unnamed'}.`);
                return false;
            }
            if (kit.birth_weight && kit.birth_weight.trim() !== "" && (isNaN(parseFloat(kit.birth_weight)) || parseFloat(kit.birth_weight) <= 0)) {
                showError('Error', `Birth weight for kit ${kit.kit_number} must be a positive number.`);
                return false;
            }
            if (kits.filter((k) => k.kit_number === kit.kit_number).length > 1) {
                showError('Error', `Kit number ${kit.kit_number} is duplicated.`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.farm_id || !doeId) {
            showError('Error', "Farm ID or doe information is required.");
            return;
        }

        if (!validateKits()) return;

        setIsLoading(true);
        try {
            // Find or create a breeding record
            let breedingRecordId;
            const breedingResponse = await axios.get(`${utils.apiUrl}/breeds/${user.farm_id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` },
            });
            const breedingRecords = breedingResponse.data.data || [];
            const specificBreedingRecord = breedingRecords.find((item: { doe_id: number | string }) => item.doe_id == doeId);

            if (!specificBreedingRecord) {
                // Create a new breeding record
                const newBreedingResponse = await axios.post(
                    `${utils.apiUrl}/breeds/${user.farm_id}`,
                    {
                        doe_id: doeId,
                        buck_id: selectedBuckOption?.buck_id || null,
                        mating_date: new Date(new Date(actualBirthDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
                        expected_birth_date: actualBirthDate,
                        actual_birth_date: actualBirthDate,
                        number_of_kits: kits.length,
                        notes: kits[0]?.notes || null,
                    },
                    { headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` } }
                );
                breedingRecordId = newBreedingResponse.data.data.id;
            } else {
                breedingRecordId = specificBreedingRecord.id;
                // Update existing breeding record
                await axios.put(
                    `${utils.apiUrl}/breeds/${user.farm_id}/${specificBreedingRecord.id}`,
                    {
                        actual_birth_date: actualBirthDate,
                        number_of_kits: kits.length,
                        notes: kits[0]?.notes || null,
                    },
                    { headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` } }
                );
            }


            // Update rabbit (doe) to mark as not pregnant
            await axios.put(
                `${utils.apiUrl}/rabbits/${user.farm_id}/${doeId}`,
                {
                    is_pregnant: false,
                    pregnancy_start_date: null,
                    expected_birth_date: null,
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` } }
            );
            // Create kit records
            const kitData = kits.map((kit) => ({
                breeding_record_id: breedingRecordId,
                kit_number: kit.kit_number,
                birth_weight: kit.birth_weight && kit.birth_weight.trim() !== "" ? parseFloat(kit.birth_weight) : null,
                gender: kit.gender || null,
                color: kit.color || null,
                status: kit.status || "alive",
                parent_male_id: selectedBuckOption?.buck_id || null,
                parent_female_id: doeId,
                notes: kit.notes || null,
                actual_birth_date: actualBirthDate,
            }));

            const response = await axios.post(
                `${utils.apiUrl}/breeds/kits/${user.farm_id}`,
                { kitz: kitData },
                { headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` } }
            );

            if (response.data.success) {
                showSuccess('Success', `${kits.length} kit${kits.length !== 1 ? "s" : ""} added successfully.`);
                onKitAdded();
                onClose();
            } else {
                throw new Error(response.data.message || "Failed to create kit records");
            }
        } catch (error: any) {
            showError('Error', error.response?.data?.message || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Summary of kits
    const femaleCount = kits.filter((kit) => kit.gender === "female").length;
    const maleCount = kits.filter((kit) => kit.gender === "male").length;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-[650px] bg-white dark:bg-gray-800 bg-clip-padding backdrop-blur-sm border-gray-200 dark:border-gray-700 max-h-[80vh] overflow-y-auto"
            >
                <DialogHeader className="bg-gradient-to-r from-green-400 to-blue-500 dark:from-green-600 dark:to-blue-600 -m-6 p-6 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
                    <DialogTitle className="flex items-center space-x-2 text-white">
                        <Rabbit className="h-5 w-5 text-green-200" />
                        <span>Add Kits for {rabbit.name}</span>
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="actual_birth_date" className="text-gray-900 dark:text-gray-100">
                            Actual Birth Date
                        </Label>
                        <Input
                            id="actual_birth_date"
                            type="date"
                            value={actualBirthDate}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setActualBirthDate(e.target.value)}
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="parent_male_id" className="text-gray-900 dark:text-gray-100">
                                Parent Male (Buck)
                            </Label>
                            {buckOptions.length > 1 ? (
                                <Select
                                    value={selectedBuckOption?.buck_id || ""}
                                    onValueChange={(value) => {
                                        const selected = buckOptions.find((option: any) => option.buck_id === value);
                                        setSelectedBuckOption(selected || null);
                                    }}
                                >
                                    <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                                        <SelectValue placeholder="Select buck">
                                            {selectedBuckOption ? (
                                                <span>
                                                    {selectedBuckOption.buck_id} (Mated: {formatDate(selectedBuckOption.mating_date)})
                                                </span>
                                            ) : (
                                                "Select buck"
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                        {buckOptions.map((option: any) => (
                                            <SelectItem key={option.buck_id} value={option.buck_id}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{option.buck_id}</span>
                                                    <span className="text-xs text-gray-500">
                                                        Mated: {formatDate(option.mating_date)} | Expected: {formatDate(option.expected_birth_date)}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <Input
                                    id="parent_male_id"
                                    type="text"
                                    value={buckOptions.length === 1 ? buckOptions[0].buck_id : "Not specified"}
                                    className="mt-1 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 opacity-75 cursor-not-allowed"
                                    disabled
                                />
                            )}
                            {buckOptions.length > 1 && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    Multiple breeding records found. Please select the appropriate buck.
                                </p>
                            )}
                        </div>
                        <div>
                            <Label htmlFor="parent_female_id" className="text-gray-900 dark:text-gray-100">
                                Parent Female (Doe)
                            </Label>
                            <Input
                                id="parent_female_id"
                                type="text"
                                value={doeName || doeId || "Unknown"}
                                className="mt-1 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 opacity-75 cursor-not-allowed"
                                disabled
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-gray-900 dark:text-gray-100 font-medium">
                                Kits ({kits.length} total: {femaleCount} female{femaleCount !== 1 ? "s" : ""}, {maleCount} male{maleCount !== 1 ? "s" : ""})
                            </Label>
                            <Button
                                type="button"
                                onClick={addKit}
                                variant="outline"
                                className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800/50"
                            >
                                Add Kit
                            </Button>
                        </div>
                        {kits.length > 0 && (
                            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center font-medium text-sm text-gray-900 dark:text-gray-100">
                                <span>Kit Number</span>
                                <span>Gender</span>
                                <span>Color</span>
                                <span>Status</span>
                                <span>Weight (kg)</span>
                                <span>Actions</span>
                                <span></span>
                            </div>
                        )}
                        {kits.map((kit, index) => (
                            <div
                                key={`${kit.kit_number}-${index}`}
                                className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_auto] gap-2 items-center"
                            >
                                <div>
                                    <Label htmlFor={`kit_number_${index}`} className="sr-only">
                                        Kit Number
                                    </Label>
                                    <Input
                                        id={`kit_number_${index}`}
                                        value={kit.kit_number}
                                        onChange={(e) => updateKit(index, "kit_number", e.target.value)}
                                        className="text-sm px-2 py-1 h-8 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                        style={{ width: "80px" }}
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor={`gender_${index}`} className="sr-only">
                                        Gender
                                    </Label>
                                    <Select
                                        value={kit.gender}
                                        onValueChange={(value) => updateKit(index, "gender", value)}
                                    >
                                        <SelectTrigger className="text-sm px-2 py-1 h-8 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                                            <SelectValue placeholder="Gender" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor={`color_${index}`} className="sr-only">
                                        Color
                                    </Label>
                                    <Select
                                        value={kit.color}
                                        onValueChange={(value) => updateKit(index, "color", value)}
                                    >
                                        <SelectTrigger className="text-sm px-2 py-1 h-8 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                                            <SelectValue placeholder="Color" />
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
                                <div>
                                    <Label htmlFor={`status_${index}`} className="sr-only">
                                        Status
                                    </Label>
                                    <Select
                                        value={kit.status}
                                        onValueChange={(value) => updateKit(index, "status", value)}
                                    >
                                        <SelectTrigger className="text-sm px-2 py-1 h-8 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                                            <SelectValue placeholder="Status" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                            <SelectItem value="alive">Alive</SelectItem>
                                            <SelectItem value="dead">Dead</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor={`birth_weight_${index}`} className="sr-only">
                                        Birth Weight
                                    </Label>
                                    <Input
                                        id={`birth_weight_${index}`}
                                        type="number"
                                        step="0.01"
                                        value={kit.birth_weight}
                                        onChange={(e) => updateKit(index, "birth_weight", e.target.value)}
                                        className="text-sm px-2 py-1 h-8 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                        style={{ width: "60px" }}
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeKit(index)}
                                    className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 h-8 w-8 p-0"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        ))}
                        {kits.length === 0 && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
                                No kits added. Click "Add Kit" to start.
                            </p>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || kits.length === 0}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                        >
                            {isLoading ? "Submitting..." : `Add ${kits.length} Kit${kits.length !== 1 ? "s" : ""}`}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
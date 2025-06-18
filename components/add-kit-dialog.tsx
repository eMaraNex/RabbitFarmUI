"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Rabbit } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import * as utils from "@/lib/utils";
import axios from "axios";
import type { Rabbit as RabbitType } from "@/lib/types";

interface KitFormData {
    kit_number: string;
    birth_weight: string;
    gender: "male" | "female" | "";
    color: string;
    status: "alive" | "dead" | "";
    notes: string;
    actual_birth_date?: string;
}

interface AddKitDialogProps {
    rabbit: RabbitType;
    onClose: () => void;
    onKitAdded: () => void;
}

const colors = [
    "White", "Black", "Brown", "Gray", "Chocolate brown", "Golden", "Silver", "Blue",
    "Rust colored", "Orange-red", "Ivory", "White with black points", "Black and white",
    "White with black spots", "Black and white spotted",
];

export default function AddKitDialog({ rabbit, onClose, onKitAdded }: AddKitDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [formData, setFormData] = useState<KitFormData>({
        kit_number: `Kit-${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`,
        birth_weight: "",
        gender: "",
        color: "",
        status: "",
        notes: "",
        actual_birth_date: new Date().toISOString().split("T")[0],
    });
    const [breedingRecordId, setBreedingRecordId] = useState<string | null>(null);
    const [parentBuck, setParentBuck] = useState<{ rabbit_id: string; name?: string } | null>(null);
    const [parentDoe, setParentDoe] = useState<{ rabbit_id: string; name?: string } | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchBreedingData = async () => {
            if (!user?.farm_id || !rabbit.rabbit_id) return;
            setIsLoading(true);
            try {
                const response = await axios.get(`${utils.apiUrl}/breeds/${user.farm_id}?doe_id=${rabbit.rabbit_id}`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` },
                });
                const records = response.data.data || [];
                if (records.length === 0) {
                    toast({
                        variant: "destructive",
                        title: "No breeding record found",
                        description: "No breeding record found for this doe.",
                    });
                    return;
                }

                const latestRecord = records.sort((a: any, b: any) => new Date(b.mating_date).getTime() - new Date(a.mating_date).getTime())[0];
                setBreedingRecordId(latestRecord.id);
                setParentBuck({ rabbit_id: latestRecord.buck_id, name: latestRecord.buck_name || latestRecord.buck_id });
                setParentDoe({ rabbit_id: latestRecord.doe_id, name: rabbit.name || latestRecord.doe_id });

                if (latestRecord.actual_birth_date) {
                    setFormData((prev) => ({
                        ...prev,
                        actual_birth_date: latestRecord.actual_birth_date.split("T")[0] || new Date().toISOString().split("T")[0],
                    }));
                }
            } catch (error) {
                console.error("Error fetching breeding record:", error);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to fetch breeding record.",
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchBreedingData();
    }, [user, rabbit, toast]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.farm_id || !breedingRecordId || !parentBuck || !parentDoe) {
            toast({
                variant: "destructive",
                title: "Missing data",
                description: "Missing required fields or parent information.",
            });
            return;
        }

        setIsLoading(true);
        try {
            // Update rabbit with actual_birth_date and is_pregnant
            await axios.patch(
                `${utils.apiUrl}/rabbits/${user.farm_id}/${rabbit.rabbit_id}`,
                {
                    actual_birth_date: formData.actual_birth_date,
                    is_pregnant: false,
                    total_litters: (rabbit.total_litters ?? 0) + 1,
                    total_kits: (rabbit.total_kits ?? 0) + 1,
                },
                { headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` } }
            );

            // Create kit record
            const kitData = {
                breeding_record_id: breedingRecordId,
                kit_number: parseInt(formData.kit_number.replace("Kit-", "")),
                birth_weight: parseFloat(formData.birth_weight),
                gender: formData.gender,
                color: formData.color,
                status: formData.status || "alive",
                parent_male_id: parentBuck.rabbit_id,
                parent_female_id: parentDoe.rabbit_id,
                notes: formData.notes || null,
            };

            const response = await axios.post(`${utils.apiUrl}/kits/${user.farm_id}`, kitData, {
                headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` },
            });

            if (response.data.success) {
                toast({
                    title: "Success",
                    description: `Kit ${formData.kit_number} added successfully.`,
                });
                onKitAdded();
                onClose();
            } else {
                throw new Error("Failed to create kit record");
            }
        } catch (error: any) {
            console.error("Error creating kit:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.response?.data?.message || "Failed to add kit record.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent
                className="sm:max-w-[650px] bg-white dark:bg-gray-800 bg-clip-padding backdrop-blur-sm border-gray-200 dark:border-gray-700 max-h-[500px] overflow-y-auto"
            >
                <DialogHeader className="bg-gradient-to-r from-green-400 to-blue-500 dark:from-green-600 dark:to-blue-600 -m-6 p-6 rounded-t-lg border-b border-gray-200 dark:border-gray-600">
                    <DialogTitle className="flex items-center space-x-2 text-white">
                        <Rabbit className="h-5 w-5 text-green-200" />
                        <span>Add Kit for {rabbit.name}</span>
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
                            value={formData.actual_birth_date}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                setFormData((prev) => ({ ...prev, actual_birth_date: e.target.value }))
                            }
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                            required
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="parent_male_id" className="text-gray-900 dark:text-gray-100">
                                Parent Male (Buck)
                            </Label>
                            <Input
                                id="parent_male_id"
                                type="text"
                                value={parentBuck ? `${parentBuck.name || parentBuck.rabbit_id || 'Unknown'}` : 'Loading...'}
                                className="mt-1 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 opacity-75 cursor-not-allowed"
                                disabled
                            />
                        </div>
                        <div>
                            <Label htmlFor="parent_female_id" className="text-gray-900 dark:text-gray-100">
                                Parent Female (Doe)
                            </Label>
                            <Input
                                id="parent_female_id"
                                type="text"
                                value={parentDoe ? `${parentDoe.name || parentDoe.rabbit_id || 'Unknown'}` : 'Loading...'}
                                className="mt-1 bg-gray-100 dark:bg-gray-600 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 opacity-75 cursor-not-allowed"
                                disabled
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="kit_number" className="text-gray-900 dark:text-gray-100">
                                Kit Number
                            </Label>
                            <Input
                                id="kit_number"
                                value={formData.kit_number}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev) => ({ ...prev, kit_number: e.target.value }))
                                }
                                className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="birth_weight" className="text-gray-900 dark:text-gray-100">
                                Birth Weight (kg)
                            </Label>
                            <Input
                                id="birth_weight"
                                type="number"
                                step="0.01"
                                value={formData.birth_weight}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    setFormData((prev) => ({ ...prev, birth_weight: e.target.value }))
                                }
                                className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                                required
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="gender" className="text-gray-900 dark:text-gray-100">
                                Gender
                            </Label>
                            <Select
                                value={formData.gender}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, gender: value as "male" | "female" }))
                                }
                            >
                                <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="color" className="text-gray-900 dark:text-gray-100">
                                Color
                            </Label>
                            <Select
                                value={formData.color}
                                onValueChange={(value) => setFormData((prev) => ({ ...prev, color: value }))}
                            >
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
                    <div>
                        <Label htmlFor="status" className="text-gray-900 dark:text-gray-100">
                            Status
                        </Label>
                        <Select
                            value={formData.status}
                            onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, status: value as "alive" | "dead" }))
                            }
                        >
                            <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                <SelectItem value="alive">Alive</SelectItem>
                                <SelectItem value="dead">Dead</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label htmlFor="notes" className="text-gray-900 dark:text-gray-100">
                            Notes (Optional)
                        </Label>
                        <Textarea
                            id="notes"
                            value={formData.notes}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setFormData((prev) => ({ ...prev, notes: e.target.value }))
                            }
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-900 dark:text-gray-100"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                        >
                            {isLoading ? "Adding..." : "Add Kit"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import axios from "axios";
import * as utils from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { Rabbit as RabbitType } from "@/lib/types";

interface EditRabbitDialogProps {
    rabbit: RabbitType;
    onClose: () => void;
    onUpdate: (updatedRabbit: RabbitType) => void;
}

export default function EditRabbitDialog({ rabbit, onClose, onUpdate }: EditRabbitDialogProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: rabbit.name || "",
        breed: rabbit.breed || "",
        color: rabbit.color || "",
        weight: rabbit.weight?.toString() || "",
        birth_date: rabbit.birth_date ? new Date(rabbit.birth_date).toISOString().split("T")[0] : "",
        gender: rabbit.gender || "male",
        is_pregnant: rabbit.is_pregnant || false,
    });
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.farm_id) {
            setError("Missing farm ID. Please log in again.");
            return;
        }

        try {
            const token = localStorage.getItem("rabbit_farm_token");
            if (!token) {
                throw new Error("No authentication token found");
            }

            const updatedRabbit = {
                ...rabbit,
                name: formData.name,
                breed: formData.breed,
                color: formData.color,
                weight: Number.parseFloat(formData.weight) || rabbit.weight,
                birth_date: formData.birth_date || rabbit.birth_date,
                gender: formData.gender as "male" | "female",
                is_pregnant: formData.is_pregnant,
            };

            const response = await axios.put(
                `${utils.apiUrl}/rabbits/${rabbit.id}`,
                updatedRabbit,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { farm_id: user.farm_id },
                }
            );

            if (response.data.success) {
                onUpdate(response.data.data);
                // Update local storage
                const cachedRabbits = JSON.parse(localStorage.getItem(`rabbit_farm_rabbits_${user.farm_id}`) || "[]") as RabbitType[];
                const updatedRabbits = cachedRabbits.map((r) => (r.id === rabbit.id ? response.data.data : r));
                localStorage.setItem(`rabbit_farm_rabbits_${user.farm_id}`, JSON.stringify(updatedRabbits));
                onClose();
            } else {
                throw new Error("Failed to update rabbit data");
            }
        } catch (err: any) {
            console.error("Error updating rabbit:", err);
            setError(err.response?.data?.message || "Failed to update rabbit data");
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 shadow-2xl">
                <DialogHeader className="bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 -m-6 mb-6 p-6 rounded-t-lg border-b border-blue-200 dark:border-blue-700">
                    <DialogTitle className="text-blue-600 dark:text-blue-400">Edit Rabbit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-700">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <Label htmlFor="breed" className="text-gray-900 dark:text-gray-100">Breed</Label>
                        <Input
                            id="breed"
                            value={formData.breed}
                            onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <Label htmlFor="color" className="text-gray-900 dark:text-gray-100">Color</Label>
                        <Input
                            id="color"
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <Label htmlFor="weight" className="text-gray-900 dark:text-gray-100">Weight (kg)</Label>
                        <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <Label htmlFor="birth_date" className="text-gray-900 dark:text-gray-100">Birth Date</Label>
                        <Input
                            id="birth_date"
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600"
                        />
                    </div>
                    <div>
                        <Label htmlFor="gender" className="text-gray-900 dark:text-gray-100">Gender</Label>
                        <Select
                            value={formData.gender}
                            onValueChange={(value) => setFormData({ ...formData, gender: value as "male" | "female" })}
                        >
                            <SelectTrigger className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                                <SelectItem value="male">Buck</SelectItem>
                                <SelectItem value="female">Doe</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {formData.gender === "female" && (
                        <div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={formData.is_pregnant}
                                    onChange={(e) => setFormData({ ...formData, is_pregnant: e.target.checked })}
                                    className="rounded border-gray-300 dark:border-gray-600"
                                />
                                <span className="text-sm text-gray-900 dark:text-gray-100">Pregnant</span>
                            </label>
                        </div>
                    )}
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
                            Save Changes
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
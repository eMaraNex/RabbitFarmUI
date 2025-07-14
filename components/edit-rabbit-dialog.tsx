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
import type { EditRabbitDialogProps, Rabbit as RabbitType } from "@/types";
import { Rabbit } from "lucide-react";
import { breeds, colors } from "@/lib/constants";
import { useToast } from "@/lib/toast-provider";


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
        hutch_id: rabbit.hutch_id || "",
        pregnancy_start_date: rabbit.pregnancy_start_date ? new Date(rabbit.pregnancy_start_date).toISOString().split("T")[0] : "",
        expected_birth_date: rabbit.expected_birth_date ? new Date(rabbit.expected_birth_date).toISOString().split("T")[0] : "",
    });
    const [error, setError] = useState<string | null>(null);
    const { showSuccess, showError, showWarn } = useToast();

    // Check if the rabbit is pregnant and has been served
    const isPregnantAndServed = rabbit.is_pregnant && (rabbit.last_mating_date || rabbit.pregnancy_start_date);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.farm_id) {
            showError('Error', "Missing farm ID. Please log in again.");
            return;
        }

        try {
            const token = localStorage.getItem("rabbit_farm_token");
            if (!token) throw new Error("No authentication token found");

            const updatedRabbit = {
                name: isPregnantAndServed ? rabbit.name : formData.name,
                breed: isPregnantAndServed ? rabbit.breed : formData.breed,
                color: isPregnantAndServed ? rabbit.color : formData.color,
                weight: Number.parseFloat(formData.weight) || null,
                birth_date: isPregnantAndServed ? rabbit.birth_date : formData.birth_date || null,
                gender: isPregnantAndServed ? rabbit.gender : formData.gender as "male" | "female",
                is_pregnant: formData.is_pregnant,
                hutch_id: formData.hutch_id || null,
                pregnancy_start_date: formData.is_pregnant ? formData.pregnancy_start_date || null : null,
                expected_birth_date: formData.is_pregnant ? formData.expected_birth_date || null : null,
                status: "active",
                notes: rabbit.notes || null,
            };

            const response = await axios.put(
                `${utils.apiUrl}/rabbits/${user.farm_id}/${rabbit.rabbit_id}`,
                updatedRabbit,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                onUpdate(response.data.data);
                const cachedRabbits = JSON.parse(localStorage.getItem(`rabbit_farm_rabbits_${user.farm_id}`) || "[]") as RabbitType[];
                const updatedRabbits = cachedRabbits.map((r) => (r.id === rabbit.id ? response.data.data : r));
                localStorage.setItem(`rabbit_farm_rabbits_${user.farm_id}`, JSON.stringify(updatedRabbits));
                onClose();
            } else {
                showError('Error', "Failed to update rabbit data");
            }
        } catch (err: any) {
            showError('Error', err.response?.data?.message);
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 max-h-[80vh] overflow-y-auto shadow-2xl">
                <DialogHeader className="bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 -m-6 mb-6 p-6 rounded-t-lg border-b border-blue-200 dark:border-blue-700">
                    <DialogTitle className="flex items-center space-x-2 text-gray-900 dark:text-gray-100">
                        <Rabbit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span>Edit Rabbit Profile - {rabbit.rabbit_id}</span>
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded-lg border border-red-200 dark:border-red-700">
                            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                        </div>
                    )}
                    {isPregnantAndServed && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-700">
                            <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                This rabbit is pregnant and has been served. Critical details (name, breed, color, birth date, gender) cannot be edited.
                            </p>
                        </div>
                    )}
                    <div>
                        <Label htmlFor="name" className="text-gray-900 dark:text-gray-100">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            disabled={!!isPregnantAndServed}
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <Label htmlFor="breed" className="text-gray-900 dark:text-gray-100">Breed</Label>
                        <Select
                            value={formData.breed}
                            onValueChange={(value) => setFormData({ ...formData, breed: value })}
                            disabled={!!isPregnantAndServed}
                        >
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
                        <Label htmlFor="color" className="text-gray-900 dark:text-gray-100">Color</Label>
                        <Select
                            value={formData.color}
                            onValueChange={(value) => setFormData({ ...formData, color: value })}
                            disabled={!!isPregnantAndServed}
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
                    <div>
                        <Label htmlFor="weight" className="text-gray-900 dark:text-gray-100">Weight (kg)</Label>
                        <Input
                            id="weight"
                            type="number"
                            step="0.1"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <Label htmlFor="birth_date" className="text-gray-900 dark:text-gray-100">Birth Date</Label>
                        <Input
                            id="birth_date"
                            type="date"
                            value={formData.birth_date}
                            onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                            disabled={!!isPregnantAndServed}
                            className="mt-1 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                    <div>
                        <Label htmlFor="gender" className="text-gray-900 dark:text-gray-100">Gender</Label>
                        <Select
                            value={formData.gender}
                            onValueChange={(value) => setFormData({ ...formData, gender: value as "male" | "female" })}
                            disabled={!!isPregnantAndServed}
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
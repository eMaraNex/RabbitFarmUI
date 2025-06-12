"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import * as utils from "@/lib/utils";
import { MapPin, Building, Ruler, Globe, Clock } from "lucide-react";

interface FarmCreationModalProps {
    isOpen: boolean;
    onClose: (skip?: boolean) => void;
    onFarmCreated: () => void;
}

const FarmCreationModal: React.FC<FarmCreationModalProps> = ({ isOpen, onClose, onFarmCreated }) => {
    const { toast } = useToast();
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        id: "",
        name: "",
        location: "",
        latitude: "",
        longitude: "",
        size: "",
        description: "",
        timezone: "UTC",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = "Farm name is required";
        if (formData.latitude && (isNaN(Number(formData.latitude)) || Number(formData.latitude) < -90 || Number(formData.latitude) > 90)) {
            newErrors.latitude = "Latitude must be between -90 and 90";
        }
        if (formData.longitude && (isNaN(Number(formData.longitude)) || Number(formData.longitude) < -180 || Number(formData.longitude) > 180)) {
            newErrors.longitude = "Longitude must be between -180 and 180";
        }
        if (formData.size && (isNaN(Number(formData.size)) || Number(formData.size) <= 0)) {
            newErrors.size = "Size must be a positive number";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem("rabbit_farm_token");
            if (!token) throw new Error("No authentication token found");

            const payload = {
                id: user?.id ?? "",
                name: formData.name,
                location: formData.location || undefined,
                latitude: formData.latitude ? Number(formData.latitude) : undefined,
                longitude: formData.longitude ? Number(formData.longitude) : undefined,
                size: formData.size ? Number(formData.size) : undefined,
                description: formData.description || undefined,
                timezone: formData.timezone,
            };

            const response = await axios.post(`${utils.apiUrl}/farms`, payload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            const farmId = response.data.data.id;
            localStorage.setItem("rabbit_farm_id", farmId);
            if (user) {
                user.farm_id = farmId;
            }

            toast({
                title: "Farm Created",
                description: `${formData.name} has been successfully created!`,
                className: "bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
            });

            setFormData({ id: "", name: "", location: "", latitude: "", longitude: "", size: "", description: "", timezone: "UTC" });
            onFarmCreated();
            onClose();
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to create farm. Please try again.";
            setErrors({ submit: errorMessage });
            toast({
                title: "Error",
                description: errorMessage,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={() => onClose()}>
            <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        Create Your Farm
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium dark:text-gray-200 flex items-center">
                            <Building className="h-4 w-4 mr-2 text-green-500" />
                            Farm Name <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Sunny Acres"
                            className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                        />
                        {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="location" className="text-sm font-medium dark:text-gray-200 flex items-center">
                            <MapPin className="h-4 w-4 mr-2 text-blue-500" />
                            Location
                        </Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            placeholder="e.g., 123 Farm Road, Springfield"
                            className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="latitude" className="text-sm font-medium dark:text-gray-200 flex items-center">
                                <Globe className="h-4 w-4 mr-2 text-purple-500" />
                                Latitude
                            </Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                value={formData.latitude}
                                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                                placeholder="e.g., 40.7128"
                                className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                            />
                            {errors.latitude && <p className="text-xs text-red-500">{errors.latitude}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="longitude" className="text-sm font-medium dark:text-gray-200 flex items-center">
                                <Globe className="h-4 w-4 mr-2 text-purple-500" />
                                Longitude
                            </Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                value={formData.longitude}
                                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                                placeholder="e.g., -74.0060"
                                className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                            />
                            {errors.longitude && <p className="text-xs text-red-500">{errors.longitude}</p>}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="size" className="text-sm font-medium dark:text-gray-200 flex items-center">
                            <Ruler className="h-4 w-4 mr-2 text-orange-500" />
                            Size (sq. meters)
                        </Label>
                        <Input
                            id="size"
                            type="number"
                            step="any"
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            placeholder="e.g., 1000"
                            className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400"
                        />
                        {errors.size && <p className="text-xs text-red-500">{errors.size}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-sm font-medium dark:text-gray-200 flex items-center">
                            <span>Description</span>
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="e.g., Main rabbit breeding farm"
                            className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="timezone" className="text-sm font-medium dark:text-gray-200 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-teal-500" />
                            Timezone
                        </Label>
                        <Input
                            id="timezone"
                            value={formData.timezone}
                            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                            placeholder="e.g., America/New_York"
                            className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-teal-500 dark:focus:ring-teal-400"
                        />
                    </div>

                    {errors.submit && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                            {errors.submit}
                        </div>
                    )}

                    <DialogFooter className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onClose(true)}
                            className="dark:border-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                            Skip
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                        >
                            {isLoading ? "Creating..." : "Create Farm"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default FarmCreationModal;
"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import axios from "axios";
import * as utils from "@/lib/utils";

export default function ResetPasswordPage() {
    const { resetPassword } = useAuth();
    const { token } = useParams();
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [isValidToken, setIsValidToken] = useState(!!token);

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setError("Invalid or missing reset token");
                setIsValidToken(false);
                return;
            }

            try {
                const response = await axios.get(`${utils.apiUrl}/auth/reset-password/${token}`);
                if (!response.data.data.valid) {
                    setError("Invalid or expired reset token");
                    setIsValidToken(false);
                }
            } catch (err: any) {
                setError(err.response?.data?.message || "Failed to validate reset token");
                setIsValidToken(false);
            }
        };

        validateToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidToken) return;
        if (formData.newPassword !== formData.confirmPassword) {
            setError("New passwords do not match");
            return;
        }

        setIsLoading(true);
        setError("");
        setMessage("");

        try {
            const response = await axios.post(`${utils.apiUrl}/auth/reset-password/${token}`, {
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
            });
            setMessage(response.data.message);
            setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
                <CardHeader className="space-y-1 pb-6">
                    <CardTitle className="text-2xl font-bold text-center dark:text-white">Reset Password</CardTitle>
                    <p className="text-gray-600 dark:text-gray-300 text-center">Enter your current and new password to reset</p>
                </CardHeader>
                <CardContent className="space-y-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password" className="dark:text-gray-200">
                                Current Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <Input
                                    id="current-password"
                                    type="password"
                                    placeholder="Enter current password"
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    className="pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                    required
                                    disabled={!isValidToken}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password" className="dark:text-gray-200">
                                New Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="Enter new password"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                    required
                                    disabled={!isValidToken}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password" className="dark:text-gray-200">
                                Confirm New Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="Confirm new password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                    required
                                    disabled={!isValidToken}
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {message && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                                {message}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={isLoading || !isValidToken}
                            className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
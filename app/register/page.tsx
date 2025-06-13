"use client";

import type React from "react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Rabbit, Mail, Lock, User, Phone, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../lib/auth-context";
import ThemeToggle from "../../components/theme-toggle";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
    const { register } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState({ email: "", password: "", name: "", phone: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const response = await register(formData.email, formData.password, formData.name, formData.phone);
            setSuccess(response.message);
            setTimeout(() => router.push("/login"), 2000);
        } catch (err: any) {
            setError(err.message || "Registration failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl mb-4">
                        <Rabbit className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                        Karagani Rabbit Farming
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">Professional Rabbit Management System</p>
                </div>

                <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-white/20 dark:border-gray-700/20 shadow-xl">
                    <CardHeader className="space-y-1 pb-6">
                        <CardTitle className="text-2xl font-bold text-center dark:text-white">Create Account</CardTitle>
                        <p className="text-gray-600 dark:text-gray-300 text-center">Sign up to manage your farm</p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="dark:text-gray-200">Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    <Input
                                        id="name"
                                        type="text"
                                        placeholder="Enter your name"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="dark:text-gray-200">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@org.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="dark:text-gray-200">Phone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="Enter your phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        className="pl-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="dark:text-gray-200">Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400 dark:text-gray-500" />
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className="pl-10 pr-10 h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-3 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="flex justify-between">
                                <Link href="/login" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                                    Login
                                </Link>
                            </div>
                            {error && (
                                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                                    {error}
                                </div>
                            )}
                            {success && (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 px-4 py-3 rounded-lg text-sm">
                                    {success}
                                </div>
                            )}
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full h-12 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
                            >
                                {isLoading ? "Registering..." : "Register"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
                    <p>© 2025 Karagani Rabbit Farming. All rights reserved.</p>
                </div>
            </div>
        </div>
    );
}
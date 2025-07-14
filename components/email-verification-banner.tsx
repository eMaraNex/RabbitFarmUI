"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import EmailVerificationModal from "@/components/email-verification-modal";
import { useAuth } from "@/lib/auth-context";
import axios from "axios";
import * as utils from "@/lib/utils";

const EmailVerificationBanner: React.FC = () => {
    const { user, refreshUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);
    const [dismissedAt, setDismissedAt] = useState<number | null>(null);
    const [verificationSent, setVerificationSent] = useState(false);
    const [isCheckingVerification, setIsCheckingVerification] = useState(false);

    useEffect(() => {
        const checkVerificationStatus = async () => {
            if (!user || user.email_verified || isCheckingVerification) return;
            setIsCheckingVerification(true);
            try {
                const token = localStorage.getItem("rabbit_farm_token");
                if (!token) return;
                const response = await axios.get(`${utils.apiUrl}/auth/user`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (response.data.success && response.data.data.email_verified) {
                    if (refreshUser) {
                        await refreshUser();
                    }
                }
            } catch (error) {
                console.error("Error checking verification status:", error);
            } finally {
                setIsCheckingVerification(false);
            }
        };
        checkVerificationStatus();
        const handleFocus = () => {
            checkVerificationStatus();
        };
        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [user, isCheckingVerification, refreshUser]);

    useEffect(() => {
        if (dismissedAt) {
            const timer = setTimeout(() => {
                setIsDismissed(false);
                setDismissedAt(null);
            }, 60 * 60 * 4000);

            return () => clearTimeout(timer);
        }
    }, [dismissedAt]);

    useEffect(() => {
        if (!user || user.email_verified || isDismissed || verificationSent) return;
        const interval = setInterval(async () => {
            if (isCheckingVerification) return;
            setIsCheckingVerification(true);
            try {
                const token = localStorage.getItem("rabbit_farm_token");
                if (!token) return;
                const response = await axios.get(`${utils.apiUrl}/auth/user`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success && response.data.data.email_verified) {
                    if (refreshUser) {
                        await refreshUser();
                    }
                }
            } catch (error) {
                console.error("Error checking verification status:", error);
            } finally {
                setIsCheckingVerification(false);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [user, isDismissed, verificationSent, isCheckingVerification, refreshUser]);

    const handleDismiss = () => {
        setIsDismissed(true);
        setDismissedAt(Date.now());
    };

    const handleVerificationSent = () => {
        setVerificationSent(true);
        const quickCheck = setInterval(async () => {
            if (isCheckingVerification) return;
            setIsCheckingVerification(true);
            try {
                const token = localStorage.getItem("rabbit_farm_token");
                if (!token) return;
                const response = await axios.get(`${utils.apiUrl}/auth/user`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.data.success && response.data.data.email_verified) {
                    if (refreshUser) {
                        await refreshUser();
                    }
                    clearInterval(quickCheck);
                }
            } catch (error) {
                console.error("Error checking verification status:", error);
            } finally {
                setIsCheckingVerification(false);
            }
        }, 5000);
        setTimeout(() => clearInterval(quickCheck), 5 * 60 * 1000);
    };

    if (!user || user.email_verified || isDismissed || verificationSent) return null;

    return (
        <>
            <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl shadow-md mb-6 flex items-center justify-between animate-fade-in">
                <div className="flex items-center space-x-3">
                    <Mail className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                    <div>
                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                            Email verification required
                        </p>
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                            Verify your email to receive notifications and access all features.
                        </p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDismiss}
                        className="border-amber-300 dark:border-amber-600 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                    >
                        Dismiss
                    </Button>
                    <Button
                        size="sm"
                        onClick={() => setIsOpen(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        disabled={isCheckingVerification}
                    >
                        {isCheckingVerification ? "Checking..." : "Verify Email"}
                    </Button>
                </div>
            </div>
            <EmailVerificationModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                userEmail={user?.email || ""}
                onVerificationSent={handleVerificationSent}
            />
        </>
    );
};

export default EmailVerificationBanner;
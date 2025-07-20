"use client"

import type React from "react"
import { createContext, useContext, useState } from "react"

type SubscriptionTier = "free" | "standard" | "advanced"

interface SubscriptionLimits {
    maxRows: number
    maxRabbits: number
    maxUsers: number
    maxReports: number
}

interface SubscriptionContextType {
    tier: SubscriptionTier
    limits: SubscriptionLimits
    isFeatureAvailable: (feature: string) => boolean
    canAddMore: (type: string, current: number) => boolean
    upgradeTo: (newTier: SubscriptionTier) => void
}

const subscriptionLimits: Record<SubscriptionTier, SubscriptionLimits> = {
    free: {
        maxRows: 3,
        maxRabbits: 54, // 3 rows * 18 hutches
        maxUsers: 1,
        maxReports: 5,
    },
    standard: {
        maxRows: 10,
        maxRabbits: 180, // 10 rows * 18 hutches
        maxUsers: 3,
        maxReports: 50,
    },
    advanced: {
        maxRows: -1, // unlimited
        maxRabbits: -1, // unlimited
        maxUsers: -1, // unlimited
        maxReports: -1, // unlimited
    },
}

const featureMatrix: Record<SubscriptionTier, string[]> = {
    free: ["basic_analytics", "basic_reports", "record_keeping"],
    standard: [
        "basic_analytics",
        "enhanced_analytics",
        "basic_reports",
        "export_reports",
        "email_notifications",
        "user_management",
        "weekly_reports",
    ],
    advanced: [
        "basic_analytics",
        "enhanced_analytics",
        "advanced_analytics",
        "basic_reports",
        "export_reports",
        "email_notifications",
        "sms_notifications",
        "user_management",
        "calendar_integration",
        "weekly_reports",
        "monthly_reports",
        "automated_backups",
        "priority_support",
    ],
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const [tier, setTier] = useState<SubscriptionTier>("free")

    const isFeatureAvailable = (feature: string): boolean => {
        return featureMatrix[tier].includes(feature)
    }

    const canAddMore = (type: string, current: number): boolean => {
        const limit = limits[`max${type.charAt(0).toUpperCase() + type.slice(1)}` as keyof SubscriptionLimits]
        return limit === -1 || current < limit
    }

    const upgradeTo = (newTier: SubscriptionTier) => {
        setTier(newTier)
        // In real app, this would make API call to update subscription
        console.log(`Upgraded to ${newTier} tier`)
    }

    const limits = subscriptionLimits[tier]

    return (
        <SubscriptionContext.Provider
            value={{
                tier,
                limits,
                isFeatureAvailable,
                canAddMore,
                upgradeTo,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    )
}

export function useSubscription() {
    const context = useContext(SubscriptionContext)
    if (context === undefined) {
        throw new Error("useSubscription must be used within a SubscriptionProvider")
    }
    return context
}

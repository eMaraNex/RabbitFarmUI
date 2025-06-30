"use client";
import React, { useState, useEffect } from "react";
import RabbitList from "@/components/rabbit-list";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Header from "@/components/shared/header";
import { ArrowLeft } from "lucide-react";

export default function RabbitsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [farmId, setFarmId] = useState<string>("");

    // Fetch farmId from localStorage only on the client
    useEffect(() => {
        if (typeof window !== "undefined") {
            const storedFarmId = localStorage.getItem("rabbit_farm_id") || "";
            setFarmId(user?.farm_id || storedFarmId);
        }
    }, [user]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 sm:p-6">
            {/* <Header user={user} rows={rows} logout={logout} toggleSidebar={toggleSidebar} handleRowAdded={handleRowAdded} CurrencySelector={CurrencySelector} ThemeToggle={ThemeToggle} AddRowDialog={AddRowDialog} /> */}
            <Button
                variant="outline"
                onClick={() => router.push("/")}
                className="mb-4 flex items-center gap-2 rounded-full border-2 border-blue-500 dark:border-blue-400 bg-white/50 dark:bg-gray-800/50 px-4 py-2 text-blue-600 dark:text-blue-300 font-semibold shadow-sm hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-300 ease-in-out hover:shadow-md"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
            </Button>
            {farmId && <RabbitList farmId={farmId} />}
        </div>
    );
}
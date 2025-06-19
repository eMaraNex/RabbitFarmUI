"use client"

import type React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Rabbit, Building, User, LogOut, Menu } from "lucide-react"

interface HeaderProps {
    user?: any
    rows?: any[]
    logout: () => void
    toggleSidebar?: () => void
    handleRowAdded: () => void
    CurrencySelector: React.ComponentType
    ThemeToggle: React.ComponentType
    AddRowDialog: React.ComponentType<{ onRowAdded: () => void }>
}

const Header: React.FC<HeaderProps> = ({
    user,
    rows,
    logout,
    toggleSidebar,
    handleRowAdded,
    CurrencySelector,
    ThemeToggle,
    AddRowDialog,
}) => {
    return (
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md shadow-sm border-b border-white/20 dark:border-gray-700/20 sticky top-0 z-40">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center py-4">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-xl">
                            <Rabbit className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                                Karagani Rabbit Farming
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 hidden sm:block">
                                Professional Rabbit Management System
                            </p>
                        </div>
                    </div>
                    <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
                        <Badge
                            variant="outline"
                            className="bg-white/60 dark:bg-gray-700/60 shadow-sm px-4 py-3.5 min-w-[140px] justify-center rounded-lg"
                        >
                            <Building className="h-3 w-3 mr-1" />
                            {rows?.length} Rows Active
                        </Badge>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 rounded-lg px-4 py-3 shadow-sm min-w-[140px]">
                            <User className="h-4 w-4" />
                            <span className="truncate">{user?.name || "User"}</span>
                        </div>
                        <CurrencySelector />
                        <ThemeToggle />
                        <AddRowDialog onRowAdded={handleRowAdded} />
                        <Button
                            onClick={logout}
                            variant="outline"
                            size="sm"
                            className="bg-white/60 dark:bg-gray-700/60 hover:bg-red-500 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500 dark:hover:border-red-800 shadow-sm"
                        >
                            <LogOut className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="md:h-6 w-6 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full md:hidden"
                        onClick={toggleSidebar}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                </div>
            </div>
        </header>
    )
}

export default Header

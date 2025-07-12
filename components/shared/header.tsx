"use client";

import type React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rabbit, Building, User, LogOut, Menu, Plus } from "lucide-react";
import { HeaderProps } from "@/types/shared";
import { getRabbitDynamicFarmName } from "@/lib/utils";

const Header: React.FC<HeaderProps> = ({
    user,
    rows,
    logout,
    toggleSidebar,
    CurrencySelector,
    ThemeToggle,
    handleAddRow,
    farmName,
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
                                {farmName || "Rabbit Farm"}
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
                            {rows?.length || 0} Active Rows
                        </Badge>
                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 rounded-lg px-4 py-3 shadow-sm min-w-[140px]">
                            <User className="h-4 w-4" />
                            <span className="truncate">{user?.name || "User"}</span>
                        </div>
                        <CurrencySelector />
                        <ThemeToggle />
                        <Button
                            onClick={handleAddRow}
                            className="w-full md:w-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-500 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Row
                        </Button>
                        <Button
                            onClick={logout}
                            variant="outline"
                            size="sm"
                            className="bg-white/60 dark:bg-gray-700/60 hover:bg-white dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500 dark:hover:border-red-800 shadow-sm"
                        >
                            <LogOut className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Logout</span>
                        </Button>
                    </div>

                    {/* Mobile/Tablet Actions */}
                    <div className="flex lg:hidden items-center space-x-2 sm:space-x-3">
                        {/* Mobile Stats */}
                        <Badge className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm px-3 py-2 text-xs font-medium hidden sm:flex">
                            <Building className="h-3.5 w-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                            {rows?.length || 0}
                        </Badge>

                        {/* Mobile Add Button */}
                        <Button
                            onClick={handleAddRow}
                            size="sm"
                            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium px-3 py-2 rounded-xl border-0 hidden sm:flex"
                        >
                            <Plus className="h-4 w-4 sm:mr-1.5" />
                            <span className="hidden sm:inline text-xs">Add</span>
                        </Button>

                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-10 w-10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60"
                            onClick={toggleSidebar}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

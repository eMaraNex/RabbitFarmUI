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
}) => {
    return (
        <header className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-200/60 dark:border-gray-800/60 sticky top-0 z-50 transition-all duration-300">
            <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16 sm:h-20">
                    {/* Brand Section */}
                    <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl blur-sm opacity-75"></div>
                            <div className="relative p-2.5 sm:p-3 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl shadow-lg">
                                <Rabbit className="h-6 w-6 sm:h-7 sm:w-7 text-white drop-shadow-sm" />
                            </div>
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 dark:from-emerald-400 dark:to-blue-400 bg-clip-text text-transparent leading-tight">
                                {getRabbitDynamicFarmName() || "Rabbit Farm"}
                            </h1>
                            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden sm:block font-medium tracking-wide">
                                Professional Rabbit Management System
                            </p>
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center space-x-3">
                        {/* Stats Badge */}
                        <Badge className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md transition-all duration-200 px-4 py-2.5 text-sm font-medium">
                            <Building className="h-4 w-4 mr-2 text-emerald-600 dark:text-emerald-400" />
                            {rows?.length || 0} Active Rows
                        </Badge>

                        {/* User Info */}
                        <div className="flex items-center space-x-2.5 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="p-1.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg">
                                <User className="h-3.5 w-3.5 text-white" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 max-w-24 truncate">
                                {user?.name || "User"}
                            </span>
                        </div>

                        {/* Control Components */}
                        <div className="flex items-center space-x-2">
                            <CurrencySelector />
                            <ThemeToggle />
                        </div>

                        {/* Primary Action */}
                        <Button
                            onClick={handleAddRow}
                            className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-medium px-5 py-2.5 rounded-xl border-0"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Row
                        </Button>

                        {/* Logout Button */}
                        <Button
                            onClick={logout}
                            variant="outline"
                            className="border-gray-200 dark:border-gray-600 bg-white/60 dark:bg-gray-800/60 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200 shadow-sm hover:shadow-md font-medium px-4 py-2.5 rounded-xl"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
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

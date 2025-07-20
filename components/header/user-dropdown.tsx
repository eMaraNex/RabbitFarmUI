"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { User, Settings, CreditCard, LogOut, ChevronDown, Users, Plus, Building } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import type { HeaderProps } from "@/types/shared"

interface UserDropdownProps {
    user: HeaderProps["user"]
    logout: HeaderProps["logout"]
}

export default function UserDropdown({ user, logout }: UserDropdownProps) {
    const router = useRouter()

    const handleMenuClick = (action: string) => {
        switch (action) {
            case "profile":
                router.push("/profile")
                break
            case "settings":
                router.push("/settings")
                break
            case "pricing":
                router.push("/pricing")
                break
            case "users":
                router.push("/users")
                break
            case "add-row":
                router.push("/add-row") // Adjust based on your routing for adding a row
                break
            case "logout":
                logout()
                break
            default:
                break
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="flex items-center space-x-2 px-2 py-1.5 h-10 sm:h-10 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
                >
                    <Avatar className="h-7 w-7 sm:h-8 sm:w-8">
                        <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs sm:text-sm">
                            {user?.name
                                ?.split(" ")
                                .map((n: any) => n[0])
                                .join("") || "U"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="hidden sm:flex flex-col text-left">
                        <p className="text-xs sm:text-sm font-medium truncate max-w-[120px]">
                            {user?.name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
                            {user?.email}
                        </p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
                align="end"
                className="w-64 bg-white/95 dark:bg-gray-800/95 backdrop-blur-lg border-0 shadow-xl p-2"
            >
                <DropdownMenuLabel className="pb-2">
                    <div className="flex items-center space-x-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                            <AvatarFallback className="text-sm">
                                {user?.name
                                    ?.split(" ")
                                    .map((n: any) => n[0])
                                    .join("") || "U"}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
                            <Badge variant="secondary" className="text-xs mt-1">
                                FREE Plan
                            </Badge>
                        </div>
                    </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => handleMenuClick("profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <div>
                        <p className="text-sm font-medium">Profile</p>
                        <p className="text-xs text-gray-500">Manage your account</p>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleMenuClick("settings")} className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <div>
                        <p className="text-sm font-medium">Settings</p>
                        <p className="text-xs text-gray-500">Notifications & preferences</p>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleMenuClick("users")} className="cursor-pointer">
                    <Users className="mr-2 h-4 w-4" />
                    <div>
                        <p className="text-sm font-medium">Team</p>
                        <p className="text-xs text-gray-500">Manage team members</p>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleMenuClick("add-row")} className="cursor-pointer md:hidden">
                    <Plus className="mr-2 h-4 w-4" />
                    <div>
                        <p className="text-sm font-medium">Add Row</p>
                        <p className="text-xs text-gray-500">Add a new row to your farm</p>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleMenuClick("pricing")} className="cursor-pointer">
                    <CreditCard className="mr-2 h-4 w-4" />
                    <div>
                        <p className="text-sm font-medium">Billing & Plans</p>
                        <p className="text-xs text-gray-500">Manage subscription</p>
                    </div>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={() => handleMenuClick("logout")}
                    className="cursor-pointer text-red-600 dark:text-red-400"
                >
                    <LogOut className="mr-2 h-4 w-4" />
                    <div>
                        <p className="text-sm font-medium">Sign out</p>
                        <p className="text-xs text-gray-500">Sign out of your account</p>
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
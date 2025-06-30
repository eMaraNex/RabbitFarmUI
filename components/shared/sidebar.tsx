import { Building, LogOut, Plus, User, X } from "lucide-react";
import { Button } from "../ui/button";
import CurrencySelector from "../currency-selector";
import ThemeToggle from "../theme-toggle";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    rows: any[];
    logout: () => void;
    handleRowAdded: () => void;
    hasFarm: boolean;
}
const Sidebar: React.FC<SidebarProps & { handleAddRow: () => void; addRowOpen: boolean }> = ({
    isOpen,
    onClose,
    user,
    rows,
    logout,
    handleRowAdded,
    hasFarm,
    handleAddRow,
    addRowOpen,
}) => {
    return (
        <div
            className={`fixed inset-y-0 right-0 z-50 w-72 bg-background border-l border-border transform ${isOpen ? "translate-x-0" : "translate-x-full"
                } transition-transform duration-300 ease-in-out shadow-lg md:hidden overflow-y-auto`}
        >
            <div className="flex justify-between items-center px-4 py-3 border-b border-border">
                <h2 className="text-lg font-medium">Menu</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="rounded-full h-8 w-8 hover:bg-muted"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex flex-col px-4 py-4 space-y-4">
                {/* User info */}
                <div className="w-full bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{user?.name || "User"}</span>
                    </div>
                </div>

                {/* Rows count */}
                <div className="w-full bg-muted rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{rows.length} Rows Active</span>
                    </div>
                </div>
                {/* Currency selector - Modified to take full width */}
                <div className="w-full">
                    <CurrencySelector />
                </div>
                {/* Theme toggle */}
                <div className="w-full flex">
                    <ThemeToggle />
                </div>
                {/* Add row button */}
                <Button
                    onClick={handleAddRow}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-500 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add New Row
                </Button>
                {/* Logout button */}
                <Button onClick={logout} variant="outline" className="w-full">
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                </Button>
            </div>
        </div>
    );
};

export default Sidebar;
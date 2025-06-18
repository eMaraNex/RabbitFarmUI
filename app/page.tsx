"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rabbit, Heart, Pill, AlertTriangle, Building, LogOut, User, Menu, X } from "lucide-react";
import HutchLayout from "@/components/hutch-layout";
import RabbitProfile from "@/components/rabbit-profile";
import BreedingManager from "@/components/breeding-manager";
import HealthTracker from "@/components/health-tracker";
import FeedingSchedule from "@/components/feeding-schedule";
import EarningsTracker from "@/components/earnings-tracker";
import ReportsDashboard from "@/components/reports-dashboard";
import AnalyticsCharts from "@/components/analytics-charts";
import CurrencySelector from "@/components/currency-selector";
import AddRowDialog from "@/components/add-row-dialog";
import FarmBanner from "@/components/farm-banner";
import ProtectedRoute from "@/components/auth/protected-route";
import ThemeToggle from "@/components/theme-toggle";
import AddKitDialog from "@/components/add-kit-dialog";
import { useToast } from "@/components/ui/use-toast";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { CurrencyProvider } from "@/lib/currency-context";
import axios from "axios";
import * as utils from "@/lib/utils";
import type { Rabbit as RabbitType } from "@/lib/types";

// Define the Alert type
interface Alert {
  type: string;
  message: string;
  variant: "destructive" | "secondary" | "outline";
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  rows: any[];
  logout: () => void;
  handleRowAdded: () => void;
  hasFarm: boolean;
}

interface OverdueBirthBannerProps {
  rabbit: RabbitType;
  onDismiss: () => void;
  onAddKits: (rabbit: RabbitType, buckId: string, doeName?: string, buckName?: string) => void;
}

const OverdueBirthBanner: React.FC<OverdueBirthBannerProps> = ({ rabbit, onDismiss, onAddKits }) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const [breedingData, setBreedingData] = useState<{
    buckId: string;
    doeName?: string;
    buckName?: string;
  } | null>(null);

  useEffect(() => {
    const fetchBreedingData = async () => {
      if (!user?.farm_id || !rabbit.rabbit_id) return;
      try {
        const response = await axios.get(
          `${utils.apiUrl}/breeds/${user.farm_id}?doe_id=${rabbit.rabbit_id}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` },
          },
        );
        const records = response.data.data || [];
        if (records.length === 0) {
          toast({
            variant: "destructive",
            title: "No Breeding Record",
            description: "No breeding record found for this doe.",
          });
          return;
        }
        const latestRecord = records.sort(
          (a: any, b: any) => new Date(b.mating_date).getTime() - new Date(a.mating_date).getTime(),
        )[0];
        setBreedingData({
          buckId: latestRecord.buck_id,
          doeName: rabbit.name || latestRecord.doe_id,
          buckName: latestRecord.buck_name || latestRecord.buck_id,
        });
      } catch (error) {
        console.error("Error fetching breeding record:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch breeding record.",
        });
      }
    };
    fetchBreedingData();
  }, [user, rabbit, toast]);

  if (isDismissed || !breedingData) return null;

  const daysToBirth = Math.ceil(
    (new Date(rabbit.expected_birth_date!).getTime() - new Date().getTime()) /
    (1000 * 60 * 60 * 24),
  );

  return (
    <div className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 p-4 rounded-xl shadow-md mb-6 flex items-center justify-between animate-fade-in">
      <div className="flex items-center space-x-3">
        <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
        <div>
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            Overdue Birth for {rabbit.name || "Unknown Rabbit"}
          </p>
          <p className="text-xs text-red-700 dark:text-red-300">
            Expected birth was {Math.abs(daysToBirth)} day{Math.abs(daysToBirth) !== 1 ? "s" : ""} ago. Add kits or update status.
          </p>
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsDismissed(true);
            onDismiss();
          }}
          className="border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
        >
          Dismiss
        </Button>
        <Button
          size="sm"
          onClick={() => onAddKits(rabbit, breedingData.buckId, breedingData.doeName, breedingData.buckName)}
          className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white"
        >
          Add Kits
        </Button>
      </div>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  user,
  rows,
  logout,
  handleRowAdded,
  hasFarm
}) => {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-72 bg-background border-l border-border transform ${isOpen ? "translate-x-0" : "translate-x-full"} transition-transform duration-300 ease-in-out shadow-lg md:hidden overflow-y-auto`}
    >
      <div className="flex justify-between items-center px-4 py-3 border-b border-border">
        <h2 className="text-lg font-medium">Menu</h2>
        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full h-8 w-8 hover:bg-muted">
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
        <div className="w-full"><CurrencySelector /></div>
        {/* Theme toggle */}
        <div className="w-full flex"><ThemeToggle /></div>
        {/* Add row button */}
        <div className="w-full"><AddRowDialog onRowAdded={handleRowAdded} /></div>
        {/* Logout button */}
        <Button onClick={logout} variant="outline" className="w-full">
          <LogOut className="h-4 w-4 mr-2" />Logout
        </Button>
      </div>
    </div>
  );
};

const DashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedRabbit, setSelectedRabbit] = useState<RabbitType | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [rabbits, setRabbits] = useState<any[]>([]);
  const [hutches, setHutches] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [hasFarm, setHasFarm] = useState<boolean>(!!user?.farm_id || !!localStorage.getItem("rabbit_farm_id"));
  const [breedingRefreshTrigger, setBreedingRefreshTrigger] = useState<number>(0);
  const [showAddKitDialog, setShowAddKitDialog] = useState<boolean>(false);
  const [selectedRabbitForKit, setSelectedRabbitForKit] = useState<RabbitType | null>(null);
  const [buckIdForKit, setBuckIdForKit] = useState<string>("");
  const [buckNameForKit, setBuckNameForKit] = useState<string | undefined>(undefined);
  const [overdueRabbits, setOverdueRabbits] = useState<RabbitType[]>([]);
  const tabsListRef = useRef<HTMLDivElement>(null);
  const notifiedRabbitsRef = useRef<Set<string>>(new Set());

  const loadFromStorage = useCallback((farmId: string) => {
    try {
      const cachedRows = localStorage.getItem(`rabbit_farm_rows_${farmId}`);
      const cachedHutches = localStorage.getItem(`rabbit_farm_hutches_${farmId}`);
      const cachedRabbits = localStorage.getItem(`rabbit_farm_rabbits_${farmId}`);
      return {
        rows: cachedRows ? JSON.parse(cachedRows) : [],
        hutches: cachedHutches ? JSON.parse(cachedHutches) : [],
        rabbits: cachedRabbits ? JSON.parse(cachedRabbits) : [],
      };
    } catch (error) {
      console.error("Error loading from storage:", error);
      return { rows: [], hutches: [], rabbits: [] };
    }
  }, []);

  const saveToStorage = useCallback((farmId: string, data: { rows: any[]; hutches: any[]; rabbits: any[] }) => {
    try {
      localStorage.setItem(`rabbit_farm_rows_${farmId}`, JSON.stringify(data.rows));
      localStorage.setItem(`rabbit_farm_hutches_${farmId}`, JSON.stringify(data.hutches));
      localStorage.setItem(`rabbit_farm_rabbits_${farmId}`, JSON.stringify(data.rabbits));
    } catch (error) {
      console.error("Error saving to storage:", error);
    }
  }, []);

  const loadData = useCallback(async () => {
    if (!user?.farm_id) {
      setDataLoaded(true); // Allow UI to render FarmBanner
      setHasFarm(false); // Ensure FarmBanner is shown
      return;
    }

    // Check local storage first
    const cachedData = loadFromStorage(user.farm_id);
    if (cachedData.rows.length || cachedData.hutches.length || cachedData.rabbits.length) {
      setRows(cachedData.rows);
      setHutches(cachedData.hutches);
      setRabbits(cachedData.rabbits);
      setDataLoaded(true);
    }

    try {
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) throw new Error("No authentication token found");

      const [rowsResponse, hutchesResponse, rabbitsResponse] = await Promise.all([
        axios.get(`${utils.apiUrl}/rows/${user.farm_id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${utils.apiUrl}/hutches/${user.farm_id}`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${utils.apiUrl}/rabbits/${user.farm_id}`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      let newRabbits = rabbitsResponse.data.data || [];
      newRabbits = newRabbits.map((r: any) => ({
        ...r,
        expected_birth_date: r.is_pregnant && r.pregnancy_start_date
          ? new Date(new Date(r.pregnancy_start_date).getTime() + (utils.PREGNANCY_DURATION_DAYS || 31) * 24 * 60 * 60 * 1000).toISOString()
          : r.expected_birth_date,
      }));
      const newRows = rowsResponse.data.data || [];
      const newHutches = hutchesResponse.data.data || [];
      // Update state
      setRows(newRows);
      setHutches(newHutches);
      setRabbits(newRabbits);
      // Save to local storage
      saveToStorage(user.farm_id, { rows: newRows, hutches: newHutches, rabbits: newRabbits });

      setDataLoaded(true);
      setHasFarm(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (cachedData.rows.length || cachedData.hutches.length || cachedData.rabbits.length) {
        setRows(cachedData.rows);
        setHutches(cachedData.hutches);
        setRabbits(cachedData.rabbits);
      }
      setDataLoaded(true);
    }
  }, [user, loadFromStorage, saveToStorage]);

  const handleRabbitsUpdate = useCallback((updatedRabbits: any[]) => {
    setRabbits(updatedRabbits);
    if (user?.farm_id) {
      saveToStorage(user.farm_id, { rows, hutches, rabbits: updatedRabbits });
    }
    setBreedingRefreshTrigger((prev) => prev + 1);
  }, [user, rows, hutches, saveToStorage]);

  const generateAlerts = useCallback(() => {
    const currentDate = new Date();
    const alertsList: Alert[] = [];
    const overdueRabbitsList: RabbitType[] = [];

    rabbits.forEach((rabbit) => {
      // Skip immature female rabbits for pregnancy-related alerts
      const maturity = utils.isRabbitMature(rabbit);
      if (!maturity.isMature && rabbit.gender === "female") {
        return;
      }

      // --- Pregnancy Noticed Alert ---
      // Notifies when a doe is confirmed pregnant (from pregnancy_start_date to day 25)
      if (rabbit.is_pregnant && rabbit.pregnancy_start_date) {
        let pregnancyStart;
        try {
          pregnancyStart = new Date(rabbit.pregnancy_start_date);
          if (isNaN(pregnancyStart.getTime())) {
            console.error(`Invalid pregnancy_start_date for ${rabbit.name}:`, rabbit.pregnancy_start_date);
            pregnancyStart = currentDate;
          }
        } catch (e) {
          console.error(`Error parsing pregnancy_start_date for ${rabbit.name}:`, e);
          pregnancyStart = currentDate;
        }
        const timeDiff = currentDate.getTime() - pregnancyStart.getTime();
        const daysSincePregnancy = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (daysSincePregnancy >= 0 && daysSincePregnancy < (utils.NESTING_BOX_START_DAYS || 25)) {
          alertsList.push({
            type: "Pregnancy Noticed",
            message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Confirmed pregnant since ${pregnancyStart.toLocaleDateString()}`,
            variant: "secondary",
          });
        }

        // --- Nesting Box Needed Alert ---
        // Reminds to add a nesting box when pregnancy reaches days 25-28
        if (daysSincePregnancy >= (utils.NESTING_BOX_START_DAYS || 25) && daysSincePregnancy < (utils.NESTING_BOX_END_DAYS || 28)) {
          alertsList.push({
            type: "Nesting Box Needed",
            message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Add nesting box, ${daysSincePregnancy} days since mating`,
            variant: "secondary",
          });
        }

        // --- Birth Expected Alert ---
        // Alerts when birth is expected (days 28-31) or overdue
        if (rabbit.expected_birth_date && !rabbit.actual_birth_date) {
          let expectedDate;
          try {
            expectedDate = new Date(rabbit.expected_birth_date);
            if (isNaN(expectedDate.getTime())) throw new Error("Invalid expected_birth_date");
          } catch (e) {
            console.error(`Invalid expected_birth_date for ${rabbit.name}:`, rabbit.expected_birth_date);
            expectedDate = new Date(currentDate.getTime() + (utils.PREGNANCY_DURATION_DAYS || 30) * 24 * 60 * 60 * 1000);
          }
          const daysToBirth = Math.ceil((expectedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSincePregnancy >= 28 && daysSincePregnancy <= 31) {
            alertsList.push({
              type: "Birth Expected",
              message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Expected to give birth ${daysToBirth === 0 ? "today" : daysToBirth > 0 ? `in ${daysToBirth} days` : `overdue by ${Math.abs(daysToBirth)} days`}`,
              variant: daysToBirth <= 0 ? "destructive" : "secondary",
            });
          }

          // --- Overdue Birth Toast Notification ---
          // Shows a toast when expected birth date is exceeded (overdue)
          if (daysToBirth < 0 && !notifiedRabbitsRef.current.has(rabbit.rabbit_id)) {
            overdueRabbitsList.push(rabbit);
          }
        }
      }

      // --- Fostering Needed Alert ---
      // Suggests fostering kits 20 days after birth
      if (rabbit.actual_birth_date) {
        let birthDate;
        try {
          birthDate = new Date(rabbit.actual_birth_date);
          if (isNaN(birthDate.getTime())) throw new Error("Invalid actual_birth_date");
        } catch (e) {
          console.error(`Invalid actual_birth_date for ${rabbit.name}:`, rabbit.actual_birth_date);
          birthDate = currentDate;
        }
        const timeDiff = currentDate.getTime() - birthDate.getTime();
        const daysSinceBirth = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        if (daysSinceBirth === (utils.FOSTERING_DAYS_AFTER_BIRTH || 20)) {
          alertsList.push({
            type: "Fostering Needed",
            message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Consider fostering kits to other does`,
            variant: "secondary",
          });
        }

        // --- Weaning and Nesting Box Removal Alert ---
        // Reminds to wean kits and remove nesting box 42 days after birth
        if (daysSinceBirth === (utils.WEANING_PERIOD_DAYS || 42)) {
          alertsList.push({
            type: "Weaning and Nesting Box Removal",
            message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Wean kits and move to new hutches, remove nesting box`,
            variant: "secondary",
          });
        }
      }

      // --- Breeding Ready Alert ---
      // Notifies when a mature doe is ready for the next breeding cycle
      if (rabbit.gender === "female" && !rabbit.is_pregnant && maturity.isMature) {
        const lastBirth = rabbit.actual_birth_date ? new Date(rabbit.actual_birth_date) : null;
        const weaningDate = lastBirth
          ? new Date(lastBirth.getTime() + (utils.WEANING_PERIOD_DAYS || 42) * 24 * 60 * 60 * 1000)
          : null;
        const oneWeekAfterWeaning = weaningDate
          ? new Date(weaningDate.getTime() + (utils.POST_WEANING_BREEDING_DELAY_DAYS || 7) * 24 * 60 * 60 * 1000)
          : null;
        if (
          (!rabbit.pregnancy_start_date ||
            (rabbit.pregnancy_start_date &&
              currentDate.getTime() > new Date(rabbit.pregnancy_start_date).getTime() + ((utils.PREGNANCY_DURATION_DAYS || 30) + (utils.WEANING_PERIOD_DAYS || 42)) * 24 * 60 * 60 * 1000)) &&
          (!oneWeekAfterWeaning || currentDate > oneWeekAfterWeaning)
        ) {
          alertsList.push({
            type: "Breeding Ready",
            message: `${rabbit.name} (${rabbit.hutch_id || 'N/A'}) - Ready for next breeding cycle`,
            variant: "outline",
          });
        }
      }

      // --- Medication Due Alert ---
      // Notifies when a rabbit's vaccination is overdue
      if (rabbit.next_due) {
        const nextDueDate = new Date(rabbit.next_due);
        const daysDiff = Math.ceil((nextDueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 0) {
          alertsList.push({
            type: "Medication Due",
            message: `${rabbit.name} (${rabbit.hutch_id}) - Vaccination overdue by ${Math.abs(daysDiff)} days`,
            variant: "destructive",
          });
        }
      }
    });

    // Sort alerts by urgency (overdue > upcoming > ready)
    alertsList.sort((a, b) => {
      const order = { destructive: 0, secondary: 1, outline: 2 } as const;
      return order[a.variant] - order[b.variant];
    });
    setAlerts([...alertsList.slice(0, 15)]); // Force re-render
    setOverdueRabbits(overdueRabbitsList);
  }, [rabbits, utils, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (dataLoaded) {
      generateAlerts();
      // Refresh alerts every minute to catch daily changes
      const interval = setInterval(generateAlerts, 60 * 1000); // Every 60 seconds
      return () => clearInterval(interval);
    }
  }, [dataLoaded, generateAlerts, breedingRefreshTrigger]);

  useEffect(() => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollLeft = 0;
    }
  }, []);

  // Scroll to the active tab when it changes
  useEffect(() => {
    if (tabsListRef.current) {
      const tabIndex = [
        "overview",
        "hutches",
        "breeding",
        "health",
        "feeding",
        "earnings",
        "reports",
        "analytics",
      ].indexOf(activeTab);
      const tabWidth = 70;
      tabsListRef.current.scrollTo({ left: tabIndex * tabWidth, behavior: "smooth" });
    }
  }, [activeTab]);

  useEffect(() => {
    const handleStorageChange = () => {
      setHasFarm(!!user?.farm_id || !!localStorage.getItem("rabbit_farm_id"));
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const handleRowAdded = useCallback(() => {
    loadData();
  }, [loadData]);

  const handleFarmCreated = useCallback(() => {
    setHasFarm(true);
    loadData();
  }, [loadData]);

  const handleKitAdded = useCallback(() => {
    loadData();
    setShowAddKitDialog(false);
    if (selectedRabbitForKit?.rabbit_id) {
      notifiedRabbitsRef.current.delete(selectedRabbitForKit.rabbit_id);
    }
    setBuckIdForKit("");
    setBuckNameForKit(undefined);
  }, [loadData, selectedRabbitForKit]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const totalRabbits = rabbits.length;
  const does = rabbits.filter((r) => r.gender === "female").length;
  const bucks = rabbits.filter((r) => r.gender === "male").length;
  const pregnantDoes = rabbits.filter((r) => r.is_pregnant && utils.isRabbitMature(r).isMature).length;
  const upcomingBirths = rabbits.filter(
    (r) =>
      r.expected_birth_date &&
      utils.isRabbitMature(r).isMature &&
      new Date(r.expected_birth_date).getTime() <= new Date().getTime() + 7 * 24 * 60 * 60 * 1000,
  ).length;

  if (!dataLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Rabbit className="h-12 w-12 mx-auto text-green-600 dark:text-green-400 animate-bounce mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading Rabbit Farm Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
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
              <Badge variant="outline" className="bg-white/60 dark:bg-gray-700/60 shadow-sm px-4 py-3.5 min-w-[140px] justify-center rounded-lg">
                <Building className="h-3 w-3 mr-1" />{rows.length} Rows Active
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 rounded-lg px-4 py-3 shadow-sm min-w-[140px]">
                <User className="h-4 w-4" /><span className="truncate">{user?.name || "User"}</span>
              </div>
              <CurrencySelector /><ThemeToggle /><AddRowDialog onRowAdded={handleRowAdded} />
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="bg-white/60 dark:bg-gray-700/60 hover:bg-red-500 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-500 dark:hover:border-red-800 shadow-sm"
              >
                <LogOut className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Logout</span>
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
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        user={user}
        rows={rows}
        logout={logout}
        handleRowAdded={handleRowAdded}
        hasFarm={hasFarm}
      />
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={toggleSidebar}></div>
      )}
      {showAddKitDialog && selectedRabbitForKit && (
        <AddKitDialog
          rabbit={selectedRabbitForKit}
          doeId={selectedRabbitForKit.rabbit_id ?? ''}
          buckId={buckIdForKit}
          doeName={selectedRabbitForKit.name}
          buckName={buckNameForKit}
          onClose={() => setShowAddKitDialog(false)}
          onKitAdded={handleKitAdded}
        />
      )}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {!hasFarm && <FarmBanner onFarmCreated={handleFarmCreated} />}
        {hasFarm && overdueRabbits.map((rabbit) => (
          <OverdueBirthBanner
            key={rabbit.rabbit_id}
            rabbit={rabbit}
            onDismiss={() => {
              if (rabbit.rabbit_id) {
                notifiedRabbitsRef.current.add(rabbit.rabbit_id);
                setOverdueRabbits(overdueRabbits.filter((r) => r.rabbit_id !== rabbit.rabbit_id));
              }
            }}
            onAddKits={(rabbit, buckId, doeName, buckName) => {
              setSelectedRabbitForKit(rabbit);
              setBuckIdForKit(buckId);
              setBuckNameForKit(buckName);
              setShowAddKitDialog(true);
            }}
          />
        ))}
        {hasFarm ? (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
            <TabsList
              ref={tabsListRef}
              key={activeTab}
              className="inline-flex justify-start w-full md:grid md:grid-cols-8 overflow-x-auto scroll-smooth whitespace-nowrap bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative shadow-sm md:shadow-none"
            >
              <TabsTrigger value="overview" className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium">Overview</TabsTrigger>
              <TabsTrigger value="hutches" className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium">Hutches</TabsTrigger>
              <TabsTrigger value="breeding" className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium">Breeding</TabsTrigger>
              <TabsTrigger value="health" className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium">Health</TabsTrigger>
              <TabsTrigger value="feeding" className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium">Feeding</TabsTrigger>
              <TabsTrigger value="earnings" className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium">Earnings</TabsTrigger>
              <TabsTrigger value="reports" className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium">Reports</TabsTrigger>
              <TabsTrigger value="analytics" className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium">Analytics</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Total Rabbits</CardTitle>
                    <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                      <Rabbit className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">{totalRabbits}</div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">{does} does, {bucks} bucks</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Pregnant Does</CardTitle>
                    <div className="p-1.5 sm:p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-lg">
                      <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">{pregnantDoes}</div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">{upcomingBirths} due this week</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Health Alerts</CardTitle>
                    <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                      <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{alerts.filter((a) => a.type === "Medication Due").length}</div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">Medication due</p>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Active Rows</CardTitle>
                    <div className="p-1.5 sm:p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg">
                      <Building className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">{rows.length}</div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">{hutches.length} total hutches</p>
                  </CardContent>
                </Card>
              </div>
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-sm sm:text-base dark:text-gray-200">
                    <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                    <span>Recent Alerts & Reminders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 sm:space-y-4">
                    {alerts.map((alert, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between p-3 sm:p-4 rounded-xl border ${alert.variant === "destructive"
                          ? "bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800"
                          : alert.variant === "secondary"
                            ? "bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-200 dark:border-amber-800"
                            : "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800"
                          }`}
                      >
                        <div>
                          <p className="font-medium text-sm sm:text-base">
                            {alert.type === "Medication Due" || (alert.type === "Birth Expected" && alert.variant === "destructive") ? (
                              <span className="text-red-800 dark:text-red-300">{alert.type}</span>
                            ) : (
                              <span className="text-amber-800 dark:text-amber-300">{alert.type}</span>
                            )}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                        </div>
                        <Badge variant={alert.variant} className="text-xs">
                          {alert.variant === "destructive" ? "Overdue" : alert.variant === "secondary" ? "Upcoming" : "Ready"}
                        </Badge>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">No alerts at this time.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="hutches"><HutchLayout hutches={hutches} rabbits={rabbits} rows={rows} onRabbitSelect={setSelectedRabbit} />{selectedRabbit && <RabbitProfile rabbit={selectedRabbit} onClose={() => setSelectedRabbit(null)} />}</TabsContent>
            <TabsContent value="breeding"><BreedingManager rabbits={rabbits} onRabbitsUpdate={handleRabbitsUpdate} /></TabsContent>
            <TabsContent value="health"><HealthTracker rabbits={rabbits} /></TabsContent>
            <TabsContent value="feeding"><FeedingSchedule rabbits={rabbits} /></TabsContent>
            <TabsContent value="earnings"><EarningsTracker /></TabsContent>
            <TabsContent value="reports"><ReportsDashboard /></TabsContent>
            <TabsContent value="analytics"><AnalyticsCharts /></TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-xl max-w-2xl mx-auto">
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-bold text-center dark:text-white flex items-center justify-center space-x-2">
                <Rabbit className="h-6 w-6 text-green-600 dark:text-green-400" /><span>Welcome to Karagani Rabbit Farming</span>
              </CardTitle>
              <p className="text-gray-600 dark:text-gray-300 text-center">No farm created yet</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">Get started by creating your farm to manage your rabbits, hutches, and more.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

const RabbitFarmDashboard: React.FC = () => {
  return (
    <CurrencyProvider>
      <ThemeProvider>
        <AuthProvider>
          <ProtectedRoute>
            <DashboardContent />
          </ProtectedRoute>
        </AuthProvider>
      </ThemeProvider>
    </CurrencyProvider>
  );
};

export default RabbitFarmDashboard;
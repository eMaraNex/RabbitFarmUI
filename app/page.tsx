"use client"

import React, { useEffect, useRef } from "react";
import { useState, useCallback } from "react";
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
import ProtectedRoute from "@/components/auth/protected-route";
import ThemeToggle from "@/components/theme-toggle";
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
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, user, rows, logout, handleRowAdded }) => {
  return (
    <div
      className={`fixed inset-y-0 right-0 z-50 w-72 bg-gray-900 text-white transform ${isOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-400 ease-in-out shadow-lg md:hidden overflow-y-auto`}
    >
      <div className="flex justify-between items-center p-4 border-b border-gray-700">
        <h2 className="text-lg font-bold">Menu</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="hover:bg-gray-800 rounded-full"
        >
          <X className="h-6 w-6" />
        </Button>
      </div>
      <div className="flex flex-col space-y-4 p-4">
        <div className="flex items-center space-x-2 text-sm bg-gray-800 rounded-lg px-4 py-3">
          <User className="h-4 w-4" />
          <span className="truncate">{user?.name}</span>
        </div>
        <Badge
          variant="outline"
          className="bg-gray-800 border-gray-600 flex items-center justify-center px-4 py-3"
        >
          <Building className="h-4 w-4 mr-2" />
          {rows.length} Rows Active
        </Badge>
        <div className="py-1">
          <CurrencySelector />
        </div>
        <div className="py-1">
          <ThemeToggle />
        </div>
        <div className="py-1">
          <AddRowDialog onRowAdded={handleRowAdded} />
        </div>
        <Button
          onClick={logout}
          variant="outline"
          size="sm"
          className="bg-gray-800 border-gray-600 hover:bg-red-900/50 hover:border-red-600 hover:text-red-300 flex items-center justify-center px-4 py-3"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );
};

const DashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedRabbit, setSelectedRabbit] = useState<RabbitType | null>(null);
  const [activeTab, setActiveTab] = useState<any>("overview");
  const [rabbits, setRabbits] = useState<any[]>([]);
  const [hutches, setHutches] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const tabsListRef = useRef<HTMLDivElement>(null);

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
    if (!user?.farm_id) return;

    // Check local storage first
    const cachedData = loadFromStorage(user.farm_id)
    if (cachedData.rows.length || cachedData.hutches.length || cachedData.rabbits.length) {
      setRows(cachedData.rows);
      setHutches(cachedData.hutches);
      setRabbits(cachedData.rabbits);
      setDataLoaded(true);
    }

    try {
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Fetch fresh data from API
      const [rowsResponse, hutchesResponse, rabbitsResponse] = await Promise.all([
        axios.get(`${utils.apiUrl}/rows/${user.farm_id}`),
        axios.get(`${utils.apiUrl}/hutches/${user.farm_id}`),
        axios.get(`${utils.apiUrl}/rabbits/${user.farm_id}`),
      ]);

      const newRows = rowsResponse.data.data || [];
      const newHutches = hutchesResponse.data.data || [];
      const newRabbits = rabbitsResponse.data.data || [];

      // Update state
      setRows(newRows);
      setHutches(newHutches);
      setRabbits(newRabbits);
      // Save to local storage
      saveToStorage(user.farm_id, { rows: newRows, hutches: newHutches, rabbits: newRabbits });

      setDataLoaded(true);
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
  const generateAlerts = useCallback(() => {
    const currentDate = new Date("2025-06-03T14:51:00+03:00"); // 02:51 PM EAT, June 03, 2025
    const alertsList: Alert[] = [];

    rabbits.forEach((rabbit) => {
      // Pregnancy Noticed Alert (from pregnancy_start_date to day 25)
      if (rabbit.is_pregnant && rabbit.pregnancy_start_date) {
        const pregnancyStart = new Date(rabbit.pregnancy_start_date);
        const daysSincePregnancy = Math.ceil((currentDate.getTime() - pregnancyStart.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSincePregnancy >= 0 && daysSincePregnancy < 26) { // Day 0 to day 25
          alertsList.push({
            type: "Pregnancy Noticed",
            message: `${rabbit.name} (${rabbit.hutch_id}) - Confirmed pregnant since ${pregnancyStart.toLocaleDateString()}`,
            variant: "secondary",
          });
        }

        // Nesting Box Needed Alert (26 days after pregnancy_start_date to day 30)
        if (daysSincePregnancy >= 26 && daysSincePregnancy < 31) { // Day 26 to day 30
          alertsList.push({
            type: "Nesting Box Needed",
            message: `${rabbit.name} (${rabbit.hutch_id}) - Add nesting box, 26 days since mating on ${pregnancyStart.toLocaleDateString()}`,
            variant: "secondary",
          });
        }

        // Birth Expected Alert (within 7 days before or 2 days after expected_birth_date)
        if (rabbit.expected_birth_date) {
          const expectedDate = new Date(rabbit.expected_birth_date);
          const daysDiff = Math.ceil((expectedDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 7 && daysDiff >= -2) {
            alertsList.push({
              type: "Birth Expected",
              message: `${rabbit.name} (${rabbit.hutch_id}) - Expected to give birth in ${daysDiff > 0 ? `${daysDiff} days` : "overdue by " + Math.abs(daysDiff) + " days"}`,
              variant: daysDiff <= 0 ? "destructive" : "secondary",
            });
          }
        }
      }

      // Ready for Servicing Alert
      if (rabbit.gender === "female" && !rabbit.is_pregnant) {
        const lastBirth = rabbit.actual_birth_date ? new Date(rabbit.actual_birth_date) : null;
        const weaningDate = lastBirth ? new Date(lastBirth.getTime() + 42 * 24 * 60 * 60 * 1000) : null;
        const oneWeekAfterWeaning = weaningDate ? new Date(weaningDate.getTime() + 7 * 24 * 60 * 60 * 1000) : null;

        if (
          (!rabbit.pregnancy_start_date || (rabbit.pregnancy_start_date && currentDate > new Date(new Date(rabbit.pregnancy_start_date).getTime() + 42 * 24 * 60 * 60 * 1000))) &&
          (!oneWeekAfterWeaning || currentDate > oneWeekAfterWeaning)
        ) {
          alertsList.push({
            type: "Breeding Ready",
            message: `${rabbit.name} (${rabbit.hutch_id}) - Ready for next breeding cycle`,
            variant: "outline",
          });
        }
      }

      // Medication Due Alert (Simulated)
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

    setAlerts(alertsList.slice(0, 3));
  }, [rabbits]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (dataLoaded) {
      generateAlerts();
    }
  }, [dataLoaded, generateAlerts]);

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
      tabsListRef.current.scrollTo({
        left: tabIndex * tabWidth,
        behavior: "smooth",
      });
    }
  }, [activeTab]);

  const handleRowAdded = useCallback(() => {
    loadData();
  }, [loadData]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const totalRabbits = rabbits.length;
  const does = rabbits.filter((r) => r.gender === "female").length;
  const bucks = rabbits.filter((r) => r.gender === "male").length;
  const pregnantDoes = rabbits.filter((r) => r.is_pregnant).length;
  const upcomingBirths = rabbits.filter(
    (r) => r.expected_birth_date && new Date(r.expected_birth_date) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
              <Badge variant="outline" className="bg-white/60 dark:bg-gray-700/60 shadow-sm">
                <Building className="h-3 w-3 mr-1" />
                {rows.length} Rows Active
              </Badge>
              <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-700/60 rounded-lg px-3 py-2 shadow-sm">
                <User className="h-4 w-4" />
                <span className="truncate">{user?.name}</span>
              </div>
              <CurrencySelector />
              <ThemeToggle />
              <AddRowDialog onRowAdded={handleRowAdded} />
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="bg-white/60 dark:bg-gray-700/60 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 shadow-sm"
              >
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              onClick={toggleSidebar}
            >
              <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
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
      />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 sm:space-y-8">
          <TabsList
            ref={tabsListRef}
            key={activeTab}
            className="inline-flex justify-start w-full md:grid md:grid-cols-8 overflow-x-auto scroll-smooth whitespace-nowrap bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent relative shadow-sm md:shadow-none"
          >
            <TabsTrigger
              value="overview"
              className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="hutches"
              className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
            >
              Hutches
            </TabsTrigger>
            <TabsTrigger
              value="breeding"
              className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
            >
              Breeding
            </TabsTrigger>
            <TabsTrigger
              value="health"
              className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
            >
              Health
            </TabsTrigger>
            <TabsTrigger
              value="feeding"
              className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
            >
              Feeding
            </TabsTrigger>
            <TabsTrigger
              value="earnings"
              className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
            >
              Earnings
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
            >
              Reports
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex-1 min-w-[70px] data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 text-xs sm:text-sm font-medium"
            >
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 sm:space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">Total Rabbits</CardTitle>
                  <div className="p-1.5 sm:p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <Rabbit className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {totalRabbits}
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    {does} does, {bucks} bucks
                  </p>
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
                  <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                    {pregnantDoes}
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    {upcomingBirths} due this week
                  </p>
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
                  <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                    3
                  </div>
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
                  <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                    {rows.length}
                  </div>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    {hutches.length} total hutches
                  </p>
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
                          {alert.type === "Medication Due" ? (
                            <span className="text-red-800 dark:text-red-300">{alert.type}</span>
                          ) : alert.type === "Birth Expected" ? (
                            <span className="text-amber-800 dark:text-amber-300">{alert.type}</span>
                          ) : (
                            <span className="text-blue-800 dark:text-blue-300">{alert.type}</span>
                          )}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{alert.message}</p>
                      </div>
                      <Badge variant={alert.variant} className="text-xs">
                        {alert.variant === "destructive" ? "Overdue" : alert.variant === "secondary" ? "Upcoming" : "Ready"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hutches">
            <HutchLayout hutches={hutches} rabbits={rabbits} rows={rows} onRabbitSelect={setSelectedRabbit} />
            {selectedRabbit && <RabbitProfile rabbit={selectedRabbit} onClose={() => setSelectedRabbit(null)} />}
          </TabsContent>

          <TabsContent value="breeding">
            <BreedingManager rabbits={rabbits} />
          </TabsContent>

          <TabsContent value="health">
            <HealthTracker rabbits={rabbits} />
          </TabsContent>

          <TabsContent value="feeding">
            <FeedingSchedule rabbits={rabbits} />
          </TabsContent>

          <TabsContent value="earnings">
            <EarningsTracker />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsDashboard />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsCharts />
          </TabsContent>
        </Tabs>
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
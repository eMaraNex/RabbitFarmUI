"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Rabbit, Heart, Pill, AlertTriangle, Building } from "lucide-react";
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
import EmailVerificationBanner from "@/components/email-verification-banner";
import ProtectedRoute from "@/components/auth/protected-route";
import ThemeToggle from "@/components/theme-toggle";
import AddKitDialog from "@/components/add-kit-dialog";
import { useToast } from '@/lib/toast-provider';
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";
import { CurrencyProvider } from "@/lib/currency-context";
import axios from "axios";
import * as utils from "@/lib/utils";
import type { Rabbit as RabbitType } from "@/types";
import { useRouter } from "next/navigation";
import Header from "@/components/shared/header";
import SkeletonDashboard from "@/components/skeletons/dashboard/skeleton";
import Sidebar from "@/components/shared/sidebar";
import { Alert, ServerAlert } from "@/types";

const DashboardContent: React.FC = () => {
  const { user, logout } = useAuth();
  const { showError } = useToast();
  const [selectedRabbit, setSelectedRabbit] = useState<RabbitType | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [rabbits, setRabbits] = useState<RabbitType[]>([]);
  const [hutches, setHutches] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [farmName, setFarmName] = useState<String>("");
  const [dataLoaded, setDataLoaded] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const tempFarmId = localStorage.getItem("rabbit_farm_id");

  let farmId;
  try {
    farmId = tempFarmId ? JSON.parse(tempFarmId) : null;
  } catch (e) {
    farmId = tempFarmId;
  }

  const finalFarmId =
    farmId && typeof farmId === "object" ? farmId.farmId : farmId;

  // Set hasFarm to true only if finalFarmId is a non-empty string
  const [hasFarm, setHasFarm] = useState<boolean>(
    !!finalFarmId && finalFarmId !== ""
  );

  const [breedingRefreshTrigger, setBreedingRefreshTrigger] =
    useState<number>(0);
  const [showAddKitDialog, setShowAddKitDialog] = useState<boolean>(false);
  const [selectedRabbitForKit, setSelectedRabbitForKit] =
    useState<RabbitType | null>(null);
  const [buckIdForKit, setBuckIdForKit] = useState<string>("");
  const tabsListRef = useRef<HTMLDivElement>(null);
  const notifiedRabbitsRef = useRef<Set<string>>(new Set());
  const router = useRouter();
  const [addRowOpen, setAddRowOpen] = useState<boolean>(false);

  const handleAddRow = () => {
    setAddRowOpen(true);
  };
  const cachedFarmDetails = localStorage.getItem(`rabbit_farm_data`);
  const farmDetails = cachedFarmDetails ? JSON.parse(cachedFarmDetails) : [];

  const loadFromStorage = useCallback((farmId: string) => {
    try {
      const cachedRows = localStorage.getItem(`rabbit_farm_rows_${farmId}`);
      const cachedHutches = localStorage.getItem(
        `rabbit_farm_hutches_${farmId}`
      );
      const cachedRabbits = localStorage.getItem(
        `rabbit_farm_rabbits_${farmId}`
      );
      const cachedFarmDetails = localStorage.getItem(`rabbit_farm_data`);
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

  const saveToStorage = useCallback(
    (farmId: string, data: { rows: any[]; hutches: any[]; rabbits: any[] }) => {
      try {
        localStorage.setItem(
          `rabbit_farm_rows_${farmId}`,
          JSON.stringify(data.rows)
        );
        localStorage.setItem(
          `rabbit_farm_hutches_${farmId}`,
          JSON.stringify(data.hutches)
        );
        localStorage.setItem(
          `rabbit_farm_rabbits_${farmId}`,
          JSON.stringify(data.rabbits)
        );
      } catch (error) {
        console.error("Error saving to storage:", error);
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    if (!user?.farm_id) {
      setDataLoaded(true);
      return;
    }

    // Check local storage first
    const cachedData = loadFromStorage(user.farm_id);
    if (
      cachedData.rows.length ||
      cachedData.hutches.length ||
      cachedData.rabbits.length
    ) {
      setRows(cachedData.rows);
      setHutches(cachedData.hutches);
      setRabbits(cachedData.rabbits);
      setDataLoaded(true);
    }

    try {
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) throw new Error("No authentication token found");

      const [rowsResponse, hutchesResponse, rabbitsResponse, alertsResponse] =
        await Promise.all([
          axios.get(`${utils.apiUrl}/rows/list/${user.farm_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${utils.apiUrl}/hutches/${user.farm_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${utils.apiUrl}/rabbits/${user.farm_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${utils.apiUrl}/alerts/${user.farm_id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

      let newRabbits = rabbitsResponse.data.data || [];
      newRabbits = newRabbits.map((r: any) => ({
        ...r,
        expected_birth_date:
          r.is_pregnant && r.pregnancy_start_date
            ? new Date(
              new Date(r.pregnancy_start_date).getTime() +
              (utils.PREGNANCY_DURATION_DAYS || 31) * 24 * 60 * 60 * 1000
            ).toISOString()
            : r.expected_birth_date,
      }));

      const newRows = rowsResponse.data.data || [];
      const newHutches = hutchesResponse.data.data || [];
      const serverAlerts: ServerAlert[] = alertsResponse.data.data || [];
      const mappedAlerts: Alert[] = serverAlerts.map(alert => ({
        type:
          alert.alert_type === "birth"
            ? "Birth Expected"
            : alert.alert_type === "medication"
              ? "Medication Due"
              : alert.name,
        message: alert.message,
        variant:
          alert.severity === "high"
            ? "destructive"
            : alert.severity === "medium"
              ? "secondary"
              : "outline",
      }));
      // Update state
      setRows(newRows);
      setHutches(newHutches);
      setRabbits(newRabbits);
      setAlerts(mappedAlerts);

      // Save to local storage
      saveToStorage(user.farm_id, {
        rows: newRows,
        hutches: newHutches,
        rabbits: newRabbits,
      });

      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (
        cachedData.rows.length ||
        cachedData.hutches.length ||
        cachedData.rabbits.length
      ) {
        setRows(cachedData.rows);
        setHutches(cachedData.hutches);
        setRabbits(cachedData.rabbits);
      }
      setDataLoaded(true);
      showError('Error', "Failed to fetch data from server.");
    }
  }, [user, loadFromStorage, saveToStorage]);

  const handleRabbitsUpdate = useCallback(
    (updatedRabbits: RabbitType[]) => {
      setRabbits(updatedRabbits);
      if (user?.farm_id) {
        saveToStorage(user.farm_id, { rows, hutches, rabbits: updatedRabbits });
      }
      setBreedingRefreshTrigger(prev => prev + 1);
    },
    [user, rows, hutches, saveToStorage]
  );

  useEffect(() => {
    loadData();
  }, [loadData, breedingRefreshTrigger]);

  useEffect(() => {
    if (tabsListRef.current) {
      tabsListRef.current.scrollLeft = 0;
    }
  }, []);

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

  useEffect(() => {
    const handleStorageChange = () => {
      setHasFarm(!!farmId || !!user?.farm_id);
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
  }, [loadData, selectedRabbitForKit]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const totalRabbits = rabbits.length;
  const does = rabbits.filter(r => r.gender === "female").length;
  const bucks = rabbits.filter(r => r.gender === "male").length;
  const pregnantDoes = rabbits.filter(
    r => r.is_pregnant && utils.isRabbitMature(r).isMature
  ).length;
  const upcomingBirths = rabbits.filter(
    r =>
      r.expected_birth_date &&
      utils.isRabbitMature(r).isMature &&
      new Date(r.expected_birth_date).getTime() <=
      new Date().getTime() + 7 * 24 * 60 * 60 * 1000
  ).length;

  if (!dataLoaded) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header
        user={user}
        rows={rows}
        logout={logout}
        toggleSidebar={toggleSidebar}
        CurrencySelector={CurrencySelector}
        ThemeToggle={ThemeToggle}
        handleAddRow={handleAddRow}
        farmName={farmDetails?.name}
      />
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        user={user}
        rows={rows}
        logout={logout}
        handleRowAdded={handleRowAdded}
        hasFarm={hasFarm}
        handleAddRow={handleAddRow}
        addRowOpen={false}
      />
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      {showAddKitDialog && selectedRabbitForKit && (
        <AddKitDialog
          rabbit={selectedRabbitForKit}
          doeId={selectedRabbitForKit.rabbit_id ?? ""}
          buckId={buckIdForKit}
          doeName={selectedRabbitForKit.name}
          onClose={() => setShowAddKitDialog(false)}
          onKitAdded={handleKitAdded}
        />
      )}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {user && !user.email_verified && <EmailVerificationBanner />}
        {hasFarm ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-6 sm:space-y-8"
          >
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
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                <Card
                  className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => router.push("/rabbits")}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">
                      Total Rabbits
                    </CardTitle>
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
                    <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">
                      Pregnant Does
                    </CardTitle>
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
                    <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">
                      Health Alerts
                    </CardTitle>
                    <div className="p-1.5 sm:p-2 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg">
                      <Pill className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-xl sm:text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                      {alerts.filter(a => a.type === "Medication Due").length}
                    </div>
                    <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                      Medication due
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 hover:shadow-lg transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-medium dark:text-gray-200">
                      Active Rows
                    </CardTitle>
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
                            {alert.type === "Medication Due" ||
                              (alert.type === "Birth Expected" &&
                                alert.variant === "destructive") ? (
                              <span className="text-red-800 dark:text-red-300">
                                {alert.type}
                              </span>
                            ) : (
                              <span className="text-amber-800 dark:text-amber-300">
                                {alert.type}
                              </span>
                            )}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                            {alert.message}
                          </p>
                        </div>
                        <Badge variant={alert.variant} className="text-xs">
                          {alert.variant === "destructive"
                            ? "Overdue"
                            : alert.variant === "secondary"
                              ? "Upcoming"
                              : "Ready"}
                        </Badge>
                      </div>
                    ))}
                    {alerts.length === 0 && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        No alerts at this time.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="hutches">
              <HutchLayout
                hutches={hutches}
                rabbits={rabbits}
                rows={rows}
                onRabbitSelect={setSelectedRabbit}
                onRowAdded={handleRowAdded}
                handleAddRow={handleAddRow}
              />
              {selectedRabbit && (
                <RabbitProfile
                  rabbit={selectedRabbit}
                  onClose={() => setSelectedRabbit(null)}
                />
              )}
            </TabsContent>
            <TabsContent value="breeding">
              <BreedingManager
                rabbits={rabbits}
                onRabbitsUpdate={handleRabbitsUpdate}
              />
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
        ) : (
          <>
            <FarmBanner onFarmCreated={handleFarmCreated} />
            <Card className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm border-white/20 dark:border-gray-700/20 shadow-xl max-w-2xl mx-auto">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl font-bold text-center dark:text-white flex items-center justify-center space-x-2">
                  <Rabbit className="h-6 w-6 text-green-600 dark:text-green-400" />
                  <span>Welcome to Rabbit Farming</span>
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-300 text-center">
                  No farm created yet
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Get started by creating your farm to manage your rabbits,
                  hutches, and more.
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>
      <AddRowDialog
        open={addRowOpen}
        onClose={() => setAddRowOpen(false)}
        onRowAdded={handleRowAdded}
      />
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

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Calendar, Award, Heart, DollarSign, Download } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import { useAuth } from "@/lib/auth-context";
import axios from "axios";
import * as utils from "@/lib/utils";
import type { Rabbit, EarningsRecord } from "@/types";

export default function ReportsDashboard() {
  const { formatAmount, convertToBaseCurrency } = useCurrency();
  const { user } = useAuth();
  const [rabbits, setRabbits] = useState<Rabbit[]>([]);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [dateRange, setDateRange] = useState("month");
  const [reportType, setReportType] = useState("overview");

  useEffect(() => {
    if (user?.farm_id) {
      loadData();
    }
  }, [user?.farm_id]);

  const loadData = async () => {
    try {
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const [rabbitsResponse, earningsResponse] = await Promise.all([
        axios.get(`${utils.apiUrl}/rabbits/${user?.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${utils.apiUrl}/earnings/${user?.farm_id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRabbits(rabbitsResponse.data.data || []);
      setEarnings(earningsResponse.data.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      setRabbits([]);
      setEarnings([]);
    }
  };

  const getDateRangeFilter = () => {
    const now = new Date();
    switch (dateRange) {
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "month":
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case "quarter":
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case "year":
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default:
        return new Date(0);
    }
  };

  const getTopPerformingBuck = () => {
    const safeRabbits = rabbits || [];
    const buckPerformance = safeRabbits
      .filter((r) => r.gender === "male")
      .map((buck) => {
        const offspring = safeRabbits.filter((r) => r.parent_male_id === buck.rabbit_id);
        const total_kits = offspring.reduce((sum, r) => sum + (r.total_kits || 0), 0);
        return {
          ...buck,
          totalOffspring: offspring.length,
          total_kits: total_kits,
        };
      })
      .sort((a, b) => b.total_kits - a.total_kits);

    return buckPerformance[0] || null;
  };

  const getTopPerformingDoe = () => {
    const safeRabbits = rabbits || [];
    const doesPerformance = safeRabbits
      .filter((r) => r.gender === "female")
      .sort((a, b) => (b.total_kits || 0) - (a.total_kits || 0));
    return doesPerformance[0] || null;
  };

  const getBirthsInPeriod = () => {
    const startDate = getDateRangeFilter();
    const safeRabbits = rabbits || [];
    return safeRabbits.filter((r) => r.birth_date && new Date(r.birth_date) >= startDate).length;
  };

  const getEarningsComparison = () => {
    const currentPeriodStart = getDateRangeFilter();
    const previousPeriodStart = new Date(
      currentPeriodStart.getTime() - (new Date().getTime() - currentPeriodStart.getTime())
    );

    const safeEarnings = earnings || [];

    const currentEarnings = safeEarnings
      .filter((e) => new Date(e.date) >= currentPeriodStart)
      .reduce((sum, e) => sum + convertToBaseCurrency(e.amount, e.currency as any), 0);

    const previousEarnings = safeEarnings
      .filter((e) => new Date(e.date) >= previousPeriodStart && new Date(e.date) < currentPeriodStart)
      .reduce((sum, e) => sum + convertToBaseCurrency(e.amount, e.currency as any), 0);

    const change = previousEarnings > 0 ? ((currentEarnings - previousEarnings) / previousEarnings) * 100 : 0;

    return {
      current: currentEarnings,
      previous: previousEarnings,
      change: change,
    };
  };

  const getBreedingEfficiency = () => {
    const safeRabbits = rabbits || [];
    const pregnantDoes = safeRabbits.filter((r) => r.is_pregnant).length;
    const totalDoes = safeRabbits.filter((r) => r.gender === "female").length;
    return totalDoes > 0 ? (pregnantDoes / totalDoes) * 100 : 0;
  };

  const getAverageKitsPerLitter = () => {
    const safeRabbits = rabbits || [];
    const doesWithLitters = safeRabbits.filter((r) => r.gender === "female" && (r.total_litters || 0) > 0);
    if (doesWithLitters.length === 0) return 0;

    const total_kits = doesWithLitters.reduce((sum, r) => sum + (r.total_kits || 0), 0) || 0;
    const total_litters = doesWithLitters.reduce((sum, r) => sum + (r.total_litters || 0), 0) || 0;

    return total_litters > 0 ? total_kits / total_litters : 0;
  };

  const getProductivityByBreed = () => {
    const safeRabbits = rabbits || [];
    const breedStats = safeRabbits.reduce(
      (acc, rabbit) => {
        const breed = rabbit.breed || "Unknown";
        if (!acc[breed]) {
          acc[breed] = {
            count: 0,
            total_kits: 0,
            total_litters: 0,
            avgWeight: 0,
            totalWeight: 0,
          };
        }

        acc[breed].count++;
        acc[breed].total_kits += rabbit.total_kits || 0;
        acc[breed].total_litters += rabbit.total_litters || 0;
        acc[breed].totalWeight += rabbit.weight || 0;

        return acc;
      },
      {} as Record<string, any>
    );

    Object.keys(breedStats).forEach((breed) => {
      breedStats[breed].avgWeight = breedStats[breed].count > 0 ? breedStats[breed].totalWeight / breedStats[breed].count : 0;
      breedStats[breed].avgKitsPerRabbit = breedStats[breed].count > 0 ? breedStats[breed].total_kits / breedStats[breed].count : 0;
    });

    return Object.entries(breedStats)
      .map(([breed, stats]) => ({ breed, ...stats }))
      .sort((a, b) => b.avgKitsPerRabbit - a.avgKitsPerRabbit);
  };

  const topBuck = getTopPerformingBuck();
  const topDoe = getTopPerformingDoe();
  const birthsInPeriod = getBirthsInPeriod();
  const earningsComparison = getEarningsComparison();
  const breedingEfficiency = getBreedingEfficiency();
  const avgKitsPerLitter = getAverageKitsPerLitter();
  const breedProductivity = getProductivityByBreed();

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Controls */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Farm Reports & Analytics</span>
            </div>
            <Button
              variant="outline"
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 w-full sm:w-auto"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="text-xs sm:text-sm">Export Report</span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="week">Last Week</SelectItem>
                  <SelectItem value="month">Last Month</SelectItem>
                  <SelectItem value="quarter">Last Quarter</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="all">All Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="overview">Overview</SelectItem>
                  <SelectItem value="breeding">Breeding</SelectItem>
                  <SelectItem value="financial">Financial</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Births This Period</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
              {birthsInPeriod}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">New rabbits born</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Breeding Efficiency</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 bg-clip-text text-transparent">
              {breedingEfficiency.toFixed(1)}%
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Does currently pregnant</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Avg Kits/Litter</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {avgKitsPerLitter.toFixed(1)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Average productivity</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Earnings Change</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
              {earningsComparison.change > 0 ? "+" : ""}
              {earningsComparison.change.toFixed(1)}%
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">vs previous {dateRange}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-3 sm:mt-5">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-gray-100">Top Performing Buck</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 mt-5">
            {topBuck ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{topBuck.rabbit_id}</span>
                  <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">Top Buck</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Breed:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topBuck.breed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Kits Sired:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topBuck.total_kits}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Weight:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topBuck.weight}kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Hutch:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topBuck.hutch_id}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No breeding data available</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-pink-50/80 to-pink-100/80 dark:from-pink-900/30 dark:to-pink-800/30 border-b border-gray-200 dark:border-gray-600">
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
              <span className="text-gray-900 dark:text-gray-100">Top Performing Doe</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 mt-5">
            {topDoe ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{topDoe.rabbit_id}</span>
                  <Badge className="bg-gradient-to-r from-pink-500 to-pink-600 text-white">Top Doe</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Breed:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topDoe.breed}</p>
                  </div>
                  {/* <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Kits:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topDoe.total_kits}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Litters:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topDoe.total_litters}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Status:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {topDoe.is_pregnant ? "Pregnant" : "Available"}
                    </p>
                  </div> */}
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Weight</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topDoe.weight}kg</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Hutch:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topDoe.hutch_id}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No breeding data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Breed Productivity */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Productivity by Breed</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {breedProductivity.slice(0, 5).map((breed, index) => (
              <div
                key={breed.breed}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 space-y-3 sm:space-y-0"
              >
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                    <Badge
                      variant="outline"
                      className={`w-fit text-xs ${index === 0
                        ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300"
                        : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600"
                        }`}
                    >
                      #{index + 1}
                    </Badge>
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{breed.breed}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {breed.count} rabbits • Avg weight: {breed.avgWeight.toFixed(1)}kg
                  </p>
                </div>
                <div className="flex justify-between sm:block sm:text-right">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                      {breed.avgKitsPerRabbit.toFixed(1)} kits/rabbit
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{breed.total_kits} total kits</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-b border-gray-200 dark:border-gray-600 pb-3 sm:pb-4">
          <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
            <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <span className="text-gray-900 dark:text-gray-100">Breed Performance Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 p-3 sm:p-6">
          {breedProductivity.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {breedProductivity.map((breed) => (
                <div
                  key={breed.breed}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 space-y-2 sm:space-y-0"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{breed.breed}</div>
                    <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {breed.count} rabbits • Avg {breed.avgKitsPerRabbit.toFixed(1)} kits/rabbit
                    </div>
                  </div>
                  <div className="flex justify-between sm:block sm:text-right">
                    <div>
                      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Avg Weight</div>
                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">{breed.avgWeight.toFixed(1)}kg</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm">No breed data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
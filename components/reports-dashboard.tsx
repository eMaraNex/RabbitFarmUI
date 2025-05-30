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
import type { Rabbit, EarningsRecord } from "@/lib/types";

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
    const buckPerformance = rabbits
      .filter((r) => r.gender === "male")
      .map((buck) => {
        const offspring = rabbits.filter((r) => r.parentMale === buck.rabbit_id);
        const totalKits = offspring.reduce((sum, r) => sum + r.totalKits, 0);
        return {
          ...buck,
          totalOffspring: offspring.length,
          totalKits: totalKits,
        };
      })
      .sort((a, b) => b.totalKits - a.totalKits);

    return buckPerformance[0] || null;
  };

  const getTopPerformingDoe = () => {
    const doesPerformance = rabbits.filter((r) => r.gender === "female").sort((a, b) => b.totalKits - a.totalKits);
    return doesPerformance[0] || null;
  };

  const getBirthsInPeriod = () => {
    const startDate = getDateRangeFilter();
    return rabbits.filter((r) => new Date(r.birthDate) >= startDate).length;
  };

  const getEarningsComparison = () => {
    const currentPeriodStart = getDateRangeFilter();
    const previousPeriodStart = new Date(
      currentPeriodStart.getTime() - (new Date().getTime() - currentPeriodStart.getTime())
    );

    const currentEarnings = earnings
      .filter((e) => new Date(e.date) >= currentPeriodStart)
      .reduce((sum, e) => sum + convertToBaseCurrency(e.amount, e.currency as any), 0);

    const previousEarnings = earnings
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
    const pregnantDoes = rabbits.filter((r) => r.isPregnant).length;
    const totalDoes = rabbits.filter((r) => r.gender === "female").length;
    return totalDoes > 0 ? (pregnantDoes / totalDoes) * 100 : 0;
  };

  const getAverageKitsPerLitter = () => {
    const doesWithLitters = rabbits.filter((r) => r.gender === "female" && r.totalLitters > 0);
    if (doesWithLitters.length === 0) return 0;

    const totalKits = doesWithLitters.reduce((sum, r) => sum + r.totalKits, 0) || 0;
    const totalLitters = doesWithLitters.reduce((sum, r) => sum + r.totalLitters, 0) || 0;

    return totalLitters > 0 ? totalKits / totalLitters : 0;
  };

  const getProductivityByBreed = () => {
    const breedStats = rabbits.reduce(
      (acc, rabbit) => {
        if (!acc[rabbit.breed]) {
          acc[rabbit.breed] = {
            count: 0,
            totalKits: 0,
            totalLitters: 0,
            avgWeight: 0,
            totalWeight: 0,
          };
        }

        acc[rabbit.breed].count++;
        acc[rabbit.breed].totalKits += rabbit.totalKits;
        acc[rabbit.breed].totalLitters += rabbit.totalLitters;
        acc[rabbit.breed].totalWeight += rabbit.weight;

        return acc;
      },
      {} as Record<string, any>
    );

    Object.keys(breedStats).forEach((breed) => {
      breedStats[breed].avgWeight = breedStats[breed].totalWeight / breedStats[breed].count || 0;
      breedStats[breed].avgKitsPerRabbit = breedStats[breed].totalKits / breedStats[breed].count || 0;
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
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <span className="text-gray-900 dark:text-gray-100">Farm Reports & Analytics</span>
            </div>
            <Button
              variant="outline"
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
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
                <SelectTrigger className="w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Births This Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
              {birthsInPeriod}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">New rabbits born</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Breeding Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 bg-clip-text text-transparent">
              {breedingEfficiency.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Does currently pregnant</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Avg Kits/Litter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-purple-400 dark:to-indigo-400 bg-clip-text text-transparent">
              {avgKitsPerLitter.toFixed(1)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Average productivity</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Earnings Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
              {earningsComparison.change > 0 ? "+" : ""}
              {earningsComparison.change.toFixed(1)}%
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">vs previous {dateRange}</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
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
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topBuck.totalKits}</p>
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
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topDoe.totalKits}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Litters:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{topDoe.totalLitters}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Status:</p>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {topDoe.isPregnant ? "Pregnant" : "Available"}
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
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Productivity by Breed</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {breedProductivity.slice(0, 5).map((breed, index) => (
              <div
                key={breed.breed}
                className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60"
              >
                <div>
                  <div className="flex items-center space-x-3">
                    <Badge
                      variant="outline"
                      className={
                        index === 0
                          ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300"
                          : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-600"
                      }
                    >
                      #{index + 1}
                    </Badge>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{breed.breed}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {breed.count} rabbits • Avg weight: {breed.avgWeight.toFixed(1)}kg
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {breed.avgKitsPerRabbit.toFixed(1) ?? 0} kits/rabbit
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{breed.totalKits ?? 0} total kits</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Summary */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-b border-gray-200 dark:border-gray-600">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            <span className="text-gray-900 dark:text-gray-100">Breed Productivity</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 mt-5">
          {breedProductivity.length > 0 ? (
            <div className="space-y-4">
              {breedProductivity.map((breed) => (
                <div
                  key={breed.breed}
                  className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60"
                >
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{breed.breed}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {breed.count} rabbits • Avg {breed.avgKitsPerRabbit.toFixed(1) ?? 0} kits/rabbit
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 dark:text-gray-400">Avg Weight</div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{breed.avgWeight.toFixed(1)}kg</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No breed data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
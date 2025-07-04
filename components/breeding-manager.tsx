"use client"

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import * as utils from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import type { BreedingManagerProps, BreedingRecord, CompatibilityResult, Rabbit } from "@/types";


const checkInbreeding = (doe: Rabbit, buck: Rabbit): boolean => {
  if (doe.parent_male_id === buck.id || doe.parent_female_id === buck.id) return true;
  if (buck.parent_male_id === doe.id || buck.parent_female_id === doe.id) return true;
  if (doe.parent_male_id === buck.parent_male_id && doe.parent_male_id) return true;
  if (doe.parent_female_id === buck.parent_female_id && doe.parent_female_id) return true;
  return false;
};

export default function BreedingManager({ rabbits: initialRabbits, onRabbitsUpdate }: BreedingManagerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedDoe, setSelectedDoe] = useState<string>("");
  const [selectedBuck, setSelectedBuck] = useState<string>("");
  const [rabbits, setRabbits] = useState<Rabbit[]>(initialRabbits);
  const [breedingRecords, setBreedingRecords] = useState<BreedingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingRecords, setIsLoadingRecords] = useState<boolean>(false);
  const [isFetchingRabbits, setIsFetchingRabbits] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sync local rabbits state with initialRabbits prop when it changes
  useEffect(() => {
    setRabbits(initialRabbits);
  }, [initialRabbits]);

  const does = rabbits.filter((r) => r.gender === "female");
  const bucks = rabbits.filter((r) => r.gender === "male");
  const availableDoes = does.filter((r) => !r.is_pregnant && utils.isRabbitMature(r).isMature);
  const pregnantDoes = does.filter((r) => r.is_pregnant);
  const availableBucks = bucks.filter((r) => utils.isRabbitMature(r).isMature);

  const getBreedingCompatibility = (doeId: string, buckId: string): CompatibilityResult => {
    const doe = rabbits.find((r) => r.id === doeId);
    const buck = rabbits.find((r) => r.id === buckId);

    if (!doe || !buck) {
      return { compatible: false, reason: "Invalid selection" };
    }

    const doeMaturity = utils.isRabbitMature(doe);
    if (!doeMaturity.isMature) {
      return { compatible: false, reason: `Doe ${doe.name} (${doe.hutch_id || 'N/A'}): ${doeMaturity.reason}` };
    }

    const buckMaturity = utils.isRabbitMature(buck);
    if (!buckMaturity.isMature) {
      return { compatible: false, reason: `Buck ${buck.name} (${buck.hutch_id || 'N/A'}): ${buckMaturity.reason}` };
    }

    if (checkInbreeding(doe, buck)) {
      return { compatible: false, reason: "Potential inbreeding detected" };
    }

    if (doe.is_pregnant) {
      return { compatible: false, reason: "Doe is currently pregnant" };
    }

    return { compatible: true, reason: "Compatible for breeding" };
  };

  const handleScheduleBreeding = async (): Promise<void> => {
    if (!selectedDoe || !selectedBuck || !user?.farm_id) return;

    const compatibility = getBreedingCompatibility(selectedDoe, selectedBuck);
    if (!compatibility.compatible) {
      toast({
        variant: "destructive",
        title: "Cannot Schedule Breeding",
        description: compatibility.reason,
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const doe = rabbits.find((r) => r.id === selectedDoe);
      const buck = rabbits.find((r) => r.id === selectedBuck);
      if (!doe || !buck) throw new Error("Invalid rabbit selection");

      const matingDate = new Date().toISOString().split("T")[0];
      const expectedBirthDate = new Date(new Date(matingDate).getTime() + (utils.PREGNANCY_DURATION_DAYS || 31) * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      // Update rabbit state locally
      const updatedRabbits = rabbits.map((r) =>
        r.id === selectedDoe
          ? {
            ...r,
            is_pregnant: true,
            pregnancy_start_date: matingDate,
            expected_birth_date: expectedBirthDate,
            mated_with: buck.name,
          }
          : r
      );
      setRabbits(updatedRabbits);

      const breedResponse = await axios.post(`${utils.apiUrl}/breeds/${user.farm_id}`, {
        farm_id: user.farm_id,
        doe_id: doe.rabbit_id,
        buck_id: buck.rabbit_id,
        mating_date: matingDate,
        expected_birth_date: expectedBirthDate,
        notes: `Scheduled on ${matingDate}`,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` },
      });

      if (breedResponse.status === 201) {
        setSuccess("Breeding scheduled successfully!");
        toast({
          title: "Success",
          description: "Breeding scheduled successfully!",
        });
        setSelectedDoe("");
        setSelectedBuck("");
        onRabbitsUpdate(updatedRabbits);
        await fetchBreedingRecords(); // Only fetch breeding records
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to schedule breeding. Please try again.";
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRabbits = useCallback(async (retryCount = 0): Promise<void> => {
    if (!user?.farm_id || isFetchingRabbits) {
      return;
    }
    setIsFetchingRabbits(true);
    try {
      const response = await axios.get(`${utils.apiUrl}/rabbits/${user.farm_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` },
      });
      const newRabbits = response.data.data || [];
      setRabbits(newRabbits);
      onRabbitsUpdate(newRabbits);
    } catch (err: any) {
      if (retryCount < 1) {
        const delay = 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        await fetchRabbits(retryCount + 1);
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch rabbits after retries.",
        });
      }
    } finally {
      setIsFetchingRabbits(false);
    }
  }, [user?.farm_id]);

  const fetchBreedingRecords = useCallback(async (): Promise<void> => {
    if (!user?.farm_id) {
      return;
    }
    setIsLoadingRecords(true);
    try {
      const response = await axios.get(`${utils.apiUrl}/breeds/${user.farm_id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("rabbit_farm_token")}` },
      });
      const records = response.data.data || [];
      setBreedingRecords(records);
    } catch (err: any) {
      setBreedingRecords([]);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch breeding records.",
      });
    } finally {
      setIsLoadingRecords(false);
    }
  }, [user?.farm_id]);

  useEffect(() => {
    if (user?.farm_id && !isFetchingRabbits && !isLoadingRecords) {
      Promise.all([fetchRabbits(), fetchBreedingRecords()]).catch((err) =>
        console.error("Error fetching initial data:", err)
      );
    }
  }, [user?.farm_id]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Available Does</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
              {availableDoes.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Ready for breeding</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Pregnant Does</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 bg-clip-text text-transparent">
              {pregnantDoes.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Currently expecting</p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-gray-100">Active Bucks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {availableBucks.length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Available for breeding</p>
          </CardContent>
        </Card>
      </div>

      {/* Breeding Planner */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-pink-50/80 to-red-50/80 dark:from-pink-900/30 dark:to-red-900/30 border-b border-gray-200 dark:border-gray-600">
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-pink-600 dark:text-pink-400" />
            <span className="text-gray-900 dark:text-gray-100">Breeding Planner</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            <div>
              <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Select Doe</label>
              <Select value={selectedDoe} onValueChange={setSelectedDoe}>
                <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Choose a doe" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {availableDoes.map((doe) => (
                    <SelectItem key={doe.id} value={doe.id || ''}>
                      {doe.name} ({doe.hutch_id || 'N/A'}) - {doe.breed} {!utils.isRabbitMature(doe).isMature ? '(Too Young)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block text-gray-900 dark:text-gray-100">Select Buck</label>
              <Select value={selectedBuck} onValueChange={setSelectedBuck}>
                <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600">
                  <SelectValue placeholder="Choose a buck" />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  {availableBucks.map((buck) => (
                    <SelectItem key={buck.id} value={buck.id || ''}>
                      {buck.name} ({buck.hutch_id || 'N/A'}) - {buck.breed} {!utils.isRabbitMature(buck).isMature ? '(Too Young)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedDoe && selectedBuck && (
            <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60">
              {(() => {
                const compatibility = getBreedingCompatibility(selectedDoe, selectedBuck);
                return (
                  <div className="flex items-center space-x-3">
                    {compatibility.compatible ? (
                      <Badge variant="default" className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                        Compatible
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="bg-gradient-to-r from-red-500 to-red-600">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Not Compatible
                      </Badge>
                    )}
                    <span className="text-sm text-gray-700 dark:text-gray-300">{compatibility.reason}</span>
                  </div>
                )
              })()}
            </div>
          )}

          <Button
            className="w-full bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white"
            disabled={!selectedDoe || !selectedBuck || isLoading}
            onClick={handleScheduleBreeding}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isLoading ? "Scheduling..." : "Schedule Breeding"}
          </Button>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {success && <div className="text-green-500 text-sm">{success}</div>}
        </CardContent>
      </Card>

      {/* Pregnant Does */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Pregnant Does - Expected Births</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {pregnantDoes.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No pregnant does at the moment.</p>
            ) : (
              pregnantDoes.map((doe) => (
                <div
                  key={doe.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-pink-50/80 to-pink-100/80 dark:from-pink-900/30 dark:to-pink-800/30"
                >
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{doe.name}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Hutch {doe.hutch_id || 'N/A'}  {/* • Mated with {doe.mated_with} */}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mating Date: {doe.pregnancy_start_date ? new Date(doe.pregnancy_start_date).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {doe.expected_birth_date ? new Date(doe.expected_birth_date).toLocaleDateString() : "TBD"}
                    </p>
                    <Badge
                      variant="outline"
                      className="bg-white/50 dark:bg-gray-800/50 border-pink-200 dark:border-pink-700 text-pink-800 dark:text-pink-300"
                    >
                      {doe.expected_birth_date
                        ? `${Math.ceil(
                          (new Date(doe.expected_birth_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        )} days`
                        : "TBD"}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Breeding History */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Recent Breeding History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingRecords ? (
            <p className="text-gray-600 dark:text-gray-400">Loading breeding records...</p>
          ) : breedingRecords.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No breeding records found.</p>
          ) : (
            <div className="space-y-3">
              {breedingRecords
                .sort((a, b) => new Date(b.mating_date).getTime() - new Date(a.mating_date).getTime())
                .slice(0, 5)
                .map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {record.doe_id} × {record.buck_id}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(record.mating_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge
                      variant={record.is_pregnant ? "default" : "outline"}
                      className={
                        record.is_pregnant
                          ? "bg-gradient-to-r from-green-500 to-green-600 text-white"
                          : "bg-white/50 dark:bg-green-800/50"
                      }
                    >
                      {record.is_pregnant ? "Pregnant" : "Completed"}
                    </Badge>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Building, Rabbit, Plus, Trash2, History, Eye, AlertTriangle, Expand } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import AddRabbitDialog from "@/components/add-rabbit-dialog";
import RemoveRabbitDialog from "@/components/remove-rabbit-dialog";
import type { Hutch, HutchLayoutProps, Rabbit as RabbitType, Row } from "@/types";
import * as utils from "@/lib/utils";
import axios from "axios";
import { useAuth } from "@/lib/auth-context";
import { useSnackbar } from "notistack";

export default function HutchLayout({ hutches, rabbits: initialRabbits, rows, onRabbitSelect, onRowAdded, handleAddRow, }: HutchLayoutProps) {
  const [selectedHutch, setSelectedHutch] = useState<string | null>(null);
  const [addRabbitOpen, setAddRabbitOpen] = useState(false);
  const [removeRabbitOpen, setRemoveRabbitOpen] = useState(false);
  const [addHutchOpen, setAddHutchOpen] = useState(false);
  const [removeHutchOpen, setRemoveHutchOpen] = useState(false);
  const [expandCapacityOpen, setExpandCapacityOpen] = useState(false);
  const [hutchToRemove, setHutchToRemove] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [removalHistory, setRemovalHistory] = useState<any[]>([]);
  const [rabbits, setRabbits] = useState<RabbitType[]>(initialRabbits);
  const [newHutchData, setNewHutchData] = useState({ row_name: "", row_id: "", level: "", position: "1" });
  const [expandRowData, setExpandRowData] = useState({ row_name: "", row_id: "", additionalCapacity: "" });
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();
  const [selectedHutchDetails, setSelectedHutchDetails] = useState<Hutch | null>(null);

  const getRabbitsInHutch = useCallback((hutch_name: string) => {
    return rabbits.filter((rabbit) => rabbit.hutch_name === hutch_name) ?? [];
  }, [rabbits]);


  const handleSetHutchDetails = (hutchId: string) => {
    const selectedHutch = hutches.find((item: Hutch) => item.id === hutchId) || null;
    setSelectedHutchDetails(selectedHutch);
  };

  const getHutch = useCallback((hutch_name: string) => {
    return hutches.find((hutch) => hutch.name === hutch_name) || null;
  }, [hutches]);

  const getRowHutches = useCallback((row_name: string) => {
    return hutches.filter((hutch) => hutch.row_name === row_name);
  }, [hutches]);

  const getRemovalHistory = useCallback(async (hutchId: string) => {
    try {
      const token = localStorage.getItem("rabbit_farm_token");
      const cachedUser = JSON.parse(localStorage.getItem("rabbit_farm_user") || "{}");
      const farmId = user?.farm_id ?? cachedUser?.farm_id;
      if (!farmId || !token) {
        enqueueSnackbar("Authentication required.", { variant: "error" });
        return [];
      }

      const response = await axios.get(`${utils.apiUrl}/hutches/${farmId}/${hutchId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const newRemovalRecords = response.data?.data || [];
      const filteredRecords = newRemovalRecords.filter((record: any) => record.hutch_id === hutchId && record.removed_at !== null);
      localStorage.setItem("rabbit_farm_rabbit_removals", JSON.stringify(filteredRecords));
      return filteredRecords;
    } catch (error) {
      enqueueSnackbar("Error fetching removal history. Please try again later.", { variant: "error" });
      return [];
    }
  }, [user]);

  useEffect(() => {
    const fetchRemovalHistory = async () => {
      if (selectedHutchDetails?.id) {
        const history = await getRemovalHistory(selectedHutchDetails.id);
        setRemovalHistory(history);
      }
    };
    fetchRemovalHistory();
  }, [selectedHutchDetails, getRemovalHistory]);

  const handleRemovalSuccess = useCallback(async (removedRabbitId: string) => {
    if (selectedHutchDetails?.id) {
      setRabbits((prev) => prev.filter((r) => r.rabbit_id !== removedRabbitId));
      const history = await getRemovalHistory(selectedHutchDetails.id);
      setRemovalHistory(history);
      setShowHistory(true);
    }
  }, [selectedHutchDetails, getRemovalHistory]);

  const handleHutchClick = (hutchId: string) => {
    setSelectedHutch(hutchId);
  };

  const handleAddRabbit = () => {
    setAddRabbitOpen(true);
  };

  const handleRemoveRabbit = () => {
    setRemoveRabbitOpen(true);
  };

  const handleAddHutch = (row_name: string) => {
    const row = rows.find((r) => r.name === row_name);
    if (!row) {
      enqueueSnackbar("Row not found.", { variant: "error" });
      return;
    }
    const rowHutches = getRowHutches(row_name);
    if (rowHutches.length >= row.capacity) {
      enqueueSnackbar(
        `Row ${row_name} is at full capacity (${row.capacity} hutches). Please expand the capacity first to add more hutches.`,
        { variant: "warning" }
      );
      return;
    }
    setNewHutchData({
      row_name,
      row_id: row.id ?? "",
      level: row.levels[0] || "A",
      position: "1"
    });
    setAddHutchOpen(true);
  };

  const handleExpandRowCapacity = async () => {
    try {
      const row = rows.find((r) => r.name === expandRowData.row_name);
      if (!row) throw new Error("Row not found");

      const additionalCapacity = parseInt(expandRowData.additionalCapacity);
      if (isNaN(additionalCapacity) || additionalCapacity <= 0) {
        enqueueSnackbar("Please enter a valid positive number for additional capacity.", { variant: "error" });
        return;
      }

      if (additionalCapacity > 20) {
        enqueueSnackbar("Maximum additional capacity is 20 hutches per expansion.", { variant: "error" });
        return;
      }

      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) throw new Error("Authentication token missing");
      const response = await axios.post(
        `${utils.apiUrl}/rows/expand`,
        {
          row_id: row.id ?? "",
          name: expandRowData.row_name,
          farm_id: user?.farm_id,
          additionalCapacity: additionalCapacity,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        enqueueSnackbar(
          `Row ${expandRowData.row_name} capacity expanded by ${additionalCapacity} hutches!`,
          { variant: "success" }
        );
        setExpandCapacityOpen(false);
        setExpandRowData({ row_name: "", row_id: "", additionalCapacity: "" });
        if (onRowAdded) onRowAdded();
      }
    } catch (error: any) {
      enqueueSnackbar(
        error.response?.data?.message || "Error expanding row capacity.",
        { variant: "error" }
      );
    }
  };

  const handleAddHutchSubmit = async () => {
    try {
      const row = rows.find((r) => r.name === newHutchData.row_name);
      if (!row) throw new Error("Row not found");
      const rowHutches = getRowHutches(newHutchData.row_name);
      if (rowHutches.length >= row.capacity) {
        enqueueSnackbar(`Cannot add more hutches to ${newHutchData.row_name}. Row capacity reached.`, { variant: "error" });
        return;
      }
      const hutchName = `${newHutchData.row_name}-${newHutchData.level}${newHutchData.position}`;
      const newHutch = {
        name: hutchName,
        farm_id: user?.farm_id || "",
        row_id: newHutchData.row_id,
        level: newHutchData.level,
        position: parseInt(newHutchData.position),
        size: "medium",
        material: "wire",
        features: ["water bottle", "feeder"],
        is_occupied: false,
        is_deleted: 0,
      };
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) throw new Error("Authentication token missing");
      await axios.post(`${utils.apiUrl}/hutches/${user?.farm_id}`, newHutch, {
        headers: { Authorization: `Bearer ${token}` },
      });
      enqueueSnackbar(`Hutch ${hutchName} added successfully!`, { variant: "success" });
      setAddHutchOpen(false);
      if (onRowAdded) onRowAdded();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Error adding hutch.", { variant: "error" });
    }
  };

  const handleRemoveHutchSubmit = async () => {
    try {
      const hutch = getHutch(hutchToRemove!);
      if (!hutch) throw new Error("Hutch not found");
      if (getRabbitsInHutch(hutch.name).length > 0) {
        enqueueSnackbar("Cannot remove hutch with rabbits. Please remove rabbits first.", { variant: "error" });
        return;
      }
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) throw new Error("Authentication token missing");
      await axios.delete(`${utils.apiUrl}/hutches/${user?.farm_id}/${hutch.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      enqueueSnackbar(`Hutch ${hutch.name} removed successfully!`, { variant: "success" });
      setRemoveHutchOpen(false);
      setHutchToRemove(null);
      setSelectedHutch(null);
      if (onRowAdded) onRowAdded();
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Error removing hutch.", { variant: "error" });
    }
  };

  const handleCloseDialogs = useCallback(() => {
    setAddRabbitOpen(false);
    setRemoveRabbitOpen(false);
    setAddHutchOpen(false);
    setRemoveHutchOpen(false);
    setExpandCapacityOpen(false);
    setHutchToRemove(null);
    setShowHistory(false);
    setExpandRowData({ row_name: "", row_id: "", additionalCapacity: "" });
    if (!addRabbitOpen && !removeRabbitOpen && !addHutchOpen && !removeHutchOpen && !expandCapacityOpen) {
      setSelectedHutch(null);
    }
  }, [addRabbitOpen, removeRabbitOpen, addHutchOpen, removeHutchOpen, expandCapacityOpen]);

  const handleRabbitAdded = useCallback(
    (newRabbit: RabbitType) => {
      setRabbits((prev) => [...prev, newRabbit]);
      enqueueSnackbar(`Rabbit ${newRabbit.rabbit_id} has been added successfully!`, { variant: "success" });
      setShowHistory(false);
      setAddRabbitOpen(false);
      if (onRowAdded) onRowAdded();
    },
    [enqueueSnackbar, onRowAdded]
  );

  return (
    <div className="space-y-4 md:space-y-6 lg:space-y-8 p-2 md:p-4 lg:p-6">
      <div className="flex flex-col space-y-3 md:flex-row md:justify-between md:items-center md:space-y-0 gap-2 md:gap-4">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 text-transparent bg-clip-text">
          Hutch Layout - Row Management
        </h2>
        <Badge
          variant="outline"
          className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-600/20 self-start md:self-auto text-xs md:text-sm"
        >
          {rows.length} Active Rows
        </Badge>
      </div>

      {/* Scrollable container for rows */}
      <div className="max-h-[60vh] md:max-h-[70vh] overflow-y-auto space-y-4 md:space-y-6 lg:space-y-8 pr-1 md:pr-2">
        {rows.length === 0 ? (
          <div className="text-center py-8 md:py-12 lg:py-16 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600 mx-2 md:mx-0">
            <Building className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto text-gray-400 dark:text-gray-500 mb-3 md:mb-4" />
            <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No rows added
            </h3>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-4 md:mb-6 px-4">
              Start building your farm by adding your first row!
            </p>
            <Button
              onClick={handleAddRow}
              className="w-full max-w-xs mx-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-500 text-white text-sm md:text-base"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Row
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {rows.map((row) => {
              const rowHutches = getRowHutches(row.name);
              const levels = row.levels || ["A", "B", "C"];
              const isAtCapacity = rowHutches.length >= row.capacity;

              return (
                <Card
                  key={row.name}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardHeader className="pb-3 md:pb-4 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/20 dark:to-blue-900/20 rounded-t-lg">
                    <CardTitle className="space-y-3 md:space-y-2">
                      <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          <Building className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                          <span className="text-base md:text-lg lg:text-xl text-gray-900 dark:text-gray-100 truncate">
                            {row.name} Row
                          </span>
                          {isAtCapacity && (
                            <Badge variant="outline" className="bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-300 text-xs flex-shrink-0">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Full
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between space-x-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs md:text-sm"
                        >
                          {
                            rowHutches.filter(
                              (h) => getRabbitsInHutch(h.id).length > 0
                            ).length
                          }
                          /{row.capacity} Occupied
                        </Badge>

                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddHutch(row.name)}
                            disabled={isAtCapacity}
                            className={`${isAtCapacity
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-500 hover:bg-green-600"
                              } text-white transition-colors text-xs md:text-sm`}
                          >
                            <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                            <span className="hidden sm:inline">Add Hutch</span>
                            <span className="sm:hidden">Add</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setExpandRowData({ row_name: row.name, row_id: row.id ?? "", additionalCapacity: "" });
                              setExpandCapacityOpen(true);
                            }}
                            className="bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs md:text-sm"
                          >
                            <Expand className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                            Expand
                          </Button>
                        </div>
                      </div>
                    </CardTitle>

                    <div className="flex flex-col space-y-1 md:flex-row md:items-center md:justify-between md:space-y-0">
                      <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 truncate">
                        {row.description || "No description provided."}
                      </p>
                      <div className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        Capacity: {rowHutches.length}/{row.capacity}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 md:space-y-4 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50 p-3 md:p-6">
                    {levels.map((level) => {
                      const levelHutches = rowHutches.filter(
                        (h) => h.level === level
                      );
                      return (
                        <div key={level} className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant="secondary"
                              className={`bg-gradient-to-r from-${level === "A" ? "red" : level === "B" ? "yellow" : "blue"
                                }-100 to-${level === "A" ? "red" : level === "B" ? "yellow" : "blue"
                                }-200 dark:from-${level === "A" ? "red" : level === "B" ? "yellow" : "blue"
                                }-900/40 dark:to-${level === "A" ? "red" : level === "B" ? "yellow" : "blue"
                                }-800/40 text-${level === "A" ? "red" : level === "B" ? "yellow" : "blue"
                                }-800 dark:text-${level === "A" ? "red" : level === "B" ? "yellow" : "blue"
                                }-300 border-${level === "A" ? "red" : level === "B" ? "yellow" : "blue"
                                }-200 dark:border-${level === "A" ? "red" : level === "B" ? "yellow" : "blue"
                                }-700 text-xs`}
                            >
                              Level {level}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-4 xl:grid-cols-6 gap-1 md:gap-2">
                            {levelHutches.map((hutch) => {
                              const rabbitsInHutch = getRabbitsInHutch(hutch.name);
                              const isOccupied = rabbitsInHutch.length > 0;
                              const does = rabbitsInHutch.filter((r) => r.gender === "female").length;
                              const bucks = rabbitsInHutch.filter((r) => r.gender === "male").length;
                              return (
                                <Card
                                  key={hutch.id}
                                  className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${selectedHutch === hutch.name
                                    ? "ring-2 ring-blue-500 dark:ring-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 border-blue-300 dark:border-blue-600"
                                    : isOccupied
                                      ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 border-green-200 dark:border-green-700"
                                      : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-700/60 border-gray-200 dark:border-gray-600"
                                    }`}
                                  onClick={() => {
                                    handleHutchClick(hutch.name);
                                    handleSetHutchDetails(hutch.id);
                                  }}
                                >
                                  <CardContent className="p-2 md:p-3 text-center">
                                    <div className="text-xs font-bold mb-1 text-gray-900 dark:text-gray-100">
                                      {hutch.level}{hutch.position}
                                    </div>
                                    {isOccupied ? (
                                      <>
                                        <Rabbit className="h-3 w-3 md:h-4 md:w-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                                        <div className="text-xs text-green-700 dark:text-green-300">
                                          {utils.formatRabbitCount(does, bucks)}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="h-3 w-3 md:h-4 md:w-4 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-full mb-1" />
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Empty
                                        </div>
                                      </>
                                    )}
                                    <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          setHutchToRemove(hutch.id);
                                          setRemoveHutchOpen(true);
                                        }}
                                        className="p-1 h-6 w-6 text-xs"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Hutch Details Modal and Dialogs remain the same */}
      {/* ... (keeping all modal/dialog code unchanged for brevity) ... */}

      {/* Add Hutch Dialog with updated preview */}
      {addHutchOpen && (
        <Dialog open={addHutchOpen} onOpenChange={setAddHutchOpen}>
          <DialogContent className="w-[95vw] max-w-md md:max-w-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-md mx-auto">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                <Plus className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
                <span className="truncate">Add New Hutch to {newHutchData.row_name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <Label htmlFor="level" className="text-sm md:text-base">Level</Label>
                  <Select
                    value={newHutchData.level}
                    onValueChange={(value) => setNewHutchData({ ...newHutchData, level: value })}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      {rows
                        .find((r) => r.name === newHutchData.row_name)
                        ?.levels.map((level: string) => (
                          <SelectItem key={level} value={level} className="text-sm md:text-base">
                            Level {level}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position" className="text-sm md:text-base">Position</Label>
                  <Select
                    value={newHutchData.position}
                    onValueChange={(value) => setNewHutchData({ ...newHutchData, position: value })}
                  >
                    <SelectTrigger className="text-sm md:text-base">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                        <SelectItem key={pos} value={pos.toString()} className="text-sm md:text-base">
                          Position {pos}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm md:text-base text-blue-800 dark:text-blue-300">
                  <strong>Hutch ID:</strong> {newHutchData.row_name}-{newHutchData.level}{newHutchData.position}
                </p>
                <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400 mt-1">
                  This hutch will be added to {newHutchData.row_name} row at level {newHutchData.level}, position {newHutchData.position}
                </p>
              </div>
              <div className="flex flex-col space-y-2 md:flex-row md:justify-end md:space-y-0 md:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setAddHutchOpen(false)}
                  className="bg-white/50 dark:bg-gray-700/50 text-sm md:text-base w-full md:w-auto"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddHutchSubmit} className="bg-green-500 hover:bg-green-600 text-white text-sm md:text-base w-full md:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Hutch
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Hutch Details Modal */}
      {selectedHutch && !removeHutchOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-4 z-50">
          <Card
            key={selectedHutch}
            className="w-full max-w-sm md:max-w-2xl lg:max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 shadow-2xl"
          >
            <CardHeader className="bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/30 dark:to-blue-900/30 border-b border-gray-200 dark:border-gray-600 p-4 md:p-6">
              <CardTitle className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0 gap-2 md:gap-4">
                <span className="text-base md:text-lg lg:text-xl text-gray-900 dark:text-gray-100 truncate">
                  Hutch Details - {selectedHutch}
                </span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-xs md:text-sm"
                  >
                    <History className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                    <span className="hidden sm:inline">{showHistory ? "Hide History" : "Show History"}</span>
                    <span className="sm:hidden">History</span>
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 md:space-y-6 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80 p-4 md:p-6">
              {(() => {
                const hutch = getHutch(selectedHutch);
                const rabbitsInHutch = getRabbitsInHutch(selectedHutch);

                return (
                  <>
                    {hutch ? (
                      <>
                        {/* Hutch Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 p-3 md:p-4 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-700">
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm md:text-base">Location</h4>
                            <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400">
                              {hutch.row_name} Row - Level {hutch.level}, Position {hutch.position}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm md:text-base">Specifications</h4>
                            <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400">
                              {hutch.size} size, {hutch.material} material
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-300 text-sm md:text-base">Features</h4>
                            <p className="text-xs md:text-sm text-blue-700 dark:text-blue-400">{hutch.features.join(", ")}</p>
                          </div>
                        </div>

                        {/* Current Rabbits */}
                        <div>
                          <div className="flex items-center justify-between mb-3 md:mb-4">
                            <h4 className="font-medium text-base md:text-lg text-gray-900 dark:text-gray-100">
                              Current Rabbits ({rabbitsInHutch.length})
                            </h4>
                            <Badge
                              variant={rabbitsInHutch.length > 0 ? "default" : "secondary"}
                              className={`${rabbitsInHutch.length > 0 ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : ""} text-xs md:text-sm`}
                            >
                              {rabbitsInHutch.length > 0 ? "Occupied" : "Empty"}
                            </Badge>
                          </div>

                          {rabbitsInHutch.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                              {rabbitsInHutch.map((rabbit) => (
                                <Card
                                  key={rabbit.id}
                                  className="bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700"
                                >
                                  <CardContent className="p-3 md:p-4">
                                    <div className="flex flex-col space-y-2 md:flex-row md:items-center md:justify-between md:space-y-0">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm md:text-base truncate">{rabbit.rabbit_id}</p>
                                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                                          {rabbit.breed} • {rabbit.gender === "female" ? "Doe" : "Buck"}
                                        </p>
                                        <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300">
                                          {rabbit.color} • {rabbit.weight}kg
                                        </p>
                                        {rabbit.is_pregnant && (
                                          <Badge
                                            variant="outline"
                                            className="mt-1 text-xs bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-800 dark:text-pink-300"
                                          >
                                            Pregnant
                                          </Badge>
                                        )}
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onRabbitSelect(rabbit)}
                                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-xs md:text-sm flex-shrink-0"
                                      >
                                        <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 md:py-8 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600">
                              <Rabbit className="h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                              <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">No rabbits in this hutch</p>
                            </div>
                          )}
                        </div>

                        {/* History Section */}
                        {showHistory && (
                          <div>
                            <h4 className="font-medium text-base md:text-lg mb-3 md:mb-4 text-gray-900 dark:text-gray-100">
                              Removal History ({removalHistory?.length})
                            </h4>
                            {removalHistory?.length > 0 ? (
                              <div className="space-y-2 md:space-y-3 max-h-48 md:max-h-60 overflow-y-auto">
                                {removalHistory?.map((record: any, index: number) => (
                                  <Card
                                    key={index}
                                    className="bg-gradient-to-br from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-700"
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex flex-col space-y-1 md:flex-row md:justify-between md:items-start md:space-y-0">
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-red-800 dark:text-red-300 text-sm md:text-base truncate">{record.rabbit_id}</p>
                                          <p className="text-xs md:text-sm text-red-600 dark:text-red-400">Reason: {record.removal_reason}</p>
                                          {record.removal_notes && (
                                            <p className="text-xs md:text-sm text-red-600 dark:text-red-400">Notes: {record.removal_notes}</p>
                                          )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                          <p className="text-xs text-red-500 dark:text-red-400">
                                            {new Date(record.removed_at).toLocaleDateString()}
                                          </p>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-3 md:py-4 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">No removal history for this hutch</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">Hutch not found.</p>
                    )}
                  </>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex flex-col space-y-2 md:flex-row md:justify-end md:space-y-0 md:space-x-3 pt-3 md:pt-4 border-t border-gray-200 dark:border-gray-600">
                {(() => {
                  const hutch = getHutch(selectedHutch);
                  const rabbitsInHutch = hutch ? getRabbitsInHutch(selectedHutch) : [];

                  return (
                    <>
                      {rabbitsInHutch.length < 2 && (
                        <Button
                          onClick={handleAddRabbit}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm md:text-base w-full md:w-auto"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Rabbit
                        </Button>
                      )}
                      {rabbitsInHutch.length > 0 && (
                        <Button
                          variant="destructive"
                          onClick={handleRemoveRabbit}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-sm md:text-base w-full md:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Rabbit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={handleCloseDialogs}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 text-sm md:text-base w-full md:w-auto"
                      >
                        Close
                      </Button>
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialogs */}
      {addRabbitOpen && selectedHutch && (
        <AddRabbitDialog
          hutch_name={selectedHutch}
          hutch_id={selectedHutchDetails?.id || ""}
          onClose={handleCloseDialogs}
          onRabbitAdded={handleRabbitAdded}
        />
      )}

      {removeRabbitOpen && selectedHutch && (
        <RemoveRabbitDialog
          hutch_name={selectedHutch}
          hutch_id={selectedHutchDetails?.id || ""}
          rabbit={rabbits.find((r) => r.hutch_name === selectedHutch)}
          onClose={handleCloseDialogs}
          onRemovalSuccess={handleRemovalSuccess}
        />
      )}

      {/* Expand Row Capacity Dialog */}
      {expandCapacityOpen && (
        <Dialog open={expandCapacityOpen} onOpenChange={setExpandCapacityOpen}>
          <DialogContent className="w-[95vw] max-w-md md:max-w-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-md mx-auto">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                <Expand className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                <span className="truncate">Expand Row Capacity - {expandRowData.row_name}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 md:space-y-6">
              {(() => {
                const currentRow = rows.find((r) => r.name === expandRowData.row_name);
                const currentHutches = getRowHutches(expandRowData.row_name);

                return (
                  <>
                    <div className="bg-amber-50 dark:bg-amber-900/20 p-3 md:p-4 rounded-lg border border-amber-200 dark:border-amber-800">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <span className="font-medium text-amber-800 dark:text-amber-300 text-sm md:text-base">Current Status</span>
                      </div>
                      <p className="text-xs md:text-sm text-amber-700 dark:text-amber-400">
                        Row <strong>{expandRowData.row_name}</strong> currently has <strong>{currentHutches.length}</strong> hutches
                        out of <strong>{currentRow?.capacity}</strong> maximum capacity.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="additionalCapacity" className="text-sm md:text-base font-medium">
                        Additional Capacity
                      </Label>
                      <Input
                        id="additionalCapacity"
                        type="number"
                        min="1"
                        max="20"
                        placeholder="Enter number of additional hutches (1-20)"
                        value={expandRowData.additionalCapacity}
                        onChange={(e) => setExpandRowData({
                          ...expandRowData,
                          additionalCapacity: e.target.value
                        })}
                        className="mt-2 text-sm md:text-base"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Recommended values: 3, 6, 9, 12 hutches
                      </p>
                    </div>

                    {expandRowData.additionalCapacity && !isNaN(parseInt(expandRowData.additionalCapacity)) && (
                      <div className="bg-green-50 dark:bg-green-900/20 p-3 md:p-4 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-800 dark:text-green-300 text-sm md:text-base">After Expansion</span>
                        </div>
                        <p className="text-xs md:text-sm text-green-700 dark:text-green-400">
                          New capacity will be <strong>{(currentRow?.capacity || 0) + parseInt(expandRowData.additionalCapacity)}</strong> hutches
                          <br />
                          Available space for <strong>{parseInt(expandRowData.additionalCapacity)}</strong> new hutches
                        </p>
                      </div>
                    )}

                    <div className="flex flex-col space-y-2 md:flex-row md:justify-end md:space-y-0 md:space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setExpandCapacityOpen(false);
                          setExpandRowData({ row_name: "", row_id: "", additionalCapacity: "" });
                        }}
                        className="bg-white/50 dark:bg-gray-700/50 text-sm md:text-base w-full md:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleExpandRowCapacity}
                        className="bg-blue-500 hover:bg-blue-600 text-white text-sm md:text-base w-full md:w-auto"
                        disabled={!expandRowData.additionalCapacity || isNaN(parseInt(expandRowData.additionalCapacity)) || parseInt(expandRowData.additionalCapacity) <= 0}
                      >
                        <Expand className="h-4 w-4 mr-2" />
                        Expand Capacity
                      </Button>
                    </div>
                  </>
                );
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {removeHutchOpen && hutchToRemove && (
        <Dialog open={removeHutchOpen} onOpenChange={setRemoveHutchOpen}>
          <DialogContent className="w-[95vw] max-w-md md:max-w-lg bg-white/95 dark:bg-gray-800/95 backdrop-blur-md mx-auto">
            <DialogHeader className="space-y-2">
              <DialogTitle className="flex items-center gap-2 text-base md:text-lg">
                <Trash2 className="h-4 w-4 md:h-5 md:w-5 text-red-600" />
                <span className="truncate">Remove Hutch {hutchToRemove}</span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-3 md:p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="font-medium text-red-800 dark:text-red-300 text-sm md:text-base">Warning</span>
                </div>
                <p className="text-xs md:text-sm text-red-700 dark:text-red-400">
                  Are you sure you want to remove hutch <strong>{hutchToRemove}</strong>?
                  This action cannot be undone and will permanently delete the hutch from your farm.
                </p>
              </div>
              <div className="flex flex-col space-y-2 md:flex-row md:justify-end md:space-y-0 md:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRemoveHutchOpen(false);
                    setHutchToRemove(null);
                  }}
                  className="bg-white/50 dark:bg-gray-700/50 text-sm md:text-base w-full md:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemoveHutchSubmit}
                  className="bg-red-500 hover:bg-red-600 text-sm md:text-base w-full md:w-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Hutch
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
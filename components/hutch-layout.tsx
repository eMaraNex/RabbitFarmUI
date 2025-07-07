"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Building, Rabbit, Plus, Trash2, History, Eye } from "lucide-react";
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
  const [hutchToRemove, setHutchToRemove] = useState<string | null>(null); // NEW STATE
  const [showHistory, setShowHistory] = useState(false);
  const [removalHistory, setRemovalHistory] = useState<any[]>([]);
  const [rabbits, setRabbits] = useState<RabbitType[]>(initialRabbits);
  const [newHutchData, setNewHutchData] = useState({ row_name: "", level: "", position: "1" });
  const { user } = useAuth();
  const { enqueueSnackbar } = useSnackbar();

  const getRabbitsInHutch = useCallback((hutch_id: string) => {
    return rabbits.filter((rabbit) => rabbit.hutch_id === hutch_id) ?? [];
  }, [rabbits]);

  const getHutch = useCallback((hutch_id: string) => {
    return hutches.find((hutch) => hutch.id === hutch_id) || null;
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
      if (selectedHutch) {
        const history = await getRemovalHistory(selectedHutch);
        setRemovalHistory(history);
      }
    };
    fetchRemovalHistory();
  }, [selectedHutch, getRemovalHistory]);

  const handleRemovalSuccess = useCallback(async (removedRabbitId: string) => {
    if (selectedHutch) {
      // Update rabbits state to remove the rabbit
      setRabbits((prev) => prev.filter((r) => r.rabbit_id !== removedRabbitId));

      // Fetch and update removal history
      const history = await getRemovalHistory(selectedHutch);
      setRemovalHistory(history);

      // Automatically show history after removal
      setShowHistory(true);
    }
  }, [selectedHutch, getRemovalHistory]);

  const handleHutchClick = (hutch_id: string) => {
    setSelectedHutch(hutch_id);
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
      enqueueSnackbar(`Cannot add more hutches to ${row_name}. Row capacity (${row.capacity}) reached. Please expand row capacity.`, {
        variant: "warning",
        action: (
          <Button
            size="sm"
            onClick={() => handleExpandRowCapacity(row_name)}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Expand Capacity
          </Button>
        ),
      });
      return;
    }
    setNewHutchData({ row_name, level: row.levels[0] || "A", position: "1" });
    setAddHutchOpen(true);
  };


  const handleExpandRowCapacity = async (row_name: string) => {
    try {
      const row = rows.find((r) => r.name === row_name);
      if (!row) throw new Error("Row not found");
      const additionalCapacity = prompt("Enter additional capacity (e.g., 3, 6, 9):");
      if (!additionalCapacity || isNaN(parseInt(additionalCapacity))) {
        enqueueSnackbar("Invalid capacity entered.", { variant: "error" });
        return;
      }
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) throw new Error("Authentication token missing");
      const response = await axios.post(
        `${utils.apiUrl}/rows/expand`,
        {
          name: row_name,
          farm_id: user?.farm_id,
          additionalCapacity: parseInt(additionalCapacity),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        enqueueSnackbar(`Row ${row_name} capacity expanded by ${additionalCapacity}!`, { variant: "success" });
        if (onRowAdded) onRowAdded();
      }
    } catch (error: any) {
      enqueueSnackbar(error.response?.data?.message || "Error expanding row capacity.", { variant: "error" });
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
      const hutchId = `${newHutchData.row_name}-${newHutchData.level}${newHutchData.position}`;
      const newHutch: Hutch = {
        id: hutchId,
        farm_id: user?.farm_id || "",
        row_name: newHutchData.row_name,
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
      await axios.post(`${utils.apiUrl}/hutches`, newHutch, {
        headers: { Authorization: `Bearer ${token}` },
      });
      enqueueSnackbar(`Hutch ${hutchId} added successfully!`, { variant: "success" });
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
      if (getRabbitsInHutch(hutchToRemove!).length > 0) {
        enqueueSnackbar("Cannot remove hutch with rabbits. Please remove rabbits first.", { variant: "error" });
        return;
      }
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) throw new Error("Authentication token missing");
      await axios.delete(`${utils.apiUrl}/hutches/${user?.farm_id}/${hutchToRemove}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      enqueueSnackbar(`Hutch ${hutchToRemove} removed successfully!`, { variant: "success" });
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
    setHutchToRemove(null); // RESET hutchToRemove
    setShowHistory(false);
    if (!addRabbitOpen && !removeRabbitOpen && !addHutchOpen && !removeHutchOpen) {
      setSelectedHutch(null);
    }
  }, [addRabbitOpen, removeRabbitOpen, addHutchOpen, removeHutchOpen]);

  const handleRabbitAdded = useCallback(
    (newRabbit: RabbitType) => {
      setRabbits((prev) => [...prev, newRabbit]);
      enqueueSnackbar(`Rabbit ${newRabbit.rabbit_id} has been added successfully!`, { variant: "success" });
      setShowHistory(false);
      setAddRabbitOpen(false);
    },
    [enqueueSnackbar]
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 text-transparent bg-clip-text">
          Hutch Layout - Row Management
        </h2>
        <Badge
          variant="outline"
          className="bg-white/50 dark:bg-gray-800/50 border-white/20 dark:border-gray-600/20 self-start sm:self-auto"
        >
          {rows.length} Active Rows
        </Badge>
      </div>

      {/* Scrollable container for rows */}
      <div className="max-h-[70vh] overflow-y-auto space-y-6 sm:space-y-8 pr-2">
        {rows.length === 0 ? (
          <div className="text-center py-16 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600">
            <Building className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No rows added
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Start building your farm by adding your first row!
            </p>
            <Button
              onClick={handleAddRow}
              className="w-full md:w-auto bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-500 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Row
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 sm:gap-8">
            {rows.map((row) => {
              const rowHutches = getRowHutches(row.name);
              const levels = row.levels || ["A", "B", "C"];
              return (
                <Card
                  key={row.name}
                  className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardHeader className="pb-4 bg-gradient-to-r from-green-50/50 to-blue-50/50 dark:from-green-900/20 dark:to-blue-900/20 rounded-t-lg">
                    <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">
                          {row.name} Row
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300 self-start sm:self-auto"
                        >
                          {
                            rowHutches.filter(
                              (h) => getRabbitsInHutch(h.id).length > 0
                            ).length
                          }
                          /{row.capacity} Occupied
                        </Badge>
                        <Button
                          size="sm"
                          onClick={() => handleAddHutch(row.name)}
                          className="bg-green-500 hover:bg-green-600 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Hutch
                        </Button>
                      </div>
                    </CardTitle>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                      {row.description || "No description provided."}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4 bg-gradient-to-br from-white/50 to-gray-50/50 dark:from-gray-800/50 dark:to-gray-900/50">
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
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 sm:gap-2">
                            {levelHutches.map((hutch) => {
                              const rabbitsInHutch = getRabbitsInHutch(hutch.id);
                              const isOccupied = rabbitsInHutch.length > 0;
                              const does = rabbitsInHutch.filter((r) => r.gender === "female").length;
                              const bucks = rabbitsInHutch.filter((r) => r.gender === "male").length;
                              return (
                                <Card
                                  key={hutch.id}
                                  className={`group cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${selectedHutch === hutch.id
                                    ? "ring-2 ring-blue-500 dark:ring-blue-400 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/40 dark:to-blue-800/40 border-blue-300 dark:border-blue-600"
                                    : isOccupied
                                      ? "bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/40 dark:to-green-800/40 border-green-200 dark:border-green-700"
                                      : "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/60 dark:to-gray-700/60 border-gray-200 dark:border-gray-600"
                                    }`}
                                  onClick={() => handleHutchClick(hutch.id)}
                                >
                                  <CardContent className="p-2 sm:p-3 text-center">
                                    <div className="text-xs font-bold mb-1 text-gray-900 dark:text-gray-100">
                                      {hutch.level}{hutch.position}
                                    </div>
                                    {isOccupied ? (
                                      <>
                                        <Rabbit className="h-3 w-3 sm:h-4 sm:w-4 mx-auto text-green-600 dark:text-green-400 mb-1" />
                                        <div className="text-xs text-green-700 dark:text-green-300">
                                          {utils.formatRabbitCount(does, bucks)}
                                        </div>
                                      </>
                                    ) : (
                                      <>
                                        <div className="h-3 w-3 sm:h-4 sm:w-4 mx-auto border-2 border-dashed border-gray-300 dark:border-gray-500 rounded-full mb-1" />
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                          Empty
                                        </div>
                                      </>
                                    )}
                                    <div className="mt-2 group-hover:block hidden">
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          e.preventDefault();
                                          setHutchToRemove(hutch.id);
                                          setRemoveHutchOpen(true);
                                        }}
                                        className="mt-0 text-xs"
                                      >
                                        <Trash2 className="h-8 w-8" />
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

      {/* Hutch Details Modal */}
      {selectedHutch && !removeHutchOpen && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <Card
            key={selectedHutch}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 shadow-2xl"
          >
            <CardHeader className="bg-gradient-to-r from-green-50/80 to-blue-50/80 dark:from-green-900/30 dark:to-blue-900/30 border-b border-gray-200 dark:border-gray-600">
              <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <span className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">Hutch Details - {selectedHutch}</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <History className="h-4 w-4 mr-2" />
                    {showHistory ? "Hide History" : "Show History"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 bg-gradient-to-br from-white/80 to-gray-50/80 dark:from-gray-800/80 dark:to-gray-900/80">
              {(() => {
                const hutch = getHutch(selectedHutch);
                const rabbitsInHutch = getRabbitsInHutch(selectedHutch);

                return (
                  <>
                    {hutch ? (
                      <>
                        {/* Hutch Information */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-900/30 dark:to-blue-800/30 rounded-lg border border-blue-200 dark:border-blue-700 mt-5">
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-300">Location</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              {hutch.row_name} Row - Level {hutch.level}, Position {hutch.position}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-300">Specifications</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-400">
                              {hutch.size} size, {hutch.material} material
                            </p>
                          </div>
                          <div>
                            <h4 className="font-medium text-blue-800 dark:text-blue-300">Features</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-400">{hutch.features.join(", ")}</p>
                          </div>
                        </div>

                        {/* Current Rabbits */}
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-lg text-gray-900 dark:text-gray-100">
                              Current Rabbits ({rabbitsInHutch.length})
                            </h4>
                            <Badge
                              variant={rabbitsInHutch.length > 0 ? "default" : "secondary"}
                              className={rabbitsInHutch.length > 0 ? "bg-gradient-to-r from-green-500 to-green-600 text-white" : ""}
                            >
                              {rabbitsInHutch.length > 0 ? "Occupied" : "Empty"}
                            </Badge>
                          </div>

                          {rabbitsInHutch.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
                              {rabbitsInHutch.map((rabbit) => (
                                <Card
                                  key={rabbit.id}
                                  className="bg-gradient-to-br from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700"
                                >
                                  <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <p className="font-medium text-gray-900 dark:text-gray-100">{rabbit.rabbit_id}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
                                          {rabbit.breed} • {rabbit.gender === "female" ? "Doe" : "Buck"}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300">
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
                                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                      >
                                        <Eye className="h-4 w-4 mr-1" />
                                        View
                                      </Button>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600">
                              <Rabbit className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
                              <p className="text-gray-500 dark:text-gray-400">No rabbits in this hutch</p>
                            </div>
                          )}
                        </div>

                        {/* History Section */}
                        {showHistory && (
                          <div>
                            <h4 className="font-medium text-lg mb-4 text-gray-900 dark:text-gray-100">
                              Removal History ({removalHistory?.length})
                            </h4>
                            {removalHistory?.length > 0 ? (
                              <div className="space-y-3 max-h-60 overflow-y-auto">
                                {removalHistory?.map((record: any, index: number) => (
                                  <Card
                                    key={index}
                                    className="bg-gradient-to-br from-red-50/80 to-red-100/80 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-700"
                                  >
                                    <CardContent className="p-3">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium text-red-800 dark:text-red-300">{record.rabbit_id}</p>
                                          <p className="text-sm text-red-600 dark:text-red-400">Reason: {record.removal_reason}</p>
                                          {record.removal_notes && (
                                            <p className="text-sm text-red-600 dark:text-red-400">Notes: {record.removal_notes}</p>
                                          )}
                                        </div>
                                        <div className="text-right">
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
                              <div className="text-center py-4 bg-gradient-to-br from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600">
                                <p className="text-gray-500 dark:text-gray-400">No removal history for this hutch</p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">Hutch not found.</p>
                    )}
                  </>
                );
              })()}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                {(() => {
                  const hutch = getHutch(selectedHutch);
                  const rabbitsInHutch = hutch ? getRabbitsInHutch(selectedHutch) : [];

                  return (
                    <>
                      {rabbitsInHutch.length < 2 && (
                        <Button
                          onClick={handleAddRabbit}
                          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Rabbit
                        </Button>
                      )}
                      {rabbitsInHutch.length > 0 && (
                        <Button
                          variant="destructive"
                          onClick={handleRemoveRabbit}
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove Rabbit
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={handleCloseDialogs}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600"
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
          hutch_id={selectedHutch}
          onClose={handleCloseDialogs}
          onRabbitAdded={handleRabbitAdded}
        />
      )}

      {removeRabbitOpen && selectedHutch && (
        <RemoveRabbitDialog
          hutch_id={selectedHutch}
          rabbit={rabbits.find((r) => r.hutch_id === selectedHutch)}
          onClose={handleCloseDialogs}
          onRemovalSuccess={handleRemovalSuccess}
        />
      )}

      {addHutchOpen && (
        <Dialog open={addHutchOpen} onOpenChange={setAddHutchOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>Add New Hutch to {newHutchData.row_name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="level">Level</Label>
                <Select
                  value={newHutchData.level}
                  onValueChange={(value) => setNewHutchData({ ...newHutchData, level: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    {rows
                      .find((r) => r.name === newHutchData.row_name)
                      ?.levels.map((level: string) => (
                        <SelectItem key={level} value={level}>
                          Level {level}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="position">Position</Label>
                <Select
                  value={newHutchData.position}
                  onValueChange={(value) => setNewHutchData({ ...newHutchData, position: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((pos) => (
                      <SelectItem key={pos} value={pos.toString()}>
                        Position {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setAddHutchOpen(false)}
                  className="bg-white/50 dark:bg-gray-700/50"
                >
                  Cancel
                </Button>
                <Button onClick={handleAddHutchSubmit} className="bg-green-500 hover:bg-green-600 text-white">
                  Add Hutch
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {removeHutchOpen && hutchToRemove && (
        <Dialog open={removeHutchOpen} onOpenChange={setRemoveHutchOpen}>
          <DialogContent className="sm:max-w-[500px] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md">
            <DialogHeader>
              <DialogTitle>Remove Hutch {hutchToRemove}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>Are you sure you want to remove this hutch? This action cannot be undone.</p>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRemoveHutchOpen(false);
                    setHutchToRemove(null);
                  }}
                  className="bg-white/50 dark:bg-gray-700/50"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleRemoveHutchSubmit}
                  className="bg-red-500 hover:bg-red-600"
                >
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
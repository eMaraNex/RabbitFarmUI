"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Pencil,
    Trash2,
    Plus,
    Rabbit,
    ChevronUp,
    ChevronDown,
    Search,
    Filter,
    Heart,
    Baby,
    Calendar,
    TrendingUp,
} from "lucide-react";
import type { Rabbit as RabbitType } from "@/lib/types";
import EditRabbitDialog from "@/components/edit-rabbit-dialog";
import AddKitDialog from "@/components/add-kit-dialog";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import * as utils from "@/lib/utils";

interface RabbitListProps {
    farmId: string;
}

const RabbitList: React.FC<RabbitListProps> = ({ farmId }) => {
    const [rabbits, setRabbits] = useState<RabbitType[]>([]);
    const [selectedRabbits, setSelectedRabbits] = useState<string[]>([]);
    const [editingRabbit, setEditingRabbit] = useState<RabbitType | null>(null);
    const [addKitRabbit, setAddKitRabbit] = useState<RabbitType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [sortField, setSortField] = useState<string>("created_at");
    const [sortOrder, setSortOrder] = useState<string>("desc");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const { toast } = useToast();
    const itemsPerPage = 10;

    useEffect(() => {
        const fetchRabbits = async () => {
            setLoading(true);
            setError(null);
            try {
                // Only access localStorage on the client
                let token: string | null = null;
                if (typeof window !== "undefined") {
                    token = localStorage.getItem("rabbit_farm_token");
                }
                if (!token) throw new Error("No authentication token found");

                const response = await axios.post(
                    `${utils.apiUrl}/rabbits/${farmId}/details`,
                    {
                        page,
                        limit: itemsPerPage,
                        sortField,
                        sortOrder,
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const { data, total } = response.data;
                setRabbits(data || []);
                setTotalPages(Math.ceil(total / itemsPerPage));
            } catch (err) {
                console.error("Error fetching rabbits:", err);
                setError("Failed to load rabbit data.");
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to load rabbit data.",
                });
            } finally {
                setLoading(false);
            }
        };

        if (farmId) {
            fetchRabbits()
        }
    }, [farmId, page, sortField, sortOrder]);

    const handleCheckboxChange = (rabbitId: string) => {
        setSelectedRabbits((prev) => (prev.includes(rabbitId) ? prev.filter((id) => id !== rabbitId) : [...prev, rabbitId]))
    }

    const handleEdit = (rabbit: RabbitType) => {
        setEditingRabbit(rabbit);
    };

    const handleAddKit = (rabbit: RabbitType) => {
        setAddKitRabbit(rabbit);
    };

    const handleDelete = (rabbitId: string) => {
        console.log(`Delete rabbit ${rabbitId} (not implemented)`);
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortOrder("asc");
        }
        setPage(1);
    };

    const getSortIcon = (field: string) => {
        if (sortField !== field) return null;
        return sortOrder === "asc" ? (
            <ChevronUp className="h-4 w-4 text-blue-500" />
        ) : (
            <ChevronDown className="h-4 w-4 text-blue-500" />
        );
    };

    const filteredRabbits = rabbits.filter(
        (rabbit) =>
            rabbit.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rabbit.breed?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rabbit.rabbit_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalKits = rabbits.reduce(
        (sum, rabbit) =>
            sum + (rabbit?.birth_history?.reduce((kitSum: any, history: any) => kitSum + (history.number_of_kits || 0), 0) || 0),
        0
    );

    const pregnantCount = rabbits.filter((rabbit) => rabbit.is_pregnant).length;

    if (loading) {
        return (
            <div className="min-h-[600px] flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-4"
                >
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                        <Rabbit className="h-8 w-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Loading Your Colony</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Gathering rabbit data...</p>
                    </div>
                </motion.div>
            </div>
        );
    }

    if (error) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="min-h-[400px] flex items-center justify-center"
            >
                <div className="text-center space-y-4 p-8 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center mx-auto">
                        <Rabbit className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">Oops! Something went wrong</h3>
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-300"
                    >
                        Try Again
                    </Button>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="space-y-6"
        >
            {/* Header Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
                                <Rabbit className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Rabbit Colony</h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Manage your rabbit farm efficiently</p>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="flex gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                                    Total
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{rabbits.length}</p>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4 min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
                                    Pregnant
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{pregnantCount}</p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-4 min-w-[120px]">
                            <div className="flex items-center gap-2 mb-1">
                                <Baby className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                                    Total Kits
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{totalKits}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search rabbits by name, breed, or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-gray-50 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-blue-500 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {selectedRabbits.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
                            >
                                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                    {selectedRabbits.length} selected
                                </span>
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800">
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </motion.div>
                        )}

                        <Button variant="outline" size="sm" className="rounded-xl border-gray-200 dark:border-gray-700">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>

                        <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Rabbit
                        </Button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
                                <th className="text-left p-4 w-12">
                                    <Checkbox
                                        checked={selectedRabbits.length === filteredRabbits.length && filteredRabbits.length > 0}
                                        onCheckedChange={(checked) =>
                                            setSelectedRabbits(checked ? filteredRabbits?.map((r: any) => r.rabbit_id) : [])
                                        }
                                        className="rounded-md"
                                    />
                                </th>
                                <th
                                    className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => handleSort("name")}
                                >
                                    <div className="flex items-center gap-2">
                                        Name
                                        {getSortIcon("name")}
                                    </div>
                                </th>
                                <th
                                    className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => handleSort("gender")}
                                >
                                    <div className="flex items-center gap-2">
                                        Gender
                                        {getSortIcon("gender")}
                                    </div>
                                </th>
                                <th
                                    className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    onClick={() => handleSort("breed")}
                                >
                                    <div className="flex items-center gap-2">
                                        Breed
                                        {getSortIcon("breed")}
                                    </div>
                                </th>
                                <th className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Baby className="h-4 w-4" />
                                        Total Kits
                                    </div>
                                </th>
                                <th className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4" />
                                        Litters
                                    </div>
                                </th>
                                <th className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100">Status</th>
                                <th className="text-right p-4 font-semibold text-gray-900 dark:text-gray-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <AnimatePresence>
                                {filteredRabbits.map((rabbit, index) => (
                                    <motion.tr
                                        key={rabbit.rabbit_id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        transition={{ duration: 0.3, delay: index * 0.05 }}
                                        className="border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors group"
                                    >
                                        <td className="p-4">
                                            <Checkbox
                                                checked={selectedRabbits.includes(rabbit.rabbit_id ?? '')}
                                                onCheckedChange={() => handleCheckboxChange(rabbit.rabbit_id ?? '')}
                                                className="rounded-md"
                                            />
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                                                    <Rabbit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{rabbit.name || "Unnamed"}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        ID: {(rabbit?.rabbit_id ?? '').slice(0, 8) ?? ''}...
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <Badge
                                                variant="secondary"
                                                className={`capitalize ${rabbit.gender === "male"
                                                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                    : "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
                                                    }`}
                                            >
                                                {rabbit.gender}
                                            </Badge>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-gray-700 dark:text-gray-300 font-medium">{rabbit.breed}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {rabbit?.birth_history?.reduce((sum: any, history: any) => sum + (history.number_of_kits || 0), 0) || 0}
                                                </span>
                                                <Baby className="h-4 w-4 text-gray-400" />
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                {rabbit?.birth_history?.length || 0}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {rabbit.is_pregnant && (
                                                <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                                                    <Heart className="h-3 w-3 mr-1" />
                                                    Pregnant
                                                </Badge>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(rabbit)}
                                                    className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleAddKit(rabbit)}
                                                    className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(rabbit.rabbit_id ?? '')}
                                                    className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>

                {filteredRabbits.length === 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Rabbit className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {searchTerm ? "No rabbits found" : "No rabbits yet"}
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {searchTerm
                                ? `No rabbits match "${searchTerm}". Try adjusting your search.`
                                : "Start building your colony by adding your first rabbit!"}
                        </p>
                        {!searchTerm && (
                            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Your First Rabbit
                            </Button>
                        )}
                    </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing page <span className="font-semibold text-gray-700 dark:text-gray-300">{page}</span> of{" "}
                            <span className="font-semibold text-gray-700 dark:text-gray-300">{totalPages}</span>({rabbits.length}{" "}
                            rabbits total)
                        </div>
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                disabled={page === 1}
                                className="rounded-xl px-4"
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 7) {
                                        pageNum = i + 1;
                                    } else {
                                        if (page <= 4) {
                                            pageNum = i + 1;
                                        } else if (page >= totalPages - 3) {
                                            pageNum = totalPages - 6 + i;
                                        } else {
                                            pageNum = page - 3 + i;
                                        }
                                    }

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={page === pageNum ? "default" : "ghost"}
                                            size="sm"
                                            onClick={() => setPage(pageNum)}
                                            className={`w-10 h-10 p-0 rounded-xl ${page === pageNum
                                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg"
                                                : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                                }`}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={page === totalPages}
                                className="rounded-xl px-4"
                            >
                                Next
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            {editingRabbit && (
                <EditRabbitDialog
                    rabbit={editingRabbit}
                    onClose={() => setEditingRabbit(null)}
                    onUpdate={() => {
                        setEditingRabbit(null);
                        const fetchRabbits = async () => {
                            try {
                                let token: string | null = null;
                                if (typeof window !== "undefined") {
                                    token = localStorage.getItem("rabbit_farm_token");
                                }
                                const response = await axios.post(
                                    `${utils.apiUrl}/rabbits/${farmId}/details`,
                                    { page, limit: itemsPerPage, sortField, sortOrder },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                                const { data, total } = response.data;
                                setRabbits(data);
                                setTotalPages(Math.ceil(total / itemsPerPage));
                            } catch (err) {
                                console.error("Error re-fetching rabbits:", err);
                            }
                        };
                        fetchRabbits();
                    }}
                />
            )}
            {addKitRabbit && (
                <AddKitDialog
                    rabbit={addKitRabbit}
                    doeId={addKitRabbit.rabbit_id ?? ""}
                    buckId=""
                    doeName={addKitRabbit.name}
                    onClose={() => setAddKitRabbit(null)}
                    onKitAdded={() => {
                        setAddKitRabbit(null);
                        const fetchRabbits = async () => {
                            try {
                                let token: string | null = null;
                                if (typeof window !== "undefined") {
                                    token = localStorage.getItem("rabbit_farm_token");
                                }
                                const response = await axios.post(
                                    `${utils.apiUrl}/rabbits/${farmId}/details`,
                                    { page, limit: itemsPerPage, sortField, sortOrder },
                                    { headers: { Authorization: `Bearer ${token}` } }
                                );
                                const { data, total } = response.data;
                                setRabbits(data);
                                setTotalPages(Math.ceil(total / itemsPerPage));
                            } catch (err) {
                                console.error("Error re-fetching rabbits:", err);
                            }
                        };
                        fetchRabbits();
                    }}
                />
            )}
        </motion.div>
    );
};

export default RabbitList;
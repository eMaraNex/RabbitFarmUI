"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Trash2,
  Plus,
  Rabbit,
  Search,
  Filter,
  Heart,
  Baby,
  Calendar,
  TrendingUp,
} from "lucide-react";
import type { RabbitListProps, Rabbit as RabbitType } from "@/types";
import EditRabbitDialog from "@/components/edit-rabbit-dialog";
import AddKitDialog from "@/components/add-kit-dialog";
import { motion } from "framer-motion";
import axios from "axios";
import { useToast } from '@/lib/toast-provider';
import * as utils from "@/lib/utils";
import RabbitListSkeleton from "./skeletons/rabbits-list/skeleton";
import AddRabbitDialog from "@/components/add-rabbit-dialog";
import Table from "./shared/table";
import Pagination from "./shared/pagination";
import { useAuth } from "@/lib/auth-context";

const RabbitList: React.FC<RabbitListProps> = ({ farmId }) => {
  const { user } = useAuth();
  const [rabbits, setRabbits] = useState<RabbitType[]>([]);
  const [selectedRabbits, setSelectedRabbits] = useState<string[]>([]);
  const [editingRabbit, setEditingRabbit] = useState<RabbitType | null>(null);
  const [addKitRabbit, setAddKitRabbit] = useState<RabbitType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [sortField, setSortField] = useState<string>("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [addRabbitOpen, setAddRabbitOpen] = useState<boolean>(false);
  const isMounted = useRef(true);
  const { showSuccess, showError } = useToast();
  const handleAddRabbit = () => {
    setAddRabbitOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchRabbits = useCallback(async () => {
    if (!user?.farm_id) return;

    setLoading(true);
    setError(null);
    try {
      let token: string | null = null;
      if (typeof window !== "undefined") {
        token = localStorage.getItem("rabbit_farm_token");
      }
      if (!token) throw new Error("No authentication token found");


      const response = await axios.post(
        `${utils.apiUrl}/rabbits/${user?.farm_id}/details`,
        {
          page: Number(page),
          limit: Number(pageSize),
          sortField,
          sortOrder,
          searchTerm: debouncedSearchTerm?.trim() || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { data, pagination } = response.data.data;
      setRabbits(data);
      setTotalItems(Number(pagination?.totalItems || 0));
      // showSuccess('Success', "Loaded rabbit data successfully.");
    } catch (err) {
      console.error("Error fetching rabbits:", err);
      setError("Failed to load rabbit data.");
      showError("Error", "Failed to load rabbit data.");
    } finally {
      setLoading(false);
    }
  }, [farmId, page, pageSize, sortField, sortOrder, debouncedSearchTerm]);

  useEffect(() => {
    fetchRabbits();
  }, [fetchRabbits]);

  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) return;
    if (page !== 1) {
      setPage(1);
    }
  }, [debouncedSearchTerm]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(Number(newPage));
  }, []);

  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(Number(newPageSize));
    setPage(1);
  }, []);

  const handleEdit = useCallback((rabbit: RabbitType) => {
    setEditingRabbit(rabbit);
  }, []);

  const handleAddKit = useCallback((rabbit: RabbitType) => {
    if (!rabbit.is_pregnant) {
      showError('Error', "Cannot add kit records because the rabbit is not pregnant.")
      return;
    }
    setAddKitRabbit(rabbit);
  }, []);

  const handleDelete = useCallback((rabbitId: string) => {
    console.log(`Delete rabbit ${rabbitId} (not implemented)`);
  }, []);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setPage(1);
  }, [sortField, sortOrder]);

  const refetchRabbits = useCallback(async () => {
    await fetchRabbits();
  }, [fetchRabbits]);
  const totalKits = (rabbits || []).reduce(
    (sum: any, rabbit: any) =>
      sum +
      (rabbit?.birth_history?.reduce(
        (kitSum: any, history: any) => kitSum + (Number(history.number_of_kits) || 0),
        0
      ) || 0),
    0
  );

  const pregnantCount = (rabbits || []).filter((rabbit: any) => rabbit.is_pregnant).length;

  // Table configuration
  const tableColumns = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (value: string, row: RabbitType) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
            <Rabbit className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {value || "Unnamed"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              ID: {(row?.rabbit_id ?? "").slice(0, 8)}...
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "gender",
      label: "Gender",
      sortable: true,
      render: (value: string) => (
        <Badge
          variant="secondary"
          className={`capitalize ${value === "male"
            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
            : "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300"
            }`}
        >
          {value}
        </Badge>
      ),
    },
    {
      key: "breed",
      label: "Breed",
      sortable: true,
      render: (value: string) => (
        <span className="text-gray-700 dark:text-gray-300 font-medium">
          {value}
        </span>
      ),
    },
    {
      key: "total_kits",
      label: "Total Kits",
      render: (value: any, row: RabbitType) => (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {row?.birth_history?.reduce(
              (sum: any, history: any) => sum + (Number(history.number_of_kits) || 0),
              0
            ) || 0}
          </span>
          <Baby className="h-4 w-4 text-gray-400" />
        </div>
      ),
    },
    {
      key: "litters",
      label: "Litters",
      render: (value: any, row: RabbitType) => (
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
            {row?.birth_history?.length || 0}
          </span>
          <Calendar className="h-4 w-4 text-gray-400" />
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value: any, row: RabbitType) => (
        row.is_pregnant ? (
          <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
            <Heart className="h-3 w-3 mr-1" />
            Pregnant
          </Badge>
        ) : null
      ),
    },
  ];

  const tableActions = [
    {
      label: "Edit",
      icon: Pencil,
      onClick: handleEdit,
      className: "hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    },
    {
      label: "Add Kit",
      icon: Plus,
      onClick: handleAddKit,
      className: "hover:bg-green-100 dark:hover:bg-green-900/30 text-green-600 dark:text-green-400",
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (row: RabbitType) => handleDelete(row.rabbit_id ?? ""),
      className: "hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400",
    },
  ];

  const emptyState = {
    title: debouncedSearchTerm ? "No rabbits found" : "No rabbits yet",
    description: debouncedSearchTerm
      ? `No rabbits match "${debouncedSearchTerm}". Try adjusting your search.`
      : "Start building your colony by adding your first rabbit!",
    action: !debouncedSearchTerm ? {
      label: "Add Your First Rabbit",
      onClick: handleAddRabbit,
    } : undefined,
  };

  if (loading) {
    return <RabbitListSkeleton farmId={farmId} />;
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
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Oops! Something went wrong
            </h3>
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
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Rabbit Colony
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage your rabbit farm efficiently
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex flex-row gap-2">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-2xl p-4 w-[100px] sm:w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300 uppercase tracking-wide">
                  Total
                </span>
              </div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {totalItems}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-2xl p-4 w-[100px] sm:w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300 uppercase tracking-wide">
                  Pregnant
                </span>
              </div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {pregnantCount}
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-2xl p-4 w-[100px] sm:w-[120px]">
              <div className="flex items-center gap-2 mb-1">
                <Baby className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300 uppercase tracking-wide">
                  Total Kits
                </span>
              </div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {totalKits}
              </p>
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
                className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl"
              >
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {selectedRabbits.length} selected
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-5 w-5 p-0 text-blue-600 hover:text-blue-800"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </motion.div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-gray-200 dark:border-gray-700"
            >
              <Filter className="h-3 w-3 mr-1" />
              Filter
            </Button>

            <Button
              onClick={handleAddRabbit}
              className="rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-2 py-1 text-xs shadow-lg flex-1 max-w-[110px]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rabbit
            </Button>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <Table
        data={rabbits || []}
        columns={tableColumns}
        actions={tableActions}
        loading={loading}
        selectable={true}
        selectedItems={selectedRabbits}
        onSelectionChange={setSelectedRabbits}
        idField="rabbit_id"
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        emptyState={emptyState}
        className="rounded-3xl"
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[5, 10, 15, 20, 30, 50]}
        showPageSizeSelector={true}
        showItemsInfo={true}
        currentPageItems={rabbits?.length || 0}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800"
      />

      {/* Dialogs */}
      {editingRabbit && (
        <EditRabbitDialog
          rabbit={editingRabbit}
          onClose={() => setEditingRabbit(null)}
          onUpdate={() => {
            setEditingRabbit(null);
            refetchRabbits();
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
            refetchRabbits();
          }}
        />
      )}
      {addRabbitOpen && (
        <AddRabbitDialog
          customHutches={true}
          hutch_id={""}
          onClose={() => setAddRabbitOpen(false)}
          onRabbitAdded={(newRabbit) => {
            setAddRabbitOpen(false);
            refetchRabbits();
            showSuccess('Sucess', `Rabbit ${newRabbit.rabbit_id} added successfully!`);
          }}
        />
      )}
    </motion.div>
  );
};

export default RabbitList;

"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, TrendingUp, Calendar, Filter, Download } from "lucide-react";
import { useCurrency } from "@/lib/currency-context";
import { useAuth } from "@/lib/auth-context";
import axios from "axios";
import * as utils from "@/lib/utils";
import type { EarningsRecord, ProductionRecord } from "@/types";
import { useToast } from "@/lib/toast-provider";

export default function EarningsTracker() {
  const { currency, formatAmount, convertToBaseCurrency, getCurrencySymbol } = useCurrency();
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [production, setProduction] = useState<ProductionRecord[]>([]);
  const [filteredEarnings, setFilteredEarnings] = useState<EarningsRecord[]>([]);
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [addEarningsOpen, setAddEarningsOpen] = useState(false);
  const [addProductionOpen, setAddProductionOpen] = useState(false);
  const { showSuccess, showError, showWarn } = useToast();

  const [earningsForm, setEarningsForm] = useState<{
    type: "rabbit_sale" | "urine_sale" | "manure_sale" | "other";
    rabbit_id?: string;
    hutch_id?: string;
    amount: string;
    date: string;
    weight?: string;
    sale_type?: "whole" | "meat_only" | "skin_only" | "meat_and_skin";
    includes_urine?: boolean;
    includes_manure?: boolean;
    buyer_name?: string;
    notes: string;
  }>({
    type: "other",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const [productionForm, setProductionForm] = useState({
    type: "urine" as const,
    quantity: "",
    unit: "liters",
    date: new Date().toISOString().split("T")[0],
    source: "",
    notes: "",
    sellImmediately: false,
    salePrice: "",
    buyerName: "",
  });

  useEffect(() => {
    if (user?.farm_id) {
      loadEarnings();
      loadProduction();
    }
  }, [user?.farm_id]);

  useEffect(() => {
    filterEarnings();
  }, [earnings, dateFilter, customDateRange]);

  const loadEarnings = async () => {
    try {
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) {
        showError('Error', "No authentication token found")
      }

      const response = await axios.get(`${utils.apiUrl}/earnings/${user?.farm_id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setEarnings(response.data.data || []);
    } catch (error) {
      showError('Error', error?.toString())
      setEarnings([]);
    }
  };

  const loadProduction = () => {
    const productionData = JSON.parse(localStorage.getItem(`rabbit_farm_production_${user?.farm_id}`) || "[]");
    setProduction(productionData);
  };

  const saveProductionToStorage = (data: ProductionRecord[]) => {
    localStorage.setItem(`rabbit_farm_production_${user?.farm_id}`, JSON.stringify(data));
  };

  const filterEarnings = () => {
    let filtered = [...earnings];
    const now = new Date();

    switch (dateFilter) {
      case "today":
        filtered = earnings.filter((e) => {
          const earningDate = new Date(e.date);
          return earningDate.toDateString() === now.toDateString();
        });
        break;
      case "week":
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = earnings.filter((e) => new Date(e.date) >= weekAgo);
        break;
      case "month":
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        filtered = earnings.filter((e) => new Date(e.date) >= monthAgo);
        break;
      case "year":
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        filtered = earnings.filter((e) => new Date(e.date) >= yearAgo);
        break;
      case "custom":
        if (customDateRange.start && customDateRange.end) {
          filtered = earnings.filter((e) => {
            const earningDate = new Date(e.date);
            return earningDate >= new Date(customDateRange.start) && earningDate <= new Date(customDateRange.end);
          });
        }
        break;
    }

    setFilteredEarnings(filtered);
  };

  const handleAddEarnings = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.farm_id) {
      showWarn('Error', "Missing farm ID. Please try again.");
      return;
    }

    try {
      const token = localStorage.getItem("rabbit_farm_token");
      if (!token) {
        showError('Error', "No authentication token found")
      }

      const newEarning: EarningsRecord = {
        type: earningsForm.type,
        rabbit_id: earningsForm.rabbit_id,
        hutch_id: earningsForm.hutch_id,
        weight: earningsForm.weight ? Number.parseFloat(earningsForm.weight) : 0,
        sale_type: earningsForm.sale_type,
        includes_urine: earningsForm.includes_urine,
        includes_manure: earningsForm.includes_manure,
        buyer_name: earningsForm.buyer_name,
        amount: Number.parseFloat(earningsForm.amount),
        currency: currency,
        date: earningsForm.date,
        notes: earningsForm.notes || '',
        farm_id: user.farm_id,
      };

      await axios.post(`${utils.apiUrl}/earnings/${user.farm_id}`, newEarning, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedEarnings = [...earnings, newEarning];
      setEarnings(updatedEarnings);
      setEarningsForm({
        type: "other",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        notes: "",
      });
      setAddEarningsOpen(false);
    } catch (error: any) {
      showError('Error', error.response?.data?.message);
    }
  };

  const handleAddProduction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.farm_id) {
      showWarn('Error', "Missing farm ID. Please try again.");
      return;
    }

    const newProduction: ProductionRecord = {
      type: productionForm.type,
      quantity: Number.parseFloat(productionForm.quantity),
      unit: productionForm.unit,
      date: productionForm.date,
      source: productionForm.source,
      notes: productionForm.notes,
    };

    const updatedProduction = [...production, newProduction];
    setProduction(updatedProduction);
    saveProductionToStorage(updatedProduction);

    if (productionForm.sellImmediately && productionForm.salePrice) {
      try {
        const token = localStorage.getItem("rabbit_farm_token");
        if (!token) {
          showError('Error', "No authentication token found")
        }

        const saleEarning: EarningsRecord = {
          type: productionForm.type === "urine" ? "urine_sale" : "manure_sale",
          amount: Number.parseFloat(productionForm.salePrice),
          currency: currency,
          date: productionForm.date,
          buyer_name: productionForm.buyerName || "",
          notes: `Sale of ${productionForm.quantity} ${productionForm.unit} ${productionForm.type}${productionForm.buyerName ? ` to ${productionForm.buyerName}` : ""}`,
          farm_id: user.farm_id,
        };

        await axios.post(`${utils.apiUrl}/earnings/${user.farm_id}`, saleEarning, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const updatedEarnings = [...earnings, saleEarning];
        setEarnings(updatedEarnings);
      } catch (error: any) {
        showError('Error', 'Error adding production sale earnings')
      }
    }

    setProductionForm({
      type: "urine",
      quantity: "",
      unit: "liters",
      date: new Date().toISOString().split("T")[0],
      source: "",
      notes: "",
      sellImmediately: false,
      salePrice: "",
      buyerName: "",
    });
    setAddProductionOpen(false);
  };

  const getTotalEarnings = () => {
    return filteredEarnings.reduce((total, earning) => {
      const amountInBase = convertToBaseCurrency(earning.amount, earning.currency as any);
      return total + amountInBase;
    }, 0);
  };

  const getEarningsByType = () => {
    const types = {
      rabbit_sale: 0,
      urine_sale: 0,
      manure_sale: 0,
      other: 0,
    };

    filteredEarnings.forEach((earning) => {
      const amountInBase = convertToBaseCurrency(earning.amount, earning.currency as any);
      types[earning.type] += amountInBase;
    });

    return types;
  };

  const earningsByType = getEarningsByType();

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 dark:from-green-400 dark:to-blue-400 bg-clip-text text-transparent">
              {formatAmount(getTotalEarnings())}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {dateFilter === "all" ? "All time" : `${dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)} period`}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Rabbit Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-600 to-red-600 dark:from-pink-400 dark:to-red-400 bg-clip-text text-transparent">
              {formatAmount(earningsByType.rabbit_sale)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {filteredEarnings.filter((e) => e.type === "rabbit_sale").length} sales
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Urine Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 dark:from-yellow-400 dark:to-orange-400 bg-clip-text text-transparent">
              {formatAmount(earningsByType.urine_sale)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {production.filter((p) => p.type === "urine").reduce((sum, p) => sum + p.quantity, 0)} liters produced
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg hover:shadow-xl transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 sm:pb-4">
            <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">Manure Sales</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-600 dark:from-green-400 dark:to-teal-400 bg-clip-text text-transparent">
              {formatAmount(earningsByType.manure_sale)}
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {production.filter((p) => p.type === "manure").reduce((sum, p) => sum + p.quantity, 0)} kg produced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Filters & Actions</span>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Dialog open={addProductionOpen} onOpenChange={setAddProductionOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 w-full sm:w-auto"
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Add Production</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">Add Production Record</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduction} className="space-y-3 sm:space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Type</Label>
                        <Select
                          value={productionForm.type}
                          onValueChange={(value: any) => setProductionForm({ ...productionForm, type: value })}
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                            <SelectItem value="urine">Urine</SelectItem>
                            <SelectItem value="manure">Manure</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Quantity</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={productionForm.quantity}
                          onChange={(e) => setProductionForm({ ...productionForm, quantity: e.target.value })}
                          className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Unit</Label>
                        <Select
                          value={productionForm.unit}
                          onValueChange={(value) => setProductionForm({ ...productionForm, unit: value })}
                        >
                          <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                            <SelectItem value="liters">Liters</SelectItem>
                            <SelectItem value="kg">Kilograms</SelectItem>
                            <SelectItem value="bags">Bags</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Date</Label>
                        <Input
                          type="date"
                          value={productionForm.date}
                          onChange={(e) => setProductionForm({ ...productionForm, date: e.target.value })}
                          className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Source (Hutch/Rabbit ID)</Label>
                      <Input
                        value={productionForm.source}
                        onChange={(e) => setProductionForm({ ...productionForm, source: e.target.value })}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        placeholder="e.g., Mercury-A1 or RB-001"
                      />
                    </div>

                    {/* Sale Option */}
                    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 sm:pt-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={productionForm.sellImmediately}
                          onChange={(e) => setProductionForm({ ...productionForm, sellImmediately: e.target.checked })}
                          className="rounded border-gray-300 dark:border-gray-600"
                        />
                        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100">Sell Immediately</span>
                      </label>
                    </div>
                    {productionForm.sellImmediately && (
                      <div className="bg-gradient-to-r from-green-50/80 to-green-100/80 dark:from-green-900/30 dark:to-green-800/30 p-3 sm:p-4 rounded-lg border border-green-200 dark:border-green-700 space-y-3 sm:space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                          <div>
                            <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Sale Price ({getCurrencySymbol()})</Label>
                            <Input
                              type="number"
                              step="0.01"
                              value={productionForm.salePrice}
                              onChange={(e) => setProductionForm({ ...productionForm, salePrice: e.target.value })}
                              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                              required={productionForm.sellImmediately}
                            />
                          </div>
                          <div>
                            <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Buyer Name</Label>
                            <Input
                              value={productionForm.buyerName}
                              onChange={(e) => setProductionForm({ ...productionForm, buyerName: e.target.value })}
                              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                              placeholder="Optional"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Notes</Label>
                      <Textarea
                        value={productionForm.notes}
                        onChange={(e) => setProductionForm({ ...productionForm, notes: e.target.value })}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        rows={2}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddProductionOpen(false)}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xs sm:text-sm"
                      >
                        {productionForm.sellImmediately ? "Add Production & Sale" : "Add Production"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Dialog open={addEarningsOpen} onOpenChange={setAddEarningsOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white w-full sm:w-auto">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                    <span className="text-xs sm:text-sm">Add Earnings</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-white/20 dark:border-gray-600/20 max-h-[90vh] overflow-y-auto w-[95vw] max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-gray-100 text-sm sm:text-base">Add Earnings Record</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddEarnings} className="space-y-3 sm:space-y-4">
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Type</Label>
                      <Select
                        value={earningsForm.type}
                        onValueChange={(value: "rabbit_sale" | "urine_sale" | "manure_sale" | "other") =>
                          setEarningsForm({
                            ...earningsForm,
                            type: value,
                            ...(value !== "rabbit_sale" && {
                              rabbit_id: undefined,
                              hutch_id: undefined,
                              sale_type: undefined,
                              weight: undefined,
                              includes_urine: undefined,
                              includes_manure: undefined,
                              buyer_name: undefined,
                            }),
                          })
                        }
                      >
                        <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                          <SelectItem value="rabbit_sale">Rabbit Sale</SelectItem>
                          <SelectItem value="urine_sale">Urine Sale</SelectItem>
                          <SelectItem value="manure_sale">Manure Sale</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {earningsForm.type === "rabbit_sale" && (
                      <div className="space-y-3 sm:space-y-4">
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Rabbit ID</Label>
                          <Input
                            value={earningsForm.rabbit_id || ""}
                            onChange={(e) => setEarningsForm({ ...earningsForm, rabbit_id: e.target.value })}
                            className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                            placeholder="e.g., RB-001"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Hutch ID</Label>
                          <Input
                            value={earningsForm.hutch_id || ""}
                            onChange={(e) => setEarningsForm({ ...earningsForm, hutch_id: e.target.value })}
                            className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                            placeholder="e.g., Mercury-A1"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Sale Type</Label>
                          <Select
                            value={earningsForm.sale_type}
                            onValueChange={(value: "whole" | "meat_only" | "skin_only" | "meat_and_skin") =>
                              setEarningsForm({ ...earningsForm, sale_type: value })
                            }
                          >
                            <SelectTrigger className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                              <SelectValue placeholder="Select sale type" />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                              <SelectItem value="whole">Whole Rabbit</SelectItem>
                              <SelectItem value="meat_only">Meat Only</SelectItem>
                              <SelectItem value="skin_only">Skin Only</SelectItem>
                              <SelectItem value="meat_and_skin">Meat and Skin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Weight (kg)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            value={earningsForm.weight || ""}
                            onChange={(e) => setEarningsForm({ ...earningsForm, weight: e.target.value })}
                            className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                            placeholder="e.g., 2.5"
                          />
                        </div>
                        <div className="flex flex-col sm:flex-row sm:space-x-4 space-y-2 sm:space-y-0">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={earningsForm.includes_urine || false}
                              onChange={(e) => setEarningsForm({ ...earningsForm, includes_urine: e.target.checked })}
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">Includes Urine</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={earningsForm.includes_manure || false}
                              onChange={(e) => setEarningsForm({ ...earningsForm, includes_manure: e.target.checked })}
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <span className="text-xs sm:text-sm text-gray-900 dark:text-gray-100">Includes Manure</span>
                          </label>
                        </div>
                        <div>
                          <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Buyer Name</Label>
                          <Input
                            value={earningsForm.buyer_name || ""}
                            onChange={(e) => setEarningsForm({ ...earningsForm, buyer_name: e.target.value })}
                            className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                            placeholder="Optional"
                          />
                        </div>
                      </div>
                    )}
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Amount ({getCurrencySymbol()})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={earningsForm.amount}
                        onChange={(e) => setEarningsForm({ ...earningsForm, amount: e.target.value })}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Date</Label>
                      <Input
                        type="date"
                        value={earningsForm.date}
                        onChange={(e) => setEarningsForm({ ...earningsForm, date: e.target.value })}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">Notes</Label>
                      <Textarea
                        value={earningsForm.notes}
                        onChange={(e) => setEarningsForm({ ...earningsForm, notes: e.target.value })}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                        rows={3}
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAddEarningsOpen(false)}
                        className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xs sm:text-sm"
                      >
                        Add Earnings
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 sm:gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {dateFilter === "custom" && (
              <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                />
                <span className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">to</span>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="w-full sm:w-40 bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 text-xs sm:text-sm"
                />
              </div>
            )}
            <Button
              variant="outline"
              className="bg-white/50 dark:bg-gray-700/50 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 w-full sm:w-auto"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
              <span className="text-xs sm:text-sm">Export</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Earnings List */}
      <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm border-white/20 dark:border-gray-600/20 shadow-lg">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-gray-900 dark:text-gray-100 text-base sm:text-lg">Earnings Records</CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {filteredEarnings.length > 0 ? (
              filteredEarnings
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((earning, index) => (
                  <div
                    key={`${earning.id || index}-${earning.created_at || earning.date}`}
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-3 sm:p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/60 dark:to-gray-700/60 space-y-3 lg:space-y-0"
                  >
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-2 sm:space-y-0">
                        <Badge
                          variant="outline"
                          className={`w-fit text-xs whitespace-nowrap ${earning.type === "rabbit_sale"
                            ? "bg-pink-50 dark:bg-pink-900/30 border-pink-200 dark:border-pink-700 text-pink-800 dark:text-pink-300"
                            : earning.type === "urine_sale"
                              ? "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300"
                              : earning.type === "manure_sale"
                                ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700 text-green-800 dark:text-green-300"
                                : "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-800 dark:text-blue-300"
                            }`}
                        >
                          {earning.type.replace("_", " ").toUpperCase()}
                        </Badge>
                        <span className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base">
                          {earning.currency} {earning.amount}
                        </span>
                        {earning.rabbit_id && (
                          <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">({earning.rabbit_id})</span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {new Date(earning.date).toLocaleDateString()}
                        {earning.weight && ` • ${earning.weight} kg`}
                        {earning.sale_type && ` • ${earning.sale_type.replace("_", " ")}`}
                        {earning.buyer_name && ` • Buyer: ${earning.buyer_name}`}
                      </p>
                      {earning.notes && (
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mt-1 break-words">{earning.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center justify-end lg:justify-center space-x-2 flex-shrink-0">
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 dark:text-green-400" />
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-gray-500 dark:text-gray-400">
                <DollarSign className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm sm:text-base">No earnings records found for the selected period.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
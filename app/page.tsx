"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import StatsCard from "./components/StatsCard";
import InventoryList from "./components/InventoryList";
import AddProductForm from "./components/AddProductForm";
import EditItemForm from "./components/EditItemForm";
import Modal from "./components/Modal";
import LoginForm from "./components/LoginForm";
import type { ItemFormData } from "./lib/validations";

interface Item {
  id: string;
  productNumber: string;
  Name: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  weight: string;
  status: "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION";
  smsSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeSection, setActiveSection] = useState("in-warehouse");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Check authentication on mount
  useEffect(() => {
    const authStatus = localStorage.getItem("authenticated");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    setCheckingAuth(false);
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // Map activeSection to Prisma status
  const getStatusForSection = (section: string): "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION" | null => {
    const mapping: Record<string, "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION"> = {
      stopped: "STOPPED",
      "in-warehouse": "IN_WAREHOUSE",
      shipped: "RELEASED",
      region: "REGION",
    };
    return mapping[section] || null;
  };

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/items");
        if (response.ok) {
          const data = await response.json();
          console.log("Fetched items:", data);
          setItems(data);
        } else {
          const errorData = await response.json();
          console.error("Failed to fetch items:", errorData);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  const handleAddProduct = async (newProduct: ItemFormData) => {
    try {
      console.log("Submitting product:", newProduct);
      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        const newItem = await response.json();
        setItems((prev) => [newItem, ...prev]);
        setIsModalOpen(false);
        toast.success("ნივთი წარმატებით დაემატა!");
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to create item:", errorData);
        toast.error(`შეცდომა: ${errorData.message || errorData.error || "ნივთის დამატება ვერ მოხერხდა"}`);
      }
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("შეცდომა: ნივთის დამატება ვერ მოხერხდა");
    }
  };

  const handleBulkAddProducts = async (products: ItemFormData[]) => {
    try {
      console.log("Submitting bulk products:", products);
      const response = await fetch("/api/items/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: products }),
      });

      if (response.ok) {
        const result = await response.json();
        const newItems = result.items || [];
        setItems((prev) => [...newItems, ...prev]);
        setIsModalOpen(false);
        toast.success(`${newItems.length} ნივთი წარმატებით დაემატა!`);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to create items:", errorData);
        toast.error(`შეცდომა: ${errorData.message || errorData.error || "ნივთების დამატება ვერ მოხერხდა"}`);
      }
    } catch (error) {
      console.error("Error creating items:", error);
      toast.error("შეცდომა: ნივთების დამატება ვერ მოხერხდა");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    const item = items.find((i) => i.id === id);
    const itemProductNumber = item?.productNumber || "ნივთი";
    
    const confirmed = window.confirm(
      `დარწმუნებული ხართ რომ გსურთ წაშალოთ "${itemProductNumber}"?`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setItems((prev) => prev.filter((item) => item.id !== id));
        toast.success(`"${itemProductNumber}" წარმატებით წაიშალა`);
      } else {
        console.error("Failed to delete item");
        toast.error("შეცდომა: ნივთის წაშლა ვერ მოხერხდა");
      }
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("შეცდომა: ნივთის წაშლა ვერ მოხერხდა");
    }
  };

  const handleDeleteAll = async () => {
    const totalCount = filteredItems.length;
    
    if (totalCount === 0) {
      toast.info("წასაშლელი ნივთები არ არის");
      return;
    }

    const confirmed = window.confirm(
      `დარწმუნებული ხართ რომ გსურთ წაშალოთ ყველა ${totalCount} ნივთი ამ სექციიდან? ეს მოქმედება შეუქცევადია!`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      // Delete only filtered items (current tab items)
      const deletePromises = filteredItems.map((item) =>
        fetch(`/api/items/${item.id}`, {
          method: "DELETE",
        })
      );

      const responses = await Promise.all(deletePromises);
      const allSuccessful = responses.every((r) => r.ok);

      if (allSuccessful) {
        // Remove deleted items from state
        const deletedIds = filteredItems.map((item) => item.id);
        setItems((prev) => prev.filter((item) => !deletedIds.includes(item.id)));
        toast.success(`ყველა ${totalCount} ნივთი წარმატებით წაიშალა`);
      } else {
        toast.error("ზოგიერთი ნივთის წაშლა ვერ მოხერხდა");
      }
    } catch (error) {
      console.error("Error deleting all items:", error);
      toast.error("შეცდომა: ნივთების წაშლა ვერ მოხერხდა");
    }
  };

  const handleEditProduct = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (item) {
      setEditingItem(item);
      setIsEditModalOpen(true);
    }
  };

  const handleUpdateProduct = async (id: string, updatedData: ItemFormData) => {
    try {
      const response = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );
        setIsEditModalOpen(false);
        setEditingItem(null);
        toast.success("ნივთი წარმატებით განახლდა!");
      } else {
        console.error("Failed to update item");
        toast.error("შეცდომა: ნივთის განახლება ვერ მოხერხდა");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast.error("შეცდომა: ნივთის განახლება ვერ მოხერხდა");
    }
  };

  const handleStatusChange = async (id: string, newStatus: "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION") => {
    try {
      const item = items.find((i) => i.id === id);
      const itemProductNumber = item?.productNumber || "ნივთი";
      
      const statusLabels: Record<string, string> = {
        STOPPED: "გაჩერებული",
        IN_WAREHOUSE: "საწყობშია",
        RELEASED: "გაცემულია",
        REGION: "რეგიონი",
      };

      console.log("Updating status for item:", id, "to:", newStatus);
      const response = await fetch(`/api/items/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (response.ok) {
        const updatedItem = await response.json();
        console.log("Status updated successfully:", updatedItem);
        setItems((prev) =>
          prev.map((item) => (item.id === id ? updatedItem : item))
        );
        toast.success(`"${itemProductNumber}"-ის სტატუსი შეიცვალა: ${statusLabels[newStatus]}`);
      } else {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || "Unknown error" };
        }
        console.error("Failed to update status:", response.status, errorData);
        toast.error(`შეცდომა: ${errorData.message || errorData.error || "უცნობი შეცდომა"}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("შეცდომა სტატუსის განახლებისას");
    }
  };

  const handleBulkStatusChange = async (ids: string[], newStatus: "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION") => {
    try {
      const statusLabels: Record<string, string> = {
        STOPPED: "გაჩერებული",
        IN_WAREHOUSE: "საწყობშია",
        RELEASED: "გაცემულია",
        REGION: "რეგიონი",
      };

      // Update all items in parallel
      const updatePromises = ids.map((id) =>
        fetch(`/api/items/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: newStatus,
          }),
        })
      );

      const responses = await Promise.all(updatePromises);
      const results = await Promise.all(responses.map((r) => r.json()));

      // Check if all updates were successful
      const allSuccessful = responses.every((r) => r.ok);

      if (allSuccessful) {
        // Update items in state
        setItems((prev) =>
          prev.map((item) => {
            if (ids.includes(item.id)) {
              const updated = results.find((r) => r.id === item.id);
              return updated || item;
            }
            return item;
          })
        );
        toast.success(`${ids.length} ამანათის სტატუსი შეიცვალა: ${statusLabels[newStatus]}`);
      } else {
        toast.error("ზოგიერთი ამანათის სტატუსის განახლება ვერ მოხერხდა");
      }
    } catch (error) {
      console.error("Error updating bulk status:", error);
      toast.error("შეცდომა სტატუსების განახლებისას");
    }
  };

  const statusForSection = getStatusForSection(activeSection);
  
  // Filter items by status and search query
  const filteredItems = (statusForSection
    ? items.filter((item) => item.status === statusForSection)
    : []
  ).filter((item) => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    // Remove "kg" from query for weight search to work with or without it
    const queryWithoutKg = query.replace(/\s*kg\s*/g, "").trim();
    
    return (
      item.productNumber.toLowerCase().includes(query) ||
      item.Name.toLowerCase().includes(query) ||
      item.fullName.toLowerCase().includes(query) ||
      item.phone.toLowerCase().includes(query) ||
      item.city.toLowerCase().includes(query) ||
      item.address.toLowerCase().includes(query) ||
      item.weight.toLowerCase().includes(query) ||
      item.weight.toLowerCase().includes(queryWithoutKg) ||
      (queryWithoutKg && item.weight.toLowerCase().replace(/\s*kg\s*/g, "").includes(queryWithoutKg))
    );
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  // Reset to page 1 when search query or active section changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeSection]);

  // Debug logs
  console.log("Active section:", activeSection);
  console.log("Status for section:", statusForSection);
  console.log("Total items:", items.length);
  console.log("Filtered items:", filteredItems.length);

  const totalItems = items.length;
  const itemsStopped = items.filter((i) => i.status === "STOPPED").length;
  const itemsInWarehouse = items.filter((i) => i.status === "IN_WAREHOUSE").length;
  const itemsReleased = items.filter((i) => i.status === "RELEASED").length;
  const itemsRegion = items.filter((i) => i.status === "REGION").length;

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      "in-warehouse": "საწყობში",
      stopped: "გაჩერებული",
      shipped: "გაცემული",
      region: "რეგიონი",
    };
    return titles[activeSection] || "ინვენტარი";
  };

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">იტვირთება...</p>
        </div>
      </div>
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">იტვირთება...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className={`flex-1 w-full transition-all duration-300 ${isSidebarOpen ? "lg:ml-56" : "lg:ml-0"} overflow-hidden`}>
        <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="p-4 overflow-x-hidden">
          <div className="mb-6 lg:mb-8">
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-800 mb-4 lg:mb-6">{getSectionTitle()}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
              <StatsCard
                title="სულ ნივთები"
                value={totalItems}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
                color="blue"
              />
              <StatsCard
                title="საწყობში"
                value={itemsInWarehouse}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                }
                color="blue"
              />
              <StatsCard
                title="გაჩერებული"
                value={itemsStopped}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                color="yellow"
              />
           
              <StatsCard
                title="რეგიონი"
                value={itemsRegion}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
                color="purple"
              />
                 <StatsCard
                title="გაცემული"
                value={itemsReleased}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                }
                color="green"
              />
            </div>
          </div>

          <div className="mb-6">
            {/* Search Input */}
            <div className="mb-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="ძებნა: ამანათის ნომერი, სახელი, გვარი, ტელეფონი, ქალაქი, მისამართი, წონა (kg)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-lg text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="გასუფთავება"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-2xl font-bold text-gray-800">ნივთების სია</h2>
              <div className="flex items-center gap-3 flex-wrap">
              {(activeSection === "in-warehouse" || activeSection === "stopped" || activeSection === "region") && (
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    ახალი ნივთის დამატება
                  </button>
                )}
                {filteredItems.length > 0 && (
                  <button
                    onClick={handleDeleteAll}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    ყველას წაშლა
                  </button>
                )}
             
              </div>
            </div>
            <InventoryList
              items={paginatedItems}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onStatusChange={handleStatusChange}
              onBulkStatusChange={handleBulkStatusChange}
            />
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === 1
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            currentPage === page
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <span key={page} className="px-2 text-gray-500">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentPage === totalPages
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
            
            {/* Pagination Info */}
            {filteredItems.length > 0 && (
              <div className="mt-4 text-center text-gray-600 text-sm">
                ნაჩვენებია {startIndex + 1}-{Math.min(endIndex, filteredItems.length)} {filteredItems.length}-დან
              </div>
            )}
          </div>

          {(activeSection === "in-warehouse" || activeSection === "stopped" || activeSection === "region") && (
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="ახალი ნივთის დამატება"
            >
              <AddProductForm 
                onAdd={handleAddProduct} 
                onBulkAdd={handleBulkAddProducts}
                onClose={() => setIsModalOpen(false)}
                activeSection={activeSection}
              />
            </Modal>
          )}

          {editingItem && (
            <Modal
              isOpen={isEditModalOpen}
              onClose={() => {
                setIsEditModalOpen(false);
                setEditingItem(null);
              }}
              title="ნივთის რედაქტირება"
            >
              <EditItemForm
                item={editingItem}
                onUpdate={handleUpdateProduct}
                onClose={() => {
                  setIsEditModalOpen(false);
                  setEditingItem(null);
                }}
              />
            </Modal>
          )}
        </main>
      </div>
    </div>
  );
}

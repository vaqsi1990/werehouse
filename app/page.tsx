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
import type { ItemFormData } from "./lib/validations";

interface Item {
  id: string;
  productNumber: string;
  Name: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  status: "STOPPED" | "IN_WAREHOUSE" | "RELEASED";
  smsSent: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("in-warehouse");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Map activeSection to Prisma status
  const getStatusForSection = (section: string): "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | null => {
    const mapping: Record<string, "STOPPED" | "IN_WAREHOUSE" | "RELEASED"> = {
      stopped: "STOPPED",
      "in-warehouse": "IN_WAREHOUSE",
      shipped: "RELEASED",
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
      `დარწმუნებული ხართ რომ გსურთ წაშალოთ ყველა ${totalCount} ნივთი? ეს მოქმედება შეუქცევადია!`
    );
    
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch("/api/items/bulk", {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        setItems([]);
        toast.success(`ყველა ${result.count} ნივთი წარმატებით წაიშალა`);
      } else {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("Failed to delete all items:", errorData);
        toast.error(`შეცდომა: ${errorData.message || errorData.error || "ნივთების წაშლა ვერ მოხერხდა"}`);
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

  const handleStatusChange = async (id: string, newStatus: "STOPPED" | "IN_WAREHOUSE" | "RELEASED") => {
    try {
      const item = items.find((i) => i.id === id);
      const itemProductNumber = item?.productNumber || "ნივთი";
      
      const statusLabels: Record<string, string> = {
        STOPPED: "გაჩერებული",
        IN_WAREHOUSE: "საწყობშია",
        RELEASED: "გაცემულია",
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

  const statusForSection = getStatusForSection(activeSection);
  const filteredItems = statusForSection
    ? items.filter((item) => item.status === statusForSection)
    : [];

  // Debug logs
  console.log("Active section:", activeSection);
  console.log("Status for section:", statusForSection);
  console.log("Total items:", items.length);
  console.log("Filtered items:", filteredItems.length);

  const totalItems = items.length;
  const itemsStopped = items.filter((i) => i.status === "STOPPED").length;
  const itemsInWarehouse = items.filter((i) => i.status === "IN_WAREHOUSE").length;
  const itemsReleased = items.filter((i) => i.status === "RELEASED").length;

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      "in-warehouse": "საწყობში",
      stopped: "გაჩერებული",
      shipped: "გაცემული",
    };
    return titles[activeSection] || "ინვენტარი";
  };

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">ნივთების სია</h2>
              <div className="flex items-center gap-3">
              {activeSection === "in-warehouse" && (
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
              items={filteredItems}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onStatusChange={handleStatusChange}
            />
          </div>

          {activeSection === "in-warehouse" && (
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="ახალი ნივთის დამატება"
            >
              <AddProductForm 
                onAdd={handleAddProduct} 
                onBulkAdd={handleBulkAddProducts}
                onClose={() => setIsModalOpen(false)} 
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

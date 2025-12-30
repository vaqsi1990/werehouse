"use client";

import { useState } from "react";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import StatsCard from "./components/StatsCard";
import InventoryList from "./components/InventoryList";
import AddProductForm from "./components/AddProductForm";
import Modal from "./components/Modal";
import type { ItemFormData } from "./lib/validations";

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: string;
  status: "received" | "in-transit" | "in-warehouse" | "shipped";
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("in-warehouse");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  const handleAddProduct = (newProduct: ItemFormData) => {
    // TODO: აქ უნდა დაემატოს Prisma-სთან ინტეგრაცია
    console.log("ახალი პროდუქტი:", newProduct);
    setIsModalOpen(false);
  };

  const handleDeleteProduct = (id: number) => {
    setProducts(products.filter((p) => p.id !== id));
  };


  const handleEditProduct = (id: number) => {
    const product = products.find((p) => p.id === id);
    if (product) {
      const newName = prompt("ახალი სახელი:", product.name);
      if (newName) {
        const newQuantity = prompt("ახალი რაოდენობა:", product.quantity.toString());
        const newPrice = prompt("ახალი ფასი:", product.price.toString());
        const newCategory = prompt("ახალი კატეგორია:", product.category);

        if (newQuantity && newPrice && newCategory) {
          setProducts(
            products.map((p) =>
              p.id === id
                ? {
                    ...p,
                    name: newName,
                    quantity: parseInt(newQuantity),
                    price: parseFloat(newPrice),
                    category: newCategory,
                  }
                : p
            )
          );
        }
      }
    }
  };

  const filteredProducts = products.filter((p) => p.status === activeSection);

  const totalProducts = products.length;
  const totalValue = products.reduce(
    (sum, p) => sum + p.quantity * p.price,
    0
  );
  const lowStockItems = products.filter((p) => p.quantity < 10).length;
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0);

  const getSectionTitle = () => {
    const titles: Record<string, string> = {
      received: "შემოსული ნივთები",
      "in-transit": "გზაში მყოფი",
      "in-warehouse": "საწყობში მყოფი",
      shipped: "გაცემული",
    };
    return titles[activeSection] || "ინვენტარი";
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 ml-72">
        <Header />
        <main className="p-6">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">{getSectionTitle()}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="სულ პროდუქტები"
              value={totalProducts}
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
              title="სულ ღირებულება"
              value={`${totalValue.toFixed(2)} ₾`}
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
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              color="green"
            />
            <StatsCard
              title="დაბალი მარაგი"
              value={lowStockItems}
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              }
              color="yellow"
            />
            <StatsCard
              title="სულ რაოდენობა"
              value={totalQuantity}
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
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              }
              color="purple"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-800">პროდუქტების სია</h2>
            {activeSection === "received" && (
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
                ახალი პროდუქტის დამატება
              </button>
            )}
          </div>
          <InventoryList
            products={filteredProducts}
            onEdit={handleEditProduct}
            onDelete={handleDeleteProduct}
          />
        </div>

        {activeSection === "received" && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="ახალი პროდუქტის დამატება"
          >
            <AddProductForm onAdd={handleAddProduct} onClose={() => setIsModalOpen(false)} />
          </Modal>
        )}
      </main>
      </div>
    </div>
  );
}

import InventoryItem from "./InventoryItem";

interface Product {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: string;
}

interface InventoryListProps {
  products: Product[];
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function InventoryList({ products, onEdit, onDelete }: InventoryListProps) {
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-12 text-center">
        <svg
          className="w-16 h-16 mx-auto text-gray-400 mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
          />
        </svg>
        <p className="text-gray-500 text-lg">ინვენტარი ცარიელია</p>
        <p className="text-gray-400 text-sm mt-2">დაამატეთ პროდუქტები ინვენტარში</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {products.map((product) => (
        <InventoryItem
          key={product.id}
          {...product}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}


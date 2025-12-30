interface InventoryItemProps {
  id: number;
  name: string;
  quantity: number;
  price: number;
  category: string;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
}

export default function InventoryItem({
  id,
  name,
  quantity,
  price,
  category,
  onEdit,
  onDelete,
}: InventoryItemProps) {
  const isLowStock = quantity < 10;

  return (
    <div
      className={`bg-white rounded-lg shadow-md p-4 border-l-4 ${
        isLowStock ? "border-red-500" : "border-green-500"
      } hover:shadow-lg transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
            {isLowStock && (
              <span className="bg-red-100 text-red-600 text-xs font-medium px-2 py-1 rounded">
                დაბალი მარაგი
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">{category}</p>
          <div className="flex gap-6 mt-3">
            <div>
              <span className="text-xs text-gray-500">რაოდენობა:</span>
              <span className="ml-2 font-semibold text-gray-700">{quantity}</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">ფასი:</span>
              <span className="ml-2 font-semibold text-gray-700">{price.toFixed(2)} ₾</span>
            </div>
            <div>
              <span className="text-xs text-gray-500">სულ:</span>
              <span className="ml-2 font-semibold text-blue-600">
                {(quantity * price).toFixed(2)} ₾
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors text-sm"
            >
              რედაქტირება
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors text-sm"
            >
              წაშლა
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


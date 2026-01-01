interface InventoryItemProps {
  id: string;
  productNumber: string;
  Name: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  status: "IN_TRANSIT" | "IN_WAREHOUSE" | "RELEASED";
  createdAt: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function InventoryItem({
  id,
  productNumber,
  Name,
  fullName,
  phone,
  city,
  address,
  status,
  createdAt,
  onEdit,
  onDelete,
}: InventoryItemProps) {
  const statusLabels: Record<string, string> = {
    IN_TRANSIT: "გზაშია",
    IN_WAREHOUSE: "საწყობშია",
    RELEASED: "გაცემულია",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">{productNumber}</h3>
            <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded">
              {statusLabels[status]}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">კლიენტი:</span> {Name}
            </p>
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">სრული სახელი:</span> {fullName}
            </p>
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">ტელეფონი:</span> {phone}
            </p>
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">ქალაქი:</span> {city}
            </p>
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">მისამართი:</span> {address}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              შექმნილია: {new Date(createdAt).toLocaleDateString("ka-GE")}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-[16px] font-medium"
            >
              რედაქტირება
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-[20px] font-medium w-10 h-10 flex items-center justify-center"
              title="წაშლა"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

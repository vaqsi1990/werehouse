interface InventoryItemProps {
  id: string;
  shtrikhkodi: string;
  gamomcemeli: string;
  mimgebi: string;
  telefoni: string;
  kalaki: string;
  sakGadakhda: string;
  tarighi?: string | null;
  tsona: string;
  status: "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION";
  createdAt: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function InventoryItem({
  id,
  shtrikhkodi,
  gamomcemeli,
  mimgebi,
  telefoni,
  kalaki,
  sakGadakhda,
  tarighi,
  tsona,
  status,
  createdAt,
  onEdit,
  onDelete,
}: InventoryItemProps) {
  const statusLabels: Record<string, string> = {
    STOPPED: "გაჩერებული",
    IN_WAREHOUSE: "საწყობშია",
    RELEASED: "გაცემულია",
    REGION: "რეგიონი",
  };

  // Format date in Georgian
  const formatDateGeorgian = (dateString: string) => {
    const date = new Date(dateString);
    const months = [
      "იანვარი", "თებერვალი", "მარტი", "აპრილი", "მაისი", "ივნისი",
      "ივლისი", "აგვისტო", "სექტემბერი", "ოქტომბერი", "ნოემბერი", "დეკემბერი"
    ];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-gray-800">{shtrikhkodi}</h3>
            <span className="bg-blue-100 text-blue-600 text-xs font-medium px-2 py-1 rounded">
              {statusLabels[status]}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">გამომგზავნი:</span> {gamomcemeli}
            </p>
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">მიმღები:</span> {mimgebi}
            </p>
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">ტელეფონი:</span> {telefoni}
            </p>
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">წონა:</span> {tsona} kg
            </p>
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">ქალაქი:</span> {kalaki}
            </p>
            <p className="text-[16px] text-gray-600">
              <span className="font-medium">საქ.გადახდა:</span> {sakGadakhda}
            </p>
            {tarighi && (
              <p className="text-[16px] text-gray-600">
                <span className="font-medium">თარიღი:</span> {tarighi}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              შექმნილია: {formatDateGeorgian(createdAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          {onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="px-3 py-1 bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors text-[16px] font-medium"
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

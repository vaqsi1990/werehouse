interface Item {
  id: string;
  productNumber: string;
  Name: string;
  fullName: string;
  phone: string;
  city: string;
  address: string;
  status: "STOPPED" | "IN_WAREHOUSE" | "RELEASED";
  createdAt: string;
  updatedAt: string;
}

interface InventoryListProps {
  items: Item[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: "STOPPED" | "IN_WAREHOUSE" | "RELEASED") => void;
}

export default function InventoryList({ items, onEdit, onDelete, onStatusChange }: InventoryListProps) {
  const statusLabels: Record<string, string> = {
    STOPPED: "გაჩერებული",
    IN_WAREHOUSE: "საწყობშია",
    RELEASED: "გაცემულია",
  };

  const statusColors: Record<string, string> = {
    STOPPED: "bg-white text-black border-1 border-black",
    IN_WAREHOUSE: "bg-white text-black border-1 border-black",
    RELEASED: "bg-white text-black border-1 border-black",
  };

  if (items.length === 0) {
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
        <p className="text-black text-[16px]">ინვენტარი ცარიელია</p>
        <p className="text-black text-[16px] mt-2">დაამატეთ პროდუქტები ინვენტარში</p>
      </div>
    );
  }

  // Mobile card view
  const MobileCardView = ({ item }: { item: Item }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-black text-[16px] mb-1">{item.productNumber}</h3>
            <p className="text-black text-[16px]">{item.Name} {item.fullName}</p>
          </div>
          <span className={`inline-flex px-2 py-1 text-[16px] font-semibold rounded-full ${statusColors[item.status]}`}>
            {statusLabels[item.status]}
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-2 text-[16px]">
          <div className="flex items-center gap-2">
            <span className="text-black">ტელეფონი:</span>
            <span className="text-black">{item.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">ქალაქი:</span>
            <span className="text-black">{item.city}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">მისამართი:</span>
            <span className="text-black break-all">{item.address}</span>
          </div>
        </div>

        {onStatusChange && (
          <div>
            <label className="block text-[16px] text-black mb-1">სტატუსის შეცვლა</label>
            <select
              value={item.status}
              onChange={(e) => {
                const newStatus = e.target.value as "STOPPED" | "IN_WAREHOUSE" | "RELEASED";
                onStatusChange(item.id, newStatus);
              }}
              className={`w-full px-3 py-2 text-[16px] font-semibold rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusColors[item.status]}`}
            >
              <option value="STOPPED">გაჩერებული</option>
              <option value="IN_WAREHOUSE">საწყობშია</option>
              <option value="RELEASED">გაცემულია</option>
            </select>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
          {onEdit && (
            <button
              onClick={() => onEdit(item.id)}
              className="bg-green-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-[16px]"
            >
              რედაქტირება
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="bg-red-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-[16px] w-10 h-10 flex items-center justify-center"
              title="წაშლა"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden w-full max-w-full">
      {/* Mobile Card View */}
      <div className="lg:hidden p-4">
        {items.map((item) => (
          <MobileCardView key={item.id} item={item} />
        ))}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block w-full overflow-x-auto max-w-full">
        <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px] font-medium text-black uppercase tracking-wider min-w-[150px]">
                    ამანათის ნომერი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[120px]">
                    კლიენტის სახელი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[120px]">
                    კლიენტის გვარი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[120px]">
                    ტელეფონი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[150px]">
                    ქალაქი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[150px]">
                    თარიღი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[140px]">
                    სტატუსი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-[15px]  font-medium text-black uppercase tracking-wider min-w-[140px]">
                    მოქმედებები
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  font-medium text-black  ">
                        {item.productNumber}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black ">
                        {item.Name}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black ">
                        {item.fullName}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black break-all">
                        {item.phone}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black ">
                        {item.city}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black">
                        {new Date(item.createdAt).toLocaleDateString("ka-GE", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                      <div className="text-[13px] text-gray-500 mt-1">
                        {new Date(item.createdAt).toLocaleTimeString("ka-GE", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      {onStatusChange ? (
                        <select
                          value={item.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as "STOPPED" | "IN_WAREHOUSE" | "RELEASED";
                            onStatusChange(item.id, newStatus);
                          }}
                          className={`px-2 lg:px-3 py-1 text-[15px] font-semibold rounded-lg cursor-pointer  ${statusColors[item.status]} w-full max-w-[140px]`}
                        >
                          <option value="STOPPED">გაჩერებული</option>
                          <option value="IN_WAREHOUSE">საწყობშია</option>
                          <option value="RELEASED">გაცემულია</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-1 text-[15px] font-semibold rounded-full ${statusColors[item.status]}`}
                        >
                          {statusLabels[item.status]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 lg:px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 ">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(item.id)}
                            className="bg-green-700 cursor-pointer font-bold text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-[15px] whitespace-nowrap"
                          >
                            რედაქტირება
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item.id)}
                            className="bg-red-600 cursor-pointer  font-bold text-white px-3 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-[20px] w-10 h-10 flex items-center justify-center"
                            title="წაშლა"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
      </div>
    </div>
  );
}

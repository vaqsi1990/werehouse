interface Item {
  id: string;
  title: string;
  Name: string;
  fullName: string;
  phone: string;
  email: string;
  status: "RECEIVED" | "IN_TRANSIT" | "IN_WAREHOUSE" | "RELEASED";
  createdAt: string;
  updatedAt: string;
}

interface InventoryListProps {
  items: Item[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: "RECEIVED" | "IN_TRANSIT" | "IN_WAREHOUSE" | "RELEASED") => void;
}

export default function InventoryList({ items, onEdit, onDelete, onStatusChange }: InventoryListProps) {
  const statusLabels: Record<string, string> = {
    RECEIVED: "შემოსული",
    IN_TRANSIT: "გზაშია",
    IN_WAREHOUSE: "საწყობშია",
    RELEASED: "გაცემულია",
  };

  const statusColors: Record<string, string> = {
    RECEIVED: "bg-purple-100 text-purple-800",
    IN_TRANSIT: "bg-yellow-100 text-yellow-800",
    IN_WAREHOUSE: "bg-blue-100 text-blue-800",
    RELEASED: "bg-green-100 text-green-800",
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
        <p className="text-gray-500 text-lg">ინვენტარი ცარიელია</p>
        <p className="text-gray-400 text-[16px] mt-2">დაამატეთ პროდუქტები ინვენტარში</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left md:text-[18px] text-[16px] font-medium text-gray-500 uppercase tracking-wider">
                ნივთის აღწერა
              </th>
              <th className="px-6 py-3 text-left md:text-[18px] text-[16px] font-medium text-gray-500 uppercase tracking-wider">
                კლიენტის სახელი
              </th>
              <th className="px-6 py-3 text-left md:text-[18px] text-[16px] font-medium text-gray-500 uppercase tracking-wider">
            კლიენტის   გვარი
              </th>
              <th className="px-6 py-3 text-left md:text-[18px] text-[16px] font-medium text-gray-500 uppercase tracking-wider">
                ტელეფონი
              </th>
              <th className="px-6 py-3 text-left md:text-[18px] text-[16px] font-medium text-gray-500 uppercase tracking-wider">
                ელფოსტა
              </th>
              <th className="px-6 py-3 text-left md:text-[18px] text-[16px] font-medium text-gray-500 uppercase tracking-wider">
                სტატუსი
              </th>
              <th className="px-6 py-3 text-left md:text-[18px] text-[16px] font-medium text-gray-500 uppercase tracking-wider">
                თარიღი
              </th>
              <th className="px-6 py-3 text-right md:text-[18px] text-[16px] font-medium text-gray-500 uppercase tracking-wider">
                მოქმედებები
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="md:text-[18px] text-[16px] font-medium text-gray-900">{item.title}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="md:text-[18px] text-[16px] text-gray-900">{item.Name}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="md:text-[18px] text-[16px] text-gray-900">{item.fullName}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="md:text-[18px] text-[16px] text-gray-900">{item.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="md:text-[18px] text-[16px] text-gray-900">{item.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {onStatusChange ? (
                    <select
                      value={item.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as "RECEIVED" | "IN_TRANSIT" | "IN_WAREHOUSE" | "RELEASED";
                        onStatusChange(item.id, newStatus);
                      }}
                      className={`px-3 py-1 md:text-[18px] text-[16px] font-semibold rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusColors[item.status]}`}
                    >
                      <option value="RECEIVED">შემოსული</option>
                      <option value="IN_TRANSIT">გზაშია</option>
                      <option value="IN_WAREHOUSE">საწყობშია</option>
                      <option value="RELEASED">გაცემულია</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex px-2 py-1 md:text-[18px] text-[16px] font-semibold rounded-full ${statusColors[item.status]}`}
                    >
                      {statusLabels[item.status]}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="md:text-[18px] text-[16px] text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString("ka-GE")}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right md:text-[18px] text-[16px] font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && (
                      <button
                        onClick={() => onEdit(item.id)}
                        className="text-blue-600 hover:text-blue-900 transition-colors"
                      >
                        რედაქტირება
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="text-red-600 hover:text-red-900 transition-colors"
                      >
                        წაშლა
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

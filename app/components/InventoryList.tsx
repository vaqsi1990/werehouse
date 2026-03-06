"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Modal from "./Modal";

interface Item {
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
  updatedAt: string;
}

interface InventoryListProps {
  items: Item[];
  /** ყველა ნივთი მიმდინარე ფილტრში (ყველა გვერდი) – SMS და მონიშვნა ყველგან იმუშავებს */
  allItems?: Item[];
  /** სექცია/ფილტრის შეცვლისას მონიშვნა იშლება (მაგ. activeSection) */
  selectionScopeKey?: string;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, newStatus: "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION") => void;
  onBulkStatusChange?: (ids: string[], newStatus: "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION") => void;
}

export default function InventoryList({ items, allItems, selectionScopeKey, onEdit, onDelete, onStatusChange, onBulkStatusChange }: InventoryListProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [smsText, setSmsText] = useState("");
  const [smsSending, setSmsSending] = useState(false);

  const itemsForSelection = allItems ?? items;

  // Reset selection when section/search changes, not when page changes
  useEffect(() => {
    setSelectedItems(new Set());
  }, [selectionScopeKey]);

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

  const formatTimeGeorgian = (dateString: string) => {
    const date = new Date(dateString);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const statusLabels: Record<string, string> = {
    STOPPED: "გაჩერებული",
    IN_WAREHOUSE: "საწყობშია",
    RELEASED: "გაცემულია",
    REGION: "რეგიონი",
  };

  const statusColors: Record<string, string> = {
    STOPPED: "bg-white text-black border-1 border-black",
    IN_WAREHOUSE: "bg-white text-black border-1 border-black",
    RELEASED: "bg-white text-black border-1 border-black",
    REGION: "bg-white text-black border-1 border-black",
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === itemsForSelection.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(itemsForSelection.map((item) => item.id)));
    }
  };

  const handleBulkStatusChange = (newStatus: "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION") => {
    if (onBulkStatusChange && selectedItems.size > 0) {
      onBulkStatusChange(Array.from(selectedItems), newStatus);
      setSelectedItems(new Set());
    }
  };

  const handleOpenSmsModal = () => setSmsModalOpen(true);

  const handleSendBulkSms = async () => {
    const selected = itemsForSelection.filter((i) => selectedItems.has(i.id));
    const phones = selected
      .map((i) => (i.telefoni != null ? String(i.telefoni).trim() : ""))
      .filter((t) => t !== "");
    if (phones.length === 0) {
      toast.error("მონიშნულ ნივთებს არ აქვთ ტელეფონის ნომერი.");
      return;
    }
    if (!smsText.trim()) {
      toast.error("შეიყვანეთ შეტყობინების ტექსტი.");
      return;
    }
    setSmsSending(true);
    try {
      const res = await fetch("/api/sms/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: phones, text: smsText.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || data.error || "SMS გაგზავნა ვერ მოხერხდა");
        return;
      }
      if (data.failCount > 0) {
        toast.warning(`გაიგზავნა: ${data.successCount}, ვერ გაიგზავნა: ${data.failCount}`);
      } else {
        toast.success(`SMS წარმატებით გაიგზავნა ${data.successCount} მომხმარებელზე.`);
        setSmsModalOpen(false);
        setSmsText("");
        setSelectedItems(new Set());
      }
    } catch {
      toast.error("SMS გაგზავნა ვერ მოხერხდა");
    } finally {
      setSmsSending(false);
    }
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
            <h3 className="font-semibold text-black text-[16px] mb-1">{item.shtrikhkodi}</h3>
            <p className="text-black text-[16px]">{item.mimgebi}</p>
          </div>
          <span className={`inline-flex px-2 py-1 text-[16px] font-semibold rounded-full ${statusColors[item.status]}`}>
            {statusLabels[item.status]}
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-2 text-[16px]">
          <div className="flex items-center gap-2">
            <span className="text-black">გამომგზავნი:</span>
            <span className="text-black">{item.gamomcemeli}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">ტელეფონი:</span>
            <span className="text-black">{item.telefoni}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">წონა:</span>
            <span className="text-black">{item.tsona} kg</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">ქალაქი:</span>
            <span className="text-black">{item.kalaki}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">საქ.გადახდა:</span>
            <span className="text-black break-all">{item.sakGadakhda}</span>
          </div>
          {item.tarighi && (
            <div className="flex items-center gap-2">
              <span className="text-black">თარიღი:</span>
              <span className="text-black">{item.tarighi}</span>
            </div>
          )}
        </div>

        {onStatusChange && (
          <div>
            <label className="block text-[16px] text-black mb-1">სტატუსის შეცვლა</label>
            <select
              value={item.status}
              onChange={(e) => {
                const newStatus = e.target.value as "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION";
                onStatusChange(item.id, newStatus);
              }}
              className={`w-full px-3 py-2 text-[16px] font-semibold rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusColors[item.status]}`}
            >
              <option value="STOPPED">გაჩერებული</option>
              <option value="IN_WAREHOUSE">საწყობშია</option>
              <option value="RELEASED">გაცემულია</option>
              <option value="REGION">რეგიონი</option>
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
      {/* Bulk Actions */}
      {selectedItems.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3 flex items-center justify-between flex-wrap gap-2">
          <div className="text-[15px] font-medium text-gray-700">
            {selectedItems.size} ამანათი მონიშნულია
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleOpenSmsModal}
              className="flex items-center gap-2 px-3 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-[15px]"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              SMS გაგზავნა
            </button>
            {onBulkStatusChange && (
              <>
                <button
                  type="button"
                  onClick={() => handleBulkStatusChange("IN_WAREHOUSE")}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors text-[15px]"
                >
                  საწყობში
                </button>
                <select
                  onChange={(e) => handleBulkStatusChange(e.target.value as "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION")}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-[15px] font-medium text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>სტატუსის შეცვლა</option>
                  <option value="STOPPED">გაჩერებული</option>
                  <option value="IN_WAREHOUSE">საწყობშია</option>
                  <option value="RELEASED">გაცემულია</option>
                  <option value="REGION">რეგიონი</option>
                </select>
              </>
            )}
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 text-[15px]"
            >
              გაუქმება
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={smsModalOpen}
        onClose={() => !smsSending && setSmsModalOpen(false)}
        title="SMS გაგზავნა მონიშნულ მომხმარებლებზე"
      >
        <div className="space-y-4">
          <p className="text-[15px] text-gray-600">
            ტექსტი გაიგზავნება {itemsForSelection.filter((i) => selectedItems.has(i.id)).filter((i) => (i.telefoni ?? "").toString().trim()).length} მომხმარებელზე.
          </p>
          <textarea
            value={smsText}
            onChange={(e) => setSmsText(e.target.value)}
            placeholder="შეიყვანეთ შეტყობინების ტექსტი..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[15px] text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={smsSending}
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => !smsSending && setSmsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              გაუქმება
            </button>
            <button
              type="button"
              onClick={handleSendBulkSms}
              disabled={smsSending}
              className="px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {smsSending ? "იგზავნება..." : "გაგზავნა"}
            </button>
          </div>
        </div>
      </Modal>

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
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px] font-medium text-black uppercase tracking-wider w-12">
                    <input
                      type="checkbox"
                      checked={selectedItems.size === itemsForSelection.length && itemsForSelection.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px] font-medium text-black uppercase tracking-wider min-w-[150px]">
                    შტრიხ კოდი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[120px]">
                    გამომგზავნი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[120px]">
                    მიმღები
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[120px]">
                    ტელეფონი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[100px]">
                    წონა
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[150px]">
                    ქალაქი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[150px]">
                    თარიღი
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[140px]">
                    საქ.გადახდა
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[140px]">
                    საქ. გაცვლა
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-[15px]  font-medium text-black uppercase tracking-wider min-w-[140px]">
                    მოქმედებები
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${selectedItems.has(item.id) ? 'bg-blue-50' : ''}`}>
                    <td className="px-4 lg:px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  font-medium text-black  ">
                        {item.shtrikhkodi}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black ">
                        {item.gamomcemeli}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black ">
                        {item.mimgebi}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black break-all">
                        {item.telefoni}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black">
                        {item.tsona} kg
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black ">
                        {item.kalaki}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px]  text-black">
                        {item.tarighi}
                      </div>
                      <div className="text-[13px] text-gray-500 mt-1">
                        {item.tarighi}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      <div className="text-[15px] text-black break-all">
                        {item.sakGadakhda}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4">
                      {onStatusChange ? (
                        <select
                          value={item.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as "STOPPED" | "IN_WAREHOUSE" | "RELEASED" | "REGION";
                            onStatusChange(item.id, newStatus);
                          }}
                          className={`px-2 lg:px-3 py-1 text-[15px] font-semibold rounded-lg cursor-pointer  ${statusColors[item.status]} w-full max-w-[140px]`}
                        >
                          <option value="STOPPED">გაჩერებული</option>
                          <option value="IN_WAREHOUSE">საწყობშია</option>
                          <option value="RELEASED">გაცემულია</option>
                          <option value="REGION">რეგიონი</option>
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

"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Modal from "./Modal";
import { labelForStatus, optionsForCountry, type ItemStatus } from "../lib/statuses";
import { SMS_CODE_TOKEN, buildStatusSmsText } from "../lib/sms";
import { useLang, useT } from "./LanguageProvider";

function templateFromEditor(root: HTMLElement) {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (node instanceof HTMLElement && node.dataset.code != null) {
      out += SMS_CODE_TOKEN;
      return;
    }
    if (node instanceof HTMLBRElement) {
      out += "\n";
      return;
    }
    node.childNodes.forEach(walk);
  };
  root.childNodes.forEach(walk);
  return out;
}

function paintSmsEditor(root: HTMLElement, template: string, chipLabel: string) {
  root.replaceChildren();
  const parts = template.split(SMS_CODE_TOKEN);
  parts.forEach((part, index) => {
    root.append(document.createTextNode(part));
    if (index < parts.length - 1) {
      const chip = document.createElement("span");
      chip.dataset.code = "1";
      chip.contentEditable = "false";
      chip.className = "mx-0.5 inline-block cursor-default select-none rounded bg-gray-200 px-1.5 py-0.5 text-[13px] font-semibold text-gray-600";
      chip.textContent = chipLabel;
      root.append(chip);
    }
  });
}

function SmsTextEditor({
  value,
  onChange,
  disabled,
  chipLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  chipLabel: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const skipSync = useRef(false);

  useEffect(() => {
    if (!rootRef.current) return;
    if (skipSync.current) {
      skipSync.current = false;
      return;
    }
    paintSmsEditor(rootRef.current, value, chipLabel);
  }, [value, chipLabel]);

  return (
    <div
      ref={rootRef}
      role="textbox"
      aria-multiline="true"
      contentEditable={!disabled}
      suppressContentEditableWarning
      onInput={(event) => {
        const next = templateFromEditor(event.currentTarget);
        if (!next.includes(SMS_CODE_TOKEN)) {
          paintSmsEditor(event.currentTarget, value, chipLabel);
          return;
        }
        skipSync.current = true;
        onChange(next);
      }}
      className="min-h-40 w-full whitespace-pre-wrap rounded-lg border border-gray-300 px-3 py-2 text-[15px] leading-6 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}

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
  status: ItemStatus;
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
  onStatusChange?: (id: string, newStatus: ItemStatus) => void;
  onBulkStatusChange?: (ids: string[], newStatus: ItemStatus) => void;
  showEmptyMessage?: boolean;
  country?: "FRANCE" | "RUSSIA";
}

export default function InventoryList({ items, allItems, selectionScopeKey, onEdit, onDelete, onStatusChange, onBulkStatusChange, showEmptyMessage = true, country }: InventoryListProps) {
  const lang = useLang();
  const t = useT();
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

  const statusOptions = optionsForCountry(country, lang).map((section) => ({
    value: section.status,
    label: section.optionLabel,
  }));

  const statusClass = "bg-white text-black border-1 border-black";

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

  const handleBulkStatusChange = (newStatus: ItemStatus) => {
    if (onBulkStatusChange && selectedItems.size > 0) {
      onBulkStatusChange(Array.from(selectedItems), newStatus);
      setSelectedItems(new Set());
    }
  };

  const handleOpenSmsModal = () => {
    if (country === "RUSSIA") {
      const selected = itemsForSelection.filter((item) => selectedItems.has(item.id));
      const previewItem = selected.find((item) => (item.telefoni ?? "").toString().trim()) ?? selected[0];
      if (previewItem) {
        setSmsText(
          buildStatusSmsText(
            previewItem.status,
            SMS_CODE_TOKEN,
            previewItem.status === "REGION" ? previewItem.kalaki?.trim() : undefined,
            "RUSSIA",
            lang
          )
        );
      }
    }
    setSmsModalOpen(true);
  };

  const selectedForSms = itemsForSelection.filter((i) => selectedItems.has(i.id));
  const smsRecipientCount = selectedForSms.filter((i) => (i.telefoni ?? "").toString().trim()).length;

  const handleSendBulkSms = async () => {
    const selected = itemsForSelection.filter((i) => selectedItems.has(i.id));
    const phones = selected
      .map((i) => (i.telefoni != null ? String(i.telefoni).trim() : ""))
      .filter((t) => t !== "");
    if (phones.length === 0) {
      toast.error(t("noPhones"));
      return;
    }
    if (!smsText.trim()) {
      toast.error(t("enterSmsText"));
      return;
    }
    setSmsSending(true);
    try {
      const res = await fetch("/api/sms/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          country === "RUSSIA"
            ? { itemIds: selected.map((item) => item.id), text: smsText.trim(), lang }
            : { to: phones, text: smsText.trim() }
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.message || data.error || t("smsFailed"));
        return;
      }
      if (data.failCount > 0) {
        toast.warning(t("smsPartial", { success: data.successCount, fail: data.failCount }));
      } else {
        toast.success(t("smsSuccess", { count: data.successCount }));
        setSmsModalOpen(false);
        setSmsText("");
        setSelectedItems(new Set());
      }
    } catch {
      toast.error(t("smsFailed"));
    } finally {
      setSmsSending(false);
    }
  };

  if (items.length === 0) {
    if (!showEmptyMessage) return null;

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
        <p className="text-black text-[16px]">{t("emptyInventory")}</p>
        <p className="text-black text-[16px] mt-2">{t("addProductsHint")}</p>
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
          <span className={`inline-flex px-2 py-1 text-[16px] font-semibold rounded-full ${statusClass}`}>
            {labelForStatus(item.status, country, lang)}
          </span>
        </div>
        
        <div className="grid grid-cols-1 gap-2 text-[16px]">
          <div className="flex items-center gap-2">
            <span className="text-black">{t("sender")}:</span>
            <span className="text-black">{item.gamomcemeli}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">{t("phone")}:</span>
            <span className="text-black">{item.telefoni}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">{t("weight")}:</span>
            <span className="text-black">{item.tsona} kg</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">{t("city")}:</span>
            <span className="text-black">{item.kalaki}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-black">{t("payment")}:</span>
            <span className="text-black break-all">{item.sakGadakhda}</span>
          </div>
          {item.tarighi && (
            <div className="flex items-center gap-2">
              <span className="text-black">{t("date")}:</span>
              <span className="text-black">{item.tarighi}</span>
            </div>
          )}
        </div>

        {onStatusChange && (
          <div>
            <label className="block text-[16px] text-black mb-1">{t("changeStatus")}</label>
            <select
              value={item.status}
              onChange={(e) => {
                const newStatus = e.target.value as ItemStatus;
                onStatusChange(item.id, newStatus);
              }}
              className={`w-full px-3 py-2 text-[16px] font-semibold rounded-lg cursor-pointer focus:ring-2 focus:ring-blue-500 ${statusClass}`}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
          {onEdit && (
            <button
              onClick={() => onEdit(item.id)}
              className="bg-green-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-[16px]"
            >
              {t("edit")}
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item.id)}
              className="bg-red-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-[16px] w-10 h-10 flex items-center justify-center"
              title={t("delete")}
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
            {t("selectedCount", { count: selectedItems.size })}
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
              {t("sendSms")}
            </button>
            {onBulkStatusChange && (
              <>
              
                <select
                  onChange={(e) => handleBulkStatusChange(e.target.value as ItemStatus)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-[15px] font-medium text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  defaultValue=""
                >
                  <option value="" disabled>{t("changeStatus")}</option>
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </>
            )}
            <button
              onClick={() => setSelectedItems(new Set())}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 text-[15px]"
            >
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={smsModalOpen}
        onClose={() => !smsSending && setSmsModalOpen(false)}
        title={t("smsTitle")}
      >
        <div className="space-y-4">
          <p className="text-[15px] text-gray-600">
            {t("smsWillSend", { count: smsRecipientCount })}
          </p>
          {country === "RUSSIA" ? (
            <SmsTextEditor
              value={smsText}
              onChange={setSmsText}
              disabled={smsSending}
              chipLabel={lang === "ru" ? "код" : "კოდი"}
            />
          ) : (
            <textarea
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              placeholder={t("smsPlaceholder")}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[15px] text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={smsSending}
            />
          )}
          {country === "RUSSIA" && (
            <p className="text-[14px] text-gray-500">{t("smsCodeNote")}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => !smsSending && setSmsModalOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              {t("cancel")}
            </button>
            <button
              type="button"
              onClick={handleSendBulkSms}
              disabled={smsSending}
              className="px-4 py-2 bg-green-700 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {smsSending ? t("sending") : t("send")}
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
                    {t("barcode")}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[120px]">
                    {t("sender")}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[120px]">
                    {t("receiver")}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[120px]">
                    {t("phone")}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[100px]">
                    {t("weight")}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[150px]">
                    {t("city")}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[150px]">
                    {t("date")}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[140px]">
                    {t("payment")}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-left text-[15px]  font-medium text-black uppercase tracking-wider min-w-[140px]">
                    {t("statusColumn")}
                  </th>
                  <th className="px-4 lg:px-6 py-3 text-right text-[15px]  font-medium text-black uppercase tracking-wider min-w-[140px]">
                    {t("actions")}
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
                            const newStatus = e.target.value as ItemStatus;
                            onStatusChange(item.id, newStatus);
                          }}
                          className={`px-2 lg:px-3 py-1 text-[15px] font-semibold rounded-lg cursor-pointer  ${statusClass} w-full ${country === "RUSSIA" ? "max-w-[280px]" : "max-w-[140px]"}`}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex px-2 py-1 text-[15px] font-semibold rounded-full ${statusClass}`}
                        >
                          {labelForStatus(item.status, country, lang)}
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
                            {t("edit")}
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(item.id)}
                            className="bg-red-600 cursor-pointer  font-bold text-white px-3 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-[20px] w-10 h-10 flex items-center justify-center"
                            title={t("delete")}
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

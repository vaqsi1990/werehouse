"use client";

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export default function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const menuItems = [
    {
      id: "received",
      label: "შემოსული ნივთები",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "in-transit",
      label: "გზაში მყოფი",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      id: "in-warehouse",
      label: "საწყობში მყოფი",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
    },
    {
      id: "shipped",
      label: "გაცემული",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
  ];

  return (
    <aside className="w-72 bg-blue-900 text-white min-h-screen fixed left-0 top-0 z-10">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-8">
          <svg
            className="w-8 h-8"
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
          <h1 className="text-xl font-bold">საწყობი</h1>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-lg rounded-lg transition-colors ${
                activeSection === item.id
                  ? "bg-blue-700 text-white shadow-md font-semibold"
                  : "text-blue-100 hover:bg-blue-800 hover:text-white"
              }`}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              <span className="font-medium text-left">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-blue-800">
        <p className="text-xs text-blue-300 text-center">
          საწყობის მართვა © 2024
        </p>
      </div>
    </aside>
  );
}


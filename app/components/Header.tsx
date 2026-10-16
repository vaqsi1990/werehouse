"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onMenuClick: () => void;
  country?: "FRANCE" | "RUSSIA";
  onChangeCountry?: () => void;
}

export default function Header({ onMenuClick, country, onChangeCountry }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    if (window.confirm("დარწმუნებული ხართ რომ გსურთ გასვლა?")) {
      localStorage.removeItem(`authenticated-${country ?? "FRANCE"}`);
      if (country !== "RUSSIA") {
        localStorage.removeItem("authenticated");
      }
      router.refresh();
      window.location.reload();
    }
  };

  return (
    <header className="bg-white shadow-md border-b border-gray-200">
      <div className="px-2 sm:px-4 lg:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Menu toggle button */}
            <button
              onClick={onMenuClick}
              className="p-2 shrink-0 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
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
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
            <Image src="/logo.jpg" alt="logo" className="w-8 h-8 sm:w-10 sm:h-10 shrink-0" width={100} height={100} />
            <h2 className="truncate text-base sm:text-xl lg:text-2xl font-bold text-gray-800">დეშბორდი</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 shrink-0">
            {onChangeCountry && (
              <button
                onClick={onChangeCountry}
                className="flex items-center gap-2 px-2 sm:px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                title="ქვეყნის შეცვლა"
              >
                <span className="hidden sm:inline">
                  {country === "RUSSIA" ? "რუსეთი" : "საფრანგეთი"}
                </span>
                <span className="sm:hidden">{country === "RUSSIA" ? "RU" : "FR"}</span>
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-2 sm:px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
              title="გასვლა"
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
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span className="hidden sm:inline">გასვლა</span>
            </button>
            <div className="flex items-center shrink-0">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                ა
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

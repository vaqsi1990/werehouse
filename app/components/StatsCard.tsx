interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
}

export default function StatsCard({ title, value, icon, color = "blue" }: StatsCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    yellow: "bg-yellow-100 text-yellow-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 lg:p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-sm lg:text-[16px] font-medium truncate">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`${colorClasses[color as keyof typeof colorClasses]} p-2 lg:p-3 rounded-lg flex-shrink-0 ml-2`}>
          {icon}
        </div>
      </div>
    </div>
  );
}


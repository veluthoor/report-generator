'use client';

type ProgressRingProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label: string;
};

export function ProgressRing({ 
  percentage, 
  size = 200, 
  strokeWidth = 20, 
  color = '#ffffff',
  label 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-black text-white">{percentage}%</span>
      </div>
      <p className="text-white text-lg mt-4 font-semibold">{label}</p>
    </div>
  );
}

type BarChartProps = {
  data: { label: string; value: number; color?: string }[];
  maxValue?: number;
};

export function BarChart({ data, maxValue }: BarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value));
  
  return (
    <div className="w-full space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between text-white text-sm">
            <span className="font-semibold">{item.label}</span>
            <span className="font-bold">{item.value}</span>
          </div>
          <div className="w-full bg-white bg-opacity-20 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                item.color || 'bg-white'
              }`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

type ComparisonGridProps = {
  items: { icon: string; value: string; label: string }[];
};

export function ComparisonGrid({ items }: ComparisonGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 w-full">
      {items.map((item, index) => (
        <div
          key={index}
          className="bg-white bg-opacity-10 backdrop-blur-sm rounded-2xl p-6 text-center border-2 border-white border-opacity-20"
        >
          <div className="text-4xl mb-2">{item.icon}</div>
          <div className="text-3xl font-black text-white mb-1">{item.value}</div>
          <div className="text-sm text-white opacity-80">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

type StatCardProps = {
  icon: string;
  value: string;
  label: string;
  sublabel?: string;
};

export function StatCard({ icon, value, label, sublabel }: StatCardProps) {
  return (
    <div className="bg-white bg-opacity-15 backdrop-blur-sm rounded-3xl p-8 border-2 border-white border-opacity-20">
      <div className="text-6xl mb-4">{icon}</div>
      <div className="text-6xl font-black text-white mb-2">{value}</div>
      <div className="text-xl font-semibold text-white opacity-90">{label}</div>
      {sublabel && (
        <div className="text-sm text-white opacity-70 mt-2">{sublabel}</div>
      )}
    </div>
  );
}

type LeaderboardProps = {
  position: number;
  total: number;
  category: string;
};

export function Leaderboard({ position, total, category }: LeaderboardProps) {
  const percentage = total > 0 ? ((total - position + 1) / total) * 100 : 0;
  
  return (
    <div className="w-full bg-white bg-opacity-10 backdrop-blur-sm rounded-3xl p-8 border-2 border-white border-opacity-20">
      <div className="text-center mb-6">
        <div className="text-white text-xl opacity-80 mb-2">Your Rank</div>
        <div className="text-8xl font-black text-white">#{position}</div>
        <div className="text-white text-lg opacity-80 mt-2">out of {total}</div>
      </div>
      
      <div className="relative w-full h-4 bg-white bg-opacity-20 rounded-full overflow-hidden">
        <div
          className="absolute h-full bg-gradient-to-r from-yellow-400 to-yellow-200 transition-all duration-1000"
          style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
        <div
          className="absolute h-full w-1 bg-white shadow-lg transition-all duration-1000"
          style={{ left: `${Math.min(100, Math.max(0, percentage))}%` }}
        />
      </div>
      
      <div className="text-center mt-6 text-white text-lg font-semibold">
        Top {Math.round(percentage)}% in {category}
      </div>
    </div>
  );
}

import React from "react";
import { LeaderboardUser } from "../types";
import { Target, Trophy, ArrowRight, Sparkles, Heart, Gem } from "lucide-react";

interface StatsBarProps {
  xp: number;
  gems: number;
  hearts: number;
  streak: number;
  leaderboard: LeaderboardUser[];
  activeCourseName: string;
  doubleXpActive: boolean;
  onRefillHearts: () => void;
  dailyXp?: Record<string, number>;
}

export default function StatsBar({
  xp,
  gems,
  hearts,
  streak,
  leaderboard,
  activeCourseName,
  doubleXpActive,
  onRefillHearts,
  dailyXp = {}
}: StatsBarProps) {
  // Daily quest progress metrics (Duolingo style 50 XP goal as requested in progress bars)
  const questXPGoal = 50;
  
  const todayKey = new Date().toISOString().split("T")[0];
  const todayXP = dailyXp[todayKey] || 0;
  const questProgress = Math.min(100, Math.round((todayXP / questXPGoal) * 100));

  // Weekly activity bar chart entries
  const dayLabels = ["Di", "Lu", "Ma", "Me", "Je", "Ve", "Sa"];
  const weeklyActivity = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i)); // 6 days ago, 5 days ago, etc. ending with today
    const key = d.toISOString().split("T")[0];
    const val = dailyXp[key] || 0;
    const isToday = i === 6;
    const percentage = Math.min(100, Math.round((val / questXPGoal) * 100));
    
    return {
      label: dayLabels[d.getDay()],
      xp: val,
      percentage: `${percentage}%`,
      active: isToday,
      key
    };
  });


  return (
    <aside className="w-80 p-6 flex flex-col gap-6 bg-[#fdfdfd] h-screen overflow-y-auto border-l-2 border-[#E5E5E5] shrink-0 sticky top-0">
      
      {/* Vies, Gemmes quick status floating panel if hearts are low */}
      {hearts < 4 && (
        <div className="bg-rose-50 border-2 border-rose-100 p-4 rounded-3xl flex flex-col gap-2 shadow-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500 shrink-0" />
            <span className="text-xs font-black text-rose-800 uppercase tracking-wide">Vies faibles ({hearts}/5)</span>
          </div>
          <p className="text-[11px] text-rose-600 font-medium">Rechargez vos cœurs instantanément pour continuer à tester votre savoir sans blocage !</p>
          <button
            onClick={onRefillHearts}
            className="w-full text-center py-2 bg-rose-500 hover:bg-rose-600 active:translate-y-0.5 text-white font-black text-[10px] uppercase rounded-xl border-b-2 border-rose-700 cursor-pointer tracking-wider block transition-all"
          >
            Acheter 5 ❤️ (50 💎)
          </button>
        </div>
      )}

      {/* CARD 1: PROGRESSION XP */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#E5E5E5] shadow-sm flex flex-col">
        {/* Card Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase font-sans">
            PROGRESSION XP
          </span>
          <span className="text-[11px] font-black text-[#1CB0F6] uppercase font-sans">
            {xp} XP ce cours
          </span>
        </div>

        {/* Info Box with Target Bullet */}
        <div className="flex items-center gap-3.5 mb-5 bg-[#FDFDFD] p-1">
          {/* Circular Target Icon Container */}
          <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 border-b-2 border-orange-200 shrink-0">
            <Target className="w-6 h-6 stroke-[3]" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-[13px] font-black text-[#4B4B4B] font-sans leading-none">
              Objectif quotidien
            </h4>
            <div className="mt-2 w-full bg-[#E5E5E5] h-2.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#FF9600] h-full rounded-full transition-all duration-500"
                style={{ width: `${questProgress}%` }}
              ></div>
            </div>
            <p className="text-[10px] text-gray-400 font-bold mt-1.5 font-sans">
              {todayXP} / {questXPGoal} XP aujourd'hui
            </p>
          </div>
        </div>

        {/* Weekly Activities Columns Bar Chart */}
        <div className="grid grid-cols-7 gap-1 px-1 mt-1">
          {weeklyActivity.map((day, idx) => (
            <div 
              key={idx} 
              className="flex flex-col items-center justify-end gap-2 h-20 group relative cursor-help"
              title={`${day.label} : ${day.xp} XP`}
            >
              {/* Tooltip on Hover */}
              <div className="absolute bottom-16 bg-[#1F2937] text-white text-[9px] font-black py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none shadow-md">
                {day.xp} XP
              </div>

              {/* Bar background */}
              <div className="w-5 bg-gray-100 rounded-lg h-14 flex items-end overflow-hidden relative border border-gray-100/50">
                <div 
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    day.active 
                      ? "bg-[#FF9600] border-t-2 border-[#d97706]" 
                      : (day.xp > 0) ? "bg-violet-400 border-t-2 border-violet-500" : "bg-neutral-300"
                  }`}
                  style={{ height: day.percentage }}
                ></div>
              </div>
              <span className={`text-[10px] font-black ${day.active ? "text-[#FF9600]" : (day.xp > 0 ? "text-violet-600 font-extrabold" : "text-gray-400")}`}>
                {day.label}
              </span>
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
}

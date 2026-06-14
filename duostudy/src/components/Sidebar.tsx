import React from "react";
import { 
  Map, 
  Upload, 
  Layers, 
  Pencil, 
  Grid, 
  Trophy, 
  Sparkles,
  User,
  Gem
} from "lucide-react";
import DuoStudyLogo from "./DuoStudyLogo";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hearts: number;
  gems: number;
  streak: number;
  xp: number;
  user?: any;
}

export default function Sidebar({ activeTab, setActiveTab, hearts, gems, streak, xp, user }: SidebarProps) {
  const learningItems = [
    { id: "learn", label: "Cours", icon: Map, color: "text-[#58cc02]" },
    { id: "add-course", label: "Importer", icon: Upload, color: "text-[#1899d6]" },
    { id: "quiz", label: "Quiz", icon: Pencil, color: "text-amber-500" },
  ];

  const trackingItems = [
    { id: "profile", label: "Tableau de bord", icon: Grid, color: "text-sky-500" },
    { id: "shop", label: "Boutique", icon: Gem, color: "text-amber-500" },
  ];

  // Format clean name and initials
  const rawName = user ? (user.displayName || user.email?.split("@")[0] || "Étudiant") : "Alex Student";
  const formattedName = rawName
    .split(/[._\-+]/)
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
    .replace(/[0-9]/g, "");

  const userEmail = user?.email || "";
  const isUserAdmin = userEmail && (userEmail.toLowerCase() === "lou.mouramaignan@gmail.com" || userEmail.toLowerCase() === "lou.mouramaignan1@gmail.com");

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };
  const initials = getInitials(formattedName);

  return (
    <aside className="w-64 border-r-2 border-[#E5E5E5] bg-white p-4 flex flex-col justify-between h-screen sticky top-0 shrink-0">
      <div>
        {/* Brand Logo & Name */}
        <div className="px-3 py-1">
          <DuoStudyLogo size="md" onClick={() => setActiveTab("learn")} />
        </div>

        {/* Quick Stats Grid under Logo */}
        <div className="grid grid-cols-2 gap-2 mt-3 mb-5 px-1">
          {/* XP Total Box */}
          <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-black text-violet-500 font-sans leading-none">
              {xp}
            </span>
            <span className="text-[8px] font-black text-gray-400 mt-1 uppercase tracking-tight font-sans">
              XP TOTAL
            </span>
          </div>

          {/* Niveau Box */}
          <div className="bg-white border-2 border-[#E5E5E5] rounded-2xl p-1.5 flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-black text-[#1CB0F6] font-display leading-none">
              Niv.1
            </span>
            <span className="text-[8px] font-black text-gray-400 mt-1 uppercase tracking-tight font-sans">
              NIVEAU
            </span>
          </div>
        </div>

        {/* Section APPRENDRE */}
        <div className="mt-2">
          <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase px-4 font-sans block mb-1.5">
            APPRENDRE
          </span>
          <nav className="space-y-2.5">
            {learningItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13px] font-black tracking-wide transition-all duration-100 ${
                    isActive
                      ? "bg-[#58cc02]/15 border-2 border-[#58cc02] text-[#46a302]"
                      : "text-gray-500 hover:bg-[#F7F7F7] hover:text-slate-800 border-2 border-transparent"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-[#58cc02]" : "text-gray-400"}`} />
                  <span className="font-sans pr-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section SUIVI */}
        <div className="mt-4">
          <span className="text-[10px] font-black text-gray-400 tracking-wider uppercase px-4 font-sans block mb-1.5">
            SUIVI
          </span>
          <nav className="space-y-2.5">
            {trackingItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-[13px] font-black tracking-wide transition-all duration-100 ${
                    isActive
                      ? "bg-[#58cc02]/15 border-2 border-[#58cc02] text-[#46a302]"
                      : "text-gray-500 hover:bg-[#F7F7F7] hover:text-slate-800 border-2 border-transparent"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? "text-[#58cc02]" : "text-gray-400"}`} />
                  <span className="font-sans pr-1 text-left">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Section ADMINISTRATION */}
        {isUserAdmin && (
          <div className="mt-4 border-t-2 border-slate-100 pt-3">
            <span className="text-[10px] font-black text-rose-500 tracking-wider uppercase px-4 font-sans block mb-1.5">
              ADMINISTRATION
            </span>
            <nav className="space-y-2">
              <button
                id="sidebar-tab-admin-users"
                onClick={() => setActiveTab("admin-users")}
                className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-[12px] font-black tracking-wide transition-all duration-100 ${
                  activeTab === "admin-users"
                    ? "bg-rose-500/10 border-2 border-rose-500 text-rose-600"
                    : "text-gray-500 hover:bg-[#F7F7F7] hover:text-slate-800 border-2 border-transparent"
                }`}
              >
                <Layers className={`w-4 h-4 shrink-0 ${activeTab === "admin-users" ? "text-rose-500" : "text-gray-400"}`} />
                <span className="font-sans pr-1 text-left">Abonnés & Métriques</span>
              </button>
              <button
                id="sidebar-tab-admin-config"
                onClick={() => setActiveTab("admin-config")}
                className={`w-full flex items-center gap-3.5 px-4 py-2 rounded-xl text-[12px] font-black tracking-wide transition-all duration-100 ${
                  activeTab === "admin-config"
                    ? "bg-rose-500/10 border-2 border-rose-500 text-rose-600"
                    : "text-gray-500 hover:bg-[#F7F7F7] hover:text-slate-800 border-2 border-transparent"
                }`}
              >
                <Sparkles className={`w-4.5 h-4.5 shrink-0 ${activeTab === "admin-config" ? "text-rose-500" : "text-gray-400"}`} />
                <span className="font-sans pr-1 text-left">GA4 & Config Système</span>
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Footer - Dynamic user display card */}
      <div 
        onClick={() => setActiveTab("profile")}
        className="pt-3 border-t-2 border-[#E5E5E5] flex items-center gap-2.5 px-1 py-1.5 cursor-pointer hover:bg-slate-50 rounded-2xl transition-all duration-150"
        title="Voir mes statistiques & succès"
      >
        {user?.photoURL ? (
          <img 
            src={user.photoURL} 
            alt="Avatar" 
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover border-2 border-[#58cc02]"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-[#58cc02]/10 border-2 border-[#58cc02]/25 flex items-center justify-center text-sm font-black text-[#58cc02] shrink-0 select-none">
            {initials}
          </div>
        )}
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-black text-[#4B4B4B] truncate font-sans leading-tight">
            {formattedName}
          </span>
          <span className="text-[9px] font-black text-[#58cc02] uppercase tracking-wider font-sans leading-none mt-1">
            {user ? "Étudiant Actif" : "Évaluation Gratuite"}
          </span>
        </div>
      </div>
    </aside>
  );
}

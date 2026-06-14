import React from "react";
import { ShopItem } from "../types";
import { Gem, Heart, ShieldAlert, Sparkles, Zap, Snowflake } from "lucide-react";

interface ShopTabProps {
  gems: number;
  onBuyItem: (itemId: string, cost: number) => void;
  shopItems: ShopItem[];
  hearts: number;
  streakFreezeActive: boolean;
  doubleXpActive: boolean;
}

export default function ShopTab({
  gems,
  onBuyItem,
  shopItems,
  hearts,
  streakFreezeActive,
  doubleXpActive
}: ShopTabProps) {

  // Helper to determine icon visual outline
  const getIconElement = (iconName: string) => {
    switch (iconName) {
      case "❤️":
        return <Heart className="w-8 h-8 text-rose-500 fill-rose-500 shrink-0" />;
      case "❄️":
        return <Snowflake className="w-8 h-8 text-sky-400 shrink-0" />;
      case "⚡":
        return <Zap className="w-8 h-8 text-amber-400 fill-amber-400 shrink-0 animate-bounce" />;
      default:
        return <span className="text-3xl shrink-0">🔮</span>;
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-6 px-4">
      
      {/* Upper Title Area */}
      <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-6 rounded-3xl border-2 border-[#E5E5E5] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#DDF4FF] text-[#1CB0F6] rounded-2xl border-2 border-[#84D8FF]">
            <Gem className="w-6 h-6 text-[#1CB0F6] fill-[#1CB0F6]" />
          </div>
          <div>
            <h1 className="text-xl font-black font-display text-[#4B4B4B]">Boutique de DuoStudy</h1>
            <p className="text-xs text-gray-500 font-medium">Dépensez vos gemmes accumulées grâce à la régularité de vos révisions de cours !</p>
          </div>
        </div>

        {/* Current status Gems count */}
        <div className="bg-slate-50 px-4 py-2.5 rounded-2xl border-2 border-[#E5E5E5] flex items-center gap-2 select-none shrink-0 text-right">
          <span className="text-sm font-black text-gray-400 uppercase">SOLDE</span>
          <div className="flex items-center gap-1">
            <Gem className="w-5 h-5 text-[#1CB0F6] fill-[#1CB0F6]" />
            <span className="text-lg font-black text-[#1CB0F6]">{gems}</span>
          </div>
        </div>
      </div>

      {/* Grid structure items for purchase */}
      <div className="space-y-4">
        {shopItems.map((item) => {
          const isAffordable = gems >= item.cost;
          
          // Check if item already satisfies active state
          let activeLabel = "";
          let isDisabled = false;

          if (item.id === "shop-refill" && hearts >= 5) {
            activeLabel = "Vos vies sont déjà pleines (5/5) ❤️";
            isDisabled = true;
          } else if (item.id === "shop-multiplier" && doubleXpActive) {
            activeLabel = "Boost Double XP Activé ! ⚡";
            isDisabled = true;
          }

          return (
            <div 
              key={item.id} 
              className="bg-white p-5 rounded-3xl border-2 border-[#E5E5E5] hover:border-[#1CB0F6] transition-colors flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm"
            >
              
              {/* Product details */}
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border-2 border-[#E5E5E5] shrink-0">
                  {getIconElement(item.icon)}
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#4B4B4B]">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 max-w-md leading-relaxed font-medium">{item.description}</p>
                  
                  {activeLabel && (
                    <span className="inline-block mt-2 text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 border-2 border-emerald-200 text-emerald-600">
                      {activeLabel}
                    </span>
                  )}
                </div>
              </div>

              {/* Purchase triggers actions */}
              <div className="shrink-0 w-full sm:w-auto">
                <button
                  onClick={() => onBuyItem(item.id, item.cost)}
                  disabled={isDisabled || !isAffordable}
                  className={`w-full sm:w-auto px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border-b-4 transition-all active:translate-y-1 active:border-b-0 cursor-pointer flex items-center justify-center gap-2 select-none ${
                    isDisabled
                      ? "bg-slate-100 border-[#E5E5E5] text-gray-400 cursor-not-allowed border-none translate-y-0.5"
                      : isAffordable
                        ? "bg-[#1CB0F6] border-[#1079ab] text-white hover:bg-[#20a3e1]"
                        : "bg-slate-200 border-slate-300 text-gray-400 cursor-not-allowed border-none translate-y-0.5"
                  }`}
                >
                  <span className="flex items-center gap-1">
                    ACHETER POUR {item.cost}
                    <Gem className="w-3.5 h-3.5 text-sky-400 fill-sky-400 inline shrink-0" />
                  </span>
                </button>
                
                {!isDisabled && !isAffordable && (
                  <p className="text-center text-[10px] text-rose-500 font-bold mt-1.5 uppercase tracking-tighter">
                    Solde de gemmes insuffisant 💔
                  </p>
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Bonus chest details */}
      <div className="bg-violet-50 border-2 border-violet-100 p-5 rounded-3xl mt-8 flex items-start gap-4">
        <Sparkles className="w-6 h-6 text-violet-500 shrink-0 mt-0.5 animate-pulse" />
        <div>
          <h4 className="text-xs font-black text-violet-900 uppercase font-display leading-tight">Comment obtenir des gemmes gratuites ?</h4>
          <p className="text-[11px] text-violet-800 mt-1 leading-relaxed font-medium">
            Pas besoin de carte bancaire ! Chaque fois que vous complétez avec succès une leçon d'étude, vous remportez <strong>+15 gemmes</strong>. En réalisant vos quêtes quotidiennes ou en validant vos objectifs, vous ouvrez d'autres coffres au trésor remplis de gemmes gratuites ! Un vrai tuteur personnel 100% libre et accessible.
          </p>
        </div>
      </div>

    </div>
  );
}

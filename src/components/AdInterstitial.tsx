import React, { useState, useEffect } from "react";
import { X, Sparkles, Volume2, ShieldAlert } from "lucide-react";
import AdBlock from "./AdBlock";

interface AdInterstitialProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  triggerContext?: "creation" | "completion";
}

export default function AdInterstitial({ 
  isOpen, 
  onClose, 
  title = "Préparation du parcours IA...", 
  triggerContext = "creation" 
}: AdInterstitialProps) {
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const [noAdsBought, setNoAdsBought] = useState(false);

  useEffect(() => {
    // Read user progress cache to see if No-Ads is activated
    const progressBackup = localStorage.getItem("duostudy_user_progress");
    if (progressBackup) {
      try {
        const parsed = JSON.parse(progressBackup);
        if (parsed.noAdsActive) {
          setNoAdsBought(true);
        }
      } catch (e) {
        // Safe skip
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    // Reset back
    setCountdown(5);
    setCanSkip(false);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  // If already loaded and they purchased "No-Ads", immediately bypass
  useEffect(() => {
    if (isOpen && noAdsBought) {
      onClose();
    }
  }, [isOpen, noAdsBought, onClose]);

  if (!isOpen || noAdsBought) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/90 flex items-center justify-center p-4 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col items-center text-center">
        {/* AdSense watermark background badge */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Header line context */}
        <div className="w-full flex items-center justify-between mb-6 pb-4 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider bg-slate-800 px-3 py-1 rounded-full text-slate-300">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping"></span>
            Message Publicitaire
          </div>
          <span className="text-[10px] font-mono text-slate-500">
            Google AdSense Interstitiel
          </span>
        </div>

        {/* Dynamic promotional title */}
        <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-display mb-1">
          {triggerContext === "creation" 
            ? "🔬 Votre parcours se prépare..." 
            : "🏆 Félicitations pour votre session !"}
        </span>
        <h3 className="text-xl font-black text-white font-display leading-tight mb-2">
          {title}
        </h3>
        
        {/* Sub-text explanation */}
        <p className="text-[11px] text-slate-400 leading-relaxed max-w-sm mb-6">
          La publicité soutient directement l'hébergement gratuit et les coûts d'appels à l'API Gemini pour DuoStudy.
        </p>

        {/* High-fidelity responsive square advertisement container block */}
        <div className="w-full bg-slate-950/80 p-4 rounded-2xl border border-slate-800 mb-6 flex items-center justify-center min-h-[250px]">
          <AdBlock type="rectangle" />
        </div>

        {/* Bottom actions, countdown & Skip button */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-bold">
              {canSkip ? "Prêt !" : `Fermeture de l'annonce dans :`}
            </span>
            {!canSkip && (
              <span className="h-6 w-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-[#58cc02] font-mono">
                {countdown}
              </span>
            )}
          </div>

          {canSkip ? (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-[#58cc02] hover:bg-[#61df02] active:translate-y-0.5 text-white text-xs font-black rounded-xl border-b-4 border-[#388301] uppercase tracking-wider w-full sm:w-auto transition-all cursor-pointer shadow-md"
            >
              Passer la Publicité ➔
            </button>
          ) : (
            <button
              disabled
              className="px-6 py-2.5 bg-slate-800 text-slate-500 text-xs font-black rounded-xl border-b-4 border-slate-900 uppercase tracking-wider w-full sm:w-auto cursor-not-allowed select-none"
            >
              Passer la Publicité ({countdown}s)
            </button>
          )}
        </div>

        {/* Gamified suggestion to buy no-ads */}
        <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 font-medium bg-slate-950/30 px-3 py-1.5 rounded-xl border border-slate-800/40">
          <span>💡 Marre des pubs ?</span>
          <span className="font-extrabold text-[#1CB0F6]">Désactivez les avis de parrainage</span>
          <span>dans la Boutique pour seulement 150 💎 !</span>
        </div>
      </div>
    </div>
  );
}

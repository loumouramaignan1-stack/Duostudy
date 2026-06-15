import React, { useEffect, useState } from "react";
import { Sparkles, HelpCircle } from "lucide-react";

interface AdBlockProps {
  /**
   * Type of ad display block
   * - "horizontal": Banner layout like 728x90 leaderboard
   * - "rectangle": Box layout like 300x250 square ad
   * - "banner": Standard smaller mobile/general banner
   */
  type?: "horizontal" | "rectangle" | "banner";
  /** Optional customized Google AdSense Slot ID */
  slot?: string;
  /** Optional customized Google AdSense Client ID */
  client?: string;
}

export default function AdBlock({ type = "horizontal", slot = "1234567890", client }: AdBlockProps) {
  // Check if no-ads is bought or active
  const [noAdsEnabled, setNoAdsEnabled] = useState(false);
  const [adsenseClient, setAdsenseClient] = useState("ca-pub-8162271832525640"); // Default client is updated with user's pub ID
  const [adsenseSlot, setAdsenseSlot] = useState(slot);
  const [isAdBlockerActive, setIsAdBlockerActive] = useState(false);

  useEffect(() => {
    // Read cached preferences
    let hasNoAds = false;
    const progressBackup = localStorage.getItem("duostudy_user_progress");
    if (progressBackup) {
      try {
        const parsed = JSON.parse(progressBackup);
        if (parsed.noAdsActive) {
          setNoAdsEnabled(true);
          hasNoAds = true;
        }
      } catch (e) {
        // Safe fallback
      }
    }

    // Read stored AdSense credentials
    let currentClient = "ca-pub-8162271832525640";
    const storedClient = localStorage.getItem("duostudy_adsense_client");
    if (storedClient) {
      setAdsenseClient(storedClient);
      currentClient = storedClient;
    }
    const storedSlot = localStorage.getItem("duostudy_adsense_slot");
    if (storedSlot) {
      setAdsenseSlot(storedSlot);
    }

    // Dynamic injection of the Google AdSense Core Script tag
    if (currentClient && currentClient.startsWith("ca-pub-") && !hasNoAds) {
      const scriptId = "google-adsense-script-loader";
      if (!document.getElementById(scriptId)) {
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${currentClient}`;
        script.crossOrigin = "anonymous";
        script.async = true;
        document.head.appendChild(script);
      }
    }

    // Detect if adsbygoogle script is loaded, otherwise simulates fallback container
    const isLiveAdScriptPresent = !!(window as any).adsbygoogle;
    if (isLiveAdScriptPresent) {
      try {
        ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
      } catch (e) {
        console.warn("AdSense trigger failed or initialized. Safe placeholder displayed.", e);
      }
    }
  }, []);

  if (noAdsEnabled) {
    return null; // Return nothing if the user bought the "No Ads Pass" with Gems!
  }

  // Get responsive classes matching selected layout type
  const getLayoutClasses = () => {
    switch (type) {
      case "rectangle":
        return "w-full max-w-[300px] h-[250px] mx-auto";
      case "banner":
        return "w-full h-[60px] max-w-[468px] mx-auto";
      case "horizontal":
      default:
        return "w-full h-[90px] max-w-4xl mx-auto";
    }
  };

  // Simulated High-Fidelity Ad Content to maximize premium craft visual feel
  const renderSimulatedAd = () => {
    if (type === "rectangle") {
      return (
        <div className="w-full h-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-5 flex flex-col justify-between items-center text-center relative overflow-hidden group shadow-sm">
          {/* Glowing element */}
          <div className="absolute -top-12 -left-12 w-24 h-24 bg-[#58cc02]/20 rounded-full blur-2xl group-hover:bg-[#58cc02]/30 transition-all duration-300"></div>
          
          <div className="w-full flex justify-between items-center z-10">
            <span className="text-[8px] font-black tracking-widest text-[#58cc02] uppercase bg-[#58cc02]/10 px-2.5 py-0.5 rounded-full">
              Sponsorisé
            </span>
            <span className="text-[8px] font-bold text-slate-400 font-mono">
              Google AdSense ID: {adsenseClient.substring(0, 10)}...
            </span>
          </div>

          <div className="my-2 z-10">
            <div className="text-lg font-black text-white tracking-tight leading-tight">
              🦉 Devenez Premium !
            </div>
            <p className="text-[10px] text-slate-300 font-medium leading-normal mt-1.5 max-w-[180px] mx-auto">
              Soutenez l'hébergement gratuit de notre IA de révision espacée.
            </p>
          </div>

          <div className="w-full z-10">
            <button className="w-full py-2 bg-[#58cc02] hover:bg-[#61df02] active:scale-[0.98] transition-all text-white text-[10px] font-black rounded-xl uppercase tracking-wider shadow-sm">
              Débloquer DuoStudy
            </button>
            <div className="text-[8px] text-slate-500 mt-1.5 font-bold">
              Ou achetez le "Pass Sans Pubs" pour 150 💎 !
            </div>
          </div>
        </div>
      );
    }

    if (type === "banner") {
      return (
        <div className="w-full h-[60px] bg-sky-950 border-2 border-sky-900 rounded-2xl px-4 flex items-center justify-between text-left relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#1CB0F6] flex items-center justify-center text-lg shadow-sm">
              💎
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-white leading-tight">Gagnez des cœurs gratuits !</div>
              <p className="text-[9px] text-sky-200 mt-0.5 leading-none">Visitez nos partenaires pour recharger votre jauge de vies.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <span className="text-[7px] font-bold bg-sky-500/10 border border-sky-400/20 text-sky-300 px-1.5 py-0.5 rounded-full tracking-wider uppercase">Google Ads</span>
            <span className="text-[8px] font-mono text-sky-400">Slot #{adsenseSlot}</span>
          </div>
        </div>
      );
    }

    // Default horizontal leaderboard (728x90 style)
    return (
      <div className="w-full h-full bg-[#1F1235] border-2 border-purple-950 rounded-2xl p-3 flex items-center justify-between text-left relative overflow-hidden group shadow-xs">
        {/* Subtle background cosmic mesh */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex items-center gap-4 z-10 pl-2">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center text-xl shadow-md border border-violet-400/20">
            🚀
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black tracking-wider uppercase text-[#58cc02] bg-[#58cc02]/10 px-2 py-0.5 rounded-md">AdSense Pub</span>
              <span className="text-[9px] text-violet-300 font-bold">Agrandissez votre horizon académique</span>
            </div>
            <div className="text-[11px] font-extrabold text-white mt-0.5 tracking-tight">
              Intéressé(e) par la pre prépa ingénieur ou les classes préparatoires ECG / Littéraires ?
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 z-10 pr-2">
          <div className="text-right hidden sm:block">
            <div className="text-[9px] font-extrabold text-violet-200 uppercase leading-none">Annonce Intégrée</div>
            <span className="text-[7px] text-slate-400 font-mono mt-0.5 block">{adsenseClient}</span>
          </div>
          <a
            href="https://ai.studio/build"
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-600 hover:brightness-110 text-white text-[10px] font-black rounded-xl uppercase tracking-wider transition-all duration-200"
          >
            Découvrir
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative ${getLayoutClasses()} select-none my-4`}>
      {/* If we have the live AdSense script in window, render the real script element box */}
      {(window as any).adsbygoogle ? (
        <div className="w-full h-full overflow-hidden rounded-2xl border border-gray-200 shadow-inner bg-slate-50 relative flex items-center justify-center">
          <span className="absolute top-1 left-2 text-[8px] font-bold text-gray-400 uppercase tracking-widest z-10">Annonce AdSense Active</span>
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", height: "100%" }}
            data-ad-client={adsenseClient}
            data-ad-slot={adsenseSlot}
            data-ad-format={type === "rectangle" ? "rectangle" : "horizontal"}
            data-full-width-responsive="true"
          />
        </div>
      ) : (
        // Otherwise, render our gorgeous simulated interactive placeholder that doubles as a production-ready system!
        renderSimulatedAd()
      )}
    </div>
  );
}

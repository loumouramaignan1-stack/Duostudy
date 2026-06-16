import React from "react";
// @ts-ignore
import LogoImage from "../assets/images/duostudy_logo_1781442945399.jpg";

interface DuoStudyLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textClassName?: string;
  onClick?: () => void;
}

export default function DuoStudyLogo({ size = "md", showText = true, textClassName = "", onClick }: DuoStudyLogoProps) {
  // Dimensions and styling based on size prop
  let iconSize = "w-10 h-10";
  let textSize = "text-xl";
  let subTextSize = "text-[9px]";

  if (size === "sm") {
    iconSize = "w-8 h-8";
    textSize = "text-lg";
    subTextSize = "text-[8px]";
  } else if (size === "lg") {
    iconSize = "w-12 h-12";
    textSize = "text-2xl";
    subTextSize = "text-[10px]";
  } else if (size === "xl") {
    iconSize = "w-20 h-20";
    textSize = "text-4xl";
    subTextSize = "text-xs";
  }

  return (
    <div 
      onClick={onClick}
      className={`flex items-center gap-3 select-none ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Flame Icon with Logo Image */}
      <div className={`${iconSize} relative shrink-0 rounded-full overflow-hidden`}>
        <img 
          src={LogoImage}
          alt="DuoStudy Flame Logo" 
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Rebranded Typographic Logo */}
      {showText && (
        <div className="flex flex-col">
          <div className={`${textSize} font-black font-display tracking-tight leading-none text-[#2D2D2D] ${textClassName}`}>
            Duo<span className="text-[#58cc02]">Study</span>
          </div>
          <span className={`${subTextSize} font-black text-slate-400 tracking-widest uppercase mt-1 leading-none font-sans`}>
            RÉFLEXE ACTIF
          </span>
        </div>
      )}
    </div>
  );
}

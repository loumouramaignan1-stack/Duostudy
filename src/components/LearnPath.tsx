import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Course, Lesson, SpacedRepetitionData, NodeKnowledgeState, UserProgress } from "../types";
import { BookOpen, Check, Lock, Play, Star, AlertCircle, HelpCircle, FileText, ChevronRight, Calendar, Sparkles, Brain, Award, X } from "lucide-react";
import { calculateRecallProbability, getDecayedMastery, predictExamScore, getQuestionId } from "../utils/pedagogy";

interface LearnPathProps {
  course: Course | null;
  completedLessons: string[];
  srsData: Record<string, SpacedRepetitionData>;
  onStartLesson: (lesson: Lesson, unitTitle: string, sessionLength?: number) => void;
  hearts: number;
  lessonLevels?: Record<string, number>;
  nodeStates?: Record<string, NodeKnowledgeState>;
  progress: UserProgress;
  onUpdateExamDate: (dateStr: string) => void;
  mobileMenuOpen?: boolean;
  onSwitchTab?: (tabId: string) => void;
}

export default function LearnPath({
  course,
  completedLessons,
  srsData,
  onStartLesson,
  hearts,
  lessonLevels = {},
  nodeStates = {},
  progress,
  onUpdateExamDate,
  mobileMenuOpen = false,
  onSwitchTab
}: LearnPathProps) {
  const [selectedLesson, setSelectedLesson] = useState<{ lesson: Lesson; unitTitle: string } | null>(null);
  const [showGuidebook, setShowGuidebook] = useState<string | null>(null); // State to store unit title of shown guidebook
  const [sessionLength, setSessionLength] = useState<number>(10); // Customizable active recall session length (5, 10, or 15)

  const selectedNodeRef = React.useRef<HTMLDivElement>(null);
  const activeGuidebookRef = React.useRef<HTMLDivElement>(null);

  // Close selected lesson popover and active guidebook when clicking outside of them
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Close selected lesson speechbubble popover if clicking outside
      if (selectedLesson && selectedNodeRef.current) {
        if (!selectedNodeRef.current.contains(event.target as Node)) {
          setSelectedLesson(null);
        }
      }

      // Close active guidebook / memo-cours if clicking outside
      if (showGuidebook && activeGuidebookRef.current) {
        const target = event.target as Element;
        const clickedToggleButton = target.closest("button")?.textContent?.includes("MÉMO-COURS") || target.closest("button")?.textContent?.includes("FERMER");
        if (!activeGuidebookRef.current.contains(target) && !clickedToggleButton) {
          setShowGuidebook(null);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedLesson, showGuidebook]);

  // Close selected lesson popover when mobile menu is opened
  useEffect(() => {
    if (mobileMenuOpen) {
      setSelectedLesson(null);
    }
  }, [mobileMenuOpen]);

  // Determine if a lesson is unlocked or locked
  const getLessonStatus = (lessonId: string, precedingLessonIds: string[]) => {
    // Current level of this lesson (from 0 to 4)
    const level = lessonLevels[lessonId] ?? (completedLessons.includes(lessonId) ? 1 : 0);
    const isCompleted = level >= 4;
    
    // It's unlocked if it is the very first lesson, OR if the preceding lesson level is >= 4 (fully completed/mastered)
    let isUnlocked = precedingLessonIds.length === 0;
    if (precedingLessonIds.length > 0) {
      const priorLessonId = precedingLessonIds[precedingLessonIds.length - 1];
      const priorLevel = lessonLevels[priorLessonId] ?? (completedLessons.includes(priorLessonId) ? 1 : 0);
      isUnlocked = priorLevel >= 4;
    }

    // Is it due for a spaced repetition review?
    let needsReview = false;
    const srs = srsData[lessonId];
    if (srs) {
      const nextDate = new Date(srs.nextReviewDate);
      const now = new Date();
      needsReview = nextDate <= now;
    }

    const state = nodeStates[lessonId];
    const decayedMasteryVal = state ? getDecayedMastery(state, new Date()) : 0;
    const recallProbVal = state ? calculateRecallProbability(state, new Date()) : 1.0;

    return { isCompleted, isUnlocked, needsReview, level, decayedMasteryVal, recallProbVal, state };
  };

  // Get all lesson IDs in sequential order prior to a given lesson
  const getPrecedingLessons = (targetLessonId: string): string[] => {
    const sequence: string[] = [];
    for (const unit of course.units) {
      for (const lesson of unit.lessons) {
        if (lesson.id === targetLessonId) {
          return sequence;
        }
        sequence.push(lesson.id);
      }
    }
    return sequence;
  };

  // Staggering alignment class offset for Duolingo snake effect
  const getStaggerClass = (index: number) => {
    const cycle = index % 4;
    switch (cycle) {
      case 1: return "translate-x-12";
      case 2: return "translate-x-0";
      case 3: return "-translate-x-12";
      default: return "-translate-x-0";
    }
  };

  // Theme color resolver based on Course color properties
  const getThemeColors = (color: string) => {
    switch (color) {
      case "rose":
        return {
          bg: "bg-rose-500",
          border: "border-[#e11d48]",
          shadow: "shadow-[0_6px_0_#9f1239]",
          text: "text-rose-600 hover:text-rose-700",
          themeText: "text-rose-500",
          bgLight: "bg-rose-50/50 border-rose-200"
        };
      case "sky":
        return {
          bg: "bg-[#1CB0F6]",
          border: "border-[#1079ab]",
          shadow: "shadow-[0_6px_0_#0f766e]",
          text: "text-[#1CB0F6] hover:text-[#198cb4]",
          themeText: "text-[#1CB0F6]",
          bgLight: "bg-[#DDF4FF] border-[#84D8FF]"
        };
      case "amber":
        return {
          bg: "bg-amber-500",
          border: "border-amber-600",
          shadow: "shadow-[0_6px_0_#b45309]",
          text: "text-amber-600 hover:text-amber-700",
          themeText: "text-amber-500",
          bgLight: "bg-amber-50/50 border-amber-200"
        };
      case "emerald":
        return {
          bg: "bg-emerald-500",
          border: "border-emerald-600",
          shadow: "shadow-[0_6px_0_#047857]",
          text: "text-emerald-600 hover:text-emerald-700",
          themeText: "text-emerald-500",
          bgLight: "bg-emerald-50/50 border-emerald-200"
        };
      case "indigo":
        return {
          bg: "bg-indigo-500",
          border: "border-indigo-600",
          shadow: "shadow-[0_6px_0_#4338ca]",
          text: "text-indigo-600 hover:text-indigo-700",
          themeText: "text-indigo-500",
          bgLight: "bg-indigo-50/50 border-indigo-200"
        };
      case "violet":
        return {
          bg: "bg-violet-500",
          border: "border-violet-600",
          shadow: "shadow-[0_6px_0_#6d28d9]",
          text: "text-violet-600 hover:text-violet-700",
          themeText: "text-violet-500",
          bgLight: "bg-violet-50/50 border-violet-200"
        };
      default:
        return {
          bg: "bg-[#1CB0F6]",
          border: "border-[#1079ab]",
          shadow: "shadow-[0_6px_0_#0284c7]",
          text: "text-[#1CB0F6] hover:text-[#147da1]",
          themeText: "text-[#1CB0F6]",
          bgLight: "bg-[#DDF4FF] border-[#84D8FF]"
        };
    }
  };

  if (!course) {
    return (
      <div id="no-course-placeholder-container" className="w-full max-w-xl mx-auto py-10 px-4 text-center">
        <div className="bg-white border-2 border-[#E5E5E5] rounded-[32px] p-8 md:p-10 shadow-sm relative overflow-hidden">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#58cc02]/10 rounded-full blur-2xl transform translate-x-8 -translate-y-8"></div>
          
          <div className="w-20 h-20 bg-[#58cc02]/10 text-[#58cc02] rounded-full flex items-center justify-center text-4xl mx-auto mb-6 border-2 border-dashed border-[#58cc02]/35 animate-bounce">
            ✨
          </div>

          <h2 className="text-2xl font-black font-display text-slate-800 leading-tight">
            Prêt(e) pour le Sprint ? ⚡
          </h2>
          <p className="text-sm text-gray-500 font-bold mt-2 uppercase tracking-wide">
            Impulsez votre apprentissage actif
          </p>
          
          <div className="my-6 border-t border-b border-[#E5E5E5] py-5 text-left space-y-4">
            <p className="text-xs text-gray-600 leading-relaxed">
              DuoStudy utilise des algorithmes cognitifs de <span className="font-extrabold text-slate-800">répétition espacée (SRS)</span> et de <span className="font-extrabold text-slate-800">récupération active</span> pour ancrer durablement vos cours dans votre mémoire en prévision de vos concours et examens.
            </p>
            
            <div className="space-y-2.5">
              <div className="flex items-start gap-2 text-xs font-semibold text-gray-700">
                <span className="w-5 h-5 rounded-full bg-[#58cc02] text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">1</span>
                <span>Allez sur l'onglet <span className="font-black text-[#58cc02]">GÉNÉRATEUR IA</span> ou importez vos cours directement.</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-semibold text-gray-700">
                <span className="w-5 h-5 rounded-full bg-[#58cc02] text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">2</span>
                <span>Collez vos notes, polycopiés, diapos ou fiches de révisions.</span>
              </div>
              <div className="flex items-start gap-2 text-xs font-semibold text-gray-700">
                <span className="w-5 h-5 rounded-full bg-[#58cc02] text-white flex items-center justify-center font-black text-[10px] shrink-0 mt-0.5">3</span>
                <span>Notre IA génère instantanément vos leçons et exercices sur-mesure !</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onSwitchTab?.("add-course")}
            className="w-full py-4 bg-[#58cc02] border-b-4 border-[#388301] hover:brightness-110 active:translate-y-0.5 active:border-b-0 text-white font-black text-sm rounded-2xl uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-current" />
            <span>Créer mon premier cours</span>
          </button>
        </div>
      </div>
    );
  }

  const themeColors = getThemeColors(course.themeColor);

  return (
    <div className="w-full flex-1 max-w-2xl mx-auto py-3 px-4">
      


      {/* Units Stack */}
      <div className="space-y-12">
        {course.units.map((unit, uIdx) => {
          // Guidebook mock contents: summary of lessons in this unit
          const guideSummary = unit.lessons.map(l => {
            return {
              title: l.title,
              concepts: l.questions.map(q => q.question).slice(0, 3)
            };
          });

          // Calculate which lessons are unlocked or completed in this unit
          const unitLessonsStatus = unit.lessons.map((lesson) => {
            const priorLessonIds = getPrecedingLessons(lesson.id);
            return getLessonStatus(lesson.id, priorLessonIds);
          });

          // Identify the last completed or unlocked lesson index
          let lastActiveIdx = -1;
          for (let i = 0; i < unitLessonsStatus.length; i++) {
            if (unitLessonsStatus[i].isCompleted || unitLessonsStatus[i].isUnlocked) {
              lastActiveIdx = i;
            }
          }

          let activeLinePercent = 0;
          if (lastActiveIdx >= 0) {
            const isLastCompleted = unitLessonsStatus[unitLessonsStatus.length - 1].isCompleted;
            if (isLastCompleted) {
              activeLinePercent = 100;
            } else {
              activeLinePercent = Math.min(100, Math.round(((lastActiveIdx + 0.5) / unitLessonsStatus.length) * 100));
            }
          }

          return (
            <div key={unit.unitNumber} className="relative">
              {/* Unit Header Card standard dynamic theme color */}
              <div className={`${themeColors.bg} rounded-3xl p-5 mb-8 border-b-4 ${themeColors.border} flex flex-col md:flex-row items-start md:items-center justify-between text-white`}>
                <div>
                  <span className="text-xs font-black uppercase tracking-widest opacity-80 font-display">
                    SECTION {unit.unitNumber}, UNITÉ {unit.unitNumber}
                  </span>
                  <h2 className="text-xl font-black tracking-wide font-display mt-1">
                    {unit.title}
                  </h2>
                  <p className="text-sm opacity-90 mt-1 font-medium font-sans">
                    {unit.description}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowGuidebook(showGuidebook === unit.title ? null : unit.title)}
                  className={`mt-4 md:mt-0 px-4 py-2 bg-white hover:bg-slate-50 ${themeColors.text} border-b-4 border-[#E5E5E5] rounded-2xl text-xs font-black tracking-wider flex items-center gap-2 select-none cursor-pointer`}
                >
                  <FileText className="w-4 h-4" />
                  {showGuidebook === unit.title ? "FERMER" : "MÉMO-COURS"}
                </button>
              </div>

              {/* Guidebook Popup Panel if clicked */}
              {showGuidebook === unit.title && (
                <div ref={activeGuidebookRef} className="mb-6 p-5 bg-white border-2 border-[#E5E5E5] rounded-3xl animate-fade-in text-[#4B4B4B]">
                  <h3 className={`text-sm font-black ${themeColors.themeText} font-display mb-3 border-b-2 border-[#E5E5E5] pb-2 uppercase flex items-center gap-2`}>
                    <BookOpen className="w-4 h-4 scale-110" />
                    Fiche Mémoire Synthétique - {unit.title}
                  </h3>
                  <div className="space-y-4">
                    {guideSummary.map((sum, sIdx) => (
                      <div key={sIdx} className="bg-slate-50 p-3 rounded-2xl border-2 border-[#E5E5E5] text-[#4B4B4B]">
                        <div className="text-xs font-extrabold text-[#4B4B4B] mb-2 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#1899d6]"></span>
                          {sum.title}
                        </div>
                        <ul className="list-disc list-inside space-y-1">
                          {sum.concepts.map((concept, cIdx) => (
                            <li key={cIdx} className="text-[11px] text-gray-600 truncate list-none flex items-center gap-1 font-medium">
                              <ChevronRight className={`w-3 h-3 ${themeColors.themeText} shrink-0`} />
                              {concept}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-right">
                    <button 
                      onClick={() => setShowGuidebook(null)}
                      className={`text-xs font-black ${themeColors.text} hover:underline`}
                    >
                      J'ai compris ! Masquer le mémo
                    </button>
                  </div>
                </div>
              )}

              {/* Lesson Path nodes list (snake layout) */}
              <div className="flex flex-col items-center gap-6 relative">
                {/* Connecting track line */}
                <div className="absolute top-0 bottom-0 w-2.5 bg-[#E5E5E5] z-0 rounded-full"></div>

                {/* Active animated track line overlay */}
                <motion.div
                  className={`absolute top-0 w-2.5 ${themeColors.bg} z-0 rounded-full origin-top`}
                  initial={{ height: 0 }}
                  animate={{ height: `${activeLinePercent}%` }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {unit.lessons.map((lesson, lIdx) => {
                  const priorLessonIds = getPrecedingLessons(lesson.id);
                  const { isCompleted, isUnlocked, needsReview, level } = getLessonStatus(lesson.id, priorLessonIds);

                  // Button appearance based on status
                  let buttonClass = "";
                  let iconElement = <HelpCircle className="w-6 h-6 text-white" />;
                  let nodeColorLabel = "Unité";

                  if (isCompleted) {
                    // Gold crown crown button - Mastered
                    buttonClass = "bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 hover:from-yellow-200 hover:to-amber-400 border-yellow-600 shadow-[0_6px_0_#9d7003] ring-4 ring-yellow-200/50";
                    iconElement = (
                      <div className="relative flex flex-col items-center justify-center">
                        <span className="text-xl leading-none">👑</span>
                        <span className="text-[8px] font-black text-amber-950 tracking-tighter mt-1 leading-none uppercase">Maître</span>
                      </div>
                    );
                    nodeColorLabel = "Niveau Maître complet";
                  } else if (isUnlocked) {
                    if (needsReview) {
                      // Broken Red/Amber review alert style
                      buttonClass = "bg-[#FF4B4B] hover:bg-[#ff5d5d] border-[#C72D2D] shadow-[0_6px_0_#931f1f] animate-pulse relative";
                      iconElement = (
                        <div className="relative flex flex-col items-center justify-center">
                          <AlertCircle className="w-6 h-6 text-white stroke-[3px]" />
                        </div>
                      );
                      nodeColorLabel = "RÉVISER IMPÉRATIVEMENT !";
                    } else {
                      // Glowing dynamic current node (Level 0, 1, 2, 3)
                      buttonClass = `${themeColors.bg} hover:brightness-110 ${themeColors.border} ${themeColors.shadow} glow-active`;
                      iconElement = (
                        <div className="relative w-full h-full flex flex-col items-center justify-center">
                          <Star className="w-5.5 h-5.5 text-white fill-white" />
                        </div>
                      );
                      nodeColorLabel = level > 0 ? `Niveau ${level}/4` : "Unité active";
                    }
                  } else {
                    // Locked grey button
                    buttonClass = "bg-[#E5E5E5] border-[#CCCCCC] shadow-[0_6px_0_#B8B8B8] cursor-not-allowed";
                    iconElement = <Lock className="w-5 h-5 text-[#AFAFAF]" />;
                    nodeColorLabel = "Verrouillé";
                  }

                  const isSelected = selectedLesson?.lesson.id === lesson.id;
                  const staggerOffset = getStaggerClass(lIdx);

                  return (
                    <div 
                      key={lesson.id} 
                      ref={isSelected ? selectedNodeRef : undefined}
                      className={`relative ${isSelected ? "z-40 scale-105" : "z-10 hover:scale-105"} transition-all duration-300 flex flex-col items-center ${staggerOffset}`}
                    >
                      {/* Circular Progress Ring matching the Duolingo Node */}
                      <div className="relative w-28 h-28 flex items-center justify-center">
                        <svg className="absolute w-28 h-28 -rotate-90 pointer-events-none z-10" viewBox="0 0 112 112">
                          {/* Underlying light grey track circle */}
                          <circle
                            cx="56"
                            cy="56"
                            r="46"
                            fill="transparent"
                            stroke={isUnlocked ? "#E5E5E5" : "#F1F5F9"}
                            strokeWidth="10"
                          />
                          {/* Active learning level arc completion */}
                          {isUnlocked && level > 0 && (
                            <circle
                              cx="56"
                              cy="56"
                              r="46"
                              fill="transparent"
                              stroke={isCompleted ? "#FFD700" : (course.themeColor === "sky" ? "#1CB0F6" : "#58CC02")}
                              strokeWidth="10"
                              strokeDasharray="289.0"
                              strokeDashoffset={289.0 - (Math.min(level, 4) / 4) * 289.0}
                              strokeLinecap="round"
                              className="transition-all duration-500 ease-out"
                            />
                          )}
                        </svg>

                        {/* Interactive Button centered inside the progress circle ring */}
                        <button
                          onClick={() => {
                            if (isUnlocked) {
                              setSelectedLesson(
                                selectedLesson?.lesson.id === lesson.id 
                                  ? null 
                                  : { lesson, unitTitle: unit.title }
                              );
                            }
                          }}
                          disabled={!isUnlocked}
                          className={`w-16 h-16 rounded-full flex items-center justify-center border-b-6 select-none cursor-pointer outline-none relative z-20 ${buttonClass}`}
                          style={{ outline: "none" }}
                        >
                          {/* Little crack warning marker if review due */}
                          {needsReview && (
                            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black tracking-tighter px-1.5 py-0.5 rounded-md animate-bounce border border-white z-30 shadow">
                              S.O.S !
                            </span>
                          )}
                          {iconElement}
                        </button>
                      </div>

                      {/* Small text floating below the node (widened and full text visible) */}
                      <span className="mt-2 text-center text-[11px] font-black tracking-wider text-[#4B4B4B] uppercase font-display px-1 max-w-[200px] whitespace-normal break-words leading-tight">
                        {lesson.title}
                      </span>

                      {/* Popping Speech Bubble like Duolingo */}
                      {isSelected && (
                        <div className={`absolute top-28 w-56 sm:w-64 max-w-[calc(100vw-3rem)] p-4.5 ${themeColors.bg} rounded-2xl border-b-4 ${themeColors.border} text-white z-50 flex flex-col items-center text-center shadow-xl break-words`}>
                          {/* Triangle arrow on top pointing up to the button */}
                          <div className={`absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 ${themeColors.bg} rotate-45`}></div>

                          {/* Close button (Croix pour sortir du niveau) */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLesson(null);
                            }}
                            className="absolute top-2 right-2 text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all p-1 rounded-full hover:bg-white/15 cursor-pointer select-none z-30"
                            title="Fermer"
                          >
                            <X className="w-3.5 h-3.5" strokeWidth={3} />
                          </button>

                          <div className="relative z-10 w-full flex flex-col items-center">
                            <span className="text-[10px] font-black uppercase tracking-wider opacity-85 break-words whitespace-normal w-full">
                              {level === 4 ? "👑 Niveau Maître Complété" : `🎯 LEÇON ${level + 1} SUR 4`}
                            </span>
                            <h4 className="font-gray-900 font-extrabold text-xs sm:text-sm tracking-wide font-display mt-1 mb-1.5 text-white leading-tight break-words whitespace-normal w-full">
                              {lesson.title}
                            </h4>
                            <p className="text-[10px] sm:text-[11px] opacity-90 leading-tight mb-3 break-words whitespace-normal w-full">
                              {level === 4 
                                ? "Félicitations, vous avez maîtrisé ce concept à 100% ! Rejouez pour réviser." 
                                : `Progresse de 25% supplémentaires vers l'ouverture du prochain nœud !`}
                            </p>


                            {hearts <= 0 ? (
                              <div className="text-red-100 font-extrabold text-[10px] bg-red-800/40 p-1.5 rounded-lg border border-red-500/30 text-center">
                                💔 Plus de vies ! Rechargez dans la boutique
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  onStartLesson(lesson, unit.title, 10);
                                  setSelectedLesson(null);
                                }}
                                className={`w-full py-2.5 bg-white ${themeColors.themeText} hover:bg-slate-50 active:translate-y-0.5 border-b-4 border-gray-300 rounded-xl font-black text-xs transition-all uppercase tracking-widest cursor-pointer shadow-md flex items-center justify-center gap-1.5`}
                              >
                                <Play className="w-4 h-4 fill-current" strokeWidth={4} />
                                {level === 4 ? "Rejouer (+15 XP)" : "COMMENCER +15 XP"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

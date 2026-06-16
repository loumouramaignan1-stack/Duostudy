import React, { useState, useEffect, useRef } from "react";
import { PlusCircle, FileText, Sparkles, Wand2, Compass, AlertTriangle, BookOpenCheck, Upload, Trash2 } from "lucide-react";
import { Course } from "../types";
import AdInterstitial from "./AdInterstitial";
import JSZip from "jszip";

interface AddCourseTabProps {
  onAddCourse: (course: Course) => void;
  onAppendUnitsToCourse?: (courseId: string, additionalUnits: any[], newSourceNotes?: string) => void;
  onSetCourseActive: (courseId: string) => void;
  availableCourses: Course[];
  activeCourseId: string;
}

export default function AddCourseTab({
  onAddCourse,
  onAppendUnitsToCourse,
  onSetCourseActive,
  availableCourses,
  activeCourseId
}: AddCourseTabProps) {
  const [mode, setMode] = useState<"new" | "append">("new");
  const [selectedCourseIdToAppend, setSelectedCourseIdToAppend] = useState<string>("");

  useEffect(() => {
    if (availableCourses.length > 0 && !selectedCourseIdToAppend) {
      const found = availableCourses.find(c => c.id === activeCourseId) || availableCourses[0];
      setSelectedCourseIdToAppend(found.id);
    }
  }, [availableCourses, activeCourseId]);

  const [courseTitle, setCourseTitle] = useState("");
  const [showAdInterstitial, setShowAdInterstitial] = useState(false);
  const [courseNotes, setCourseNotes] = useState("");
  const [difficulty, setDifficulty] = useState("intermédiaire");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [parsingFile, setParsingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    setSelectedFileName(file.name);
    if (!courseTitle) {
      const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      setCourseTitle(baseName);
    }

    const nameLower = file.name.toLowerCase();
    const isBinaryFormat = 
      nameLower.endsWith(".pdf") || 
      nameLower.endsWith(".pptx") || 
      nameLower.endsWith(".ppt") || 
      nameLower.endsWith(".docx") || 
      nameLower.endsWith(".xlsx") || 
      nameLower.endsWith(".odt") || 
      nameLower.endsWith(".odp") || 
      nameLower.endsWith(".ods");

    const reader = new FileReader();

    if (isBinaryFormat) {
      setParsingFile(true);
      setErrorMessage(null);
      setSuccessMsg(null);
      
      reader.onload = async (event) => {
        if (event.target && event.target.result) {
          const arrayBuffer = event.target.result as ArrayBuffer;
          try {
            let extractedText = "";

            if (nameLower.endsWith(".pdf")) {
              // Parse PDF client-side
              // Load pdf.js dynamically
              if (!(window as any).pdfjsLib) {
                await new Promise<void>((resolve, reject) => {
                  const script = document.createElement("script");
                  script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js";
                  script.onload = () => resolve();
                  script.onerror = () => reject(new Error("Impossible de charger le moteur de lecture PDF depuis le CDN. Vérifiez votre connexion Internet."));
                  document.head.appendChild(script);
                });
              }

              const pdfjsLib = (window as any).pdfjsLib;
              pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js";

              const bytes = new Uint8Array(arrayBuffer);
              const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
              let pdfText = "";
              for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();
                const strings = content.items.map((item: any) => item.str);
                pdfText += strings.join(" ") + "\n";
              }
              extractedText = pdfText;
            } else if (nameLower.endsWith(".pptx")) {
              // Parse PPTX client-side
              const zip = await JSZip.loadAsync(arrayBuffer);
              const slideFiles = Object.keys(zip.files).filter(p => p.startsWith("ppt/slides/slide"));
              slideFiles.sort((a, b) => {
                const numA = parseInt(a.replace(/[^0-9]/g, "")) || 0;
                const numB = parseInt(b.replace(/[^0-9]/g, "")) || 0;
                return numA - numB;
              });

              let pptxText = "";
              for (const slidePath of slideFiles) {
                const content = await zip.file(slidePath)?.async("string");
                if (content) {
                  const matches = content.match(/<a:t[^>]*>(.*?)<\/a:t>/g) || [];
                  const slideText = matches.map(m => m.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")).join(" ");
                  if (slideText.trim().length > 0) {
                    pptxText += slideText + "\n";
                  }
                }
              }
              extractedText = pptxText;
            } else if (nameLower.endsWith(".docx")) {
              // Parse DOCX client-side
              const zip = await JSZip.loadAsync(arrayBuffer);
              const docXml = await zip.file("word/document.xml")?.async("string");
              if (docXml) {
                const matches = docXml.match(/<w:t[^>]*>(.*?)<\/w:t>/g) || [];
                extractedText = matches.map(m => m.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")).join(" ");
              }
            } else if (nameLower.endsWith(".xlsx")) {
              // Parse XLSX client-side
              const zip = await JSZip.loadAsync(arrayBuffer);
              const sharedStringsXml = await zip.file("xl/sharedStrings.xml")?.async("string");
              if (sharedStringsXml) {
                const matches = sharedStringsXml.match(/<t[^>]*>(.*?)<\/t>/g) || [];
                extractedText = matches.map(m => m.replace(/<[^>]+>/g, "").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")).join(" ");
              }
            } else {
              // Fallback to server for other format types
              throw new Error("back_end_fallback");
            }

            if (extractedText && extractedText.trim().length > 0) {
              setCourseNotes(extractedText);
              setSuccessMsg(`✅ Document "${file.name}" importé et lu avec succès !`);
            } else {
              setErrorMessage(`⚠️ Le document "${file.name}" a été lu mais aucun texte n'a pu en être extrait.`);
            }
          } catch (err: any) {
            console.warn("Client-side parsing failed or bypassed, trying server fallback...", err);
            
            // Try to fall back to the server API
            try {
              const base64Data = await new Promise<string>((resolve, reject) => {
                const b64Reader = new FileReader();
                b64Reader.onload = () => {
                  resolve(b64Reader.result as string);
                };
                b64Reader.onerror = reject;
                b64Reader.readAsDataURL(file);
              });

              const response = await fetch("/api/parse-file", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: file.name,
                  mimeType: file.type,
                  base64: base64Data
                })
              });

              let result: any = {};
              const contentType = response.headers.get("content-type");
              if (contentType && contentType.includes("application/json")) {
                result = await response.json();
              } else {
                const textOutput = await response.text();
                throw new Error(textOutput || `Le serveur a renvoyé un statut d'erreur ${response.status}`);
              }

              if (!response.ok) {
                throw new Error(result.error || "Impossible d'extraire le texte de ce diaporama.");
              }
              if (result.text && result.text.trim().length > 0) {
                setCourseNotes(result.text);
                setSuccessMsg(`✅ Diaporama/document "${file.name}" importé et lu avec succès (via serveur) !`);
              } else {
                setErrorMessage(`⚠️ Le diaporama "${file.name}" a été lu mais aucun texte n'a pu en être extrait.`);
              }
            } catch (subErr: any) {
              console.error("Both client-side and fallback parsing failed:", subErr);
              setErrorMessage(`❌ Erreur lors de l'extraction des diapositives : ${subErr.message || "Vérifiez le fichier."}`);
            }
          } finally {
            setParsingFile(false);
          }
        }
      };
      
      reader.onerror = () => {
        setErrorMessage("Impossible de lire ce fichier de présentation.");
        setParsingFile(false);
      };
      
      reader.readAsArrayBuffer(file);
    } else {
      // Plain text formats (.txt, .md, .json)
      setParsingFile(true);
      setErrorMessage(null);
      setSuccessMsg(null);
      
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const text = event.target.result as string;
          setCourseNotes(text);
          setSuccessMsg(`✅ Fichier de notes "${file.name}" chargé avec succès !`);
        }
        setParsingFile(false);
      };
      
      reader.onerror = () => {
        setErrorMessage("Impossible de lire ce fichier.");
        setParsingFile(false);
      };
      
      reader.readAsText(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setSelectedFileName(null);
    setCourseNotes("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Custom cycling loading message index
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);

  const loadingMessages = [
    "🦉 L'IA lit vos notes de cours de biologie et d'histoire...",
    "🧠 Structuration du programme en mémoire de révision espacée...",
    "✨ Formulation des questions flashcards interactives de style Duolingo...",
    "🛡️ Calcul des coefficients régressifs d'apprentissage...",
    "🎒 Presque prêt ! Préparez-vous à gagner vos premiers XP !",
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingMsgIdx((prev) => (prev + 1) % loadingMessages.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseNotes.trim()) {
      setErrorMessage("Veuillez saisir ou coller vos notes de cours.");
      return;
    }

    // Retain form contexts and launch Google Ads Interstitial
    setShowAdInterstitial(true);
  };

  const executeGeneration = async () => {
    setShowAdInterstitial(false);
    setLoading(true);
    setErrorMessage(null);
    setSuccessMsg(null);

    let startUnitNumber = 1;
    let targetCourseId = "";
    let finalTitle = courseTitle || "Mon Cours IA";

    if (mode === "append") {
      const selectedCourse = availableCourses.find((c) => c.id === selectedCourseIdToAppend);
      if (!selectedCourse) {
        setErrorMessage("Veuillez sélectionner un cours existant à compléter.");
        setLoading(false);
        return;
      }
      startUnitNumber = (selectedCourse.units?.length || 0) + 1;
      targetCourseId = selectedCourse.id;
      finalTitle = selectedCourse.courseName;
    }

    try {
      const response = await fetch("/api/generate-learning-path", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseTitle: finalTitle,
          courseNotes,
          language: "fr",
          startUnitNumber
        }),
      });

      let result: any = {};
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const textOutput = await response.text();
        throw new Error(textOutput || `Le serveur a renvoyé un statut d'erreur ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(result.error || "Une erreur est survenue lors de la communication avec le serveur.");
      }

      const finalCourseName = result.data.courseName || finalTitle;

      if (mode === "append" && onAppendUnitsToCourse) {
        onAppendUnitsToCourse(targetCourseId, result.data.units || [], courseNotes);
        
        let successMsgText = `🎉 Parfait ! Nous avons complété le cours "${finalCourseName}" en y ajoutant les nouvelles unités d'apprentissage (à partir de l'Unité ${startUnitNumber}) !`;
        if (result.isMock) {
          successMsgText = `🎓 [Mode Démo] Leçons de démonstration (Unité ${startUnitNumber}) ajoutées au cours "${finalCourseName}" ! Configurez votre clé GEMINI_API_KEY dans les Secrets pour la vraie IA.`;
        } else if (result.isFallback) {
          successMsgText = `📈 Service IA surchargé : Votre Partie ${startUnitNumber} a été structurée localement pour le cours "${finalCourseName}" !`;
        }
        setSuccessMsg(successMsgText);

      } else {
        const colors: ("emerald" | "sky" | "rose" | "amber" | "indigo" | "violet")[] = [
          "sky", "rose", "amber", "violet", "emerald", "indigo"
        ];
        // Distribute colors based on the number of existing courses
        const nextColorIndex = (availableCourses ? availableCourses.length : 0) % colors.length;
        const autoThemeColor = colors[nextColorIndex];

        const newCourse: Course = {
          id: `course-${Date.now()}`,
          courseName: finalCourseName,
          themeColor: result.data.themeColor && result.data.themeColor !== "emerald" ? result.data.themeColor : autoThemeColor,
          createdAt: new Date().toISOString(),
          units: result.data.units || [],
          sourceNotes: courseNotes
        };

        onAddCourse(newCourse);
        
        let successMsgText = `🎉 Super ! Le cours intelligent "${finalCourseName}" a été synthétisé avec succès !`;
        if (result.isMock) {
          successMsgText = "🎓 [Mode Démo] Cours généré de façon statique ! Configurez votre clé GEMINI_API_KEY dans les Secrets pour débloquer l'IA en temps réel.";
        } else if (result.isFallback) {
          successMsgText = `📈 Service IA surchargé : Votre syllabus "${finalCourseName}" a été structurée localement avec succès d'après vos notes de révision ! Vous pouvez commencer à étudier dès maintenant.`;
        }
        setSuccessMsg(successMsgText);
      }
      
      // Reset input fields
      setCourseTitle("");
      setCourseNotes("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSelectedFileName(null);
      
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Impossible de contacter l'IA de DuoStudy.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Visual Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-[#1CB0F6]/10 text-[#1CB0F6] rounded-2xl border border-[#1CB0F6]/20">
          <Wand2 className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-black font-display text-[#4B4B4B]">Générateur de Cours IA</h1>
          <p className="text-sm text-gray-500 font-medium">
            Importez vos notes de cours d'Histoire, Sciences ou Langues, et l'IA créera instantanément un curriculum d'étude interactif et performant.
          </p>
        </div>
      </div>

      {/* Course input formulation form */}
      <div className="bg-white border-2 border-[#E5E5E5] rounded-3xl p-6 shadow-sm">
          {loading ? (
            <div className="py-20 flex flex-col items-center text-center animate-pulse">
              {/* Dancing visual avatar */}
              <div className="text-6xl animate-bounce mb-6">⚡</div>
              <h3 className="text-lg font-black font-display text-[#4B4B4B]">Infusion IA en cours...</h3>
              <p className="text-sm font-bold text-[#1CB0F6] mt-2 max-w-xs leading-relaxed">
                {loadingMessages[loadingMsgIdx]}
              </p>
              <div className="mt-8 flex items-center justify-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 bg-[#1CB0F6] rounded-full animate-ping"></span>
                Veuillez patienter 20 à 30 secondes...
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Notifications */}
              {errorMessage && (
                <div className="p-4 bg-rose-50 border-2 border-[#FF4B4B]/20 rounded-2xl flex items-start gap-3 text-rose-800">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#FF4B4B]" />
                  <div className="text-xs font-bold">{errorMessage}</div>
                </div>
              )}

              {successMsg && (
                <div className="p-4 bg-emerald-50 border-2 border-[#1CB0F6]/20 rounded-2xl flex items-start gap-3 text-emerald-800">
                  <BookOpenCheck className="w-5 h-5 shrink-0 mt-1 text-[#1CB0F6]" />
                  <div className="text-xs font-bold">{successMsg}</div>
                </div>
              )}

              {/* Select Mode (New vs Append) */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400 tracking-wider font-display">
                  Objectif de la génération IA
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setMode("new")}
                    className={`py-3 px-4 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      mode === "new"
                        ? "bg-[#DDF4FF] border-[#1CB0F6] text-[#1CB0F6]"
                        : "bg-[#f7f7f7] border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">⭐️</span>
                    <span>Créer un nouveau cours</span>
                  </button>

                  <button
                    type="button"
                    disabled={availableCourses.length === 0}
                    onClick={() => setMode("append")}
                    className={`py-3 px-4 rounded-2xl font-black text-xs border-2 transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                      availableCourses.length === 0 ? "opacity-50 cursor-not-allowed" : ""
                    } ${
                      mode === "append"
                        ? "bg-[#E2F0D9] border-[#58CC02] text-[#58CC02]"
                        : "bg-[#f7f7f7] border-gray-200 text-gray-500 hover:bg-gray-100"
                    }`}
                    title={availableCourses.length === 0 ? "Aucun cours n'a été créé pour le moment" : ""}
                  >
                    <span className="text-xl">📈</span>
                    <span>Compléter un cours existant</span>
                  </button>
                </div>
              </div>

              {/* Mode Specific Configurations */}
              {mode === "new" ? (
                <div className="space-y-1.5">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-wider font-display">
                    Titre du nouveau cours / Discipline
                  </label>
                  <input
                    type="text"
                    required={mode === "new"}
                    placeholder="ex: Révolution Française, Marketing Digital, React.js..."
                    value={courseTitle}
                    onChange={(e) => setCourseTitle(e.target.value)}
                    className="w-full bg-[#f7f7f7] border-2 border-[#E5E5E5] text-[#4B4B4B] rounded-2xl p-3 text-xs focus:border-[#1CB0F6] focus:bg-white focus:outline-none transition-colors font-extrabold"
                  />
                </div>
              ) : (
                <div className="space-y-1.5 p-4 bg-emerald-50/50 border-2 border-[#58CC02]/20 rounded-2xl">
                  <label className="text-xs font-black uppercase text-[#58CC02] tracking-wider font-display">
                    Sélectionner le cours à compléter (Ajout de la partie suivante)
                  </label>
                  <select
                    value={selectedCourseIdToAppend}
                    onChange={(e) => setSelectedCourseIdToAppend(e.target.value)}
                    className="w-full bg-white border-2 border-[#58CC02]/30 text-slate-700 p-3 rounded-xl text-xs font-black outline-none focus:border-[#58CC02]"
                  >
                    {availableCourses.map((c) => {
                      const currentUnitCount = c.units?.length || 0;
                      return (
                        <option key={c.id} value={c.id}>
                          📖 {c.courseName} ({currentUnitCount} unité{currentUnitCount > 1 ? "s" : ""} existante{currentUnitCount > 1 ? "s" : ""})
                        </option>
                      );
                    })}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1 font-bold">
                    💡 L'IA analysera vos nouvelles notes de cours et injectera les chapitres suivants en tant qu'Unités additionnelles de révision (ex: Unité {
                      ((availableCourses.find(c => c.id === selectedCourseIdToAppend)?.units?.length || 0) + 1)
                    }).
                  </p>
                </div>
              )}

              {/* Notes paste input */}
              <div className="space-y-4">
                
                {/* Drag & Drop File Upload Box */}
                <div className="space-y-1.5">
                  <span className="text-xs font-black uppercase text-gray-400 tracking-wider font-display flex items-center gap-1.5">
                    <Upload className="w-4 h-4 text-[#58cc02]" />
                    Importer un fichier de cours (Optionnel)
                  </span>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={triggerFileSelect}
                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#58cc02] bg-[#58cc02]/10 scale-[0.99] shadow-sm"
                        : "border-[#E5E5E5] bg-[#f7f7f7]/30 hover:border-gray-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".txt,.md,.pdf,.docx,.json,.pptx,.ppt"
                      className="hidden"
                      disabled={parsingFile}
                    />
                    
                    {parsingFile ? (
                      <div className="flex flex-col items-center animate-pulse py-2">
                        <div className="w-10 h-10 border-4 border-[#1CB0F6] border-t-transparent rounded-full animate-spin mb-3"></div>
                        <p className="text-xs font-black text-slate-700">Analyse de votre diaporama / document en cours...</p>
                        <p className="text-[10px] text-gray-500 mt-1">L'IA parcourt vos diapositives et extrait le texte...</p>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 bg-sky-50 rounded-full flex items-center justify-center text-[#1CB0F6] mb-3">
                          <Upload className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">
                          Déposez votre diaporama ou fiches ici, ou <span className="text-[#1cb5ff] hover:underline">parcourez vos fichiers</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          Formats : .pptx, .ppt, .pdf, .docx, .txt, .md, .json
                        </p>
                      </>
                    )}
                  </div>

                  {selectedFileName && (
                    <div className="mt-2 flex items-center justify-between bg-[#58cc02]/10 border border-[#58cc02]/20 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2 truncate">
                        <span>{selectedFileName.toLowerCase().endsWith(".pptx") || selectedFileName.toLowerCase().endsWith(".ppt") ? "📊" : "📄"}</span>
                        <span className="truncate max-w-[200px] sm:max-w-xs">{selectedFileName}</span>
                      </div>
                      <button
                        type="button"
                        disabled={parsingFile}
                        onClick={(e) => {
                          e.stopPropagation();
                          clearSelectedFile();
                        }}
                        className="text-gray-400 hover:text-red-500 rounded-lg p-1 disabled:opacity-50"
                        title="Retirer le fichier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-black uppercase text-gray-400 tracking-wider font-display flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-[#1cb5ff]" />
                      Vos notes de cours manuscrites ou texte brut
                    </label>
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Texte requis</span>
                  </div>
                  <textarea
                    required
                    rows={8}
                    placeholder="Collez ici vos résumés, chapitres de livre, fiches de révision ou définitions brutes. L'IA se chargera de diviser le tout en exercices tactiles et ludiques de répétition espacée."
                    value={courseNotes}
                    onChange={(e) => setCourseNotes(e.target.value)}
                    className="w-full bg-[#f7f7f7] border-2 border-[#E5E5E5] text-[#4B4B4B] rounded-2xl p-4 text-xs focus:border-[#1CB0F6] focus:bg-white focus:outline-none transition-colors font-mono leading-relaxed"
                  />
                </div>
              </div>

              {/* Focus selector option */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-wider">
                    Difficulté d'étude
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-[#f7f7f7] border-2 border-[#E5E5E5] text-[#4B4B4B] p-3 rounded-xl text-xs font-black"
                  >
                    <option value="débutant">Facile / Découverte</option>
                    <option value="intermédiaire">Normal / Intermédiaire</option>
                    <option value="avancé">Difficile / Universitaire</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black uppercase text-gray-400 tracking-wider">
                    Activité prioritaire
                  </label>
                  <div className="text-[11px] text-[#1CB0F6] font-black p-3 bg-[#f7f7f7] border-2 border-[#E5E5E5] rounded-xl flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#1CB0F6]" />
                    SRS - Répétition Espacée
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#1CB0F6] border-b-4 border-[#1079ab] hover:bg-[#20a5e3] select-none text-white font-black text-sm rounded-2xl uppercase tracking-widest active:translate-y-1 active:border-b-0 cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                GÉNERER LE PROGRAMME D'ÉTUDES IA 🚀
              </button>
            </form>
          )}
        </div>

        {/* Existing courses catalog panel */}
        <div className="bg-white border-2 border-[#E5E5E5] p-6 rounded-3xl shadow-sm">
          <h3 className="text-xs font-black text-[#4B4B4B] uppercase tracking-widest font-display mb-4 pb-2 border-b-2 border-[#E5E5E5] flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-[#1CB0F6]" />
            COURS ACTIFS ({availableCourses.length})
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {availableCourses.map((c) => {
              const isActive = activeCourseId === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => onSetCourseActive(c.id)}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    isActive
                      ? "bg-[#DDF4FF] border-[#84D8FF] text-[#1CB0F6]"
                      : "bg-[#f7f7f7] hover:bg-[#eeeeee] border-transparent text-[#4B4B4B]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                    <span className="text-lg shrink-0">📖</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-black truncate text-slate-700">{c.courseName}</div>
                      <div className="text-[9px] text-slate-500 font-bold capitalize truncate">Thème {c.themeColor}</div>
                    </div>
                  </div>
                  {isActive && (
                    <span className="text-[10px] font-black uppercase text-[#1CB0F6] shrink-0 bg-white/60 px-2 py-0.5 rounded-lg border border-[#84D8FF]/30">
                      ACTIF ★
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        <AdInterstitial 
          isOpen={showAdInterstitial} 
          onClose={executeGeneration} 
          triggerContext="creation" 
          title="Synthèse de votre Parcours IA" 
        />
    </div>
  );
}

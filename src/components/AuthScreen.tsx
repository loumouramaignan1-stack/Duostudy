import React, { useState } from "react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { auth } from "../firebase";
import { Mail, Lock, LogIn, UserPlus, AlertCircle } from "lucide-react";
import DuoStudyLogo from "./DuoStudyLogo";

export default function AuthScreen() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Check if inside AI Studio preview iframe sandbox
  const isIframe = typeof window !== "undefined" && window.self !== window.top;

  // Email/Password login or registration
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      console.error(err);
      let frenchMessage = "Une erreur est survenue lors de l'authentification.";
      if (err.code === "auth/invalid-credential") {
        frenchMessage = "Identifiants invalides. Veuillez réessayer.";
      } else if (err.code === "auth/email-already-in-use") {
        frenchMessage = "Cette adresse e-mail est déjà associée à un compte.";
      } else if (err.code === "auth/weak-password") {
        frenchMessage = "Le mot de passe doit contenir au moins 6 caractères.";
      } else if (err.code === "auth/invalid-email") {
        frenchMessage = "Format d'adresse e-mail invalide.";
      }
      setError(frenchMessage);
    } finally {
      setLoading(false);
    }
  };

  // Google authentication
  const handleGoogleAuth = async () => {
    setError(null);
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      console.error(err);
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Erreur de connexion via Google. Si l'iframe bloque la popup, veuillez utiliser l'authentification par e-mail.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez saisir votre adresse e-mail.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
    } catch (err: any) {
      setError("Impossible d'envoyer l'e-mail de réinitialisation. Vérifiez l'adresse e-mail.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="auth-screen-container" className="min-h-screen bg-[#F7F9FA] flex flex-col items-center justify-center p-6 selection:bg-[#58cc02] selection:text-white">
      <div id="auth-card" className="w-full max-w-md bg-white border-2 border-[#E5E5E5] rounded-[32px] shadow-sm p-8 flex flex-col items-center">
        
        {/* Branding Logo */}
        <div className="mb-6 scale-110">
          <DuoStudyLogo size="lg" />
        </div>

        <h1 className="text-xl font-extrabold text-[#1C1C1C] text-center mb-2 font-display">
          {showForgotPassword 
            ? "Réinitialiser le mot de passe"
            : isSignUp 
            ? "Créer votre compte gratuit" 
            : "Connectez-vous pour continuer"}
        </h1>
        <p className="text-xs text-gray-400 text-center mb-6">
          {showForgotPassword
            ? "Saisissez votre e-mail pour recevoir un lien de réinitialisation."
            : isSignUp
            ? "Sauvegardez votre progression pédagogique et défiez la courbe de l'oubli"
            : "Retrouvez vos cours personnalisés, vos flashcards et vos statistiques"}
        </p>

        {error && (
          <div className="w-full bg-rose-50 border border-rose-200 text-rose-600 rounded-2xl p-3.5 mb-4 flex items-start gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resetSent && (
          <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-3.5 mb-4 text-xs font-semibold text-center">
            📬 E-mail de réinitialisation envoyé ! Veuillez vérifier votre boîte de réception.
          </div>
        )}

        {showForgotPassword ? (
          <form onSubmit={handleForgotPassword} className="w-full space-y-4">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Mail className="w-5 h-5" />
              </span>
              <input 
                type="email"
                placeholder="Adresse e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-[#E5E5E5] focus:border-[#58cc02] rounded-2xl outline-none text-xs font-bold text-slate-800 transition-all shrink-0"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#58cc02] border-b-4 border-[#388301] hover:brightness-110 active:translate-y-0.5 active:border-b-0 text-white font-black text-xs rounded-2xl uppercase tracking-wider transition-all disabled:opacity-50"
            >
              {loading ? "Chargement..." : "Envoyer l'e-mail"}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowForgotPassword(false);
                setResetSent(false);
              }}
              className="w-full text-center text-xs font-black text-[#58cc02] hover:text-[#46a302] hover:underline"
            >
              Retour à la connexion
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={handleEmailAuth} className="w-full space-y-3.5">
              {isSignUp && (
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <LogIn className="w-5 h-5" />
                  </span>
                  <input 
                    type="text"
                    placeholder="Nom ou Pseudo"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-[#E5E5E5] focus:border-[#58cc02] rounded-2xl outline-none text-xs font-bold text-slate-800 transition-all shrink-0"
                  />
                </div>
              )}

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Mail className="w-5 h-5" />
                </span>
                <input 
                  type="email"
                  placeholder="Adresse e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-[#E5E5E5] focus:border-[#58cc02] rounded-2xl outline-none text-xs font-bold text-slate-800 transition-all shrink-0"
                  required
                />
              </div>

              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Lock className="w-5 h-5" />
                </span>
                <input 
                  type="password"
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border-2 border-[#E5E5E5] focus:border-[#58cc02] rounded-2xl outline-none text-xs font-bold text-slate-800 transition-all shrink-0"
                  required
                />
              </div>

              {!isSignUp && (
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[11px] font-black text-gray-400 hover:text-gray-600 transition-all"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#58cc02] border-b-4 border-[#388301] hover:brightness-110 active:translate-y-0.5 active:border-b-0 text-white font-black text-xs rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{loading ? "Vérification..." : isSignUp ? "S'inscrire" : "Se Connecter"}</span>
              </button>
            </form>

            <div className="relative flex py-5 items-center w-full">
              <div className="flex-grow border-t border-[#E5E5E5]"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-[10px] font-bold uppercase tracking-wider">OU</span>
              <div className="flex-grow border-t border-[#E5E5E5]"></div>
            </div>

            {/* Google Authentication Button */}
            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-3 bg-white hover:bg-slate-50 border-2 border-[#E5E5E5] active:translate-y-0.5 text-slate-700 font-bold text-xs rounded-2xl flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm disabled:opacity-50 shrink-0"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
              <span>Se connecter avec Google</span>
            </button>

            {isIframe && (
              <div className="w-full mt-3 p-3.5 bg-sky-50 border border-sky-200 rounded-2xl text-[11px] text-sky-700 leading-normal">
                <div className="font-extrabold flex items-center gap-1.5 uppercase tracking-wider mb-1 text-[10px] text-sky-600">
                  💡 Astuce de l'Aperçu (Iframe)
                </div>
                <p className="font-semibold text-slate-700">
                  La connexion Google est restreinte par le navigateur au sein de l'iframe de l'éditeur AI Studio.
                </p>
                <div className="mt-2 space-y-1.5">
                  <p>
                    👉 <strong className="font-bold text-sky-950">Option Simple</strong> : Créez un compte par e-mail ci-dessus (les adresses fictives fonctionnent parfaitement !).
                  </p>
                  <p>
                    👉 <strong className="font-bold text-sky-950">Avec Google</strong> : Rendez-vous sur votre site en ouvrant un <a href={window.location.href} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-sky-900 duration-100">nouvel onglet ↗</a> pour vous connecter sans aucune restriction.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-black text-[#58cc02] hover:text-[#46a302] hover:underline"
              >
                {isSignUp 
                  ? "Déjà un compte ? Connectez-vous" 
                  : "Pas de compte ? Créez-en un ici"}
              </button>
            </div>
          </>
        )}
        
      </div>
    </div>
  );
}

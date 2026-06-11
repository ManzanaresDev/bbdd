"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Eye, EyeOff, LogIn } from "lucide-react";
import Logo from "@/public/coderCatLogo.png";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row items-center justify-center lg:justify-between p-6 lg:p-12 gap-10"
      style={{
        background:
          "linear-gradient(135deg, #0a1628 0%, #0d2147 30%, #1a3a6e 60%, #2563c4 85%, #4a9eff 100%)",
      }}
    >
      {/* ================= LEFT (desktop only) ================= */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative h-full">
        {/* circles */}
        <div className="absolute inset-0 opacity-5">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute border border-white rounded-full"
              style={{
                width: `${(i + 1) * 120}px`,
                height: `${(i + 1) * 120}px`,
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
              }}
            />
          ))}
        </div>

        {/* logo */}
        <div className="relative z-10 flex items-center gap-4 -translate-y-8">
          <Image src={Logo} alt="CoderCat" width={60} height={60} priority />
          <span className="text-white font-display text-3xl font-semibold">
            CoderCat
          </span>
        </div>

        {/* text */}
        <div className="relative z-10">
          <blockquote className="text-white/80 font-display text-2xl leading-relaxed mb-4">
            "Gérez vos clients, projets et finances en un seul endroit."
          </blockquote>
          <p className="text-white/50 text-sm">
            Votre espace de travail professionnel
          </p>
        </div>

        {/* footer */}
        <div className="relative z-10 flex gap-6 text-white/40 text-sm">
          <span>Clients</span>
          <span>·</span>
          <span>Projets</span>
          <span>·</span>
          <span>Devis</span>
          <span>·</span>
          <span>Factures</span>
        </div>
      </div>

      {/* ================= RIGHT (mobile + desktop form) ================= */}
      <div className="w-full lg:w-1/2 flex flex-col items-center">
        {/* ===== MOBILE HEADER ===== */}
        <div className="flex flex-col items-center mb-6 lg:hidden">
          <Image src={Logo} alt="CoderCat" width={50} height={50} priority />
          <h1 className="text-white font-display text-2xl font-semibold mt-2">
            CoderCat
          </h1>
        </div>

        {/* ===== CARD ===== */}
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <h1 className="text-white font-display text-3xl font-semibold mb-2 text-center lg:text-left">
            Connexion
          </h1>
          <p className="text-white/60 text-sm mb-6 text-center lg:text-left">
            Accédez à votre espace de gestion
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* email */}
            <div>
              <label className="text-white/70 text-sm">Adresse email</label>
              <input
                type="email"
                className="w-full mt-1 px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/40"
                placeholder="vous@agence.fr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            {/* password */}
            <div>
              <label className="text-white/70 text-sm">Mot de passe</label>
              <div className="relative mt-1">
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/40 pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* error */}
            {error && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {/* button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-blue-900 font-medium hover:bg-white/90 transition"
            >
              <LogIn size={16} />
              {loading ? "Connexion..." : "Se connecter"}
            </button>
            {/* register link */}
            <p className="mt-4 text-center text-sm text-white/70">
              Vous n'avez pas de compte ?{" "}
              <Link
                href="/auth/register"
                className="font-medium text-white hover:underline"
              >
                Créer un compte
              </Link>
            </p>
          </form>
        </div>

        {/* ===== MOBILE FOOTER TEXTS ===== */}
        <div className="mt-6 text-center lg:hidden">
          <p className="text-white/80 text-lg font-medium">
            "Gérez vos clients, projets et finances en un seul endroit."
          </p>
          <p className="text-white/50 text-sm mt-2">
            Votre espace de travail professionnel
          </p>
        </div>
      </div>
    </div>
  );
}

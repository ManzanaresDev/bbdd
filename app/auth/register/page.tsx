"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import Logo from "@/public/coderCatLogo.png";

export default function RegisterPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{
          background:
            "linear-gradient(135deg, #0a1628 0%, #0d2147 30%, #1a3a6e 60%, #2563c4 85%, #4a9eff 100%)",
        }}
      >
        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-green-500/20 border border-green-400/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-green-300 text-2xl">✓</span>
          </div>

          <h2 className="text-white text-2xl font-semibold mb-3">
            Compte créé !
          </h2>

          <p className="text-white/70 text-sm mb-6">
            Vérifiez votre boîte mail pour confirmer votre adresse email avant
            de vous connecter.
          </p>

          <Link
            href="/auth/login"
            className="w-full inline-flex items-center justify-center py-2.5 rounded-lg bg-white text-blue-900 font-medium hover:bg-white/90 transition"
          >
            Aller à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col lg:flex-row items-center justify-center lg:justify-between p-6 lg:p-12 gap-10"
      style={{
        background:
          "linear-gradient(135deg, #0a1628 0%, #0d2147 30%, #1a3a6e 60%, #2563c4 85%, #4a9eff 100%)",
      }}
    >
      {/* LEFT */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between relative h-full">
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

        <div className="relative z-10 flex items-center gap-4 -translate-y-8">
          <Image src={Logo} alt="CoderCat" width={60} height={60} priority />
          <span className="text-white text-3xl font-semibold">CoderCat</span>
        </div>

        <div className="relative z-10">
          <blockquote className="text-white/80 text-2xl leading-relaxed mb-4">
            "Rejoignez la plateforme et développez votre activité sereinement."
          </blockquote>

          <p className="text-white/50 text-sm">
            Créez votre espace professionnel
          </p>
        </div>

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

      {/* RIGHT */}
      <div className="w-full lg:w-1/2 flex flex-col items-center">
        <div className="flex flex-col items-center mb-6 lg:hidden">
          <Image src={Logo} alt="CoderCat" width={50} height={50} priority />
          <h1 className="text-white text-2xl font-semibold mt-2">CoderCat</h1>
        </div>

        <div className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl p-8">
          <h1 className="text-white text-3xl font-semibold mb-2 text-center lg:text-left">
            Créer un compte
          </h1>

          <p className="text-white/60 text-sm mb-6 text-center lg:text-left">
            Commencez à gérer votre activité
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
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

            <div>
              <label className="text-white/70 text-sm">Mot de passe</label>

              <div className="relative mt-1">
                <input
                  type={showPass ? "text" : "password"}
                  className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 outline-none focus:border-white/40 pr-10"
                  placeholder="8 caractères minimum"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
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

            {error && (
              <p className="text-sm text-red-300 bg-red-500/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-white text-blue-900 font-medium hover:bg-white/90 transition"
            >
              <UserPlus size={16} />
              {loading ? "Création..." : "Créer mon compte"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/60">
            Déjà un compte ?{" "}
            <Link
              href="/auth/login"
              className="text-white font-medium hover:underline"
            >
              Se connecter
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center lg:hidden">
          <p className="text-white/80 text-lg font-medium">
            "Rejoignez la plateforme et développez votre activité sereinement."
          </p>

          <p className="text-white/50 text-sm mt-2">
            Créez votre espace professionnel
          </p>
        </div>
      </div>
    </div>
  );
}

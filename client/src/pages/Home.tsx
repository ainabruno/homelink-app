import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Wifi, Shield, Zap, Globe, Lock, Activity } from "lucide-react";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  if (isAuthenticated) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 text-foreground overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="border-b border-cyan-500/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className="w-8 h-8 neon-cyan" />
              <span className="text-2xl font-bold neon-cyan">HomeLink</span>
            </div>
            <a href={getLoginUrl()} className="btn-neon-cyan px-6 py-2 rounded-lg">
              Se Connecter
            </a>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
                  <span className="neon-cyan">Accès Distant</span>
                  <br />
                  <span className="neon-green">Sécurisé</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Connectez-vous à votre réseau domestique depuis n'importe où dans le monde avec HomeLink. 
                  Gestion WireGuard VPN simple, sécurisée et intuitive.
                </p>
              </div>

              <div className="flex gap-4">
                <a href={getLoginUrl()} className="btn-neon-cyan px-8 py-3 rounded-lg text-lg font-semibold">
                  Commencer Maintenant
                </a>
                <Button variant="outline" className="px-8 py-3 rounded-lg text-lg border-neon-green text-neon-green hover:bg-green-950">
                  En Savoir Plus
                </Button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-cyan-500/30">
                <div>
                  <p className="text-3xl font-bold neon-cyan">256-bit</p>
                  <p className="text-sm text-muted-foreground">Chiffrement</p>
                </div>
                <div>
                  <p className="text-3xl font-bold neon-green">99.9%</p>
                  <p className="text-sm text-muted-foreground">Disponibilité</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-400">∞</p>
                  <p className="text-sm text-muted-foreground">Appareils</p>
                </div>
              </div>
            </div>

            {/* Right Visual */}
            <div className="relative h-96 lg:h-full">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-green-500/20 rounded-2xl border border-cyan-500/30 backdrop-blur-sm p-8 flex flex-col items-center justify-center space-y-6">
                <Wifi className="w-24 h-24 neon-cyan animate-glow" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-semibold">Connecté Sécurisement</p>
                  <p className="text-sm text-muted-foreground">Votre connexion est chiffrée</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-cyan-500/30">
          <h2 className="text-4xl font-bold text-center mb-16 neon-cyan">Fonctionnalités Principales</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <Card className="border-neon-cyan p-6 hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
              <Shield className="w-8 h-8 neon-cyan mb-4" />
              <h3 className="text-xl font-bold mb-2">Sécurité Maximale</h3>
              <p className="text-muted-foreground">
                Chiffrement WireGuard 256-bit et authentification OAuth pour une protection totale.
              </p>
            </Card>

            {/* Feature 2 */}
            <Card className="border-neon-green p-6 hover:shadow-lg hover:shadow-green-500/30 transition-all">
              <Zap className="w-8 h-8 neon-green mb-4" />
              <h3 className="text-xl font-bold mb-2">Configuration Rapide</h3>
              <p className="text-muted-foreground">
                Interface intuitive pour configurer votre réseau en quelques minutes.
              </p>
            </Card>

            {/* Feature 3 */}
            <Card className="border-neon-cyan p-6 hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
              <Globe className="w-8 h-8 neon-cyan mb-4" />
              <h3 className="text-xl font-bold mb-2">Accès Mondial</h3>
              <p className="text-muted-foreground">
                Connectez-vous depuis n'importe quel endroit du monde en toute sécurité.
              </p>
            </Card>

            {/* Feature 4 */}
            <Card className="border-neon-green p-6 hover:shadow-lg hover:shadow-green-500/30 transition-all">
              <Lock className="w-8 h-8 neon-green mb-4" />
              <h3 className="text-xl font-bold mb-2">Gestion des Appareils</h3>
              <p className="text-muted-foreground">
                Ajoutez, gérez et révoquez l'accès des appareils facilement.
              </p>
            </Card>

            {/* Feature 5 */}
            <Card className="border-neon-cyan p-6 hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
              <Activity className="w-8 h-8 neon-cyan mb-4" />
              <h3 className="text-xl font-bold mb-2">Monitoring en Temps Réel</h3>
              <p className="text-muted-foreground">
                Suivez les connexions, la bande passante et la santé du réseau.
              </p>
            </Card>

            {/* Feature 6 */}
            <Card className="border-neon-green p-6 hover:shadow-lg hover:shadow-green-500/30 transition-all">
              <Wifi className="w-8 h-8 neon-green mb-4" />
              <h3 className="text-xl font-bold mb-2">Support DDNS</h3>
              <p className="text-muted-foreground">
                Utilisez un domaine dynamique pour une meilleure accessibilité.
              </p>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 border-t border-cyan-500/30">
          <div className="bg-gradient-to-r from-cyan-500/10 to-green-500/10 border border-cyan-500/30 rounded-2xl p-12 text-center space-y-6">
            <h2 className="text-4xl font-bold">Prêt à Commencer?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Rejoignez des milliers d'utilisateurs qui font confiance à HomeLink pour sécuriser leur accès réseau.
            </p>
            <a href={getLoginUrl()} className="btn-neon-cyan px-8 py-3 rounded-lg text-lg font-semibold inline-block">
              Se Connecter Maintenant
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-cyan-500/30 mt-20 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
            <p>&copy; 2026 HomeLink. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

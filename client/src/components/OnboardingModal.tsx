import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ChevronRight,
  CheckCircle,
  Zap,
  Wifi,
  Smartphone,
  Settings,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  action?: {
    label: string;
    route?: string;
    onClick?: () => void;
  };
}

export default function OnboardingModal() {
  const [, navigate] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  // Check if user has completed onboarding
  useEffect(() => {
    const completed = localStorage.getItem("homelink_onboarding_completed");
    if (completed === "true") {
      setHasCompletedOnboarding(true);
    } else {
      setIsOpen(true);
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 1,
      title: "Bienvenue sur HomeLink! 🎉",
      description: "Accédez à votre WiFi de n'importe où dans le monde",
      icon: <Zap className="w-12 h-12 text-cyan-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            HomeLink vous permet de configurer un accès VPN sécurisé à votre réseau domestique
            et d'utiliser votre connexion Internet personnelle depuis n'importe où.
          </p>
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
            <p className="text-cyan-300 text-sm">
              ✨ Ce tutoriel vous guidera à travers les 4 étapes principales pour commencer.
            </p>
          </div>
        </div>
      ),
      action: {
        label: "Commencer",
      },
    },
    {
      id: 2,
      title: "Créer votre premier réseau 🌐",
      description: "Configurez votre routeur domestique",
      icon: <Wifi className="w-12 h-12 text-green-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Allez à la page "Configuration Réseau" pour ajouter votre routeur domestique.
          </p>
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <h4 className="text-green-400 font-semibold">Vous aurez besoin de:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>✓ L'adresse IP publique de votre routeur</li>
              <li>✓ Ou un domaine DDNS (Dynamic DNS)</li>
              <li>✓ Le port WireGuard (par défaut: 51820)</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        label: "Aller à Configuration Réseau",
        route: "/networks",
      },
    },
    {
      id: 3,
      title: "Ajouter vos appareils 📱",
      description: "Enregistrez les appareils qui utiliseront le VPN",
      icon: <Smartphone className="w-12 h-12 text-emerald-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Allez à "Gestion des Appareils" pour ajouter vos téléphones, ordinateurs ou tablettes.
          </p>
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <h4 className="text-emerald-400 font-semibold">Pour chaque appareil:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>✓ Donnez un nom (ex: "Mon iPhone")</li>
              <li>✓ HomeLink génère automatiquement les clés WireGuard</li>
              <li>✓ Téléchargez ou scannez le QR code</li>
            </ul>
          </div>
        </div>
      ),
      action: {
        label: "Aller à Gestion des Appareils",
        route: "/devices",
      },
    },
    {
      id: 4,
      title: "Configurer votre client VPN 🔐",
      description: "Connectez-vous depuis n'importe où",
      icon: <Settings className="w-12 h-12 text-blue-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Allez à "Client VPN" pour obtenir les instructions de configuration.
          </p>
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-2">
            <h4 className="text-blue-400 font-semibold">Étapes rapides:</h4>
            <ol className="text-slate-300 text-sm space-y-1">
              <li>1. Téléchargez l'app WireGuard officielle</li>
              <li>2. Importez votre configuration .conf</li>
              <li>3. Appuyez sur "Connecter"</li>
              <li>4. Profitez de votre WiFi partout! 🌍</li>
            </ol>
          </div>
        </div>
      ),
      action: {
        label: "Aller à Client VPN",
        route: "/vpn-client",
      },
    },
    {
      id: 5,
      title: "Vous êtes prêt! 🚀",
      description: "Votre configuration est terminée",
      icon: <CheckCircle className="w-12 h-12 text-green-400" />,
      content: (
        <div className="space-y-4">
          <p className="text-slate-300">
            Félicitations! Vous avez configuré HomeLink avec succès.
          </p>
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 space-y-2">
            <h4 className="text-green-400 font-semibold">Prochaines étapes:</h4>
            <ul className="text-slate-300 text-sm space-y-1">
              <li>✓ Testez votre connexion VPN depuis un autre réseau</li>
              <li>✓ Vérifiez la vitesse avec "Test de Vitesse"</li>
              <li>✓ Consultez "Historique" pour voir vos connexions</li>
              <li>✓ Gérez les notifications pour rester informé</li>
            </ul>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("homelink_onboarding_completed", "true");
    setHasCompletedOnboarding(true);
    setIsOpen(false);
    toast.success("✅ Tutoriel terminé! Bienvenue sur HomeLink!");
  };

  const handleActionClick = () => {
    const action = steps[currentStep]?.action;
    if (action?.route) {
      navigate(action.route);
      // Don't close the modal, let user see the page
    }
    if (action?.onClick) {
      action.onClick();
    }
  };

  const handleSkip = () => {
    localStorage.setItem("homelink_onboarding_completed", "true");
    setHasCompletedOnboarding(true);
    setIsOpen(false);
  };

  if (hasCompletedOnboarding) {
    return null;
  }

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-cyan-500/30 shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-cyan-500/20 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-cyan-400">
              {step?.title}
            </DialogTitle>
            <button
              onClick={handleSkip}
              className="text-slate-400 hover:text-slate-300 text-sm"
            >
              Passer
            </button>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Étape {currentStep + 1} sur {steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-700" />
        </div>

        {/* Content */}
        <div className="space-y-6 py-4">
          {/* Icon */}
          <div className="flex justify-center">{step?.icon}</div>

          {/* Description */}
          <div className="text-center">
            <p className="text-slate-400 text-sm">{step?.description}</p>
          </div>

          {/* Main Content */}
          <div className="bg-slate-800/50 rounded-lg p-6 border border-cyan-500/10">
            {step?.content}
          </div>

          {/* Step Indicators */}
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index <= currentStep
                    ? "bg-cyan-500 w-6"
                    : "bg-slate-600 w-2"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-cyan-500/20 pt-4 flex gap-3 justify-between">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 0}
            variant="outline"
            className="border-slate-600 hover:bg-slate-700"
          >
            Précédent
          </Button>

          <div className="flex gap-3">
            {step?.action && (
              <Button
                onClick={handleActionClick}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {step.action.label}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}

            <Button
              onClick={handleNext}
              className="bg-cyan-600 hover:bg-cyan-700 text-white"
            >
              {currentStep === steps.length - 1 ? "Terminer" : "Suivant"}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

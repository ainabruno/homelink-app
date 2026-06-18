import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Download, Home, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentStatus {
  status: "completed" | "pending" | "failed";
  transactionId?: string;
  amount?: number;
  errorMessage?: string;
}

export default function PaymentSuccess() {
  const [, navigate] = useLocation();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const params = new URLSearchParams(window.location.search);
  const paymentId = params.get("paymentId");
  const transactionId = params.get("transactionId");

  useEffect(() => {
    const checkStatus = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }

      try {
        // Simulate payment status check
        // In production, this would call the backend API
        const mockStatus: PaymentStatus = {
          status: "completed",
          transactionId: transactionId || "TXN-" + Date.now(),
          amount: 10000,
        };

        setPaymentStatus(mockStatus);

        if (mockStatus.status === "completed") {
          toast.success("✅ Paiement réussi! Votre abonnement est activé.");
        } else if (mockStatus.status === "failed") {
          toast.error("❌ Paiement échoué. Veuillez réessayer.");
        } else {
          toast.info("⏳ Paiement en attente de confirmation...");
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
        toast.error("Erreur lors de la vérification du paiement");
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [paymentId]);

  const handleDownloadInvoice = async () => {
    if (!paymentId) return;

    try {
      // Simulate invoice download
      const invoiceData = {
        paymentId,
        transactionId,
        timestamp: new Date().toISOString(),
      };

      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(invoiceData, null, 2))
      );
      element.setAttribute("download", `facture-${paymentId}.json`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success("📄 Facture téléchargée");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast.error("Erreur lors du téléchargement");
    }
  };

  const handleReturnToDashboard = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-cyan-500/20">
          <div className="p-8 text-center">
            <div className="animate-spin mb-4">
              <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full mx-auto"></div>
            </div>
            <p className="text-cyan-400">Vérification du paiement...</p>
          </div>
        </Card>
      </div>
    );
  }

  const isSuccess = paymentStatus?.status === "completed";
  const isFailed = paymentStatus?.status === "failed";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Success State */}
        {isSuccess && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-green-500/30 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-green-500/20 p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-500/20 rounded-full blur-lg animate-pulse"></div>
                    <CheckCircle className="w-16 h-16 text-green-500 relative" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold text-center text-green-400 mb-2">
                  Paiement Réussi! ✅
                </h1>
                <p className="text-center text-green-300/80">
                  Votre abonnement est maintenant actif
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-700/50 rounded-lg p-4 border border-cyan-500/20">
                  <h3 className="text-cyan-400 font-semibold mb-3">📋 Détails de la Transaction</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">ID Paiement:</span>
                      <span className="text-cyan-300 font-mono">{paymentId}</span>
                    </div>
                    {transactionId && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Transaction ID:</span>
                        <span className="text-cyan-300 font-mono">{transactionId}</span>
                      </div>
                    )}
                    {paymentStatus?.amount && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Montant:</span>
                        <span className="text-green-400 font-semibold">
                          {new Intl.NumberFormat("fr-MG", {
                            style: "currency",
                            currency: "MGA",
                          }).format(paymentStatus.amount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span className="text-cyan-300">{new Date().toLocaleDateString("fr-MG")}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                  <p className="text-emerald-300 text-sm">
                    ✨ Vous avez accès à toutes les fonctionnalités de votre plan. Merci!
                  </p>
                </div>

                <div className="space-y-3 pt-4">
                  <Button
                    onClick={handleDownloadInvoice}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger la Facture
                  </Button>

                  <Button
                    onClick={handleReturnToDashboard}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Retour au Dashboard
                  </Button>
                </div>
              </div>
            </Card>

            {/* Info Card */}
            <Card className="bg-slate-800 border-cyan-500/20 p-6">
              <h3 className="text-cyan-400 font-semibold mb-3">📧 Prochaines Étapes</h3>
              <ul className="space-y-2 text-sm text-slate-300">
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3">✓</span>
                  <span>Une confirmation par email a été envoyée à votre adresse</span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3">✓</span>
                  <span>Votre facture est disponible dans votre compte</span>
                </li>
                <li className="flex items-start">
                  <span className="text-cyan-400 mr-3">✓</span>
                  <span>Vous pouvez maintenant configurer vos réseaux VPN</span>
                </li>
              </ul>
            </Card>
          </div>
        )}

        {/* Failed State */}
        {isFailed && (
          <div className="space-y-6">
            <Card className="bg-slate-800 border-red-500/30 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border-b border-red-500/20 p-6">
                <div className="flex items-center justify-center mb-4">
                  <AlertCircle className="w-16 h-16 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold text-center text-red-400 mb-2">
                  Paiement Échoué ❌
                </h1>
                <p className="text-center text-red-300/80">
                  {paymentStatus?.errorMessage || "Une erreur s'est produite lors du paiement"}
                </p>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                  <p className="text-red-300 text-sm">
                    Veuillez vérifier vos informations et réessayer.
                  </p>
                </div>

                <Button
                  onClick={handleReturnToDashboard}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Retour au Dashboard
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Pending State */}
        {paymentStatus?.status === "pending" && (
          <Card className="bg-slate-800 border-amber-500/30 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-b border-amber-500/20 p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="animate-spin">
                  <div className="w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full"></div>
                </div>
              </div>
              <h1 className="text-3xl font-bold text-center text-amber-400 mb-2">
                Paiement en Attente ⏳
              </h1>
              <p className="text-center text-amber-300/80">
                Votre paiement est en cours de traitement
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                <p className="text-amber-300 text-sm">
                  Veuillez patienter. Nous confirmons votre paiement auprès d'Orange Money.
                  Cela peut prendre quelques minutes.
                </p>
              </div>

              <Button
                onClick={handleReturnToDashboard}
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                Retour au Dashboard
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

import { useState, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Download, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface QRCodeViewerProps {
  deviceName: string;
  configContent: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeViewer({
  deviceName,
  configContent,
  isOpen,
  onClose,
}: QRCodeViewerProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${deviceName}-qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("QR code téléchargé");
  };

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(configContent);
    setCopied(true);
    toast.success("Configuration copiée");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadConfig = () => {
    const element = document.createElement("a");
    const file = new Blob([configContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `${deviceName}.conf`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Configuration téléchargée");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-neon-cyan max-w-2xl">
        <DialogHeader>
          <DialogTitle className="neon-cyan">
            Configuration WireGuard - {deviceName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* QR Code Section */}
          <div className="flex flex-col items-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Scannez ce QR code avec votre appareil mobile pour configurer WireGuard
            </p>
            <Card className="border-neon-green p-6 bg-white">
              <div ref={qrRef}>
                <QRCodeSVG
                  value={configContent}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
              </div>
            </Card>
            <Button
              onClick={handleDownloadQR}
              className="btn-neon-green"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger QR Code
            </Button>
          </div>

          {/* Configuration Text Section */}
          <div className="space-y-3">
            <h3 className="font-semibold neon-cyan">Configuration WireGuard</h3>
            <div className="bg-slate-900/50 border border-cyan-500/30 rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs text-cyan-300 whitespace-pre-wrap break-words">
              {configContent}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleCopyConfig}
                variant="outline"
                className="flex-1 border-neon-cyan text-neon-cyan hover:bg-cyan-950"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copié
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier Configuration
                  </>
                )}
              </Button>
              <Button
                onClick={handleDownloadConfig}
                variant="outline"
                className="flex-1 border-neon-green text-neon-green hover:bg-green-950"
              >
                <Download className="w-4 h-4 mr-2" />
                Télécharger .conf
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <Card className="border-neon-cyan p-4 bg-slate-900/50">
            <h4 className="font-semibold mb-2 text-sm">Instructions d'installation:</h4>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>
                <strong>Mobile:</strong> Installez WireGuard depuis l'App Store ou Play Store
              </li>
              <li>Ouvrez l'application et appuyez sur le bouton "+" pour ajouter une configuration</li>
              <li>Sélectionnez "Scanner QR code" et scannez le code ci-dessus</li>
              <li>Confirmez et activez la connexion VPN</li>
              <li>
                <strong>Desktop:</strong> Copiez le contenu de configuration et importez-le dans WireGuard
              </li>
            </ol>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ConfigExportProps {
  deviceName: string;
  configContent: string;
  className?: string;
}

export function ConfigExport({ deviceName, configContent, className = "" }: ConfigExportProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={`btn-neon-cyan ${className}`}
      >
        <Download className="w-4 h-4 mr-2" />
        Afficher Configuration
      </Button>
      <QRCodeViewer
        deviceName={deviceName}
        configContent={configContent}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}

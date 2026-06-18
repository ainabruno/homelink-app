import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { Activity, AlertCircle, CheckCircle, Download, Gauge, Upload, Zap } from "lucide-react";
import { toast } from "sonner";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface SpeedTestResult {
  ping: number;
  download: number;
  upload: number;
  jitter?: number;
  packetLoss?: number;
  quality: "excellent" | "good" | "fair" | "poor";
  timestamp: Date;
}

export default function NetworkSpeedTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<Partial<SpeedTestResult> | null>(null);
  const [testHistory, setTestHistory] = useState<SpeedTestResult[]>([]);
  const [stats, setStats] = useState({
    avgPing: 0,
    avgDownload: 0,
    avgUpload: 0,
    maxDownload: 0,
    maxUpload: 0,
  });

  // Simuler un test de vitesse
  const runSpeedTest = async () => {
    setIsRunning(true);
    setCurrentTest({ quality: "good" });

    try {
      // Phase 1: Ping test
      for (let i = 0; i <= 100; i += 20) {
        setCurrentTest(prev => ({ ...prev, ping: 15 + Math.random() * 10 }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Phase 2: Download test
      for (let i = 0; i <= 100; i += 20) {
        const speed = 50 + Math.random() * 80;
        setCurrentTest(prev => ({ ...prev, download: speed }));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Phase 3: Upload test
      for (let i = 0; i <= 100; i += 20) {
        const speed = 20 + Math.random() * 40;
        setCurrentTest(prev => ({ ...prev, upload: speed }));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Résultats finaux
      const result: SpeedTestResult = {
        ping: 18 + Math.random() * 8,
        download: 65 + Math.random() * 50,
        upload: 25 + Math.random() * 25,
        jitter: 2 + Math.random() * 3,
        packetLoss: Math.random() * 0.5,
        quality: "good",
        timestamp: new Date(),
      };

      setTestHistory(prev => [result, ...prev].slice(0, 50));
      setCurrentTest(result);

      // Calculer les stats
      const allTests = [result, ...testHistory];
      setStats({
        avgPing: allTests.reduce((a, b) => a + b.ping, 0) / allTests.length,
        avgDownload: allTests.reduce((a, b) => a + b.download, 0) / allTests.length,
        avgUpload: allTests.reduce((a, b) => a + b.upload, 0) / allTests.length,
        maxDownload: Math.max(...allTests.map(t => t.download)),
        maxUpload: Math.max(...allTests.map(t => t.upload)),
      });

      toast.success("Test de vitesse terminé");
    } catch (error: any) {
      toast.error(`Erreur: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case "excellent": return "text-neon-green";
      case "good": return "text-neon-cyan";
      case "fair": return "text-yellow-400";
      case "poor": return "text-red-500";
      default: return "text-gray-400";
    }
  };

  const getQualityBg = (quality: string) => {
    switch (quality) {
      case "excellent": return "bg-green-950/20 border-neon-green";
      case "good": return "bg-cyan-950/20 border-neon-cyan";
      case "fair": return "bg-yellow-950/20 border-yellow-500";
      case "poor": return "bg-red-950/20 border-red-500";
      default: return "bg-gray-950/20 border-gray-500";
    }
  };

  const chartData = testHistory.map(test => ({
    time: new Date(test.timestamp).toLocaleTimeString(),
    ping: parseFloat(test.ping.toFixed(2)),
    download: parseFloat(test.download.toFixed(2)),
    upload: parseFloat(test.upload.toFixed(2)),
  }));

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-bold neon-cyan">Test de Vitesse Réseau</h1>
        <p className="text-muted-foreground">
          Mesurez la qualité de votre connexion Internet et VPN en temps réel.
        </p>
      </div>

      {/* Test en cours */}
      {isRunning && currentTest && (
        <Card className="border-neon-cyan p-8 bg-gradient-to-br from-cyan-950/20 to-transparent">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold neon-cyan">Test en cours...</h2>
              <Spinner className="w-6 h-6 text-neon-cyan" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ping */}
              <div className="p-4 bg-black/30 rounded border border-neon-cyan">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-neon-cyan" />
                  <span className="text-sm text-muted-foreground">Ping</span>
                </div>
                <div className="text-3xl font-bold neon-cyan">
                  {currentTest.ping?.toFixed(1) || "0"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">ms</div>
              </div>

              {/* Download */}
              <div className="p-4 bg-black/30 rounded border border-neon-green">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-4 h-4 text-neon-green" />
                  <span className="text-sm text-muted-foreground">Download</span>
                </div>
                <div className="text-3xl font-bold text-neon-green">
                  {currentTest.download?.toFixed(1) || "0"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Mbps</div>
              </div>

              {/* Upload */}
              <div className="p-4 bg-black/30 rounded border border-yellow-500">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">Upload</span>
                </div>
                <div className="text-3xl font-bold text-yellow-400">
                  {currentTest.upload?.toFixed(1) || "0"}
                </div>
                <div className="text-xs text-muted-foreground mt-1">Mbps</div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Résultat du dernier test */}
      {!isRunning && currentTest && currentTest.quality && (
        <Card className={`border-2 p-6 ${getQualityBg(currentTest.quality)}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <CheckCircle className={`w-6 h-6 ${getQualityColor(currentTest.quality)}`} />
              <div>
                <h3 className="text-lg font-bold capitalize">
                  Qualité: <span className={getQualityColor(currentTest.quality)}>{currentTest.quality}</span>
                </h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(currentTest.timestamp!).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-black/20 rounded">
              <div className="text-sm text-muted-foreground mb-1">Ping</div>
              <div className="text-2xl font-bold neon-cyan">{currentTest.ping?.toFixed(1)} ms</div>
            </div>
            <div className="p-4 bg-black/20 rounded">
              <div className="text-sm text-muted-foreground mb-1">Download</div>
              <div className="text-2xl font-bold text-neon-green">{currentTest.download?.toFixed(1)} Mbps</div>
            </div>
            <div className="p-4 bg-black/20 rounded">
              <div className="text-sm text-muted-foreground mb-1">Upload</div>
              <div className="text-2xl font-bold text-yellow-400">{currentTest.upload?.toFixed(1)} Mbps</div>
            </div>
          </div>
        </Card>
      )}

      {/* Bouton de test */}
      <Button
        onClick={runSpeedTest}
        disabled={isRunning}
        className="btn-neon-cyan w-full h-12 text-lg"
      >
        {isRunning ? (
          <>
            <Spinner className="w-5 h-5 mr-2" />
            Test en cours...
          </>
        ) : (
          <>
            <Zap className="w-5 h-5 mr-2" />
            Lancer un test de vitesse
          </>
        )}
      </Button>

      {/* Statistiques */}
      {testHistory.length > 0 && (
        <Card className="border-neon-cyan p-6">
          <h2 className="text-xl font-bold mb-4 neon-cyan flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Statistiques
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-3 bg-black/30 rounded border border-neon-cyan">
              <div className="text-xs text-muted-foreground">Ping Moyen</div>
              <div className="text-lg font-bold neon-cyan">{stats.avgPing.toFixed(1)} ms</div>
            </div>
            <div className="p-3 bg-black/30 rounded border border-neon-green">
              <div className="text-xs text-muted-foreground">Download Moyen</div>
              <div className="text-lg font-bold text-neon-green">{stats.avgDownload.toFixed(1)} Mbps</div>
            </div>
            <div className="p-3 bg-black/30 rounded border border-yellow-500">
              <div className="text-xs text-muted-foreground">Upload Moyen</div>
              <div className="text-lg font-bold text-yellow-400">{stats.avgUpload.toFixed(1)} Mbps</div>
            </div>
            <div className="p-3 bg-black/30 rounded border border-neon-green">
              <div className="text-xs text-muted-foreground">Download Max</div>
              <div className="text-lg font-bold text-neon-green">{stats.maxDownload.toFixed(1)} Mbps</div>
            </div>
            <div className="p-3 bg-black/30 rounded border border-yellow-500">
              <div className="text-xs text-muted-foreground">Upload Max</div>
              <div className="text-lg font-bold text-yellow-400">{stats.maxUpload.toFixed(1)} Mbps</div>
            </div>
          </div>
        </Card>
      )}

      {/* Graphiques */}
      {chartData.length > 0 && (
        <>
          <Card className="border-neon-cyan p-6">
            <h2 className="text-xl font-bold mb-4 neon-cyan">Tendance Ping</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a4d4d" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0a1f1f", border: "1px solid #00d4ff" }}
                  labelStyle={{ color: "#00d4ff" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="ping"
                  stroke="#00d4ff"
                  dot={false}
                  strokeWidth={2}
                  name="Ping (ms)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

          <Card className="border-neon-green p-6">
            <h2 className="text-xl font-bold mb-4 text-neon-green">Tendance Bande Passante</h2>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a4d4d" />
                <XAxis dataKey="time" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0a1f1f", border: "1px solid #00d400" }}
                  labelStyle={{ color: "#00d400" }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="download"
                  stackId="1"
                  stroke="#00d400"
                  fill="#00d40020"
                  name="Download (Mbps)"
                />
                <Area
                  type="monotone"
                  dataKey="upload"
                  stackId="1"
                  stroke="#ffaa00"
                  fill="#ffaa0020"
                  name="Upload (Mbps)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      {/* Info */}
      <Alert className="border-blue-500 bg-blue-950/20">
        <AlertCircle className="w-4 h-4 text-blue-400" />
        <AlertDescription className="text-blue-200">
          Ce test simule une mesure de vitesse. Pour des résultats réels, connectez-vous à un serveur de test externe comme Speedtest.net.
        </AlertDescription>
      </Alert>
    </div>
  );
}

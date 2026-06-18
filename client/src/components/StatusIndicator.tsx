import { CheckCircle, AlertCircle, XCircle, Clock } from "lucide-react";

interface StatusIndicatorProps {
  status: "online" | "offline" | "idle" | "error";
  label?: string;
  className?: string;
}

export function StatusIndicator({ status, label, className = "" }: StatusIndicatorProps) {
  const statusConfig = {
    online: {
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-950/30",
      label: "En ligne",
    },
    offline: {
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-950/30",
      label: "Hors ligne",
    },
    idle: {
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-950/30",
      label: "Inactif",
    },
    error: {
      icon: AlertCircle,
      color: "text-orange-400",
      bg: "bg-orange-950/30",
      label: "Erreur",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-1 rounded-lg ${config.bg} ${className}`}>
      <Icon className={`w-4 h-4 ${config.color}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {label || config.label}
      </span>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function MetricCard({ label, value, unit, icon, className = "" }: MetricCardProps) {
  return (
    <div className={`border border-cyan-500/30 rounded-lg p-4 bg-slate-900/50 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-2">
            {value}
            {unit && <span className="text-sm ml-1">{unit}</span>}
          </p>
        </div>
        {icon && <div className="text-cyan-400">{icon}</div>}
      </div>
    </div>
  );
}

interface ConnectionStatusProps {
  isConnected: boolean;
  lastConnected?: Date;
  className?: string;
}

export function ConnectionStatus({ isConnected, lastConnected, className = "" }: ConnectionStatusProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <StatusIndicator
        status={isConnected ? "online" : "offline"}
        label={isConnected ? "Connecté" : "Déconnecté"}
      />
      {lastConnected && (
        <p className="text-xs text-muted-foreground">
          Dernière connexion: {new Date(lastConnected).toLocaleString()}
        </p>
      )}
    </div>
  );
}

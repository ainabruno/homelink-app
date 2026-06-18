import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

interface BandwidthDataPoint {
  timestamp: number;
  uploadMbps: number;
  downloadMbps: number;
}

interface DeviceBandwidth {
  deviceId: number;
  deviceName: string;
  uploadMbps: number;
  downloadMbps: number;
  totalMB: number;
}

interface BandwidthStatsData {
  timeSeries: BandwidthDataPoint[];
  byDevice: DeviceBandwidth[];
  totalUploadMbps: number;
  totalDownloadMbps: number;
  peakUploadMbps: number;
  peakDownloadMbps: number;
  averageUploadMbps: number;
  averageDownloadMbps: number;
}

interface BandwidthChartProps {
  data: BandwidthStatsData;
  isLoading?: boolean;
}

const COLORS = ["#00d4ff", "#00ff41", "#ff006e", "#ffbe0b", "#8338ec", "#3a86ff"];

export function BandwidthChart({ data, isLoading }: BandwidthChartProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner />
      </div>
    );
  }

  // Format time series data for display
  const timeSeriesData = data.timeSeries.map((point) => ({
    ...point,
    time: new Date(point.timestamp).toLocaleTimeString(),
  }));

  return (
    <div className="space-y-6">
      {/* Real-time Bandwidth Line Chart */}
      <Card className="p-6 bg-slate-900/50 border-cyan-500/30">
        <h3 className="text-lg font-semibold text-cyan-400 mb-4">📊 Bande Passante en Temps Réel</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={timeSeriesData}>
            <defs>
              <linearGradient id="colorUpload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorDownload" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff41" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#00ff41" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="time" stroke="#666" />
            <YAxis stroke="#666" label={{ value: "Mbps", angle: -90, position: "insideLeft" }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#1a1a2e", border: "1px solid #00d4ff" }}
              formatter={(value) => `${(value as number).toFixed(2)} Mbps`}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey="uploadMbps"
              stroke="#00d4ff"
              fillOpacity={1}
              fill="url(#colorUpload)"
              name="Upload"
            />
            <Area
              type="monotone"
              dataKey="downloadMbps"
              stroke="#00ff41"
              fillOpacity={1}
              fill="url(#colorDownload)"
              name="Download"
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-slate-900/50 border-cyan-500/30">
          <div className="text-sm text-gray-400">Upload Moyen</div>
          <div className="text-2xl font-bold text-cyan-400">{data.averageUploadMbps.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Mbps</div>
        </Card>
        <Card className="p-4 bg-slate-900/50 border-green-500/30">
          <div className="text-sm text-gray-400">Download Moyen</div>
          <div className="text-2xl font-bold text-green-400">{data.averageDownloadMbps.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Mbps</div>
        </Card>
        <Card className="p-4 bg-slate-900/50 border-cyan-500/30">
          <div className="text-sm text-gray-400">Upload Pic</div>
          <div className="text-2xl font-bold text-cyan-400">{data.peakUploadMbps.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Mbps</div>
        </Card>
        <Card className="p-4 bg-slate-900/50 border-green-500/30">
          <div className="text-sm text-gray-400">Download Pic</div>
          <div className="text-2xl font-bold text-green-400">{data.peakDownloadMbps.toFixed(1)}</div>
          <div className="text-xs text-gray-500">Mbps</div>
        </Card>
      </div>

      {/* Per-Device Distribution */}
      {data.byDevice.length > 0 && (
        <Card className="p-6 bg-slate-900/50 border-cyan-500/30">
          <h3 className="text-lg font-semibold text-cyan-400 mb-4">📱 Distribution par Appareil</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pie Chart for Upload */}
            <div>
              <h4 className="text-sm text-gray-400 mb-2 text-center">Upload</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.byDevice}
                    dataKey="uploadMbps"
                    nameKey="deviceName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {data.byDevice.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${(value as number).toFixed(2)} Mbps`} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart for Download */}
            <div>
              <h4 className="text-sm text-gray-400 mb-2 text-center">Download</h4>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={data.byDevice}
                    dataKey="downloadMbps"
                    nameKey="deviceName"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {data.byDevice.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${(value as number).toFixed(2)} Mbps`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Device Details Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cyan-500/30">
                  <th className="text-left py-2 px-3 text-cyan-400">Appareil</th>
                  <th className="text-right py-2 px-3 text-cyan-400">Upload</th>
                  <th className="text-right py-2 px-3 text-green-400">Download</th>
                  <th className="text-right py-2 px-3 text-gray-400">Total</th>
                </tr>
              </thead>
              <tbody>
                {data.byDevice.map((device) => (
                  <tr key={device.deviceId} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                    <td className="py-2 px-3 text-gray-300">{device.deviceName}</td>
                    <td className="text-right py-2 px-3 text-cyan-400">{device.uploadMbps.toFixed(2)} Mbps</td>
                    <td className="text-right py-2 px-3 text-green-400">{device.downloadMbps.toFixed(2)} Mbps</td>
                    <td className="text-right py-2 px-3 text-gray-400">{(device.totalMB / 1024).toFixed(2)} GB</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

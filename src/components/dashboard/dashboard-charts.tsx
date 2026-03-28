"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  AreaChart, Area,
} from "recharts";
import { STATUT_POINTAGE_LABELS } from "@/lib/constants";

const STATUT_COLORS: Record<string, string> = {
  PRESENT: "#10b981",
  RETARD: "#f59e0b",
  ABSENT: "#ef4444",
  CONGE: "#3b82f6",
  MISSION: "#8b5cf6",
  ARRET_MALADIE: "#f97316",
  ABSENCE_AUTORISEE: "#06b6d4",
  ABSENCE_NON_AUTORISEE: "#dc2626",
  FERIE: "#6366f1",
  DEMI_JOURNEE: "#d97706",
};

interface ChartProps {
  data: any[];
}

export function RetardsParJourChart({ data }: ChartProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-base">Retards par jour de la semaine</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <XAxis dataKey="jour" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="retards" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function StatutsDonutChart({ data }: ChartProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-base">Repartition par statut</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              dataKey="count"
              nameKey="statut"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={95}
              paddingAngle={2}
              label={({ payload }: any) => `${STATUT_POINTAGE_LABELS[payload?.statut]?.substring(0, 6) ?? "?"} (${payload?.count ?? 0})`}
            >
              {data.map((entry: any, i: number) => (
                <Cell key={i} fill={STATUT_COLORS[entry.statut] ?? "#94a3b8"} />
              ))}
            </Pie>
            <Tooltip formatter={(value: any, name: any) => [value, STATUT_POINTAGE_LABELS[name] ?? name]} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function HeuresParSemaineChart({ data }: ChartProps) {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="text-base">Heures travaillees par semaine</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorHeures" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="semaine" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value: any) => [`${value}h`, "Heures"]} />
            <Area type="monotone" dataKey="heures" stroke="#10b981" fill="url(#colorHeures)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

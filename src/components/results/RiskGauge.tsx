'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, Legend } from 'recharts';
import { CardDescription }
from '@/components/ui/card';

interface RiskGaugeProps {
  score: number; // Score from 0 to 1
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  const percentage = Math.round(score * 100);
  let color = 'hsl(var(--chart-1))'; // Default green (or teal primary)
  let riskLevel = 'Low';

  if (percentage >= 70) {
    color = 'hsl(var(--chart-5))'; // Red
    riskLevel = 'High';
  } else if (percentage >= 40) {
    color = 'hsl(var(--chart-4))'; // Yellow/Orange
    riskLevel = 'Medium';
  }

  const data = [
    {
      name: 'Risk Score',
      value: percentage,
      fill: color,
    },
  ];

  return (
    <div className="w-full h-64 md:h-72 flex flex-col items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="90%"
          barSize={20}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
            angleAxisId={0}
          />
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground font-headline text-4xl font-bold"
            style={{ fill: 'hsl(var(--foreground))' }}
          >
            {`${percentage}%`}
          </text>
           <text
            x="50%"
            y="62%" // Position below the percentage
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-muted-foreground text-sm"
            style={{ fill: 'hsl(var(--muted-foreground))' }}
          >
            {riskLevel} Risk
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RiskGauge;

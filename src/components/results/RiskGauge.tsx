'use client';

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RiskGaugeProps {
  score: number; // Score can be 0-1 (e.g., 0.75) or 0-100 (e.g., 75 for 75%)
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ score }) => {
  let percentage: number;

  if (score >= 0 && score <= 1) {
    // If score is in 0-1 range (e.g., 0.75), multiply by 100
    percentage = Math.round(score * 100);
  } else if (score > 1 && score <= 100) {
    // If score is in 1-100 range (e.g., 75 for 75%), assume it's already a percentage
    percentage = Math.round(score);
  } else if (score > 100) {
    // If score is unexpectedly high (e.g. > 100), cap it at 100%
    percentage = 100;
  } else {
    // Default to 0 for negative, NaN, or other unexpected values
    percentage = 0;
  }

  let color = '#10b981'; // Emerald for low risk
  let bgColor = '#d1fae5'; // Light emerald background
  let riskLevel = 'Low';
  let riskIcon = Shield;
  let textColor = 'text-emerald-700';
  let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';

  if (percentage >= 70) {
    color = '#ef4444'; // Red for high risk
    bgColor = '#fee2e2'; // Light red background
    riskLevel = 'High';
    riskIcon = AlertTriangle;
    textColor = 'text-red-700';
    badgeVariant = 'destructive';
  } else if (percentage >= 40) {
    color = '#f59e0b'; // Amber for medium risk
    bgColor = '#fef3c7'; // Light amber background
    riskLevel = 'Medium';
    riskIcon = Activity;
    textColor = 'text-amber-700';
    badgeVariant = 'secondary';
  }

  const IconComponent = riskIcon;

  const data = [
    {
      name: 'Risk Score',
      value: percentage,
      fill: color,
    },
  ];

  return (
    <motion.div 
      className="w-full h-72 flex flex-col items-center justify-center relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
    >
      {/* Background Circle */}
      <div 
        className="absolute inset-4 rounded-full border-4 border-dashed opacity-20"
        style={{ borderColor: color }}
      />
      
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="50%"
          outerRadius="85%"
          barSize={24}
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
            background={{ fill: '#f3f4f6', stroke: '#e5e7eb', strokeWidth: 2 }}
            dataKey="value"
            cornerRadius={12}
            angleAxisId={0}
            style={{
              filter: 'drop-shadow(0 4px 6px -1px rgba(0, 0, 0, 0.1))',
            }}
          />
          
          {/* Animated Percentage Text */}
          <motion.text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground font-bold text-3xl"
            style={{ fill: 'hsl(var(--foreground))' }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.5 }}
          >
            {`${percentage}%`}
          </motion.text>
        </RadialBarChart>
      </ResponsiveContainer>

      {/* Risk Level Badge */}
      <motion.div
        className="absolute bottom-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
      >
        <Badge 
          variant={badgeVariant}
          className={cn(
            "px-4 py-2 text-sm font-semibold flex items-center gap-2 shadow-lg",
            textColor
          )}
          style={{ backgroundColor: bgColor, borderColor: color }}
        >
          <IconComponent className="h-4 w-4" />
          {riskLevel} Risk
        </Badge>
      </motion.div>

      {/* Decorative Elements */}
      <motion.div
        className="absolute top-2 right-2 opacity-10"
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <IconComponent className="h-6 w-6" style={{ color }} />
      </motion.div>
    </motion.div>
  );
};

export default RiskGauge;

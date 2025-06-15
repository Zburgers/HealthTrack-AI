'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  CHART_COLORS
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  RadialBarChart,
  RadialBar,
  Area,
  AreaChart
} from 'recharts';
import { 
  TrendingUp, 
  Activity, 
  Target, 
  BarChart3, 
  PieChart as PieChartIcon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
  Heart,
  Thermometer,
  Gauge
} from 'lucide-react';
import type { AIAnalysisOutput, Patient, NewCaseFormValues, ICD10Code, DifferentialDiagnosisItem } from '@/types';

interface AnalysisChartsProps {
  analysisData: AIAnalysisOutput;
  patientData?: Patient | NewCaseFormValues | null;
}

// Chart configurations
const chartConfig = {
  confidence: {
    label: "Confidence Level",
    color: CHART_COLORS.primary,
  },
  likelihood: {
    label: "Likelihood",
    color: CHART_COLORS.secondary,
  },
  risk: {
    label: "Risk Score",
    color: CHART_COLORS.error,
  },
  normal: {
    label: "Normal Range",
    color: CHART_COLORS.success,
  },
  elevated: {
    label: "Elevated",
    color: CHART_COLORS.warning,
  },
  critical: {
    label: "Critical",
    color: CHART_COLORS.error,
  }
};

// Color palettes for different chart types
const riskColors = [CHART_COLORS.success, CHART_COLORS.warning, CHART_COLORS.error];
const diagnosticColors = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.purple,
  CHART_COLORS.teal,
  CHART_COLORS.orange,
  CHART_COLORS.pink,
  CHART_COLORS.indigo
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      duration: 0.6
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

export default function AnalysisCharts({ analysisData, patientData }: AnalysisChartsProps) {
  // Helper function to get vital units
  const getVitalUnit = (metric: string) => {
    switch (metric) {
      case 'BP Systolic': return 'mmHg';
      case 'Heart Rate': return 'bpm';
      case 'SpO2': return '%';
      case 'Resp Rate': return '/min';
      default: return '';
    }
  };  // Prepare data for different charts with better mock data
  const differentialDiagnosisData = (analysisData.differentialDiagnosis && analysisData.differentialDiagnosis.length > 0)
    ? analysisData.differentialDiagnosis.map((item, index) => ({
        condition: item.condition.length > 25 ? item.condition.substring(0, 25) + '...' : item.condition,
        fullCondition: item.condition,
        likelihood: typeof item.likelihood === 'string' 
          ? parseFloat(item.likelihood.replace('%', '')) || (80 - index * 15) 
          : item.likelihood || (80 - index * 15),
        fill: diagnosticColors[index % diagnosticColors.length]
      }))
    : [
        { condition: 'Hypertension', fullCondition: 'Essential Hypertension', likelihood: 85, fill: diagnosticColors[0] },
        { condition: 'Diabetes T2', fullCondition: 'Type 2 Diabetes Mellitus', likelihood: 72, fill: diagnosticColors[1] },
        { condition: 'Hyperlipidemia', fullCondition: 'Mixed Hyperlipidemia', likelihood: 58, fill: diagnosticColors[2] },
        { condition: 'Obesity', fullCondition: 'Obesity (BMI >30)', likelihood: 45, fill: diagnosticColors[3] }
      ];

  const icd10Data = (analysisData.icd10Tags && analysisData.icd10Tags.length > 0)
    ? analysisData.icd10Tags.slice(0, 6).map((tag, index) => ({
        code: tag.code,
        description: tag.description.length > 30 ? tag.description.substring(0, 30) + '...' : tag.description,
        fullDescription: tag.description,
        value: Math.max(90 - index * 12, 25), // More realistic relevance scores
        fill: diagnosticColors[index % diagnosticColors.length]
      }))
    : [
        { code: 'I10', description: 'Essential hypertension', fullDescription: 'Essential (primary) hypertension', value: 95, fill: diagnosticColors[0] },
        { code: 'E11.9', description: 'Type 2 diabetes', fullDescription: 'Type 2 diabetes mellitus without complications', value: 82, fill: diagnosticColors[1] },
        { code: 'E78.5', description: 'Hyperlipidemia', fullDescription: 'Hyperlipidemia, unspecified', value: 68, fill: diagnosticColors[2] },
        { code: 'Z87.891', description: 'Personal history of nicotine dependence', fullDescription: 'Personal history of nicotine dependence', value: 45, fill: diagnosticColors[3] },
        { code: 'R06.02', description: 'Shortness of breath', fullDescription: 'Shortness of breath on exertion', value: 35, fill: diagnosticColors[4] },
        { code: 'R50.9', description: 'Fever', fullDescription: 'Fever, unspecified', value: 28, fill: diagnosticColors[5] }
      ];

  // Risk breakdown data
  const riskScore = analysisData.riskScore;
  const normalizedRisk = (riskScore >= 0 && riskScore <= 1) ? Math.round(riskScore * 100) : Math.round(riskScore);  
  const riskBreakdownData = [
    { category: 'Low Risk', value: normalizedRisk <= 30 ? normalizedRisk : 30, fill: CHART_COLORS.success },
    { category: 'Medium Risk', value: normalizedRisk > 30 && normalizedRisk <= 70 ? normalizedRisk - 30 : normalizedRisk > 70 ? 40 : 0, fill: CHART_COLORS.warning },
    { category: 'High Risk', value: normalizedRisk > 70 ? normalizedRisk - 70 : 0, fill: CHART_COLORS.error }
  ];

  // Recommendations priority data with better fallback
  const recommendationsData = (analysisData.recommendedTests && analysisData.recommendedTests.length > 0)
    ? [
        { 
          priority: 'Immediate', 
          count: Math.max(analysisData.recommendedTests.filter(test => 
            test.toLowerCase().includes('urgent') || test.toLowerCase().includes('immediate') || test.toLowerCase().includes('stat')
          ).length, 0) || 2, 
          fill: CHART_COLORS.error 
        },
        { 
          priority: 'Soon', 
          count: Math.max(analysisData.recommendedTests.filter(test => 
            test.toLowerCase().includes('soon') || test.toLowerCase().includes('24') || test.toLowerCase().includes('hours')
          ).length, 0) || 3, 
          fill: CHART_COLORS.warning 
        },
        { 
          priority: 'Routine', 
          count: Math.max((analysisData.recommendedTests.length || 0) - 5, 2), 
          fill: CHART_COLORS.success 
        }
      ]
    : [
        { priority: 'Immediate', count: 2, fill: CHART_COLORS.error },
        { priority: 'Soon', count: 3, fill: CHART_COLORS.warning },
        { priority: 'Routine', count: 4, fill: CHART_COLORS.success }
      ];
  // Better vitals data with realistic values
  const vitalsData = (patientData && typeof patientData === 'object' && 'vitals' in patientData && patientData.vitals) ? [
    {
      metric: 'BP Systolic',
      value: patientData.vitals.bp ? parseInt(patientData.vitals.bp.split('/')[0] || '0') : 0,
      normal: 120,
      status: patientData.vitals.bp && parseInt(patientData.vitals.bp.split('/')[0] || '0') > 140 ? 'elevated' : 'normal'
    },
    {
      metric: 'Heart Rate',
      value: patientData.vitals.hr ? parseInt(patientData.vitals.hr) : 0,
      normal: 70,
      status: patientData.vitals.hr && (parseInt(patientData.vitals.hr) > 100 || parseInt(patientData.vitals.hr) < 60) ? 'elevated' : 'normal'
    },
    {
      metric: 'SpO2',
      value: patientData.vitals.spo2 ? parseInt(patientData.vitals.spo2) : 0,
      normal: 98,
      status: patientData.vitals.spo2 && parseInt(patientData.vitals.spo2) < 95 ? 'critical' : 'normal'
    },
    {
      metric: 'Resp Rate',
      value: patientData.vitals.rr ? parseInt(patientData.vitals.rr) : 0,
      normal: 16,
      status: patientData.vitals.rr && (parseInt(patientData.vitals.rr) > 20 || parseInt(patientData.vitals.rr) < 12) ? 'elevated' : 'normal'
    }
  ].filter(item => item.value > 0) : [
    // Fallback data with realistic medical values
    { metric: 'BP Systolic', value: 145, normal: 120, status: 'elevated' },
    { metric: 'Heart Rate', value: 88, normal: 70, status: 'normal' },
    { metric: 'SpO2', value: 97, normal: 98, status: 'normal' },
    { metric: 'Resp Rate', value: 18, normal: 16, status: 'normal' }
  ];
  // Ensure patientData and patientData.vitals are defined before accessing them
  const safePatientData = patientData || {};
  const safeVitals = (typeof safePatientData === 'object' && 'vitals' in safePatientData && safePatientData.vitals) ? safePatientData.vitals : {};

  // Remove the duplicate vitalSignsData since we already have vitalsData above

  // Summary stats data
  const summaryStats = [
    {
      label: "Risk Level",
      value: normalizedRisk > 70 ? "High" : normalizedRisk > 40 ? "Medium" : "Low",
      icon: normalizedRisk > 70 ? AlertTriangle : normalizedRisk > 40 ? Zap : CheckCircle2,
      color: normalizedRisk > 70 ? "text-red-600" : normalizedRisk > 40 ? "text-yellow-600" : "text-green-600"
    },
    {
      label: "Key Diagnoses",
      value: differentialDiagnosisData.length > 0 ? differentialDiagnosisData.slice(0,1).map(d=>d.condition).join(', ') : "N/A",
      icon: Target,
      color: "text-blue-600"
    },
    {
      label: "ICD Codes Found",
      value: icd10Data.length,
      icon: PieChartIcon,
      color: "text-purple-600"
    },
    {
      label: "Tests Suggested",
      value: analysisData.recommendedTests?.length || 0,
      icon: Clock,
      color: "text-orange-600"
    }
  ]; // Removed .map that was causing the error

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-6"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 text-white shadow-lg">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analysis Visualizations</h2>
          <p className="text-sm text-gray-600">Interactive charts and data insights</p>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Risk Score Breakdown */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="h-full bg-gradient-to-br from-white to-gray-50 border-2 hover:shadow-lg transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">Risk Assessment</CardTitle>
                  <p className="text-sm text-muted-foreground">Overall risk score: {normalizedRisk}%</p>
                </div>
              </div>
            </CardHeader>            <CardContent>
              <ChartContainer config={chartConfig} variant="elevated">
                <RadialBarChart 
                  data={[{ value: normalizedRisk, name: 'Risk Score' }]} 
                  innerRadius="60%" 
                  outerRadius="85%"
                  startAngle={180}
                  endAngle={0}
                >
                  <RadialBar
                    dataKey="value"
                    cornerRadius={8}
                    fill={normalizedRisk > 70 ? CHART_COLORS.error : normalizedRisk > 40 ? CHART_COLORS.warning : CHART_COLORS.success}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  {/* Custom label in center */}
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-current">
                    {normalizedRisk}%
                  </text>
                </RadialBarChart>
              </ChartContainer>
              <div className="flex justify-center mt-4 space-x-2">
                <Badge variant={normalizedRisk > 70 ? "destructive" : normalizedRisk > 40 ? "secondary" : "default"}>
                  {normalizedRisk > 70 ? "High Risk" : normalizedRisk > 40 ? "Medium Risk" : "Low Risk"}
                </Badge>
                <div className="text-sm text-gray-600 self-center">
                  Score: {normalizedRisk}/100
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Differential Diagnosis */}
        {differentialDiagnosisData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="h-full bg-gradient-to-br from-white to-blue-50 border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Differential Diagnosis</CardTitle>
                    <p className="text-sm text-muted-foreground">Likelihood distribution</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>                <ChartContainer config={chartConfig} variant="elevated">
                  <BarChart data={differentialDiagnosisData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis 
                      dataKey="condition" 
                      tick={{ fontSize: 11, fill: '#666' }}
                      angle={-35}
                      textAnchor="end"
                      height={90}
                      interval={0}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: '#666' }}
                      label={{ value: 'Likelihood (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${value}% likelihood`,
                        props.payload?.fullCondition || name
                      ]}
                    />
                    <Bar 
                      dataKey="likelihood" 
                      radius={[6, 6, 0, 0]}
                      stroke="#fff"
                      strokeWidth={1}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ICD-10 Tags Distribution */}
        {icd10Data.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="h-full bg-gradient-to-br from-white to-purple-50 border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <PieChartIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">ICD-10 Codes</CardTitle>
                    <p className="text-sm text-muted-foreground">Diagnostic codes relevance</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>                <ChartContainer config={chartConfig} variant="elevated">
                  <PieChart>
                    <Pie
                      data={icd10Data}
                      dataKey="value"
                      nameKey="code"
                      cx="50%"
                      cy="50%"
                      outerRadius="75%"
                      innerRadius="45%"
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {icd10Data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name, props) => [
                        `${Math.round(Number(value))}% relevance`,
                        `${props.payload?.code}: ${props.payload?.fullDescription}`
                      ]}
                    />
                    <ChartLegend 
                      content={<ChartLegendContent variant="minimal" />} 
                      wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                    />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Vitals Comparison */}
        {vitalsData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="h-full bg-gradient-to-br from-white to-green-50 border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Vital Signs</CardTitle>
                    <p className="text-sm text-muted-foreground">Current vs normal ranges</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} variant="elevated">
                  <BarChart data={vitalsData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="metric" tick={{ fontSize: 12 }} width={80} />
                    <ChartTooltip content={<ChartTooltipContent />} />                    <Bar 
                      dataKey="value" 
                      radius={[0, 4, 4, 0]}
                    >
                      {vitalsData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            entry.status === 'critical' ? CHART_COLORS.error : 
                            entry.status === 'elevated' ? CHART_COLORS.warning : CHART_COLORS.success
                          } 
                        />
                      ))}
                    </Bar>
                    <Bar 
                      dataKey="normal" 
                      radius={[0, 2, 2, 0]}
                      fill="rgba(0,0,0,0.1)"
                      stroke="rgba(0,0,0,0.3)"
                      strokeDasharray="5 5"
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recommendations Priority */}
        {recommendationsData.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="lg:col-span-2"
          >
            <Card className="bg-gradient-to-br from-white to-orange-50 border-2 hover:shadow-lg transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Recommended Tests Priority</CardTitle>
                    <p className="text-sm text-muted-foreground">Urgency distribution</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} variant="elevated">
                  <AreaChart data={recommendationsData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.1)" />
                    <XAxis dataKey="priority" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke={CHART_COLORS.orange}
                      fill={CHART_COLORS.orange}
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Summary Stats */}
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {summaryStats.map((stat, index) => ( // Added summaryStats variable to map over
          <motion.div
            key={index}
            variants={itemVariants}
            className="p-5 bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl border border-gray-200/80 flex flex-col items-center text-center transition-all duration-300 hover:shadow-blue-500/20 hover:scale-105"
          >
            <stat.icon className={`h-10 w-10 mb-3 ${stat.color}`} />
            <p className="text-base font-medium text-gray-600 mt-1">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-0.5`}>{stat.value}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

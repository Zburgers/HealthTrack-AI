'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Send, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  Clipboard, 
  User, 
  Activity, 
  Stethoscope,
  Sparkles,
  Info, 
  AlertTriangle,
  ChevronDown,
  Edit3,
  Heart,
  Thermometer,
  Clock,
  FileText,
  Shield,
  Zap,
  Plus,
  Brain
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const formSchema = z.object({
  patientName: z.string().min(2, { message: 'Patient name must be at least 2 characters.' }).max(100),
  age: z.coerce.number().int().positive({ message: 'Age must be a positive number.' }).min(0).max(120),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required.' }),
  visitDate: z.date({ required_error: 'Visit date is required.' }),
  primaryComplaint: z.string().min(5, { message: 'Primary complaint must be at least 5 characters.' }).max(1000),
  previousConditions: z.string().max(1000).optional(),
  allergies: z.string().max(1000).optional(),
  medications: z.string().max(1000).optional(),
  bp: z.string().max(20).optional(),
  hr: z.string().max(10).optional(),
  rr: z.string().max(10).optional(),
  temp: z.string().max(10).optional(),
  spo2: z.string().max(10).optional(),
  severityLevel: z.enum(['Low', 'Moderate', 'High', 'Not Specified']).default('Not Specified'),
  caseType: z.enum(['Chronic', 'Acute', 'Follow-up', 'Consultation', 'Not Specified']).default('Not Specified'),
  observations: z.string().max(5000).optional(),
  clinicalNotes: z.string().max(5000).optional(),
});

export type NewCaseFormValues = z.infer<typeof formSchema>;

const VITAL_RANGES = {
  bp: "Systolic <120 mmHg and Diastolic <80 mmHg",
  hr: "60-100 bpm",
  rr: "12-20 breaths/min",
  temp: "36.1°C - 37.2°C",
  spo2: "95-100%",
};

const SEVERITY_OPTIONS = ['Not Specified', 'Low', 'Moderate', 'High'] as const;
const CASE_TYPE_OPTIONS = ['Not Specified', 'Acute', 'Chronic', 'Follow-up', 'Consultation'] as const;
const GENDER_OPTIONS = ['Male', 'Female', 'Other'] as const;

const SEVERITY_COLORS: Record<typeof SEVERITY_OPTIONS[number], string> = {
  'Not Specified': 'bg-gray-100 text-gray-800 border-gray-300',
  'Low': 'bg-green-100 text-green-800 border-green-300',
  'Moderate': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'High': 'bg-red-100 text-red-800 border-red-300',
};

const CASE_TYPE_COLORS: Record<typeof CASE_TYPE_OPTIONS[number], string> = {
  'Not Specified': 'bg-gray-100 text-gray-800 border-gray-300',
  'Acute': 'bg-orange-100 text-orange-800 border-orange-300',
  'Chronic': 'bg-blue-100 text-blue-800 border-blue-300',
  'Follow-up': 'bg-purple-100 text-purple-800 border-purple-300',
  'Consultation': 'bg-teal-100 text-teal-800 border-teal-300',
};

export default function NewCaseForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeAccordionItem, setActiveAccordionItem] = useState<string | undefined>("patient");

  const form = useForm<NewCaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: '',
      age: undefined, 
      gender: undefined,
      visitDate: new Date(),
      primaryComplaint: '',
      previousConditions: '',
      allergies: '',
      medications: '',
      bp: '',
      hr: '',
      rr: '',
      temp: '',
      spo2: '',
      severityLevel: 'Not Specified',
      caseType: 'Not Specified',
      observations: '',
      clinicalNotes: '',
    },
  });

  // Watch all form values
  const watchedValues = form.watch();
  
  // Fixed progress calculation logic
  const completedSections = useMemo(() => {
    const sections = {
      patient: false,
      vitals: false,
      history: false,
      classification: false,
      notes: false
    };
    
    // Patient section - ALL required fields must be filled
    if (watchedValues.patientName && 
        watchedValues.age && 
        watchedValues.gender && 
        watchedValues.visitDate && 
        watchedValues.primaryComplaint?.trim()) {
      sections.patient = true;
    }
    
    // Vitals section - at least 3 vitals should be filled
    const vitalsCount = [
      watchedValues.bp,
      watchedValues.hr,
      watchedValues.rr,
      watchedValues.temp,
      watchedValues.spo2
    ].filter(v => v && v.trim()).length;
    
    if (vitalsCount >= 3) {
      sections.vitals = true;
    }
    
    // History section - at least 2 of 3 fields should be filled
    const historyCount = [
      watchedValues.previousConditions,
      watchedValues.allergies,
      watchedValues.medications
    ].filter(v => v && v.trim()).length;
    
    if (historyCount >= 2) {
      sections.history = true;
    }
    
    // Classification section - both fields should be specified
    if (watchedValues.severityLevel && watchedValues.severityLevel !== 'Not Specified' &&
        watchedValues.caseType && watchedValues.caseType !== 'Not Specified') {
      sections.classification = true;
    }
    
    // Notes section - at least one field should have substantial content
    if ((watchedValues.observations && watchedValues.observations.trim().length > 20) ||
        (watchedValues.clinicalNotes && watchedValues.clinicalNotes.trim().length > 20)) {
      sections.notes = true;
    }
    
    return sections;
  }, [watchedValues]);

  // Calculate overall completion percentage
  const completionPercentage = useMemo(() => {
    const completedCount = Object.values(completedSections).filter(Boolean).length;
    return Math.round((completedCount / 5) * 100);
  }, [completedSections]);

  async function onSubmit(values: NewCaseFormValues) {
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to submit the new case.');
      }

      toast({
        title: '✅ Case Created Successfully',
        description: 'Redirecting to patient dashboard for AI analysis...',
        duration: 4000,
      });
      
      router.push(`/dashboard/patient/${result.patientId}`);

    } catch (error) {
      console.error('Submission Error:', error);
      toast({
        title: '❌ Submission Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
        duration: 6000,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const SectionHeader = ({ 
    title, 
    description, 
    icon: Icon, 
    sectionKey, 
    gradientFrom = "from-primary",
    gradientTo = "to-primary/70"
  }: { 
    title: string; 
    description: string; 
    icon: React.ElementType; 
    sectionKey: keyof typeof completedSections;
    gradientFrom?: string;
    gradientTo?: string;
  }) => (
    <AccordionTrigger className="w-full hover:no-underline px-6 py-5 rounded-lg transition-all duration-200 hover:bg-slate-50/80 data-[state=open]:bg-slate-50 data-[state=open]:shadow-sm border-0">
      <div className="flex items-center gap-4 w-full">
        <motion.div 
          className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-sm`}
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <AnimatePresence>
              {completedSections[sectionKey] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2, ease: "backOut" }}
                  className="flex items-center justify-center bg-green-500 text-white rounded-full h-5 w-5"
                >
                  <CheckCircle className="h-3 w-3" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-sm text-slate-600 mt-0.5">{description}</p>
        </div>
        <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </div>
    </AccordionTrigger>
  );

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-8 px-4">
        <motion.div 
          className="max-w-4xl mx-auto space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Enhanced Header */}
          <motion.div 
            className="relative overflow-hidden bg-white border border-blue-200/50 rounded-2xl p-8 shadow-lg"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-500/10 to-pink-500/10 rounded-full translate-y-12 -translate-x-12"></div>
            
            <div className="relative">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                    <Brain className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-1">New Patient Case</h1>
                    <p className="text-slate-600 text-lg">Complete patient information for AI-powered analysis</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {completionPercentage}%
                  </div>
                  <div className="text-sm text-slate-500 font-medium">Complete</div>
                </div>
              </div>
              
              <div className="space-y-3">
                <Progress value={completionPercentage} className="h-3 bg-slate-100" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 font-medium">
                    {Object.values(completedSections).filter(Boolean).length} of 5 sections completed
                  </span>
                  <span className="text-slate-500 flex items-center gap-1">
                    <Sparkles className="h-4 w-4" />
                    Better data = Better AI insights
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Accordion 
                  type="single" 
                  value={activeAccordionItem} 
                  onValueChange={setActiveAccordionItem} 
                  className="space-y-4"
                >
                  
                  {/* Patient Information Section */}
                  <AccordionItem value="patient" className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <SectionHeader 
                      title="Patient Information" 
                      description="Essential patient demographics and visit details"
                      icon={User}
                      sectionKey="patient"
                      gradientFrom="from-blue-500"
                      gradientTo="to-blue-600"
                    />
                    <AccordionContent className="px-6 pb-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2"
                      >
                        <FormField
                          control={form.control}
                          name="patientName"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Patient Name *</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Enter patient's full name" 
                                  {...field} 
                                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="age"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Age *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="Enter age" 
                                  {...field} 
                                  className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Gender *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20">
                                    <SelectValue placeholder="Select gender" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {GENDER_OPTIONS.map((gender) => (
                                    <SelectItem key={gender} value={gender}>
                                      {gender}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="visitDate"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Visit Date *</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        "w-full h-12 pl-3 text-left font-normal border-slate-200 focus:border-blue-500 focus:ring-blue-500/20",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date > new Date() || date < new Date("1900-01-01")
                                    }
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="md:col-span-2">
                          <FormField
                            control={form.control}
                            name="primaryComplaint"
                            render={({ field }) => (
                              <FormItem className="space-y-2">
                                <FormLabel className="text-sm font-semibold text-slate-700">Primary Complaint *</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Describe the patient's chief complaint or reason for the visit..."
                                    className="min-h-[100px] resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-500/20"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormDescription className="text-slate-500">
                                  Detailed description of the patient's main concern
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Vital Signs Section */}
                  <AccordionItem value="vitals" className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <SectionHeader 
                      title="Vital Signs" 
                      description="Current patient vital measurements and parameters"
                      icon={Activity}
                      sectionKey="vitals"
                      gradientFrom="from-red-500"
                      gradientTo="to-red-600"
                    />
                    <AccordionContent className="px-6 pb-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2"
                      >
                        <FormField
                          control={form.control}
                          name="bp"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Heart className="h-4 w-4 text-red-500" />
                                Blood Pressure
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="120/80" 
                                  {...field} 
                                  className="h-11 border-slate-200 focus:border-red-500 focus:ring-red-500/20" 
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-slate-500">
                                Normal: {VITAL_RANGES.bp}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hr"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-500" />
                                Heart Rate
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="72" 
                                  {...field} 
                                  className="h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20" 
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-slate-500">
                                Normal: {VITAL_RANGES.hr}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="rr"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Zap className="h-4 w-4 text-green-500" />
                                Respiratory Rate
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="16" 
                                  {...field} 
                                  className="h-11 border-slate-200 focus:border-green-500 focus:ring-green-500/20" 
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-slate-500">
                                Normal: {VITAL_RANGES.rr}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="temp"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Thermometer className="h-4 w-4 text-orange-500" />
                                Temperature
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="36.5" 
                                  {...field} 
                                  className="h-11 border-slate-200 focus:border-orange-500 focus:ring-orange-500/20" 
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-slate-500">
                                Normal: {VITAL_RANGES.temp}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="spo2"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Shield className="h-4 w-4 text-purple-500" />
                                SpO2
                              </FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="98" 
                                  {...field} 
                                  className="h-11 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20" 
                                />
                              </FormControl>
                              <FormDescription className="text-xs text-slate-500">
                                Normal: {VITAL_RANGES.spo2}
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Medical History Section */}
                  <AccordionItem value="history" className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <SectionHeader 
                      title="Medical History" 
                      description="Past conditions, allergies, and current medications"
                      icon={Clipboard}
                      sectionKey="history"
                      gradientFrom="from-green-500"
                      gradientTo="to-green-600"
                    />
                    <AccordionContent className="px-6 pb-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 pt-2"
                      >
                        <FormField
                          control={form.control}
                          name="previousConditions"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Previous Conditions</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="List any previous medical conditions, surgeries, or significant medical history..."
                                  className="min-h-[90px] resize-none border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="allergies"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Allergies</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="List any known allergies (medications, food, environmental)..."
                                  className="min-h-[90px] resize-none border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="medications"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Current Medications</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="List current medications with dosages and frequency..."
                                  className="min-h-[90px] resize-none border-slate-200 focus:border-green-500 focus:ring-green-500/20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Case Classification Section */}
                  <AccordionItem value="classification" className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <SectionHeader 
                      title="Case Classification" 
                      description="Severity level and case type for proper categorization"
                      icon={AlertTriangle}
                      sectionKey="classification"
                      gradientFrom="from-purple-500"
                      gradientTo="to-purple-600"
                    />
                    <AccordionContent className="px-6 pb-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2"
                      >
                        <FormField
                          control={form.control}
                          name="severityLevel"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Severity Level</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20">
                                    <SelectValue placeholder="Select severity" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {SEVERITY_OPTIONS.map((severity) => (
                                    <SelectItem key={severity} value={severity}>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("border", SEVERITY_COLORS[severity])}>
                                          {severity}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-slate-500">
                                Assess the urgency of medical attention required
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="caseType"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Case Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="h-12 border-slate-200 focus:border-purple-500 focus:ring-purple-500/20">
                                    <SelectValue placeholder="Select case type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {CASE_TYPE_OPTIONS.map((caseType) => (
                                    <SelectItem key={caseType} value={caseType}>
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className={cn("border", CASE_TYPE_COLORS[caseType])}>
                                          {caseType}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-slate-500">
                                Categorize the nature of the medical case
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>

                  {/* Clinical Notes Section */}
                  <AccordionItem value="notes" className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
                    <SectionHeader 
                      title="Clinical Notes" 
                      description="Detailed observations and clinical documentation"
                      icon={FileText}
                      sectionKey="notes"
                      gradientFrom="from-indigo-500"
                      gradientTo="to-indigo-600"
                    />
                    <AccordionContent className="px-6 pb-6">
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-6 pt-2"
                      >
                        <FormField
                          control={form.control}
                          name="observations"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Clinical Observations</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Document clinical observations, physical examination findings, and assessment..."
                                  className="min-h-[120px] resize-none border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription className="text-slate-500">
                                Include physical examination findings and objective observations
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="clinicalNotes"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-sm font-semibold text-slate-700">Additional Clinical Notes</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Add any additional clinical notes, plans, or recommendations..."
                                  className="min-h-[120px] resize-none border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription className="text-slate-500">
                                Treatment plans, follow-up instructions, or other relevant notes
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </motion.div>
                    </AccordionContent>
                  </AccordionItem>

                </Accordion>
              </motion.div>

              {/* Submit Section with Enhanced Design */}
              <motion.div 
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-200/30">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="text-center space-y-2">
                      <h3 className="text-lg font-semibold text-slate-900">Ready to Submit?</h3>
                      <p className="text-sm text-slate-600 max-w-md">
                        Once submitted, our AI will analyze the case and provide comprehensive insights and recommendations.
                      </p>
                    </div>
                    
                    <Button 
                      type="submit" 
                      disabled={isSubmitting || completionPercentage < 20}
                      className={cn(
                        "relative overflow-hidden group",
                        "bg-gradient-to-r from-blue-600 to-indigo-600",
                        "hover:from-blue-700 hover:to-indigo-700",
                        "text-white px-10 py-6 text-lg font-semibold",
                        "shadow-lg hover:shadow-xl",
                        "transition-all duration-300",
                        "transform hover:-translate-y-0.5",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        "disabled:hover:translate-y-0"
                      )}
                    >
                      <span className="relative z-10 flex items-center gap-3">
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Creating Case...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            Create Patient Case
                          </>
                        )}
                      </span>
                      
                      {/* Animated background effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>

                    {completionPercentage < 20 && (
                      <p className="text-sm text-amber-600 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Please complete at least the patient information section
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            </form>
          </Form>
        </motion.div>
      </div>
    </TooltipProvider>
  );
}
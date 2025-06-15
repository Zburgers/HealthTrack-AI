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
  Zap
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

const cardAnimationProps = (delay: number = 0) => ({
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, delay, ease: "easeOut" }
});

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
  'Not Specified': 'bg-gray-100 text-gray-800',
  'Low': 'bg-green-100 text-green-800',
  'Moderate': 'bg-yellow-100 text-yellow-800',
  'High': 'bg-red-100 text-red-800',
};

const CASE_TYPE_COLORS: Record<typeof CASE_TYPE_OPTIONS[number], string> = {
  'Not Specified': 'bg-gray-100 text-gray-800',
  'Acute': 'bg-orange-100 text-orange-800',
  'Chronic': 'bg-blue-100 text-blue-800',
  'Follow-up': 'bg-purple-100 text-purple-800',
  'Consultation': 'bg-teal-100 text-teal-800',
};

export default function NewCaseForm() {  const { toast } = useToast();
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
  // Watch specific fields to track completion - using individual watches to avoid infinite loops
  const patientName = form.watch('patientName');
  const age = form.watch('age');
  const gender = form.watch('gender');
  const visitDate = form.watch('visitDate');
  const primaryComplaint = form.watch('primaryComplaint');
  const bp = form.watch('bp');
  const hr = form.watch('hr');
  const rr = form.watch('rr');
  const temp = form.watch('temp');
  const spo2 = form.watch('spo2');
  const previousConditions = form.watch('previousConditions');
  const allergies = form.watch('allergies');
  const medications = form.watch('medications');
  const severityLevel = form.watch('severityLevel');
  const caseType = form.watch('caseType');
  const observations = form.watch('observations');
  const clinicalNotes = form.watch('clinicalNotes');
  
  // Calculate completed sections using useMemo to prevent unnecessary recalculations
  const completedSections = useMemo(() => {
    const newCompletedSections = new Set<string>();
    
    // Patient section
    if (patientName || age || gender || visitDate || primaryComplaint) {
      if (patientName && age && gender && visitDate && primaryComplaint) {
        newCompletedSections.add('patient');
      }
    }
    
    // Vitals section
    if (bp || hr || rr || temp || spo2) {
      newCompletedSections.add('vitals');
    }
    
    // History section
    if (previousConditions || allergies || medications) {
      newCompletedSections.add('history');
    }
    
    // Classification section
    if (severityLevel && severityLevel !== 'Not Specified' || caseType && caseType !== 'Not Specified') {
      newCompletedSections.add('classification');
    }
    
    // Notes section
    if (observations || clinicalNotes) {
      newCompletedSections.add('notes');
    }
    
    return newCompletedSections;
  }, [patientName, age, gender, visitDate, primaryComplaint, bp, hr, rr, temp, spo2, previousConditions, allergies, medications, severityLevel, caseType, observations, clinicalNotes]);

  // Calculate overall completion percentage
  const totalSections = 5;
  const completionPercentage = (completedSections.size / totalSections) * 100;

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
      
      // Redirect to the new patient's detail page
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
    sectionKey: string;
    gradientFrom?: string;
    gradientTo?: string;
  }) => (
    <AccordionTrigger className="w-full hover:no-underline p-6 rounded-lg transition-all hover:bg-muted/50 data-[state=open]:bg-muted/80 data-[state=open]:shadow-md">
      <div className="flex items-center gap-4 w-full">
        <motion.div 
          className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} text-white shadow-lg`}
          whileHover={{ scale: 1.05 }}
        >
          <Icon className="h-6 w-6" />
        </motion.div>
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-semibold text-foreground">{title}</h3>
            <AnimatePresence>
              {completedSections.has(sectionKey) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.3, ease: "backOut" }}
                  className="flex items-center justify-center bg-green-500 text-white rounded-full h-5 w-5"
                >
                  <CheckCircle className="h-3.5 w-3.5" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        </div>
        <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </div>
    </AccordionTrigger>
  );

  return (
    <TooltipProvider>
      <motion.div 
        className="max-w-4xl mx-auto space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Progress Header */}
        <motion.div 
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">New Patient Case</h2>
                <p className="text-muted-foreground">Complete all sections for comprehensive AI analysis</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{Math.round(completionPercentage)}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          <Progress value={completionPercentage} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span>{completedSections.size} of {totalSections} sections completed</span>
            <span>AI analysis will be more accurate with complete data</span>
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
                <AccordionItem value="patient" className="border rounded-xl shadow-sm">
                  <SectionHeader 
                    title="Patient Information" 
                    description="Basic patient demographics and visit details"
                    icon={User}
                    sectionKey="patient"
                    gradientFrom="from-blue-500"
                    gradientTo="to-blue-600"
                  />
                  <AccordionContent className="p-6 pt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <FormField
                        control={form.control}
                        name="patientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Patient Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter patient's full name" {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="age"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Age *</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Enter age" {...field} className="h-11" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Gender *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
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
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Visit Date *</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full h-11 pl-3 text-left font-normal",
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
                            <FormItem>
                              <FormLabel className="text-sm font-medium">Primary Complaint *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the patient's chief complaint or reason for the visit..."
                                  className="min-h-[100px] resize-none"
                                  {...field} 
                                />
                              </FormControl>
                              <FormDescription>
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
                <AccordionItem value="vitals" className="border rounded-xl shadow-sm">
                  <SectionHeader 
                    title="Vital Signs" 
                    description="Current patient vital measurements"
                    icon={Activity}
                    sectionKey="vitals"
                    gradientFrom="from-red-500"
                    gradientTo="to-red-600"
                  />
                  <AccordionContent className="p-6 pt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                      <FormField
                        control={form.control}
                        name="bp"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-2">
                              <Heart className="h-4 w-4 text-red-500" />
                              Blood Pressure
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="120/80" {...field} className="h-11" />
                            </FormControl>
                            <FormDescription className="text-xs">
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
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-2">
                              <Activity className="h-4 w-4 text-blue-500" />
                              Heart Rate
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="72" {...field} className="h-11" />
                            </FormControl>
                            <FormDescription className="text-xs">
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
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-2">
                              <Zap className="h-4 w-4 text-green-500" />
                              Respiratory Rate
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="16" {...field} className="h-11" />
                            </FormControl>
                            <FormDescription className="text-xs">
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
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-2">
                              <Thermometer className="h-4 w-4 text-orange-500" />
                              Temperature
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="36.5" {...field} className="h-11" />
                            </FormControl>
                            <FormDescription className="text-xs">
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
                          <FormItem>
                            <FormLabel className="text-sm font-medium flex items-center gap-2">
                              <Shield className="h-4 w-4 text-purple-500" />
                              SpO2
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="98" {...field} className="h-11" />
                            </FormControl>
                            <FormDescription className="text-xs">
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
                <AccordionItem value="history" className="border rounded-xl shadow-sm">
                  <SectionHeader 
                    title="Medical History" 
                    description="Past conditions, allergies, and current medications"
                    icon={Clipboard}
                    sectionKey="history"
                    gradientFrom="from-green-500"
                    gradientTo="to-green-600"
                  />
                  <AccordionContent className="p-6 pt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="previousConditions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Previous Conditions</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any previous medical conditions, surgeries, or significant medical history..."
                                className="min-h-[80px] resize-none"
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
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Allergies</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List any known allergies (medications, food, environmental)..."
                                className="min-h-[80px] resize-none"
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
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Current Medications</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="List current medications with dosages and frequency..."
                                className="min-h-[80px] resize-none"
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
                <AccordionItem value="classification" className="border rounded-xl shadow-sm">
                  <SectionHeader 
                    title="Case Classification" 
                    description="Severity level and case type for proper categorization"
                    icon={AlertTriangle}
                    sectionKey="classification"
                    gradientFrom="from-purple-500"
                    gradientTo="to-purple-600"
                  />
                  <AccordionContent className="p-6 pt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-6"
                    >
                      <FormField
                        control={form.control}
                        name="severityLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Severity Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SEVERITY_OPTIONS.map((severity) => (
                                  <SelectItem key={severity} value={severity}>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className={SEVERITY_COLORS[severity]}>
                                        {severity}
                                      </Badge>
                                    </div>
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
                        name="caseType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Case Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="h-11">
                                  <SelectValue placeholder="Select case type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CASE_TYPE_OPTIONS.map((caseType) => (
                                  <SelectItem key={caseType} value={caseType}>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className={CASE_TYPE_COLORS[caseType]}>
                                        {caseType}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </motion.div>
                  </AccordionContent>
                </AccordionItem>

                {/* Clinical Notes Section */}
                <AccordionItem value="notes" className="border rounded-xl shadow-sm">
                  <SectionHeader 
                    title="Clinical Notes" 
                    description="Detailed observations and clinical documentation"
                    icon={FileText}
                    sectionKey="notes"
                    gradientFrom="from-indigo-500"
                    gradientTo="to-indigo-600"
                  />
                  <AccordionContent className="p-6 pt-0">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <FormField
                        control={form.control}
                        name="observations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Clinical Observations</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Document clinical observations, physical examination findings, and assessment..."
                                className="min-h-[120px] resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
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
                          <FormItem>
                            <FormLabel className="text-sm font-medium">Additional Clinical Notes</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Add any additional clinical notes, plans, or recommendations..."
                                className="min-h-[120px] resize-none"
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
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

            {/* Submit Button */}
            <motion.div 
              className="flex justify-center pt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                    Creating Case...
                  </>
                ) : (
                  <>
                    <Send className="mr-3 h-5 w-5" />
                    Create Patient Case
                  </>
                )}
              </Button>
            </motion.div>
          </form>
        </Form>
      </motion.div>
    </TooltipProvider>
  );
}

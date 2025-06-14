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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Send, 
  CalendarIcon, 
  Brain, 
  Info, 
  User, 
  Activity, 
  Clipboard, 
  Stethoscope,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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

const SEVERITY_COLORS = {
  'Not Specified': 'bg-gray-100 text-gray-800',
  'Low': 'bg-green-100 text-green-800',
  'Moderate': 'bg-yellow-100 text-yellow-800',
  'High': 'bg-red-100 text-red-800',
};

const CASE_TYPE_COLORS = {
  'Not Specified': 'bg-gray-100 text-gray-800',
  'Acute': 'bg-orange-100 text-orange-800',
  'Chronic': 'bg-blue-100 text-blue-800',
  'Follow-up': 'bg-purple-100 text-purple-800',
  'Consultation': 'bg-teal-100 text-teal-800',
};

export default function NewCaseForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedSections, setCompletedSections] = useState<Set<string>>(new Set());

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
  // Watch form values to track completion
  const watchedValues = form.watch();
  
  // Check completion on form changes
  useEffect(() => {
    const newCompletedSections = new Set<string>();
    
    // Check patient section
    if (['patientName', 'age', 'gender'].some(field => {
      const value = watchedValues[field as keyof NewCaseFormValues];
      return value !== undefined && value !== '' && value !== 'Not Specified';
    })) {
      newCompletedSections.add('patient');
    }
    
    // Check vitals section
    if (['bp', 'hr', 'rr', 'temp', 'spo2'].some(field => {
      const value = watchedValues[field as keyof NewCaseFormValues];
      return value !== undefined && value !== '' && value !== 'Not Specified';
    })) {
      newCompletedSections.add('vitals');
    }
    
    // Check details section
    if (['severityLevel', 'caseType'].some(field => {
      const value = watchedValues[field as keyof NewCaseFormValues];
      return value !== undefined && value !== '' && value !== 'Not Specified';
    })) {
      newCompletedSections.add('details');
    }
    
    // Check observations section
    if (['observations'].some(field => {
      const value = watchedValues[field as keyof NewCaseFormValues];
      return value !== undefined && value !== '' && value !== 'Not Specified';
    })) {
      newCompletedSections.add('observations');
    }
    
    setCompletedSections(newCompletedSections);
  }, [watchedValues.patientName, watchedValues.age, watchedValues.gender, 
      watchedValues.bp, watchedValues.hr, watchedValues.rr, watchedValues.temp, watchedValues.spo2,
      watchedValues.severityLevel, watchedValues.caseType, watchedValues.observations]);

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
        title: 'Case Created Successfully',
        description: 'The patient case has been saved. Redirecting...',
      });
      
      // Redirect to the new patient's detail page
      router.push(`/dashboard/patient/${result.patientId}`);

    } catch (error) {
      console.error('Submission Error:', error);
      toast({
        title: 'Submission Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
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
    gradient 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    sectionKey: string;
    gradient: string;
  }) => (
    <CardHeader className="space-y-4">
      <div className="flex items-center gap-4">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl font-semibold text-foreground">{title}</CardTitle>
            <AnimatePresence>
              {completedSections.has(sectionKey) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <CardDescription className="text-muted-foreground mt-1">{description}</CardDescription>
        </div>
      </div>
    </CardHeader>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg">
            <Clipboard className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">New Patient Case</h1>
            <p className="text-muted-foreground">Create a comprehensive patient record for AI analysis</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-4 rounded-lg border">
          <Sparkles className="h-4 w-4 text-primary" />
          <span>Complete as many sections as possible for more accurate AI analysis and recommendations</span>
        </div>
      </motion.div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Patient Information */}
          <motion.div {...cardAnimationProps(0)}>
            <Card className="shadow-lg border-2 hover:border-primary/20 transition-colors duration-200">
              <SectionHeader 
                title="Patient Information" 
                description="Enter the patient's demographic and visit details"
                icon={User}
                sectionKey="patient"
                gradient="from-blue-500 to-indigo-500"
              />
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="patientName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Patient Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., John Doe" 
                          className="h-11" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Age</FormLabel>                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 58" 
                            className="h-11"
                            {...field}
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
                      <FormItem>
                        <FormLabel className="text-sm font-medium">Gender</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="visitDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-sm font-medium">Visit Date</FormLabel>
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
                              {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="primaryComplaint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Primary Complaint</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Chest pain for 2 days, worsening with activity..." 
                          className="min-h-[100px] resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="previousConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Previous Known Conditions</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="e.g., Hypertension, Type 2 Diabetes, Asthma" 
                          className="min-h-[80px] resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>List any relevant pre-existing conditions</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Vitals */}
          <motion.div {...cardAnimationProps(0.1)}>
            <Card className="shadow-lg border-2 hover:border-primary/20 transition-colors duration-200">
              <SectionHeader 
                title="Vital Signs" 
                description="Enter the patient's current vital signs"
                icon={Activity}
                sectionKey="vitals"
                gradient="from-red-500 to-pink-500"
              />
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(VITAL_RANGES).map(([key, range]) => {
                    const labels = {
                      bp: 'Blood Pressure (mmHg)',
                      hr: 'Heart Rate (bpm)',
                      rr: 'Respiratory Rate (breaths/min)',
                      temp: 'Temperature (°C)',
                      spo2: 'SpO₂ (%)'
                    };
                    
                    const placeholders = {
                      bp: '120/80',
                      hr: '75',
                      rr: '16',
                      temp: '37.0',
                      spo2: '98'
                    };

                    return (
                      <FormField
                        key={key}
                        control={form.control}
                        name={key as keyof NewCaseFormValues}
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center gap-2">
                              <FormLabel className="text-sm font-medium">
                                {labels[key as keyof typeof labels]}
                              </FormLabel>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-sm">Normal range: {range}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>                            <FormControl>
                              <Input 
                                placeholder={`e.g., ${placeholders[key as keyof typeof placeholders]}`}
                                className="h-11"
                                {...field}
                                value={field.value?.toString() || ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
          
          {/* Case Details */}
          <motion.div {...cardAnimationProps(0.2)}>
            <Card className="shadow-lg border-2 hover:border-primary/20 transition-colors duration-200">
              <SectionHeader 
                title="Case Classification" 
                description="Classify the case type and severity level"
                icon={Clipboard}
                sectionKey="details"
                gradient="from-purple-500 to-indigo-500"
              />
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            {Object.keys(SEVERITY_COLORS).map(severity => (
                              <SelectItem key={severity} value={severity}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS].split(' ')[0]}`} />
                                  {severity}
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
                            {Object.keys(CASE_TYPE_COLORS).map(caseType => (
                              <SelectItem key={caseType} value={caseType}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-3 h-3 rounded-full ${CASE_TYPE_COLORS[caseType as keyof typeof CASE_TYPE_COLORS].split(' ')[0]}`} />
                                  {caseType}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Observations */}
          <motion.div {...cardAnimationProps(0.3)}>
            <Card className="shadow-lg border-2 hover:border-primary/20 transition-colors duration-200">
              <SectionHeader 
                title="Clinical Observations" 
                description="Document your physical examination findings and clinical notes"
                icon={Stethoscope}
                sectionKey="observations"
                gradient="from-teal-500 to-cyan-500"
              />
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="observations"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="Physical examination findings:
• General appearance: Patient appears comfortable/distressed
• Vital signs: As recorded above
• Cardiovascular: Heart rate regular, no murmurs
• Respiratory: Clear breath sounds bilaterally
• Abdomen: Soft, non-tender, no masses
• Neurological: Alert and oriented
• Additional observations..."
                          className="min-h-[200px] resize-y font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="button" variant="outline" disabled className="w-full md:w-auto group">
                  <Brain className="mr-2 h-4 w-4 group-hover:text-primary transition-colors" />
                  AI-Assisted Observations
                  <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="sticky bottom-6 z-10"
          >
            <Card className="shadow-2xl border-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-muted-foreground">
                      {completedSections.size} of 4 sections completed
                    </div>
                    <div className="flex gap-1">
                      {['patient', 'vitals', 'details', 'observations'].map((section, index) => (
                        <div
                          key={section}
                          className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                            completedSections.has(section) 
                              ? 'bg-green-500' 
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full sm:w-auto min-w-[200px] h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-200 group"
                  >
                    <AnimatePresence mode="wait">
                      {isSubmitting ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center"
                        >
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Creating Case...
                        </motion.div>
                      ) : (
                        <motion.div
                          key="submit"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="flex items-center"
                        >
                          <Send className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
                          Save & Analyze Case
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </form>
      </Form>
    </div>
  );
}

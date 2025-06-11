
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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, CalendarIcon, Brain } from 'lucide-react';
import { useState } from 'react';
import { submitNewCase } from '@/lib/actions/caseActions';
import type { AnalyzePatientSymptomsInput } from '@/ai/flows/analyze-patient-symptoms';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';
import { motion } from 'framer-motion';

const formSchema = z.object({
  patientName: z.string().min(2, { message: 'Patient name must be at least 2 characters.' }).max(100),
  age: z.coerce.number().int().positive({ message: 'Age must be a positive number.' }).min(0).max(120),
  gender: z.enum(['Male', 'Female', 'Other'], { required_error: 'Gender is required.' }),
  visitDate: z.date({ required_error: 'Visit date is required.' }),
  primaryComplaint: z.string().min(5, { message: 'Primary complaint must be at least 5 characters.' }).max(1000),
  previousConditions: z.string().max(1000).optional(),
  bp: z.string().regex(/^\d{1,3}\/\d{1,3}$|^\s*$/, { message: 'Blood pressure must be in format like 120/80 or empty.'}).optional(),
  hr: z.string().regex(/^\d*$/, {message: "Heart rate must be a number or empty."}).optional(),
  rr: z.string().regex(/^\d*$/, {message: "Respiratory rate must be a number or empty."}).optional(),
  temp: z.string().regex(/^-?\d*\.?\d*$/, {message: "Temperature must be a number or empty."}).optional(),
  spo2: z.string().regex(/^\d*$/, {message: "SpO2 must be a number or empty."}).optional(),
  severityLevel: z.enum(['Low', 'Moderate', 'High', 'Not Specified']).default('Not Specified'),
  caseType: z.enum(['Acute', 'Chronic', 'Follow-up', 'Not Specified']).default('Not Specified'),
  observations: z.string().min(10, {
    message: 'Observations must be at least 10 characters.',
  }).max(5000, { message: 'Observations cannot exceed 5000 characters.'}),
});

export type NewCaseFormValues = z.infer<typeof formSchema>;

const cardAnimationProps = (delay: number = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay }
});

export default function NewCaseForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setAnalysisResult } = useAppState();

  const form = useForm<NewCaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientName: '',
      age: undefined, 
      gender: undefined,
      visitDate: new Date(),
      primaryComplaint: '',
      previousConditions: '',
      bp: '',
      hr: '',
      rr: '',
      temp: '',
      spo2: '',
      severityLevel: 'Not Specified',
      caseType: 'Not Specified',
      observations: '',
    },
  });

  async function onSubmit(values: NewCaseFormValues) {
    setIsSubmitting(true);

    let patientInfoString = `Patient: ${values.patientName}, ${values.age} y/o ${values.gender}. Visit Date: ${format(values.visitDate, 'PPP')}.`;
    patientInfoString += `\nPrimary Complaint: ${values.primaryComplaint}.`;
    if (values.previousConditions) {
      patientInfoString += `\nPrevious Known Conditions: ${values.previousConditions}.`;
    }
    if (values.severityLevel !== 'Not Specified') {
      patientInfoString += `\nCase Severity: ${values.severityLevel}.`;
    }
    if (values.caseType !== 'Not Specified') {
      patientInfoString += `\nCase Type: ${values.caseType}.`;
    }
    
    const vitalParts: string[] = [];
    if (values.bp) vitalParts.push(`BP ${values.bp} mmHg`);
    if (values.hr) vitalParts.push(`HR ${values.hr} bpm`);
    if (values.rr) vitalParts.push(`RR ${values.rr} breaths/min`);
    if (values.temp) vitalParts.push(`Temp ${values.temp}°C`);
    if (values.spo2) vitalParts.push(`SpO2 ${values.spo2}%`);
    const vitalsString = vitalParts.length > 0 ? vitalParts.join(', ') : 'Not specified';

    const analysisInput: AnalyzePatientSymptomsInput = {
      patientInformation: patientInfoString,
      vitals: vitalsString,
      observations: values.observations,
    };
    
    const fullCaseDataForDb = {
        ...values,
        visitDate: values.visitDate.toISOString(),
    };

    try {
      const response = await submitNewCase(analysisInput, fullCaseDataForDb);

      if (response.success && response.data) {
        toast({
          title: 'Analysis Successful',
          description: 'Patient case analysis complete. Redirecting...',
        });
        setAnalysisResult(response.data, null, values); 
        router.push('/analysis');
      } else {
        throw new Error(response.error || 'Analysis failed. Please try again.');
      }
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <motion.div {...cardAnimationProps(0)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Patient Information</CardTitle>
              <CardDescription>Enter the patient's demographic and visit details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="patientName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient Name</FormLabel>
                    <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g., 58" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
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
                    <FormLabel>Visit Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
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
                    <FormLabel>Primary Complaint</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Chest pain for 2 days..." className="min-h-[80px]" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="previousConditions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Known Conditions (Optional)</FormLabel>
                    <FormControl><Textarea placeholder="e.g., Hypertension, Type 2 Diabetes" className="min-h-[80px]" {...field} /></FormControl>
                    <FormDescription>List any relevant pre-existing conditions, comma-separated.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...cardAnimationProps(0.1)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Vitals</CardTitle>
              <CardDescription>Enter the patient's current vital signs. Leave blank if not applicable.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
                <FormField
                  control={form.control}
                  name="bp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Blood Pressure (mmHg)</FormLabel>
                      <FormControl><Input placeholder="e.g., 120/80" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Heart Rate (bpm)</FormLabel>
                      <FormControl><Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g., 75" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rr"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Respiratory Rate (breaths/min)</FormLabel>
                      <FormControl><Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g., 16" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="temp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Temperature (°C)</FormLabel>
                      <FormControl><Input type="text" inputMode="decimal" placeholder="e.g., 37.0" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spo2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SpO₂ (%)</FormLabel>
                      <FormControl><Input type="text" inputMode="numeric" pattern="[0-9]*" placeholder="e.g., 98" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div {...cardAnimationProps(0.2)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Case Details (Optional)</CardTitle>
              <CardDescription>Provide additional context about the case if available.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="severityLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Not Specified">Not Specified</SelectItem>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Moderate">Moderate</SelectItem>
                        <SelectItem value="High">High</SelectItem>
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
                    <FormLabel>Case Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select case type" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Not Specified">Not Specified</SelectItem>
                        <SelectItem value="Acute">Acute</SelectItem>
                        <SelectItem value="Chronic">Chronic</SelectItem>
                        <SelectItem value="Follow-up">Follow-up</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div {...cardAnimationProps(0.3)}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl">Doctor's Observations</CardTitle>
              <CardDescription>Describe your physical examination findings and other relevant clinical observations.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Patient appears anxious, diaphoretic. Mild tenderness to palpation in epigastric region..."
                        className="min-h-[150px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="outline" disabled className="w-full md:w-auto">
                <Brain className="mr-2 h-4 w-4" /> Suggest Observations (AI - Coming Soon)
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Button type="submit" disabled={isSubmitting} className="w-full py-3 text-base bg-primary hover:bg-primary/90">
            {isSubmitting ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Send className="mr-2 h-5 w-5" />
            )}
            Analyze Case
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}

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
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { submitNewCase } from '@/lib/actions/caseActions';
import type { AnalyzePatientSymptomsInput } from '@/ai/flows/analyze-patient-symptoms';
import { useRouter } from 'next/navigation';
import { useAppState } from '@/context/AppStateContext';


const formSchema = z.object({
  patientInformation: z.string().min(10, {
    message: 'Patient information must be at least 10 characters.',
  }).max(5000, { message: 'Patient information cannot exceed 5000 characters.'}),
  vitals: z.string().min(5, {
    message: 'Vitals must be at least 5 characters.',
  }).max(1000, { message: 'Vitals cannot exceed 1000 characters.'}),
  observations: z.string().min(10, {
    message: 'Observations must be at least 10 characters.',
  }).max(5000, { message: 'Observations cannot exceed 5000 characters.'}),
});

export type NewCaseFormValues = z.infer<typeof formSchema>;

export default function NewCaseForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setAnalysisResult } = useAppState();

  const form = useForm<NewCaseFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      patientInformation: '',
      vitals: '',
      observations: '',
    },
  });

  async function onSubmit(values: NewCaseFormValues) {
    setIsSubmitting(true);
    try {
      const analysisInput: AnalyzePatientSymptomsInput = {
        patientInformation: values.patientInformation,
        vitals: values.vitals,
        observations: values.observations,
      };
      const response = await submitNewCase(analysisInput);

      if (response.success && response.data) {
        toast({
          title: 'Analysis Successful',
          description: 'Patient case analysis complete.',
        });
        setAnalysisResult(response.data); // Store result in global state
        // Navigation will be handled by parent page NewCasePage which checks for analysisResult
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
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-2xl text-foreground">Patient Details</CardTitle>
        <CardDescription>Enter the patient's information, vitals, and your observations for AI analysis.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="patientInformation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Patient Information</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., 58 y/o male with history of hypertension, presenting with chest pain for 2 days..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Include age, gender, relevant medical history, and chief complaint.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vitals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Vitals</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., BP 150/90 mmHg, HR 95 bpm, RR 18/min, Temp 37.0°C, SpO2 98%" {...field} />
                  </FormControl>
                  <FormDescription>
                    Enter current vital signs.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="observations"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Doctor's Observations</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Patient appears anxious, diaphoretic. Mild tenderness to palpation in epigastric region. Lungs clear to auscultation bilaterally..."
                      className="min-h-[120px] resize-y"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe your physical examination findings and other relevant observations.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full py-3 text-base bg-primary hover:bg-primary/90">
              {isSubmitting ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <Send className="mr-2 h-5 w-5" />
              )}
              Analyze Case
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

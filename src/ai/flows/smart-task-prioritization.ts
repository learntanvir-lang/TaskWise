// src/ai/flows/smart-task-prioritization.ts
'use server';

/**
 * @fileOverview This file defines a Genkit flow for smart task prioritization.
 *
 * The flow analyzes task descriptions and deadlines to suggest task priorities.
 * - smartTaskPrioritization - The main function to prioritize tasks.
 * - SmartTaskPrioritizationInput - The input type for the smartTaskPrioritization function.
 * - SmartTaskPrioritizationOutput - The output type for the smartTaskPrioritization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartTaskPrioritizationInputSchema = z.object({
  description: z.string().describe('The description of the task.'),
  deadline: z.string().describe('The deadline of the task (e.g., YYYY-MM-DD).'),
});
export type SmartTaskPrioritizationInput = z.infer<typeof SmartTaskPrioritizationInputSchema>;

const SmartTaskPrioritizationOutputSchema = z.object({
  priority: z
    .enum(['high', 'medium', 'low'])
    .describe('The suggested priority of the task.'),
  reason: z.string().describe('The reason for the suggested priority.'),
});
export type SmartTaskPrioritizationOutput = z.infer<typeof SmartTaskPrioritizationOutputSchema>;

export async function smartTaskPrioritization(
  input: SmartTaskPrioritizationInput
): Promise<SmartTaskPrioritizationOutput> {
  return smartTaskPrioritizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartTaskPrioritizationPrompt',
  input: {schema: SmartTaskPrioritizationInputSchema},
  output: {schema: SmartTaskPrioritizationOutputSchema},
  prompt: `You are a task prioritization expert. Analyze the task description and deadline to suggest a priority (high, medium, or low) and provide a brief reason for your suggestion.

Task Description: {{{description}}}
Deadline: {{{deadline}}}

Respond with a priority (high, medium, or low) and a reason.
`,
});

const smartTaskPrioritizationFlow = ai.defineFlow(
  {
    name: 'smartTaskPrioritizationFlow',
    inputSchema: SmartTaskPrioritizationInputSchema,
    outputSchema: SmartTaskPrioritizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

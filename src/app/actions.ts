"use server";

import {
  smartTaskPrioritization,
  type SmartTaskPrioritizationInput,
} from "@/ai/flows/smart-task-prioritization";
import { z } from "zod";

const SuggestionInputSchema = z.object({
  description: z.string().min(1, { message: "Description is required." }),
  deadline: z.string().min(1, { message: "Deadline is required." }),
});

export async function suggestPriorityAction(
  input: SmartTaskPrioritizationInput
) {
  try {
    const validatedInput = SuggestionInputSchema.parse(input);
    const result = await smartTaskPrioritization(validatedInput);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid input." };
    }
    return {
      success: false,
      error: "Failed to get suggestion from AI. Please try again.",
    };
  }
}

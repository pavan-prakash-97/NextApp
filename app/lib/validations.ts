import { z } from "zod";

// User profile update schema
export const updateUserProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long").optional(),
  image: z.string().url("Invalid image URL").optional(),
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;

// Generic error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

// Success response schema
export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
  data: z.unknown().optional(),
});

export type SuccessResponse = z.infer<typeof successResponseSchema>;

import { NextResponse } from "next/server";
import { z } from "zod";

/**
 * Validates request body against a Zod schema
 * Returns parsed data or error response
 */
export async function validateRequest<T extends z.ZodType>(
  req: Request,
  schema: T
): Promise<{ data: z.infer<T>; error: null } | { data: null; error: NextResponse }> {
  try {
    const body = await req.json();
    const validatedData = schema.parse(body);
    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: "Validation failed",
            details: error.issues.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    return {
      data: null,
      error: NextResponse.json({ error: "Invalid request body" }, { status: 400 }),
    };
  }
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQuery<T extends z.ZodType>(
  searchParams: URLSearchParams,
  schema: T
): { data: z.infer<T>; error: null } | { data: null; error: NextResponse } {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const validatedData = schema.parse(params);
    return { data: validatedData, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        data: null,
        error: NextResponse.json(
          {
            error: "Invalid query parameters",
            details: error.issues.map((err) => ({
              path: err.path.join("."),
              message: err.message,
            })),
          },
          { status: 400 }
        ),
      };
    }

    return {
      data: null,
      error: NextResponse.json({ error: "Invalid query parameters" }, { status: 400 }),
    };
  }
}

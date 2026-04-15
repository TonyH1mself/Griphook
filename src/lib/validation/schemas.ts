import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

export const signupSchema = z.object({
  email: z.email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(80),
});

export const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Username must be at least 2 characters.")
    .max(32)
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers, and underscores only."),
  display_name: z.string().trim().min(1, "Display name is required.").max(80),
});

export const joinCodeSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, "Enter a 6-digit code."),
});

const moneyString = z
  .string()
  .trim()
  .optional()
  .transform((s) => (s === "" || s == null ? undefined : s));

export const bucketCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required.").max(120),
    description: z.string().trim().max(2000).optional(),
    type: z.enum(["private", "shared"]),
    has_budget: z.boolean(),
    budget_amount: moneyString,
    budget_period: z.enum(["none", "monthly"]),
  })
  .superRefine((data, ctx) => {
    if (data.has_budget) {
      if (data.budget_amount == null || String(data.budget_amount).trim() === "") {
        ctx.addIssue({
          code: "custom",
          path: ["budget_amount"],
          message: "Budget amount is required when budget is on.",
        });
        return;
      }
      const n = Number.parseFloat(data.budget_amount);
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["budget_amount"],
          message: "Invalid budget amount.",
        });
      }
    }
  });

export const bucketMetaSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  description: z.string().trim().max(2000).optional(),
});

export const bucketBudgetSchema = z
  .object({
    has_budget: z.boolean(),
    budget_amount: moneyString,
    budget_period: z.enum(["none", "monthly"]),
  })
  .superRefine((data, ctx) => {
    if (data.has_budget) {
      if (data.budget_amount == null || data.budget_amount === "") {
        ctx.addIssue({
          code: "custom",
          path: ["budget_amount"],
          message: "Budget amount is required when budget is on.",
        });
        return;
      }
      const n = Number.parseFloat(data.budget_amount);
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["budget_amount"],
          message: "Invalid budget amount.",
        });
      }
    }
  });

export const entrySchema = z
  .object({
    transaction_type: z.enum(["income", "expense"]),
    amount: z.string().trim().min(1, "Amount is required."),
    title: z.string().trim().min(1, "Title is required.").max(200),
    notes: z.string().trim().max(5000).optional(),
    category_id: z.uuid("Pick a category."),
    bucket_id: z.uuid().optional(),
    occurred_at: z.string().min(1, "Date is required."),
  })
  .superRefine((data, ctx) => {
    const n = Number.parseFloat(data.amount.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Enter a valid non-negative amount.",
      });
    }
  });

export const recurringSchema = z
  .object({
    transaction_type: z.enum(["income", "expense"]),
    amount: z.string().trim().min(1, "Amount is required."),
    title: z.string().trim().min(1, "Title is required.").max(200),
    notes: z.string().trim().max(5000).optional(),
    category_id: z.uuid("Pick a category."),
    bucket_id: z.uuid().optional(),
    frequency: z.enum(["monthly", "weekly"]),
    next_due_at: z.string().min(1, "Next due date is required."),
  })
  .superRefine((data, ctx) => {
    const n = Number.parseFloat(data.amount.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Enter a valid non-negative amount.",
      });
    }
  });

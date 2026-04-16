import { z } from "zod";

export const loginSchema = z.object({
  email: z.email("Bitte eine gültige E-Mail-Adresse eingeben."),
  password: z.string().min(1, "Passwort ist erforderlich."),
});

export const signupSchema = z.object({
  email: z.email("Bitte eine gültige E-Mail-Adresse eingeben."),
  password: z.string().min(8, "Mindestens 8 Zeichen verwenden."),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(80),
});

export const categoryUpdateSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(80),
});

export const onboardingSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, "Benutzername muss mindestens 2 Zeichen lang sein.")
    .max(32)
    .regex(/^[a-z0-9_]+$/, "Nur Kleinbuchstaben, Zahlen und Unterstriche."),
  display_name: z.string().trim().min(1, "Anzeigename ist erforderlich.").max(80),
});

export const joinCodeSchema = z.object({
  code: z.string().regex(/^[0-9]{6}$/, "Bitte einen 6-stelligen Code eingeben."),
});

const moneyString = z
  .string()
  .trim()
  .optional()
  .transform((s) => (s === "" || s == null ? undefined : s));

export const bucketCreateSchema = z
  .object({
    name: z.string().trim().min(1, "Name ist erforderlich.").max(120),
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
          message: "Budgetbetrag ist erforderlich, wenn Budget aktiv ist.",
        });
        return;
      }
      const n = Number.parseFloat(data.budget_amount);
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["budget_amount"],
          message: "Ungültiger Budgetbetrag.",
        });
      }
    }
  });

export const bucketMetaSchema = z.object({
  name: z.string().trim().min(1, "Name ist erforderlich.").max(120),
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
          message: "Budgetbetrag ist erforderlich, wenn Budget aktiv ist.",
        });
        return;
      }
      const n = Number.parseFloat(data.budget_amount);
      if (!Number.isFinite(n) || n < 0) {
        ctx.addIssue({
          code: "custom",
          path: ["budget_amount"],
          message: "Ungültiger Budgetbetrag.",
        });
      }
    }
  });

export const entrySchema = z
  .object({
    transaction_type: z.enum(["income", "expense"]),
    amount: z.string().trim().min(1, "Betrag ist erforderlich."),
    title: z.string().trim().min(1, "Bezeichnung ist erforderlich.").max(200),
    notes: z.string().trim().max(5000).optional(),
    category_id: z.uuid("Bitte eine Kategorie wählen."),
    bucket_id: z.uuid().optional(),
    occurred_at: z.string().min(1, "Datum ist erforderlich."),
  })
  .superRefine((data, ctx) => {
    const n = Number.parseFloat(data.amount.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Bitte einen gültigen, nicht-negativen Betrag eingeben.",
      });
    }
  });

export const recurringSchema = z
  .object({
    transaction_type: z.enum(["income", "expense"]),
    amount: z.string().trim().min(1, "Betrag ist erforderlich."),
    title: z.string().trim().min(1, "Bezeichnung ist erforderlich.").max(200),
    notes: z.string().trim().max(5000).optional(),
    category_id: z.uuid("Bitte eine Kategorie wählen."),
    bucket_id: z.uuid().optional(),
    frequency: z.enum(["monthly", "weekly"]),
    next_due_at: z.string().min(1, "Nächstes Fälligkeitsdatum ist erforderlich."),
  })
  .superRefine((data, ctx) => {
    const n = Number.parseFloat(data.amount.replace(",", "."));
    if (!Number.isFinite(n) || n < 0) {
      ctx.addIssue({
        code: "custom",
        path: ["amount"],
        message: "Bitte einen gültigen, nicht-negativen Betrag eingeben.",
      });
    }
  });

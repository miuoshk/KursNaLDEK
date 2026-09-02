import { z } from "zod";
import { isValidEmoji } from "@/lib/emoji";
import {
  isBannedFullName,
  PERSON_NAME_MAX_LENGTH,
  PERSON_NAME_MIN_LENGTH,
  PERSON_NAME_PATTERN,
} from "@/features/auth/constants";

/** Komunikaty błędów to klucze z `errors.*` — tłumaczone dopiero w server action. */
function personNameSchema(requiredKey: string) {
  return z.preprocess(
    (value) => (typeof value === "string" ? value.replace(/\s+/g, " ").trim() : ""),
    z
      .string()
      .min(PERSON_NAME_MIN_LENGTH, requiredKey)
      .max(PERSON_NAME_MAX_LENGTH, "nameTooLong")
      .regex(PERSON_NAME_PATTERN, "nameInvalidChars"),
  );
}

export const registerSchema = z
  .object({
    firstName: personNameSchema("firstNameRequired"),
    lastName: personNameSchema("lastNameRequired"),
    acceptTerms: z.preprocess(
      (value) => value === "on" || value === "true",
      z.literal(true, "termsRequired"),
    ),
    nick: z
      .string()
      .trim()
      .min(3, "nickMinLength")
      .max(32, "nickMaxLength")
      .regex(/^[A-Za-z0-9._-]+$/, "nickInvalidChars"),
    email: z.string().email("emailInvalid"),
    password: z.string().min(6, "passwordMinLength"),
    confirmPassword: z.string().min(6, "confirmPasswordRequired"),
    courseType: z
      .string()
      .refine((value): value is "knnp" | "ldek" | "ldew" => {
        return value === "knnp" || value === "ldek" || value === "ldew";
      }, { message: "courseRequired" }),
    currentTrack: z.string().nullish(),
    currentYear: z.preprocess(
      (value) => (value === null || value === undefined || value === "" ? undefined : value),
      z.coerce.number().int().optional(),
    ),
    avatarEmoji: z
      .string()
      .trim()
      .refine(isValidEmoji, "avatarEmojiInvalid"),
  })
  .superRefine((data, ctx) => {
    if (isBannedFullName(data.firstName, data.lastName)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "namePlaceholderNotAllowed", path: ["firstName"] });
    }
    if (data.courseType !== "knnp") return;
    if (data.currentTrack !== "stomatologia" && data.currentTrack !== "lekarski") {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "trackRequired", path: ["currentTrack"] });
    }
    if (data.currentYear === undefined || data.currentYear < 1 || data.currentYear > 3) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "studyYearRequired", path: ["currentYear"] });
    }
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordsMustMatch",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

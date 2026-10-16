import { z } from "zod";

const triState = z.enum(["YES", "NO", "MAYBE"]);

const locationSchema = z.object({
  country: z.string().trim().min(1),
  city: z.string().trim().min(1),
  stateOrRegion: z.string().trim().optional(),
});

const preferenceImportance = z.enum([
  "REQUIRED",
  "PREFERRED",
  "FLEXIBLE",
]);

const partnerPreference = <T extends z.ZodTypeAny>(value: T) =>
  z.object({
    value,
    importance: preferenceImportance,
  });

const customerPreferencesSchema = z.object({
  ageRange: partnerPreference(
    z
      .object({
        min: z.number().int().min(18).max(100),
        max: z.number().int().min(18).max(100),
      })
      .refine((range) => range.min <= range.max),
  ).optional(),

  locations: partnerPreference(z.array(locationSchema)).optional(),

  height: partnerPreference(
    z.object({
      minCm: z.number().positive().optional(),
      maxCm: z.number().positive().optional(),
    }),
  ).optional(),

  maritalStatuses: partnerPreference(
    z.array(
      z.enum(["NEVER_MARRIED", "DIVORCED", "WIDOWED", "SEPARATED"]),
    ),
  ).optional(),

  educationLevels: partnerPreference(z.array(z.string())).optional(),
  professions: partnerPreference(z.array(z.string())).optional(),
  languages: partnerPreference(z.array(z.string())).optional(),
  religion: partnerPreference(z.string()).optional(),
  casteOrCommunity: partnerPreference(z.string()).optional(),
  wantsChildren: partnerPreference(triState).optional(),
  openToRelocation: partnerPreference(triState).optional(),
  openToPets: partnerPreference(triState).optional(),
  dietaryPreferences: partnerPreference(z.array(z.string())).optional(),
  familyValues: partnerPreference(z.array(z.string())).optional(),

  additionalPreferences: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        value: z.union([
          z.string(),
          z.array(z.string()),
          z.number(),
          z.boolean(),
        ]),
        importance: preferenceImportance,
      }),
    )
    .optional(),
});

const customerObjectSchema = z
  .object({
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    dateOfBirth: z.iso.date(),
    heightCm: z.number().positive().max(300).optional(),
    maritalStatus: z.enum([
      "NEVER_MARRIED",
      "DIVORCED",
      "WIDOWED",
      "SEPARATED",
    ]),
    email: z.email(),
    phoneNumber: z.string().trim().min(5).max(30),
    location: locationSchema,

    education: z.object({
      undergraduateCollege: z.string().optional(),
      degree: z.string().optional(),
      highestQualification: z.string().optional(),
      fieldOfStudy: z.string().optional(),
    }),

    employment: z.object({
      currentCompany: z.string().optional(),
      designation: z.string().optional(),
      industry: z.string().optional(),
      annualIncome: z
        .object({
          amount: z.number().nonnegative(),
          currency: z.string().length(3),
        })
        .optional(),
    }),

    languagesKnown: z.array(z.string()),
    preferredRelationshipLanguage: z.string().optional(),
    religion: z.string().optional(),
    casteOrCommunity: z.string().optional(),

    family: z.object({
      numberOfSiblings: z.number().int().nonnegative().optional(),
      familyValues: z.array(z.string()).optional(),
      familyIntroduction: z.string().optional(),
    }),

    wantsChildren: triState,
    openToRelocation: triState,
    openToPets: triState,

    lifestyle: z
      .object({
        dietaryPreferences: z.array(z.string()).optional(),
        hobbies: z.array(z.string()).optional(),
        horoscopePreference: z
          .enum(["REQUIRED", "PREFERRED", "NOT_REQUIRED"])
          .optional(),
      })
      .optional(),

    partnerPreferences: customerPreferencesSchema,
    introduction: z.string().max(2000).optional(),
  })
  .strict();

export const createCustomerSchema = customerObjectSchema.refine(
  (customer) => new Date(customer.dateOfBirth).getTime() <= Date.now(),
  {
    message: "Date of birth cannot be in the future",
    path: ["dateOfBirth"],
  },
);

export const updateCustomerSchema = customerObjectSchema.partial().strict();
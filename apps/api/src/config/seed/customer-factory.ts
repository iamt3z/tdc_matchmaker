import type {
  Customer,
  CustomerPreferences,
  Gender,
  MaritalStatus,
  PreferenceImportance,
  TriState,
} from "@tdc/types";

// Locations commonly represented in the Indian matrimonial market.
const LOCATIONS = [
  { country: "India", city: "Mumbai", stateOrRegion: "Maharashtra" },
  { country: "India", city: "Delhi", stateOrRegion: "Delhi" },
  { country: "India", city: "Bengaluru", stateOrRegion: "Karnataka" },
  { country: "India", city: "Hyderabad", stateOrRegion: "Telangana" },
  { country: "India", city: "Chennai", stateOrRegion: "Tamil Nadu" },
  { country: "India", city: "Pune", stateOrRegion: "Maharashtra" },
  { country: "India", city: "Kolkata", stateOrRegion: "West Bengal" },
  { country: "India", city: "Jaipur", stateOrRegion: "Rajasthan" },
  { country: "India", city: "Ahmedabad", stateOrRegion: "Gujarat" },
  { country: "India", city: "Kochi", stateOrRegion: "Kerala" },
] as const;

const MALE_NAMES = [
  "Aarav", "Arjun", "Aditya", "Rohan", "Rahul",
  "Karan", "Vikram", "Ishaan", "Kabir", "Dev",
  "Aman", "Nikhil", "Varun", "Siddharth", "Ankit",
  "Manish", "Rajat", "Akash", "Pranav", "Yash",
];

const FEMALE_NAMES = [
  "Aanya", "Ananya", "Priya", "Isha", "Meera",
  "Kavya", "Diya", "Riya", "Saanvi", "Nisha",
  "Pooja", "Neha", "Shruti", "Aditi", "Simran",
  "Tanya", "Shreya", "Ira", "Mira", "Sakshi",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Reddy", "Iyer", "Mehta",
  "Gupta", "Nair", "Kapoor", "Joshi", "Verma",
  "Malhotra", "Rao", "Desai", "Menon", "Singh",
  "Kulkarni", "Das", "Chopra", "Bose", "Khanna",
];

const DEGREES = [
  "B.Tech Computer Science",
  "MBA",
  "MBBS",
  "B.Com",
  "M.Tech",
  "B.Sc",
  "M.Sc",
  "BBA",
  "LLB",
  "MCA",
  "B.Arch",
  "M.Des",
];

const PROFESSIONS = [
  {
    designation: "Software Engineer",
    industry: "Technology",
    company: "Technology Services",
    income: 1800000,
  },
  {
    designation: "Product Manager",
    industry: "Technology",
    company: "Product Company",
    income: 2400000,
  },
  {
    designation: "Data Analyst",
    industry: "Technology",
    company: "Analytics Services",
    income: 1200000,
  },
  {
    designation: "Doctor",
    industry: "Healthcare",
    company: "Private Hospital",
    income: 2000000,
  },
  {
    designation: "Chartered Accountant",
    industry: "Finance",
    company: "Financial Services",
    income: 1600000,
  },
  {
    designation: "Marketing Manager",
    industry: "Marketing",
    company: "Consumer Brands",
    income: 1500000,
  },
  {
    designation: "Business Consultant",
    industry: "Consulting",
    company: "Consulting Services",
    income: 2100000,
  },
  {
    designation: "Architect",
    industry: "Design",
    company: "Design Studio",
    income: 1100000,
  },
  {
    designation: "Lawyer",
    industry: "Legal",
    company: "Legal Associates",
    income: 1400000,
  },
  {
    designation: "Teacher",
    industry: "Education",
    company: "Education Services",
    income: 800000,
  },
  {
    designation: "Entrepreneur",
    industry: "Business",
    company: "Independent Business",
    income: 2600000,
  },
  {
    designation: "Financial Analyst",
    industry: "Finance",
    company: "Investment Services",
    income: 1700000,
  },
];

const LANGUAGES = [
  "English",
  "Hindi",
  "Tamil",
  "Telugu",
  "Kannada",
  "Malayalam",
  "Bengali",
  "Gujarati",
  "Marathi",
  "Punjabi",
];

const RELIGIONS = [
  "Hindu",
  "Muslim",
  "Christian",
  "Sikh",
  "Jain",
  "Buddhist",
  "Other",
];

const DIETARY_PREFERENCES = [
  "Vegetarian",
  "Non-vegetarian",
  "Eggetarian",
  "Vegan",
];

const HOBBIES = [
  "Reading",
  "Travel",
  "Cooking",
  "Music",
  "Fitness",
  "Photography",
  "Hiking",
  "Movies",
  "Volunteering",
  "Art",
];

const FAMILY_VALUES = [
  "Family-oriented",
  "Modern",
  "Traditional",
  "Balanced",
  "Independent",
];

const TRI_STATES: TriState[] = ["YES", "NO", "MAYBE"];

const IMPORTANCES: PreferenceImportance[] = [
  "REQUIRED",
  "PREFERRED",
  "FLEXIBLE",
];

/**
 * Picks an item deterministically.
 *
 * Unlike Math.random(), this produces the same result for the same index,
 * making seeded profiles predictable and easier to test.
 */
function pick<T>(items: readonly T[], index: number): T {
  return items[((index % items.length) + items.length) % items.length];
}

/**
 * Produces a repeatable date of birth for the supplied profile.
 */
function getDateOfBirth(index: number): string {
  const year = 1986 + (index % 15);
  const month = (index % 12) + 1;
  const day = ((index * 7) % 28) + 1;

  return [
    year,
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

/**
 * Gives profiles varied family, lifestyle, and relationship preferences.
 */
function createPreferences(index: number): CustomerPreferences {
  const minAge = 24 + (index % 8);
  const importance = pick(IMPORTANCES, index);

  return {
    ageRange: {
      value: {
        min: minAge,
        max: Math.min(minAge + 8 + (index % 5), 60),
      },
      importance,
    },

    locations: {
      value: [
        {
          country: "India",
          city: pick(LOCATIONS, index + 2).city,
          stateOrRegion: pick(LOCATIONS, index + 2).stateOrRegion,
        },
      ],
      importance: pick(IMPORTANCES, index + 1),
    },

    height: {
      value: {
        minCm: 145 + (index % 10),
        maxCm: 175 + (index % 15),
      },
      importance: pick(IMPORTANCES, index + 2),
    },

    maritalStatuses: {
      value: index % 5 === 0
        ? ["NEVER_MARRIED", "DIVORCED"]
        : ["NEVER_MARRIED"],
      importance: "PREFERRED",
    },

    educationLevels: {
      value: [
        pick(DEGREES, index),
        pick(DEGREES, index + 3),
      ],
      importance: "FLEXIBLE",
    },

    professions: {
      value: [
        pick(PROFESSIONS, index).industry,
        pick(PROFESSIONS, index + 2).industry,
      ],
      importance: pick(IMPORTANCES, index + 3),
    },

    languages: {
      value: [
        "English",
        pick(LANGUAGES, index),
      ],
      importance: "PREFERRED",
    },

    religion: {
      value: pick(RELIGIONS, index),
      importance: "FLEXIBLE",
    },

    wantsChildren: {
      value: pick(TRI_STATES, index),
      importance: pick(IMPORTANCES, index + 1),
    },

    openToRelocation: {
      value: pick(TRI_STATES, index + 1),
      importance: "PREFERRED",
    },

    openToPets: {
      value: pick(TRI_STATES, index + 2),
      importance: "FLEXIBLE",
    },

    dietaryPreferences: {
      value: [pick(DIETARY_PREFERENCES, index)],
      importance: "FLEXIBLE",
    },

    familyValues: {
      value: [
        pick(FAMILY_VALUES, index),
        pick(FAMILY_VALUES, index + 2),
      ],
      importance: "PREFERRED",
    },

    additionalPreferences: [
      {
        key: "careerSupport",
        label: "Supports partner's career",
        value: index % 3 !== 0,
        importance: "PREFERRED",
      },
      {
        key: "familyInvolvement",
        label: "Comfortable with family involvement",
        value: pick(FAMILY_VALUES, index),
        importance: "FLEXIBLE",
      },
    ],
  };
}

/**
 * Generates a complete fictional Customer record.
 */
export function createSeedCustomer(
  index: number,
  matchmakerId: string,
): Customer {
  // The first 60 records are male and the next 60 are female.
  const gender: Gender = index < 60 ? "MALE" : "FEMALE";
  const localIndex = index % 60;

  const firstName = gender === "MALE"
    ? pick(MALE_NAMES, localIndex)
    : pick(FEMALE_NAMES, localIndex);

  const lastName = pick(LAST_NAMES, index);

  const profession = pick(PROFESSIONS, index);
  const location = pick(LOCATIONS, index);

  const dateOfBirth = getDateOfBirth(index);
  const maritalStatus: MaritalStatus =
    index % 13 === 0
      ? "DIVORCED"
      : index % 29 === 0
        ? "WIDOWED"
        : "NEVER_MARRIED";

  const now = new Date().toISOString();

  return {
    // Stable IDs prevent duplicate profiles when the seed is rerun.
    id: `seed-customer-${String(index + 1).padStart(3, "0")}`,

    assignedMatchmakerId: matchmakerId,

    firstName,
    lastName,
    gender,
    dateOfBirth,

    heightCm: gender === "MALE"
      ? 165 + (index % 22)
      : 150 + (index % 22),

    maritalStatus,

    // Reserved fictional test addresses; these are not real contact details.
    email: `seed.customer.${String(index + 1).padStart(3, "0")}@example.com`,
    phoneNumber: `TEST-${String(index + 1).padStart(6, "0")}`,

    location,

    education: {
      undergraduateCollege: `${location.city} Institute of Higher Education`,
      degree: pick(DEGREES, index),
      highestQualification: index % 3 === 0
        ? "Master's"
        : "Bachelor's",
      fieldOfStudy: profession.industry,
    },

    employment: {
      currentCompany: profession.company,
      designation: profession.designation,
      industry: profession.industry,
      annualIncome: {
        amount: profession.income + (index % 5) * 100000,
        currency: "INR",
      },
    },

    languagesKnown: [
      "English",
      pick(LANGUAGES, index),
      ...(index % 3 === 0 ? [pick(LANGUAGES, index + 4)] : []),
    ].filter((language, position, all) => all.indexOf(language) === position),

    preferredRelationshipLanguage: "English",

    religion: pick(RELIGIONS, index),
    casteOrCommunity: `Community ${String((index % 12) + 1).padStart(2, "0")}`,

    family: {
      numberOfSiblings: index % 4,
      familyValues: [
        pick(FAMILY_VALUES, index),
        pick(FAMILY_VALUES, index + 2),
      ],
      familyIntroduction:
        "Fictional seed profile for matchmaking workflow testing.",
    },

    wantsChildren: pick(TRI_STATES, index),
    openToRelocation: pick(TRI_STATES, index + 1),
    openToPets: pick(TRI_STATES, index + 2),

    lifestyle: {
      dietaryPreferences: [pick(DIETARY_PREFERENCES, index)],
      hobbies: [
        pick(HOBBIES, index),
        pick(HOBBIES, index + 3),
      ],
      horoscopePreference: pick(
        ["REQUIRED", "PREFERRED", "NOT_REQUIRED"] as const,
        index,
      ),
    },

    partnerPreferences: createPreferences(index),

    introduction:
      "Fictional profile created for the TDC Matchmaker MVP demonstration.",

    status: pick(
      [
        "READY_FOR_MATCHING",
        "READY_FOR_MATCHING",
        "NEW",
        "PROFILE_INCOMPLETE",
        "MATCHES_SUGGESTED",
      ] as const,
      index,
    ),

    verification: {
      // Most, but not all, records are verified so filtering can be tested.
      status: index % 10 === 0 ? "UNVERIFIED" : "VERIFIED",
    },

    matchIds: [],
    noteIds: [],

    createdAt: now,
    updatedAt: now,
  };
}
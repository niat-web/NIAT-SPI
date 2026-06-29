export const REQUIRED_PCT = 80;

export type Role =
  | "superadmin"
  | "admin"
  | "hod"
  | "capability_manager"
  | "boa"
  | "instructor";

export const ROLES: Role[] = [
  "superadmin",
  "admin",
  "hod",
  "capability_manager",
  "boa",
  "instructor",
];

export const ROLE_LABELS: Record<Role, string> = {
  superadmin: "Super Admin",
  admin: "Admin",
  hod: "HOD",
  capability_manager: "Capability Manager",
  boa: "BOA",
  instructor: "Instructor",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  superadmin: "Full control over all roles, campuses, students and settings.",
  admin: "Manages HODs, BOAs, instructors and student pages across all campuses.",
  hod: "Read-only view of attendance & scores across all campuses.",
  capability_manager: "Read-only view of assigned instructors and their campuses.",
  boa: "Read-only view of all data for the assigned campus.",
  instructor: "Read-only view of own subject sessions, attendance & scores.",
};

// Campuses (institutes) seen in the source data. Institute IDs are resolved
// live from BigQuery; names are the stable scoping key used across the app.
export const CAMPUSES = [
  "Nxtwave Institute of Advanced Technologies",
  "NIAT Chevella",
  "Chaitanya Deemed-to-be University",
  "Malla Reddy Vishwavidyapeeth",
] as const;

export const SUBJECTS = [
  "Back End Development",
  "Web  Application Development -2",
  "Data Structures",
  "DataBase Management System",
  "Design and Analysis of Algorithms",
  "Probability and Statistics",
  "CALCULUS",
  "Logical Reasoning and Analytical Skills",
  "Advanced Communication Skills",
  "Communicative English Foundation",
  "Communicative English Advanced",
  "AI For Finanace",
] as const;

// SPI assessment model (from NSPI spec). Live scores arrive in a later phase;
// until then these power the "Coming Soon" sections.
export const ASSESSMENT_WEIGHTS = [
  { key: "classroom_quiz", label: "Classroom Quizzes", weight: 10 },
  { key: "module_quiz", label: "Module Quizzes", weight: 15 },
  { key: "skill_assessment", label: "Skill Assessments", weight: 25 },
  { key: "final_skill_assessment", label: "Final Skill Assessment", weight: 50 },
] as const;

export const SESSION_COOKIE = "niat_session";
export const SESSION_MAX_AGE_DAYS = 30;

export const goalTypeOptions = [
  { value: "MONEY", label: "Money" },
  { value: "DEBT", label: "Debt" },
  { value: "CHECKLIST", label: "Checklist" },
  { value: "COUNT", label: "Count" },
  { value: "PERCENTAGE", label: "Percentage" },
  { value: "MILESTONE", label: "Milestone" },
  { value: "RECURRING", label: "Recurring" }
] as const;

export const goalStatusOptions = [
  { value: "PLANNED", label: "Planned" },
  { value: "ACTIVE", label: "Active" },
  { value: "PAUSED", label: "Paused" },
  { value: "COMPLETED", label: "Completed" },
  { value: "ARCHIVED", label: "Archived" }
] as const;

export const navigation = [
  { href: "/", label: "Dashboard", description: "Life progress at a glance" },
  { href: "/pillars", label: "Life Pillars", description: "See momentum by domain" },
  { href: "/goals", label: "Goals", description: "Manage active work" },
  { href: "/weekly-review", label: "Weekly Review", description: "Capture wins and friction" },
  { href: "/activity", label: "Activity", description: "Timeline of movement" }
] as const;

export const pillarIconMap: Record<string, string> = {
  Money: "Wallet",
  "Home / Land": "House",
  Career: "BriefcaseBusiness",
  Business: "ChartColumnBig",
  Family: "Users",
  Health: "HeartPulse",
  Relationship: "HeartHandshake"
};


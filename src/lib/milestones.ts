export type MilestoneFieldInput =
  | "text"
  | "textarea"
  | "number"
  | "date"
  | "url"
  | "select";

export type MilestoneFieldDefinition = {
  key: string;
  label: string;
  input?: MilestoneFieldInput;
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
  }>;
};

type GoalTemplateContext = {
  title: string;
  pillar?: {
    name: string;
  } | null;
};

type MilestonePlanningRecord = {
  title: string;
  description?: string | null;
  decisionSummary?: string | null;
  notes?: string | null;
  links?: unknown;
  customFields?: unknown;
};

export type MilestoneFieldRow = {
  key: string;
  label: string;
  value: string;
  definition?: MilestoneFieldDefinition;
};

export type MilestoneLink = {
  label: string;
  href: string | null;
};

const yesNoOptions = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "unknown", label: "Unknown" }
];

const landMilestoneFields: Record<string, MilestoneFieldDefinition[]> = {
  "choose target counties": [
    { key: "selectedCounties", label: "Selected counties", input: "textarea" },
    { key: "priorityRanking", label: "Priority ranking", input: "textarea" },
    { key: "pros", label: "Pros", input: "textarea" },
    { key: "cons", label: "Cons", input: "textarea" },
    { key: "distanceConsiderations", label: "Distance considerations", input: "textarea" },
    {
      key: "schoolWorkFamilyConsiderations",
      label: "School/work/family considerations",
      input: "textarea"
    },
    { key: "notes", label: "Notes", input: "textarea" },
    { key: "finalDecision", label: "Final decision", input: "textarea" }
  ],
  "set max land price": [
    { key: "maxLandPrice", label: "Max land price", input: "text", placeholder: "$90,000" },
    {
      key: "preferredPriceRange",
      label: "Preferred price range",
      input: "text",
      placeholder: "$50,000-$75,000"
    },
    { key: "maxPricePerAcre", label: "Max price per acre", input: "text" },
    { key: "cashAvailable", label: "Cash available", input: "text" },
    { key: "estimatedUtilityBuffer", label: "Estimated utility buffer", input: "text" },
    { key: "hardNoNumber", label: "Hard no number", input: "text" },
    { key: "notesReasoning", label: "Notes / reasoning", input: "textarea" }
  ],
  "confirm financing path": [
    { key: "financingOptionsConsidered", label: "Financing options considered", input: "textarea" },
    { key: "chosenFinancingPath", label: "Chosen financing path", input: "textarea" },
    { key: "lenderName", label: "Lender name", input: "text" },
    { key: "downPaymentNeeded", label: "Down payment needed", input: "text" },
    { key: "creditScoreRequirement", label: "Credit score requirement", input: "text" },
    { key: "estimatedMonthlyPayment", label: "Estimated monthly payment", input: "text" },
    { key: "approvalStatus", label: "Approval status", input: "text" },
    { key: "documentsNeeded", label: "Documents needed", input: "textarea" },
    { key: "notes", label: "Notes", input: "textarea" }
  ],
  "find candidate parcels": [
    { key: "parcelName", label: "Parcel name", input: "text" },
    { key: "addressLocation", label: "Address / location", input: "text" },
    { key: "listingUrl", label: "Listing URL", input: "url" },
    { key: "county", label: "County", input: "text" },
    { key: "acres", label: "Acres", input: "text" },
    { key: "price", label: "Price", input: "text" },
    { key: "pricePerAcre", label: "Price per acre", input: "text" },
    { key: "zoning", label: "Zoning", input: "text" },
    { key: "floodZone", label: "Flood zone", input: "text" },
    { key: "roadAccess", label: "Road access", input: "text" },
    { key: "wellStatus", label: "Well status", input: "text" },
    { key: "septicStatus", label: "Septic status", input: "text" },
    {
      key: "manufacturedModularAllowed",
      label: "Manufactured/modular allowed",
      input: "select",
      options: yesNoOptions
    },
    { key: "clearingNeeded", label: "Clearing needed", input: "text" },
    {
      key: "savedStatus",
      label: "Saved status",
      input: "select",
      options: [
        { value: "saved", label: "Saved" },
        { value: "maybe", label: "Maybe" },
        { value: "rejected", label: "Rejected" },
        { value: "top choice", label: "Top choice" }
      ]
    },
    { key: "scoreRanking", label: "Score / ranking", input: "text" },
    { key: "notes", label: "Notes", input: "textarea" }
  ],
  "check zoning and restrictions": [
    { key: "zoningCode", label: "Zoning code", input: "text" },
    { key: "allowedUses", label: "Allowed uses", input: "textarea" },
    {
      key: "manufacturedHomeAllowed",
      label: "Manufactured home allowed",
      input: "select",
      options: yesNoOptions
    },
    {
      key: "modularHomeAllowed",
      label: "Modular home allowed",
      input: "select",
      options: yesNoOptions
    },
    { key: "hoa", label: "HOA yes/no", input: "select", options: yesNoOptions },
    { key: "deedRestrictions", label: "Deed restrictions", input: "textarea" },
    { key: "minimumHomeSize", label: "Minimum home size", input: "text" },
    { key: "setbacks", label: "Setbacks", input: "textarea" },
    {
      key: "livestockAgriculturalRules",
      label: "Livestock/agricultural rules if applicable",
      input: "textarea"
    },
    {
      key: "sourceUrlOrDocumentReference",
      label: "Source URL or document reference",
      input: "url"
    },
    { key: "verifiedDate", label: "Verified date", input: "date" },
    { key: "notes", label: "Notes", input: "textarea" }
  ],
  "estimate well, septic, and clearing": [
    { key: "wellEstimate", label: "Well estimate", input: "text" },
    { key: "septicEstimate", label: "Septic estimate", input: "text" },
    { key: "clearingEstimate", label: "Clearing estimate", input: "text" },
    { key: "drivewayEstimate", label: "Driveway estimate", input: "text" },
    { key: "powerEstimate", label: "Power estimate if applicable", input: "text" },
    { key: "quoteSource", label: "Quote source", input: "textarea" },
    { key: "diyPossible", label: "DIY possible yes/no", input: "select", options: yesNoOptions },
    {
      key: "totalEstimatedSitePrepCost",
      label: "Total estimated site-prep cost",
      input: "text"
    },
    { key: "notes", label: "Notes", input: "textarea" }
  ],
  "make offer": [
    { key: "askingPrice", label: "Asking price", input: "text" },
    { key: "offerAmount", label: "Offer amount", input: "text" },
    { key: "contingencies", label: "Contingencies", input: "textarea" },
    { key: "closingCostPlan", label: "Closing cost plan", input: "textarea" },
    { key: "sellerResponse", label: "Seller response", input: "textarea" },
    { key: "counteroffer", label: "Counteroffer", input: "text" },
    { key: "offerStatus", label: "Offer status", input: "text" },
    { key: "notes", label: "Notes", input: "textarea" }
  ]
};

function normalizeTitle(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function isLandPlanningGoal(goal: GoalTemplateContext) {
  const pillarName = goal.pillar?.name.toLowerCase() ?? "";
  const title = goal.title.toLowerCase();

  return (
    pillarName === "home / land" ||
    title.includes("land") ||
    title.includes("homestead") ||
    title.includes("parcel") ||
    title.includes("acreage")
  );
}

function hasMeaningfulValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some(hasMeaningfulValue);
  }

  if (typeof value === "object") {
    return Object.values(value).some(hasMeaningfulValue);
  }

  return false;
}

function trimText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function excerpt(value: string, maxLength = 180) {
  const cleaned = value.replace(/\s+/g, " ").trim();

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength - 1).trim()}...`;
}

export function humanizeMilestoneFieldKey(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function getMilestoneFieldDefinitions(
  goal: GoalTemplateContext,
  milestoneTitle: string
): MilestoneFieldDefinition[] {
  if (!isLandPlanningGoal(goal)) {
    return [];
  }

  return landMilestoneFields[normalizeTitle(milestoneTitle)] ?? [];
}

export function getCustomFieldsObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as Record<string, unknown>;
}

export function formatMilestoneFieldValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.map(formatMilestoneFieldValue).filter(Boolean).join(", ");
  }

  return JSON.stringify(value);
}

export function getMilestoneFieldRows(
  customFields: unknown,
  definitions: MilestoneFieldDefinition[]
): MilestoneFieldRow[] {
  const fields = getCustomFieldsObject(customFields);
  const knownKeys = new Set(definitions.map((definition) => definition.key));
  const definitionRows = definitions.map((definition) => ({
    key: definition.key,
    label: definition.label,
    value: formatMilestoneFieldValue(fields[definition.key]),
    definition
  }));

  const additionalRows = Object.entries(fields)
    .filter(([key]) => !knownKeys.has(key))
    .map(([key, value]) => ({
      key,
      label: humanizeMilestoneFieldKey(key),
      value: formatMilestoneFieldValue(value)
    }));

  return [...definitionRows, ...additionalRows];
}

export function parseMilestoneLinksText(value: string | null | undefined) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export function getMilestoneLinks(value: unknown): MilestoneLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        const trimmed = item.trim();
        const href = /^https?:\/\//i.test(trimmed) ? trimmed : null;
        return trimmed ? { label: trimmed, href } : null;
      }

      if (!item || typeof item !== "object") {
        return null;
      }

      const record = item as Record<string, unknown>;
      const rawHref = formatMilestoneFieldValue(record.url ?? record.href).trim();
      const href = /^https?:\/\//i.test(rawHref) ? rawHref : null;
      const label =
        formatMilestoneFieldValue(record.label ?? record.title ?? record.name).trim() ||
        rawHref;

      return label ? { label, href } : null;
    })
    .filter((link): link is MilestoneLink => Boolean(link));
}

export function milestoneLinksToText(value: unknown) {
  return getMilestoneLinks(value)
    .map((link) => {
      if (!link.href || link.href === link.label) {
        return link.label;
      }

      return `${link.label} ${link.href}`;
    })
    .join("\n");
}

function getLandMilestoneSummary(
  milestoneTitle: string,
  fields: Record<string, unknown>
) {
  const normalizedTitle = normalizeTitle(milestoneTitle);
  const value = (key: string) => formatMilestoneFieldValue(fields[key]).trim();

  if (normalizedTitle === "choose target counties") {
    const selected = value("selectedCounties");
    const ranking = value("priorityRanking");
    const finalDecision = value("finalDecision");
    return [selected ? `${selected} selected` : "", ranking, finalDecision].filter(Boolean).join(". ");
  }

  if (normalizedTitle === "set max land price") {
    const max = value("maxLandPrice");
    const range = value("preferredPriceRange");
    const pricePerAcre = value("maxPricePerAcre");
    return [
      max ? `Max land budget set to ${max}` : "",
      range ? `Preferred range: ${range}` : "",
      pricePerAcre ? `Max per acre: ${pricePerAcre}` : ""
    ]
      .filter(Boolean)
      .join(". ");
  }

  if (normalizedTitle === "find candidate parcels") {
    const parcel = value("parcelName");
    const status = value("savedStatus");
    const ranking = value("scoreRanking");
    return [
      parcel ? `Parcel: ${parcel}` : "",
      status ? `Status: ${status}` : "",
      ranking ? `Ranking: ${ranking}` : ""
    ]
      .filter(Boolean)
      .join(". ");
  }

  return "";
}

export function getMilestoneSummary(
  milestone: MilestonePlanningRecord,
  definitions: MilestoneFieldDefinition[]
) {
  const decisionSummary = trimText(milestone.decisionSummary);

  if (decisionSummary) {
    return excerpt(decisionSummary);
  }

  const customFields = getCustomFieldsObject(milestone.customFields);
  const landSummary = getLandMilestoneSummary(milestone.title, customFields);

  if (landSummary) {
    return excerpt(landSummary);
  }

  const populatedFields = getMilestoneFieldRows(customFields, definitions).filter((row) =>
    hasMeaningfulValue(row.value)
  );

  if (populatedFields.length) {
    return excerpt(
      populatedFields
        .slice(0, 3)
        .map((row) => `${row.label}: ${row.value}`)
        .join(". ")
    );
  }

  const notes = trimText(milestone.notes);

  if (notes) {
    return excerpt(notes);
  }

  const description = trimText(milestone.description);

  if (description) {
    return excerpt(description);
  }

  return "No planning details saved yet.";
}

export function hasMilestoneDetails(milestone: MilestonePlanningRecord) {
  return (
    Boolean(trimText(milestone.description)) ||
    Boolean(trimText(milestone.decisionSummary)) ||
    Boolean(trimText(milestone.notes)) ||
    getMilestoneLinks(milestone.links).length > 0 ||
    hasMeaningfulValue(milestone.customFields)
  );
}

export interface QuoteListItem {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  propertyType: string;
  services: string[];
  status: string;
  assignedTo: { id: string; displayName: string } | null;
  createdAt: string;
  archivedAt: string | null;
}
export interface QuoteDetail extends QuoteListItem {
  customerPhone: string;
  preferredContactMethod: string;
  companyName: string | null;
  serviceAnswers: Record<string, Record<string, unknown>>;
  propertyDetails: Record<string, unknown>;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  province: string;
  postalCode: string;
  serviceAreaKey: string;
  preferredDates: string[];
  notes: string | null;
  consentAcceptedAt: string;
  updatedAt: string;
  estimateMatchStatus: "NOT_LINKED" | "MATCHED" | "INPUTS_CHANGED" | "EXPIRED";
  estimateSnapshot: Record<string, unknown> | null;
  estimateResult: {
    id: string;
    serviceKey: string;
    outcome: string;
    minimumCents: number | null;
    maximumCents: number | null;
    currency: string;
    pricingVersionCode: string;
    createdAt: string;
    expiresAt: string;
  } | null;
  uploads: {
    id: string;
    originalFilename: string;
    width: number;
    height: number;
    sortOrder: number;
    createdAt: string;
  }[];
  internalNotes: {
    id: string;
    body: string;
    createdAt: string;
    author: { id: string; displayName: string };
  }[];
  statusHistory: {
    id: string;
    fromStatus: string;
    toStatus: string;
    createdAt: string;
    actor: { id: string; displayName: string };
  }[];
  emailMessages: {
    templateKey: string;
    status: string;
    attempts: number;
    sentAt: string | null;
    lastErrorCode: string | null;
  }[];
  serviceJobs: {
    id: string;
    referenceNumber: string;
    status: string;
    scheduledStartAt: string | null;
  }[];
}

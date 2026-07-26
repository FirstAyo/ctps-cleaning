export interface JobListItem {
  id: string;
  referenceNumber: string;
  customerNameSnapshot: string;
  status: string;
  serviceAreaKey: string;
  scheduledStartAt: string | null;
  scheduledEndAt: string | null;
  followUpRequired: boolean;
  archivedAt: string | null;
  updatedAt: string;
  services: { serviceKey: string }[];
  assignments: { assignmentRole: string; user: { id: string; displayName: string } }[];
}
export interface JobDetail extends JobListItem {
  version: number;
  customerType: string;
  customerEmailSnapshot: string;
  customerPhoneSnapshot: string;
  companyNameSnapshot: string | null;
  propertyAddressLine1Snapshot: string;
  propertyAddressLine2Snapshot: string | null;
  citySnapshot: string;
  province: string;
  postalCodeSnapshot: string;
  propertyTypeSnapshot: string;
  serviceScopeSummary: string;
  accessNotes: string | null;
  customerSchedulingNotes: string | null;
  internalOperationalNotes: string | null;
  estimatedDurationMinutes: number | null;
  actualArrivalAt: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  completionSummary: string | null;
  cancellationReason: string | null;
  followUpNotes: string | null;
  quoteRequest: {
    id: string;
    reference: string;
    status: string;
    estimateSnapshot: unknown;
    estimateMatchStatus: string;
  } | null;
  checklistItems: {
    id: string;
    label: string;
    description: string | null;
    category: string;
    required: boolean;
    completed: boolean;
    sortOrder: number;
    notes: string | null;
    completedBy: { displayName: string } | null;
  }[];
  notes: {
    id: string;
    visibility: string;
    body: string;
    createdAt: string;
    author: { id: string; displayName: string };
  }[];
  incidents: {
    id: string;
    title: string;
    description: string;
    severity: string;
    blocksCompletion: boolean;
    resolvedAt: string | null;
    resolutionNotes: string | null;
    reportedBy: { displayName: string };
    resolvedBy: { displayName: string } | null;
  }[];
  media: {
    id: string;
    originalFilename: string;
    category: string;
    altText: string;
    caption: string | null;
    width: number;
    height: number;
  }[];
  statusHistory: {
    id: string;
    previousStatus: string;
    newStatus: string;
    reason: string | null;
    createdAt: string;
    changedBy: { displayName: string };
  }[];
  scheduleHistory: {
    id: string;
    previousStartAt: string | null;
    newStartAt: string;
    newEndAt: string;
    reason: string;
    conflictOverridden: boolean;
    createdAt: string;
    changedBy: { displayName: string };
  }[];
  activities: {
    id: string;
    action: string;
    createdAt: string;
    actor: { displayName: string } | null;
  }[];
  emailMessages: {
    id: string;
    templateKey: string;
    status: string;
    attempts: number;
    sentAt: string | null;
    lastErrorCode: string | null;
  }[];
}

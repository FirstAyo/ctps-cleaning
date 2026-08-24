export interface GeneralInquiryListItem {
  id: string;
  name: string;
  email: string;
  serviceKey: string | null;
  message: string;
  status: "NEW" | "READ";
  createdAt: string;
  archivedAt: string | null;
}

export interface GeneralInquiryDetail extends GeneralInquiryListItem {
  phone: string | null;
  updatedAt: string;
  emailMessages: {
    templateKey: string;
    status: string;
    attempts: number;
    sentAt: string | null;
    lastErrorCode: string | null;
  }[];
}

export type EventRegion = "India" | "International";
export type EventStatus = "draft" | "published" | "unpublished";

export type PublicEvent = {
  id: string;
  slug: string;
  title: string;
  date: string;
  endDate?: string;
  dateLabel: string;
  shortDateLabel: string;
  venue: string;
  locationLabel: string;
  duration: string;
  category: string;
  region: EventRegion;
  audience: string[];
  shortDescription?: string;
  description: string;
  image: string;
  officialWebsite?: string;
  isFeatured?: boolean;
  displayOrder?: number;
};

export type AdminEvent = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  startDate: string;
  endDate: string | null;
  dateLabel: string | null;
  venue: string;
  duration: string | null;
  category: string;
  region: EventRegion;
  audience: string | null;
  imageUrl: string | null;
  officialWebsite: string | null;
  status: EventStatus;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

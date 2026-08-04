export enum Department {
  CSE = 'CSE',
  ECE = 'ECE',
  ME = 'ME',
  CE = 'CE',
  EEE = 'EEE',
  IT = 'IT',
  Other = 'Other',
}

export enum UserRole {
  Student = 'student',
  ClubLead = 'club_lead',
  Admin = 'admin',
}

export interface PortfolioLink {
  title: string;
  url: string;
}

export interface Review {
  reviewerId: string;
  reviewerName: string;
  comment: string;
  stars: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  department: Department;
  profilePicture: string;
  skills: string[];
  portfolioLinks: PortfolioLink[];
  ratings: {
    average: number;
    reviews: Review[];
  };
  role: UserRole;
  createdAt: string;
}

export enum MarketplaceCategory {
  Books = 'Books',
  Gadgets = 'Gadgets',
  Bikes = 'Bikes',
  LabEquipment = 'Lab Equipment',
  Other = 'Other',
}

export enum MarketplaceStatus {
  Available = 'Available',
  Sold = 'Sold',
}

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  sellerName: string;
  sellerEmail: string;
  sellerDepartment: Department;
  title: string;
  description: string;
  price: number;
  imageUrl: string;
  category: MarketplaceCategory;
  status: MarketplaceStatus;
  createdAt: string;
}

export interface ServicePost {
  id: string;
  providerId: string;
  providerName: string;
  providerEmail: string;
  providerDepartment: Department;
  providerSkills: string[];
  providerRating: number;
  skillCategory: string;
  description: string;
  hourlyRate?: number;
  startingPrice?: number;
  createdAt: string;
}

export interface RequirementResponse {
  responderId: string;
  responderName: string;
  message: string;
  respondedAt: string;
}

export interface RequirementPost {
  id: string;
  posterId: string;
  posterName: string;
  posterEmail: string;
  posterDepartment: Department;
  title: string;
  description: string;
  budget?: number;
  category: string;
  responses: RequirementResponse[];
  isOpen: boolean;
  createdAt: string;
}

export enum NoticeType {
  Event = 'Event',
  Workshop = 'Workshop',
  LostFound = 'Lost & Found',
  General = 'General',
}

export interface Notice {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  title: string;
  content: string;
  type: NoticeType;
  expiryDate: string;
  createdAt: string;
}

export enum StaffStatus {
  Available = 'Available',
  Busy = 'Busy',
  Out = 'Out of Campus',
}

export interface StaffAvailability {
  id: string;
  staffName: string;
  designation: string;
  department: string;
  currentLocation: string;
  availabilityStatus: StaffStatus;
  availableUntil: string;
  updatedById?: string;
  updatedByName?: string;
  lastUpdated: string;
}

// API Response Shapes
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  count?: number;
}

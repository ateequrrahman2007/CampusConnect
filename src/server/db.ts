import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  UserRole,
  Department,
  MarketplaceItem,
  MarketplaceCategory,
  MarketplaceStatus,
  ServicePost,
  RequirementPost,
  Notice,
  NoticeType,
  StaffAvailability,
  StaffStatus,
} from '../types.js';

// Absolute path to local JSON database relative to project root
const DB_FILE = path.join(process.cwd(), 'db.json');

interface Schema {
  users: User[];
  marketplace: MarketplaceItem[];
  services: ServicePost[];
  requirements: RequirementPost[];
  notices: Notice[];
  staff: StaffAvailability[];
}

// Simple deterministic hash using Node.js crypto (equivalent to bcrypt but zero-dependency)
export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', 'campusconnect-salt-124').update(password).digest('hex');
}

// Seed Data
const defaultUsers: { user: User; passHash: string }[] = [
  {
    user: {
      id: 'usr_admin',
      name: 'Dr. Arumugam (Principal NCT)',
      email: 'principal@nandha.edu',
      rollNumber: 'NCT-PRINCIPAL',
      department: Department.Other,
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      skills: ['Academic Leadership', 'Administration', 'Anna University Affiliation', 'Research & Development'],
      portfolioLinks: [{ title: 'Principal Office', url: 'https://nandhatech.org/principal' }],
      ratings: { average: 5.0, reviews: [] },
      role: UserRole.Admin,
      createdAt: new Date().toISOString(),
    },
    passHash: hashPassword('admin123'),
  },
  {
    user: {
      id: 'usr_clublead',
      name: 'Dinesh Kumar',
      email: 'dineshkumar@nandhatech.org',
      rollNumber: 'NCT-IT-23-014',
      department: Department.IT,
      profilePicture: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      skills: ['React', 'Python', 'Tailwind CSS', 'Embedded IoT Systems'],
      portfolioLinks: [{ title: 'NCT Dev Club', url: 'https://github.com/nct-dev-club' }],
      ratings: {
        average: 4.8,
        reviews: [
          {
            reviewerId: 'usr_student',
            reviewerName: 'Vignesh Balaji',
            comment: 'Fantastic help with my Arduino mini project lab internals!',
            stars: 5,
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ],
      },
      role: UserRole.ClubLead,
      createdAt: new Date().toISOString(),
    },
    passHash: hashPassword('club123'),
  },
  {
    user: {
      id: 'usr_student',
      name: 'Vignesh Balaji',
      email: 'vignesh@nandhatech.org',
      rollNumber: 'NCT-IT-24-045',
      department: Department.IT,
      profilePicture: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      skills: ['Java', 'SQL', 'C Programming', 'Soldering'],
      portfolioLinks: [{ title: 'My Portfolios', url: 'https://github.com/vignesh-nandha' }],
      ratings: { average: 4.5, reviews: [] },
      role: UserRole.Student,
      createdAt: new Date().toISOString(),
    },
    passHash: hashPassword('student123'),
  },
];

const defaultMarketplace: MarketplaceItem[] = [
  {
    id: 'item_1',
    sellerId: 'usr_student',
    sellerName: 'Vignesh Balaji',
    sellerEmail: 'vignesh@nandhatech.org',
    sellerDepartment: Department.IT,
    title: 'Anna University Engineering Physics Textbook (Regulation 2021)',
    description: 'First semester textbook by S. Chand Publications. Clean pages, no pencil markings. Vital for first-year engineering students across all departments in Tamil Nadu.',
    price: 180,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    category: MarketplaceCategory.Books,
    status: MarketplaceStatus.Available,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item_2',
    sellerId: 'usr_clublead',
    sellerName: 'Dinesh Kumar',
    sellerEmail: 'dineshkumar@nandhatech.org',
    sellerDepartment: Department.IT,
    title: 'Nandha College Regulation White Lab Coat (Size L)',
    description: 'White cotton lab coat required for Chemistry and Physics lab sessions. Freshly washed, no chemical stains.',
    price: 150,
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400',
    category: MarketplaceCategory.LabEquipment,
    status: MarketplaceStatus.Available,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item_3',
    sellerId: 'usr_student',
    sellerName: 'Vignesh Balaji',
    sellerEmail: 'vignesh@nandhatech.org',
    sellerDepartment: Department.IT,
    title: 'Campus Bicycle - Hero Sprint (Hostel to Lab)',
    description: 'Perfect single-speed bicycle for daily commute between NCT hostels, cafeteria, and academic blocks. Smooth breaks and robust air-tight tyres.',
    price: 3200,
    imageUrl: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    category: MarketplaceCategory.Bikes,
    status: MarketplaceStatus.Available,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item_4',
    sellerId: 'usr_student',
    sellerName: 'Vignesh Balaji',
    sellerEmail: 'vignesh@nandhatech.org',
    sellerDepartment: Department.IT,
    title: 'Casio fx-991MS Scientific Calculator',
    description: 'Original Casio 401-functions calculator. Essential and officially permitted for Anna University semester exams and internal tests.',
    price: 750,
    imageUrl: 'https://images.unsplash.com/photo-1574607383476-f517f220d398?w=400',
    category: MarketplaceCategory.Gadgets,
    status: MarketplaceStatus.Available,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'item_5',
    sellerId: 'usr_student',
    sellerName: 'Vignesh Balaji',
    sellerEmail: 'vignesh@nandhatech.org',
    sellerDepartment: Department.IT,
    title: 'Engineering Mini Drafter & Drafting Board',
    description: 'Omicron brand standard mini-drafter with board and protective carrying bag. Required for Engineering Graphics (EG) lab sessions.',
    price: 650,
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400',
    category: MarketplaceCategory.LabEquipment,
    status: MarketplaceStatus.Available,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  }
];

const defaultServices: ServicePost[] = [
  {
    id: 'srv_1',
    providerId: 'usr_clublead',
    providerName: 'Dinesh Kumar',
    providerEmail: 'dineshkumar@nandhatech.org',
    providerDepartment: Department.IT,
    providerSkills: ['React', 'Python', 'Tailwind CSS', 'Embedded IoT Systems'],
    providerRating: 4.8,
    skillCategory: 'Python Programming Tutors',
    description: 'Offering tutoring sessions for GE3151 Problem Solving and Python Programming syllabus. Great for clearing internal exams.',
    hourlyRate: 100,
    startingPrice: 250,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'srv_2',
    providerId: 'usr_student',
    providerName: 'Vignesh Balaji',
    providerEmail: 'vignesh@nandhatech.org',
    providerDepartment: Department.IT,
    providerSkills: ['Java', 'SQL', 'C Programming', 'Soldering'],
    providerRating: 4.5,
    skillCategory: 'Mini Project Circuit Soldering',
    description: 'Can help solder circuits and troubleshoot PCB connections for your hardware design mini-projects.',
    hourlyRate: 120,
    startingPrice: 300,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const defaultRequirements: RequirementPost[] = [
  {
    id: 'req_1',
    posterId: 'usr_student',
    posterName: 'Vignesh Balaji',
    posterEmail: 'vignesh@nandhatech.org',
    posterDepartment: Department.IT,
    title: 'Need a team member for Anna University Smart India Hackathon internal selection',
    description: 'Developing an agricultural soil testing system. Hardware and sensor integrations are ready, need someone experienced in web development or UI design using React and Tailwind.',
    budget: 1500,
    category: 'Software/Design',
    responses: [],
    isOpen: true,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const defaultNotices: Notice[] = [
  {
    id: 'not_1',
    authorId: 'usr_admin',
    authorName: 'Dr. Arumugam (Principal NCT)',
    authorRole: UserRole.Admin,
    title: 'Strict Attendance Guidelines for Practical Lab Examinations',
    content: 'All engineering students must possess a minimum of 75% attendance to qualify for the upcoming Anna University Practical Examinations starting next week. Strictly no exceptions.',
    type: NoticeType.General,
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'not_2',
    authorId: 'usr_clublead',
    authorName: 'Dinesh Kumar',
    authorRole: UserRole.ClubLead,
    title: 'Nandha Tech HackFest 2026: Inter-College Hackathon',
    content: 'Nandha College of Technology is hosting an overnight hackathon in the IT Seminar Hall. Technical project showcases on Web Development, AI, and IoT are welcome. Register with your department coordinator.',
    type: NoticeType.Event,
    expiryDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const defaultStaff: StaffAvailability[] = [
  {
    id: 'stf_1',
    staffName: 'Dr. Karthik',
    designation: 'Head of the Department (HOD)',
    department: 'IT',
    currentLocation: 'HOD Cabin, IT Block Ground Floor',
    availabilityStatus: StaffStatus.Available,
    availableUntil: '4:30 PM',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'stf_2',
    staffName: 'Prof. Krishna',
    designation: 'Assistant Professor (IT Dept)',
    department: 'IT',
    currentLocation: 'IT Department Staff Room, 2nd Floor',
    availabilityStatus: StaffStatus.Busy,
    availableUntil: '3:00 PM',
    lastUpdated: new Date().toISOString(),
  },
  {
    id: 'stf_3',
    staffName: 'Prof. Madhu Suganya',
    designation: 'Assistant Professor (IT DEPT)',
    department: 'IT',
    currentLocation: 'IT Faculty Cabin 3A, 2nd Floor',
    availabilityStatus: StaffStatus.Available,
    availableUntil: '4:15 PM',
    lastUpdated: new Date().toISOString(),
  },
];

class FileDatabase {
  private schema: Schema = {
    users: [],
    marketplace: [],
    services: [],
    requirements: [],
    notices: [],
    staff: [],
  };
  private passHashes: Record<string, string> = {}; // userId -> hashedPassword

  constructor() {
    this.load();
  }

  // Load database from file
  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        this.schema = parsed.schema || this.schema;
        this.passHashes = parsed.passHashes || this.passHashes;
        console.log('Database loaded successfully from', DB_FILE);
      } else {
        console.log('Database file not found. Seeding initial data...');
        this.schema.users = defaultUsers.map((u) => u.user);
        this.schema.marketplace = defaultMarketplace;
        this.schema.services = defaultServices;
        this.schema.requirements = defaultRequirements;
        this.schema.notices = defaultNotices;
        this.schema.staff = defaultStaff;

        defaultUsers.forEach((u) => {
          this.passHashes[u.user.id] = u.passHash;
        });

        this.save();
      }
    } catch (e) {
      console.error('Error loading database, re-initializing empty tables', e);
    }
  }

  // Save database to file
  public save() {
    try {
      fs.writeFileSync(
        DB_FILE,
        JSON.stringify(
          {
            schema: this.schema,
            passHashes: this.passHashes,
          },
          null,
          2,
        ),
        'utf8',
      );
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  // User Management
  public getUsers(): User[] {
    return this.schema.users;
  }

  public findUserById(id: string): User | undefined {
    return this.schema.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.schema.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public getUserPasswordHash(userId: string): string | undefined {
    return this.passHashes[userId];
  }

  public registerUser(user: User, passHash: string): User {
    this.schema.users.push(user);
    this.passHashes[user.id] = passHash;
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.schema.users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    this.schema.users[idx] = { ...this.schema.users[idx], ...updates };
    this.save();
    return this.schema.users[idx];
  }

  // Marketplace Management
  public getMarketplace(): MarketplaceItem[] {
    return this.schema.marketplace;
  }

  public findMarketplaceById(id: string): MarketplaceItem | undefined {
    return this.schema.marketplace.find((item) => item.id === id);
  }

  public addMarketplaceItem(item: MarketplaceItem): MarketplaceItem {
    this.schema.marketplace.push(item);
    this.save();
    return item;
  }

  public updateMarketplaceItem(id: string, updates: Partial<MarketplaceItem>): MarketplaceItem | null {
    const idx = this.schema.marketplace.findIndex((item) => item.id === id);
    if (idx === -1) return null;
    this.schema.marketplace[idx] = { ...this.schema.marketplace[idx], ...updates };
    this.save();
    return this.schema.marketplace[idx];
  }

  public deleteMarketplaceItem(id: string): boolean {
    const initialLen = this.schema.marketplace.length;
    this.schema.marketplace = this.schema.marketplace.filter((item) => item.id !== id);
    if (this.schema.marketplace.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Services Hub
  public getServices(): ServicePost[] {
    return this.schema.services;
  }

  public findServiceById(id: string): ServicePost | undefined {
    return this.schema.services.find((s) => s.id === id);
  }

  public addService(service: ServicePost): ServicePost {
    this.schema.services.push(service);
    this.save();
    return service;
  }

  public updateService(id: string, updates: Partial<ServicePost>): ServicePost | null {
    const idx = this.schema.services.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.schema.services[idx] = { ...this.schema.services[idx], ...updates };
    this.save();
    return this.schema.services[idx];
  }

  public deleteService(id: string): boolean {
    const initialLen = this.schema.services.length;
    this.schema.services = this.schema.services.filter((s) => s.id !== id);
    if (this.schema.services.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Requirements Hub
  public getRequirements(): RequirementPost[] {
    return this.schema.requirements;
  }

  public findRequirementById(id: string): RequirementPost | undefined {
    return this.schema.requirements.find((r) => r.id === id);
  }

  public addRequirement(req: RequirementPost): RequirementPost {
    this.schema.requirements.push(req);
    this.save();
    return req;
  }

  public updateRequirement(id: string, updates: Partial<RequirementPost>): RequirementPost | null {
    const idx = this.schema.requirements.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    this.schema.requirements[idx] = { ...this.schema.requirements[idx], ...updates };
    this.save();
    return this.schema.requirements[idx];
  }

  // Notices Announcement
  public getNotices(): Notice[] {
    return this.schema.notices;
  }

  public findNoticeById(id: string): Notice | undefined {
    return this.schema.notices.find((n) => n.id === id);
  }

  public addNotice(notice: Notice): Notice {
    this.schema.notices.push(notice);
    this.save();
    return notice;
  }

  public deleteNotice(id: string): boolean {
    const initialLen = this.schema.notices.length;
    this.schema.notices = this.schema.notices.filter((n) => n.id !== id);
    if (this.schema.notices.length !== initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  // Staff Tracking
  public getStaff(): StaffAvailability[] {
    return this.schema.staff;
  }

  public findStaffById(id: string): StaffAvailability | undefined {
    return this.schema.staff.find((s) => s.id === id);
  }

  public addStaff(staff: StaffAvailability): StaffAvailability {
    this.schema.staff.push(staff);
    this.save();
    return staff;
  }

  public updateStaff(id: string, updates: Partial<StaffAvailability>): StaffAvailability | null {
    const idx = this.schema.staff.findIndex((s) => s.id === id);
    if (idx === -1) return null;
    this.schema.staff[idx] = { ...this.schema.staff[idx], ...updates };
    this.save();
    return this.schema.staff[idx];
  }
}

export const db = new FileDatabase();
export { UserRole, Department, MarketplaceCategory, MarketplaceStatus, NoticeType, StaffStatus };

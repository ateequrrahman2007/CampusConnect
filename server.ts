import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

import {
  db,
  UserRole,
  Department,
  MarketplaceCategory,
  MarketplaceStatus,
  NoticeType,
  StaffStatus,
  hashPassword,
} from './src/server/db.js';
import { signToken, verifyToken } from './src/server/auth.js';
import {
  User,
  MarketplaceItem,
  ServicePost,
  RequirementPost,
  Notice,
  StaffAvailability,
} from './src/types.js';

dotenv.config();

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Set up a custom Express Request type extension for TypeScript
interface AuthenticatedRequest extends Request {
  user?: User;
}

// Global Authentication Middlewares
const protect = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let token = '';
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({ success: false, message: 'Not authorized, token missing' });
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      res.status(401).json({ success: false, message: 'Not authorized, token invalid' });
      return;
    }

    const user = db.findUserById(decoded.userId);
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Authentication failure' });
  }
};

const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden: User role '${req.user?.role || 'Guest'}' is not authorized to access this resource`,
      });
      return;
    }
    next();
  };
};

// ==========================================
// 1. AUTHENTICATION & PROFILE API ENDPOINTS
// ==========================================

// Get Current User Profile (Protected)
app.get('/api/auth/me', protect, (req: AuthenticatedRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});

// Update Profile (Protected)
app.put('/api/auth/profile', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const { skills, portfolioLinks, profilePicture, department, name } = req.body;

  const updates: Partial<User> = {};
  if (Array.isArray(skills)) updates.skills = skills.map(s => String(s).trim());
  if (Array.isArray(portfolioLinks)) updates.portfolioLinks = portfolioLinks;
  if (profilePicture && typeof profilePicture === 'string') updates.profilePicture = profilePicture;
  if (department && Object.values(Department).includes(department)) updates.department = department;
  if (name && typeof name === 'string') updates.name = name.trim();

  const updatedUser = db.updateUser(req.user.id, updates);
  if (!updatedUser) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  res.json({ success: true, data: updatedUser, message: 'Profile updated successfully' });
});

// Register New User
app.post('/api/auth/register', (req: Request, res: Response) => {
  const { name, email, password, rollNumber, department } = req.body;

  if (!name || !email || !password || !rollNumber || !department) {
    res.status(400).json({ success: false, message: 'Please provide all required fields' });
    return;
  }

  // Domain Verification from Environment Variable Suffix
  const allowedDomain = process.env.COLLEGE_EMAIL_DOMAIN || '@college.edu';
  if (!email.toLowerCase().endsWith(allowedDomain.toLowerCase())) {
    res.status(400).json({
      success: false,
      message: `Registration requires secondary domain verification. Email must end with ${allowedDomain}`,
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    return;
  }

  // Duplicate Check
  const existingUser = db.findUserByEmail(email);
  if (existingUser) {
    res.status(400).json({ success: false, message: 'User with this email is already registered' });
    return;
  }

  const existingRoll = db.getUsers().find(u => u.rollNumber.toLowerCase() === rollNumber.toLowerCase());
  if (existingRoll) {
    res.status(400).json({ success: false, message: 'Roll number is already in use' });
    return;
  }

  const id = `usr_${Date.now()}`;
  const passHash = hashPassword(password);

  const newUser: User = {
    id,
    name,
    email: email.toLowerCase(),
    rollNumber,
    department: department as Department,
    profilePicture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150', // Default Avatar
    skills: [],
    portfolioLinks: [],
    ratings: { average: 5.0, reviews: [] },
    role: UserRole.Student, // default is student
    createdAt: new Date().toISOString(),
  };

  db.registerUser(newUser, passHash);
  const token = signToken({ userId: id });

  res.status(201).json({
    success: true,
    data: { user: newUser, token },
    message: 'Registration successful!',
  });
});

// Login User
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Please provide email and password' });
    return;
  }

  const user = db.findUserByEmail(email);
  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const hash = hashPassword(password);
  const savedHash = db.getUserPasswordHash(user.id);

  if (hash !== savedHash) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const token = signToken({ userId: user.id });

  res.json({
    success: true,
    data: { user, token },
    message: 'Welcome back!',
  });
});

// Logout User
app.get('/api/auth/logout', (req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// 2. MARKETPLACE ITEMS API ENDPOINTS
// ==========================================

// Get Marketplace Listings (filtered)
app.get('/api/marketplace', (req: Request, res: Response) => {
  let listings = db.getMarketplace();

  const { category, status, search, minPrice, maxPrice } = req.query;

  // Filter Category
  if (category && category !== 'all') {
    listings = listings.filter(item => item.category === category);
  }

  // Filter Status (default to Available, but let sellers query Sold too)
  if (status) {
    listings = listings.filter(item => item.status === status);
  }

  // Price range checks
  if (minPrice) {
    const min = parseFloat(minPrice as string);
    if (!isNaN(min)) listings = listings.filter(item => item.price >= min);
  }
  if (maxPrice) {
    const max = parseFloat(maxPrice as string);
    if (!isNaN(max)) listings = listings.filter(item => item.price <= max);
  }

  // Search filter
  if (search) {
    const query = (search as string).toLowerCase().trim();
    listings = listings.filter(
      item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
    );
  }

  // Sorting: newest first
  listings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, count: listings.length, data: listings });
});

// Get Single Marketplace Item By ID
app.get('/api/marketplace/:id', (req: Request, res: Response) => {
  const item = db.findMarketplaceById(req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Listing not found' });
    return;
  }
  res.json({ success: true, data: item });
});

// Create Marketplace Listing (Protected)
app.post('/api/marketplace', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const { title, description, price, imageUrl, category } = req.body;

  if (!title || !description || price === undefined || !category) {
    res.status(400).json({ success: false, message: 'All listing fields are required' });
    return;
  }

  const numPrice = parseFloat(price);
  if (isNaN(numPrice) || numPrice < 0) {
    res.status(400).json({ success: false, message: 'Price must be a positive number' });
    return;
  }

  if (!Object.values(MarketplaceCategory).includes(category)) {
    res.status(400).json({ success: false, message: 'Invalid category option' });
    return;
  }

  const defaultImages = {
    [MarketplaceCategory.Books]: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400',
    [MarketplaceCategory.Gadgets]: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400',
    [MarketplaceCategory.Bikes]: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=400',
    [MarketplaceCategory.LabEquipment]: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=400',
    [MarketplaceCategory.Other]: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  };

  const id = `item_${Date.now()}`;
  const newItem: MarketplaceItem = {
    id,
    sellerId: req.user.id,
    sellerName: req.user.name,
    sellerEmail: req.user.email,
    sellerDepartment: req.user.department,
    title: title.trim(),
    description: description.trim(),
    price: numPrice,
    imageUrl: imageUrl && imageUrl.trim() ? imageUrl : defaultImages[category as MarketplaceCategory],
    category: category as MarketplaceCategory,
    status: MarketplaceStatus.Available,
    createdAt: new Date().toISOString(),
  };

  db.addMarketplaceItem(newItem);

  res.status(201).json({
    success: true,
    data: newItem,
    message: 'Listing created successfully',
  });
});

// Update Marketplace Listing (Protected - Owner or Admin only)
app.put('/api/marketplace/:id', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const item = db.findMarketplaceById(req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Listing not found' });
    return;
  }

  // Security Check: Seller or Admin only
  if (item.sellerId !== req.user.id && req.user.role !== UserRole.Admin) {
    res.status(403).json({ success: false, message: 'Not authorized to modify this listing' });
    return;
  }

  const { title, description, price, imageUrl, category, status } = req.body;

  const updates: Partial<MarketplaceItem> = {};
  if (title) updates.title = title.trim();
  if (description) updates.description = description.trim();
  if (price !== undefined) {
    const val = parseFloat(price);
    if (!isNaN(val) && val >= 0) updates.price = val;
  }
  if (imageUrl) updates.imageUrl = imageUrl.trim();
  if (category && Object.values(MarketplaceCategory).includes(category)) updates.category = category;
  if (status && Object.values(MarketplaceStatus).includes(status)) updates.status = status;

  const updated = db.updateMarketplaceItem(req.params.id, updates);

  res.json({
    success: true,
    data: updated,
    message: 'Listing updated successfully',
  });
});

// Delete Marketplace Listing (Protected - Owner or Admin only)
app.delete('/api/marketplace/:id', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const item = db.findMarketplaceById(req.params.id);
  if (!item) {
    res.status(404).json({ success: false, message: 'Listing not found' });
    return;
  }

  if (item.sellerId !== req.user.id && req.user.role !== UserRole.Admin) {
    res.status(403).json({ success: false, message: 'Not authorized to delete this listing' });
    return;
  }

  db.deleteMarketplaceItem(req.params.id);

  res.json({ success: true, message: 'Listing removed successfully' });
});

// ==========================================
// 3. SKILLS SERVICES API ENDPOINTS
// ==========================================

// Get Services List
app.get('/api/services', (req: Request, res: Response) => {
  let posts = db.getServices();
  const { skill } = req.query;

  if (skill) {
    const val = (skill as string).toLowerCase().trim();
    posts = posts.filter(
      p =>
        p.skillCategory.toLowerCase().includes(val) ||
        p.description.toLowerCase().includes(val) ||
        p.providerSkills.some(s => s.toLowerCase().includes(val))
    );
  }

  // Newest postings first
  posts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, count: posts.length, data: posts });
});

// Get Single Service Page
app.get('/api/services/:id', (req: Request, res: Response) => {
  const service = db.findServiceById(req.params.id);
  if (!service) {
    res.status(404).json({ success: false, message: 'Service package not found' });
    return;
  }
  res.json({ success: true, data: service });
});

// Create Service Announcement Card
app.post('/api/services', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const { skillCategory, description, hourlyRate, startingPrice } = req.body;

  if (!skillCategory || !description) {
    res.status(400).json({ success: false, message: 'Category name and description are required' });
    return;
  }

  const id = `srv_${Date.now()}`;
  const hr = hourlyRate ? parseFloat(hourlyRate) : undefined;
  const start = startingPrice ? parseFloat(startingPrice) : undefined;

  const newPost: ServicePost = {
    id,
    providerId: req.user.id,
    providerName: req.user.name,
    providerEmail: req.user.email,
    providerDepartment: req.user.department,
    providerSkills: req.user.skills,
    providerRating: req.user.ratings.average,
    skillCategory: skillCategory.trim(),
    description: description.trim(),
    hourlyRate: isNaN(Number(hr)) ? undefined : hr,
    startingPrice: isNaN(Number(start)) ? undefined : start,
    createdAt: new Date().toISOString(),
  };

  db.addService(newPost);

  res.status(201).json({
    success: true,
    data: newPost,
    message: 'Skill Hub offer published successfully',
  });
});

// Update Service Posting (Protected - Owner or Admin only)
app.put('/api/services/:id', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const post = db.findServiceById(req.params.id);
  if (!post) {
    res.status(404).json({ success: false, message: 'Service not found' });
    return;
  }

  if (post.providerId !== req.user.id && req.user.role !== UserRole.Admin) {
    res.status(403).json({ success: false, message: 'Not authorized to modify this posting' });
    return;
  }

  const { skillCategory, description, hourlyRate, startingPrice } = req.body;

  const updates: Partial<ServicePost> = {};
  if (skillCategory) updates.skillCategory = skillCategory.trim();
  if (description) updates.description = description.trim();

  if (hourlyRate !== undefined) {
    const val = parseFloat(hourlyRate);
    updates.hourlyRate = isNaN(val) ? undefined : val;
  }
  if (startingPrice !== undefined) {
    const val = parseFloat(startingPrice);
    updates.startingPrice = isNaN(val) ? undefined : val;
  }

  const updated = db.updateService(req.params.id, updates);

  res.json({
    success: true,
    data: updated,
    message: 'Skill post updated successfully',
  });
});

// Delete Service Package (Protected - Owner or Admin only)
app.delete('/api/services/:id', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const post = db.findServiceById(req.params.id);
  if (!post) {
    res.status(404).json({ success: false, message: 'Service not found' });
    return;
  }

  if (post.providerId !== req.user.id && req.user.role !== UserRole.Admin) {
    res.status(403).json({ success: false, message: 'Not authorized to remove this package' });
    return;
  }

  db.deleteService(req.params.id);

  res.json({ success: true, message: 'Service package removed successfully' });
});

// ==========================================
// 4. REQUIREMENTS/DASHBOARD COOP API
// ==========================================

// Get All Open Requirements
app.get('/api/requirements', (req: Request, res: Response) => {
  let list = db.getRequirements();

  // Sorting newest first
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, count: list.length, data: list });
});

app.get('/api/requirements/:id', (req: Request, res: Response) => {
  const requirement = db.findRequirementById(req.params.id);
  if (!requirement) {
    res.status(404).json({ success: false, message: 'Project requirement not found' });
    return;
  }
  res.json({ success: true, data: requirement });
});

// Create Assistance Project Request (Protected)
app.post('/api/requirements', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const { title, description, budget, category } = req.body;

  if (!title || !description || !category) {
    res.status(400).json({ success: false, message: 'Title, category and details are critical' });
    return;
  }

  const id = `req_${Date.now()}`;
  const numBudget = budget ? parseFloat(budget) : undefined;

  const newPost: RequirementPost = {
    id,
    posterId: req.user.id,
    posterName: req.user.name,
    posterEmail: req.user.email,
    posterDepartment: req.user.department,
    title: title.trim(),
    description: description.trim(),
    budget: isNaN(Number(numBudget)) ? undefined : numBudget,
    category: category.trim(),
    responses: [],
    isOpen: true,
    createdAt: new Date().toISOString(),
  };

  db.addRequirement(newPost);

  res.status(201).json({
    success: true,
    data: newPost,
    message: 'Cooperation request created successfully',
  });
});

// Respond To Requirement Posting (Protected)
app.put('/api/requirements/:id/respond', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const requirement = db.findRequirementById(req.params.id);
  if (!requirement) {
    res.status(404).json({ success: false, message: 'Requirement post not found' });
    return;
  }

  if (!requirement.isOpen) {
    res.status(400).json({ success: false, message: 'This project is already closed' });
    return;
  }

  const { message } = req.body;
  if (!message || !message.trim()) {
    res.status(400).json({ success: false, message: 'Please provide a response proposal message' });
    return;
  }

  const responsePayload = {
    responderId: req.user.id,
    responderName: req.user.name,
    message: message.trim(),
    respondedAt: new Date().toISOString(),
  };

  const updatedResponses = [...requirement.responses, responsePayload];
  const updated = db.updateRequirement(req.params.id, { responses: updatedResponses });

  res.json({
    success: true,
    data: updated,
    message: 'Response sent to provider inbox successfully!',
  });
});

// Close Requirement Form (Poster or Admin only)
app.put('/api/requirements/:id/close', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const post = db.findRequirementById(req.params.id);
  if (!post) {
    res.status(404).json({ success: false, message: 'Requirement post not found' });
    return;
  }

  if (post.posterId !== req.user.id && req.user.role !== UserRole.Admin) {
    res.status(403).json({ success: false, message: 'Not authorized to fulfill this action' });
    return;
  }

  const updated = db.updateRequirement(req.params.id, { isOpen: false });

  res.json({
    success: true,
    data: updated,
    message: 'Project requirement closed successfully',
  });
});

// ==========================================
// 5. NOTICES TIMELINE API ENDPOINTS
// ==========================================

// Get All Active Notices
app.get('/api/notices', (req: Request, res: Response) => {
  let notices = db.getNotices();
  const { type } = req.query;

  // Active notices only
  const today = new Date().getTime();
  notices = notices.filter(n => new Date(n.expiryDate).getTime() >= today);

  if (type) {
    notices = notices.filter(n => n.type === type);
  }

  // Newest first
  notices.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, count: notices.length, data: notices });
});

// Create Campus Notice Board Entry (Admin or Club Leads or Staff)
app.post(
  '/api/notices',
  protect,
  authorize(UserRole.Admin, UserRole.ClubLead),
  (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthenticated' });
      return;
    }

    const { title, content, type, expiryDays } = req.body;

    if (!title || !content || !type) {
      res.status(400).json({ success: false, message: 'Please provide full title, content and category' });
      return;
    }

    if (!Object.values(NoticeType).includes(type)) {
      res.status(400).json({ success: false, message: 'Incorrect notice category tag' });
      return;
    }

    // Notice TTL Definition
    const days = parseInt(expiryDays) || 7;
    const expiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    const id = `not_${Date.now()}`;
    const newNotice: Notice = {
      id,
      authorId: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role,
      title: title.trim(),
      content: content.trim(),
      type: type as NoticeType,
      expiryDate,
      createdAt: new Date().toISOString(),
    };

    db.addNotice(newNotice);

    res.status(201).json({
      success: true,
      data: newNotice,
      message: 'Notice posted on academic bullet board!',
    });
  }
);

// Delete Notice Entry (Admin Only)
app.delete('/api/notices/:id', protect, authorize(UserRole.Admin), (req: AuthenticatedRequest, res: Response) => {
  const deleted = db.deleteNotice(req.params.id);
  if (!deleted) {
    res.status(404).json({ success: false, message: 'Notice not found or already deleted' });
    return;
  }
  res.json({ success: true, message: 'Notice removed successfully' });
});

// ==========================================
// 6. STAFF AVAILABILITY API SERVICES
// ==========================================

// Get All Staff Directories
app.get('/api/staff', (req: Request, res: Response) => {
  let staff = db.getStaff();
  const { query } = req.query;

  if (query) {
    const val = (query as string).toLowerCase().trim();
    staff = staff.filter(
      stf =>
        stf.staffName.toLowerCase().includes(val) ||
        stf.designation.toLowerCase().includes(val) ||
        stf.department.toLowerCase().includes(val)
    );
  }

  // Sort: available status first, then by department
  const statusWeight = {
    [StaffStatus.Available]: 1,
    [StaffStatus.Busy]: 2,
    [StaffStatus.Out]: 3,
  };

  staff.sort((a, b) => {
    const dComp = a.department.localeCompare(b.department);
    if (dComp !== 0) return dComp;
    return statusWeight[a.availabilityStatus] - statusWeight[b.availabilityStatus];
  });

  res.json({ success: true, count: staff.length, data: staff });
});

// Create Staff Record (Admin Only)
app.post('/api/staff', protect, authorize(UserRole.Admin), (req: AuthenticatedRequest, res: Response) => {
  const { staffName, designation, department, currentLocation, availabilityStatus, availableUntil } = req.body;

  if (!staffName || !designation || !department || !availabilityStatus) {
    res.status(400).json({ success: false, message: 'All staff details are mandatory' });
    return;
  }

  if (!Object.values(StaffStatus).includes(availabilityStatus)) {
    res.status(400).json({ success: false, message: 'Incorrect status choice' });
    return;
  }

  const id = `stf_${Date.now()}`;
  const record: StaffAvailability = {
    id,
    staffName: staffName.trim(),
    designation: designation.trim(),
    department: department.trim(),
    currentLocation: currentLocation ? currentLocation.trim() : 'Office Cabin',
    availabilityStatus: availabilityStatus as StaffStatus,
    availableUntil: availableUntil ? availableUntil.trim() : '5:00 PM',
    updatedById: req.user?.id,
    updatedByName: req.user?.name,
    lastUpdated: new Date().toISOString(),
  };

  db.addStaff(record);

  res.status(201).json({
    success: true,
    data: record,
    message: 'Staff directory profile registered successfully',
  });
});

// Update Staff whereabouts status (Accessible to anyone - Student representing, Club Lead, Admin)
app.put('/api/staff/:id', protect, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Unauthenticated' });
    return;
  }

  const staff = db.findStaffById(req.params.id);
  if (!staff) {
    res.status(404).json({ success: false, message: 'Staff personnel directory not found' });
    return;
  }

  const { currentLocation, availabilityStatus, availableUntil } = req.body;

  const updates: Partial<StaffAvailability> = {
    lastUpdated: new Date().toISOString(),
    updatedById: req.user.id,
    updatedByName: req.user.name,
  };

  if (currentLocation) updates.currentLocation = currentLocation.trim();
  if (availabilityStatus && Object.values(StaffStatus).includes(availabilityStatus)) {
    updates.availabilityStatus = availabilityStatus;
  }
  if (availableUntil) updates.availableUntil = availableUntil.trim();

  const updated = db.updateStaff(req.params.id, updates);

  res.json({
    success: true,
    data: updated,
    message: `Availability details updated for ${staff.staffName}`,
  });
});


// ==========================================
// VITE AND ASSET HANDLERS (SPA PROXYING)
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted successfully (Dev mode)');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully booted on virtual container ingress: http://localhost:${PORT}`);
  });
}

startServer();

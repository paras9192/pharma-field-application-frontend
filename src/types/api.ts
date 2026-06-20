// ─── Common ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: string[];
  };
  path: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'MR' | 'SALES_PERSON';
export type VisitType = 'DOCTOR' | 'CHEMIST';
export type VisitStatus = 'COMPLETED' | 'CANCELLED' | 'PENDING';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
export type ReportStatus = 'DRAFT' | 'SUBMITTED';

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  employeeCode: string | null;
  profilePhoto: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  employeeCode: string | null;
  profilePhoto: string | null;
  dateOfJoining: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  role: { id: number; name: Role };
  createdBy: { id: string; name: string } | null;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  employeeCode?: string;
  dateOfJoining?: string;
}

export interface UpdateUserPayload {
  name?: string;
  phone?: string;
  employeeCode?: string;
  profilePhoto?: string;
  dateOfJoining?: string;
  isActive?: boolean;
}

// ─── Territory ────────────────────────────────────────────────────────────────

export interface State {
  id: number;
  name: string;
  code: string;
  createdAt: string;
}

export interface District {
  id: number;
  name: string;
  stateId: number;
  state: State;
  createdAt: string;
}

export interface City {
  id: number;
  name: string;
  districtId: number;
  district: District;
  createdAt: string;
}

export interface Territory {
  id: number;
  name: string;
  code: string | null;
  cityId: number;
  city: City;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TerritoryHierarchy {
  id: number;
  name: string;
  code: string;
  districts: Array<{
    id: number;
    name: string;
    cities: Array<{
      id: number;
      name: string;
      territories: Array<{
        id: number;
        name: string;
        code: string | null;
        isActive: boolean;
      }>;
    }>;
  }>;
}

// ─── Doctor ───────────────────────────────────────────────────────────────────

export interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
  clinicName: string | null;
  hospitalName: string | null;
  phone: string | null;
  alternatePhone: string | null;
  email: string | null;
  address: string | null;
  territoryId: number | null;
  territory: Pick<Territory, 'id' | 'name'> | null;
  addedBy: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoctorPayload {
  name: string;
  specialization?: string;
  clinicName?: string;
  hospitalName?: string;
  phone?: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  territoryId?: number;
}

// ─── Chemist ──────────────────────────────────────────────────────────────────

export interface Chemist {
  id: string;
  shopName: string;
  ownerName: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  gstNumber: string | null;
  address: string | null;
  territoryId: number | null;
  territory: Pick<Territory, 'id' | 'name'> | null;
  addedBy: { id: string; name: string } | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChemistPayload {
  shopName: string;
  ownerName: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  territoryId?: number;
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export interface Attendance {
  id: string;
  userId: string;
  date: string;
  checkInTime: string | null;
  checkInLat: string | null;
  checkInLng: string | null;
  checkInAddress: string | null;
  checkOutTime: string | null;
  checkOutLat: string | null;
  checkOutLng: string | null;
  checkOutAddress: string | null;
  workingHours: string | null;
  status: AttendanceStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export interface CheckInPayload {
  lat: number;
  lng: number;
  address?: string;
  notes?: string;
}

export interface CheckOutPayload {
  lat: number;
  lng: number;
  address?: string;
  notes?: string;
}

// ─── Visits ───────────────────────────────────────────────────────────────────

export interface VisitProduct {
  id: number;
  visitId: string;
  productName: string;
  details: string | null;
  quantity: string | null;
}

export interface Visit {
  id: string;
  userId: string;
  visitType: VisitType;
  doctorId: string | null;
  chemistId: string | null;
  territoryId: number | null;
  visitDate: string;
  visitTime: string;
  lat: string | null;
  lng: string | null;
  locationAddress: string | null;
  purpose: string | null;
  notes: string | null;
  followUpDate: string | null;
  followUpNotes: string | null;
  followUpDone: boolean;
  status: VisitStatus;
  products: VisitProduct[];
  user: { id: string; name: string; employeeCode: string | null };
  doctor: { id: string; name: string; specialization: string | null } | null;
  chemist: { id: string; shopName: string; ownerName: string } | null;
  territory: { id: number; name: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVisitPayload {
  visitType: VisitType;
  doctorId?: string;
  chemistId?: string;
  territoryId?: number;
  visitDate: string;
  lat?: number;
  lng?: number;
  locationAddress?: string;
  purpose?: string;
  notes?: string;
  followUpDate?: string;
  followUpNotes?: string;
  status?: VisitStatus;
  products?: { productName: string; details?: string; quantity?: string }[];
}

// ─── Daily Reports ────────────────────────────────────────────────────────────

export interface DailyReport {
  id: string;
  userId: string;
  date: string;
  totalVisits: number;
  doctorVisits: number;
  chemistVisits: number;
  productsDiscussed: string | null;
  competitorActivity: string | null;
  highlights: string | null;
  challenges: string | null;
  remarks: string | null;
  status: ReportStatus;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
}

export interface CreateDailyReportPayload {
  date: string;
  productsDiscussed?: string;
  competitorActivity?: string;
  highlights?: string;
  challenges?: string;
  remarks?: string;
  status?: ReportStatus;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface AdminDashboard {
  date: string;
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    presentToday: number;
    absentToday: number;
    totalVisitsToday: number;
    doctorVisitsToday: number;
    chemistVisitsToday: number;
    pendingFollowUps: number;
    reportsSubmittedToday: number;
    totalDoctors: number;
    totalChemists: number;
  };
  topPerformers: Array<{
    user: { id: string; name: string; employeeCode: string | null; role: { name: Role } };
    visitCount: number;
  }>;
  presentEmployees: Attendance[];
}

export interface EmployeeDashboard {
  date: string;
  attendance: Attendance | null;
  summary: {
    todayVisits: number;
    doctorVisitsToday: number;
    chemistVisitsToday: number;
    pendingFollowUps: number;
    totalVisitsMonth: number;
    reportStatus: ReportStatus | 'NOT_CREATED';
  };
  recentVisits: Visit[];
  upcomingFollowUps: Visit[];
}

export interface TerritoryStats {
  id: number;
  name: string;
  code: string | null;
  location: { city: string; district: string; state: string };
  assignedEmployees: number;
  employees: Array<{ id: string; name: string; role: { name: Role } }>;
  stats: { doctors: number; chemists: number; totalVisits: number };
}

export interface EmployeePerformance {
  employee: { id: string; name: string; employeeCode: string | null; role: { name: Role } };
  totalVisits: number;
  doctorVisits: number;
  chemistVisits: number;
  daysPresent: number;
  reportsSubmitted: number;
}

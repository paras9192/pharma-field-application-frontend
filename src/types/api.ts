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

export interface EntityImage {
  id: number;
  url: string;
  filename: string;
  createdAt: string;
  uploadedBy: { id: string; name: string };
}

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
  birthday: string | null;
  anniversary: string | null;
  addedBy: { id: string; name: string } | null;
  isActive: boolean;
  latitude: string | null;
  longitude: string | null;
  locationCapturedAt: string | null;
  images: EntityImage[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDoctorPayload {
  name: string;
  specialization?: string;
  clinicName?: string;
  hospitalName?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  address?: string;
  territoryId: number;
  birthday?: string;
  anniversary?: string;
  latitude?: number;
  longitude?: number;
  locationCapturedAt?: string;
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
  assignedSalesPerson: { id: string; name: string } | null;
  isActive: boolean;
  latitude: string | null;
  longitude: string | null;
  locationCapturedAt: string | null;
  images: EntityImage[];
  createdAt: string;
  updatedAt: string;
}

export interface SalesPersonChemist {
  id: string;
  userId: string;
  chemistId: string;
  assignedAt: string;
  chemist: Pick<Chemist, 'id' | 'shopName' | 'ownerName' | 'phone' | 'address' | 'gstNumber' | 'isActive'> & {
    territory: Pick<Territory, 'id' | 'name'> | null;
  };
  assignedBy: { id: string; name: string };
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
  latitude?: number;
  longitude?: number;
  locationCapturedAt?: string;
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
  locationCapturedAt: string | null;
  purpose: string | null;
  notes: string | null;
  followUpDate: string | null;
  followUpNotes: string | null;
  followUpDone: boolean;
  status: VisitStatus;
  products: VisitProduct[];
  images: EntityImage[];
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
  locationCapturedAt?: string;
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

// ─── Orders ───────────────────────────────────────────────────────────────────

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';

export interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  rate: number;
  amount: number;
  notes: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;
  chemistId: string;
  chemist: { id: string; shopName: string; ownerName: string };
  status: OrderStatus;
  totalAmount: number;
  expectedDelivery: string | null;
  deliveredAt: string | null;
  deliveredBy: { id: string; name: string } | null;
  notes: string | null;
  items: OrderItem[];
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

// ─── Bills ────────────────────────────────────────────────────────────────────

export type BillStatus = 'UNPAID' | 'PARTIAL' | 'PAID';
export type SettlementType = 'GOODS_RETURN' | 'CREDIT_NOTE' | 'DISCOUNT';

export interface BillImage {
  id: string;
  billId: string;
  imageUrl?: string;
  url?: string;
  filePath?: string;
  createdAt: string;
}

export interface Bill {
  id: string;
  billNumber: string;
  originalBillId: string | null;
  chemistId: string;
  chemist: { id: string; shopName: string; ownerName: string };
  orderId: string | null;
  order: { id: string; orderNumber: string } | null;
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
  status: BillStatus;
  dueDate: string | null;
  notes: string | null;
  images: BillImage[];
  payments?: Payment[];
  createdBy: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface Settlement {
  id: string;
  billId: string;
  type: SettlementType;
  amount: number;
  notes: string | null;
  createdBy: { id: string; name: string };
  createdAt: string;
}

// ─── Payments ─────────────────────────────────────────────────────────────────

export type PaymentMode = 'CASH' | 'CHEQUE' | 'UPI' | 'NEFT' | 'BANK_TRANSFER';

export interface Payment {
  id: string;
  billId: string;
  bill: { id: string; billNumber: string } | null;
  amount: number;
  paymentMode: PaymentMode;
  referenceNumber: string | null;
  notes: string | null;
  collectedBy: { id: string; name: string };
  createdAt: string;
}

export interface PaymentSummary {
  totalCollected: number;
  totalTransactions: number;
  byMode: Array<{ mode: PaymentMode; amount: number; count: number }>;
}

// ─── Dashboard Types ────────────────────────────────────────────────────────
export type AlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW'

export interface DailyTrend {
  date: string
  amount: number
  count: number
}

export interface SuperAdminDashboard {
  date: string
  kpi: {
    totalBills: number
    totalBillValue: number
    totalCollected: number
    totalOutstanding: number
    overdueCount: number
    overdueAmount: number
    billsToday: number
    billsThisMonth: number
    totalChemists: number
    totalDoctors: number
    totalEmployees: number
    presentToday: number
    attendanceRate: number
    visitsToday: number
    pendingFollowUps: number
    collectionRate: number
  }
  trends: {
    bills: DailyTrend[]
    collections: DailyTrend[]
  }
  leaderboard: {
    salespersons: Array<{
      rank: number
      user: { id: string; name: string; employeeCode: string | null }
      collected: number
      transactions: number
    }>
    mrs: Array<{
      rank: number
      user: { id: string; name: string; employeeCode: string | null; role: { name: string } }
      visitsThisMonth: number
    }>
  }
  alerts: {
    overdueCount: number
    overdueAmount: number
    pendingFollowUps: number
    employeesAbsent: number
  }
  recentActivity: {
    payments: Array<{
      type: 'PAYMENT'
      id: string
      description: string
      mode: string
      amount: number
      at: string
    }>
    bills: Array<{
      type: 'BILL'
      id: string
      description: string
      amount: number
      status: string
      at: string
    }>
  }
}

export interface PaymentsDashboard {
  kpi: {
    totalBills: number
    totalBillValue: number
    totalCollected: number
    totalOutstanding: number
    unpaidCount: number
    partialCount: number
    paidCount: number
    totalTransactions: number
    collectionRate: number
  }
  aging: {
    dueToday: { count: number; amount: number }
    due1to7Days: { count: number; amount: number }
    due8to15Days: { count: number; amount: number }
    due16to30Days: { count: number; amount: number }
    overdue30plus: { count: number; amount: number }
  }
  paymentModes: Array<{ mode: string; amount: number; count: number }>
  salespersonRanking?: Array<{
    rank: number
    user: { id: string; name: string; employeeCode: string | null }
    totalCollected: number
    transactions: number
  }>
  upcomingCollections: Array<{
    id: string
    billNumber: string
    dueAmount: number
    dueDate: string
    daysUntilDue: number
    status: string
    chemist: { id: string; shopName: string; ownerName: string; phone: string }
    createdBy: { id: string; name: string; employeeCode: string | null }
  }>
  highRiskAccounts: Array<{
    id: string
    billNumber: string
    dueAmount: number
    dueDate: string
    daysOverdue: number
    status: string
    chemist: { id: string; shopName: string; ownerName: string; phone: string }
    createdBy: { id: string; name: string; employeeCode: string | null }
  }>
  trends: {
    collections: DailyTrend[]
  }
}

export interface SalesPersonDashboard {
  date: string
  attendance: {
    id: string
    userId: string
    date: string
    checkInTime: string | null
    checkOutTime: string | null
    status: AttendanceStatus
    workingHours: number | null
  } | null
  kpi: {
    totalAssignedChemists: number
    todayCollected: number
    todayTransactions: number
    todayVisits: number
    pendingBills: number
    overdueCount: number
    pendingFollowUps: number
  }
  monthlyPerformance: {
    billsCreated: number
    billValue: number
    collected: number
    transactions: number
  }
  collectionTasks: Array<{
    id: string
    billNumber: string
    dueAmount: number
    dueDate: string
    daysUntilDue: number
    priority: 'HIGH' | 'MEDIUM' | 'LOW'
    status: string
    chemist: { id: string; shopName: string; ownerName: string; phone: string }
  }>
  overdueBills: Array<{
    id: string
    billNumber: string
    dueAmount: number
    dueDate: string
    daysOverdue: number
    status: string
    chemist: { id: string; shopName: string; ownerName: string; phone: string }
  }>
  todaySchedule: Array<{
    id: string
    visitType: VisitType
    visitTime: string
    status: VisitStatus
    purpose: string | null
    doctor: { id: string; name: string } | null
    chemist: { id: string; shopName: string } | null
  }>
  assignedChemists: Array<{ id: string; shopName: string; ownerName: string; phone: string }>
}

export interface MRDashboard {
  date: string
  attendance: {
    id: string
    userId: string
    date: string
    checkInTime: string | null
    checkOutTime: string | null
    status: AttendanceStatus
    workingHours: number | null
  } | null
  kpi: {
    todayVisits: number
    completedVisitsToday: number
    pendingFollowUps: number
    totalVisitsThisMonth: number
    avgVisitsPerDay: number
    reportStatus: ReportStatus
  }
  monthlyBreakdown: {
    totalVisits: number
    doctorVisits: number
    chemistVisits: number
    completionRate: number
  }
  todaySchedule: Array<{
    id: string
    visitType: VisitType
    visitTime: string
    status: VisitStatus
    purpose: string | null
    notes: string | null
    doctor: { id: string; name: string; specialization: string | null; clinicName: string | null } | null
    chemist: { id: string; shopName: string } | null
    products: Array<{ id: number; productName: string; details: string | null; quantity: string | null }>
  }>
  upcomingFollowUps: Array<{
    id: string
    visitType: VisitType
    followUpDate: string
    followUpNotes: string | null
    doctor: { id: string; name: string; specialization: string | null; clinicName: string | null } | null
    chemist: { id: string; shopName: string } | null
  }>
  recentActivity: Array<{
    id: string
    visitType: VisitType
    visitDate: string
    status: VisitStatus
    doctor: { id: string; name: string } | null
    chemist: { id: string; shopName: string } | null
  }>
}

export interface DashboardAlert {
  type: string
  severity: AlertSeverity
  message: string
  count?: number
}

export interface AlertsResponse {
  count: number
  generatedAt: string
  alerts: DashboardAlert[]
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | 'PAYMENT_COLLECTED'
  | 'BILL_CREATED'
  | 'BILL_OVERDUE'
  | 'PAYMENT_REMINDER_SENT'
  | 'ORDER_CREATED'
  | 'ORDER_STATUS_CHANGED'
  | 'VISIT_LOGGED'
  | 'GENERAL';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, string> | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: AppNotification[];
  total: number;
  unreadCount: number;
  page: number;
  limit: number;
}

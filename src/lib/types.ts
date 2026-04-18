export type BusStatus = "active" | "maintenance" | "inactive";
export type AssignmentStatus =
  | "scheduled"
  | "in_transit"
  | "completed"
  | "cancelled";

export interface Bus {
  id: number;
  busNumber: string;
  registrationNumber: string;
  make: string;
  model: string;
  seater: number;
  odometerKm: number;
  previousDayMileageKmpl: number | null;
  status: BusStatus;
  lastServiceAt: string | null;
}

export interface Driver {
  id: number;
  fullName: string;
  phone: string;
  companyName: string | null;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  pfAccountNumber: string | null;
  uanNumber: string | null;
  licenseNumber: string;
  licenseExpiry: string;
  experienceYears: number;
  hasProfilePhoto: boolean;
  isActive: boolean;
}

export interface Employee {
  id: number;
  employeeCode: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  companyName: string | null;
  gender: string | null;
  bloodGroup: string | null;
  validFrom: string | null;
  validTo: string | null;
  hasProfilePhoto: boolean;
  department: string;
  shiftStart: string;
  shiftEnd: string;
  pickupAddress: string;
  dropAddress: string;
  isActive: boolean;
}

export interface Route {
  id: number;
  routeCode: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  isActive: boolean;
}

export interface FuelEntry {
  id: number;
  busId: number;
  driverId: number | null;
  filledAt: string;
  odometerBeforeKm: number;
  odometerAfterKm: number;
  liters: number;
  amount: number;
  fuelStation: string | null;
  companyName: string | null;
}

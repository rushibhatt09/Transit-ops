export type Role = 'FLEET_MANAGER' | 'DRIVER' | 'SAFETY_OFFICER' | 'FINANCIAL_ANALYST'

export type VehicleStatus = 'AVAILABLE' | 'ON_TRIP' | 'IN_SHOP' | 'RETIRED'
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | 'SUSPENDED'
export type TripStatus = 'DRAFT' | 'DISPATCHED' | 'COMPLETED' | 'CANCELLED'
export type MaintenanceStatus = 'OPEN' | 'CLOSED'
export type ExpenseType = 'TOLL' | 'MAINTENANCE' | 'OTHER'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  driverId?: string | null
}

export interface DriverDashboardData {
  driver: {
    profile: {
      id: string
      name: string
      licenseNumber: string
      licenseCategory: string
      licenseExpiry: string
      licenseDaysRemaining: number
      safetyScore: number
      status: DriverStatus
    }
    activeTrip: Trip | null
    stats: {
      completedTrips: number
      draftTrips: number
      totalDistance: number
      totalFuel: number
    }
    recentTrips: Trip[]
  }
}

export interface Vehicle {
  id: string
  registrationNumber: string
  name: string
  type: string
  maxLoadCapacity: number
  odometer: number
  acquisitionCost: number
  region: string
  documentUrl?: string | null
  status: VehicleStatus
  createdAt: string
  updatedAt: string
}

export interface Driver {
  id: string
  name: string
  licenseNumber: string
  licenseCategory: string
  licenseExpiry: string
  contactNumber: string
  safetyScore: number
  status: DriverStatus
  createdAt: string
  updatedAt: string
}

export interface Trip {
  id: string
  source: string
  destination: string
  cargoWeight: number
  plannedDistance: number
  actualDistance?: number | null
  fuelConsumed?: number | null
  revenue: number
  status: TripStatus
  vehicleId: string
  driverId: string
  vehicle?: Vehicle
  driver?: Driver
  createdAt: string
  dispatchedAt?: string | null
  completedAt?: string | null
  cancelledAt?: string | null
}

export interface MaintenanceLog {
  id: string
  vehicleId: string
  vehicle?: Vehicle
  description: string
  cost: number
  date: string
  status: MaintenanceStatus
  createdAt: string
  closedAt?: string | null
}

export interface FuelLog {
  id: string
  vehicleId: string
  vehicle?: Vehicle
  tripId?: string | null
  liters: number
  cost: number
  date: string
}

export interface Expense {
  id: string
  vehicleId: string
  vehicle?: Vehicle
  type: ExpenseType
  amount: number
  date: string
  description?: string | null
}

export interface DashboardData {
  activeVehicles: number
  availableVehicles: number
  vehiclesInMaintenance: number
  activeTrips: number
  pendingTrips: number
  driversOnDuty: number
  totalDrivers: number
  fleetUtilization: number
  fleetByStatus: { name: string; value: number }[]
}

export interface VehicleReport {
  vehicleId: string
  registrationNumber: string
  name: string
  type: string
  status: VehicleStatus
  completedTrips: number
  totalDistance: number
  totalFuelLiters: number
  fuelEfficiency: number
  totalFuelCost: number
  totalMaintenanceCost: number
  totalOtherExpenses: number
  operationalCost: number
  totalRevenue: number
  roi: number
}

export interface LicenseAlert {
  driverId: string
  name: string
  licenseNumber: string
  licenseExpiry: string
  daysRemaining: number
  expired: boolean
}

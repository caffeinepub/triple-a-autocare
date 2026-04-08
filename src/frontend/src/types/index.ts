import type { Principal } from "@icp-sdk/core/principal";

// ---------------------------------------------------------------------------
// Domain types — mirror the Motoko backend V5 types
// ---------------------------------------------------------------------------

export interface Mechanic {
  id: string;
  name: string;
  rating: number;
  distanceKm: number;
  specialty: string;
  isAvailable: boolean;
}

export interface Review {
  id: string;
  mechanicId: string;
  userId: Principal;
  rating: bigint;
  text: string;
  timestamp: bigint;
}

export interface Booking {
  id: string;
  userId: Principal;
  mechanicId: string;
  serviceType: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  notes: string | null;
  createdAt: bigint;
}

export interface Part {
  id: string;
  name: string;
  category: string;
  priceNGN: bigint;
  sellerName: string;
  isVerifiedSeller: boolean;
  description: string;
  inStock: boolean;
}

/**
 * UserProfile V5 — includes verificationStatus.
 * Candid optional fields are encoded as [] (None) or ["value"] (Some).
 * In practice the backend wrapper deserializes them to null | value,
 * so we type them as T | null | undefined here.
 */
export interface UserProfile {
  userId: Principal;
  name: string;
  location: string;
  phone: string;
  latitude?: number | null;
  longitude?: number | null;
  address?: string | null;
  profileImage?: string | null;
  role?: string | null;
  yearsOfExperience?: bigint | null;
  specialties?: string | null;
  totalRatings: bigint;
  ratingsSum: bigint;
  /** "pending" | "approved" | "rejected" — required by the backend Candid type. */
  verificationStatus?: string | null;
}

export interface ServiceRequest {
  id: string;
  customerId: Principal;
  customerName: string;
  location: string;
  issueDescription: string;
  serviceType: string;
  status: string;
  mechanicId: Principal | null;
  mechanicName: string | null;
  price: bigint | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  customerRating: bigint | null;
  mechanicRating: bigint | null;
  createdAt: bigint;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: Principal;
  senderRole: string;
  message: string;
  isRead: boolean;
  createdAt: bigint;
}

// Candid variant type aliases
export type Variant_cancelled_pending_completed_confirmed =
  | { pending: null }
  | { confirmed: null }
  | { completed: null }
  | { cancelled: null };

export type Variant_on_the_way_arrived_completed_accepted =
  | { accepted: null }
  | { on_the_way: null }
  | { arrived: null }
  | { completed: null };

// ---------------------------------------------------------------------------
// Backend actor interface — all methods available on the canister actor.
// These mirror the public methods in main.mo and are used to type the actor.
// ---------------------------------------------------------------------------

export interface BackendActor {
  // Profile
  saveCallerUserProfile(profile: UserProfile): Promise<void>;
  getCallerUserProfile(): Promise<UserProfile | null>;
  getUserProfile(userId: Principal): Promise<UserProfile | null>;
  getMechanicPublicProfile(mechanicId: Principal): Promise<UserProfile | null>;
  updateUserProfile(
    name: string | null,
    profileImage: string | null,
    yearsOfExperience: bigint | null,
    specialties: string | null,
  ): Promise<UserProfile>;

  // Roles
  saveCallerUserAppRole(role: string): Promise<void>;
  getCallerUserAppRole(): Promise<string>;

  // Admin
  isCallerAdmin(): Promise<boolean>;
  getAllMechanics(): Promise<UserProfile[]>;
  updateMechanicVerificationStatus(
    mechanicId: Principal,
    status: string,
  ): Promise<void>;

  // Mechanics
  getMechanic(id: string): Promise<Mechanic>;
  getAvailableMechanics(): Promise<Mechanic[]>;

  // Reviews
  addReview(mechanicId: string, rating: bigint, text: string): Promise<void>;
  getReviews(mechanicId: string): Promise<Review[]>;

  // Parts
  getPart(id: string): Promise<Part>;
  getAllParts(): Promise<Part[]>;

  // Bookings
  createBooking(
    mechanicId: string,
    serviceType: string,
    scheduledDate: string,
    scheduledTime: string,
    notes: string | null,
  ): Promise<string>;
  updateBookingStatus(
    bookingId: string,
    status: Variant_cancelled_pending_completed_confirmed,
  ): Promise<void>;
  getBooking(bookingId: string): Promise<Booking>;
  getUserBookings(): Promise<Booking[]>;

  // Service Requests
  createServiceRequest(
    customerName: string,
    location: string,
    issueDescription: string,
    serviceType: string,
    latitude: number | null,
    longitude: number | null,
    address: string | null,
  ): Promise<string>;
  getSearchingRequests(): Promise<ServiceRequest[]>;
  acceptServiceRequest(requestId: string, mechanicName: string): Promise<void>;
  updateServiceRequestStatus(
    requestId: string,
    newStatus: Variant_on_the_way_arrived_completed_accepted,
  ): Promise<void>;
  submitServicePrice(requestId: string, price: bigint): Promise<void>;
  customerRespondToPrice(requestId: string, accept: boolean): Promise<void>;
  completeJob(requestId: string): Promise<void>;
  cancelServiceRequest(
    requestId: string,
    cancelledBy: string,
    reason: string | null,
  ): Promise<void>;
  getCustomerActiveRequest(): Promise<ServiceRequest | null>;
  getMechanicActiveJob(): Promise<ServiceRequest | null>;
  getCustomerCompletedRequests(): Promise<ServiceRequest[]>;
  getMechanicCompletedJobs(): Promise<ServiceRequest[]>;
  getServiceRequests(): Promise<ServiceRequest[]>;
  updateServiceRequest(
    requestId: string,
    price: bigint,
    newStatus: { price_sent: null },
  ): Promise<void>;

  // Chat
  sendMessage(requestId: string, message: string): Promise<void>;
  getMessages(requestId: string): Promise<ChatMessage[]>;
  markMessagesRead(requestId: string): Promise<void>;

  // Ratings
  submitRating(
    requestId: string,
    rating: bigint,
    raterRole: string,
  ): Promise<void>;

  // Seed
  seedData(): Promise<void>;
}

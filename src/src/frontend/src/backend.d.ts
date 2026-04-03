import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ServiceRequest {
    id: string;
    customerName: string;
    status: Variant_on_the_way_arrived_completed_accepted_searching;
    serviceType: string;
    issueDescription: string;
    createdAt: Time;
    mechanicId?: Principal;
    mechanicName?: string;
    customerId: Principal;
    location: string;
    price?: bigint;
    cancelledBy?: string;
    cancelReason?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    customerRating?: bigint;
    mechanicRating?: bigint;
}
export interface Part {
    id: string;
    inStock: boolean;
    isVerifiedSeller: boolean;
    name: string;
    description: string;
    sellerName: string;
    category: string;
    priceNGN: bigint;
}
export type Time = bigint;
export interface Booking {
    id: string;
    status: Variant_cancelled_pending_completed_confirmed;
    serviceType: string;
    scheduledDate: string;
    scheduledTime: string;
    userId: Principal;
    createdAt: Time;
    mechanicId: string;
    notes?: string;
}
export interface Mechanic {
    id: string;
    name: string;
    isAvailable: boolean;
    specialty: string;
    distanceKm: number;
    rating: number;
}
export interface UserProfile {
    userId: Principal;
    name: string;
    phone: string;
    location: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    profileImage?: string;
    role?: string;
    yearsOfExperience?: bigint;
    specialties?: string;
    totalRatings: bigint;
    ratingsSum: bigint;
    verificationStatus?: string;
}
export interface Review {
    id: string;
    userId: Principal;
    text: string;
    mechanicId: string;
    timestamp: Time;
    rating: bigint;
}
export interface ChatMessage {
    id: string;
    requestId: string;
    senderId: Principal;
    senderRole: string;
    message: string;
    isRead: boolean;
    createdAt: Time;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_cancelled_pending_completed_confirmed {
    cancelled = "cancelled",
    pending = "pending",
    completed = "completed",
    confirmed = "confirmed"
}
export enum Variant_on_the_way_arrived_completed_accepted {
    on_the_way = "on_the_way",
    arrived = "arrived",
    completed = "completed",
    accepted = "accepted"
}
export enum Variant_on_the_way_arrived_completed_accepted_searching {
    on_the_way = "on_the_way",
    arrived = "arrived",
    completed = "completed",
    accepted = "accepted",
    searching = "searching",
    price_sent = "price_sent",
    approved = "approved",
    cancelled = "cancelled"
}
export interface backendInterface {
    acceptServiceRequest(requestId: string, mechanicName: string): Promise<void>;
    addReview(mechanicId: string, rating: bigint, text: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    cancelServiceRequest(requestId: string, cancelledBy: string, reason: string | null): Promise<void>;
    completeJob(requestId: string): Promise<void>;
    createBooking(mechanicId: string, serviceType: string, scheduledDate: string, scheduledTime: string, notes: string | null): Promise<string>;
    createServiceRequest(customerName: string, location: string, issueDescription: string, serviceType: string, latitude: number | null, longitude: number | null, address: string | null): Promise<string>;
    customerRespondToPrice(requestId: string, accept: boolean): Promise<void>;
    getAllParts(): Promise<Array<Part>>;
    getAvailableMechanics(): Promise<Array<Mechanic>>;
    getBooking(bookingId: string): Promise<Booking>;
    getCallerUserAppRole(): Promise<string>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCustomerActiveRequest(): Promise<ServiceRequest | null>;
    getCustomerCompletedRequests(): Promise<Array<ServiceRequest>>;
    getMechanic(id: string): Promise<Mechanic>;
    getMechanicActiveJob(): Promise<ServiceRequest | null>;
    getMechanicCompletedJobs(): Promise<Array<ServiceRequest>>;
    getMechanicPublicProfile(mechanicId: Principal): Promise<UserProfile | null>;
    getMessages(requestId: string): Promise<Array<ChatMessage>>;
    getPart(id: string): Promise<Part>;
    getReviews(mechanicId: string): Promise<Array<Review>>;
    getSearchingRequests(): Promise<Array<ServiceRequest>>;
    getServiceRequests(): Promise<Array<ServiceRequest>>;
    getUserBookings(): Promise<Array<Booking>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserAppRole(role: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedData(): Promise<void>;
    markMessagesRead(requestId: string): Promise<void>;
    sendMessage(requestId: string, message: string): Promise<void>;
    submitServicePrice(requestId: string, price: bigint): Promise<void>;
    updateBookingStatus(bookingId: string, newStatus: Variant_cancelled_pending_completed_confirmed): Promise<void>;
    submitRating(requestId: string, rating: bigint, raterRole: string): Promise<void>;
    updateServiceRequest(requestId: string, price: bigint, status: "price_sent"): Promise<void>;
    updateServiceRequestStatus(requestId: string, newStatus: Variant_on_the_way_arrived_completed_accepted): Promise<void>;
    updateUserProfile(name: string | null, profileImage: string | null, yearsOfExperience: bigint | null, specialties: string | null): Promise<UserProfile>;
    getAllMechanics(): Promise<Array<UserProfile>>;
    updateMechanicVerificationStatus(mechanicId: Principal, status: string): Promise<void>;
}

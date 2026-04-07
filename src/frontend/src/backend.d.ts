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
    status: Variant_on_the_way_cancelled_arrived_completed_approved_accepted_searching_price_sent;
    latitude?: number;
    serviceType: string;
    issueDescription: string;
    mechanicRating?: bigint;
    createdAt: Time;
    customerRating?: bigint;
    cancelledBy?: string;
    mechanicId?: Principal;
    longitude?: number;
    address?: string;
    mechanicName?: string;
    customerId: Principal;
    cancelReason?: string;
    price?: bigint;
    location: string;
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
export interface ChatMessage {
    id: string;
    requestId: string;
    createdAt: Time;
    isRead: boolean;
    message: string;
    senderRole: string;
    senderId: Principal;
}
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
    totalRatings: bigint;
    latitude?: number;
    yearsOfExperience?: bigint;
    ratingsSum: bigint;
    userId: Principal;
    profileImage?: string;
    name: string;
    role?: string;
    longitude?: number;
    address?: string;
    specialties?: string;
    phone: string;
    location: string;
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
export enum Variant_on_the_way_cancelled_arrived_completed_approved_accepted_searching_price_sent {
    on_the_way = "on_the_way",
    cancelled = "cancelled",
    arrived = "arrived",
    completed = "completed",
    approved = "approved",
    accepted = "accepted",
    searching = "searching",
    price_sent = "price_sent"
}
export enum Variant_price_sent {
    price_sent = "price_sent"
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
    getAllMechanics(): Promise<Array<UserProfile>>;
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
    markMessagesRead(requestId: string): Promise<void>;
    saveCallerUserAppRole(role: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    seedData(): Promise<void>;
    sendMessage(requestId: string, message: string): Promise<void>;
    submitRating(requestId: string, rating: bigint, raterRole: string): Promise<void>;
    submitServicePrice(requestId: string, price: bigint): Promise<void>;
    updateBookingStatus(bookingId: string, newStatus: Variant_cancelled_pending_completed_confirmed): Promise<void>;
    updateMechanicVerificationStatus(mechanicId: Principal, status: string): Promise<void>;
    updateServiceRequest(requestId: string, price: bigint, newStatus: Variant_price_sent): Promise<void>;
    updateServiceRequestStatus(requestId: string, newStatus: Variant_on_the_way_arrived_completed_accepted): Promise<void>;
    updateUserProfile(name: string | null, profileImage: string | null, yearsOfExperience: bigint | null, specialties: string | null): Promise<UserProfile>;
}

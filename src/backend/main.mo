import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Float "mo:core/Float";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Int "mo:core/Int";
import Nat "mo:core/Nat";



actor {
  type Mechanic = {
    id : Text;
    name : Text;
    rating : Float;
    distanceKm : Float;
    specialty : Text;
    isAvailable : Bool;
  };

  type Review = {
    id : Text;
    mechanicId : Text;
    userId : Principal;
    rating : Nat;
    text : Text;
    timestamp : Time.Time;
  };

  type Booking = {
    id : Text;
    userId : Principal;
    mechanicId : Text;
    serviceType : Text;
    scheduledDate : Text;
    scheduledTime : Text;
    status : {
      #pending;
      #confirmed;
      #completed;
      #cancelled;
    };
    notes : ?Text;
    createdAt : Time.Time;
  };

  type Part = {
    id : Text;
    name : Text;
    category : Text;
    priceNGN : Nat;
    sellerName : Text;
    isVerifiedSeller : Bool;
    description : Text;
    inStock : Bool;
  };

  public type UserProfile = {
    userId : Principal;
    name : Text;
    location : Text;
    phone : Text;
  };

  // V1 — original deployed type
  type ServiceRequestV1 = {
    id : Text;
    customerId : Principal;
    customerName : Text;
    location : Text;
    issueDescription : Text;
    serviceType : Text;
    status : {
      #searching;
      #accepted;
      #on_the_way;
      #arrived;
      #completed;
    };
    mechanicId : ?Principal;
    mechanicName : ?Text;
    createdAt : Time.Time;
  };

  // V2 — deployed type without cancelledBy/cancelReason
  type ServiceRequestV2 = {
    id : Text;
    customerId : Principal;
    customerName : Text;
    location : Text;
    issueDescription : Text;
    serviceType : Text;
    status : {
      #searching;
      #accepted;
      #on_the_way;
      #arrived;
      #price_sent;
      #approved;
      #cancelled;
      #completed;
    };
    mechanicId : ?Principal;
    mechanicName : ?Text;
    price : ?Nat;
    createdAt : Time.Time;
  };

  // V3 — current type with cancellation metadata
  type ServiceRequest = {
    id : Text;
    customerId : Principal;
    customerName : Text;
    location : Text;
    issueDescription : Text;
    serviceType : Text;
    status : {
      #searching;
      #accepted;
      #on_the_way;
      #arrived;
      #price_sent;
      #approved;
      #cancelled;
      #completed;
    };
    mechanicId : ?Principal;
    mechanicName : ?Text;
    price : ?Nat;
    cancelledBy : ?Text;
    cancelReason : ?Text;
    createdAt : Time.Time;
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let mechanics = Map.empty<Text, Mechanic>();
  let reviews = Map.empty<Text, Review>();
  let parts = Map.empty<Text, Part>();
  let bookings = Map.empty<Text, Booking>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let userRoles = Map.empty<Principal, Text>();

  // V1 stable storage — kept for migration only
  let serviceRequests = Map.empty<Text, ServiceRequestV1>();

  // V2 stable storage — previously deployed, kept for migration
  let serviceRequestsV2 = Map.empty<Text, ServiceRequestV2>();

  // V3 stable storage — current version with cancellation fields
  let serviceRequestsV3 = Map.empty<Text, ServiceRequest>();

  // Migrate V1 → V3 and V2 → V3 on upgrade
  system func postupgrade() {
    // Migrate from V1
    for (req in serviceRequests.values()) {
      if (serviceRequestsV3.get(req.id) == null) {
        let migrated : ServiceRequest = {
          id = req.id;
          customerId = req.customerId;
          customerName = req.customerName;
          location = req.location;
          issueDescription = req.issueDescription;
          serviceType = req.serviceType;
          status = switch (req.status) {
            case (#searching) { #searching };
            case (#accepted) { #accepted };
            case (#on_the_way) { #on_the_way };
            case (#arrived) { #arrived };
            case (#completed) { #completed };
          };
          mechanicId = req.mechanicId;
          mechanicName = req.mechanicName;
          price = null;
          cancelledBy = null;
          cancelReason = null;
          createdAt = req.createdAt;
        };
        serviceRequestsV3.add(req.id, migrated);
      };
    };

    // Migrate from V2
    for (req in serviceRequestsV2.values()) {
      if (serviceRequestsV3.get(req.id) == null) {
        let migrated : ServiceRequest = {
          id = req.id;
          customerId = req.customerId;
          customerName = req.customerName;
          location = req.location;
          issueDescription = req.issueDescription;
          serviceType = req.serviceType;
          status = req.status;
          mechanicId = req.mechanicId;
          mechanicName = req.mechanicName;
          price = req.price;
          cancelledBy = null;
          cancelReason = null;
          createdAt = req.createdAt;
        };
        serviceRequestsV3.add(req.id, migrated);
      };
    };
  };

  func getMechanicInternal(id : Text) : Mechanic {
    switch (mechanics.get(id)) {
      case (null) { Runtime.trap("Mechanic not found") };
      case (?mechanic) { mechanic };
    };
  };

  public query ({ caller }) func getMechanic(id : Text) : async Mechanic {
    getMechanicInternal(id);
  };

  public shared ({ caller }) func addReview(mechanicId : Text, rating : Nat, text : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Only users can add reviews");
    };
    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };

    let timestamp = Time.now();
    let review : Review = {
      id = mechanicId # Int.abs(timestamp).toText();
      mechanicId;
      userId = caller;
      rating;
      text;
      timestamp;
    };

    reviews.add(review.id, review);
  };

  public query ({ caller }) func getReviews(mechanicId : Text) : async [Review] {
    let mechanicReviews = reviews.values().filter(
      func(r) { Text.equal(r.mechanicId, mechanicId) }
    );
    let reviewsArray = mechanicReviews.toArray();
    reviewsArray.sort(
      func(a : Review, b : Review) : { #less; #equal; #greater } {
        Int.compare(b.timestamp, a.timestamp)
      }
    );
  };

  public query ({ caller }) func getAvailableMechanics() : async [Mechanic] {
    let availableMechanics = mechanics.values().filter(
      func(m) { m.isAvailable }
    );
    let mechanicsArray = availableMechanics.toArray();
    mechanicsArray.sort(
      func(a : Mechanic, b : Mechanic) : { #less; #equal; #greater } {
        Float.compare(a.distanceKm, b.distanceKm)
      }
    );
  };

  func getPartInternal(id : Text) : Part {
    switch (parts.get(id)) {
      case (null) { Runtime.trap("Part not found") };
      case (?part) { part };
    };
  };

  public query ({ caller }) func getPart(id : Text) : async Part {
    getPartInternal(id);
  };

  public query ({ caller }) func getAllParts() : async [Part] {
    parts.values().toArray();
  };

  public shared ({ caller }) func createBooking(mechanicId : Text, serviceType : Text, scheduledDate : Text, scheduledTime : Text, notes : ?Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Only users can create bookings");
    };

    let timestamp = Time.now();
    let bookingId = mechanicId # Int.abs(timestamp).toText();
    let booking : Booking = {
      id = bookingId;
      userId = caller;
      mechanicId;
      serviceType;
      scheduledDate;
      scheduledTime;
      status = #pending;
      notes;
      createdAt = timestamp;
    };

    bookings.add(bookingId, booking);
    bookingId;
  };

  public shared ({ caller }) func updateBookingStatus(bookingId : Text, newStatus : { #pending; #confirmed; #completed; #cancelled }) : async () {
    let booking = switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?b) { b };
    };

    if (booking.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only the owner can update booking status");
    };

    let updatedBooking = { booking with status = newStatus };
    bookings.add(bookingId, updatedBooking);
  };

  public query ({ caller }) func getBooking(bookingId : Text) : async Booking {
    switch (bookings.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?booking) {
        if (booking.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Only owner or admin can view booking");
        };
        booking;
      };
    };
  };

  public query ({ caller }) func getUserBookings() : async [Booking] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view their bookings");
    };
    let userBookings = bookings.values().filter(
      func(b) { b.userId == caller }
    );
    userBookings.toArray();
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    let updatedProfile : UserProfile = {
      profile with
      userId = caller;
    };
    userProfiles.add(caller, updatedProfile);
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserAppRole(role : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can save roles");
    };
    userRoles.add(caller, role);
  };

  public query ({ caller }) func getCallerUserAppRole() : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get roles");
    };
    switch (userRoles.get(caller)) {
      case (null) { "" };
      case (?role) { role };
    };
  };

  public shared ({ caller }) func seedData() : async () {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized");
    };

    let sampleMechanics = [
      {
        id = "mechanic1";
        name = "Lagos Auto Tech";
        rating = 4.8;
        distanceKm = 3.2;
        specialty = "Engine Specialist";
        isAvailable = true;
      },
      {
        id = "mechanic2";
        name = "Abuja Mobile Mechanic";
        rating = 4.5;
        distanceKm = 7.9;
        specialty = "Transmission Expert";
        isAvailable = false;
      },
      {
        id = "mechanic3";
        name = "Port Harcourt Mechanics";
        rating = 4.2;
        distanceKm = 2.5;
        specialty = "Electrical Diagnostics";
        isAvailable = true;
      },
      {
        id = "mechanic4";
        name = "Kano Car Care";
        rating = 3.9;
        distanceKm = 12.1;
        specialty = "General Repairs";
        isAvailable = true;
      },
      {
        id = "mechanic5";
        name = "Ibadan Auto Center";
        rating = 4.6;
        distanceKm = 4.3;
        specialty = "Brake Specialist";
        isAvailable = false;
      },
    ];

    for (mechanic in sampleMechanics.values()) {
      mechanics.add(mechanic.id, mechanic);
    };

    let sampleParts = [
      {
        id = "part1";
        name = "Premium Engine Oil";
        category = "Fluids";
        priceNGN = 8000;
        sellerName = "AutoZone Nigeria";
        isVerifiedSeller = true;
        description = "High quality synthetic engine oil for optimal performance";
        inStock = true;
      },
      {
        id = "part2";
        name = "Brake Pad Set";
        category = "Brakes";
        priceNGN = 12000;
        sellerName = "Lagos Auto Parts";
        isVerifiedSeller = true;
        description = "Complete set of durable ceramic brake pads for sedans";
        inStock = false;
      },
      {
        id = "part3";
        name = "Car Battery 12V";
        category = "Electrical";
        priceNGN = 40000;
        sellerName = "BatteryWorld Nigeria";
        isVerifiedSeller = true;
        description = "Long lasting 12V automotive battery with high cranking amperage";
        inStock = true;
      },
      {
        id = "part4";
        name = "Air Filter Element";
        category = "Engine";
        priceNGN = 5500;
        sellerName = "Ibadan Auto Supply";
        isVerifiedSeller = false;
        description = "Low restriction air filter for better airflow and engine protection";
        inStock = true;
      },
      {
        id = "part5";
        name = "Spark Plug Set";
        category = "Ignition System";
        priceNGN = 10000;
        sellerName = "AutoTech Nigeria";
        isVerifiedSeller = true;
        description = "High performance iridium spark plug set for smooth ignition";
        inStock = true;
      },
      {
        id = "part6";
        name = "Wiper Blades Pair";
        category = "Body Parts";
        priceNGN = 2500;
        sellerName = "Car Accessories NG";
        isVerifiedSeller = false;
        description = "Durable all-weather wiper blade set for sedans and SUVs";
        inStock = false;
      },
      {
        id = "part7";
        name = "Radiator Coolant";
        category = "Engine Cooling";
        priceNGN = 7000;
        sellerName = "Port Harcourt Auto Parts";
        isVerifiedSeller = true;
        description = "Ethylene glycol-based long life radiator coolant";
        inStock = true;
      },
      {
        id = "part8";
        name = "All-Season Tyres (1 unit)";
        category = "Tyres";
        priceNGN = 35000;
        sellerName = "Tyre Shop Nigeria";
        isVerifiedSeller = true;
        description = "Premium all-season radial tyre with durable tread pattern";
        inStock = true;
      },
    ];

    for (part in sampleParts.values()) {
      parts.add(part.id, part);
    };
  };

  public shared ({ caller }) func createServiceRequest(customerName : Text, location : Text, issueDescription : Text, serviceType : Text) : async Text {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can create service requests");
    };

    // Enforce single active booking per customer
    let customerActiveCount = serviceRequestsV3.values().filter(
      func(r) {
        r.customerId == caller and
        (r.status == #searching or r.status == #accepted or r.status == #on_the_way
         or r.status == #arrived or r.status == #price_sent or r.status == #approved)
      }
    ).toArray().size();
    if (customerActiveCount > 0) {
      Runtime.trap("You already have an ongoing service. Complete it before booking another.");
    };

    let timestamp = Time.now();
    let requestId = Int.abs(timestamp).toText();

    let request : ServiceRequest = {
      id = requestId;
      customerId = caller;
      customerName;
      location;
      issueDescription;
      serviceType;
      status = #searching;
      mechanicId = null;
      mechanicName = null;
      price = null;
      cancelledBy = null;
      cancelReason = null;
      createdAt = timestamp;
    };

    serviceRequestsV3.add(requestId, request);
    requestId;
  };

  public query ({ caller }) func getSearchingRequests() : async [ServiceRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can view searching requests");
    };

    let searchingRequests = serviceRequestsV3.values().filter(
      func(r) { r.status == #searching }
    );
    let requestsArray = searchingRequests.toArray();
    requestsArray.sort(
      func(a : ServiceRequest, b : ServiceRequest) : { #less; #equal; #greater } {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
  };

  public shared ({ caller }) func acceptServiceRequest(requestId : Text, mechanicName : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can accept service requests");
    };

    // Enforce single active job per mechanic
    let mechanicActiveCount = serviceRequestsV3.values().filter(
      func(r) {
        r.mechanicId == ?caller and
        (r.status == #searching or r.status == #accepted or r.status == #on_the_way
         or r.status == #arrived or r.status == #price_sent or r.status == #approved)
      }
    ).toArray().size();
    if (mechanicActiveCount > 0) {
      Runtime.trap("You already have an active job. Complete it before accepting another.");
    };

    let request = switch (serviceRequestsV3.get(requestId)) {
      case (null) { Runtime.trap("Service request not found") };
      case (?r) { r };
    };

    let shouldAccept = switch (request.status) {
      case (#searching) { true };
      case (_) { false };
    };
    if (not shouldAccept) { Runtime.trap("Service request already accepted by another mechanic") };

    let updatedRequest = {
      request with
      status = #accepted;
      mechanicId = ?caller;
      mechanicName = ?mechanicName;
    };
    serviceRequestsV3.add(requestId, updatedRequest);
  };

  public shared ({ caller }) func updateServiceRequestStatus(requestId : Text, newStatus : { #accepted; #on_the_way; #arrived; #completed }) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can update service request status");
    };

    let request = switch (serviceRequestsV3.get(requestId)) {
      case (null) { Runtime.trap("Service request not found") };
      case (?r) { r };
    };

    if (request.mechanicId != ?caller) {
      Runtime.trap("Unauthorized: Only the assigned mechanic can update service request status");
    };

    let updatedRequest = { request with status = newStatus };
    serviceRequestsV3.add(requestId, updatedRequest);
  };

  public shared ({ caller }) func submitServicePrice(requestId : Text, price : Nat) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let request = switch (serviceRequestsV3.get(requestId)) {
      case (null) { Runtime.trap("Service request not found") };
      case (?r) { r };
    };

    if (request.mechanicId != ?caller) {
      Runtime.trap("Unauthorized: Only the assigned mechanic can submit price");
    };

    if (request.status != #arrived) {
      Runtime.trap("Can only submit price when status is arrived");
    };

    let updatedRequest = { request with status = #price_sent; price = ?price };
    serviceRequestsV3.add(requestId, updatedRequest);
  };

  public shared ({ caller }) func customerRespondToPrice(requestId : Text, accept : Bool) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let request = switch (serviceRequestsV3.get(requestId)) {
      case (null) { Runtime.trap("Service request not found") };
      case (?r) { r };
    };

    if (request.customerId != caller) {
      Runtime.trap("Unauthorized: Only the customer can respond to price");
    };

    if (request.status != #price_sent) {
      Runtime.trap("No pending price to respond to");
    };

    let newStatus = if (accept) { #approved } else { #cancelled };
    let cancelledBy : ?Text = if (accept) { null } else { ?"customer" };
    let updatedRequest = { request with status = newStatus; cancelledBy };
    serviceRequestsV3.add(requestId, updatedRequest);
  };

  public shared ({ caller }) func completeJob(requestId : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let request = switch (serviceRequestsV3.get(requestId)) {
      case (null) { Runtime.trap("Service request not found") };
      case (?r) { r };
    };

    if (request.mechanicId != ?caller) {
      Runtime.trap("Unauthorized: Only the assigned mechanic can complete the job");
    };

    if (request.status != #approved) {
      Runtime.trap("Job must be approved before completion");
    };

    let updatedRequest = { request with status = #completed };
    serviceRequestsV3.add(requestId, updatedRequest);
  };

  // Cancel a service request — callable by either customer or assigned mechanic
  public shared ({ caller }) func cancelServiceRequest(requestId : Text, cancelledBy : Text, reason : ?Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let request = switch (serviceRequestsV3.get(requestId)) {
      case (null) { Runtime.trap("Service request not found") };
      case (?r) { r };
    };

    let isCustomer = request.customerId == caller;
    let isMechanic = request.mechanicId == ?caller;
    if (not isCustomer and not isMechanic) {
      Runtime.trap("Unauthorized: Not a participant in this service request");
    };

    let canCancel = switch (request.status) {
      case (#searching or #accepted or #on_the_way or #arrived or #price_sent or #approved) { true };
      case (_) { false };
    };
    if (not canCancel) {
      Runtime.trap("Cannot cancel a completed or already cancelled request");
    };

    let updatedRequest = {
      request with
      status = #cancelled;
      cancelledBy = ?cancelledBy;
      cancelReason = reason;
    };
    serviceRequestsV3.add(requestId, updatedRequest);
  };

  public query ({ caller }) func getCustomerActiveRequest() : async ?ServiceRequest {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get active requests");
    };

    let activeRequestsOnly = serviceRequestsV3.values().filter(
      func(r) {
        r.customerId == caller and
        r.status != #completed and r.status != #cancelled
      }
    );
    let activeRequests = activeRequestsOnly.toArray();
    let sorted = activeRequests.sort(
      func(a : ServiceRequest, b : ServiceRequest) : { #less; #equal; #greater } {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
    if (sorted.size() == 0) { return null };
    ?sorted[0];
  };

  public query ({ caller }) func getMechanicActiveJob() : async ?ServiceRequest {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized: Only users can get active jobs");
    };

    let activeRequestsOnly = serviceRequestsV3.values().filter(
      func(r) {
        r.mechanicId == ?caller and
        (r.status == #accepted or r.status == #on_the_way or r.status == #arrived
         or r.status == #price_sent or r.status == #approved)
      }
    );
    let activeRequests = activeRequestsOnly.toArray();
    let sorted = activeRequests.sort(
      func(a : ServiceRequest, b : ServiceRequest) : { #less; #equal; #greater } {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
    if (sorted.size() == 0) { return null };
    ?sorted[0];
  };

  public query ({ caller }) func getCustomerCompletedRequests() : async [ServiceRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let completed = serviceRequestsV3.values().filter(
      func(r) { r.customerId == caller and (r.status == #completed or r.status == #cancelled) }
    );
    let arr = completed.toArray();
    arr.sort(
      func(a : ServiceRequest, b : ServiceRequest) : { #less; #equal; #greater } {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
  };

  public query ({ caller }) func getMechanicCompletedJobs() : async [ServiceRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let completed = serviceRequestsV3.values().filter(
      func(r) { r.mechanicId == ?caller and (r.status == #completed or r.status == #cancelled) }
    );
    let arr = completed.toArray();
    arr.sort(
      func(a : ServiceRequest, b : ServiceRequest) : { #less; #equal; #greater } {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
  };

  // Returns all requests assigned to the calling mechanic (active, in-progress, or recently cancelled)
  public query ({ caller }) func getServiceRequests() : async [ServiceRequest] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let assigned = serviceRequestsV3.values().filter(
      func(r) {
        r.mechanicId == ?caller and
        (r.status == #accepted or r.status == #on_the_way or r.status == #arrived
         or r.status == #price_sent or r.status == #approved)
      }
    );
    let arr = assigned.toArray();
    arr.sort(
      func(a : ServiceRequest, b : ServiceRequest) : { #less; #equal; #greater } {
        Int.compare(b.createdAt, a.createdAt);
      }
    );
  };

  // Generic update: set price and status to price_sent for the assigned mechanic
  public shared ({ caller }) func updateServiceRequest(requestId : Text, price : Nat, newStatus : { #price_sent }) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let request = switch (serviceRequestsV3.get(requestId)) {
      case (null) { Runtime.trap("Service request not found") };
      case (?r) { r };
    };

    if (request.mechanicId != ?caller) {
      Runtime.trap("Unauthorized: Only the assigned mechanic can update this request");
    };

    let updatedRequest = switch (newStatus) {
      case (#price_sent) { { request with status = #price_sent; price = ?price } };
    };
    serviceRequestsV3.add(requestId, updatedRequest);
  };

  // -------------------------------------------------------------------------
  // Chat
  // -------------------------------------------------------------------------

  type ChatMessage = {
    id : Text;
    requestId : Text;
    senderId : Principal;
    senderRole : Text;
    message : Text;
    createdAt : Time.Time;
  };

  let chatMessages = Map.empty<Text, ChatMessage>();

  public shared ({ caller }) func sendMessage(requestId : Text, message : Text) : async () {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let request = switch (serviceRequestsV3.get(requestId)) {
      case (null) { Runtime.trap("Service request not found") };
      case (?r) { r };
    };

    let senderRole : Text = if (request.customerId == caller) {
      "customer"
    } else if (request.mechanicId == ?caller) {
      "mechanic"
    } else {
      Runtime.trap("Unauthorized: Not a participant in this service request")
    };

    let timestamp = Time.now();
    let msgId = requestId # Int.abs(timestamp).toText() # caller.toText();
    let msg : ChatMessage = {
      id = msgId;
      requestId;
      senderId = caller;
      senderRole;
      message;
      createdAt = timestamp;
    };
    chatMessages.add(msgId, msg);
  };

  public query ({ caller }) func getMessages(requestId : Text) : async [ChatMessage] {
    if (not AccessControl.hasPermission(accessControlState, caller, #user)) {
      Runtime.trap("Unauthorized");
    };

    let request = switch (serviceRequestsV3.get(requestId)) {
      case (null) { Runtime.trap("Service request not found") };
      case (?r) { r };
    };

    if (request.customerId != caller and request.mechanicId != ?caller) {
      Runtime.trap("Unauthorized: Not a participant in this service request");
    };

    let msgs = chatMessages.values().filter(
      func(m) { Text.equal(m.requestId, requestId) }
    );
    let arr = msgs.toArray();
    arr.sort(
      func(a : ChatMessage, b : ChatMessage) : { #less; #equal; #greater } {
        Int.compare(a.createdAt, b.createdAt)
      }
    );
  };
};

# **Project Phase 5: Service Booking Flow & Notifications**

## **Overall Goal: Redesign the service booking flow to cleanly separate retail product purchases from service requests, and implement a unified notification system for order updates.**

---

## **Phase 5.1 — Database Structure & Listing Types**

### **Objective: Separate retail products from service shops in the data model.**

---

### **Task 5.1.1 — Define Listing Types**

Create two distinct listing categories in the schema:

* **Product Listings:**
  For physical/digital goods purchased directly.

* **Service Shop Listings:**
  For businesses offering services (e.g., cybercafés, salons, repair shops).

---

### **Task 5.1.2 — Modify Shop/Operator Structure**

Update the models so that:

* Each **Service Shop** can have **multiple Operators**.
* Each **Operator** maintains their own **queue** of pending service requests.
* Queue lengths update **in real time**.

---

### **Task 5.1.3 — Unified Order System**

Create a single `Order` model that can handle:

* **Product Orders:**
  Product ID + quantity.

* **Service Requests:**
  Operator ID + script responses + service status.

Both should share core fields:

* `customer_id`
* `status`
* `created_at`
* `total_price`

---

## **Phase 5.2 — User Flow: Service Booking Path**

### **Objective: Implement the revised customer journey for booking services.**

---

### **Task 5.2.1 — Update Listings Display**

Modify main listings page to show:

* **Products:**
  “Add to Cart” / “Buy Now”
* **Service Shops:**
  “Book Service”

When opening a service shop:

* Show shop details
* List available operators
* Display each operator’s **current queue length**
* Allow the customer to **select an operator**

---

### **Task 5.2.2 — Implement Service Request Flow**

After selecting an operator:

1. Launch the **visual script flow** (Phase 4).
2. Customer completes the interactive questionnaire.
3. System creates a **Service Request** tied to:

   * The operator's queue
   * The selected shop
4. Redirect customer to **Orders Screen**, not back to listings.

---

### **Task 5.2.3 — Orders Screen Integration**

Update Orders screen with two sections:

* **Products Tab:**

  * Normal product purchases.

* **Services Tab:**

  * Service requests with:

    * Shop name
    * Assigned operator
    * Current status
    * Queue position

Provide unified status tracking for both.

---

## **Phase 5.3 — Operator Queue Management**

### **Objective: Build tools for operators to manage their service request queues.**

---

### **Task 5.3.1 — Operator Dashboard**

Operator dashboard should display:

* Total queue length
* Detailed list of service requests:

  * Customer info
  * Script-generated specifications
* Priority indicators (e.g., how long request has been waiting)

---

### **Task 5.3.2 — Status Update Interface**

Operators should be able to change request status:

**Status flow:**
`Pending` → `Accepted` → `In Progress` → `Completed` / `Cancelled`

Each status update should trigger a customer notification.

Operators can also attach optional **notes/comments**.

---

### **Task 5.3.3 — Real-Time Queue Updates**

Enable real-time updates for:

* Queue lengths on the customer-facing operator list
* Status changes inside the customer's Orders screen

Use:

* **WebSockets** (preferred)
  or
* **Polling** as a fallback

---

## **Phase 5.4 — Notification System**

### **Objective: Build a unified notification system for order updates.**

---

### **Task 5.4.1 — Notification Data Model**

Create a `Notification` schema with:

* `user_id`
* `order_id`
* `type` (`status_update`, `queue_update`, `completion`, etc.)
* `message`
* `read_status`
* `timestamp`

---

### **Task 5.4.2 — Notification Triggers**

Trigger notifications for:

* **Service Requests:**
  When the operator updates status.

* **Product Orders:**
  When seller updates order status.

* **General:**
  Order completions, cancellations, delays.

---

### **Task 5.4.3 — Notification Delivery**

Multiple delivery channels:

* **In-app notifications** (bell icon & dropdown)
* **Email notifications** (user-configurable)
* **SMS notifications** (optional)

Add **notification preferences** in user settings.

---

### **Task 5.4.4 — Notification Templates**

Create predefined messages:

* “Your service request with **[Operator Name]** has been accepted.”
* “Your order **#[ID]** status is now **[Status]**.”
* “You are next in queue for **[Service]** with **[Operator Name]**.”
* “Your **[Service/Product]** is ready for pickup.”

---

## **Phase 5.5 — User Interface Polish**

### **Objective: Ensure consistent UX across both product and service flows.**

---

### **Task 5.5.1 — Status Visualization**

Implement:

* Color-coded status badges
* Multi-step progress bars
* Estimated wait times for services in queue

---

### **Task 5.5.2 — Unified Orders Interface**

Ensure the Orders page:

* Can toggle between **Products** and **Services**
* Displays statuses consistently
* Provides similar actions (cancel, contact, reorder)

---

### **Task 5.5.3 — Notification Center**

Build a notification center where users can:

* View all notifications
* Mark as read/dismiss
* Filter by category (orders, services, system)
* Click to jump to the related order

---

## **Phase 5.6 — Testing & Refinement**

### **Objective: Validate the booking + notification ecosystems end to end.**

---

### **Task 5.6.1 — End-to-End Testing**

Test full flows:

1. Customer → Books service → Gets queued → Receives notifications
2. Customer → Orders product → Gets updates
3. Operator → Manages queue → Updates notify customer

---

### **Task 5.6.2 — Edge Cases**

Handle:

* Operator goes offline mid-queue
* Customer cancels while still waiting
* Multiple rapid status updates
* Stale/pending requests

---

### **Task 5.6.3 — Performance Optimization**

Ensure:

* Efficient queue length updates
* Optimized notification dispatch
* Pagination for large order/notification lists

---

If you want, I can also produce a **full backend API specification**, **MongoDB schemas**, **Express route structure**, or **React UI skeleton** for any feature in Phase 5.

Just say **“continue”**.

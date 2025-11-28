# System Overview: Category-Based E-Commerce Platform for SMEs in Kano State, Nigeria

## 1. System Purpose
This system is a **multi-category e-commerce platform** designed specifically for **Small and Medium Enterprises (SMEs)** in Kano State, Nigeria. It supports **both product-based businesses (retail)** and **service-based businesses (salons, repair shops, cafés, laundry, etc.)** within a unified online marketplace.

The platform is built using:
- **Backend**: Node.js + Express
- **Frontend**: EJS (Server-Side Rendering)
- **Database**: MongoDB

The system aims to:
- Digitize SMEs that previously operated offline.
- Provide category-based onboarding (retail, services, cafés).
- Allow customers to discover, browse, filter, order, and book services.
- Support SME owners with store management tools.
- Allow admins to manage the system ecosystem.

---

## 2. Actors (User Types)

### 1. **Consumer**
- Browses categories
- Views SMEs, products, and services
- Places orders (products)
- Books services (service SMEs)
- Manages profile & orders

### 2. **SME Owner**
- Registers and sets up a business profile
- Selects business category (Retail / Service / Café)
- Adds product or service listings
- Manages orders & bookings received
- Creates and assigns **Operators** for service-heavy SMEs
- Manages multiple shops (each can have different categories)

### 3. **Operator** (Optional role)
- Assigned by SME owner to specific shops
- Handles day-to-day operations
  - Processes orders
  - Manages service queue
  - Marks jobs as completed
- Cannot change business-level settings

### 4. **Administrator**
- Manages main business categories
- Manages users (consumers, SMEs, operators)
- Ensures platform integrity and resolves disputes

---

## 3. Business Categories Supported

The platform onboards SMEs under three primary categories:

### **1. Retail SMEs (Products)**
Examples: electronics, clothing, accessories.

Functionalities:
- Add product listings
- Manage stock
- Receive orders

### **2. Service SMEs**
Examples: salons, laundry, repairs, barbers.

Functionalities:
- Add service listings
- Manage bookings
- Queue system for operators
- Operator assignment per branch

### **3. Cafés and Food Vendors**
Functionalities:
- Add menu items
- Manage orders
- Accept or reject incoming orders

---

## 4. Core Modules

### **A. User Management**
- Registration (SME owner, consumer)
- Login / Logout
- Authentication
- Password reset
- Profile editing

### **B. SME Management**
- Business profile creation
- Category selection
- Shop creation (multi-shop support)
- Operator creation and assignment

### **C. Listings Management**
- Add/edit/delete products (retail)
- Add/edit/delete services (services)
- Add/edit/delete menus (cafés)

### **D. Order & Booking Module**
- Shopping cart
- Checkout (no online payment in prototype)
- Bookings for service SMEs
- Order status updates
- Real-time queue management for operators

### **E. Browsing & Discovery**
- Category filter
- Search engine
- Trending products
- Location-based discovery (optional geolocation)

### **F. Admin Dashboard**
- Manage categories
- Manage all users
- Approve or suspend SMEs
- Oversee system performance

---

## 5. Important Constraints
- No integrated payment gateway (prototype phase)
- Logistics/delivery not included
- Operators can manage ONLY the shop(s) they are assigned to
- SME owner can operate multiple businesses with one account
- Retail shops: max 1 operator per shop (optional)
- Service shops: multiple operators allowed

---

## 6. Data Model (Simplified)

### **User**
- name, email, phone
- role (consumer / SME owner / admin)
- passwordHash

### **SME**
- ownerId
- name, description, location
- categoryId (e.g., retail, service, café)
- type-specific configuration (product-based or service-based)

### **Shop**
- smeId
- category
- operators []
- listings []

### **Listing**
- shopId
- type (product/service/menu)
- name, price, description, image

### **Order / Booking**
- userId
- shopId
- listingId[]
- totalPrice
- status (new, accepted, rejected, completed)
- for services: assignedOperator

### **Category**
- name
- icon

---

## 7. High-Level User Flows

### **Consumer**
1. Open homepage  
2. Browse categories  
3. Select product/service  
4. Add to cart / book service  
5. Checkout  
6. View order tracking  

### **SME Owner**
1. Register  
2. Create business profile  
3. Create shop  
4. Add listings  
5. Receive orders  
6. Assign operators  
7. Manage business analytics  

### **Operator**
1. Login  
2. View assigned shop  
3. View queue/active orders  
4. Process orders/bookings  

### **Admin**
1. Login  
2. Manage categories  
3. Approve/suspend SMEs  
4. System audits  

---

## 8. System Philosophy
This platform solves a **documented gap in Nigerian e-commerce systems**, where:
- Retail SMEs dominate existing platforms,
- Service-based SMEs are ignored,
- No unified category-based onboarding exists,
- And the target population has low digital literacy → requiring SIMPLE UX.

The design is simple, accessible, and built to match the local realities of Kano’s SME ecosystem.

---
## 9. Operator System
Operator System – Technical Implementation Blueprint
Overview

The operator subsystem allows an SME Owner to onboard assistants (called Operators) to help manage specific business units. Operators are intended for SMEs that realistically have multiple employees or branches — such as barbershops, cafés, restaurants, repair shops, or any business where workflow is divided among workers.

The system introduces:

A new role: operator

A new Business structure: multiple business units per SME Owner

Access restrictions so operators can only manage the business they belong to

Workflows for:

Assigning operators

Managing operator queues (for service SMEs)

Handling daily operational tasks

This maintains authenticity with how SMEs operate in real life while keeping the system clean and manageable.

🧱 1. Data Models Required
A. User Model (Extended)

Operators are still “Users”—they just have special attributes.

{
  _id: ObjectId,
  name: String,
  email: String,
  password: String,
  phone: String,
  role: { type: String, enum: ['consumer', 'sme_owner', 'operator', 'admin'] },

  // Operator-specific fields
  operatorOf: {
    type: ObjectId,
    ref: 'Business',
    default: null
  }
}

Notes:

Operators must belong to exactly one business.

Operators cannot own businesses.

SME Owners can create multiple operators, but each operator is tied to only one business.

B. Business Model (Extended)
{
  _id: ObjectId,
  owner: { type: ObjectId, ref: 'User' },
  name: String,
  category: String,   // Retail or Service
  address: String,
  description: String,
  
  operators: [
    { type: ObjectId, ref: 'User' }
  ]
}

Notes:

operators[] stores the IDs of users assigned as operators.

This is essential for permissions.

🧭 2. Role Logic
SME Owner can:

✔ Create operators
✔ Assign operators to a business
✔ Remove operators
✔ View operator activity
✔ See order/task queues for all operators

Operator can:

✔ Login
✔ Access only their assigned business dashboard
✔ View tasks/orders assigned to their queue
✔ Update task status (e.g., “In Progress”, “Completed”)

Operator CANNOT:

✘ Edit business information
✘ Delete business
✘ Add or remove other operators
✘ Manage categories
✘ Access owner-level statistics

🚧 3. SME Owner → Create Operator Workflow
Route:

GET /sme/:businessId/operators/create
POST /sme/:businessId/operators/create

Flow:

SME Owner logs in.

Opens “Manage Operators” in their dashboard.

Clicks “Add Operator”.

Fills form:

name

phone

email

System creates a new User with:

role = operator

operatorOf = businessId

The operator is added to business.operators[].

🔐 4. Authentication & Authorization
Middleware for operators
function onlyOperator(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'operator') {
    return next();
  }
  return res.redirect('/unauthorized');
}

Middleware to ensure operator belongs to the business
function operatorBelongsToBusiness(req, res, next) {
  const businessId = req.params.businessId;

  if (req.user.operatorOf == businessId) {
    return next();
  }

  return res.status(403).send("Access denied");
}

Used for routes like:

/operator/business/:businessId/dashboard

/operator/business/:businessId/tasks

🗂 5. Operator Dashboard Structure

An operator dashboard includes:

1. Assigned Business Overview

Business name

Business category

Current date summary

2. Operator-Specific Queue

For service businesses:

Pending service tasks

In-progress tasks

Completed tasks

For retail businesses (optional):

Orders assigned to that operator (if the SME Owner chooses to delegate retail order handling)

3. Actions

Update task status

View task details

Mark service as completed

🔄 6. Order / Task Assignment Model
For Retail SMEs:

SME Owner → optionally assigns an operator to process orders

For Service SMEs:

Every service request becomes a Task:

{
  _id: ObjectId,
  business: ObjectId,
  operator: ObjectId,     // Assigned operator
  consumer: ObjectId,
  serviceName: String,
  status: { type: String, enum: ['Pending', 'In Progress', 'Completed'] },
  createdAt: Date,
  updatedAt: Date
}


Operators see only the tasks with:

operator: operator._id

SME Owners see all tasks for the business.

🧩 7. SME Owner → Assigning Operators to Service Tasks
Workflow:

Consumer books a service.

The system checks:

Are there operators under this business?

If yes → SME Owner dashboard shows:

“Assign task to operator” dropdown

If no → Task is “Unassigned” (but SME Owner can claim it).

🧰 8. Removing an Operator

Removing an operator requires:

SME Owner clicks "Remove Operator"

System:

sets user.role back to "consumer" OR

deactivates the user

removes user ID from business.operators[]

reassigns any pending tasks to the SME Owner

🔎 9. Permissions Summary Table
Action	Consumer	SME Owner	Operator	Admin
Register	✔	✔	✖ (auto-created)	✖
Create business	✖	✔	✖	✖
Add listings	✖	✔	✖	✖
Manage orders	✖	✔	✔ (restricted)	✖
Manage service tasks	✖	✔	✔ (only theirs)	✖
Add operator	✖	✔	✖	✖
Remove operator	✖	✔	✖	✖
Modify categories	✖	✖	✖	✔
Delete listings	✖	✔	✖	✔
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
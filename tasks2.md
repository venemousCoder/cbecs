# **Project Phase 6: Enhanced Search & Business Type Management**

**Overall Goal**
Fix the search functionality to correctly distinguish between retail and service businesses, while enforcing business-type constraints across the system.

---

## **Phase 6.1 — Business Type System & Data Structure**

### **Objective**

Define strict data models to differentiate retail and service SMEs.

---

### **Task 6.1.1 — Define Business Types in Database Schema**

Add a required `business_type` field to the Business/SME model:

* `"retail"` — sells products
* `"service"` — offers services via operators
* `"hybrid"` (optional) — sells products and offers services

Additional rules:

* Field must be set during business registration.
* Cannot be empty or undefined.

---

### **Task 6.1.2 — Update Product Listing Constraints**

Modify Product Listing model to enforce:

* Only `retail` and `hybrid` businesses may create product listings.
* Reject product creation for `"service"` businesses:

**Error message:**

> “Service businesses cannot list products. Please contact support to change your business type.”

---

### **Task 6.1.3 — Update Service Operator Constraints**

Ensure:

* Only `service` or `hybrid` businesses may:

  * Create operators
  * Build service scripts
  * Accept service requests

---

## **Phase 6.2 — Unified Search Index Architecture**

### **Objective: Create a unified search engine that handles both products and service businesses.**

---

### **Task 6.2.1 — Create Search Document Structure**

**Product Document**

```json
{
  "type": "product",
  "id": "prod_123",
  "business_id": "biz_456",
  "title": "Wireless Headphones",
  "description": "Noise-cancelling wireless headphones...",
  "category": "Electronics > Audio",
  "price": 199.99,
  "tags": ["bluetooth", "noise-cancelling"],
  "business_type": "retail"
}
```

**Service Business Document**

```json
{
  "type": "service_business",
  "id": "biz_789",
  "name": "Tech Repair Hub",
  "description": "Professional device repair services...",
  "services_offered": ["Phone Repair", "Laptop Repair", "Data Recovery"],
  "category": "Services > Electronics Repair",
  "operator_count": 5,
  "avg_wait_time": "15 minutes",
  "business_type": "service"
}
```

---

### **Task 6.2.2 — Implement Search Indexing Logic**

Indexing triggers:

* Product created/updated → index as product document
* Service business updated → index as service business document
* Service script updated → extract service keywords and update index

---

### **Task 6.2.3 — Extract Service Keywords From Scripts**

Automatically identify keywords from script options.

Example script options:

```
["Printing", "Scanning", "Binding"]
```

Store as:

```
services_offered: ["Printing", "Scanning", "Binding"]
```

Business owners may manually add/remove keywords.

---

## **Phase 6.3 — Search Results Display & Filtering**

### **Objective: Design a results interface that displays both product and service results clearly.**

---

### **Task 6.3.1 — Design Search Results UI Components**

**Product Card**

```
[Product Image]
PRODUCT
Wireless Headphones
$199.99
★★★★☆ (124 reviews)
Add to Cart
```

**Service Business Card**

```
[SERVICE BUSINESS]
Tech Repair Hub
📱 Phone Repair • 💻 Laptop Repair • 🔧 Data Recovery
5 operators available • Avg. wait: 15 min
Book Service →
```

---

### **Task 6.3.2 — Implement Search Filters & Tabs**

Filters/tabs:

* **All** (mixed results)
* **Products Only**
* **Services Only**
* **Business Type:** Retail / Service / Hybrid
* **Service Filters:**

  * “Available now”
  * “By service type”

---

### **Task 6.3.3 — Implement Search Ranking Logic**

Ranking rules:

* For products: text match, popularity, pricing, ratings
* For service businesses: text match, matching services, availability
* Mixed results interleaving to prevent one type from dominating

Sorting options:

* Relevance
* Price (products)
* Wait time (services)
* Rating

---

## **Phase 6.4 — Service Business Detail Page**

### **Objective: Optimize the page where users view service businesses and book operators.**

---

### **Task 6.4.1 — Design Service Business Landing Page**

Example layout:

```
Service Business Header:
┌─────────────────────────────────────┐
│ [Logo]  Tech Repair Hub             │
│ ★★★★☆ (4.2) • Open until 8 PM       │
│ 📍 123 Main St • 5 operators online │
└─────────────────────────────────────┘

Services Offered:
• Phone Screen Replacement (from $79)
• Laptop Battery Replacement (from $129)
• Data Recovery (from $199)

Choose an Operator:
┌─────────────────────────────────────┐
│ 👨‍💼 Alex Chen                        │
│ ★★★★☆ 4.5 • Queue: 2              │
│ Est. wait: 20 min                   │
│ [Select This Operator]              │
├─────────────────────────────────────┤
│ 👩‍💼 Maria Garcia                     │
│ ★★★★★ 4.8 • Queue: 0              │
│ Available now                       │
│ [Select This Operator]              │
└─────────────────────────────────────┘
```

---

### **Task 6.4.2 — Implement Operator Queue Display**

* Real-time queue length
* Estimated wait time formula:
  **avg_service_time × queue_length**
* Highlight operators with **0 queue** as *Available now*

---

### **Task 6.4.3 — Add Service Information Display**

Show:

* Services offered
* Price ranges
* Ratings & specialties

---

## **Phase 6.5 — Business Owner Admin Constraints**

### **Objective: Prevent service businesses from creating product listings.**

---

### **Task 6.5.1 — Modify Business Admin Dashboard**

For `service` businesses:

* Hide/disable “Add Product”
* Show message:

  > “Your business is registered as a Service provider. To list products, please update your business type.”

---

### **Task 6.5.2 — Backend API Validation**

```javascript
if (req.business.business_type === 'service') {
  return res.status(403).json({
    error: 'Service businesses cannot create product listings',
    action: 'Please contact support to change your business type'
  });
}
```

---

### **Task 6.5.3 — Business Type Management**

* Allow business owners to *request* a type change
* Require **admin approval**
* Migration rules:

  * retail → service: hide/disable product listings
  * service → retail/hybrid: allow products

---

## **Phase 6.6 — Search Testing & Optimization**

### **Objective: Ensure search works correctly and efficiently.**

---

### **Task 6.6.1 — Test Search Scenarios**

* *“phone repair”* → service + product repair kits
* *“iPhone 15 case”* → products primarily
* Empty search → trending products + trending service shops

---

### **Task 6.6.2 — Implement Search Analytics**

Track:

* Query patterns
* CTR differences between product vs services
* Service coverage gaps

---

### **Task 6.6.3 — Performance Optimization**

* Fast mixed-type queries
* Pagination
* Caching
* Indexed service keywords

---

## **Phase 6.7 — User Education & Onboarding**

### **Objective: Help users understand the dual nature of the marketplace.**

---

### **Task 6.7.1 — Add Search Help UI Elements**

Examples:

* “Looking for a service? Try: *‘hair salon’, ‘technician’, ‘cybercafe printing’*.”
* Tooltips explaining service businesses & operators

---

### **Task 6.7.2 — Create Business Registration Guidance**

Explain:

* **Retail:** List products
* **Service:** Create operators & scripts
* **Hybrid:** Offers both (requires verification)

Provide examples for each.

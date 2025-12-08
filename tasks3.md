# **Project Phase 7: Service Booking Flow Correction**

## **Overall Goal**

Fix the incorrect behavior where customers are taken straight to the chatbot instead of selecting an operator first.

---

## **Phase 7.1 — Route Structure Update**

### **Objective**

Restructure routing to enforce the correct user flow.

---

## **Task 7.1.1 — Update Frontend Routes**

*Incorrect (current):*
`/service-shop/:shopId` → immediately loads chatbot

## *Corrected Route Structure*

`/service-shop/:shopId`
  → Operator selection page
`/service-shop/:shopId/operator/:operatorId`
  → Chatbot for selected operator

Add route guards to prevent chatbot access without operator selection.

---

## **Task 7.1.2 — Correct Navigation Flow**

```
CORRECT FLOW:
1. Customer discovers service business
2. Visits `/service-shop/:shopId`
3. Chooses an operator
4. Goes to `/service-shop/:shopId/operator/:operatorId`
5. Completes service script and joins operator queue

WRONG FLOW (CURRENT):
1. Customer clicks service business
2. Lands directly on chatbot without selecting an operator
```

---

## **Task 7.1.3 — Redirect Logic**

If a user lands on a chatbot route without operator selection:

* Redirect to operator selection
* Save intended destination in session storage
* After selection, redirect back to intended chatbot page

---

## **Phase 7.2 — Service Shop Landing Page Design**

### **Objective: Build the operator selection page customers must see before the chatbot.**

---

## **Task 7.2.1 — Operator Selection Interface**

```
[Service Shop Header]
┌─────────────────────────────────────┐
│ [Logo]  ACME Cyber Cafe            │
│ ★★★★☆ 4.3 • Open Now               │
│ 📍 123 Tech Street • 4 operators    │
└─────────────────────────────────────┘

[Service Description]
"We offer printing, scanning, binding, and document services."

[Choose Your Operator]
┌─────────────────────────────────────┐
│ 👨‍💼 John Doe                         │
│ Avg. Time: 15 min • Queue: 3        │
│ Est. Wait: 45 min                   │
│ [SELECT THIS OPERATOR]              │
├─────────────────────────────────────┤
│ 👩‍💼 Jane Smith                       │
│ Avg. Time: 10 min • Queue: 0        │
│ Available Now                       │
│ [SELECT THIS OPERATOR]              │
├─────────────────────────────────────┤
│ 👨‍💼 Bob Wilson                       │
│ Avg. Time: 20 min • Queue: 1        │
│ Est. Wait: 20 min                   │
│ [SELECT THIS OPERATOR]              │
└─────────────────────────────────────┘

[Footer Notes]
• Save favorite operators  
• Queue times are estimates  
```

---

## **Task 7.2.2 — Queue Status Display**

* Fetch real-time queue length
* Calculate estimated wait time using:

  * Number of customers in queue
  * Average service time
  * Operator availability
* Highlight operators with **0 queue** as *Available Now*

---

## **Task 7.2.3 — Operator Details & Filters**

Add:

* Ratings & reviews
* Filters:

  * “Available now”
  * Sort by queue, rating, service speed
* Search by operator name
* “Favorite Operators” section

---

## **Phase 7.3 — State Management for Operator Selection**

### **Objective: Store and pass operator selection through the flow.**

---

## **Task 7.3.1 — Operator Selection State**

Store operator selection in:

* Session storage
* App state (React Context, Vuex, etc.)
* URL parameters

---

## **Task 7.3.2 — Pass Operator Context to Chatbot**

Sample payload:

```json
{
  "shopId": "shop_123",
  "operatorId": "operator_456",
  "operatorName": "Jane Smith",
  "queuePosition": null,
  "timestamp": "2023-10-05T14:30:00Z"
}
```

---

## **Task 7.3.3 — Validate Selection on Chatbot Page**

* Check that a valid operator is selected
* If missing → redirect to operator selection
* Display operator info in chatbot header:

```
Service Request • ACME Cyber Cafe • Operator: Jane Smith
```

---

## **Phase 7.4 — Backend Flow Enforcement**

### **Objective: Force operator selection at backend level.**

---

## **Task 7.4.1 — Update Service Request API**

**Previous (incorrect):**

```javascript
POST /api/service-request
{
  shopId: "shop_123",
  scriptAnswers: [...]
}
```

**Updated (correct):**

```javascript
POST /api/service-request
{
  shopId: "shop_123",
  operatorId: "operator_456",
  scriptAnswers: [...]
}
```

---

## **Task 7.4.2 — Add Validation Middleware**

Checks:

* Operator belongs to the shop
* Operator is active
* Shop is open

Errors:

* “Please select an operator before proceeding”
* “Selected operator is unavailable”
* “Shop is currently closed”

---

## **Task 7.4.3 — Queue Assignment Logic**

Steps:

1. Validate operator
2. Add service request to operator queue
3. Calculate customer queue position
4. Return confirmation:

```json
{
  "queuePosition": 3,
  "estimatedWaitTime": "45 minutes",
  "operatorName": "Jane Smith",
  "requestId": "req_789"
}
```

---

## **Phase 7.5 — User Interface Fixes**

### **Objective: Patch UI flows that bypass operator selection.**

---

## **Task 7.5.1 — Update “Book Service” Buttons**

* New behavior: Always open operator selection
* Tooltip: “Choose your preferred operator”

---

## **Task 7.5.2 — Fix Old Bookmarks & Links**

* Redirect outdated routes
* Add 301 redirects
* Update sitemap

---

## **Task 7.5.3 — Add Breadcrumb Navigation**

```
Home > Services > Printing Shops > ACME Cyber Cafe > Choose Operator > Service Request
```

---

## **Phase 7.6 — Error Handling & Edge Cases**

### **Objective: Address failures during operator selection.**

---

## **Task 7.6.1 — Operator Unavailability**

* Show warning
* Option to switch operator
* Auto-redirect if operator status changes

---

## **Task 7.6.2 — Session Expiry Handling**

* Save chatbot progress locally
* Redirect to operator selection
* Resume with same/different operator

---

## **Task 7.6.3 — Prevent Concurrent Bookings**

* 30-second temporary lock when selecting operator
* Show “Operator just became unavailable” message if conflict occurs

---

## **Phase 7.7 — Testing & Validation**

### **Objective: Ensure the corrected flow works flawlessly.**

---

## **Task 7.7.1 — End-to-End Testing**

Test:

1. Normal booking flow
2. Direct shop link
3. Old chatbot bookmark
4. Browser back/forward

---

## **Task 7.7.2 — Mobile Testing**

* Operator cards tap-friendly
* Layout responsive

---

## **Task 7.7.3 — Accessibility Testing**

* Screen reader friendly
* Keyboard navigation
* ARIA labels for queue info

---

## **Phase 7.8 — Analytics & Monitoring**

### **Objective: Monitor usage after rollout.**

---

## **Task 7.8.1 — Analytics Events**

Track:

* `operator_selection_page_view`
* `operator_selected`
* `operator_selection_skipped` (should be 0)
* `chatbot_started_with_operator`
* `chatbot_started_without_operator`

---

## **Task 7.8.2 — Success Metrics**

* % of service requests with operator selected
* Time spent on operator selection page
* Drop-off rates
* Chatbot completion rates

---

## **Task 7.8.3 — Feedback Collection**

* Post-booking mini survey
* Track support tickets
* Request feature suggestions

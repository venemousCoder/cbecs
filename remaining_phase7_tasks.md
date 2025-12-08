# Remaining Work for Phase 7 (Service Booking Flow)

Based on the review of `@tasks3.md` and the current codebase status, here are the items that still need to be addressed to fully complete Phase 7.

## 1. Handling Operator Unavailability (Task 7.6.1)
- **Problem:** An operator might go offline *after* the user selects them but *before* the user starts the chat session.
- **Solution:** Add a check in `startServiceSession` (in `controllers/service.controller.js`) to verify `operator.isAvailable` and `operator.queueLength` (if we want to set a max queue limit).
- **UI:** If unavailable, return a specific error that the frontend can use to prompt the user to select a different operator.

## 2. Concurrent Booking Prevention (Task 7.6.3)
- **Problem:** Two users might see an operator as "Available" at the same time and both try to book, potentially overloading the operator or messing up queue position calculations.
- **Solution:** 
    - Implement a simple database-level check (e.g., using `findOneAndUpdate` with a condition) or optimistic locking when assigning the queue position.
    - Alternatively, for this MVP, ensuring the `queueLength` is atomic incremented is likely sufficient, but we should ensure we don't assign the *same* queue position to two people.
    - *Current Implementation:* The code basically does `queuePos = op.queueLength + 1; await op.save()`. This has a race condition.

## 3. Rating System Backend (General)
- **Problem:** We added `averageRating` to the User model, but there is no way to *set* it.
- **Solution:**
    - Update `models/order.js` to store a `rating` (Number) and `review` (String).
    - Create an endpoint `POST /orders/:id/rate` that allows a consumer to rate a completed service order.
    - When a rating is saved, recalculate the operator's `averageRating`.

## 4. Analytics (Phase 7.8)
- **Status:** Low priority for MVP prototype, but can be simulated with simple console logs or a dedicated `Analytics` model if time permits.

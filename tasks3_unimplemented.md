# Tasks 3: Unimplemented Items

## Phase 7.3 - State Management
- **Task 7.3.1:** Store operator selection in Session Storage / App State. (Partially handled via URL params, but persistent state for "back" navigation could be improved)

## Phase 7.6 - Error Handling
- **Task 7.6.1:** Operator Unavailability. (Logic to check if operator went offline *after* selection but *before* chat start)
- **Task 7.6.3:** Concurrent Bookings. (Temporary lock to prevent race conditions on queue position)

## Phase 7.8 - Analytics
- **Task 7.8.1 - 7.8.3:** Analytics events, success metrics, feedback collection. (Not implemented)

## General
- **Rating System:** Backend logic to update `averageRating` for operators based on completed orders is missing (only the field was added).

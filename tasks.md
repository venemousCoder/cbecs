### **Project: Dynamic, Branching Questionnaire System for SME Services**

**Overall Goal:** Build a system where an SME owner can create a dynamic service script with branching logic, which customers then use in a chat-like interface to place requests with specific operators.

---

### **Phase 1: Core Data Structure & Basic Flow**
*Objective: Establish the fundamental database structure and a simple, linear questionnaire.*

**Task 1.1: Define Core Data Models**
*   Create a data model for an `SME` (business) with basic info (name, description).
*   Create a data model for an `Operator` (service staff) linked to an `SME`.
*   Create a data model for a `ServiceScript` linked to an `SME`. This script will contain multiple `Questions`.

**Task 1.2: Build the Basic Question Model**
*   Create a data model for a `Question`. It should have:
    *   `question_text` (e.g., "What service would you like?")
    *   `input_type` (e.g., `multiple_choice`, `number`, `text`, `file`).
    *   A link back to its `ServiceScript`.

**Task 1.3: Create a Simple Script Builder UI**
*   Build a simple interface for the SME owner where they can:
    *   Create a new `ServiceScript` for their SME.
    *   Add new `Questions` to the script in a sequence.
    *   For each question, define the `question_text` and `input_type`.

**Task 1.4: Implement a Linear Customer Flow**
*   Create a customer-facing page that, after selecting an operator, displays the SME's `ServiceScript`.
*   It should render each `Question` in the order they were created, one after another, using the appropriate input field (buttons for `multiple_choice`, a number box for `number`, etc.).
*   The flow ends with a "Submit Request" button that places the request in the operator's queue.

---

### **Phase 2: Implementing Branching Logic**
*Objective: Upgrade the system from a linear flow to a dynamic, branching one.*

**Task 2.1: Enhance the Question Model for Branching**
*   Add a new data model for `AnswerOption` linked to a parent `Question`.
    *   It should have `option_text` (e.g., "Printing", "Registration").
*   Modify the `Question` model to have a field called `next_question`. This field should link to the next `Question` that should be shown.
*   **Crucially, link the `next_question` to the `AnswerOption`**, not the parent `Question`. This allows each answer to lead to a different path.

**Task 2.2: Upgrade the Script Builder UI for Branching**
*   In the script builder, when an SME owner creates a `multiple_choice` question, provide an interface to:
    1.  Add the possible `AnswerOption`s (e.g., "Printing", "Registration").
    2.  For each `AnswerOption`, allow the owner to select or create the *next* `Question` in the flow.
*   This is how the "if-else" logic is created: *If* the user selects "Printing", *then* show the "What type of printing?" question.

**Task 2.3: Implement the Dynamic Customer Flow**
*   Rewrite the customer-facing flow logic. It should no longer simply show all questions in sequence.
*   The new logic should be:
    1.  Start with the first question of the script.
    2.  When a customer selects an `AnswerOption`, the system looks up the `next_question` linked to that specific option.
    3.  It then dynamically loads and displays that next question.
    4.  This repeats until a question has no `next_question` defined, at which point the request can be submitted.

---

### **Phase 3: Polishing the User Experience & Complex Inputs**
*Objective: Refine the system to handle complex data and improve usability.*

**Task 3.1: Implement File Upload Handling**
*   Ensure the system can properly handle `input_type: file`. This includes frontend upload components and backend processing to store the uploaded files securely, associating them with the customer's request.

**Task 3.2: Add Logic for "Add Another Item" (Yes/No Loops)**
*   Implement a special case for `confirmation` (Yes/No) questions.
*   For example, if the question is "Anything else?" and the `AnswerOption` for "Yes" is selected, the logic should loop back to a previous question (e.g., the first service question). The `next_question` for "Yes" would point to that earlier question ID.

**Task 3.3: Review and Summary Step**
*   Before final submission, add a step that summarizes the customer's entire journey—all their selected options and inputs—for them to review and confirm.

**Task 3.4: UI/UX Polish**
*   Improve the chat interface with better styling, timestamps, or user/bot avatars to make it feel more like a real conversation.
*   Add validation to questions (e.g., a number input must be greater than zero).

---

By following these phases and tasks in order, the agent can focus on one well-defined problem at a time, reducing complexity and ensuring a solid foundation for each new feature.
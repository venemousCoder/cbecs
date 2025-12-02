
# **Phase 4: Upgrade to Visual Script Builder**

**Goal:** Replace the current form-based script builder with an intuitive **visual, node-based editor**.

---

## **Phase 4.1 — Foundation: Canvas and Static Nodes**

### **Objective:** Build the visual workspace and basic node system

---

### **4.1.1 — Implement Main Canvas Component**

* Create a large central `<div>` that serves as the main building canvas.
* Implement essential canvas features:

  * Zoom in / zoom out
  * Panning (click + drag to move viewport)

---

### **4.1.2 — Design the `QuestionNode` Component**

A reusable draggable component that visually displays:

* **Header:** `question_text`
* **Badge:** `input_type` (e.g., Multiple Choice)
* **List:** `answer_options` (e.g., “Printing”, “Registration”)

Node must be:

* **Draggable**
* **Selectable** (to open properties sidebar)

---

### **4.1.3 — Add “Add New Node” Toolbar**

Create a toolbar with a button:

* **Add Question**

When clicked:

* Create a new blank `QuestionNode`
* Place it in the **center** of the visible canvas

---

### **4.1.4 — Create “Node Properties” Sidebar**

A sidebar that appears when a node is selected.

Form fields:

* Input field for `question_text`
* Dropdown selector for `input_type`
* List editor for `answer_options` (add / remove)

---

## **Phase 4.2 — Logic: Connecting Nodes Visually**

### **Objective:** Make nodes connect with actual logic represented through visual links

---

### **4.2.1 — Add Connection Handles**

Modify `QuestionNode` to include:

* **Output handles**

  * One handle **per answer option**
* **Input handle**

  * A single handle at the top of the node

Handles visually represent connection points.

---

### **4.2.2 — Implement `ConnectorLine` Component**

* Create an SVG line/arrow component
* Can draw smooth, curved, or straight lines
* Positioned between two handles on the canvas

---

### **4.2.3 — Enable Drag-to-Connect**

* Output handles become **draggable**
* If user drags from an output handle → releases over an input handle:

  * A permanent `ConnectorLine` is created
  * The logic is saved to DB:

Example:

```json
{
  "answer_option": "Printing",
  "next_question_id": "question_2"
}
```

---

### **4.2.4 — Define the Start Node**

Create a special **`StartNode`**:

* Cannot be deleted
* Has a single output handle
* Connecting it to a node defines the **first question** in the script

---

## **Phase 4.3 — Data Management & Integrity**

### **Objective:** Ensure full saving, loading, and validation of script layout

---

### **4.3.1 — Create Visual Layout Data Structure**

Define structure:

```json
{
  "nodes": [
    { "nodeId": "...", "x": 100, "y": 200 }
  ],
  "connections": [
    { 
      "fromNode": "...",
      "answerIndex": 0,
      "toNode": "..."
    }
  ]
}
```

Must store:

* Node coordinates
* All connections
* Answer-to-next question mappings

---

### **4.3.2 — Save & Load Full Visual Script**

**Save Script** button must:

* Capture full layout
* Capture node connections
* Update backend with entire structure

**Loading Script**:

* Canvas pre-populates with nodes at saved positions
* Recreates all `ConnectorLines`

---

### **4.3.3 — Add Connection Validation**

Prevent invalid links:

* No node should connect to **itself**
* Only **one connection per answer option**
* No circular dependency unless explicitly allowed
* Input handle accepts only *one* incoming connection except StartNode

---

## **Phase 4.4 — User Experience (UX) Polish**

### **Objective:** Improve usability, clarity, and smoothness

---

### **4.4.1 — Implement Node Deletion**

* Add trash icon to each node
* Ask for confirmation before deleting
* When deleted:

  * Remove the node
  * Remove all linked connections

---

### **4.4.2 — Add Visual Feedback**

Provide UX feedback:

* Highlight selected node
* Highlight input handle when a connection is dragged over it
* Change cursor to:

  * `grab` when hovering
  * `grabbing` when dragging nodes or connectors

---

### **4.4.3 — Auto-Layout & Snapping (Optional Enhancements)**

* **Auto-arrange** button:

  * Automatically positions nodes to reduce overlapping lines
* **Grid snapping**:

  * Nodes snap to invisible grid for clean alignment

---

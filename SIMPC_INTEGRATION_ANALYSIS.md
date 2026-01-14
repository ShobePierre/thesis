# SimPC Integration Analysis - StudentSubclass.jsx

## Overview
SimPC (PC Building Simulator) is imported and integrated into StudentSubclass.jsx as a full-screen modal activity. Here's the complete flow:

---

## 1. IMPORT STATEMENT
**Location:** Line 8
```jsx
import SimPCActivityView from "../../activities/simpc/SimPCActivityView";
```
- Imports the main SimPC component from the activities folder
- Component is mounted conditionally based on state

---

## 2. STATE MANAGEMENT

### State Declaration
**Location:** Line 36
```jsx
const [isSimPCOpen, setIsSimPCOpen] = useState(false);
```
- Boolean flag to control visibility of SimPC modal
- Related state: `selectedActivity` (stores current activity data)

### Associated States:
```jsx
const [selectedActivity, setSelectedActivity] = useState(null);        // Line 29
const [isCodeLabOpen, setIsCodeLabOpen] = useState(false);             // Line 37
const [isCodeBlockOpen, setIsCodeBlockOpen] = useState(false);         // Line 38
const [isQuizOpen, setIsQuizOpen] = useState(false);                   // Line 39
```

---

## 3. ACTIVITY ACTIVATION FLOW

### Primary Opening Logic
**Location:** Lines 360-375

```jsx
if (cfg?.activity_name === "Sim Pc") {
  // Check if already completed before opening
  try {
    const res = await axios.get(`${API_BASE_URL}/activity/${activity.activity_id}/my-submission`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.data?.completion_status === 'completed') {
      alert("You have already completed this SimPC activity. You cannot retake it.");
      return;
    }
  } catch (err) {
    console.error("Failed to check completion status:", err);
  }
  setIsSimPCOpen(true);
  return;
}
```

**Key Features:**
- ✅ Checks `activity_name === "Sim Pc"` (CASE-SENSITIVE)
- ✅ Validates if activity already completed
- ✅ Prevents retaking completed SimPC activities
- ✅ Sets `isSimPCOpen = true`

### Secondary Opening Logic (UI Button)
**Location:** Lines 988-992

```jsx
onClick={() => {
  if (cfg.activity_name === type) {
    if (type === "Sim Pc") {
      setIsSimPCOpen(true);
    }
  }
}}
```
- Activity type button in UI triggers SimPC directly
- No completion check on secondary open (may need fixing)

---

## 4. COMPONENT RENDERING

### Conditional Rendering
**Location:** Lines 863-875

```jsx
{/* SimPC Activity View - Full Screen */}
{isSimPCOpen && selectedActivity && (
  <SimPCActivityView
    activity={selectedActivity}
    onBack={() => {
      setIsSimPCOpen(false);
      setSelectedActivity(null);
    }}
    onSubmit={() => {
      setIsSimPCOpen(false);
      setSelectedActivity(null);
    }}
  />
)}
```

### Props Passed to SimPC:
| Prop | Type | Source | Purpose |
|------|------|--------|---------|
| `activity` | Object | `selectedActivity` state | Activity data (id, title, instructions) |
| `onBack` | Function | Inline callback | Closes SimPC when user clicks back |
| `onSubmit` | Function | Inline callback | Closes SimPC after submission |

---

## 5. DATA FLOW DIAGRAM

```
StudentSubclass.jsx
├── State: isSimPCOpen (boolean)
├── State: selectedActivity (object)
│
├── [User clicks activity button]
│   └── Calls handleActivitySelection()
│       └── Checks if "Sim Pc"
│           ├── Validates completion status (API call)
│           └── Sets isSimPCOpen = true
│
├── [Conditional Render Check]
│   └── if (isSimPCOpen && selectedActivity)
│       └── <SimPCActivityView {...props} />
│           ├── Passes activity data
│           ├── Passes onBack callback
│           └── Passes onSubmit callback
│
└── [User submits or goes back]
    └── Callback triggers
        ├── setIsSimPCOpen(false)
        └── setSelectedActivity(null)
```

---

## 6. KEY POINTS

### ✅ What Works Well:
1. **Completion Prevention** - Checks if activity already completed before opening
2. **Clean State Management** - Uses dedicated boolean flags
3. **Proper Cleanup** - Resets both `isSimPCOpen` and `selectedActivity` on close
4. **Modal Pattern** - Full-screen overlay prevents background interaction

### ⚠️ Potential Issues:
1. **Case Sensitivity** - Activity name must be exactly "Sim Pc" (not "SimPC" or "sim pc")
2. **Secondary Open Bug** - Activity type button doesn't check completion status
3. **No Error Handling** - Completion check failure is logged but activity still opens
4. **selectedActivity Must Exist** - If selectedActivity is null, SimPC won't render even if isSimPCOpen is true

---

## 7. INTEGRATION WITH SimPCActivityView

### What SimPCActivityView Receives:
```javascript
{
  activity: {
    activity_id: number,
    title: string,
    instructions: string,
    // ... other activity fields
  },
  onBack: function,      // () => { setIsSimPCOpen(false); setSelectedActivity(null); }
  onSubmit: function     // () => { setIsSimPCOpen(false); setSelectedActivity(null); }
}
```

### SimPCActivityView Features:
- ✅ Displays interactive lecture modal first
- ✅ Tracks completion time
- ✅ Saves checkpoints and performance data
- ✅ Submits to backend via axios
- ✅ Calculates grades (95-100% for completion)
- ✅ Shows performance report on submit

---

## 8. RELATED FILES

| File | Purpose |
|------|---------|
| `StudentSubclass.jsx` | Entry point - manages state & rendering |
| `SimPCActivityView.jsx` | Main SimPC component with tracker & submission |
| `SimPCLecture.jsx` | Pre-activity lecture/tutorial modal |
| `PhaserSimulator.jsx` | Phaser game engine wrapper |
| `CpuScene.jsx`, `CmosScene.jsx`, `RamScene.jsx` | Individual component scenes |
| `DragDropUIOverlay.jsx` | Enhanced UI with progress tracking |

---

## 9. RECOMMENDED IMPROVEMENTS

### 🔧 Bug Fix - Secondary Open Validation:
```jsx
onClick={() => {
  if (cfg.activity_name === type) {
    if (type === "Sim Pc") {
      // Add completion check here too
      axios.get(`${API_BASE_URL}/activity/${activity.activity_id}/my-submission`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then(res => {
        if (res.data?.completion_status === 'completed') {
          alert("You have already completed this SimPC activity.");
          return;
        }
        setIsSimPCOpen(true);
      });
    }
  }
}}
```

### 📝 Better Error Handling:
```jsx
try {
  // ... check completion
} catch (err) {
  console.error("Failed to check completion status:", err);
  // Optionally: let user know there was an issue
  setIsSimPCOpen(true); // or setIsSimPCOpen(false);
}
```

---

## Summary
SimPC is well-integrated into StudentSubclass with proper state management and cleanup. The main flow is solid, with room for improvement in error handling and secondary open validation.

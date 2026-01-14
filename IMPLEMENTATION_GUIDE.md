# Implementation Guide: Fix Code Block Validation

## Overview
This guide provides step-by-step instructions to add proper answer validation to the code block drag-drop activity.

---

## STEP 1: Update Data Model

### 1.1 Backend Activity Schema

**File**: `backend/models/activity.model.js` (or your activity schema)

Add these fields to the activity document:

```javascript
{
  // ... existing fields ...
  
  // Code Block Specific Fields
  codeBlockConfig: {
    // Array of block IDs in the correct order
    correctBlockOrder: [String],
    
    // Maps each drop zone index to the correct block ID
    // Example: { "0": "block_abc123", "1": "block_def456" }
    blockPositionMap: {
      type: Map,
      of: String
    },
    
    // Scoring configuration
    scoringMode: {
      type: String,
      enum: ['all_or_nothing', 'partial_credit'],
      default: 'all_or_nothing'
    },
    
    // Points per correctly placed block (for partial credit)
    pointsPerBlock: {
      type: Number,
      default: 10
    },
    
    // Allow flexible ordering for certain blocks (optional)
    flexiblePositions: [Number], // Drop zone indices that can have multiple correct blocks
    
    // Alternative valid sequences (optional, for flexibility)
    acceptableVariations: [[String]],
    
    // Pass threshold (percentage)
    passingScore: {
      type: Number,
      default: 80
    }
  }
}
```

### 1.2 Activity Controller Update

**File**: `backend/controllers/activity.controller.js`

Update the activity creation/update handler:

```javascript
// Example for POST /api/activity or PUT /api/activity/:id
exports.createCodeBlockActivity = async (req, res) => {
  try {
    const { 
      title, 
      description, 
      code, 
      blocks,
      hiddenBlockIds,
      correctBlockOrder,      // ✅ NEW
      blockPositionMap,       // ✅ NEW
      language,
      difficulty,
      hints
    } = req.body;

    // Validate correctBlockOrder
    if (!correctBlockOrder || correctBlockOrder.length === 0) {
      return res.status(400).json({ 
        message: "Correct block order must be defined" 
      });
    }

    // Validate that hidden blocks match correct order
    if (hiddenBlockIds.length !== correctBlockOrder.length) {
      return res.status(400).json({ 
        message: "Number of hidden blocks must match correct block order" 
      });
    }

    const activity = new Activity({
      title,
      description,
      code,
      blocks,
      hiddenBlockIds,
      language,
      difficulty,
      hints,
      type: 'codeblock',
      codeBlockConfig: {
        correctBlockOrder,
        blockPositionMap,
        scoringMode: 'all_or_nothing',
        pointsPerBlock: Math.floor(100 / hiddenBlockIds.length)
      }
    });

    await activity.save();
    res.json({ success: true, activity });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

---

## STEP 2: Update Instructor UI

### 2.1 Add Answer Sequence Editor Component

**Create New File**: `frontend/src/features/DragDrop/components/AnswerSequenceEditor.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import './AnswerSequenceEditor.css';

/**
 * Instructor UI to set the correct sequence of code blocks
 */
export default function AnswerSequenceEditor({ 
  blocks = [], 
  hiddenBlockIds = [], 
  onSequenceSet,
  initialSequence = []
}) {
  const [sequence, setSequence] = useState(initialSequence || []);
  const [availableBlocks, setAvailableBlocks] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    // Get only the hidden blocks that can be dragged
    const hiddenBlocks = blocks.filter(b => hiddenBlockIds.includes(b.id));
    
    // Sort by hidden blocks that aren't in sequence yet
    const available = hiddenBlocks.filter(b => !sequence.includes(b.id));
    setAvailableBlocks(available);
  }, [blocks, hiddenBlockIds, sequence]);

  /**
   * Add block to sequence
   */
  const addBlockToSequence = (blockId) => {
    if (!sequence.includes(blockId)) {
      const newSequence = [...sequence, blockId];
      setSequence(newSequence);
      onSequenceSet(newSequence);
    }
  };

  /**
   * Remove block from sequence
   */
  const removeBlockFromSequence = (index) => {
    const newSequence = sequence.filter((_, i) => i !== index);
    setSequence(newSequence);
    onSequenceSet(newSequence);
  };

  /**
   * Reorder sequence (drag within sequence)
   */
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDropOnSequence = (e, targetIndex) => {
    e.preventDefault();
    if (draggedItem !== null && draggedItem !== targetIndex) {
      const newSequence = [...sequence];
      const [removed] = newSequence.splice(draggedItem, 1);
      newSequence.splice(targetIndex, 0, removed);
      setSequence(newSequence);
      onSequenceSet(newSequence);
    }
    setDraggedItem(null);
  };

  const getBlockContent = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    return block ? block.content : 'Unknown Block';
  };

  return (
    <div className="answer-sequence-editor">
      <div className="editor-header">
        <h3>📋 Set Correct Answer Sequence</h3>
        <p>Drag hidden blocks below in the correct order they should appear</p>
      </div>

      <div className="editor-content">
        {/* Available Blocks */}
        <div className="available-blocks">
          <h4>Available Blocks to Order</h4>
          <div className="blocks-list">
            {availableBlocks.length === 0 ? (
              <p className="info-text">All hidden blocks are in sequence</p>
            ) : (
              availableBlocks.map(block => (
                <div 
                  key={block.id}
                  className="block-item available"
                  onClick={() => addBlockToSequence(block.id)}
                  title="Click to add to sequence"
                >
                  <span className="block-content">{block.content}</span>
                  <span className="block-type">{block.type}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sequence Editor */}
        <div className="sequence-editor">
          <h4>Correct Sequence Order</h4>
          <div className="sequence-list">
            {sequence.length === 0 ? (
              <p className="info-text">Click blocks to add them in order</p>
            ) : (
              sequence.map((blockId, index) => (
                <div
                  key={`${blockId}-${index}`}
                  className="sequence-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDropOnSequence(e, index)}
                >
                  <span className="item-number">{index + 1}</span>
                  <span className="item-content">
                    {getBlockContent(blockId)}
                  </span>
                  <button
                    className="btn-remove"
                    onClick={() => removeBlockFromSequence(index)}
                    title="Remove from sequence"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Progress */}
          <div className="progress-info">
            <p>Blocks placed: <strong>{sequence.length}</strong> / {blocks.filter(b => hiddenBlockIds.includes(b.id)).length}</p>
          </div>
        </div>
      </div>

      {/* Preview of Code */}
      {sequence.length > 0 && (
        <div className="preview-section">
          <h4>Preview of Expected Code</h4>
          <pre className="code-preview">
            {sequence
              .map(blockId => getBlockContent(blockId))
              .join('\n')}
          </pre>
        </div>
      )}
    </div>
  );
}
```

### 2.2 Update CodeBlockActivityBuilder

**File**: `frontend/src/features/DragDrop/components/CodeBlockActivityBuilder.jsx`

Add this import at the top:
```jsx
import AnswerSequenceEditor from './AnswerSequenceEditor';
```

Add state for correct answer:
```jsx
const [correctBlockOrder, setCorrectBlockOrder] = useState([]);
```

Add to the return JSX (after blocks visualization, before save button):
```jsx
<div className="builder-section answer-section">
  <h3>Answer Configuration</h3>
  <AnswerSequenceEditor 
    blocks={blocks}
    hiddenBlockIds={hiddenBlockIds}
    initialSequence={correctBlockOrder}
    onSequenceSet={setCorrectBlockOrder}
  />
</div>
```

Update the handleSave function:
```jsx
const handleSave = async () => {
  // ... existing validation ...

  if (correctBlockOrder.length === 0) {
    setParseError("Please set the correct answer sequence");
    return;
  }

  if (correctBlockOrder.length !== hiddenBlockIds.length) {
    setParseError("All hidden blocks must be in the correct sequence");
    return;
  }

  // ... rest of save logic ...

  const activityData = {
    title,
    description,
    language,
    code,
    blocks,
    hiddenBlockIds,
    correctBlockOrder,  // ✅ ADD THIS
    difficulty,
    hints,
    type: "codeblock",
  };
  
  // ... rest of save ...
};
```

---

## STEP 3: Update Validation Logic

### 3.1 Update CodeBlockScene Validation

**File**: `frontend/src/features/DragDrop/pages/CodeBlockScene.jsx`

Replace the `validateSolution()` method:

```jsx
/**
 * Validate student's solution against correct answer
 */
validateSolution() {
  console.log("🔍 Validating solution...");
  
  const hiddenBlockCount = this.blocks.filter(b => b.isHidden).length;
  const filledBlocks = this.dropZones.filter(zone => zone.filled);

  // Check if all blocks are placed
  if (filledBlocks.length < hiddenBlockCount) {
    const feedback = `Please complete all ${hiddenBlockCount - filledBlocks.length} missing code blocks.`;
    this.handleValidationResult(false, 0, feedback, [`Missing ${hiddenBlockCount - filledBlocks.length} code blocks`]);
    return;
  }

  // Get the sequence of blocks the student placed
  const studentSequence = this.dropZones
    .filter(zone => zone.filled)
    .map(zone => zone.blockId);

  console.log("Student Sequence:", studentSequence);
  console.log("Correct Sequence:", this.codeBlockData.correctBlockOrder);

  // Compare sequences
  const isCorrect = this.compareBlockSequences(
    studentSequence, 
    this.codeBlockData.correctBlockOrder
  );

  if (isCorrect) {
    this.handleValidationResult(true, 100, "✓ Correct! All blocks are in the right order!", []);
  } else {
    const errors = this.findSequenceErrors(studentSequence, this.codeBlockData.correctBlockOrder);
    this.handleValidationResult(false, this.calculatePartialScore(studentSequence, this.codeBlockData.correctBlockOrder), 
      "✗ Some blocks are not in the correct order. Please review and try again.", 
      errors);
  }
}

/**
 * Compare student's block sequence with correct sequence
 */
compareBlockSequences(studentSequence, correctSequence) {
  if (!Array.isArray(studentSequence) || !Array.isArray(correctSequence)) {
    console.error("Invalid sequences for comparison");
    return false;
  }

  if (studentSequence.length !== correctSequence.length) {
    console.log("Length mismatch:", studentSequence.length, "vs", correctSequence.length);
    return false;
  }

  // Compare each block
  for (let i = 0; i < studentSequence.length; i++) {
    if (studentSequence[i] !== correctSequence[i]) {
      console.log(`Mismatch at position ${i}: ${studentSequence[i]} vs ${correctSequence[i]}`);
      return false;
    }
  }

  return true;
}

/**
 * Find which blocks are in wrong positions
 */
findSequenceErrors(studentSequence, correctSequence) {
  const errors = [];
  
  for (let i = 0; i < studentSequence.length; i++) {
    if (studentSequence[i] !== correctSequence[i]) {
      const wrongBlockId = studentSequence[i];
      const correctBlockId = correctSequence[i];
      const wrongBlock = this.blocks.find(b => b.id === wrongBlockId);
      const correctBlock = this.blocks.find(b => b.id === correctBlockId);
      
      errors.push({
        position: i + 1,
        studentBlock: wrongBlock?.content,
        correctBlock: correctBlock?.content,
        message: `Position ${i + 1}: Expected "${correctBlock?.content}" but got "${wrongBlock?.content}"`
      });
    }
  }
  
  return errors;
}

/**
 * Calculate partial score (for flexible grading)
 */
calculatePartialScore(studentSequence, correctSequence) {
  if (studentSequence.length === 0) return 0;
  
  let correctCount = 0;
  for (let i = 0; i < studentSequence.length; i++) {
    if (studentSequence[i] === correctSequence[i]) {
      correctCount++;
    }
  }
  
  return Math.floor((correctCount / studentSequence.length) * 100);
}

/**
 * Handle validation result
 */
handleValidationResult(correct, score, feedback, errors) {
  console.log("Validation Result:", { correct, score, feedback, errors });

  this.showValidationFeedback({ correct, score, feedback, errors });

  if (this.validationCallback) {
    this.validationCallback({
      activityId: this.codeBlockData.activityId,
      correct: correct,
      score: score,
      feedback: feedback,
      errors: errors,
      studentSequence: this.dropZones
        .filter(zone => zone.filled)
        .map(zone => zone.blockId),
    });
  }

  // Save checkpoint if correct
  if (correct && this.onCheckpointComplete) {
    this.onCheckpointComplete({
      checkpoint: this.codeBlockData.checkpointId,
      data: { 
        completedBlocks: this.dropZones
          .filter(b => b.filled)
          .map(b => b.blockId),
        score: score
      },
    });
  }
}

/**
 * Enhanced validation feedback display
 */
showValidationFeedback(validation) {
  const { width, height } = this.scale;

  // Remove existing feedback
  this.children.list.forEach(child => {
    if (child.isFeedback) child.destroy();
  });

  // Create feedback box
  const feedbackBg = this.add.rectangle(
    width / 2,
    height / 2,
    500,
    validation.correct ? 200 : 280,
    validation.correct ? 0x00aa44 : 0xaa0000,
    0.95
  );
  feedbackBg.setStrokeStyle(3, validation.correct ? 0x00ff88 : 0xff6666);
  feedbackBg.isFeedback = true;

  // Main feedback text
  const feedbackText = this.add.text(
    width / 2,
    height / 2 - 60,
    validation.feedback,
    {
      fontSize: "18px",
      fontFamily: "Arial",
      color: "#ffffff",
      align: "center",
      fontStyle: "bold",
      wordWrap: { width: 480 },
    }
  ).setOrigin(0.5);
  feedbackText.isFeedback = true;

  // Score display
  const scoreText = this.add.text(
    width / 2,
    height / 2,
    `Score: ${validation.score}%`,
    {
      fontSize: "24px",
      fontFamily: "Arial",
      color: validation.correct ? "#ffffff" : "#ffaaaa",
      fontStyle: "bold",
    }
  ).setOrigin(0.5);
  scoreText.isFeedback = true;

  // Error details (if incorrect)
  if (!validation.correct && validation.errors && validation.errors.length > 0) {
    const errorDetails = validation.errors
      .map(err => err.message)
      .join('\n');
    
    const errorText = this.add.text(
      width / 2,
      height / 2 + 60,
      errorDetails,
      {
        fontSize: "12px",
        fontFamily: "monospace",
        color: "#ffdddd",
        align: "center",
        wordWrap: { width: 480 },
      }
    ).setOrigin(0.5);
    errorText.isFeedback = true;
  }

  // Animate feedback
  this.tweens.add({
    targets: [feedbackBg, feedbackText, scoreText],
    alpha: 0,
    delay: validation.correct ? 4000 : 5000,
    duration: 500,
    onComplete: () => {
      feedbackBg.destroy();
      feedbackText.destroy();
      scoreText.destroy();
    },
  });
}
```

---

## STEP 4: CSS Styling

### 4.1 Create CSS for Answer Sequence Editor

**Create New File**: `frontend/src/features/DragDrop/components/AnswerSequenceEditor.css`

```css
.answer-sequence-editor {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  color: white;
}

.editor-header {
  margin-bottom: 20px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 15px;
}

.editor-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
}

.editor-header p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.editor-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

/* Available Blocks */
.available-blocks,
.sequence-editor {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.available-blocks h4,
.sequence-editor h4,
.preview-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.blocks-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
}

.block-item {
  background: rgba(100, 200, 255, 0.3);
  border: 2px solid rgba(100, 200, 255, 0.6);
  border-radius: 6px;
  padding: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.block-item:hover {
  background: rgba(100, 200, 255, 0.5);
  border-color: rgba(100, 200, 255, 1);
  transform: translateX(5px);
}

.block-item.available {
  cursor: grab;
}

.block-item.available:active {
  cursor: grabbing;
}

.block-content {
  flex: 1;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.block-type {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;
  white-space: nowrap;
}

/* Sequence List */
.sequence-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.sequence-item {
  background: rgba(0, 255, 100, 0.3);
  border: 2px solid rgba(0, 255, 100, 0.8);
  border-radius: 6px;
  padding: 12px;
  cursor: move;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 13px;
}

.sequence-item:hover {
  background: rgba(0, 255, 100, 0.4);
  box-shadow: 0 4px 12px rgba(0, 255, 100, 0.3);
}

.item-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  font-weight: 700;
  flex-shrink: 0;
  font-size: 14px;
}

.item-content {
  flex: 1;
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-remove {
  background: rgba(255, 50, 50, 0.6);
  border: none;
  color: white;
  width: 30px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  font-weight: bold;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: rgba(255, 50, 50, 1);
  transform: scale(1.1);
}

.progress-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  font-size: 13px;
}

.progress-info p {
  margin: 0;
}

/* Preview Section */
.preview-section {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 15px;
}

.code-preview {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(0, 255, 100, 0.4);
  border-radius: 6px;
  padding: 12px;
  color: #00ff88;
  font-family: monospace;
  font-size: 12px;
  line-height: 1.6;
  margin: 10px 0 0 0;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.info-text {
  opacity: 0.7;
  font-style: italic;
  text-align: center;
  padding: 20px 10px;
  margin: 0;
  color: rgba(255, 255, 255, 0.6);
}

/* Responsive */
@media (max-width: 1024px) {
  .editor-content {
    grid-template-columns: 1fr;
  }
}
```

---

## STEP 5: Testing

### 5.1 Test Checklist

```
Instructor Side:
☐ Create new activity with code blocks
☐ Hide some blocks
☐ Use Answer Sequence Editor to set correct order
☐ Preview looks correct
☐ Save activity successfully
☐ Load existing activity and verify sequence is preserved

Student Side:
☐ See activity with hidden blocks
☐ Drag blocks from tray to positions
☐ Place blocks in WRONG order → get error message
☐ Place blocks in CORRECT order → get success message
☐ Error message shows which blocks are wrong
☐ Can retry after failure
☐ Score calculated correctly

Data Flow:
☐ Backend receives correctBlockOrder
☐ Data saved to database
☐ Frontend loads data correctly
☐ Validation uses correct sequence
☐ Results are logged/stored
```

---

## STEP 6: Database Migration (If Needed)

Create a migration script to add fields to existing activities:

**File**: `backend/sql/add_codeblock_config.sql`

```sql
-- Add codeBlockConfig field to activities collection
db.activities.updateMany(
  { type: "codeblock" },
  {
    $set: {
      codeBlockConfig: {
        correctBlockOrder: [],
        blockPositionMap: {},
        scoringMode: "all_or_nothing",
        pointsPerBlock: 10,
        passingScore: 80
      }
    }
  }
);
```

---

## Expected Results

### Before Fix:
```
Instructor: Sets hidden blocks [A, B, C]
Student: Places blocks as [C, A, B]
Result: "Congratulations! 100% Correct!" ❌ WRONG
```

### After Fix:
```
Instructor: Sets hidden blocks [A, B, C] with correct order [A, B, C]
Student: Places blocks as [C, A, B]
Result: "Some blocks are not in correct order. Position 1: Expected 'A' but got 'C'" ✅ CORRECT
```

---

## Summary of Changes

| Component | Change Type | Impact |
|-----------|------------|--------|
| Activity Model | Add fields | Stores answer key data |
| Activity Controller | Logic update | Validates and saves answer key |
| CodeBlockActivityBuilder | UI addition | Instructor sets correct answers |
| CodeBlockScene | Logic replacement | Real answer validation |
| CSS | New file | Style the answer editor |

**Total Effort**: 
- Backend: 1-2 hours
- Frontend: 2-3 hours
- Testing: 1-2 hours
- **Total: 4-7 hours**

This is a critical fix that will make your system functional for actual learning/assessment!

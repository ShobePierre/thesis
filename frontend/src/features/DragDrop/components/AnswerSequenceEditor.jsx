import React, { useState, useEffect } from 'react';
import './AnswerSequenceEditor.css';

/**
 * Instructor UI to set the correct sequence of code blocks
 * Allows instructors to drag hidden blocks in the order they should appear
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
    
    // Filter blocks not yet in sequence
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
   * Handle drag start in sequence
   */
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  /**
   * Reorder within sequence
   */
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

  /**
   * Get block content from ID
   */
  const getBlockContent = (blockId) => {
    const block = blocks.find(b => b.id === blockId);
    return block ? block.content : 'Unknown Block';
  };

  const hiddenBlockCount = blocks.filter(b => hiddenBlockIds.includes(b.id)).length;

  return (
    <div className="answer-sequence-editor">
      <div className="editor-header">
        <h3>📋 Set Correct Answer Sequence</h3>
        <p>Drag hidden blocks below in the correct order they should appear</p>
      </div>

      <div className="editor-content">
        {/* Available Blocks */}
        <div className="available-blocks">
          <h4>Available Blocks to Order ({availableBlocks.length})</h4>
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
                  <span className="block-content">{block.content.substring(0, 40)}</span>
                  <span className="block-type">{block.type}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sequence Editor */}
        <div className="sequence-editor">
          <h4>Correct Sequence Order ({sequence.length}/{hiddenBlockCount})</h4>
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
                    {getBlockContent(blockId).substring(0, 35)}
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
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(sequence.length / hiddenBlockCount) * 100}%` }}
              ></div>
            </div>
            <p>Progress: <strong>{sequence.length}</strong> of <strong>{hiddenBlockCount}</strong> blocks placed</p>
          </div>
        </div>
      </div>

      {/* Preview of Code */}
      {sequence.length > 0 && (
        <div className="preview-section">
          <h4>📝 Preview of Expected Code</h4>
          <pre className="code-preview">
            {sequence
              .map((blockId, idx) => `${idx + 1}. ${getBlockContent(blockId)}`)
              .join('\n')}
          </pre>
        </div>
      )}

      {/* Completion Status */}
      {sequence.length === hiddenBlockCount && hiddenBlockCount > 0 && (
        <div className="completion-status">
          ✓ All blocks arranged! Ready to save.
        </div>
      )}
    </div>
  );
}

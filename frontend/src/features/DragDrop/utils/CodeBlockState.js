// CodeBlockState.js
// Manages block-to-zone mapping and solution tracking

export class CodeBlockState {
  constructor() {
    this.blockPositions = {};    // blockId → zoneId
    this.zoneOccupancy = {};     // zoneId → blockId
    this.dropZones = [];         // Reference to all zones
    this.blocks = [];            // Reference to all blocks
    this.attemptHistory = [];    // Track validation attempts
    this.hintsUsed = [];         // Track which blocks had hints shown
  }

  /**
   * Initialize with zones and blocks
   */
  init(zones, blocks) {
    this.dropZones = zones;
    this.blocks = blocks;
  }

  /**
   * Place a block in a drop zone
   * @returns {boolean} true if successful, false if zone occupied
   */
  placeBlock(blockId, zoneId) {
    // Check if zone is already occupied
    if (this.isZoneOccupied(zoneId)) {
      return false;
    }

    // Remove from previous zone if exists
    const oldZone = this.blockPositions[blockId];
    if (oldZone) {
      delete this.zoneOccupancy[oldZone];
    }

    // Place in new zone
    this.blockPositions[blockId] = zoneId;
    this.zoneOccupancy[zoneId] = blockId;
    return true;
  }

  /**
   * Remove block from its zone
   */
  removeBlock(blockId) {
    const zoneId = this.blockPositions[blockId];
    if (zoneId) {
      delete this.blockPositions[blockId];
      delete this.zoneOccupancy[zoneId];
      return true;
    }
    return false;
  }

  /**
   * Check if a zone is occupied
   */
  isZoneOccupied(zoneId) {
    return zoneId in this.zoneOccupancy;
  }

  /**
   * Get block in specific zone
   */
  getBlockInZone(zoneId) {
    return this.zoneOccupancy[zoneId] || null;
  }

  /**
   * Get zone containing specific block
   */
  getZoneForBlock(blockId) {
    return this.blockPositions[blockId] || null;
  }

  /**
   * Get current student solution as array of blockIds
   * in correct order based on drop zones
   */
  getSolution() {
    return this.dropZones.map((zone, index) => {
      return {
        zoneIndex: index,
        zoneId: zone.id,
        blockId: this.zoneOccupancy[zone.id] || null,
      };
    });
  }

  /**
   * Get expected solution (correct order from parsed blocks)
   */
  getExpectedSolution() {
    return this.blocks.map((block, index) => {
      const zone = this.dropZones[index];
      return {
        zoneIndex: index,
        zoneId: zone?.id,
        blockId: block.id,
        blockContent: block.content,
      };
    });
  }

  /**
   * Validate current solution against expected
   */
  validateSolution() {
    const expected = this.getExpectedSolution();
    const current = this.getSolution();

    const result = {
      correct: true,
      score: 100,
      errors: [],
      correctPositions: 0,
      totalPositions: expected.length,
      details: [],
    };

    // Check each position
    expected.forEach((expectedItem, index) => {
      const currentItem = current[index];
      const detail = {
        position: index,
        expected: expectedItem.blockId,
        actual: currentItem.blockId,
        correct: false,
      };

      if (!currentItem.blockId) {
        result.errors.push(
          `Position ${index + 1}: Missing block. Expected: "${expectedItem.blockContent}"`
        );
        result.correct = false;
        detail.error = "Missing";
      } else if (currentItem.blockId !== expectedItem.blockId) {
        const actualBlock = this.blocks.find(b => b.id === currentItem.blockId);
        result.errors.push(
          `Position ${index + 1}: Wrong block. Got: "${actualBlock?.content || 'Unknown'}", Expected: "${expectedItem.blockContent}"`
        );
        result.correct = false;
        detail.error = "Wrong block";
      } else {
        result.correctPositions++;
        detail.correct = true;
      }

      result.details.push(detail);
    });

    // Calculate score: partial credit for partial correctness
    if (!result.correct) {
      result.score = Math.ceil((result.correctPositions / result.totalPositions) * 100);
      
      // Deduct for attempts (first attempt gets 100%, second 80%, third 50%)
      const attemptPenalty = Math.min(this.attemptHistory.length * 20, 50);
      result.score = Math.max(0, result.score - attemptPenalty);
    }

    // Track attempt
    this.attemptHistory.push({
      timestamp: Date.now(),
      correct: result.correct,
      score: result.score,
      errors: result.errors.length,
    });

    return result;
  }

  /**
   * Record hint usage
   */
  recordHintUsed(blockId) {
    if (!this.hintsUsed.includes(blockId)) {
      this.hintsUsed.push(blockId);
    }
  }

  /**
   * Get attempt count
   */
  getAttemptCount() {
    return this.attemptHistory.length;
  }

  /**
   * Reset state (for retry)
   */
  reset() {
    this.blockPositions = {};
    this.zoneOccupancy = {};
    // Don't clear attemptHistory - we want to track all attempts
  }

  /**
   * Get full analytics
   */
  getAnalytics() {
    return {
      totalAttempts: this.attemptHistory.length,
      successfulAttempt: this.attemptHistory.findIndex(a => a.correct) + 1 || null,
      hintsUsed: this.hintsUsed.length,
      currentScore: this.attemptHistory[this.attemptHistory.length - 1]?.score || 0,
      attemptHistory: this.attemptHistory,
    };
  }
}

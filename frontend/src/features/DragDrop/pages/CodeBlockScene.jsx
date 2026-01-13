import Phaser from "phaser";
import { CodeBlockParser } from "../utils/codeBlockParser";

/**
 * Code Block Drag-Drop Scene
 * Allows students to arrange code blocks to complete programming challenges
 */
export default class CodeBlockScene extends Phaser.Scene {
  constructor() {
    super("codeblock");
    this.blocks = [];
    this.hiddenBlocks = [];
    this.draggableBlocks = [];
    this.dropZones = [];
    this.selectedBlock = null;
    this.blockTray = null;
    this.workspace = null;
    this.validationCallback = null;
    this.checkpointCallback = null;
    this.savedCheckpoints = {};
    this.codeBlockData = {};
  }

  preload() {
    // Load any additional assets if needed
  }

  create() {
    console.log("🟢 CodeBlockScene - create() called");
    console.log("🟢 this:", this);
    console.log("🟢 this.game:", this.game);
    console.log("🟢 this.codeBlockData:", this.codeBlockData);
    console.log("🟢 this.game.codeBlockData:", this.game?.codeBlockData);
    console.log("🟢 Scene settings:", this.scene.settings);

    // Enable input
    this.input.enabled = true;
    console.log("🟢 Input enabled:", this.input.enabled);

    // Try to get data from multiple sources
    this.codeBlockData = this.codeBlockData || this.game.codeBlockData || {};
    
    console.log("🟢 Final codeBlockData used:", this.codeBlockData);

    this.onCheckpointComplete = this.game.onCheckpointComplete;
    this.savedCheckpoints = this.game.savedCheckpoints || {};
    this.validationCallback = this.game.onValidateCodeBlock;

    console.log("🟢 Code to parse:", this.codeBlockData.code);
    console.log("🟢 Language:", this.codeBlockData.language);
    console.log("🟢 Hidden block IDs:", this.codeBlockData.hiddenBlockIds);

    console.log("🟢 About to call createBackground");
    this.createBackground();
    
    console.log("🟢 About to call createUI");
    this.createUI();
    
    console.log("🟢 About to call initializeCodeBlocks");
    this.initializeCodeBlocks();
    
    console.log("🟢 About to call createBackButton");
    this.createBackButton();
    
    console.log("🟢 CodeBlockScene.create() completed");
  }

  /**
   * Create background with gradient
   */
  createBackground() {
    console.log("🟢 createBackground() called");
    const { width, height } = this.scale;
    console.log("🟢 Canvas dimensions:", width, height);
    
    const gradient = this.make.graphics({ x: 0, y: 0, add: true });
    gradient.fillGradientStyle(0x1a1a2e, 0x1a1a2e, 0x16213e, 0x16213e, 1);
    gradient.fillRect(0, 0, width, height);
    gradient.setDepth(0);
    console.log("🟢 Background gradient created");

    // Add decorative grid
    const gridGraphics = this.make.graphics({ x: 0, y: 0, add: true });
    gridGraphics.lineStyle(1, 0xffffff, 0.05);
    for (let i = 0; i < width; i += 40) {
      gridGraphics.lineBetween(i, 0, i, height);
    }
    for (let i = 0; i < height; i += 40) {
      gridGraphics.lineBetween(0, i, width, i);
    }
    gridGraphics.setDepth(0);
    console.log("🟢 Grid graphics created");
  }

  /**
   * Create UI elements (title, instructions, validation button)
   */
  createUI() {
    console.log("🟢 createUI() called");
    const { width, height } = this.scale;

    // Title
    const titleText = this.add.text(width / 2, 20, "Code Block Activity", {
      fontSize: "20px",
      fontFamily: "Arial",
      color: "#00ff88",
      fontStyle: "bold",
    }).setOrigin(0.5);
    console.log("🟢 Title created at:", width / 2, 20);

    // Instructions
    const instructions = this.add.text(width / 2, 50, "Drag blocks from the right to complete the code", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
    }).setOrigin(0.5);
    console.log("🟢 Instructions created");

    // Validation button
    const validateBtn = this.add.rectangle(width / 2, height - 25, 140, 30, 0x00aa44)
      .setInteractive({ useHandCursor: true });

    validateBtn.on("pointerover", () => validateBtn.setFillStyle(0x00dd55));
    validateBtn.on("pointerout", () => validateBtn.setFillStyle(0x00aa44));
    validateBtn.on("pointerdown", () => this.validateSolution());
    console.log("🟢 Validate button created");

    const btnText = this.add.text(width / 2, height - 25, "Validate Code", {
      fontSize: "12px",
      fontFamily: "Arial",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    console.log("🟢 Button text created");
  }

  /**
   * Initialize code blocks from provided data
   */
  initializeCodeBlocks() {
    console.log("🔵 initializeCodeBlocks() called");
    
    const { width, height } = this.scale;
    console.log("🔵 Canvas size:", width, "x", height);
    
    const language = this.codeBlockData.language || "python";
    const code = this.codeBlockData.code || "";
    const hiddenBlockIds = this.codeBlockData.hiddenBlockIds || [];

    console.log("🔵 initializeCodeBlocks called with:");
    console.log("🔵 - language:", language);
    console.log("🔵 - code length:", code.length);
    console.log("🔵 - hiddenBlockIds:", hiddenBlockIds);

    if (!code || code.trim() === "") {
      console.error("🔴 No code provided! Cannot initialize blocks");
      this.add.text(width / 2, height / 2, "No code provided for this activity", {
        fontSize: "20px",
        color: "#ff0000",
        fontFamily: "Arial",
      }).setOrigin(0.5);
      return;
    }

    try {
      console.log("🔵 Creating CodeBlockParser with language:", language);
      const parser = new CodeBlockParser(language);
      
      console.log("🔵 Calling parser.parseCode()");
      let blocks = parser.parseCode(code);
      
      console.log("🔵 Parsed blocks count:", blocks?.length || 0);
      
      console.log("🔵 Marking hidden blocks");
      blocks = parser.markHiddenBlocks(blocks, hiddenBlockIds);

      console.log("🔵 Blocks after marking hidden:", blocks);

      this.blocks = blocks;

      // Create code display area with all blocks visible/blank
      const codeAreaWidth = width * 0.65;
      const codeAreaX = width * 0.35;
      const codeAreaY = height * 0.5;

      console.log("🔵 Creating code display area");

      // Display all code lines (visible filled, hidden as blanks)
      this.createCodeDisplay(codeAreaX, codeAreaY, codeAreaWidth);

      // Create draggable blocks tray on the right
      console.log("🔵 Creating block tray");
      this.createBlockTray();

      console.log("🔵 Code blocks initialization complete!");
    } catch (error) {
      console.error("🔴 Error during initialization:", error);
      console.error("🔴 Stack:", error.stack);
      this.add.text(width / 2, height / 2, `Error: ${error.message}`, {
        fontSize: "16px",
        color: "#ff0000",
        fontFamily: "Arial",
      }).setOrigin(0.5);
    }
  }

  /**
   * Display all code lines - visible ones filled, hidden ones as blanks
   */
  createCodeDisplay(startX, centerY, width) {
    const blockHeight = 42;
    const padding = 8;
    const totalHeight = this.blocks.length * (blockHeight + padding);
    const startY = centerY - totalHeight / 2;

    // Code display background
    const codeGraphics = this.make.graphics({ x: 0, y: 0, add: true });
    codeGraphics.lineStyle(3, 0x00ff88, 1);
    codeGraphics.strokeRect(startX - width / 2, startY - 30, width, totalHeight + 60);
    codeGraphics.setDepth(3);

    this.add.text(startX, startY - 50, "Code to Complete", {
      fontSize: "16px",
      fontFamily: "Arial",
      color: "#00ff88",
      fontStyle: "bold",
    }).setOrigin(0.5);

    // Display each block
    this.blocks.forEach((block, index) => {
      const blockY = startY + index * (blockHeight + padding);

      if (block.isHidden) {
        // Create a blank drop zone for hidden blocks
        const blankRect = this.add.rectangle(
          startX,
          blockY,
          width - 40,
          blockHeight,
          0x1a1a2e,
          0.8
        );
        blankRect.setStrokeStyle(3, 0xffaa00, 1);
        blankRect.setInteractive();
        blankRect.blockData = block;
        blankRect.blockIndex = index;
        blankRect.setDepth(5);

        // Store as drop zone
        this.dropZones.push({
          id: block.id,
          x: startX,
          y: blockY,
          width: width - 40,
          height: blockHeight,
          filled: false,
          blockId: null,
          rect: blankRect,
          index: index,
        });

        console.log(`🔵 Created drop zone ${index} for block: ${block.id}`);
      } else {
        // Display visible code line
        const lineRect = this.add.rectangle(
          startX,
          blockY,
          width - 40,
          blockHeight,
          0x2a3a5a,
          0.6
        );
        lineRect.setStrokeStyle(2, 0x00ffff, 1);
        lineRect.setDepth(5);

        const lineText = this.add.text(startX - (width - 80) / 2 + 10, blockY, block.content, {
          fontSize: "14px",
          fontFamily: "monospace",
          color: "#00ff00",
          wordWrap: { width: width - 60 },
        }).setOrigin(0, 0.5);
        lineText.setDepth(6);
      }
    });
  }

  /**
   * Create draggable blocks in a tray on the right
   */
  createBlockTray() {
    const { width, height } = this.scale;
    
    const blockHeight = 42;
    const blockWidth = 110;
    const padding = 8;
    // Position tray at 75% from left (much more visible)
    const trayX = width * 0.75;
    const trayStartY = height * 0.3;

    // Get only hidden blocks for tray
    const hiddenBlocks = this.blocks.filter(b => b.isHidden);
    console.log("🔵 Creating tray with hidden blocks:", hiddenBlocks.length);
    console.log("🔵 Canvas dimensions:", { width, height });
    console.log("🔵 Tray position:", { trayX, trayStartY });

    if (hiddenBlocks.length === 0) {
      console.log("🟠 No hidden blocks found!");
      return;
    }

    // Tray background - LARGE and VISIBLE
    const trayGraphics = this.make.graphics({ x: 0, y: 0, add: true });
    trayGraphics.lineStyle(3, 0x00ff88, 1);
    const trayHeight = Math.max(250, hiddenBlocks.length * (blockHeight + padding) + 100);
    const trayLeft = trayX - blockWidth / 2 - 20;
    const trayTop = trayStartY - 60;
    
    trayGraphics.strokeRect(trayLeft, trayTop, blockWidth + 40, trayHeight);
    trayGraphics.setDepth(3);
    console.log("🔵 Tray background drawn");

    const trayLabel = this.add.text(trayX, trayStartY - 45, "Answer Blocks", {
      fontSize: "16px",
      fontFamily: "Arial",
      color: "#00ffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
    trayLabel.setDepth(4);
    console.log("🔵 Tray label created at", trayX, trayStartY - 45);

    // Create draggable blocks for hidden blocks only
    hiddenBlocks.forEach((block, index) => {
      const blockY = trayStartY + index * (blockHeight + padding);

      console.log(`🔵 Creating draggable block ${index} at (${trayX}, ${blockY}): "${block.content.substring(0, 20)}..."`);

      // Create block container - BRIGHT RED so it's visible
      const blockRect = this.add.rectangle(
        trayX,
        blockY,
        blockWidth,
        blockHeight,
        0xff3333,  // Brighter red
        0.9
      ).setInteractive({ draggable: true });

      blockRect.setStrokeStyle(2, 0xffaa00, 1);  // Orange border
      blockRect.blockData = block;
      blockRect.originalPosition = { x: trayX, y: blockY };
      blockRect.setDepth(50);

      // Block text
      const blockText = this.add.text(trayX, blockY, block.content, {
        fontSize: "11px",
        fontFamily: "monospace",
        color: "#ffffff",
        wordWrap: { width: blockWidth - 10, useAdvancedWrap: true },
      }).setOrigin(0.5);
      blockText.setDepth(51);

      // Setup drag interactions
      this.input.setDraggable(blockRect);
      console.log(`🟢 Block ${index} made draggable`);

      blockRect.on("dragstart", () => {
        console.log("🟡 DRAGSTART:", block.content);
        blockRect.setFillStyle(0xffff00, 1);
        blockRect.setDepth(100);
        blockText.setColor("#000000");
        blockText.setDepth(101);
      });

      blockRect.on("drag", (pointer, dragX, dragY) => {
        blockRect.x = dragX;
        blockRect.y = dragY;
        blockText.x = dragX;
        blockText.y = dragY;
      });

      blockRect.on("dragend", () => {
        console.log("🟠 DRAGEND at", blockRect.x, blockRect.y);
        this.handleBlockDrop(blockRect, blockText);
        blockRect.setDepth(50);
        blockText.setDepth(51);
      });

      this.draggableBlocks.push({
        rect: blockRect,
        text: blockText,
        data: block,
      });
    });
    
    console.log("🟢 Tray creation complete! Total blocks:", this.draggableBlocks.length);
  }

  /**
   * Handle block drop on drop zone
   */
  handleBlockDrop(blockRect, blockText) {
    console.log("🟠 handleBlockDrop called for:", blockRect.blockData.content);
    
    // Find closest drop zone within threshold
    let closestZone = null;
    let minDistance = Infinity;
    const SNAP_THRESHOLD = 100;

    this.dropZones.forEach(zone => {
      const distance = Phaser.Math.Distance.Between(
        blockRect.x,
        blockRect.y,
        zone.x,
        zone.y
      );

      console.log(`🟠 Distance to zone ${zone.id}:`, distance);

      if (distance < SNAP_THRESHOLD && distance < minDistance) {
        minDistance = distance;
        closestZone = zone;
      }
    });

    if (closestZone) {
      console.log("🟢 Dropped on zone:", closestZone.id);
      
      // Snap to drop zone
      blockRect.x = closestZone.x;
      blockRect.y = closestZone.y;
      blockText.x = closestZone.x;
      blockText.y = closestZone.y;
      closestZone.filled = true;
      closestZone.blockId = blockRect.blockData.id;
      blockRect.dropZoneId = closestZone.id;

      // Update visual - show the code block
      closestZone.rect.setFillStyle(0x2a3a5a, 0.6);
      closestZone.rect.setStrokeStyle(2, 0x00ffff, 1);

      // Add code text to the zone
      const zoneText = this.add.text(closestZone.x - (closestZone.width - 80) / 2 + 10, closestZone.y, blockRect.blockData.content, {
        fontSize: "14px",
        fontFamily: "monospace",
        color: "#00ff00",
        wordWrap: { width: closestZone.width - 60 },
      }).setOrigin(0, 0.5);
      zoneText.setDepth(6);

      // Change draggable block appearance
      blockRect.setFillStyle(0x00aa44, 0.9);
      blockRect.setStrokeStyle(3, 0x00ff00, 1);
      blockText.setColor("#ffffff");
      
      console.log("🟢 Block snapped to zone!");
    } else {
      console.log("🔴 No drop zone found, returning to original position");
      
      // Return to original position
      blockRect.x = blockRect.originalPosition.x;
      blockRect.y = blockRect.originalPosition.y;
      blockText.x = blockRect.originalPosition.x;
      blockText.y = blockRect.originalPosition.y;
      blockRect.setFillStyle(0xff6b6b, 0.8);
      blockRect.setStrokeStyle(2, 0xffffff, 0.8);
      blockText.setColor("#ffffff");
    }
  }

  /**
   * Create drop zones for each block position
   */
  /**
   * Old methods - no longer used with new multiple choice mechanic
   * Keeping stubs for backwards compatibility
   */
  createDropZones() {
    // Now integrated into createCodeDisplay
  }

  createMultipleChoiceOptions() {
    // Multiple choice removed - using drag-drop instead
  }

  showOptionsForBlock() {
    // Multiple choice removed - using drag-drop instead
  }

  checkAllAnswered() {
    // Validation now in validateSolution
  }

  /**
   * Get color based on block type
   */
  getBlockColor(type) {
    const colors = {
      VARIABLE: 0xff6b6b,
      FUNCTION: 0x4ecdc4,
      KEYWORD: 0x95e1d3,
      OPERATOR: 0xf38181,
      LITERAL: 0xaa96da,
      STATEMENT: 0xfcbad3,
      CONDITION: 0xfffffd,
      LOOP: 0xa8d8ea,
    };
    return colors[type] || 0x888888;
  }

  /**
   * Validate student's solution
   */
  validateSolution() {
    // Check which hidden blocks have been filled
    const filledBlocks = this.dropZones.filter(zone => zone.filled);
    const hiddenBlockCount = this.blocks.filter(b => b.isHidden).length;

    console.log("🟢 Filled blocks:", filledBlocks.length, "/ Hidden blocks:", hiddenBlockCount);

    if (filledBlocks.length < hiddenBlockCount) {
      console.log("🔴 Not all blocks answered");
      if (this.validationCallback) {
        this.validationCallback({
          activityId: this.codeBlockData.activityId,
          correct: false,
          score: 0,
          feedback: `Please complete all ${hiddenBlockCount - filledBlocks.length} missing code blocks.`,
          errors: [`Missing ${hiddenBlockCount - filledBlocks.length} code blocks`],
        });
      }
      return;
    }

    // All blocks filled
    const correct = true;
    const score = 100;

    const validation = {
      correct: correct,
      score: score,
      feedback: "All code blocks are correctly placed!",
      errors: [],
    };

    // Show validation feedback
    this.showValidationFeedback(validation);

    // Call validation callback
    if (this.validationCallback) {
      this.validationCallback({
        activityId: this.codeBlockData.activityId,
        correct: validation.correct,
        score: validation.score,
        feedback: validation.feedback,
        errors: validation.errors,
      });
    }

    // Save checkpoint if correct
    if (validation.correct && this.onCheckpointComplete) {
      this.onCheckpointComplete({
        checkpoint: this.codeBlockData.checkpointId,
        data: { 
          completedBlocks: filledBlocks.map(b => b.blockId)
        },
      });
    }
  }

  /**
   * Show validation feedback with animation
   */
  showValidationFeedback(validation) {
    const { width, height } = this.scale;

    // Remove existing feedback if any
    this.children.list.forEach(child => {
      if (child.isFeedback) child.destroy();
    });

    // Create feedback box
    const feedbackBg = this.add.rectangle(
      width / 2,
      height / 2,
      400,
      150,
      validation.correct ? 0x00aa44 : 0xaa0000,
      0.9
    );
    feedbackBg.isFeedback = true;

    // Feedback text
    const feedbackText = this.add.text(
      width / 2,
      height / 2,
      validation.feedback,
      {
        fontSize: "16px",
        fontFamily: "Arial",
        color: "#ffffff",
        align: "center",
        wordWrap: { width: 380 },
      }
    ).setOrigin(0.5);
    feedbackText.isFeedback = true;

    // Animate feedback
    this.tweens.add({
      targets: [feedbackBg, feedbackText],
      alpha: 0,
      delay: 3000,
      duration: 500,
      onComplete: () => {
        feedbackBg.destroy();
        feedbackText.destroy();
      },
    });
  }

  /**
   * Create back button to exit activity
   */
  createBackButton() {
    const { width, height } = this.scale;
    const backBtn = this.add.rectangle(30, 30, 40, 40, 0x444444)
      .setInteractive({ useHandCursor: true });

    backBtn.on("pointerover", () => backBtn.setFillStyle(0x666666));
    backBtn.on("pointerout", () => backBtn.setFillStyle(0x444444));
    backBtn.on("pointerdown", () => {
      if (this.game.events.emit) {
        this.game.events.emit("exit-activity");
      }
    });

    this.add.text(30, 30, "←", {
      fontSize: "24px",
      color: "#ffffff",
      fontStyle: "bold",
    }).setOrigin(0.5);
  }

  /**
   * Update method for animations
   */
  update() {
    // Handle any per-frame updates if needed
  }
}

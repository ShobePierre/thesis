import Phaser from "phaser";
import { Tray } from "../components/Tray.jsx";

// Assets
import cmosSlot from "../assets/components/cmos/cmosslot.png";
import cmosBatt from "../assets/components/cmos/cmosbatt.png";
import cmosLock from "../assets/components/cmos/cmosinserted.png";
import cmosInsert from "../assets/components/cmos/cmoslock.png";
import hand from "../assets/components/cmos/hand.png";
import cpuImg from "../assets/components/cpu/cpu.png";
import ramImg from "../assets/components/ram/ram.png";
import backgroundImg from "../assets/background.png";

// ============================================
// CONFIGURATION
// ============================================
const CMOS_CONFIG = {
  // Build steps
  steps: {
    INITIAL: 0,
    BATTERY_PLACED: 1,
    COMPLETE: 2,
  },

  // UI Text
  instructions: {
    initial: "Place the CMOS Battery",
    batteryPlaced: "Push down the battery to lock it in place",
    complete: "CMOS Battery Locked In!",
    alreadyComplete: "CMOS Battery Installed - Task Complete!",
  },

  // Layout
  layout: {
    slotWidthRatio: 0.5,
    slotHeightRatio: 0.5,
    slotXRatio: 0.5,
    slotYRatio: 0.5,
    dropZoneWidthRatio: 0.5,
    dropZoneHeightRatio: 0.5,
    insertedSizeRatio: 0.85,
    leverScale: 0.1,
    leverYOffset: 0.58,
    leverPushDistance: 80,
    trayWidthRatio: 0.2,
  },

  // Visual feedback
  feedback: {
    wrongFlashDuration: 300,
    wrongColor: 0xff0000,
  },

  // Components for tray
  components: [
    { key: "cmosbatt", correct: true, label: "CMOS Battery" },
    { key: "cpu", correct: false, label: "CPU" },
    { key: "ram", correct: false, label: "RAM" },
  ],
};

// ============================================
// CMOS SCENE - USABILITY FOCUSED
// ============================================
export default class CmosScene extends Phaser.Scene {
  constructor() {
    super("cmos");
    this.buildStep = CMOS_CONFIG.steps.INITIAL;
    this.slotImage = null;
    this.insertedBattery = null;
    this.lockLever = null;
    this.instructionText = null;
    this.tray = null;
    this.draggables = [];
    this.dropZone = null;
    this.dropZoneGraphics = null;
    this.leverStartY = 0;
    this.leverEndY = 0;
  }

  preload() {
    this.load.image("background", backgroundImg);
    this.load.image("cmosbatt", cmosBatt);
    this.load.image("cpu", cpuImg);
    this.load.image("ram", ramImg);
    this.load.image("cmosSlot", cmosSlot);
    this.load.image("cmos_insert", cmosInsert);
    this.load.image("cmos_locked", cmosLock);
    this.load.image("lockLever", hand);
  }

  create() {
    this.onCheckpointComplete = this.game.onCheckpointComplete;
    this.savedCheckpoints = this.game.savedCheckpoints || {};

    const isCmosCompleted = this.savedCheckpoints?.cmos?.completed ?? false;

    this.createBackground();
    this.createInstructions(isCmosCompleted);
    this.createSlot(isCmosCompleted);
    this.createLever();
    this.createBackButton();

    if (!isCmosCompleted) {
      this.setupDragEvents();
      this.showTray();
    } else {
      this.handleAlreadyCompleted();
    }
  }

  // ============================================
  // SCENE SETUP
  // ============================================

  createBackground() {
    this.add.image(this.scale.width / 2, this.scale.height / 2, "background")
      .setDisplaySize(this.scale.width, this.scale.height);
  }

  createInstructions(isCompleted) {
    const text = isCompleted 
      ? CMOS_CONFIG.instructions.alreadyComplete 
      : CMOS_CONFIG.instructions.initial;
    
    const color = isCompleted ? "#00ff00" : "#ffffff";

    this.instructionText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.08,
      text,
      { fontSize: "32px", color: color, fontStyle: "bold" }
    ).setOrigin(0.5);
  }

  createSlot(isCompleted) {
    const { layout } = CMOS_CONFIG;
    
    const slotW = this.scale.width * layout.slotWidthRatio;
    const slotH = this.scale.height * layout.slotHeightRatio;
    const slotX = this.scale.width * layout.slotXRatio;
    const slotY = this.scale.height * layout.slotYRatio;

    // Main slot image
    const initialTexture = isCompleted ? "cmos_locked" : "cmosSlot";
    this.slotImage = this.add.image(slotX, slotY, initialTexture)
      .setDisplaySize(slotW, slotH);

    // Store dimensions for later use
    this.slotDimensions = {
      width: slotW,
      height: slotH,
      x: slotX,
      y: slotY,
    };

    // Create drop zone if not completed
    if (!isCompleted) {
      this.createDropZone();
    }
  }

  createDropZone() {
    const { layout } = CMOS_CONFIG;
    const { width, height, x, y } = this.slotDimensions;
    
    const dropZoneW = width * layout.dropZoneWidthRatio;
    const dropZoneH = height * layout.dropZoneHeightRatio;

    // Phaser drop zone (invisible, for detection)
    this.dropZone = this.add.zone(x, y, dropZoneW, dropZoneH)
      .setRectangleDropZone(dropZoneW, dropZoneH);

    // Visual indicator
    this.dropZoneGraphics = this.add.graphics();
    this.dropZoneGraphics.lineStyle(3, 0x00ff88, 0.6);
    this.dropZoneGraphics.strokeRoundedRect(
      x - dropZoneW / 2,
      y - dropZoneH / 2,
      dropZoneW,
      dropZoneH,
      10
    );
  }

  createLever() {
    const { layout } = CMOS_CONFIG;
    
    this.leverStartY = this.scale.height * layout.leverYOffset;
    this.leverEndY = this.leverStartY + layout.leverPushDistance;

    this.lockLever = this.add.image(
      this.scale.width * 0.5,
      this.leverStartY,
      "lockLever"
    )
      .setScale(layout.leverScale)
      .setVisible(false)
      .setDepth(10)
      .setInteractive({ draggable: true, useHandCursor: true });
  }

  createBackButton() {
    this.add.text(50, 50, "← Back to Menu", { 
      fontSize: "20px", 
      color: "#ffffff",
      backgroundColor: "rgba(0, 0, 0, 0.5)",
      padding: { x: 10, y: 6 }
    })
    .setInteractive({ useHandCursor: true })
    .on("pointerdown", () => this.returnToMenu())
    .on("pointerover", function() {
      this.setStyle({ color: "#00ff88" });
    })
    .on("pointerout", function() {
      this.setStyle({ color: "#ffffff" });
    });
  }

  // ============================================
  // DRAG EVENTS SETUP
  // ============================================

  setupDragEvents() {
    // Component drag
    this.input.on("drag", (pointer, obj, dragX, dragY) => {
      this.onDrag(obj, dragX, dragY);
    });

    // Component drag end
    this.input.on("dragend", (pointer, obj) => {
      this.onDragEnd(obj);
    });

    // Drop event
    this.input.on("drop", (pointer, obj, zone) => {
      this.onDrop(obj, zone);
    });
  }

  onDrag(obj, dragX, dragY) {
    // Handle lever drag
    if (this.buildStep === CMOS_CONFIG.steps.BATTERY_PLACED && obj === this.lockLever) {
      this.handleLeverDrag(dragY);
      return;
    }

    // Handle component drag
    if (this.buildStep === CMOS_CONFIG.steps.INITIAL && this.draggables.includes(obj)) {
      obj.x = dragX;
      obj.y = dragY;

      // Visual feedback when over drop zone
      if (this.isOverDropZone(obj)) {
        obj.setTint(0x00ff88);
      } else {
        obj.clearTint();
      }
    }
  }

  onDragEnd(obj) {
    // Reset component position if not dropped in zone
    if (this.buildStep === CMOS_CONFIG.steps.INITIAL && 
        this.draggables.includes(obj) && 
        !this.isOverDropZone(obj)) {
      obj.clearTint();
      this.tray.resetComponentPosition(obj);
    }
  }

  onDrop(obj, zone) {
    if (this.buildStep !== CMOS_CONFIG.steps.INITIAL) return;
    if (zone !== this.dropZone) return;

    // Check if correct component
    if (obj.componentData && obj.componentData.correct) {
      this.handleCorrectDrop(obj);
    } else {
      this.handleWrongDrop(obj);
    }
  }

  // ============================================
  // DROP ZONE DETECTION
  // ============================================

  isOverDropZone(obj) {
    const { layout } = CMOS_CONFIG;
    const { width, height, x, y } = this.slotDimensions;
    const dropZoneW = width * layout.dropZoneWidthRatio;
    const dropZoneH = height * layout.dropZoneHeightRatio;

    return (
      obj.x > x - dropZoneW / 2 &&
      obj.x < x + dropZoneW / 2 &&
      obj.y > y - dropZoneH / 2 &&
      obj.y < y + dropZoneH / 2
    );
  }

  // ============================================
  // DROP HANDLING
  // ============================================

  handleCorrectDrop(obj) {
    // Destroy the dragged object
    obj.destroy();

    // Remove drop zone graphics
    if (this.dropZoneGraphics) {
      this.dropZoneGraphics.destroy();
      this.dropZoneGraphics = null;
    }

    // Place battery
    this.placeBattery();
  }

  handleWrongDrop(obj) {
    // Camera shake for wrong drop
    this.cameras.main.shake(100, 0.005);

    // Show feedback
    this.showFeedbackMessage("Wrong component!", "#ff0000");

    // Clear tint and return to tray
    obj.clearTint();
    this.tray.resetComponentPosition(obj);
  }

  placeBattery() {
    this.buildStep = CMOS_CONFIG.steps.BATTERY_PLACED;

    const { layout } = CMOS_CONFIG;
    const { width, height, x, y } = this.slotDimensions;
    const insertedW = width * layout.insertedSizeRatio;
    const insertedH = height * layout.insertedSizeRatio;

    // Hide original slot
    this.slotImage.setVisible(false);

    // Show inserted battery
    this.insertedBattery = this.add.image(x, y, "cmos_insert")
      .setDisplaySize(insertedW, insertedH);

    // Show and enable lever
    this.lockLever.setVisible(true);

    // Update instructions
    this.instructionText.setText(CMOS_CONFIG.instructions.batteryPlaced);
  }

  // ============================================
  // LEVER HANDLING
  // ============================================

  handleLeverDrag(dragY) {
    // Clamp lever movement
    this.lockLever.y = Phaser.Math.Clamp(dragY, this.leverStartY, this.leverEndY);

    // Check if lever is fully pushed down
    if (this.lockLever.y >= this.leverEndY) {
      this.lockBattery();
    }
  }

  lockBattery() {
    this.buildStep = CMOS_CONFIG.steps.COMPLETE;

    const { layout } = CMOS_CONFIG;
    const { width, height } = this.slotDimensions;
    const lockedW = width * layout.insertedSizeRatio;
    const lockedH = height * layout.insertedSizeRatio;

    // Change to locked texture
    this.insertedBattery.setTexture("cmos_locked")
      .setDisplaySize(lockedW, lockedH);

    // Hide lever
    this.lockLever.setVisible(false);
    this.lockLever.y = this.leverStartY;

    // Show completion feedback
    this.showCompletionFeedback();
  }

  showCompletionFeedback() {
    this.instructionText.setText(CMOS_CONFIG.instructions.complete);
    this.instructionText.setColor("#00ff00");

    console.log("CMOS checkpoint emitting:", { 
      component: "cmos", 
      progress: 100, 
      isCompleted: true 
    });

    if (this.onCheckpointComplete) {
      this.onCheckpointComplete("cmos", 100, true);
    } else {
      console.warn("onCheckpointComplete not available");
    }

    this.time.delayedCall(2000, () => this.returnToMenu());
  }

  // ============================================
  // TRAY
  // ============================================

  showTray() {
    this.tray = new Tray(this, CMOS_CONFIG.components, {
      position: 'right',
      width: this.scale.width * CMOS_CONFIG.layout.trayWidthRatio,
    });

    this.tray.show();
    this.draggables = this.tray.getDraggables();
  }

  // ============================================
  // FEEDBACK
  // ============================================

  showFeedbackMessage(text, color) {
    const feedbackText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.15,
      text,
      { 
        fontSize: "24px", 
        color: color, 
        fontStyle: "bold",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: { x: 20, y: 10 }
      }
    ).setOrigin(0.5);

    this.time.delayedCall(2000, () => feedbackText.destroy());
  }

  handleAlreadyCompleted() {
    const badge = this.add.circle(
      this.slotImage.x + this.slotDimensions.width / 4,
      this.slotImage.y - this.slotDimensions.height / 4,
      50,
      0x00aa00,
      0.9
    );

    this.add.text(badge.x, badge.y, "✓", {
      fontSize: "64px", 
      color: "#00ff00", 
      fontStyle: "bold"
    }).setOrigin(0.5);

    this.time.delayedCall(3000, () => this.returnToMenu());
  }

  returnToMenu() {
    if (this.tray) {
      this.tray.destroy();
    }
    this.scene.start("menu-scene");
  }

  // ============================================
  // CLEANUP
  // ============================================

  shutdown() {
    if (this.tray) {
      this.tray.destroy();
      this.tray = null;
    }

    this.input.off("drag");
    this.input.off("dragend");
    this.input.off("drop");
  }
}
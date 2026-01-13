import Phaser from "phaser";
import { Tray } from "../components/Tray.jsx";

// Assets
import RamImg from "../assets/components/ram/ram.png";
import RamSlot from "../assets/components/ram/ramSlot.png";
import RamSlotMid from "../assets/components/ram/ramSlotMid.png";
import RamSlotInstalled from "../assets/components/ram/ramInstalled.png";
import RamSlotGlow from "../assets/components/ram/ramSlotGlow.png";
import cpuImg from "../assets/components/cpu/cpu.png";
import cmosImg from "../assets/components/cmos/cmosbatt.png";
import backgroundImg from "../assets/background.png";

// ============================================
// CONFIGURATION
// ============================================
const RAM_CONFIG = {
  // Build steps
  steps: {
    INITIAL: 0,
    SLOT_OPEN: 1,
    RAM_PLACED: 2,
    COMPLETE: 3,
  },

  // UI Text
  instructions: {
    initial: "Open the RAM slot",
    slotOpen: "Drag the RAM into the slot",
    ramPlaced: "Click the slot to lock the RAM in place",
    complete: "RAM Installed!",
    alreadyComplete: "RAM Already Installed - Task Complete!",
  },

  // Layout
  layout: {
    slotWidthRatio: 0.5,
    slotHeightRatio: 0.6,
    slotXRatio: 0.5,
    slotYRatio: 0.45,
    dropZoneWidthRatio: 0.8,
    dropZoneHeightRatio: 0.6,
    trayWidthRatio: 0.2,
  },

  // Visual feedback
  feedback: {
    wrongFlashDuration: 300,
    wrongColor: 0xff0000,
    glowAlpha: 0.6,
  },

  // Components for tray
  components: [
    { key: "ram", correct: true, label: "RAM" },
    { key: "cpu", correct: false, label: "CPU" },
    { key: "cmos", correct: false, label: "CMOS Battery" },
  ],
};

// ============================================
// RAM SCENE - USABILITY FOCUSED
// ============================================
export default class RamScene extends Phaser.Scene {
  constructor() {
    super("ram");
    this.buildStep = RAM_CONFIG.steps.INITIAL;
    this.slot = null;
    this.slotGlow = null;
    this.slotHotspot = null;
    this.instructionText = null;
    this.tray = null;
    this.draggables = [];
    this.dropZone = null;
    this.dropZoneGraphics = null;
  }

  preload() {
    this.load.image("background", backgroundImg);
    this.load.image("ram", RamImg);
    this.load.image("cpu", cpuImg);
    this.load.image("cmos", cmosImg);
    this.load.image("ramSlot", RamSlot);
    this.load.image("ramSlotMid", RamSlotMid);
    this.load.image("ramSlotInstalled", RamSlotInstalled);
    this.load.image("ramSlotGlow", RamSlotGlow);
  }

  create() {
    this.onCheckpointComplete = this.game.onCheckpointComplete;
    this.savedCheckpoints = this.game.savedCheckpoints || {};

    const isRamCompleted = this.savedCheckpoints?.ram?.completed ?? false;

    this.createBackground();
    this.createInstructions(isRamCompleted);
    this.createSlot(isRamCompleted);
    this.createBackButton();

    if (isRamCompleted) {
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
      ? RAM_CONFIG.instructions.alreadyComplete 
      : RAM_CONFIG.instructions.initial;
    
    const color = isCompleted ? "#00ff00" : "#ffffff";

    this.instructionText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.08,
      text,
      { fontSize: "32px", color: color, fontStyle: "bold" }
    ).setOrigin(0.5);
  }

  createSlot(isCompleted) {
    const { layout } = RAM_CONFIG;
    
    const slotW = this.scale.width * layout.slotWidthRatio;
    const slotH = this.scale.height * layout.slotHeightRatio;
    const slotX = this.scale.width * layout.slotXRatio;
    const slotY = this.scale.height * layout.slotYRatio;

    // Main slot image
    const initialTexture = isCompleted ? "ramSlotInstalled" : "ramSlot";
    this.slot = this.add.image(slotX, slotY, initialTexture)
      .setDisplaySize(slotW, slotH);

    // Glow overlay
    this.slotGlow = this.add.image(slotX, slotY, "ramSlotGlow")
      .setDisplaySize(slotW, slotH)
      .setAlpha(0);

    // Interactive hotspot
    if (!isCompleted) {
      this.slotHotspot = this.add.zone(slotX, slotY, slotW, slotH)
        .setInteractive({ useHandCursor: true });
      
      this.setupSlotInteractions();
    }
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
  // SLOT INTERACTIONS
  // ============================================

  setupSlotInteractions() {
    this.slotHotspot.on("pointerover", () => this.onSlotHover());
    this.slotHotspot.on("pointerout", () => this.onSlotHoverEnd());
    this.slotHotspot.on("pointerdown", () => this.onSlotClick());
  }

  onSlotHover() {
    if (this.buildStep === RAM_CONFIG.steps.INITIAL || 
        this.buildStep === RAM_CONFIG.steps.RAM_PLACED) {
      this.slotGlow.setAlpha(RAM_CONFIG.feedback.glowAlpha);
    }
  }

  onSlotHoverEnd() {
    if (this.buildStep === RAM_CONFIG.steps.INITIAL || 
        this.buildStep === RAM_CONFIG.steps.RAM_PLACED) {
      this.slotGlow.setAlpha(0);
    }
  }

  onSlotClick() {
    if (this.buildStep === RAM_CONFIG.steps.INITIAL) {
      this.openSlot();
    } else if (this.buildStep === RAM_CONFIG.steps.RAM_PLACED) {
      this.lockRam();
    }
  }

  // ============================================
  // BUILD STEPS
  // ============================================

  openSlot() {
    this.buildStep = RAM_CONFIG.steps.SLOT_OPEN;
    this.slotGlow.setAlpha(0);
    this.instructionText.setText(RAM_CONFIG.instructions.slotOpen);
    this.showTray();
  }

  lockRam() {
    this.buildStep = RAM_CONFIG.steps.COMPLETE;
    this.slotGlow.setAlpha(0);
    this.slot.setTexture("ramSlotInstalled");
    this.showCompletionFeedback();
  }

  showCompletionFeedback() {
    this.instructionText.setText(RAM_CONFIG.instructions.complete);
    this.instructionText.setColor("#00ff00");

    console.log("RAM checkpoint emitting:", { 
      component: "ram", 
      progress: 100, 
      isCompleted: true 
    });

    if (this.onCheckpointComplete) {
      this.onCheckpointComplete("ram", 100, true);
    } else {
      console.warn("onCheckpointComplete not available");
    }

    this.time.delayedCall(2000, () => this.returnToMenu());
  }

  // ============================================
  // TRAY AND DRAG-DROP
  // ============================================

  showTray() {
    this.tray = new Tray(this, RAM_CONFIG.components, {
      position: 'right',
      width: this.scale.width * RAM_CONFIG.layout.trayWidthRatio,
    });

    this.tray.show();
    this.draggables = this.tray.getDraggables();

    // Setup drag events
    this.input.on("drag", (pointer, obj, dragX, dragY) => this.onDrag(obj, dragX, dragY));
    this.input.on("dragend", (pointer, obj) => this.onDragEnd(obj));

    // Create drop zone
    this.createDropZone();
  }

  createDropZone() {
    const { layout } = RAM_CONFIG;
    const dropZoneW = this.slot.displayWidth * layout.dropZoneWidthRatio;
    const dropZoneH = this.slot.displayHeight * layout.dropZoneHeightRatio;

    // Phaser drop zone (invisible, for detection)
    this.dropZone = this.add.zone(
      this.slot.x,
      this.slot.y,
      dropZoneW,
      dropZoneH
    ).setRectangleDropZone(dropZoneW, dropZoneH);

    // Visual indicator
    this.dropZoneGraphics = this.add.graphics();
    this.dropZoneGraphics.lineStyle(3, 0x00ff88, 0.6);
    this.dropZoneGraphics.strokeRoundedRect(
      this.slot.x - dropZoneW / 2,
      this.slot.y - dropZoneH / 2,
      dropZoneW,
      dropZoneH,
      10
    );

    // Setup drop event
    this.input.on("drop", (pointer, obj, zone) => {
      if (this.buildStep !== RAM_CONFIG.steps.SLOT_OPEN) return;
      if (zone !== this.dropZone) return;
      
      // Check if correct component
      if (obj.componentData && obj.componentData.correct) {
        this.handleCorrectDrop(obj);
      } else {
        this.handleWrongDrop(obj);
      }
    });
  }

  onDrag(obj, dragX, dragY) {
    if (this.buildStep !== RAM_CONFIG.steps.SLOT_OPEN) return;
    
    obj.x = dragX;
    obj.y = dragY;

    // Visual feedback when over drop zone
    if (this.isOverDropZone(obj)) {
      obj.setTint(0x00ff88);
    } else {
      obj.clearTint();
    }
  }

  onDragEnd(obj) {
    if (this.buildStep !== RAM_CONFIG.steps.SLOT_OPEN) return;

    obj.clearTint();

    // If not dropped in zone, return to tray
    if (!this.isOverDropZone(obj)) {
      this.tray.resetComponentPosition(obj);
    }
  }

  isOverDropZone(obj) {
    const { layout } = RAM_CONFIG;
    const dropZoneW = this.slot.displayWidth * layout.dropZoneWidthRatio;
    const dropZoneH = this.slot.displayHeight * layout.dropZoneHeightRatio;

    return (
      obj.x > this.slot.x - dropZoneW / 2 &&
      obj.x < this.slot.x + dropZoneW / 2 &&
      obj.y > this.slot.y - dropZoneH / 2 &&
      obj.y < this.slot.y + dropZoneH / 2
    );
  }

  handleCorrectDrop(obj) {
    // Destroy the dragged object
    obj.destroy();

    // Remove drop zone graphics
    if (this.dropZoneGraphics) {
      this.dropZoneGraphics.destroy();
      this.dropZoneGraphics = null;
    }

    // Place RAM
    this.placeRam();
  }

  handleWrongDrop(obj) {
    // Flash slot red
    this.slotGlow.setTint(RAM_CONFIG.feedback.wrongColor);
    this.slotGlow.setAlpha(1);

    this.time.delayedCall(RAM_CONFIG.feedback.wrongFlashDuration, () => {
      this.slotGlow.clearTint();
      this.slotGlow.setAlpha(0);
    });

    // Show feedback
    this.showFeedbackMessage("Wrong component!", "#ff0000");

    // Return to tray
    this.tray.resetComponentPosition(obj);
  }

  placeRam() {
    this.buildStep = RAM_CONFIG.steps.RAM_PLACED;

    // Change slot texture to show RAM partially inserted
    this.slot.setTexture("ramSlotMid");

    // Update instructions
    this.instructionText.setText(RAM_CONFIG.instructions.ramPlaced);

    // Show glow to indicate next action
    this.slotGlow.setAlpha(RAM_CONFIG.feedback.glowAlpha);
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
      this.slot.x + this.slot.displayWidth / 4,
      this.slot.y - this.slot.displayHeight / 4,
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
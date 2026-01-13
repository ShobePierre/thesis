import Phaser from "phaser";
import { Tray } from "../components/Tray.jsx";

// Assets
import cpuSocketClosed from "../assets/components/cpu/cpuSocket.png";
import cpuSocketGlow from "../assets/components/cpu/cpuSocketGlow.png";
import cpuSocketOpen from "../assets/components/cpu/cpuSocketOpen.png";
import cpuInstalled from "../assets/components/cpu/cpuInstalled.png";
import cpuLast from "../assets/components/cpu/cpuSocketwCPU.png";
import cpuImg from "../assets/components/cpu/cpu.png";
import ramImg from "../assets/components/ram/ram.png";
import cmosImg from "../assets/components/cmos/cmosbatt.png";
import backgroundImg from "../assets/background.png";

// ============================================
// CONFIGURATION
// ============================================
const CPU_CONFIG = {
  // Build steps
  steps: {
    INITIAL: 0,
    SOCKET_OPEN: 1,
    CPU_PLACED: 2,
    COMPLETE: 3,
  },

  // UI Text
  instructions: {
    initial: "Open the CPU Socket",
    socketOpen: "Select the CPU from the tray",
    cpuPlaced: "Close the CPU Socket!",
    complete: "CPU Installed and Socket Closed!",
    alreadyComplete: "CPU Already Installed - Task Complete!",
  },

  // Layout
  layout: {
    socketWidthRatio: 0.38,
    socketHeightRatio: 0.7,
    socketXRatio: 0.5,
    socketYRatio: 0.5,
    dropZoneWidthRatio: 0.5,
    dropZoneHeightRatio: 0.5,
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
    { key: "cpu", correct: true, label: "CPU" },
    { key: "ram", correct: false, label: "RAM" },
    { key: "cmos", correct: false, label: "CMOS Battery" },
  ],
};

// ============================================
// CPU SCENE - USABILITY FOCUSED
// ============================================
export default class CpuScene extends Phaser.Scene {
  constructor() {
    super("cpu");
    this.buildStep = CPU_CONFIG.steps.INITIAL;
    this.socket = null;
    this.socketGlow = null;
    this.installedCpu = null;
    this.instructionText = null;
    this.tray = null;
    this.draggables = [];
    this.dropZone = null;
  }

  preload() {
    this.load.image("background", backgroundImg);
    this.load.image("cpu", cpuImg);
    this.load.image("ram", ramImg);
    this.load.image("cmos", cmosImg);
    this.load.image("cpuSocketClosed", cpuSocketClosed);
    this.load.image("cpuSocketGlow", cpuSocketGlow);
    this.load.image("cpuSocketOpen", cpuSocketOpen);
    this.load.image("cpuInstalled", cpuInstalled);
    this.load.image("cpuLast", cpuLast);
  }

  create() {
    this.onCheckpointComplete = this.game.onCheckpointComplete;
    this.savedCheckpoints = this.game.savedCheckpoints || {};

    const isCpuCompleted = this.savedCheckpoints?.cpu?.completed ?? false;

    this.createBackground();
    this.createInstructions(isCpuCompleted);
    this.createSocket(isCpuCompleted);
    this.createBackButton();

    if (isCpuCompleted) {
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
      ? CPU_CONFIG.instructions.alreadyComplete 
      : CPU_CONFIG.instructions.initial;
    
    const color = isCompleted ? "#00ff00" : "#ffffff";

    this.instructionText = this.add.text(
      this.scale.width / 2,
      this.scale.height * 0.08,
      text,
      { fontSize: "32px", color: color, fontStyle: "bold" }
    ).setOrigin(0.5);
  }

  createSocket(isCompleted) {
    const { layout } = CPU_CONFIG;
    
    const slotW = this.scale.width * layout.socketWidthRatio;
    const slotH = this.scale.height * layout.socketHeightRatio;
    const socketX = this.scale.width * layout.socketXRatio;
    const socketY = this.scale.height * layout.socketYRatio;

    const initialTexture = isCompleted ? "cpuLast" : "cpuSocketClosed";
    this.socket = this.add.image(socketX, socketY, initialTexture)
      .setDisplaySize(slotW, slotH);

    this.socketGlow = this.add.image(socketX, socketY, "cpuSocketGlow")
      .setDisplaySize(slotW, slotH)
      .setAlpha(0);

    if (!isCompleted) {
      this.socket.setInteractive({ 
        pixelPerfect: true, 
        alphaTolerance: 1,
        useHandCursor: true 
      });
      this.setupSocketInteractions();
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
  // SOCKET INTERACTIONS
  // ============================================

  setupSocketInteractions() {
    this.socket.on("pointerover", () => this.onSocketHover());
    this.socket.on("pointerout", () => this.onSocketHoverEnd());
    this.socket.on("pointerdown", () => this.onSocketClick());
  }

  onSocketHover() {
    if (this.buildStep === CPU_CONFIG.steps.INITIAL || 
        this.buildStep === CPU_CONFIG.steps.CPU_PLACED) {
      this.socketGlow.setAlpha(CPU_CONFIG.feedback.glowAlpha);
    }
  }

  onSocketHoverEnd() {
    if (this.buildStep === CPU_CONFIG.steps.INITIAL || 
        this.buildStep === CPU_CONFIG.steps.CPU_PLACED) {
      this.socketGlow.setAlpha(0);
    }
  }

  onSocketClick() {
    if (this.buildStep === CPU_CONFIG.steps.INITIAL) {
      this.openSocket();
    } else if (this.buildStep === CPU_CONFIG.steps.CPU_PLACED) {
      this.closeSocket();
    }
  }

  // ============================================
  // BUILD STEPS
  // ============================================

  openSocket() {
    this.buildStep = CPU_CONFIG.steps.SOCKET_OPEN;
    this.socketGlow.setAlpha(0);
    this.socket.setTexture("cpuSocketOpen");
    this.instructionText.setText(CPU_CONFIG.instructions.socketOpen);
    this.showTray();
  }

  closeSocket() {
    this.buildStep = CPU_CONFIG.steps.COMPLETE;
    this.socketGlow.setAlpha(0);
    this.installedCpu.setTexture("cpuLast");
    this.showCompletionFeedback();
  }

  showCompletionFeedback() {
    this.instructionText.setText(CPU_CONFIG.instructions.complete);
    this.instructionText.setColor("#00ff00");

    if (this.onCheckpointComplete) {
      this.onCheckpointComplete("cpu", 100, true);
    }

    this.time.delayedCall(2000, () => this.returnToMenu());
  }

  // ============================================
  // TRAY AND DRAG-DROP
  // ============================================

  showTray() {
    this.tray = new Tray(this, CPU_CONFIG.components, {
      position: 'right',
      width: this.scale.width * CPU_CONFIG.layout.trayWidthRatio,
    });

    this.tray.show();
    this.draggables = this.tray.getDraggables();

    this.input.on("drag", (pointer, obj, dragX, dragY) => this.onDrag(obj, dragX, dragY));
    this.input.on("dragend", (pointer, obj) => this.onDragEnd(obj));

    this.createDropZoneIndicator();
  }

  createDropZoneIndicator() {
    const { layout } = CPU_CONFIG;
    const dropZoneW = this.socket.displayWidth * layout.dropZoneWidthRatio;
    const dropZoneH = this.socket.displayHeight * layout.dropZoneHeightRatio;

    this.dropZone = this.add.graphics();
    this.dropZone.lineStyle(3, 0x00ff88, 0.6);
    this.dropZone.strokeRoundedRect(
      this.socket.x - dropZoneW / 2,
      this.socket.y - dropZoneH / 2,
      dropZoneW,
      dropZoneH,
      10
    );
  }

  onDrag(obj, dragX, dragY) {
    if (this.buildStep !== CPU_CONFIG.steps.SOCKET_OPEN) return;
    
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
    if (this.buildStep !== CPU_CONFIG.steps.SOCKET_OPEN) return;

    obj.clearTint();

    if (this.isOverDropZone(obj)) {
      if (obj.componentData.correct) {
        this.handleCorrectDrop(obj);
      } else {
        this.handleWrongDrop(obj);
      }
    } else {
      this.tray.resetComponentPosition(obj);
    }
  }

  isOverDropZone(obj) {
    const { layout } = CPU_CONFIG;
    const dropZoneW = this.socket.displayWidth * layout.dropZoneWidthRatio;
    const dropZoneH = this.socket.displayHeight * layout.dropZoneHeightRatio;

    return (
      obj.x > this.socket.x - dropZoneW / 2 &&
      obj.x < this.socket.x + dropZoneW / 2 &&
      obj.y > this.socket.y - dropZoneH / 2 &&
      obj.y < this.socket.y + dropZoneH / 2
    );
  }

  handleCorrectDrop(obj) {
    // Destroy the dragged object
    obj.destroy();

    // Remove drop zone
    if (this.dropZone) {
      this.dropZone.destroy();
      this.dropZone = null;
    }

    // Place CPU immediately
    this.placeCpu();
  }

  handleWrongDrop(obj) {
    // Flash socket red
    this.socketGlow.setTint(CPU_CONFIG.feedback.wrongColor);
    this.socketGlow.setAlpha(1);

    this.time.delayedCall(CPU_CONFIG.feedback.wrongFlashDuration, () => {
      this.socketGlow.clearTint();
      this.socketGlow.setAlpha(0);
    });

    // Show feedback
    this.showFeedbackMessage("Wrong component!", "#ff0000");

    // Return to tray
    this.tray.resetComponentPosition(obj);
  }

  placeCpu() {
    this.buildStep = CPU_CONFIG.steps.CPU_PLACED;

    // FIXED: Create installed CPU at correct size, matching socket dimensions
    this.installedCpu = this.add.image(
      this.socket.x,
      this.socket.y,
      "cpuInstalled"
    );
    
    // Set to same size as socket - this was the bug!
    this.installedCpu.setDisplaySize(
      this.socket.displayWidth, 
      this.socket.displayHeight
    );

    // Update instructions
    this.instructionText.setText(CPU_CONFIG.instructions.cpuPlaced);

    // Show glow
    this.socketGlow.setAlpha(CPU_CONFIG.feedback.glowAlpha);
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
      this.socket.x + this.socket.displayWidth / 4,
      this.socket.y - this.socket.displayHeight / 4,
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
  }
}
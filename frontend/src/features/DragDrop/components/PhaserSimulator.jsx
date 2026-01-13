import { useEffect, useRef, useState, useCallback } from "react";
import Phaser from "phaser";

import CmosScene from "../pages/CmosScene.jsx";
import CpusScene from "../pages/CpuScene.jsx";
import RamScene from "../pages/RamScene.jsx";

import motherImg from "../assets/motherboard.png";
import backgroundImg from "../assets/background.png";
import cpuMaskImg from "../assets/cpu_mask.png";
import cmosMaskImg from "../assets/cmos_mask.png";
import ramMaskImg from "../assets/ram_mask.png";

// ============================================
// CONFIGURATION
// ============================================
const GAME_CONFIG = {
  title: "PC Building Simulator",
  subtitle: "Click on a component to begin assembly",
  defaultSize: {
    width: 1024,
    height: 768,
    minWidth: 400,
    minHeight: 300,
  },
  board: {
    widthRatio: 0.6,
    heightRatio: 0.8,
    yPosition: 0.5,
  },
  hotspot: {
    x: 0.5,
    y: 0.5,
    w: 1,
    h: 1,
    alphaHidden: 0.001,
    alphaTolerance: 10,
  },
  badge: {
    icon: "✓",
    fontSize: "48px",
    color: "#00ff00",
    bgColor: 0x00aa00,
    bgAlpha: 0.8,
    radius: 35,
  },
};

const HOTSPOT_CONFIGS = [
  { id: "cpu", label: "CPU Socket", name: "CPU", sceneKey: "cpu", maskKey: "cpuMask" },
  { id: "cmos", label: "CMOS Battery", name: "CMOS", sceneKey: "cmos", maskKey: "cmosMask" },
  { id: "ram", label: "RAM Slots", name: "RAM", sceneKey: "ram", maskKey: "ramMask" },
];

const ASSETS = {
  motherboard: motherImg,
  background: backgroundImg,
  cpuMask: cpuMaskImg,
  cmosMask: cmosMaskImg,
  ramMask: ramMaskImg,
};

// ============================================
// HOTSPOT CLASS
// ============================================
class Hotspot {
  constructor(scene, config, tooltip) {
    this.scene = scene;
    this.config = config;
    this.tooltip = tooltip;
    this.elements = {};
    this.create();
  }

  create() {
    const { boardX, boardY, boardWidth, boardHeight } = this.scene;
    const { hotspot } = GAME_CONFIG;
    const { maskKey } = this.config;

    // Calculate position
    const x = boardX + (hotspot.x - 0.5) * boardWidth;
    const y = boardY + (hotspot.y - 0.5) * boardHeight;
    const w = hotspot.w * boardWidth;
    const h = hotspot.h * boardHeight;

    // Create interactive mask
    this.elements.mask = this.scene.add
      .image(x, y, maskKey)
      .setDisplaySize(w, h)
      .setDepth(5)
      .setAlpha(hotspot.alphaHidden)
      .setInteractive({ pixelPerfect: true, alphaTolerance: hotspot.alphaTolerance });

    // Create highlight overlay
    this.elements.highlight = this.scene.add
      .image(x, y, maskKey)
      .setDisplaySize(w, h)
      .setDepth(4)
      .setVisible(false)
      .setAlpha(0);

    // Create completion badge if needed
    this.createCompletionBadge(x, y, w, h);

    // Setup all interactions
    this.setupInteractions();
  }

  createCompletionBadge(x, y, w, h) {
    const isCompleted = this.scene.game.savedCheckpoints?.[this.config.id]?.completed ?? false;
    
    if (isCompleted) {
      const { badge } = GAME_CONFIG;
      const badgeX = x + w / 4;
      const badgeY = y - h / 4;

      this.elements.badgeBg = this.scene.add
        .circle(badgeX, badgeY, badge.radius, badge.bgColor, badge.bgAlpha)
        .setDepth(5.5);

      this.elements.badgeText = this.scene.add
        .text(badgeX, badgeY, badge.icon, {
          fontSize: badge.fontSize,
          color: badge.color,
          fontStyle: "bold",
          shadow: { offsetX: 2, offsetY: 2, color: "#000000", blur: 5, fill: true }
        })
        .setOrigin(0.5)
        .setDepth(6);
    }
  }

  setupInteractions() {
    const { mask, highlight } = this.elements;

    mask.on("pointerover", (pointer) => this.onHoverStart(pointer));
    mask.on("pointermove", (pointer) => this.onHoverMove(pointer));
    mask.on("pointerout", () => this.onHoverEnd());
    mask.on("pointerdown", () => this.onClick());
  }

  onHoverStart(pointer) {
    // Show highlight with fade animation
    this.elements.highlight.setVisible(true);
    this.scene.tweens.add({
      targets: this.elements.highlight,
      alpha: 1,
      duration: 150,
      ease: "Sine.easeInOut"
    });

    // Show tooltip
    const isCompleted = this.scene.game.savedCheckpoints?.[this.config.id]?.completed ?? false;
    const tooltipText = isCompleted ? `${this.config.label} - ✓ Completed` : this.config.label;
    
    this.tooltip.setText(tooltipText);
    this.tooltip.setPosition(pointer.worldX, pointer.worldY - 30);
    this.tooltip.setVisible(true);
  }

  onHoverMove(pointer) {
    this.tooltip.setPosition(pointer.worldX, pointer.worldY - 30);
  }

  onHoverEnd() {
    this.tooltip.setVisible(false);
    this.elements.highlight.setVisible(false);
    this.elements.highlight.setAlpha(0);
  }

  onClick() {
    const isCompleted = this.scene.game.savedCheckpoints?.[this.config.id]?.completed ?? false;
    
    if (isCompleted) {
      this.tooltip.setText(`${this.config.label} - Already Completed`);
      return;
    }

    // Start the component scene
    this.scene.scene.start(this.config.sceneKey, {
      partId: this.config.id,
      partName: this.config.name,
    });
  }

  destroy() {
    Object.values(this.elements).forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
  }
}

// ============================================
// MENU SCENE
// ============================================
class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu-scene");
    this.hotspots = [];
  }

  preload() {
    // Load all assets
    Object.entries(ASSETS).forEach(([key, path]) => {
      this.load.image(key, path);
    });
  }

  create() {
    const { width, height } = this.scale;

    // Create background
    this.add.image(width / 2, height / 2, "background")
      .setDisplaySize(width, height);

    // Create title
    this.add.text(width / 2, height * 0.08, GAME_CONFIG.title, {
      fontSize: "32px",
      color: "#fff",
      fontStyle: "bold"
    }).setOrigin(0.5);

    // Create motherboard
    this.setupMotherboard(width, height);

    // Create tooltip
    this.tooltip = this.createTooltip();

    // Create all hotspots
    this.createHotspots();

    // Create UI elements
    this.createUI(width, height);
  }

  setupMotherboard(width, height) {
    const { board } = GAME_CONFIG;
    
    this.boardWidth = width * board.widthRatio;
    this.boardHeight = height * board.heightRatio;
    this.boardX = width / 2;
    this.boardY = height * board.yPosition;

    this.add.image(this.boardX, this.boardY, "motherboard")
      .setDisplaySize(this.boardWidth, this.boardHeight)
      .setDepth(1);
  }

  createTooltip() {
    return this.add.text(0, 0, "", {
      fontSize: "16px",
      color: "#fff",
      backgroundColor: "rgba(0,0,0,0.8)",
      padding: { x: 10, y: 6 }
    })
    .setDepth(60)
    .setOrigin(0.5)
    .setVisible(false);
  }

  createHotspots() {
    HOTSPOT_CONFIGS.forEach(config => {
      const hotspot = new Hotspot(this, config, this.tooltip);
      this.hotspots.push(hotspot);
    });
  }

  createUI(width, height) {
    // Subtitle
    this.add.text(width / 2, height * 0.92, GAME_CONFIG.subtitle, {
      fontSize: "12px",
      color: "#aaa"
    }).setOrigin(0.5);
  }



  shutdown() {
    // Clean up hotspots
    this.hotspots.forEach(hotspot => hotspot.destroy());
    this.hotspots = [];
  }
}

// ============================================
// MAIN COMPONENT
// ============================================
export default function PhaserSimulator({ 
  onCheckpointComplete, 
  savedCheckpoints
}) {
  const gameRef = useRef(null);
  const containerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const [gameSize, setGameSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : GAME_CONFIG.defaultSize.width,
    height: typeof window !== "undefined" ? window.innerHeight : GAME_CONFIG.defaultSize.height,
  });

  // Memoized resize handler
  const updateSize = useCallback(() => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const width = Math.max(rect.width, GAME_CONFIG.defaultSize.minWidth);
    const height = Math.max(rect.height, GAME_CONFIG.defaultSize.minHeight);

    setGameSize({ width, height });

    if (gameRef.current?.scale) {
      gameRef.current.scale.resize(width, height);
    }
  }, []);

  // Setup resize observer
  useEffect(() => {
    if (!containerRef.current) return;

    resizeObserverRef.current = new ResizeObserver(updateSize);
    resizeObserverRef.current.observe(containerRef.current);
    updateSize();

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [updateSize]);

  // Sync callbacks with Phaser
  useEffect(() => {
    if (!gameRef.current) return;

    gameRef.current.onCheckpointComplete = onCheckpointComplete;
    gameRef.current.savedCheckpoints = savedCheckpoints;
  }, [onCheckpointComplete, savedCheckpoints]);

  // Create Phaser game (only once)
  useEffect(() => {
    if (gameRef.current) return;

    const game = new Phaser.Game({
      type: Phaser.AUTO,
      width: gameSize.width,
      height: gameSize.height,
      parent: "game-container",
      backgroundColor: "#ffffff",
      scene: [MenuScene, CmosScene, CpusScene, RamScene],
      physics: { 
        default: "arcade",
        arcade: { debug: false }
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: true,
      },
    });

    game.onCheckpointComplete = onCheckpointComplete;
    game.savedCheckpoints = savedCheckpoints;

    gameRef.current = game;

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-container"
      style={{
        width: "100%",
        height: "100%",
        margin: 0,
        padding: 0,
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    />
  );
}
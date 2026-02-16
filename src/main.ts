// Living Worlds - Entry Point
import { h, render } from 'preact';
import { CONFIG } from './config';
import { World } from './core/ECS';
import { GameLoop } from './core/GameLoop';
import { eventBus } from './core/EventBus';
import { InputManager } from './core/InputManager';
import { WorldGenerator } from './world/WorldGenerator';
import { TimeManager } from './world/TimeManager';
import { WeatherSystem } from './world/WeatherSystem';
import { ResourceSpawner } from './world/ResourceSpawner';
import { Renderer } from './rendering/Renderer';
import { NeuralNetwork } from './ai/BrainArchitecture';
import { ACTION_NAMES } from './entities/components/Brain';
import { RNG } from './utils/RNG';

// Systems
import { MovementSystem } from './entities/systems/MovementSystem';
import { NeedsDecaySystem } from './entities/systems/NeedsDecaySystem';
import { DecisionSystem } from './entities/systems/DecisionSystem';
import { ActionExecutionSystem } from './entities/systems/ActionExecutionSystem';
import { EmotionSystem } from './entities/systems/EmotionSystem';
import { SocialSystem } from './entities/systems/SocialSystem';
import { MemorySystem } from './entities/systems/MemorySystem';
import { LearningSystem } from './entities/systems/LearningSystem';
import { DeathSystem } from './entities/systems/DeathSystem';
import { AgingSystem } from './entities/systems/AgingSystem';
import { CraftingSystem } from './entities/systems/CraftingSystem';
import { BuildingSystem } from './entities/systems/BuildingSystem';
import { ReproductionSystem } from './entities/systems/ReproductionSystem';

// Data
import { DataLogger } from './data/DataLogger';
import { MetricsCollector } from './data/MetricsCollector';
import { ExportManager } from './data/ExportManager';

// Prefabs
import { createVillager } from './entities/prefabs/Villager';

// Components for inspection
import { PositionComponent } from './entities/components/Position';
import { NeedsComponent } from './entities/components/Needs';
import { EmotionsComponent } from './entities/components/Emotions';
import { BrainComponent } from './entities/components/Brain';
import { InventoryComponent } from './entities/components/Inventory';
import { RelationshipsComponent } from './entities/components/Relationships';
import { GeneticsComponent } from './entities/components/Genetics';

// UI
import { HUD } from './ui/HUD';
import { ControlPanel } from './ui/ControlPanel';
import { WorldStats } from './ui/WorldStats';
import { InspectorPanel } from './ui/InspectorPanel';

// --- Boot ---
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const uiOverlay = document.getElementById('ui-overlay') as HTMLDivElement;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// World generation
const seed = Date.now();
const rng = new RNG(seed);
const worldGenerator = new WorldGenerator(seed);
const tileMap = worldGenerator.generate();

// World systems
const timeManager = new TimeManager();
const weatherSystem = new WeatherSystem(rng);
const resourceSpawner = new ResourceSpawner(rng);

// ECS
const ecsWorld = new World();

// Shared neural network: 80 inputs, 64 hidden, 14 actions
const INPUT_SIZE = 80;
const sharedNetwork = new NeuralNetwork(INPUT_SIZE, CONFIG.BRAIN_HIDDEN_SIZE, ACTION_NAMES.length);

// Register all 13 systems
ecsWorld.addSystem(new NeedsDecaySystem());
ecsWorld.addSystem(new DecisionSystem(tileMap, timeManager, sharedNetwork));
ecsWorld.addSystem(new ActionExecutionSystem(tileMap, ecsWorld));
ecsWorld.addSystem(new MovementSystem(tileMap));
ecsWorld.addSystem(new EmotionSystem());
ecsWorld.addSystem(new SocialSystem());
ecsWorld.addSystem(new MemorySystem());
ecsWorld.addSystem(new LearningSystem(sharedNetwork));
ecsWorld.addSystem(new CraftingSystem());
ecsWorld.addSystem(new BuildingSystem(tileMap));
ecsWorld.addSystem(new DeathSystem(ecsWorld));
ecsWorld.addSystem(new AgingSystem(ecsWorld));
ecsWorld.addSystem(new ReproductionSystem(ecsWorld));

// Spawn initial villagers at random walkable positions
for (let i = 0; i < CONFIG.INITIAL_NPC_COUNT; i++) {
  let x: number, y: number;
  do {
    x = rng.nextInt(10, CONFIG.WORLD_WIDTH - 10);
    y = rng.nextInt(10, CONFIG.WORLD_HEIGHT - 10);
  } while (!tileMap.isWalkable(x, y));
  createVillager(ecsWorld, x, y, 0);
}

// Renderer
const renderer = new Renderer(canvas);
renderer.camera.centerOn(CONFIG.WORLD_WIDTH / 2, CONFIG.WORLD_HEIGHT / 2);

// Input
const inputManager = new InputManager();
inputManager.init(canvas);

inputManager.onPan = (dx, dy) => {
  renderer.camera.pan(-dx / renderer.camera.tileScreenSize, -dy / renderer.camera.tileScreenSize);
};

inputManager.onZoom = (delta, x, y) => {
  renderer.camera.setZoom(renderer.camera.zoom + delta * 0.5, x, y);
};

// Selection state
let selectedNPCId: number | null = null;

inputManager.onTileClick = (screenX, screenY) => {
  const world = renderer.camera.screenToWorld(screenX, screenY);
  const tileX = Math.floor(world.x);
  const tileY = Math.floor(world.y);

  // Find entity at click position
  const entities = ecsWorld.getEntitiesWithComponents('position');
  let closest: { id: number; dist: number } | null = null;
  for (const entity of entities) {
    const pos = entity.getComponent<PositionComponent>('position')!;
    const dx = pos.tileX - tileX;
    const dy = pos.tileY - tileY;
    const dist = Math.abs(dx) + Math.abs(dy);
    if (dist <= 2 && (!closest || dist < closest.dist)) {
      closest = { id: entity.id, dist };
    }
  }
  selectedNPCId = closest ? closest.id : null;
};

// Data logging
const dataLogger = new DataLogger();
const metricsCollector = new MetricsCollector();

eventBus.on('npc:birth', () => metricsCollector.recordBirth());
eventBus.on('npc:death', () => metricsCollector.recordDeath());
eventBus.on('npc:birth', (data: any) => {
  dataLogger.logPopulationEvent({
    tick: timeManager.tick,
    type: 'birth',
    entityId: data.childId,
    details: data,
  });
});
eventBus.on('npc:death', (data: any) => {
  dataLogger.logPopulationEvent({
    tick: timeManager.tick,
    type: 'death',
    entityId: data.entityId,
    details: data,
  });
});

// Game state
let isPaused = false;
let speed = 1;
let frameCount = 0;

// Game loop callbacks
function update(deltaTime: number): void {
  if (isPaused) return;

  timeManager.update();
  weatherSystem.update(timeManager);
  resourceSpawner.update(tileMap, timeManager);
  ecsWorld.update(deltaTime);

  // Collect metrics periodically
  if (timeManager.tick % 100 === 0) {
    metricsCollector.collect(ecsWorld, timeManager.tick);
  }
}

function renderFrame(interpolation: number): void {
  renderer.render(ecsWorld, tileMap, timeManager, interpolation);

  frameCount++;
  if (frameCount % 10 === 0) {
    renderUI();
  }
}

// UI rendering
function renderUI(): void {
  const latest = metricsCollector.getLatest();

  // Gather selected NPC info
  let selectedNPCInfo: { id: number; name: string; mood: string; action: string } | null = null;
  let inspectorNeeds: { hunger: number; thirst: number; energy: number; warmth: number; safety: number; social: number } | null = null;
  let inspectorEmotions: { valence: number; arousal: number; mood: string } | null = null;
  let inspectorInventory: Array<{ resourceType: string; quantity: number }> = [];
  let inspectorRelationships: Array<{ targetId: number; role: string; trust: number; affection: number }> = [];
  let inspectorAction = '';
  let inspectorGeneration = 0;

  if (selectedNPCId !== null) {
    const entity = ecsWorld.getEntity(selectedNPCId);
    if (entity) {
      const brain = entity.getComponent<BrainComponent>('brain');
      const needs = entity.getComponent<NeedsComponent>('needs');
      const emotions = entity.getComponent<EmotionsComponent>('emotions');
      const inventory = entity.getComponent<InventoryComponent>('inventory');
      const relationships = entity.getComponent<RelationshipsComponent>('relationships');
      const genetics = entity.getComponent<GeneticsComponent>('genetics');

      inspectorAction = brain?.actionName ?? 'IDLE';
      inspectorGeneration = genetics?.generation ?? 0;

      selectedNPCInfo = {
        id: selectedNPCId,
        name: `Villager`,
        mood: emotions?.mood ?? 'neutral',
        action: inspectorAction,
      };

      if (needs) {
        inspectorNeeds = {
          hunger: needs.hunger,
          thirst: needs.thirst,
          energy: needs.energy,
          warmth: needs.warmth,
          safety: needs.safety,
          social: needs.social,
        };
      }

      if (emotions) {
        inspectorEmotions = {
          valence: emotions.valence,
          arousal: emotions.arousal,
          mood: emotions.mood,
        };
      }

      if (inventory) {
        inspectorInventory = inventory.items.map(item => ({
          resourceType: item.resourceType,
          quantity: item.quantity,
        }));
      }

      if (relationships) {
        inspectorRelationships = relationships.getClosestRelationships(5).map(rel => ({
          targetId: rel.target,
          role: rel.role,
          trust: rel.trust,
          affection: rel.affection,
        }));
      }
    } else {
      selectedNPCId = null;
    }
  }

  const uiTree = h('div', null,
    h(HUD, {
      tick: timeManager.tick,
      hour: timeManager.hour,
      day: timeManager.day,
      season: timeManager.season,
      year: timeManager.year,
      population: ecsWorld.getEntitiesWithComponents('needs').length,
      weather: weatherSystem.currentWeather,
      speed,
      selectedNPC: selectedNPCInfo,
    }),
    h(WorldStats, {
      population: latest?.population ?? 0,
      births: latest?.births ?? 0,
      deaths: latest?.deaths ?? 0,
      averageHappiness: latest?.averageHappiness ?? 0.5,
      tick: timeManager.tick,
    }),
    h(InspectorPanel, {
      npcId: selectedNPCId,
      needs: inspectorNeeds,
      emotions: inspectorEmotions,
      inventory: inspectorInventory,
      relationships: inspectorRelationships,
      action: inspectorAction,
      generation: inspectorGeneration,
      onClose: () => { selectedNPCId = null; renderUI(); },
    }),
    h(ControlPanel, {
      speed,
      isPaused,
      onSpeedChange: (s: number) => { speed = s; gameLoop.setSpeed(s); isPaused = false; },
      onPauseToggle: () => {
        isPaused = !isPaused;
        if (!isPaused) gameLoop.setSpeed(speed);
      },
      onSave: () => { console.log('Save not yet implemented'); },
      onExport: () => { ExportManager.downloadJSON(dataLogger, metricsCollector); },
    }),
  );

  render(uiTree, uiOverlay);
}

// Window resize
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderer.resize();
});

// Create and start game loop
const gameLoop = new GameLoop(update, renderFrame);
gameLoop.setSpeed(speed);
gameLoop.start();

// Initial UI render
renderUI();

console.log('Living Worlds initialized');

# 🌍 Living Worlds

**A 2D Pixel World Simulator — Where NPCs Think, Feel, and Evolve**

*Inspired by Dwarf Fortress's depth. Rendered in Stardew Valley's warmth.*

Living Worlds is a browser-based 2D world simulation where NPCs exhibit genuinely intelligent behavior through neural networks rather than scripted actions. Every villager has memories, emotions, relationships, and emergent behaviors that develop through learning — not scripting.

---

## Table of Contents

1. [Vision & Design Philosophy](#vision--design-philosophy)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Architecture Overview](#architecture-overview)
5. [Core Systems](#core-systems)
   - [World Engine](#1-world-engine)
   - [Tile & Rendering System](#2-tile--rendering-system)
   - [NPC AI & Neural Networks](#3-npc-ai--neural-networks)
   - [Needs & Motivation (Maslow's Hierarchy)](#4-needs--motivation-maslows-hierarchy)
   - [Memory & Relationship System](#5-memory--relationship-system)
   - [Resource & Economy System](#6-resource--economy-system)
   - [Time & Season System](#7-time--season-system)
   - [Event & Narrative System](#8-event--narrative-system)
   - [Evolution & Generational System](#9-evolution--generational-system)
6. [Sprite & Art Pipeline](#sprite--art-pipeline)
7. [Data Logging & ML Pipeline](#data-logging--ml-pipeline)
8. [Build & Run Instructions](#build--run-instructions)
9. [Deployment](#deployment)
10. [Configuration](#configuration)
11. [Performance Targets](#performance-targets)
12. [Roadmap](#roadmap)
13. [Contributing](#contributing)

---

## Vision & Design Philosophy

Living Worlds is not a game with AI — it is an **AI simulation dressed as a game**. The core thesis:

> **What happens when you give NPCs brains instead of scripts?**

**Design Pillars:**

- **Emergent over Scripted** — No behavior trees, no dialogue trees. NPCs learn what to do by experiencing consequences. A villager doesn't forage because a script says `if hungry → forage`. It forages because its neural network has learned that foraging reduces hunger signals.
- **Pressure Drives Diversity** — Comfortable environments produce boring AI. The world must present varied challenges (seasonal scarcity, social conflict, environmental hazards) to force NPCs into diverse behavioral strategies.
- **Stardew Aesthetics, Dwarf Fortress Depth** — The visual language is warm, inviting 16×16 pixel art with soft palettes and gentle animations. Beneath that surface lies a simulation tracking hundreds of variables per entity.
- **Observable Complexity** — Every internal state (needs, emotions, memories, relationships) must be inspectable through the UI. The player is a researcher watching an ant farm of minds.
- **Cross-Platform First** — Runs in any modern browser. Mobile-responsive. No install required.

---

## Tech Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Renderer** | HTML5 Canvas (2D Context) | Pixel-perfect rendering, no WebGL overhead for 2D sprites |
| **Game Loop** | Vanilla JS `requestAnimationFrame` | Deterministic tick-based simulation decoupled from render FPS |
| **AI Runtime** | TensorFlow.js | In-browser neural network inference, GPU-accelerated via WebGL backend |
| **State Management** | Custom ECS (Entity-Component-System) | Cache-friendly, scalable to 200+ NPCs with thousands of components |
| **Data Serialization** | MessagePack / JSON | Fast save/load, streaming data export for ML pipeline |
| **Build Tool** | Vite | Fast HMR, tree-shaking, ES module native |
| **Language** | TypeScript | Type safety across the entire simulation |
| **Testing** | Vitest + Playwright | Unit tests for systems, E2E for simulation integrity |
| **Audio** | Howler.js | Cross-browser audio with sprite sheet support |
| **UI Overlay** | Preact | Lightweight reactive UI for inspector panels, HUD |

---

## Project Structure

```
living-worlds/
├── README.md
├── package.json
├── tsconfig.json
├── vite.config.ts
├── index.html
│
├── public/
│   ├── sprites/                  # All sprite sheets (PNG)
│   │   ├── terrain/              # Ground tiles, water, paths
│   │   ├── structures/           # Buildings, walls, fences
│   │   ├── npcs/                 # Character sprite sheets (walk, idle, work, emote)
│   │   ├── items/                # Tools, food, materials, crafted goods
│   │   ├── nature/               # Trees, rocks, bushes, flowers
│   │   ├── effects/              # Particles, weather, lighting overlays
│   │   └── ui/                   # HUD icons, panel frames, buttons
│   ├── audio/
│   │   ├── music/                # Ambient tracks per season/time-of-day
│   │   └── sfx/                  # Interaction sounds, environment
│   └── data/
│       ├── world-presets/        # Pre-built world templates
│       └── pretrained-models/    # Baseline neural network weights
│
├── src/
│   ├── main.ts                   # Entry point, boot sequence
│   ├── config.ts                 # All tunable constants
│   │
│   ├── core/                     # Engine fundamentals
│   │   ├── GameLoop.ts           # Fixed timestep simulation loop
│   │   ├── ECS.ts                # Entity-Component-System framework
│   │   ├── EventBus.ts           # Global pub/sub event system
│   │   ├── SaveManager.ts        # Serialization / deserialization
│   │   └── InputManager.ts       # Keyboard, mouse, touch input
│   │
│   ├── world/                    # World simulation
│   │   ├── WorldGenerator.ts     # Procedural terrain generation
│   │   ├── TileMap.ts            # Tile storage, lookup, pathfinding grid
│   │   ├── Chunk.ts              # Chunk-based world streaming
│   │   ├── BiomeManager.ts       # Biome definitions & transitions
│   │   ├── TimeManager.ts        # Day/night cycle, seasons, years
│   │   ├── WeatherSystem.ts      # Rain, snow, drought, storms
│   │   └── ResourceSpawner.ts    # Dynamic resource regeneration
│   │
│   ├── entities/                 # Entity definitions
│   │   ├── components/           # ECS components
│   │   │   ├── Position.ts
│   │   │   ├── Renderable.ts
│   │   │   ├── PhysicsBody.ts
│   │   │   ├── Inventory.ts
│   │   │   ├── Needs.ts          # Hunger, thirst, energy, social, safety
│   │   │   ├── Emotions.ts       # Valence/arousal emotional model
│   │   │   ├── Memory.ts         # Episodic + semantic memory store
│   │   │   ├── Relationships.ts  # Social graph edges
│   │   │   ├── Skills.ts         # Learned abilities & proficiencies
│   │   │   ├── Genetics.ts       # Heritable trait vector
│   │   │   └── Brain.ts          # Neural network reference
│   │   │
│   │   ├── prefabs/              # Entity templates
│   │   │   ├── Villager.ts
│   │   │   ├── Animal.ts
│   │   │   ├── Plant.ts
│   │   │   └── Structure.ts
│   │   │
│   │   └── systems/              # ECS systems (tick-based processors)
│   │       ├── MovementSystem.ts
│   │       ├── NeedsDecaySystem.ts
│   │       ├── EmotionSystem.ts
│   │       ├── MemorySystem.ts
│   │       ├── DecisionSystem.ts       # Queries neural net for action selection
│   │       ├── ActionExecutionSystem.ts # Executes chosen actions
│   │       ├── SocialSystem.ts         # Relationship updates, conversations
│   │       ├── CraftingSystem.ts
│   │       ├── BuildingSystem.ts
│   │       ├── ReproductionSystem.ts
│   │       ├── AgingSystem.ts
│   │       ├── LearningSystem.ts       # Online training / weight updates
│   │       └── DeathSystem.ts
│   │
│   ├── ai/                       # Neural network & learning
│   │   ├── BrainArchitecture.ts  # Network topology definition
│   │   ├── InputEncoder.ts       # World state → tensor encoding
│   │   ├── OutputDecoder.ts      # Network output → action selection
│   │   ├── TrainingManager.ts    # Experience replay, batch training
│   │   ├── RewardSignal.ts       # Reward function design
│   │   ├── GeneticEvolution.ts   # Cross-generational weight inheritance
│   │   └── models/
│   │       ├── ForagerNet.ts     # Specialist: resource gathering
│   │       ├── SocialNet.ts      # Specialist: relationship management
│   │       └── GeneralistNet.ts  # Combined decision network
│   │
│   ├── rendering/                # Display layer
│   │   ├── Renderer.ts           # Main canvas draw loop
│   │   ├── Camera.ts             # Viewport, pan, zoom
│   │   ├── SpriteSheet.ts        # Sprite atlas loader & frame extraction
│   │   ├── AnimationController.ts
│   │   ├── ParticleSystem.ts     # Weather, emotes, effects
│   │   ├── LightingSystem.ts     # Day/night overlay, point lights
│   │   ├── MinimapRenderer.ts
│   │   └── TileRenderer.ts       # Optimized tilemap drawing with culling
│   │
│   ├── ui/                       # Interface overlays (Preact)
│   │   ├── HUD.tsx               # Time, population, alerts
│   │   ├── InspectorPanel.tsx    # Click-on-NPC detail view
│   │   ├── WorldStats.tsx        # Population graphs, resource charts
│   │   ├── MemoryViewer.tsx      # NPC memory timeline
│   │   ├── RelationshipGraph.tsx # Social network visualizer
│   │   ├── BrainVisualizer.tsx   # Neural net activation heatmap
│   │   ├── ControlPanel.tsx      # Simulation speed, spawn, debug
│   │   └── MobileControls.tsx    # Touch-friendly interface
│   │
│   ├── data/                     # Data logging & export
│   │   ├── DataLogger.ts         # Tick-level event recording
│   │   ├── MetricsCollector.ts   # Aggregate statistics
│   │   ├── ExportManager.ts      # CSV/JSON export for offline ML
│   │   └── schemas/              # Data format definitions
│   │       ├── ActionLog.ts
│   │       ├── NeedSnapshot.ts
│   │       └── PopulationEvent.ts
│   │
│   └── utils/
│       ├── MathUtils.ts
│       ├── Pathfinding.ts        # A* with terrain cost
│       ├── NoiseGenerator.ts     # Perlin/Simplex for worldgen
│       ├── RNG.ts                # Seedable PRNG
│       └── ObjectPool.ts         # Memory-efficient entity recycling
│
├── tools/                        # Offline tooling
│   ├── sprite-packer.ts          # Combine individual sprites → atlas
│   ├── world-exporter.ts         # Dump world state for analysis
│   └── training/
│       ├── offline-trainer.py    # Train neural nets on exported data
│       ├── reward-tuner.py       # Hyperparameter search for reward signals
│       └── behavior-analyzer.py  # Cluster & classify emergent behaviors
│
└── tests/
    ├── unit/
    │   ├── ecs.test.ts
    │   ├── needs.test.ts
    │   ├── brain.test.ts
    │   └── worldgen.test.ts
    └── e2e/
        ├── simulation-stability.test.ts
        └── npc-survival.test.ts
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        GAME LOOP                            │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐               │
│  │  INPUT    │──▶│  UPDATE  │──▶│  RENDER  │               │
│  │  60 Hz   │   │  20 TPS  │   │  60 FPS  │               │
│  └──────────┘   └────┬─────┘   └──────────┘               │
│                      │                                      │
│         ┌────────────┼────────────┐                         │
│         ▼            ▼            ▼                         │
│  ┌────────────┐ ┌──────────┐ ┌──────────────┐             │
│  │   WORLD    │ │   ECS    │ │   AI ENGINE  │             │
│  │            │ │          │ │              │             │
│  │ TileMap    │ │ Entities │ │ TF.js Models │             │
│  │ Chunks    │ │Components│ │ Input Encode │             │
│  │ Biomes    │ │ Systems  │ │ Inference    │             │
│  │ Weather   │ │          │ │ Training     │             │
│  │ Resources │ │          │ │ Reward Calc  │             │
│  └────────────┘ └──────────┘ └──────────────┘             │
│         │            │            │                         │
│         └────────────┼────────────┘                         │
│                      ▼                                      │
│              ┌──────────────┐                               │
│              │  DATA LOGGER │                               │
│              │  & METRICS   │                               │
│              └──────────────┘                               │
└─────────────────────────────────────────────────────────────┘
```

**Simulation runs at 20 ticks per second** (TPS), decoupled from rendering at 60 FPS. This ensures deterministic behavior regardless of device performance. The simulation can be fast-forwarded (up to 10× speed) by running multiple ticks per frame.

---

## Core Systems

### 1. World Engine

The world is a 2D grid of tiles organized into chunks for streaming and performance.

**World Generation (Procedural):**

```
World Size:    256×256 tiles (default), scalable to 1024×1024
Chunk Size:    16×16 tiles
Tile Size:     16×16 pixels (rendered at 2×–4× zoom)
```

**Generation Pipeline:**

1. **Elevation Map** — 3-octave Simplex noise → height values 0.0–1.0
2. **Moisture Map** — 2-octave Simplex noise, offset seed → moisture 0.0–1.0
3. **Temperature Map** — Latitude gradient + noise perturbation
4. **Biome Assignment** — Whittaker diagram lookup: `(elevation, moisture, temperature) → biome`
5. **Feature Placement** — Poisson disc sampling for trees, rocks, water bodies
6. **Structure Seeding** — Spawn initial shelters, gathering spots

**Biome Types:**

| Biome | Terrain | Resources | Challenge |
|---|---|---|---|
| Meadow | Grass, flowers | Berries, herbs, wood | Low — starter area |
| Forest | Dense trees | Wood, mushrooms, game | Medium — navigation |
| Mountain | Stone, cliffs | Ore, gems, stone | High — traversal cost |
| Wetland | Marsh, shallow water | Fish, reeds, clay | Medium — movement penalty |
| Desert | Sand, cacti | Rare minerals, special herbs | High — dehydration |
| Tundra | Snow, ice | Fur animals, ice | Very High — cold damage |
| Coast | Sand, tidal pools | Fish, shells, salt | Medium — seasonal floods |

### 2. Tile & Rendering System

**Tile Layers (bottom to top):**

1. **Ground** — Base terrain texture (grass, dirt, stone, sand, water)
2. **Terrain Detail** — Flowers, pebbles, cracks, moss (autotiled)
3. **Objects** — Trees, rocks, bushes, dropped items (sortable by Y)
4. **Structures** — Walls, floors, roofs, furniture
5. **Entities** — NPCs, animals (Y-sorted with objects)
6. **Effects** — Weather particles, emotes, status indicators
7. **Lighting** — Day/night color overlay, point light sources

**Autotiling:** Uses a 47-tile blob tileset (Wang tiles) for seamless terrain transitions. Each tile stores a bitmask of its 8 neighbors to select the correct sprite frame.

**Rendering Optimizations:**
- Only draw tiles within the camera viewport + 1 tile border
- Pre-render static layers (ground, terrain detail) to offscreen canvas, redraw only on chunk change
- Entity draw list sorted by Y-position each frame for correct depth
- Object pooling for particles (max 500 active)

**Sprite Specifications:**

```
Base Tile:       16×16 px
NPC Sprite:      16×32 px (1 tile wide, 2 tiles tall)
Walk Animation:  4 frames × 4 directions = 16 frames per character
Idle Animation:  2–4 frames
Work Animation:  4–6 frames per action type
Emote Bubbles:   16×16 px pop-up icons (heart, anger, question, zzz, etc.)
```

**Color Palette:** Constrained to a 32-color palette inspired by Stardew Valley's warmth:

```
Background greens:  #4a7c2f, #6aaa3a, #8bc34a, #c5e17a
Earth tones:        #8b6914, #b8860b, #d2a85e, #e8d5a3
Water:              #2e6b8a, #4a9ec4, #7ec8e3, #b0e0f0
Stone:              #636363, #8a8a8a, #b0b0b0, #d0d0d0
Skin tones:         #f0c8a0, #d4a070, #a0724a, #6b4226
Accent warm:        #c0392b, #e67e22, #f39c12
Accent cool:        #2980b9, #8e44ad, #1abc9c
UI/Text:            #2c3e50, #ecf0f1, #ffffff
```

### 3. NPC AI & Neural Networks

This is the heart of the simulation. Each NPC has its own neural network (or shares a network with per-entity hidden state).

**Architecture: Actor-Critic with Recurrent State**

```
INPUT LAYER (≈80 neurons)
├── Self-State Vector [16]
│   ├── Hunger, Thirst, Energy, Warmth, Safety     (5 needs, normalized 0–1)
│   ├── Health, Age                                  (2 vitals)
│   ├── Emotional Valence, Arousal                   (2 emotion dims)
│   ├── Inventory fullness                           (1)
│   ├── Current action encoding                      (4 one-hot)
│   └── Time-of-day, Season                          (2 cyclical encoded)
│
├── Local Environment Vector [32]
│   ├── 5×5 tile grid around NPC                     (25 tiles × biome/resource encoding)
│   ├── Nearest resource distances (food, water, shelter, wood, stone)  (5)
│   └── Threat level, weather severity                (2)
│
├── Social Context Vector [24]
│   ├── Nearest 3 NPCs: distance, relationship, emotional state  (3 × 5 = 15)
│   ├── Population density (local)                    (1)
│   ├── Recent social interaction outcomes            (4)
│   └── Group membership / role encoding              (4)
│
├── Memory Summary Vector [8]
│   ├── Compressed episodic memory (autoencoder output)
│   └── Strongest recent memory valence & type
│
HIDDEN LAYERS
├── GRU Recurrent Layer [64]        ← Maintains temporal context across ticks
├── Dense Layer [48] + ReLU
├── Dense Layer [32] + ReLU
│
OUTPUT: ACTOR HEAD (Action Probabilities) [14 actions]
│   ├── IDLE          — Stand still, rest
│   ├── WANDER        — Random exploration
│   ├── FORAGE        — Gather nearest food resource
│   ├── DRINK         — Seek water source
│   ├── HARVEST       — Collect wood/stone/materials
│   ├── CRAFT         — Combine inventory items
│   ├── BUILD         — Place structure
│   ├── EAT           — Consume food from inventory
│   ├── SLEEP         — Find shelter, rest
│   ├── SOCIALIZE     — Approach NPC, interact
│   ├── TRADE         — Exchange items with NPC
│   ├── FLEE          — Move away from threat
│   ├── EXPLORE       — Move toward unexplored area
│   └── REPRODUCE     — Attempt mating (requires mutual consent)
│
OUTPUT: CRITIC HEAD (State Value Estimate) [1]
    └── V(s) — How good is the current state?
```

**Training Strategy:**

- **Online Learning** — Every NPC accumulates experience tuples `(state, action, reward, next_state)` in a local replay buffer (capacity: 1000).
- **Batch Updates** — Every 100 ticks, sample mini-batch of 32 experiences, perform PPO (Proximal Policy Optimization) update.
- **Shared Backbone** — All NPCs of the same "generation" share backbone weights. Per-NPC GRU hidden state provides individuality.
- **Curriculum** — World difficulty scales over time: Season 1 is mild (abundant resources, no threats). By Year 3, seasonal scarcity, predators, and social competition create pressure.

**Critical Design Lesson: Environmental Pressure**

> Early prototyping revealed that NPCs in comfortable environments converge to 100% FORAGE behavior. The reward signal must encode **diversity bonuses** and the world must present **varied pressures** that make single-strategy agents fail.

**Pressure Mechanisms:**
- Seasonal resource scarcity (winter kills crops, summer dries wells)
- Social needs that can only be met through interaction
- Tool degradation requiring crafting
- Shelter requirements in harsh weather
- Predator threats requiring group defense or flight
- Carrying capacity limits forcing trade

### 4. Needs & Motivation (Maslow's Hierarchy)

Each NPC has a needs stack based on Maslow's hierarchy. Lower needs dominate decision-making until satisfied, but the neural network learns this weighting rather than having it hard-coded.

```
Level 5: SELF-ACTUALIZATION  ──  Skill mastery, exploration, creativity
Level 4: ESTEEM              ──  Social standing, crafting achievements
Level 3: BELONGING           ──  Relationships, group membership, mating
Level 2: SAFETY              ──  Shelter, territory, threat avoidance
Level 1: PHYSIOLOGICAL       ──  Hunger, thirst, energy, warmth
```

**Need Decay Rates (per tick at 20 TPS):**

| Need | Decay/Tick | Critical Threshold | Effect at 0 |
|---|---|---|---|
| Hunger | -0.0008 | 0.2 | Health drain, eventual death |
| Thirst | -0.0012 | 0.2 | Faster health drain |
| Energy | -0.0005 | 0.1 | Forced sleep, action failure |
| Warmth | -0.0003 (winter: -0.001) | 0.15 | Health drain, movement slow |
| Safety | Context-dependent | 0.3 | Panic behavior, flee bias |
| Social | -0.0002 | 0.1 | Mood decay, isolation penalty |

**Reward Signal Design:**

```typescript
function calculateReward(npc: Entity, action: Action, result: ActionResult): number {
  let reward = 0;

  // Survival rewards (strongest signal)
  reward += (npc.needs.hunger - prevNeeds.hunger) * 2.0;      // Positive if hunger improved
  reward += (npc.needs.thirst - prevNeeds.thirst) * 2.0;
  reward += (npc.needs.energy - prevNeeds.energy) * 1.0;
  reward += (npc.needs.warmth - prevNeeds.warmth) * 1.5;

  // Death penalty
  if (npc.health <= 0) reward -= 10.0;

  // Social rewards
  reward += relationshipDelta * 0.5;
  reward += (npc.needs.social - prevNeeds.social) * 0.8;

  // Exploration & novelty bonus
  if (result.discoveredNewTile) reward += 0.3;
  if (result.newCraftRecipe) reward += 1.0;

  // Diversity bonus — penalize repeating same action
  const actionRepeatCount = npc.recentActions.filter(a => a === action).length;
  reward -= (actionRepeatCount / 10) * 0.2;

  // Efficiency — reward completing actions faster
  reward += result.success ? 0.1 : -0.05;

  return reward;
}
```

### 5. Memory & Relationship System

**Episodic Memory:**

Each NPC stores up to 200 episodic memories, each a compressed record of a significant event:

```typescript
interface EpisodicMemory {
  tick: number;
  type: 'social' | 'discovery' | 'danger' | 'achievement' | 'loss';
  location: [number, number];
  entities: EntityId[];          // Who was involved
  emotionalValence: number;     // -1.0 (terrible) to 1.0 (wonderful)
  importance: number;           // Decay multiplier; high = long-lasting
  details: Record<string, any>; // Action-specific data
}
```

**Memory Consolidation:** Every 500 ticks (simulated "sleep"), memories undergo consolidation: low-importance memories fade (importance *= 0.9), below-threshold memories are pruned, and the top-K memories are compressed into a semantic summary vector via autoencoder for the neural network input.

**Relationship Graph:**

Every NPC maintains relationship edges to other known NPCs:

```typescript
interface Relationship {
  target: EntityId;
  trust: number;        // -1.0 to 1.0
  affection: number;    // -1.0 to 1.0
  familiarity: number;  //  0.0 to 1.0 (interaction count based)
  lastInteraction: number;
  role: 'stranger' | 'acquaintance' | 'friend' | 'partner' | 'rival' | 'enemy';
  sharedMemories: MemoryId[];
}
```

Relationships decay toward neutral over time without reinforcement. The social system creates emergent friend groups, rivalries, and partnerships that influence decision-making through the social context input vector.

### 6. Resource & Economy System

**Resource Types (28 total):**

| Category | Resources |
|---|---|
| **Food (Raw)** | Berries, Mushrooms, Root Vegetables, Fish, Game Meat, Eggs, Herbs |
| **Food (Prepared)** | Cooked Meat, Stew, Bread, Dried Fish, Herbal Tea, Preserves |
| **Materials** | Wood, Stone, Clay, Reed, Fiber, Hide, Bone |
| **Refined** | Planks, Cut Stone, Bricks, Rope, Cloth, Leather |
| **Tools** | Axe, Pickaxe, Fishing Rod, Knife, Hammer, Needle |
| **Special** | Seeds, Gems, Medicinal Salve |

**Crafting System:**

```
[Wood × 2] + [Stone × 1]        → Axe
[Wood × 4] + [Rope × 2]         → Fishing Rod
[Game Meat × 1] + [Herbs × 1]   → Stew (restores hunger + warmth)
[Hide × 2] + [Needle × 1]       → Leather (warmth gear)
[Clay × 4] + [Wood × 1]         → Bricks
```

NPCs discover recipes through experimentation (random combination attempts) or by observing other NPCs crafting. Discovered recipes are stored in the NPC's semantic memory and shared through social interactions.

**Economy Emergence:** There is no hard-coded economy. Value emerges from scarcity. If an NPC has excess wood and needs food, its neural network learns that TRADE actions with food-rich NPCs produce positive rewards. Specialization emerges naturally: NPCs near forests become woodcutters, those near water become fishers.

### 7. Time & Season System

```
1 tick      = 50ms real time (at 1× speed)
1 game hour = 100 ticks  (5 seconds real time)
1 game day  = 2400 ticks (2 minutes real time)
1 season    = 28 game days (56 minutes real time)
1 year      = 4 seasons (≈3.7 hours real time)
```

**Season Effects:**

| Season | Daylight | Temperature | Resource Availability | Special |
|---|---|---|---|---|
| **Spring** | 14 hours | Moderate | Plants regrow, animals spawn | Rain common |
| **Summer** | 18 hours | Hot | Peak food, water scarcity risk | Drought events |
| **Autumn** | 12 hours | Cooling | Harvest bonus, decay begins | Storms |
| **Winter** | 8 hours | Cold | Minimal foraging, no growth | Snow, cold damage |

**Day/Night Cycle:**
- Dawn (5:00–7:00): Lighting transition, birds, NPCs wake
- Day (7:00–17:00): Full activity, bright palette
- Dusk (17:00–19:00): Lighting transition, warm tones
- Night (19:00–5:00): Reduced visibility, predator risk, sleep cycle

Lighting is implemented as a full-screen overlay with alpha blending. Point light sources (campfires, torches) punch through the darkness overlay using radial gradients.

### 8. Event & Narrative System

Events inject variety and pressure into the simulation. They are not scripted stories — they are environmental perturbations that force NPC adaptation.

**Event Categories:**

| Type | Examples | Frequency |
|---|---|---|
| **Weather** | Drought, Blizzard, Thunderstorm, Flood | Seasonal |
| **Ecological** | Animal migration, Resource depletion, Blight | Yearly |
| **Social** | Conflict, Celebration (emergent), Exile (emergent) | Emergent |
| **Discovery** | New biome found, Rare resource, Ruins | Random, decreasing |
| **Catastrophe** | Fire, Earthquake, Disease outbreak | Rare, high impact |

Events are logged in the global event timeline and displayed in the UI. The player/observer can review the full history of world events.

### 9. Evolution & Generational System

When two NPCs with high mutual affection and met physiological needs choose REPRODUCE, a new NPC is created with:

**Genetic Inheritance:**

```typescript
interface Genetics {
  // Heritable traits (crossed from parents with mutation)
  metabolismRate: number;      // How fast needs decay
  learningRate: number;        // Neural net learning rate modifier
  socialAffinity: number;      // Bias toward social actions
  explorationDrive: number;    // Bias toward exploration
  physicalStrength: number;    // Action success modifier
  resilience: number;          // Health pool / damage resistance

  // Neural weight inheritance
  parentWeights: Float32Array; // Averaged parent weights + gaussian noise
}
```

**Crossover:** Each trait is randomly selected from one parent. A 5% mutation rate applies gaussian noise to each trait. Neural network weights are averaged from both parents with small random perturbation — this is Lamarckian evolution (learned behaviors partially transfer).

**Generational Tracking:** Each NPC has a `generation` counter. The simulation tracks behavioral statistics per generation, enabling analysis of whether the population is actually "getting smarter" over time.

---

## Sprite & Art Pipeline

**Art Style Reference:** Stardew Valley — warm, round, readable at small sizes. Characters have oversized heads (40% of body height), expressive dot eyes, and 2-frame idle breathing animations.

**Sprite Sheet Format:**

```
Character Sheet:  256×256 px atlas
├── Row 0: Walk Down    (4 frames × 16×32 px)
├── Row 1: Walk Left    (4 frames × 16×32 px)
├── Row 2: Walk Right   (4 frames × 16×32 px)
├── Row 3: Walk Up      (4 frames × 16×32 px)
├── Row 4: Idle Down    (2 frames × 16×32 px)
├── Row 5: Work/Action  (6 frames × 16×32 px)
├── Row 6: Sleep        (2 frames × 16×32 px)
└── Row 7: Emotes       (8 frames × 16×16 px)

Terrain Sheet:    256×256 px atlas (16×16 per tile)
├── Grass variants    (4 tiles)
├── Dirt variants     (4 tiles)
├── Water animation   (4 frames)
├── Stone variants    (4 tiles)
├── Sand variants     (4 tiles)
├── Snow variants     (4 tiles)
├── Transition tiles  (47 blob autotile set per terrain pair)
└── Decorations       (flowers, pebbles, etc.)
```

**Creating New Sprites:**

1. Work in the constrained 32-color palette
2. Use 1px black outlines on characters (not on terrain)
3. All shadows cast bottom-right at 45°
4. Animate at 4 FPS for walking, 2 FPS for idle
5. Export as PNG sprite atlas, run through `tools/sprite-packer.ts`

---

## Data Logging & ML Pipeline

Every tick, the simulation can log structured data for offline analysis and model training.

**Log Levels:**

| Level | Data | Storage Cost |
|---|---|---|
| **Minimal** | Population count, births, deaths per day | ~1 KB/game-day |
| **Standard** | Per-NPC action log, need snapshots every 100 ticks | ~50 KB/game-day |
| **Full** | Every tick: all NPC states, all actions, all rewards | ~2 MB/game-day |

**Export Format:**

```jsonc
// Action Log Entry
{
  "tick": 48000,
  "entityId": "npc_042",
  "generation": 3,
  "action": "FORAGE",
  "success": true,
  "stateVector": [0.4, 0.7, 0.8, ...],   // 80-dim input vector
  "reward": 0.85,
  "needsBefore": { "hunger": 0.35, "thirst": 0.7, ... },
  "needsAfter":  { "hunger": 0.55, "thirst": 0.68, ... }
}
```

**Offline Training Pipeline:**

1. Run simulation with `Full` logging for N game-years
2. Export data via `tools/world-exporter.ts` → CSV/Parquet
3. Run `tools/training/offline-trainer.py` with PPO on exported trajectories
4. Analyze emergent behaviors with `tools/training/behavior-analyzer.py`
5. Load improved weights back via `public/data/pretrained-models/`

---

## Build & Run Instructions

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9
- Python 3.10+ (for offline ML tools only)

### Install & Dev Server

```bash
# Clone
git clone https://github.com/your-org/living-worlds.git
cd living-worlds

# Install dependencies
npm install

# Start dev server with hot reload
npm run dev
# → Opens at http://localhost:5173

# Run tests
npm test

# Type check
npm run typecheck

# Lint
npm run lint
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Output in dist/ — deploy to any static hosting
```

### Offline ML Tools

```bash
cd tools/training
pip install -r requirements.txt

# Train on exported data
python offline-trainer.py --data ../exports/run_001.parquet --epochs 100

# Analyze behaviors
python behavior-analyzer.py --data ../exports/run_001.parquet --clusters 8
```

---

## Deployment

The production build outputs static files deployable anywhere:

| Platform | Command / Notes |
|---|---|
| **Vercel** | `vercel --prod` (auto-detects Vite) |
| **Netlify** | Build command: `npm run build`, publish: `dist/` |
| **GitHub Pages** | Use `gh-pages` branch or GitHub Actions |
| **Cloudflare Pages** | Connect repo, build: `npm run build`, output: `dist/` |
| **Self-hosted** | Serve `dist/` with any static file server (nginx, caddy) |
| **Mobile (PWA)** | Add `manifest.json` + service worker for installable app |

**PWA Support:** Include a `manifest.json` and service worker for offline capability and home screen installation on iOS/Android. The simulation runs entirely client-side — no server required after initial load.

---

## Configuration

All tunable parameters live in `src/config.ts`:

```typescript
export const CONFIG = {
  // World
  WORLD_WIDTH: 256,
  WORLD_HEIGHT: 256,
  CHUNK_SIZE: 16,
  TILE_SIZE: 16,
  RENDER_SCALE: 3,

  // Simulation
  TICKS_PER_SECOND: 20,
  MAX_NPCS: 200,
  INITIAL_NPC_COUNT: 12,

  // AI
  BRAIN_HIDDEN_SIZE: 64,
  REPLAY_BUFFER_SIZE: 1000,
  TRAINING_BATCH_SIZE: 32,
  TRAINING_INTERVAL_TICKS: 100,
  LEARNING_RATE: 0.001,
  DISCOUNT_FACTOR: 0.99,
  MUTATION_RATE: 0.05,

  // Needs
  HUNGER_DECAY: 0.0008,
  THIRST_DECAY: 0.0012,
  ENERGY_DECAY: 0.0005,
  WARMTH_DECAY: 0.0003,
  SOCIAL_DECAY: 0.0002,

  // Time
  TICKS_PER_HOUR: 100,
  HOURS_PER_DAY: 24,
  DAYS_PER_SEASON: 28,
  SEASONS_PER_YEAR: 4,

  // Rendering
  MAX_PARTICLES: 500,
  CAMERA_ZOOM_MIN: 1,
  CAMERA_ZOOM_MAX: 6,

  // Data
  LOG_LEVEL: 'standard' as 'minimal' | 'standard' | 'full',
  MAX_MEMORIES_PER_NPC: 200,
  MEMORY_CONSOLIDATION_INTERVAL: 500,
};
```

---

## Performance Targets

| Metric | Target | Measured On |
|---|---|---|
| 200 NPCs, 20 TPS | Stable 60 FPS rendering | M1 MacBook Air, Chrome |
| 200 NPCs, 20 TPS | Stable 30 FPS rendering | Mid-range Android (2022) |
| AI inference per NPC | < 2ms | Desktop, TF.js WebGL backend |
| Full world render | < 8ms per frame | 256×256 world, 3× zoom |
| Memory per NPC | < 50 KB | Including replay buffer |
| Initial load | < 3 seconds | 10 Mbps connection |
| Save/Load | < 500ms | 200 NPCs, full state |

**Performance Strategies:**
- Batch TF.js inference: process all NPC inputs as a single tensor batch
- Stagger AI updates: not every NPC needs a decision every tick (round-robin groups of 10)
- Spatial hashing for neighbor queries instead of O(n²) scans
- Web Workers for AI training (off main thread)
- OffscreenCanvas for tile pre-rendering where supported

---

## Roadmap

### Phase 1: Foundation (Weeks 1–4)
- [ ] Project scaffolding (Vite + TypeScript + Canvas)
- [ ] ECS framework with basic components
- [ ] Procedural world generation with biomes
- [ ] Tile rendering with autotiling
- [ ] Camera (pan, zoom, touch support)
- [ ] Basic NPC sprites with walk animations
- [ ] Pathfinding (A*)
- [ ] Day/night cycle visual overlay

### Phase 2: Simulation Core (Weeks 5–8)
- [ ] Needs system with decay rates
- [ ] Resource spawning and harvesting
- [ ] Basic neural network (feed-forward, 5 actions)
- [ ] Reward signal and online PPO training
- [ ] NPC action execution loop
- [ ] Inventory system
- [ ] Save/load world state
- [ ] HUD: time, population, selected NPC info

### Phase 3: Social & Depth (Weeks 9–12)
- [ ] Memory system (episodic + consolidation)
- [ ] Relationship graph
- [ ] Social actions (socialize, trade)
- [ ] Crafting system with recipe discovery
- [ ] Building/shelter placement
- [ ] Weather system
- [ ] Season cycle with resource effects
- [ ] Full 14-action neural network with GRU

### Phase 4: Evolution & Polish (Weeks 13–16)
- [ ] Reproduction and genetic inheritance
- [ ] Generational tracking and statistics
- [ ] Event system (catastrophes, migrations)
- [ ] Inspector panel (needs, memories, brain visualizer)
- [ ] Relationship graph visualizer
- [ ] Data export pipeline
- [ ] Performance optimization pass
- [ ] Mobile-responsive UI
- [ ] PWA manifest and service worker

### Phase 5: Meta & Community (Weeks 17+)
- [ ] Offline training pipeline (Python)
- [ ] Behavior analysis tools
- [ ] Pre-trained model sharing
- [ ] World seed sharing
- [ ] Timelapse recording / replay
- [ ] Modding API (custom biomes, resources, actions)
- [ ] Community gallery of emergent behaviors

---

## Contributing

This is an AI-first simulation project. Contributions welcome in:

- **Sprite Art** — 16×16 pixel art in the 32-color palette. See `public/sprites/` for examples.
- **Neural Architecture** — Experiments with different network topologies, attention mechanisms, or world models.
- **Reward Engineering** — The hardest problem. How do you reward "interesting" behavior?
- **World Content** — New biomes, resources, crafting recipes, event types.
- **Performance** — WebGL renderer, WASM physics, SharedArrayBuffer parallelism.
- **Analysis Tools** — Better visualization of emergent behaviors, statistical tests for "intelligence."

### Development Workflow

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Write tests for new systems
4. Ensure `npm test` and `npm run typecheck` pass
5. Submit a PR with a description of what emergent behavior your change enables

---

*Built with the conviction that the most interesting games are the ones that surprise their creators.*

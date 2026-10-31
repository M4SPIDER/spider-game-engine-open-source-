# Spider Game Engine (Open Source) 🕷️🎮

🌐 **Live Web Showcase**: [https://m4spider.github.io/spider-game-engine-open-source-/](https://m4spider.github.io/spider-game-engine-open-source-/)  
**Fingerprint**: `[M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]`  
**Author**: M4SPIDER (`support@m4spider.com`)  
**Repository**: [https://github.com/M4SPIDER/spider-game-engine-open-source-](https://github.com/M4SPIDER/spider-game-engine-open-source-)  
**License**: MIT  

---

## Overview

**Spider Game Engine** is an autonomous, agentic 3D game engine and simulation environment built on React, Three.js (@react-three/fiber), and WebGL with native multi-platform support (Electron, Tauri, and Web).

It integrates directly with multimodal AI models (including Meta Llama and Muse AI) over MCP (Model Context Protocol) to synthesize, mount, verify, and run 3D games and interactive simulations entirely in real-time.

---

## 🌟 Key Features

- **Meta Muse Real-Time Voice Transcribe (3.1% WER)**: Ultra-low latency (~0.16s) live speech-to-text recognition streaming over WebSockets (`wss://api.meta.ai/v1/asr/realtime`) with native turn endpointing.
- **Spider Slash Commands**: Instant slash command palette (`/blender`, `/plan`, `/play`, `/browser`, `/clear`, `/stop`, `/help`) with keyboard navigation and autocomplete.
- **Blender Real-Time MCP Bridge**: Live bi-directional bridge on port `9876` connecting Spider Engine directly to Blender for real-time asset, geometry, and lighting sync.
- **Real-Time Dynamic JSX Engine**: Live mounting of arbitrary React Three Fiber components with instant AST compilation cache.
- **Autonomous Agentic Loop**: Built-in MCP server (`http://localhost:9287/mcp`) supporting live inspection, screenshot capture, 3D viewport verification, and autonomous game generation.
- **Full CLI Command Execution (Desktop)**: The AI agent can run native shell commands (`powershell.exe` on Windows, `/bin/bash` on Linux/Unix) with live streaming output.
- **System-Wide File Creation**: Create, edit, and organize files anywhere on the computer with automatic recursive directory scaffolding.
- **Dual Permission Governance**: Toggle between **Ask Permission (Secure Mode)** for interactive review and **Auto Mode (No Permission)** for 100% autonomous agent execution.
- **LLM RAG & Adaptive Context Retention (Unbounded Generation)**: Eliminates context overflow crashes and premature model halts. Combines live RAG retrieval over project files, scene graph state, and linked assets with 75% verbatim tail preservation and high-density hierarchical summarization, allowing the LLM to run multi-turn sessions without stopping, looping, or forgetting prior player actions.
- **100% Stable Mobile Pocket Studio (Desktop-Level Parity)**: Complete mobile engine environment featuring live 3D viewport, 44px ergonomic touch targets, full-bleed landscape mode, multi-file code editor, scene inspector, and real-time AI prompt-to-play generation.
- **The 60 FPS Minimum Rule (Zero Frame Drops on Mobile)**: Custom Vulkan-aligned shader tricks, draw-call batching, geometry pooling, and unified frame delta normalizers guarantee that every generated game maintains rock-solid 60 FPS (up to 120 FPS on high-refresh mobile displays).
- **Universal Browser & Mobile Support**: Runs in **ANY modern browser** (Chrome, Firefox, Safari, Edge, Arc, Brave) and on **mobile phones & tablets** (iOS & Android) with zero setup required.
- **Live Concurrent Chat (Chat While Streaming)**: Chat with the agent anytime *while it is working without stopping streaming* — steer, add ideas, and guide the agent mid-flight.
- **Multi-Platform Support**:
  - **Web**: Fast Vite-powered dev server and production builds — works on any device and browser.
  - **Desktop (Windows Electron)**: Desktop shell with deep OS integrations.
  - **Desktop (Windows Tauri)**: Ultra-lightweight Rust-backed native executable.
- **Tournament Studio Rendering**: Dual shadow-casting lights, soft ambient lighting, logarithmic depth buffer, and zero Z-fighting coordinate systems.
- **Multi-File Linking**: Seamless in-memory module resolution for multi-part game environments.
- **Play Mode Viewport Pointer Lock (`Alt + Win + G`)**: Intuitive game cursor locking — when Play Mode is toggled, cursor remains free until the user clicks into the 3D viewport canvas. Blocks normal cursor during gameplay for first-person/third-person controls, and unlocks instantly via `Alt + Win + G` (or `Escape`).
- **Interactive Agent Pipeline Controls (`Que` & `Continue`)**: In-stream message queuing (`Que` button) to queue prompt instructions while the agent is executing without aborting, plus dedicated `Continue` button for sequential multi-stage code generation, and single-press Enter submission without accidental newlines.
- **FBX & GLTF Asynchronous Suspense Engine**: Automatic React `<Suspense>` boundary protection for dynamic 3D asset fetching (`useFBX`, `useGLTF`), dual-syncing imported models between `public/` and `dist/` asset trees to eliminate 404s and canvas unmounting.
- **Universal Zero-Triangle Sleek Scrollbars**: Cross-platform WebKit/Chromium styling with customized `#334155` scroll thumbs and hidden native decrement/increment triangles across all scrollable editor and chat containers.
- **JSX to C++ & SPY Language Transpiler (Universal Multi-Engine Exporter)**: Zero-overhead translation of React Three Fiber JSX scene graphs, transforms, geometries, materials, procedural audio, and game loops directly into native C++20 and Spider Engine SPY script. Easily copy-paste and deploy games into Unreal Engine 5, Godot 4, Unity, or any custom Vulkan/OpenGL C++ engine.

---

## 🏛️ Engine Architecture Diagrams (8 Core Systems)

### Diagram 1: High-Level System Architecture & Cross-Platform Runtime
```mermaid
flowchart TD
    subgraph ClientPlatforms["Multi-Platform Host Environments"]
        WebBrowser["🌐 Web Browser\n(Vite + React 19 + WebGL)"]
        ElectronApp["⚡ Electron Desktop\n(Chromium + Node.js IPC + DPAPI)"]
        TauriApp["🦀 Tauri Native\n(Rust Backend + Webview)"]
    end

    subgraph UIShell["Spider Studio UI Shell"]
        SearchBar["Spider AI Search Bar\n(Camera, File Attachment, Meta Mic, Send)"]
        SlashPalette["Slash Commands Palette\n(/blender, /plan, /play, /browser)"]
        ViewportTabs["Viewport Manager\n(Game View | Viewport | Stats | Title)"]
        ConsoleLogs["Live Engine Console & Log Stream"]
    end

    subgraph CoreEngine["Core Game Engine Services"]
        DynamicJSX["Dynamic JSX AST Compiler\n(Babel Standalone + In-Memory Linker)"]
        ThreeCanvas["Three.js 3D Viewport\n(@react-three/fiber + Drei + WebGL2)"]
        MCPServer["MCP Server Bridge\n(Port 9287 HTTP JSON-RPC)"]
        BlenderBridge["Blender Real-Time Bridge\n(Port 9876 TCP Socket)"]
    end

    subgraph AICloud["AI Intelligence & Voice Cloud"]
        MetaASR["Meta Muse Real-Time ASR\n(wss://api.meta.ai/v1/asr/realtime)"]
        MetaModels["Meta Model API / LLM\n(muse-spark-1.3 / muse-wonder)"]
    end

    WebBrowser --> UIShell
    ElectronApp --> UIShell
    TauriApp --> UIShell
    UIShell --> CoreEngine
    SearchBar <--> MetaASR
    UIShell <--> MetaModels
    CoreEngine <--> MCPServer
    CoreEngine <--> BlenderBridge
```

---

### Diagram 2: Meta Muse Real-Time ASR & Voice Pipeline (3.1% WER)
```mermaid
sequenceDiagram
    autonumber
    actor User as 🎙️ User / Game Developer
    participant UI as Spider AI Search Bar
    participant AudioPipeline as Web Audio API (16kHz PCM)
    participant WS as Meta Muse WebSocket (api.meta.ai)
    participant Engine as Chat Input & Engine Context

    User->>UI: Click Microphone Button
    UI->>AudioPipeline: Initialize getUserMedia (echoCancellation, noiseSuppression)
    UI->>WS: Connect wss://api.meta.ai/v1/asr/realtime?sessionId=stream-xyz
    WS-->>UI: WebSocket OPEN
    UI->>WS: Handshake Frame { authorization: "Bearer LLM_...", audioEncoding: "PCM_16KHZ", model: "muse-voice-transcribe-1.0" }
    WS-->>UI: Handshake Acknowledged { sessionId: "stream-xyz" }

    loop Continuous Live Speech
        User->>AudioPipeline: Speaks voice instructions
        AudioPipeline->>WS: Send binary 16-bit Int16 PCM chunk (4096 samples / 250ms)
        WS-->>Engine: Receive { type: "transcript", transcript: "partial text...", final: false }
        Engine->>UI: Render live partial text directly in prompt box
    end

    User->>UI: Click Microphone Button to Stop
    UI->>WS: Send { type: "endStream" }
    WS-->>Engine: Receive { type: "transcript", transcript: "final sentence.", final: true }
    Engine->>UI: Commit final sanitized text & expand textarea
    UI->>WS: Close WebSocket cleanly (Code 1000)
    UI->>AudioPipeline: Disconnect ScriptProcessor & release microphone tracks
```

---

### Diagram 3: Autonomous Agent Closed-Loop Verification (MCP Server Architecture)
```mermaid
flowchart LR
    subgraph Agent["Autonomous AI Agent"]
        Planner["Reasoning & Planner\n(Meta Llama / Muse AI)"]
        ToolCaller["MCP Tool Dispatcher"]
    end

    subgraph MCPEndpoint["Spider Engine MCP Server (Port 9287)"]
        HTTPGateway["POST /mcp Router"]
        ActionHandler{"Tool Action Handler"}
        ListScene["listScene"]
        RenderJSX["render_jsx"]
        MoveObject["moveObject"]
        Check3D["check3DView"]
        CaptureSS["captureScreenshot"]
        RunCmd["runCommand"]
    end

    subgraph ViewportCanvas["Three.js 3D Canvas"]
        SceneGraph["Live Scene Graph\n(Hierarchy, Meshes, Lights)"]
        WebGLBuffer["WebGL Framebuffer (RGB/Depth)"]
    end

    Planner --> ToolCaller
    ToolCaller -->|HTTP JSON-RPC| HTTPGateway
    HTTPGateway --> ActionHandler
    ActionHandler --> ListScene
    ActionHandler --> RenderJSX
    ActionHandler --> MoveObject
    ActionHandler --> Check3D
    ActionHandler --> CaptureSS
    ActionHandler --> RunCmd

    RenderJSX -->|Hot Mount| SceneGraph
    MoveObject -->|Transform| SceneGraph
    SceneGraph --> WebGLBuffer
    CaptureSS -->|Extract Base64 JPG| WebGLBuffer
    WebGLBuffer -->|Multimodal Visual Feedback| Planner
```

---

### Diagram 4: Dynamic JSX AST Compilation & Hot Mount Pipeline
```mermaid
flowchart TD
    RawCode["User Chat Prompt / Agent Code File\n(React Three Fiber JSX)"] --> ASTValidator["Syntax & AST Validation Gate"]
    ASTValidator --> BabelCompiler["Babel Standalone Transpiler\n(React 19 JSX ➔ React.createElement)"]
    
    subgraph ModuleResolver["In-Memory Multi-File Resolver"]
        ImportScanner["Import Scanner\n(Detects './assets.js', './rules.js')"]
        VirtualFileSystem["In-Memory Virtual File Map\n(Resolves local imports without bundler)"]
        DependencyLinker["Dynamic Closure Dependency Linker"]
    end

    BabelCompiler --> ImportScanner
    ImportScanner --> VirtualFileSystem
    VirtualFileSystem --> DependencyLinker
    DependencyLinker --> DynamicJsxRenderer["DynamicJsxRenderer Component\n(Error Boundary + Fallback Shell)"]
    
    DynamicJsxRenderer --> Reconciliation{"Three.js Scene Reconciliation"}
    Reconciliation -->|Success| LiveCanvas["Mount into Active 3D Canvas\n(Preserve Camera & Physics State)"]
    Reconciliation -->|Error| ErrorLog["Capture Stack Trace ➔ Feed to Agent for Auto-Fix"]
```

---

### Diagram 5: Blender Real-Time MCP Bridge Architecture
```mermaid
flowchart LR
    subgraph SpiderEngineDesktop["Spider Engine (Desktop Shell)"]
        UIBridge["Blender MCP UI Toggle\n(/blender slash command)"]
        IPCMain["Electron main.js IPC\n(spider-blender-connect)"]
        TCPClient["Node.js Net Socket Client\n(Host: 127.0.0.1, Port: 9876)"]
    end

    subgraph BlenderApplication["Blender 3D Suite"]
        TCPServer["Spider Blender Add-on\n(Python Socket Server :9876)"]
        BlenderScene["Blender Active Scene\n(Collections, Objects, Shaders)"]
        DataSync["Geometry & Transform Exchanger\n(JSON Protocol)"]
    end

    UIBridge --> IPCMain
    IPCMain --> TCPClient
    TCPClient <-->|Bi-Directional TCP Stream :9876| TCPServer
    TCPServer <--> DataSync
    DataSync <--> BlenderScene
```

---

### Diagram 6: Multi-Tier State, Storage & DPAPI Encryption Architecture
```mermaid
flowchart TD
    subgraph SecurityBoundary["Operating System Security Layer"]
        DPAPI["Windows DPAPI / OS Keychain\n(CryptProtectData / CryptUnprotectData)"]
    end

    subgraph StorageTiers["Multi-Tier Storage Architecture"]
        MemoryRef["Tier 1: Volatile Memory\n(React Refs, Three.js Geometries, AST Cache)"]
        LocalStorage["Tier 2: LocalStorage\n(Encrypted API Key, Models, UI Settings)"]
        IndexedDB["Tier 3: IndexedDB Database\n(3D Project Scenes, Compiled Game History)"]
        DiskFileSystem["Tier 4: Real Disk File System\n(Desktop electron fs / tauri-fs)"]
    end

    DPAPI <-->|spider-encrypt / spider-decrypt| LocalStorage
    MemoryRef -->|Flush State| LocalStorage
    MemoryRef -->|Persist Project| IndexedDB
    IndexedDB -->|Save / Export .exe| DiskFileSystem
```

---

### Diagram 7: 3D Game Viewport & Physics Engine Pipeline
```mermaid
flowchart TD
    subgraph InputControls["Input & Camera Management"]
        KeyboardMouse["Locomotion Controls (WASD / Arrows / Space)"]
        OrbitCam["OrbitControls / First-Person / Follow Camera"]
    end

    subgraph SimulationLoop["Frame Simulation Loop (useFrame / 60 FPS)"]
        DeltaTime["Delta Time Normalizer\n(Math.min(dt, 0.033))"]
        CollisionDetection["Collision Detection & Raycasting\n(AABB, Ground Ray, Obstacle Sweep)"]
        PhysicsStep["Physics Step & Velocity Solver\n(Gravity, Friction, Momentum)"]
        AnimationBlender["Locomotion State Blender\n(Idle ➔ Walk ➔ Run ➔ Jump)"]
    end

    subgraph RenderOutput["Tournament Studio Render Pipeline"]
        LightingRig["Studio Lighting Rig\n(Sun Directional, Shadow Maps, Soft Ambient)"]
        ToneMapping["ACESFilmic ToneMapping & Color Space (sRGB)"]
        DepthBuffer["Logarithmic Depth Buffer (Zero Z-Fighting)"]
        CanvasBuffer["Rendered 3D WebGL Canvas\n(Anti-Aliasing Enabled)"]
    end

    KeyboardMouse --> DeltaTime
    OrbitCam --> DeltaTime
    DeltaTime --> CollisionDetection
    CollisionDetection --> PhysicsStep
    PhysicsStep --> AnimationBlender
    AnimationBlender --> LightingRig
    LightingRig --> ToneMapping
    ToneMapping --> DepthBuffer
    DepthBuffer --> CanvasBuffer
```

---

### Diagram 8: LLM RAG & Adaptive Context Memory Pipeline (Zero Model Halts)
```mermaid
flowchart TD
    subgraph ContextEngine["Live Engine State & Knowledge Base"]
        UserGoal["User Goal & Chat History"]
        LiveSceneGraph["Live 3D Scene Graph & Actor Tree"]
        ProjectFiles["Project Files & Modular Components\n(ArenaEnv, sound synthesizers, assets)"]
        ASTCache["AST Compilation State & Error Stack"]
    end

    subgraph RAGPipeline["Spider RAG Retrieval & Context Budgeter"]
        Retriever["Dynamic RAG Retriever\n(Fetches active JSX, relevant modules, and 3D snapshots on demand)"]
        Budgeter["Context Window Budgeter\n(Scales memory ratio adaptively across 128K / 200K / 1M token windows)"]
        VerbatimTail["75% Verbatim Tail Preserver\n(Recent conversation turns, code, and tool payloads kept 100% intact)"]
        HeadSummarizer["Semantic Head Summarizer\n(Distills older background turns into high-density memory bullets)"]
    end

    subgraph LLMExecution["Unbounded LLM Execution"]
        CuratedPrompt["Curated Context-Rich Agent Prompt\n(Pinned root goal + summarized history + verbatim tail + RAG context)"]
        ModelInference["LLM Inference Loop (Meta Llama / Muse)\n(Zero Stalls · No Forgetfulness · 25-60 Turns Headroom)"]
        ToolAction["Tool Execution\n(render_jsx, runCommand, moveObject, check3DView)"]
    end

    ContextEngine --> Retriever
    Retriever --> Budgeter
    Budgeter --> VerbatimTail
    Budgeter --> HeadSummarizer
    VerbatimTail --> CuratedPrompt
    HeadSummarizer --> CuratedPrompt
    CuratedPrompt --> ModelInference
    ModelInference --> ToolAction
    ToolAction --> ContextEngine
```

---

## 📱 100% Stable Mobile Pocket Studio (Desktop-Level Parity)

Spider Game Engine features a completely unified, **100% stable Mobile Pocket Studio** that delivers the exact same power, stability, and capabilities as the desktop suite, redesigned from the ground up for one-handed mobile creation and gaming.

### ⚡ The 60 FPS Minimum Rule
Our core engine philosophy mandates that **no generated 3D game drops below 60 FPS on mobile devices**. To achieve this across phones and tablets (including budget and flagship hardware), we implemented dedicated Vulkan and WebGL pipeline optimizations:

1. **Vulkan-Aligned Shader Batching & Draw Call Pruning**:
   - Reduces mobile GPU state changes by batching dynamic geometries and merging shared materials.
   - Eliminates shader recompilation stalls during combat, explosions, and particle spawns.
2. **Aggressive Frame Delta Normalization**:
   - Normalized physics delta time (`Math.min(dt, 0.033)`) prevents mobile physics jitter, tunneling, and lag spikes during intense wave spawns.
3. **Logarithmic Depth Buffer & Zero Z-Fighting**:
   - Ensures mobile GPUs do not suffer from micro-stutters or flickering geometry on wide open arenas.
4. **Adaptive Widescreen Landscape Engine**:
   - True full-bleed edge-to-edge canvas rendering that fills 100% of widescreen mobile displays without letterboxing, cream bars, or aspect ratio distortion.
5. **Ergonomic Virtual Touch Controller**:
   - Analog virtual stick with 44px thumb targets that dispatches both `window.__spiderVirtualTouch` and synthetic `KeyboardEvent` (`WASD` / Arrows) so any AI-generated game steers smoothly out of the box.
6. **Smart Safe-Area & Notch Clearance**:
   - Camera cutouts and gesture bars are respected via CSS `env(safe-area-inset-*)`, while HUD elements automatically dock at the top on phones to leave the bottom thumb zone 100% clear.

---

## 🧠 LLM RAG & Adaptive Context Memory (Zero Context Halts)

Traditional AI coding assistants suffer from the dreaded **context cliff**: after a few turns, token budgets saturate, code is aggressively sliced at arbitrary character counts, and the agent halts, crashes with syntax truncation errors, or completely forgets prior user instructions and game state.

Spider Game Engine solves this with a native **LLM RAG & Adaptive Context Memory Architecture** that guarantees unbounded, continuous multi-turn game creation:

### 1. 🔍 On-Demand RAG Retrieval Over Live Engine State
- **Live Scene & File Indexing**: The agent does not blindly cram entire repositories into prompt tokens. Instead, the RAG retriever dynamically indexes and fetches the active JSX component, relevant modular libraries (`ArenaEnv.jsx`, audio synthesizers, chess engines), 3D asset catalogs, and the live scene graph on demand.
- **Precision Grounding**: Ensures the LLM is always anchored to the ground-truth state of the 3D viewport and file system, eliminating hallucinations and disconnected code synthesis.

### 2. 🛡️ 75% Verbatim Tail Preservation (No Premature Truncation)
- **Zero Loss for Active Context**: Exactly 75% of the memory budget is reserved exclusively for the most recent conversation turns and tool observations, keeping code, instructions, and feedback **100% verbatim**.
- **No Premature Slicing**: Code action arguments and tool outputs are preserved intact up to 10,000 characters rather than being crudely clipped at 500 characters.

### 3. 📝 Hierarchical Semantic Summarization
- **High-Density Bullet Digests**: When conversation history spans dozens of turns, older background turns are systematically digested into structured, high-density bullet summaries (`• User: ...`, `• Assistant: ...`).
- **Pinned Root Objective**: The player's root game concept, architecture rules, and core gameplay constraints remain permanently pinned at the top of the context so the model never drifts off-course.

### 4. 🚀 Scaled Headroom (25 to 60 Turns)
- Observation limits (4,000 to 16,000 characters) and turn headroom (25 to 60 turns) automatically scale according to the active model context window (128K, 200K, or 1M tokens).
- **The Result**: The LLM agent can build, test, iterate, verify, and polish complex 3D games across dozens of consecutive turns **without stopping, stalling, or losing progress**.

---

## ⚡ Full Agent Capabilities & System Access

Spider Game Engine grants AI agents complete developer execution capabilities with configurable governance:

### 1. 🎙️ Meta Muse Real-Time Speech Perception (3.1% WER)
- **Direct Neural Streaming**: Streams microphone audio packets in real-time to Meta’s `muse-voice-transcribe-1.0` model via WebSockets (`wss://api.meta.ai/v1/asr/realtime`).
- **Low Latency & High Precision**: ~0.16-second latency with 3.1% Word Error Rate.

### 2. 🖥️ Real CLI Command Execution (`runCommand`)
- **Native Shell Power**: In desktop mode (Electron / Tauri), the AI agent can execute arbitrary shell commands directly on the host computer (`powershell.exe` on Windows, `/bin/bash` / `zsh` on Linux/Unix).
- **Live Output Streaming**: Captures real-time `stdout` and `stderr` streams directly into the engine's debug console and agent reasoning context.
- **Workflow Automation**: Build projects, run package managers (`npm install`, `cargo build`), trigger git operations, compile standalone executables, and run diagnostic scripts automatically.

### 3. 📂 Deep File System Access (Create Files Anywhere on Computer)
- **System-Wide File Creation**: Create, read, edit, and organize files in any directory or path across the computer with automatic recursive directory creation (`fs.mkdirSync`).
- **Asset & Project Pipelines**: The agent can scaffold complete multi-folder game structures (`src/`, `assets/`, `audio/`, `models/`), write React Three Fiber components, convert textures, and link modular imports on the fly.
- **File Watching & Live Hot-Reloading**: Real-time folder watching instantly updates the in-memory 3D runtime whenever files change on disk.

### 4. 🛡️ Dual Permission & Security Modes

You have 100% control over how the AI agent interacts with your system:

| Mode | Behavior | Best Used For |
| :--- | :--- | :--- |
| **🛡️ Ask Permission (Secure Mode)** | **Interactive Approval Gate**: The agent pauses and displays an approval card before running CLI commands, creating files, or making critical scene edits. You can review the exact command or file path and click **Allow** or **Deny**. | Safe development, critical project environments, and step-by-step code review. |
| **⚡ Auto Mode (No Permission / Autonomous)** | **Zero-Friction Autonomy**: The agent executes CLI commands, creates files anywhere, and mounts 3D scenes automatically without pausing for permission. | High-speed prototyping, autonomous overnight game development, and unattended CI/agent loops. |

---

## 🚀 Exporting & Copy-Pasting to Unreal Engine, Godot, Unity & Custom Engines

Spider Game Engine includes a native **JSX to C++ & SPY transpiler** and universal exporter. You can export any generated game or scene in **one click** as:
- **`.jsx`**: React Three Fiber / WebGL game source.
- **`.cpp`**: Native C++ source code with standard vectors, math, and game loop.
- **`.spy`**: Declarative native Spider Engine script.
- **`CMakeLists.txt`**: C++20 Vulkan build configuration.

### How to Download from Spider Studio
- **Desktop Studio**: Click **`Export ▾`** in the top viewport bar or click **`JSX`**, **`C++`**, or **`SPY`** in Code Mode.
- **Pocket Studio Mobile**: Tap `Wand (🪄)` or File Menu → tap **Download JSX**, **Export Native C++**, or **Export SPY Script**.

---

### 1. 🎮 Unreal Engine 5 (UE5 / UE4)

#### Option A: Native C++ Actor / Character
1. In your Unreal Engine project, create a new C++ class inheriting from `AActor` (or `APawn` / `ACharacter`), e.g., `ASpiderGameActor`.
2. Open `SpiderGameActor.h` and declare your component pointers and state variables from the exported `.cpp`:
   ```cpp
   #pragma once
   #include "CoreMinimal.h"
   #include "GameFramework/Actor.h"
   #include "SpiderGameActor.generated.h"

   UCLASS()
   class YOURGAME_API ASpiderGameActor : public AActor {
       GENERATED_BODY()
   public:
       ASpiderGameActor();

   protected:
       virtual void BeginPlay() override;

   public:
       virtual void Tick(float DeltaTime) override;

       UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
       UStaticMeshComponent* HeroMesh;

       UPROPERTY(EditAnywhere, BlueprintReadWrite, Category = "Spider Engine")
       float MoveSpeed = 800.0f;

       UPROPERTY(VisibleAnywhere, Category = "Spider Engine")
       int32 Score = 0;
   };
   ```
3. Open `SpiderGameActor.cpp` and copy the logic:
   - **Scene Initialization (`Init` in exported C++)** -> Place in `BeginPlay()`:
     ```cpp
     void ASpiderGameActor::BeginPlay() {
         Super::BeginPlay();
         // Setup positions and materials matching exported scene
     }
     ```
   - **Game Loop (`Update(float dt)` / `useFrame`)** -> Place in `Tick(float DeltaTime)`:
     ```cpp
     void ASpiderGameActor::Tick(float DeltaTime) {
         Super::Tick(DeltaTime);

         // Direct 1:1 match with Spider Engine's exported Update(dt) loop:
         FVector Pos = GetActorLocation();
         // Apply directional movement, rotation, and math translated from Math.sin / std::sin
         SetActorLocation(Pos);
     }
     ```

#### Option B: Blueprints
- If you prefer Blueprints, map the exported variables to Actor variables, and recreate the `Update(dt)` logic in your **Event Tick** graph.

---

### 2. 🤖 Godot Engine 4 (GDScript / C# / GDExtension)

#### Option A: GDScript (Instant Copy-Paste)
The exported JSX / SPY logic maps directly to a `Node3D` in Godot:
1. Create a `Node3D` scene (`SpiderGame.tscn`).
2. Add child nodes matching the exported meshes (`MeshInstance3D` with `BoxMesh`, `SphereMesh`, or `PlaneMesh`).
3. Attach a script (`SpiderGame.gd`) and paste the state and loop logic:
   ```gdscript
   extends Node3D

   # 1. State variables mapped from useState()
   var score: int = 0
   var hero_pos: Vector3 = Vector3(0, 0.5, 0)
   @export var speed: float = 8.0

   func _ready() -> void:
       # Initialize scene nodes matching Spider Engine init block
       pass

   func _process(delta: float) -> void:
       # Direct 1:1 mapping from exported Update(dt) / useFrame:
       var dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
       hero_pos.x += dir.x * speed * delta
       hero_pos.z += dir.y * speed * delta
       
       if has_node("HeroMesh"):
           $HeroMesh.position = hero_pos
   ```

#### Option B: GDExtension (Native C++)
- Drop the exported `_native.cpp` into your GDExtension project directory.
- Register class methods in `ClassDB::bind_method` and connect `Update(float dt)` directly to `_process(double delta)`.

---

### 3. 🎯 Unity (Unity 2022+ / C# / URP / HDRP)

1. Create a new C# script `SpiderGameController.cs` and attach it to a GameObject in your Unity scene:
   ```csharp
   using UnityEngine;

   public class SpiderGameController : MonoBehaviour {
       [Header("State (from Spider Engine useState)")]
       public int score = 0;
       public float moveSpeed = 8.0f;
       public Transform heroTransform;

       void Start() {
           // Scene setup matching exported Spider Engine scene
       }

       void Update() {
           float dt = Time.deltaTime;
           
           // Direct 1:1 match with Spider Engine's exported Update(dt) / useFrame:
           float moveX = Input.GetAxis("Horizontal");
           float moveZ = Input.GetAxis("Vertical");
           
           if (heroTransform != null) {
               heroTransform.position += new Vector3(moveX, 0, moveZ) * moveSpeed * dt;
           }
       }
   }
   ```
2. **Native C++ Plugin in Unity**: You can also compile the exported `_native.cpp` into a native `.dll` (Windows) or `.so` (Linux/Android) and invoke it from C# via `[DllImport]`.

---

### 4. ⚡ Custom Engines (Vulkan, OpenGL, DirectX, Raylib, O3DE, Flax)

The exported C++ file is clean, modern **C++20** that does **NOT** depend on WebGL, Electron, or JavaScript engines:
- Uses standard `<cmath>`, `<vector>`, `<string>`, and GLM (`glm::vec3`, `glm::vec4`).
- **CMake Support**: Build instantly using the exported `CMakeLists.txt`:
  ```bash
  mkdir build && cd build
  cmake ..
  cmake --build . --config Release
  ```
- **Raylib / Custom Game Loop**: Simply call `scene.Init()` in your engine's setup phase, and call `scene.Update(GetFrameTime())` inside your main frame loop (`while (!WindowShouldClose())`).

---

### 5. 🕷️ Upcoming Spider Game Engine Native Runtime (SPY Language)

For maximum performance without browser or Electron overhead, games exported as `.spy` run directly on the upcoming Spider Game Engine C++ native runtime:
```bash
spider-engine run Game.spy --vulkan
```

---

## Quick Start

### 1. Web Dev Server (Desktop & Mobile on Same Wi-Fi)
```bash
npm install
npm run dev

# Host to local Wi-Fi for phones & tablets:
npm run dev -- --host
```
Open [http://localhost:5173](http://localhost:5173) in Chrome, Edge, Safari, Firefox, or on your mobile phone via `http://<your-local-ip>:5173`.

### 2. Electron Desktop App
```bash
npm run electron:dev
# or for pre-built:
npm run electron:built
```

### 3. Tauri Desktop App
```bash
npm run tauri:dev
```

---

## MCP Server & Autonomous Agent Integration

The engine embeds an MCP server on port `9287`:
- `POST /mcp` with actions: `listScene`, `check3DView`, `captureScreenshot`, `render_jsx`, `scaffold_board_game`, `ask`, etc.
- Seamlessly connects AI coding agents directly to the 3D canvas for multimodal closed-loop verification.

---

## Authors & Provenance

Created and maintained by **M4SPIDER**.  
Email: **support@m4spider.com**  
Contributors & Lineage: **Vivek**,**dimka**
Every source file contains the provenance watermark:
`[M4-SPIDER-GENESIS-FINGERPRINT-0x535049444552]`

---

## ⚠️ Disclaimer & Safety Notice

> **NOTE**: All games, scripts, simulations, and dynamic code generated or executed using Spider Game Engine (including AI-generated code from Meta Llama, Muse AI, or external scripts) are **created and played strictly at your own risk**. The developers, contributors, and authors assume zero liability or responsibility for game outcomes, hardware/software performance, or content created by users or autonomous agents.

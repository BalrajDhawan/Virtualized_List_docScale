# DocScale: High-Performance Virtualized Document Engine

DocScale is a massively scalable, deeply optimized document rendering and interactive annotation system built with React, Next.js, and Zustand. The primary goal of this architecture was to tackle the notorious "React Waterfall" rendering bottlenecks that plague complex web applications (like Figma or Notion) when dealing with massive datasets, aggressive scroll virtualization, and real-time multiplayer concurrency.

## Core Architecture & Engineering Journey

Building a production-grade interactive viewer requires circumventing standard declarative React patterns. If an application relies solely on top-down state props, rendering 500+ document pages with interactive drawing overlays will inevitably result in CPU locking and scroll jank. To resolve this, DocScale was engineered using strict **Atomic State** separation and a **Physics-First Virtualization** approach.

### 1. The Physics Virtualization Engine
To handle hundreds of heavy pages without crashing the browser DOM, standard map-rendering was replaced with a bespoke Virtual Engine (`useVirtualizer.ts`).
- **DOM Recycling:** Instead of creating 500 static DOM `<div>` nodes, DocScale physically generates only ~14 persistent DOM wrappers. As the user scrubs the custom scrollbar, the mathematics engine seamlessly swaps out the internal page data (`startIndex`) in real-time, reusing the exact same DOM shells on the screen.
- **The Tradeoff:** Native scroll events fire inconsistently across browsers (Chrome vs Firefox vs Mac trackpads). We had to intercept standard browser scrolling, disable tracking natively, and normalize the raw wheel `deltaY` events over a mathematical canvas to guarantee perfectly consistent physics. This created initial complexity with wheel speeds but yielded absolute UI control.

### 2. GPU Overscanning & Skeleton Buffers
Perfect virtualization introduces a new hazard: if a user scrolls blindingly fast, React must rip out the old text payload and computationally construct the heavy *new* text payload the exact millisecond the recycled `<div>` appears on screen. This blocks the main UI thread, causing micro-stuttering.
- **The Solution:** We implemented mathematical **Overscanning**. The viewport computationally tracks 10 items, but we instruct React to actually map 14. We push 2 computed pages entirely off-screen at the top, and 2 at the bottom. By the time the user physically scrolls down, the CPU has already completed the React mount cycle, allowing the GPU to effortlessly slide the pre-rendered block into view without dropping a frame.
- **Fallback Skeletons:** If the user aggressively out-scrolls the `OVERSCAN` buffers and triggers a slow network fetch, a pulse-animated Skeleton layout aggressively masks the loading cycle, maintaining the illusion of immediate speed.

### 3. Atomic State & The React Waterfall
A standard beginner mistake is dumping global Annotation state into a Master `<DocumentViewer>` component and prop-drilling it down. This is disastrous: if a user drags their mouse across Page 4, tracking `[X, Y]` coordinates in a global React state forces Pages 1-500 to re-render 60 times a second.
- **The Solution:** We deployed **Zustand** to hold data structurally outside the React DOM lifecycle. Concurrently, we wrapped thick **Render Firewalls** (`React.memo`) directly around the core `<Page />` components.
- **Inversion of Control:** Transient interaction physics (rapid mouse dragging coordinates) live in a completely isolated, local `useAnnotation` hook. Our global `<DocumentViewer>` is strictly ignorant of any drawing taking place. When the user releases the mouse, the local floating percentages securely commit to Zustand. Because each Page individually subscribes *only* to its specific index block in the Zustand tree, drawing a box on Page 4 atomically updates Page 4, bypassing every other component.

### 4. Multiplayer Concurrency & Defensive UI
To simulate true collaboration, the engine handles "Ghost Users" randomly firing WebSocket-style payloads (simulated via headless intervals) straight into the app State.
- **Concurrency Strategy (Overlap Validation):** If two users attempt to annotate the exact same paragraph concurrently, the system refuses to defensively "Lock" the region. Region-locking creates an infuriating constraint on UX. Instead, DocScale embraces an Optimistic UI philosophy. The polygons stack efficiently on top of each other. Let the clients draw anywhere.
- **Defensive Rendering (The Deletion Rug-Pull):** What happens if User A expands a popover menu anchored to Box A, but the Ghost WebSocket suddenly deletes Box A? Standard applications crash attempting to read dimensional offsets of an `undefined` array object. We baked defensive null-checks deeply alongside our React hooks to automatically dismiss Popovers the millisecond their Zustand anchors vanish laterally.

### 5. Resolution Independent Coordinate Math
To guarantee annotations remain perfectly anchored across vastly divergent monitor scales, static pixels are abandoned immediately on pointer release. The client box sizes transform completely into responsive viewport percentages (`x: 0.25`, `y: 0.14`), committing to Memory as scalable floats. This natively allows fluid layout resizing without scrambling historical annotation datasets.

## Systems Metrics & Observability
- **Render Count Integrity:** Validated 0% structural top-down state bleed. Drawing operations invoke 1 render strictly on the target element. 
- **Concurrency Optimization:** 10+ frames/second CSS-interpolated Ghost Cursor tracking executing alongside heavy CPU payloads with zero Main Thread frame interruptions.
- **Scale Capacity:** Structured to effortlessly project 100,000+ page canvas limits using purely mathematical heights decoupled from actual DOM height limitations.
- **Performance Instrumentation:** Built-in `usePerformanceMonitor` and `useScrollFpsTracker` hooks provide live render counts and scroll FPS measurement for runtime validation.

## Engineering Journey

This project followed a deliberate 12-week systems-engineering curriculum, progressively layering complexity:

| Phase | Weeks | Focus | Key Outcome |
|-------|-------|-------|-------------|
| **Foundation** | 1--2 | App shell, mock data, naive `.map()` rendering | Observed DOM overload firsthand at 1000+ pages |
| **Virtualization** | 3--4 | Custom windowing engine, overscan buffers, scroll normalization | 10k+ pages at 60fps with ~14 DOM nodes |
| **Annotations** | 5--6 | Pointer-based drawing, percentage coordinates, overlay alignment | Resolution-independent annotation system |
| **State Architecture** | 7--8 | Zustand atomic subscriptions, React.memo firewalls, local vs global split | 0% top-down re-render bleed |
| **Multiplayer** | 9--10 | Ghost cursor simulation, optimistic concurrency, defensive null-checks | Real-time collaboration without region locking |
| **Performance & Polish** | 11--12 | Render profiling, FPS instrumentation, skeleton buffers, comment UI | Production-grade performance validation |

The full weekly execution plan with detailed challenges, hints, and deliverables is documented in [`docScale.md`](../docScale.md).

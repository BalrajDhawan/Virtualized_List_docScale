# DocScale: High-Performance Virtualized Document Engine

DocScale is a massively scalable, deeply optimized document rendering and interactive annotation system built with React, Next.js, and Zustand. The primary goal of this architecture was to tackle the notorious "React Waterfall" rendering bottlenecks that plague complex web applications (like Figma or Notion) when dealing with massive datasets, aggressive scroll virtualization, and real-time multiplayer concurrency.

## Core Architecture & Engineering Journey

Building a production-grade interactive viewer requires circumventing standard declarative React patterns. If an application relies solely on top-down state props, rendering 500+ document pages with interactive drawing overlays will inevitably result in CPU locking and scroll jank. To resolve this, DocScale was engineered using strict **Atomic State** separation and a **Physics-First Virtualization** approach.

### 1. The Physics Virtualization Engine
To handle hundreds of heavy pages without crashing the browser DOM, standard map-rendering was replaced with a bespoke Virtual Engine (`useVirtualizer.ts`).
- **DOM Recycling:** Instead of creating 500 static DOM `<div>` nodes, DocScale physically generates only a derived number of persistent DOM wrappers computed as `Math.ceil(viewportHeight / ITEM_HEIGHT) + OVERSCAN * 2`. For the default 80vh viewport on a 1080p display (~864px), this yields `ceil(864 / 732) + 4 = 6` wrapper nodes — regardless of whether the document has 10 pages or 100,000. As the user scrubs the custom scrollbar, the mathematics engine seamlessly swaps out the internal page data (`startIndex`) in real-time, reusing the exact same DOM shells on the screen.
- **The Tradeoff:** Native scroll events fire inconsistently across browsers (Chrome vs Firefox vs Mac trackpads). We intercept standard browser scrolling with a `passive: false` wheel listener, disable tracking natively, and normalize the raw wheel `deltaY` events over a mathematical canvas to guarantee perfectly consistent physics. This created initial complexity with wheel speeds but yielded absolute UI control.

### 2. GPU Overscanning & Skeleton Buffers
Perfect virtualization introduces a new hazard: if a user scrolls blindingly fast, React must rip out the old text payload and computationally construct the heavy *new* text payload the exact millisecond the recycled `<div>` appears on screen. This blocks the main UI thread, causing micro-stuttering.
- **The Solution:** We implemented mathematical **Overscanning** with a configurable `OVERSCAN` constant (default: 2). The viewport renders `visibleCapacity + OVERSCAN * 2` pages, pushing computed pages entirely off-screen at the top and bottom. By the time the user physically scrolls down, the CPU has already completed the React mount cycle, allowing the GPU to effortlessly slide the pre-rendered block into view without dropping a frame.
- **Velocity-Gated Skeletons:** When scroll velocity exceeds a threshold (>500px/s), recycled pages show a pulse-animated Skeleton layout to mask any async payload latency. At normal scroll speeds, content renders immediately — no artificial delays.

### 3. Atomic State & The React Waterfall
A standard beginner mistake is dumping global Annotation state into a Master `<DocumentViewer>` component and prop-drilling it down. This is disastrous: if a user drags their mouse across Page 4, tracking `[X, Y]` coordinates in a global React state forces Pages 1-500 to re-render 60 times a second.
- **The Solution:** We deployed **Zustand** to hold data structurally outside the React DOM lifecycle. Concurrently, we wrapped thick **Render Firewalls** (`React.memo`) directly around the core `<Page />` components. Selectors use stable module-level empty arrays (`EMPTY_ANNOTATIONS`, `EMPTY_CURSORS`) as fallbacks to prevent `Object.is` failures from allocating new `[]` on every store update.
- **Inversion of Control:** Transient interaction physics (rapid mouse dragging coordinates) live in a completely isolated, local `useAnnotation` hook. Our global `<DocumentViewer>` is strictly ignorant of any drawing taking place. When the user releases the mouse, the local floating percentages securely commit to Zustand. Because each Page individually subscribes *only* to its specific index block in the Zustand tree, drawing a box on Page 4 atomically updates Page 4, bypassing every other component.
- **Selection Isolation:** `selectedAnnotationId` is consumed inside a dedicated `<AnnotationItem>` child component, not at the Page level. Clicking any annotation re-renders only the previously-selected and newly-selected items — not every mounted Page.

### 4. Multiplayer Concurrency & Defensive UI
To simulate true collaboration, the engine handles "Ghost Users" firing simulated WebSocket-style payloads straight into the app State. Position writes occur at 10Hz with CSS transition interpolation (`transition-all duration-100 ease-linear`) providing smooth GPU-interpolated motion between ticks — a low-bandwidth network pattern that decouples visual fluidity from JavaScript execution cadence.
- **Concurrency Strategy (Overlap Validation):** If two users attempt to annotate the exact same paragraph concurrently, the system refuses to defensively "Lock" the region. Region-locking creates an infuriating constraint on UX. Instead, DocScale embraces an Optimistic UI philosophy. The polygons stack efficiently on top of each other. Let the clients draw anywhere.
- **Defensive Rendering (The Deletion Rug-Pull):** What happens if User A expands a popover menu anchored to Box A, but the Ghost WebSocket suddenly deletes Box A? Standard applications crash attempting to read dimensional offsets of an `undefined` array object. We baked defensive null-checks deeply alongside our React hooks to automatically dismiss Popovers the millisecond their Zustand anchors vanish laterally.

### 5. Resolution Independent Coordinate Math
To guarantee annotations remain perfectly anchored across vastly divergent monitor scales, static pixels are abandoned immediately on pointer release. The client box sizes transform completely into responsive viewport percentages (`x: 0.25`, `y: 0.14`), committing to Memory as scalable floats. This natively allows fluid layout resizing without scrambling historical annotation datasets.

## Systems Metrics & Observability
- **Render Count Integrity:** Validated 0% structural top-down state bleed. Drawing operations invoke 1 render strictly on the target element.
- **Concurrency Optimization:** 10Hz store writes with CSS-interpolated ghost cursor tracking executing alongside heavy CPU payloads with zero Main Thread frame interruptions.
- **Scale Capacity:** Structured to project 100,000+ page canvas limits using purely mathematical heights decoupled from actual DOM height limitations.
- **Live Debug HUD:** Append `?debug=1` to the URL to surface a real-time overlay showing scroll FPS, visible index range, active DOM node count, and total annotations. The HUD is lazy-loaded and fully tree-shaken from production bundles when the flag isn't set.

### Scaling Beyond 100k Pages: Segmented Scrollbar Mode

The virtualization math has no inherent ceiling — pages exist as coordinates, not DOM. At extreme scale (>100k pages), a single continuous thumb track means each pixel represents many pages of travel, which is the right behavior for power-scrolling but trades off fine-grained page-by-page scrubbing.

For workloads that need both, a segmented scrollbar mode is a drop-in extension: the thumb track is divided into N buckets (e.g., one per chapter or per 1k-page block), with a secondary fine-grain track active inside the focused bucket. This is deliberately scoped out of v1 — it's straightforward to layer on top of the existing `virtualScrollTop` / `theoreticalTotalHeight` primitives when the use case calls for it.

## Engineering Journey

This project followed a deliberate 12-week systems-engineering curriculum, progressively layering complexity:

| Phase | Weeks | Focus | Key Outcome |
|-------|-------|-------|-------------|
| **Foundation** | 1--2 | App shell, mock data, naive `.map()` rendering | Observed DOM overload firsthand at 1000+ pages |
| **Virtualization** | 3--4 | Custom windowing engine, overscan buffers, scroll normalization | 10k+ pages at 60fps with derived DOM node count |
| **Annotations** | 5--6 | Pointer-based drawing, percentage coordinates, overlay alignment | Resolution-independent annotation system |
| **State Architecture** | 7--8 | Zustand atomic subscriptions, React.memo firewalls, local vs global split | 0% top-down re-render bleed |
| **Multiplayer** | 9--10 | Ghost cursor simulation, optimistic concurrency, defensive null-checks | Real-time collaboration without region locking |
| **Performance & Polish** | 11--12 | Render profiling, FPS instrumentation, velocity skeletons, comment UI | Production-grade performance validation |

The full weekly execution plan with detailed challenges, hints, and deliverables is documented in [`docScale.md`](../docScale.md).

# Drag-and-Drop Implementation with @dnd-kit — Junior Developer Guide

## What is `@dnd-kit`?

`@dnd-kit` is an industry-standard React library for building drag-and-drop interfaces. It's:
- **Accessible** — works with keyboards and screen readers
- **Flexible** — doesn't enforce a specific UI structure
- **Modular** — you pick only the features you need

Think of it as a **choreographer** that manages *who's dragging*, *where they're hovering*, and *what to do when they drop*.

---

## High-Level Architecture

The drag-and-drop system has three layers:

```
┌─ KanbanBoard (The Conductor)
│  └─ DndContext (Drag orchestration)
│     ├─ KanbanColumn (Drop zones)
│     │  └─ DraggablePostCard (Draggable items)
│     └─ DragOverlay (Ghost card following cursor)
```

- **KanbanBoard**: Top-level component that wraps everything in `<DndContext>`
- **KanbanColumn**: Each column is a *drop zone* using `useDroppable()`
- **DraggablePostCard**: Each card is *draggable* using `useSortable()`
- **DragOverlay**: Shows a preview of what you're dragging

---

## 1. KanbanBoard — The Main Orchestrator

```typescript
export function KanbanBoard({ campaignName, posts: initialPosts }) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [activeId, setActiveId] = useState<string | null>(null);
```

**Key state:**
- `posts` — the current list of posts (local state for instant feedback)
- `activeId` — which post is currently being dragged (used for the ghost card overlay)

### Setting up the Drag Context

```typescript
const sensors = useSensors(
  useSensor(PointerSensor, {
    distance: 8,  // Drag only if you move 8px (prevents accidental drags)
  })
);

return (
  <DndContext
    sensors={sensors}
    collisionDetection={closestCorners}  // Calculate if hovering over a droppable
    onDragStart={handleDragStart}
    onDragOver={handleDragOver}
    onDragEnd={handleDragEnd}
  >
    {/* Columns and cards go here */}
  </DndContext>
);
```

**What this does:**
- `sensors` — detects pointer/mouse movements. `distance: 8` means you must drag 8px before it counts (UX best practice)
- `collisionDetection: closestCorners` — determines *which column you're over* during the drag
- Three event handlers track the drag lifecycle

### Drag Events

#### 1. `onDragStart` — User starts dragging

```typescript
const handleDragStart = (event: DragStartEvent) => {
  const { active } = event;
  setActiveId(active.id as string);  // "Which card am I dragging?"
};
```

This captures which post ID is being dragged, so we can show it in the overlay.

#### 2. `onDragOver` — User is dragging (fires continuously)

```typescript
const handleDragOver = (event: DragOverEvent) => {
  const { active, over } = event;
  const activePost = posts.find((p) => p.id === active.id);

  if (over && validStatuses.includes(over.id)) {
    const newStatus = over.id as PostStatus;
    
    // Optimistic update: change status instantly in local state
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === activePost.id ? { ...p, status: newStatus } : p
      )
    );
  }
};
```

**What this does:**
- `active` = the post you're dragging
- `over` = the column you're hovering over (determined by `collisionDetection`)
- We immediately update the local state so the card *appears* to move to the new column
- This is **optimistic UI** — instant feedback without waiting for the server

#### 3. `onDragEnd` — User drops the card

```typescript
const handleDragEnd = async (event: DragEndEvent) => {
  const { active, over } = event;
  setActiveId(null);  // Hide the overlay

  if (newStatus !== activePost.status) {
    try {
      // Call the API to persist the change
      const result = await updatePostStatusAction(campaignId, activePost.id, newStatus);
      
      if (result.success) {
        toast.success("Post moved successfully");
        router.refresh();  // Re-fetch from server
      } else {
        // Revert if server rejected
        setPosts(initialPosts);
        toast.error("Failed to move post");
      }
    } catch (error) {
      setPosts(initialPosts);  // Revert on error
      toast.error("Failed to move post");
    }
  }
};
```

**What this does:**
- If the post actually changed columns, call the API
- If successful, refresh the page (re-fetch all posts)
- If failed, revert to the original state
- Either way, show a toast notification

---

## 2. KanbanColumn — The Drop Zone

```typescript
export function KanbanColumn({ status, posts }) {
  const config = getColumnConfig(status);
  const postsByStatus = posts?.filter((post) => post.status === status) || [];
  
  const { setNodeRef, isOver } = useDroppable({
    id: status,  // "I am the 'todo' column"
  });

  // Create array of post IDs for SortableContext
  const postIds = postsByStatus.map((post) => post.id);

  return (
    <div
      ref={setNodeRef}  // 👈 Register this div as a drop zone
      className={cn(
        "rounded-lg flex flex-col min-w-87.5 max-w-100 transition-all",
        isOver && "ring-2 ring-primary ring-offset-2"  // Highlight when hovering
      )}
    >
      {/* Column Header */}
      <div
        className={cn(
          "p-4 rounded-t-lg border-l-4",
          config.accent,
          "bg-border/40 border-b border-border"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold">{config.label}</h2>
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold">
              {postsByStatus.length}
            </span>
          </div>
        </div>
      </div>

      {/* Column Content */}
      <div
        className={cn(
          "flex-1 p-3 space-y-2 rounded-b-lg overflow-y-auto min-h-125",
          config.color,
          isOver && "bg-primary/5"  // Subtle background highlight
        )}
      >
        {postsByStatus.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
            <Inbox className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">
              No posts yet
            </p>
          </div>
        ) : (
          <SortableContext
            items={postIds}
            strategy={verticalListSortingStrategy}
          >
            {postsByStatus.map((post) => (
              <DraggablePostCard key={post.id} post={post} />
            ))}
          </SortableContext>
        )}

        {/* Add Post Button */}
        <Button
          onClick={() => onAddClick(status)}
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground mt-3 h-auto py-2"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add post
        </Button>
      </div>
    </div>
  );
}
```

**Key concepts:**

- **`useDroppable({ id: status })`** — This div can receive drops. The `id` must be unique (`"todo"`, `"in_progress"`, etc.)
- **`setNodeRef`** — Connects the React component to `@dnd-kit`'s internal tracking
- **`isOver`** — Boolean that's `true` when you're hovering over this column
- **`ring-2 ring-primary ring-offset-2`** — Subtle highlight showing valid drop zone
- **`bg-primary/5`** — Subtle background color when hovering (additional visual feedback)
- **`SortableContext`** — Wraps sortable items. Allows reordering within the column
- **`verticalListSortingStrategy`** — Cards are stacked vertically

---

## 3. DraggablePostCard — The Draggable Item

```typescript
export function DraggablePostCard({ post }) {
  const {
    attributes,     // For the drag handle (mouse/pointer events)
    listeners,       // Event handlers (onMouseDown, onTouchStart, etc.)
    setNodeRef,      // Register this element with @dnd-kit
    transform,       // { x, y } offset for smooth animations
    isDragging,      // Boolean: is this card currently being dragged?
    isOver,          // Boolean: is this card being hovered over by another?
  } = useSortable({ id: post.id });

  const style = {
    transform: CSS.Transform.toString(transform),  // Apply smooth animation
    transition,                                     // Fade in/out
    opacity: isDragging ? 0.5 : 1,                 // Fade when dragging
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative",
        isDragging && "z-50",           // Bring to front while dragging
        isOver && "ring-2 ring-primary" // Highlight if hovering over this card
      )}
    >
      <PostCardContent 
        post={post}
        dragAttributes={attributes}     // Pass to the grip icon
        dragListeners={listeners}       // Pass to the grip icon
        isDragging={isDragging}
      />
    </div>
  );
}
```

**Key concepts:**

- **`useSortable({ id: post.id })`** — Makes this card draggable AND sortable within the column
- **`attributes`** — Object with event handlers (e.g., `onMouseDown`, `onTouchStart`)
- **`listeners`** — The same event handlers
- **`transform`** — The X/Y position calculated by `@dnd-kit`. As you drag, this updates continuously
- **`CSS.Transform.toString()`** — Converts the transform to a CSS string like `"translate3d(10px, 20px, 0)"`
- **`opacity: isDragging ? 0.5 : 1`** — Fade the card being dragged (visual feedback)
- **`z-50`** — Brings the dragging card to the front

---

## 4. PostCardContent — The UI

```typescript
export function PostCardContent({
  post,
  dragAttributes,   // Pointer events for the grip icon
  dragListeners,    // Same events
  isDragging,
}) {
  return (
    <Card className={cn(
      "group mb-3 overflow-hidden cursor-pointer border-l-4 border-l-muted transition-all p-3",
      isDragging
        ? "shadow-2xl opacity-50 bg-primary/10"
        : "hover:shadow-md",
    )}>
      <div className="flex gap-2">
        <div
          {...dragAttributes}           // 👈 Attach listeners to grip icon
          {...dragListeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground mt-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold line-clamp-2 flex-1">
              {post.title}
            </h3>
            {/* More Options Menu */}
          </div>

          {/* Description */}
          {post.description && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {post.description}
            </p>
          )}

          {/* Status Badge and Due Date */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className={cn("text-xs px-2 py-1 rounded-full font-medium", getStatusColor(post.status))}>
              {getStatusLabel(post.status)}
            </span>
            {formattedDate && (
              <div className={cn("text-xs px-2 py-1 rounded-full flex items-center gap-1 font-medium", getDueDateColor(dueDateStatus))}>
                <Calendar className="w-3 h-3" />
                {formattedDate}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
```

**Why attach listeners to the grip icon?**
- Only drag when you grab the handle
- Clicking the card title or buttons doesn't trigger a drag
- Better UX for accessibility
- Users expect the grip icon to be the drag handle

---

## The Flow: Step-by-Step Example

You drag a post from **To Do** → **In Progress**:

### Step 1: Mouse down on grip icon
- `onDragStart` fires
- `setActiveId("post-123")` → shows overlay
- `activeId` → used by `DragOverlay` to render ghost card
- The grip icon changes cursor to `grabbing`

### Step 2: Mouse moves over "In Progress" column
- `onDragOver` fires ~60 times per second (every frame)
- `collisionDetection` detects "In Progress" column is under the cursor
- Local state updates: `status: "todo"` → `"in_progress"` 
- Card **instantly** appears in new column (optimistic UI)
- "In Progress" column gets a `ring-2 ring-primary` border (visual feedback)
- Column background changes to `bg-primary/5` (subtle highlight)

### Step 3: Mouse released
- `onDragEnd` fires
- `setActiveId(null)` → hides the overlay
- Check if status actually changed (yes: "todo" → "in_progress")
- Call API: `updatePostStatusAction(campaignId, "post-123", "in_progress")`
- If success: 
  - Show toast: "Post moved successfully"
  - Call `router.refresh()` to re-fetch all posts from server
- If failed: 
  - Revert to original state: `setPosts(initialPosts)`
  - Show toast: "Failed to move post"

---

## Key Design Decisions

| Decision | Why |
|----------|-----|
| **Optimistic UI** | Users see instant feedback; doesn't feel laggy even with network latency |
| **Local state + API** | Updates are immediate locally, persisted to server asynchronously |
| **Revert on error** | If the API fails (e.g., permission denied), undo the change to maintain consistency |
| **Toast notifications** | Users know if the operation succeeded or failed without guessing |
| **Grip handle** | Only drag from the icon, not anywhere on the card. Better UX and prevents accidental drags |
| **Column highlight** | Shows valid drop zones (`isOver && "ring-2"`). Visual feedback is critical for DnD |
| **Ghost card overlay** | Follows cursor; shows what you're dragging. Standard pattern for DnD UX |
| **Fade while dragging** | `opacity: isDragging ? 0.5 : 1` makes it clear which card is being moved |
| **8px distance threshold** | Prevents accidental drags from small mouse movements. Industry standard |

---

## Common Gotchas for Juniors

### 1. Forgetting `ref={setNodeRef}`
```typescript
// ❌ Wrong
<div>
  <PostCard post={post} />
</div>

// ✅ Correct
<div ref={setNodeRef}>
  <PostCard post={post} />
</div>
```
**Problem:** Without this, `@dnd-kit` doesn't know where your element is. Drag won't work.

---

### 2. Not wrapping in `SortableContext`
```typescript
// ❌ Wrong
{postsByStatus.map((post) => (
  <DraggablePostCard key={post.id} post={post} />
))}

// ✅ Correct
<SortableContext items={postIds} strategy={verticalListSortingStrategy}>
  {postsByStatus.map((post) => (
    <DraggablePostCard key={post.id} post={post} />
  ))}
</SortableContext>
```
**Problem:** Sortable items must be inside `SortableContext`. Without it, collision detection fails.

---

### 3. Using `distance: 0`
```typescript
// ❌ Wrong - causes drags on tiny mouse movements
useSensor(PointerSensor, { distance: 0 })

// ✅ Correct - requires at least 8px movement
useSensor(PointerSensor, { distance: 8 })
```
**Problem:** User experience feels jittery. Every tiny cursor movement triggers a drag.

---

### 4. Not reverting state on error
```typescript
// ❌ Wrong - card stays in new column even if API fails
const handleDragEnd = async (event) => {
  const { over } = event;
  // No error handling!
};

// ✅ Correct - revert on failure
const handleDragEnd = async (event) => {
  const { over } = event;
  try {
    await updatePostStatusAction(...);
  } catch (error) {
    setPosts(initialPosts);  // Revert!
  }
};
```
**Problem:** Users see the change, but the server rejects it. State is inconsistent.

---

### 5. Calling `router.refresh()` on every drag
```typescript
// ❌ Wrong - re-fetches on every onDragOver (60 times per second!)
const handleDragOver = (event) => {
  router.refresh();  // This is terrible!
};

// ✅ Correct - only refresh on successful drop
const handleDragEnd = async (event) => {
  if (result.success) {
    router.refresh();  // Only once!
  }
};
```
**Problem:** Causes the entire page to re-render constantly. Performance nightmare.

---

### 6. Attaching listeners to the wrong element
```typescript
// ❌ Wrong - entire card is a drag handle
<Card {...dragListeners}>
  {/* Everything inside is draggable */}
</Card>

// ✅ Correct - only grip icon is a drag handle
<Card>
  <div {...dragListeners}>
    <GripVertical />
  </div>
  {/* Rest of card is not draggable */}
</Card>
```
**Problem:** Users can't click buttons or select text inside the card.

---

### 7. Forgetting `useDroppable` in columns
```typescript
// ❌ Wrong - column has no drop zone
<div className="column">
  <SortableContext items={postIds}>
    {/* Items here, but where do they drop? */}
  </SortableContext>
</div>

// ✅ Correct - column is a drop zone
<div ref={setNodeRef} className="column">
  <SortableContext items={postIds}>
    {/* Items can drop here */}
  </SortableContext>
</div>
```
**Problem:** Drag works, but collision detection doesn't work. Can't move between columns.

---

## Testing the Implementation

### Manual Testing Checklist

- [ ] Drag a card within a column (reordering)
- [ ] Drag a card to a different column (status change)
- [ ] Hover over a column — see the ring border and background highlight
- [ ] Release over a valid column — card moves and API is called
- [ ] Simulate API failure — card reverts to original position
- [ ] Check toast notifications for success/error messages
- [ ] Verify only the grip icon is draggable (not the entire card)
- [ ] Test on mobile (touch events)
- [ ] Test with keyboard (accessibility)

### Edge Cases to Consider

- What if a user drags a card outside all columns? (Currently: stays in original column)
- What if two users move the same card simultaneously? (Depends on API implementation)
- What if the browser loses connection during a drag? (Currently: reverts after error)

---

## Summary

```
User drags card
    ↓
onDragStart 
  → setActiveId (show overlay)
    ↓
onDragOver (fires 60x/sec)
  → update local state (instant feedback)
  → show column highlight
    ↓
User drops
    ↓
onDragEnd
  → call API
  → revert on error or refresh on success
    ↓
Toast notification (success or error)
```

### The Complete Flow

1. **User starts drag** — `onDragStart` captures which card
2. **User moves cursor** — `onDragOver` updates local state and shows visual feedback
3. **User releases** — `onDragEnd` persists to server and handles errors
4. **Feedback** — Toast notifies user of success or failure

### Why This Works

- **Optimistic UI** — Instant feedback (no lag)
- **Revert on error** — Maintains consistency if API fails
- **Visual feedback** — Ring border and highlights show what's happening
- **Ghost overlay** — Shows what user is dragging
- **Accessible** — Works with keyboard and screen readers (thanks to `@dnd-kit`)

---

## Resources

- [Official `@dnd-kit` Docs](https://docs.dnd-kit.com/)
- [API Reference](https://docs.dnd-kit.com/api-reference)
- [Examples](https://github.com/clauderic/dnd-kit/tree/master/packages/react/examples)

---

## Next Steps (Future Enhancements)

- [ ] Add ability to reorder cards within a column (currently only moves between columns)
- [ ] Add keyboard navigation for accessibility
- [ ] Persist `order` field for sorting within a status
- [ ] Add undo/redo functionality
- [ ] Show indicator for "unsaved changes" during optimistic updates
- [ ] Debounce API calls if dragging rapidly

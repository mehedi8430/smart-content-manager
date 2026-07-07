# Drag-and-Drop Implementation with @dnd-kit

## Architecture

```
KanbanBoard (DndContext)
├── KanbanColumn (useDroppable)
│   └── DraggablePostCard (useSortable)
└── DragOverlay (ghost card)
```

## Key Components

### KanbanBoard

- Wraps everything in `<DndContext>`
- Manages local `posts` state for optimistic updates
- Handles drag events: `onDragStart`, `onDragOver`, `onDragEnd`

### KanbanColumn

- Drop zone using `useDroppable({ id: status })`
- Wraps cards in `SortableContext` for reordering
- Filters posts by status

### DraggablePostCard

- Draggable using `useSortable({ id: post.id })`
- Applies transform/opacity for smooth animations

## Drag Flow

### 1. `onDragStart`

```typescript
setActiveId(active.id); // Show overlay
```

### 2. `onDragOver` (column switching)

```typescript
// Detect target column from over.id (postId or status)
const newStatus = overPost ? overPost.status : (over.id as PostStatus);
// Optimistic update
setPosts((prev) =>
  prev.map((p) => (p.id === active.id ? { ...p, status: newStatus } : p)),
);
```

### 3. `onDragEnd` (ordering + API sync)

```typescript
// Get final column posts after dragOver mutation
const columnPosts = posts.filter((p) => p.status === targetStatus);
// Reorder within column
const reordered = arrayMove(columnPosts, oldIndex, newIndex);
// Build bulk update with order values (0, 1, 2...)
const bulkItems = reordered.map((post, index) => ({
  id: post.id,
  status: post.status,
  order: index,
}));
// Sync to API
bulkUpdatePostsAction(campaignId, bulkItems);
```

## Key Design Decisions

- **`onDragOver`**: Handles column switching (instant UI feedback)
- **`onDragEnd`**: Handles reordering and API sync
- **Bulk update**: Sends entire column state with order values
- **Optimistic UI**: Updates local state immediately, syncs to server async
- **Revert on error**: Restores original state if API fails

## Common Gotchas

1. **Missing `setNodeRef`** - Elements won't be tracked by dnd-kit
2. **Missing `SortableContext`** - Reordering won't work
3. **Not reverting on error** - State becomes inconsistent
4. **Using dnd-kit's sortable.items** - May not reflect final order; use actual state instead

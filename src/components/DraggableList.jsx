import { useRef, useState } from 'react'
import { Box } from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import { useVirtualizer } from '@tanstack/react-virtual'

export default function DraggableList({ items, getItemKey, renderItem, onReorder }) {
  const scrollElementRef = useRef(null)
  const [draggedKey, setDraggedKey] = useState(null)
  const [dragOverKey, setDragOverKey] = useState(null)
  // TanStack Virtual returns a mutable virtualizer instance that React Compiler cannot memoize.
  // eslint-disable-next-line react-hooks/incompatible-library
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => scrollElementRef.current,
    estimateSize: () => 72,
    getItemKey: (index) => getItemKey(items[index]),
    overscan: 3,
  })

  const moveItem = (targetKey) => {
    if (draggedKey === null || draggedKey === targetKey) return
    const fromIndex = items.findIndex((item) => getItemKey(item) === draggedKey)
    const toIndex = items.findIndex((item) => getItemKey(item) === targetKey)
    if (fromIndex < 0 || toIndex < 0) return

    const reorderedItems = [...items]
    const [movedItem] = reorderedItems.splice(fromIndex, 1)
    reorderedItems.splice(toIndex, 0, movedItem)
    onReorder(reorderedItems)
  }

  return (
    <Box className="draggable-list" ref={scrollElementRef}>
      <Box className="draggable-list-items" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((virtualItem) => {
          const item = items[virtualItem.index]
          const itemKey = getItemKey(item)
          return (
            <Box
              className="draggable-list-item"
              data-drag-over={dragOverKey === itemKey}
              data-index={virtualItem.index}
              key={itemKey}
              draggable
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualItem.start}px)`,
              }}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', String(itemKey))
                setDraggedKey(itemKey)
              }}
              onDragOver={(event) => {
                event.preventDefault()
                setDragOverKey(itemKey)
              }}
              onDrop={(event) => {
                event.preventDefault()
                moveItem(itemKey)
                setDraggedKey(null)
                setDragOverKey(null)
              }}
              onDragEnd={() => {
                setDraggedKey(null)
                setDragOverKey(null)
              }}
            >
              <span className="draggable-list-handle" aria-hidden="true">
                <DragIndicatorIcon fontSize="small" />
              </span>
              {renderItem(item)}
            </Box>
          )
        })}
      </Box>
    </Box>
  )
}

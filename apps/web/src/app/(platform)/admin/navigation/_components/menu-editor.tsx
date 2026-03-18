"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MenuItem } from "@kemotsho/platform-cms/navigation/domain/MenuItem"
import { updateMenuAction } from "@/app/(platform)/actions/navigation"
import { Button } from "@/shared/ui/atoms/button"
import { Card } from "@/shared/ui/atoms/card"
import { Input } from "@/shared/ui/atoms/input"
import { Label } from "@/shared/ui/atoms/label"
import { Plus, Trash2, Save, GripVertical, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@kemotsho/core/lib/utils"

interface MenuEditorProps {
  initialItems: ReadonlyArray<MenuItem>
}

// Simple DnD session state
let draggedMeta: { parentId: string; index: number } | null = null

export function MenuEditor({ initialItems }: MenuEditorProps) {
  const [items, setItems] = useState<MenuItem[]>([...initialItems])
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  const handleUpdate = (updatedItem: MenuItem, index: number) => {
    const newItems = [...items]
    newItems[index] = updatedItem
    setItems(newItems)
  }

  const handleMove = (from: number, to: number) => {
    if (from === to) return
    const newItems = [...items]
    const [moved] = newItems.splice(from, 1)
    if (moved) {
      newItems.splice(to, 0, moved)
      setItems(newItems)
    }
  }

  const handleDelete = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
  }

  const handleAdd = () => {
    setItems([
      ...items,
      {
        id: crypto.randomUUID(),
        label: "New Link",
        path: "/",
        children: []
      }
    ])
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateMenuAction("main", items)
      router.refresh()
    } catch (error) {
      console.error("Failed to save menu", error)
      alert("Failed to save menu")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex justify-end mb-4">
        <Button onClick={handleSave} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <MenuItemRow 
            key={item.id} 
            item={item} 
            index={index}
            parentId="root"
            onMove={handleMove}
            onChange={(updated) => handleUpdate(updated, index)}
            onDelete={() => handleDelete(index)}
          />
        ))}
      </div>

      <Button onClick={handleAdd} intent="outline" className="w-full border-dashed">
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>
    </div>
  )
}

function MenuItemRow({ 
    item, 
    index,
    parentId,
    onMove,
    onChange, 
    onDelete, 
    depth = 0 
}: { 
    item: MenuItem
    index: number
    parentId: string
    onMove: (from: number, to: number) => void
    onChange: (item: MenuItem) => void 
    onDelete: () => void
    depth?: number 
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const [isDragOver, setIsDragOver] = useState(false)

    const handleChange = (field: keyof MenuItem, value: string) => {
        onChange({ ...item, [field]: value })
    }

    const handleChildUpdate = (updatedChild: MenuItem, idx: number) => {
        const newChildren = [...(item.children || [])]
        newChildren[idx] = updatedChild
        onChange({ ...item, children: newChildren })
    }

    const handleChildMove = (from: number, to: number) => {
        if (from === to) return
        const newChildren = [...(item.children || [])]
        const [moved] = newChildren.splice(from, 1)
        if (moved) {
            newChildren.splice(to, 0, moved)
            onChange({ ...item, children: newChildren })
        }
    }

    const handleChildDelete = (idx: number) => {
        const newChildren = [...(item.children || [])].filter((_, i) => i !== idx)
        onChange({ ...item, children: newChildren })
    }

    const handleDragStart = (e: React.DragEvent) => {
        draggedMeta = { parentId, index }
        e.dataTransfer.effectAllowed = "move"
        // Optional: Set ghost image
    }

    const handleDragOver = (e: React.DragEvent) => {
        if (draggedMeta?.parentId === parentId) {
            e.preventDefault() // Allow drop
            e.dataTransfer.dropEffect = "move"
            setIsDragOver(true)
        }
    }

    const handleDragLeave = () => {
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragOver(false)
        if (draggedMeta?.parentId === parentId) {
            onMove(draggedMeta.index, index)
            draggedMeta = null
        }
    }

    const handleAddChild = () => {
        const newChild: MenuItem = {
            id: crypto.randomUUID(),
            label: "Sub Link",
            path: item.path + "/sub",
            children: []
        }
        onChange({ ...item, children: [...(item.children || []), newChild] })
        setIsExpanded(true)
    }

    const hasChildren = item.children && item.children.length > 0

    return (
        <Card 
            className={cn(
                "p-4 bg-muted/20 transition-all", 
                depth > 0 && "ml-8 border-l-4 border-l-primary/20", 
                depth > 0 && "bg-background",
                isDragOver && "ring-2 ring-primary ring-offset-2"
            )}
            draggable
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            <div className="flex items-start gap-4">
              <div 
                className="mt-3 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
              >
                  <GripVertical className="h-5 w-5" />
              </div>

              {hasChildren && (
                   <div 
                        className="mt-3 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={() => setIsExpanded(!isExpanded)}
                   >
                        {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                   </div>
              )}
              
              <div className="flex-1 grid gap-4 grid-cols-1 md:grid-cols-[1fr,1fr,auto]">
                <div className="grid gap-2">
                  <Label htmlFor={`label-${item.id}`} className="sr-only">Label</Label>
                  <Input 
                    id={`label-${item.id}`}
                    value={item.label} 
                    onChange={(e) => handleChange("label", e.target.value)} 
                    placeholder="Link Label"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`path-${item.id}`} className="sr-only">Path</Label>
                  <Input 
                    id={`path-${item.id}`}
                    value={item.path} 
                    onChange={(e) => handleChange("path", e.target.value)}
                    placeholder="/path" 
                  />
                </div>
                <div className="flex items-center gap-2">
                    <Button intent="ghost" size="sm" onClick={handleAddChild} title="Add Submenu">
                        <Plus className="h-4 w-4" />
                    </Button>
                    <Button intent="danger" size="icon" onClick={onDelete}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
              </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="mt-4 space-y-4 border-l pl-4">
                    {item.children!.map((child, idx) => (
                        <MenuItemRow 
                            key={child.id}
                            item={child}
                            index={idx}
                            parentId={item.id}
                            onMove={handleChildMove}
                            onChange={(updated) => handleChildUpdate(updated, idx)}
                            onDelete={() => handleChildDelete(idx)}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </Card>
    )
}

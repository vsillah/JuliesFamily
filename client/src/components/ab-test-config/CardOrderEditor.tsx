import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Image as ImageIcon, AlertCircle, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { useContentItems } from "./hooks/useContentItems";
import type { CardOrderConfig } from "@shared/schema";
import type { ContentItem } from "@shared/schema";

interface CardOrderEditorProps {
  value: CardOrderConfig;
  onChange: (value: CardOrderConfig) => void;
  errors?: Record<string, string>;
}

interface SortableItemProps {
  id: string;
  item: ContentItem;
}

function SortableItem({ id, item }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="p-3 flex items-center gap-3 hover-elevate cursor-move"
      data-testid={`sortable-item-${id}`}
    >
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {(item.imageName || item.imageUrl) && (
        <div className="w-12 h-12 rounded bg-muted flex items-center justify-center shrink-0">
          <ImageIcon className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{item.title}</p>
        {item.description && (
          <p className="text-xs text-muted-foreground truncate">{item.description}</p>
        )}
      </div>
      <div className="text-xs text-muted-foreground">
        #{item.order}
      </div>
    </Card>
  );
}

export function CardOrderEditor({ value, onChange, errors }: CardOrderEditorProps) {
  const [selectedType, setSelectedType] = useState<string>(value.contentType || '');
  const { data: availableItems, isLoading, error } = useContentItems(selectedType || null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize selected items when type changes or data loads
  useEffect(() => {
    if (selectedType && availableItems && value.itemIds.length === 0) {
      // Auto-select all items in their default order when switching types
      const defaultOrder = availableItems
        .sort((a, b) => a.order - b.order)
        .map(item => item.id);
      
      onChange({
        ...value,
        contentType: selectedType as any,
        itemIds: defaultOrder,
      });
    }
  }, [selectedType, availableItems]);

  const handleTypeChange = (newType: string) => {
    setSelectedType(newType);
    // Reset item selection when changing type
    onChange({
      kind: 'card_order',
      contentType: newType as any,
      itemIds: [],
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = value.itemIds.indexOf(active.id as string);
      const newIndex = value.itemIds.indexOf(over.id as string);

      const newOrder = arrayMove(value.itemIds, oldIndex, newIndex);
      onChange({
        ...value,
        itemIds: newOrder,
      });
    }
  };

  // Get ordered items for display
  const orderedItems = value.itemIds
    .map(id => availableItems?.find(item => item.id === id))
    .filter(Boolean) as ContentItem[];

  return (
    <div className="space-y-4" data-testid="card-order-editor">
      <div className="space-y-2">
        <Label htmlFor="content-type" className="text-sm font-medium">Content Type to Reorder</Label>
        <Select value={selectedType} onValueChange={handleTypeChange}>
          <SelectTrigger id="content-type" data-testid="select-content-type">
            <SelectValue placeholder="Select content type..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="service">Services</SelectItem>
            <SelectItem value="testimonial">Testimonials</SelectItem>
            <SelectItem value="event">Events</SelectItem>
            <SelectItem value="program_detail">Program Details</SelectItem>
            <SelectItem value="sponsor">Sponsors</SelectItem>
            <SelectItem value="impact_stat">Impact Statistics</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Choose which type of content cards you want to reorder
        </p>
        {errors?.contentType && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {errors.contentType}
          </p>
        )}
      </div>

      {selectedType && (
        <>
          {isLoading && (
            <div className="flex items-center justify-center p-8 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading {selectedType} items...
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-medium">Failed to load items</p>
                <p className="text-xs mt-1">Please try again or contact support</p>
              </div>
            </div>
          )}

          {!isLoading && !error && orderedItems.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Drag to Reorder</Label>
                <span className="text-xs text-muted-foreground">
                  {orderedItems.length} items
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Drag items up or down to change the display order for this variant
              </p>
              
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={value.itemIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2" data-testid="sortable-list">
                    {orderedItems.map((item) => (
                      <SortableItem key={item.id} id={item.id} item={item} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {errors?.itemIds && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-2">
                  <AlertCircle className="w-3 h-3" />
                  {errors.itemIds}
                </p>
              )}
            </div>
          )}

          {!isLoading && !error && availableItems && availableItems.length === 0 && (
            <div className="flex items-start gap-2 p-4 bg-muted rounded-md">
              <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium">No {selectedType} items found</p>
                <p className="text-xs mt-1">Add some {selectedType} items in the Content Manager first</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

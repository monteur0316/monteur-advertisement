"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { GripVertical } from "lucide-react"
import type { Faq } from "@/src/db/schema/faqs"
import { reorderFaqs } from "@/src/actions/faq"
import { EditFaqDialog } from "./edit-faq-dialog"
import { DeleteFaqDialog } from "./delete-faq-dialog"

function SortableFaqItem({ faq }: { faq: Faq }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <AccordionItem value={`faq-${faq.id}`}>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab touch-none p-1 text-muted-foreground hover:text-foreground"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
          <AccordionTrigger className="flex-1">
            {faq.question}
          </AccordionTrigger>
        </div>
        <AccordionContent>
          <div className="space-y-4 pl-8">
            <p className="whitespace-pre-wrap text-muted-foreground">
              {faq.answer}
            </p>
            <div className="flex items-center gap-2">
              <EditFaqDialog faq={faq} />
              <DeleteFaqDialog faq={faq} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </div>
  )
}

export function FaqSortableList({ faqs }: { faqs: Faq[] }) {
  const router = useRouter()
  const [items, setItems] = useState(faqs)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setItems(faqs)
  }, [faqs])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over || active.id === over.id) return

    const oldIndex = items.findIndex((item) => item.id === active.id)
    const newIndex = items.findIndex((item) => item.id === over.id)

    const newItems = arrayMove(items, oldIndex, newIndex)
    setItems(newItems)

    startTransition(async () => {
      const reorderItems = newItems.map((item, index) => ({
        id: item.id,
        sortOrder: index,
      }))

      await reorderFaqs({ items: reorderItems })
      router.refresh()
    })
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-muted-foreground">
          등록된 질문이 없습니다.
        </p>
      </div>
    )
  }

  return (
    <DndContext
      id="faq-sortable"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <Accordion type="single" collapsible className="w-full">
          {items.map((faq) => (
            <SortableFaqItem key={faq.id} faq={faq} />
          ))}
        </Accordion>
      </SortableContext>
      {isPending && (
        <p className="mt-2 text-xs text-muted-foreground">
          순서 저장 중...
        </p>
      )}
    </DndContext>
  )
}

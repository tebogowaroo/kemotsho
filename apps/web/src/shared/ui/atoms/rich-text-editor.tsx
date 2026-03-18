"use client"

import { useEditor, EditorContent, Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import { Button } from "./button"
import { Toggle } from "@kemotsho/core/ui/toggle"
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Link as LinkIcon, 
  Image as ImageIcon,
  Quote,
  Code
} from "lucide-react"
import { cn } from "@kemotsho/core/lib/utils"
import { useEffect } from "react"
import { MediaPicker } from "@/app/(platform)/admin/media/_components/media-picker"
import { MediaFile } from "@/app/(platform)/admin/media/_components/media-grid"

interface EditorToolbarProps {
  editor: Editor
  onImageSelect: (file: MediaFile) => void
}

function EditorToolbar({ editor, onImageSelect }: EditorToolbarProps) {
  if (!editor) return null

  return (
    <div className="border-b p-2 flex flex-wrap gap-1 items-center bg-muted/20">
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>

      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-4 w-4" />
      </Toggle>

      <div className="w-px h-6 bg-border mx-1" />
      
      <MediaPicker 
        onSelect={(file) => {
             // Basic implementation: insert generic or signed URL if available
             // For now, inserting the direct URL (assuming we have logic to view it)
             editor.chain().focus().setImage({ src: file.url, alt: file.name }).run()
        }}
        trigger={
            <Button intent="ghost" size="icon" className="h-9 w-9" type="button">
                <ImageIcon className="h-4 w-4" />
            </Button>
        }
      />
    </div>
  )
}

interface RichTextEditorProps {
    value: string
    onChange: (value: string) => void
    className?: string
}

export function RichTextEditor({ value, onChange, className }: RichTextEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                // We are adding Link manually below
                // codeBlock: false, // If codeBlock conflicts later
            }),
            Link.configure({
                openOnClick: false,
                HTMLAttributes: {
                    class: 'text-primary underline',
                },
            }),
            Image.configure({
                inline: true
            })
        ],
        content: value,
        editorProps: {
            attributes: {
                class: "prose prose-sm dark:prose-invert max-w-none min-h-[150px] p-4 focus:outline-none"
            }
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML())
        }
    })

    // Sync initial content if it changes externally (e.g. loaded data) but only if distinct to avoid loops
    // In a controlled component, this can be tricky.
    // For simple "initialValue" use case, we might not need this hook if we trust the `useEditor` initial content.
    // But for Edit Form where data loads async, we need to set content.
    useEffect(() => {
        if (editor && value && editor.getHTML() !== value) {
             // Only set if completely different to avoid cursor jumps
             // Actually parsing HTML equality is hard.
             // Simplest is generic "if empty, set it"
             if (editor.isEmpty) {
                 editor.commands.setContent(value)
             }
        }
    }, [editor, value])

    return (
        <div className={cn("border rounded-md overflow-hidden bg-background", className)}>
             <EditorToolbar 
                editor={editor as Editor} 
                onImageSelect={() => {}} 
             />
             <EditorContent editor={editor} />
        </div>
    )
}

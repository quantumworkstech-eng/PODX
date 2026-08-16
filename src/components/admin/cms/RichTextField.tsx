"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { Bold, Heading2, Heading3, Italic, List, ListOrdered, Quote, Redo2, Strikethrough, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Rich text editing for `richtext` fields. Stores HTML, rendered by the public page. */
export function RichTextField({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder?: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder: placeholder ?? "Write something…" })],
    content: value || "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[180px] px-4 py-3 text-white text-sm focus:outline-none [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-[#D9FC67]/40 [&_blockquote]:pl-4 [&_blockquote]:text-white/60",
      },
    },
    onUpdate: ({ editor: instance }) => {
      const html = instance.getHTML();
      onChange(html === "<p></p>" ? "" : html);
    },
  });

  if (!editor) {
    return <div className="h-[220px] bg-white/5 border border-white/10 rounded-lg animate-pulse" />;
  }

  const buttons = [
    { label: "Bold", icon: Bold, action: () => editor.chain().focus().toggleBold().run(), active: editor.isActive("bold") },
    { label: "Italic", icon: Italic, action: () => editor.chain().focus().toggleItalic().run(), active: editor.isActive("italic") },
    { label: "Strikethrough", icon: Strikethrough, action: () => editor.chain().focus().toggleStrike().run(), active: editor.isActive("strike") },
    { label: "Heading 2", icon: Heading2, action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(), active: editor.isActive("heading", { level: 2 }) },
    { label: "Heading 3", icon: Heading3, action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(), active: editor.isActive("heading", { level: 3 }) },
    { label: "Bullet list", icon: List, action: () => editor.chain().focus().toggleBulletList().run(), active: editor.isActive("bulletList") },
    { label: "Numbered list", icon: ListOrdered, action: () => editor.chain().focus().toggleOrderedList().run(), active: editor.isActive("orderedList") },
    { label: "Quote", icon: Quote, action: () => editor.chain().focus().toggleBlockquote().run(), active: editor.isActive("blockquote") },
    { label: "Undo", icon: Undo2, action: () => editor.chain().focus().undo().run(), active: false },
    { label: "Redo", icon: Redo2, action: () => editor.chain().focus().redo().run(), active: false },
  ];

  return (
    <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden focus-within:border-[#D9FC67]">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-white/10">
        {buttons.map(({ label, icon: Icon, action, active }) => (
          <button
            key={label}
            type="button"
            title={label}
            aria-label={label}
            onClick={action}
            className={cn(
              "p-1.5 rounded transition-colors",
              active ? "bg-[#D9FC67] text-black" : "text-white/50 hover:text-white hover:bg-white/10",
            )}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        ))}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

import React, { useEffect } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Image as ImageIcon,
  Link as LinkIcon,
  Heading1,
  Heading2,
  Strikethrough,
  Undo,
  Redo,
  Code,
  Pilcrow,
} from "lucide-react";

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar = ({ editor }: MenuBarProps) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt("Enter the URL of the image:");

    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setLink = () => {
    const url = window.prompt("URL:");

    if (url === null) {
      return;
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap gap-1 p-1 mb-2 border rounded-t-md bg-muted/30 border-input rtl:space-x-reverse">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        data-active={editor.isActive("bold") ? "true" : "false"}
      >
        <Bold className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        data-active={editor.isActive("italic") ? "true" : "false"}
      >
        <Italic className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        data-active={editor.isActive("strike") ? "true" : "false"}
      >
        <Strikethrough className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        data-active={
          editor.isActive("heading", { level: 1 }) ? "true" : "false"
        }
      >
        <Heading1 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        data-active={
          editor.isActive("heading", { level: 2 }) ? "true" : "false"
        }
      >
        <Heading2 className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().setParagraph().run()}
        data-active={editor.isActive("paragraph") ? "true" : "false"}
      >
        <Pilcrow className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        data-active={editor.isActive("bulletList") ? "true" : "false"}
      >
        <List className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        data-active={editor.isActive("orderedList") ? "true" : "false"}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        data-active={editor.isActive("codeBlock") ? "true" : "false"}
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        data-active={editor.isActive({ textAlign: "left" }) ? "true" : "false"}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        data-active={
          editor.isActive({ textAlign: "center" }) ? "true" : "false"
        }
      >
        <AlignCenter className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        data-active={editor.isActive({ textAlign: "right" }) ? "true" : "false"}
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={setLink}
        data-active={editor.isActive("link") ? "true" : "false"}
      >
        <LinkIcon className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={addImage}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-border mx-1" />

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Button>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
  dir?: "rtl" | "ltr";
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Start writing...",
  className = "",
  readOnly = false,
  dir = "rtl",
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure any extensions you need
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image,
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: dir === "rtl" ? "right" : "left",
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value || "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[150px] p-4",
        dir: dir,
        "data-placeholder": placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      // Only update if the value differs to prevent infinite loops
      editor.commands.setContent(value || "");
    }
  }, [value, editor]);

  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      {!readOnly && <MenuBar editor={editor} />}
      <EditorContent editor={editor} className="prose max-w-none p-2" />
    </div>
  );
};

export default RichTextEditor;

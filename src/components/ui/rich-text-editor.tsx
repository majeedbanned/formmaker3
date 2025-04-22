import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, Editor, BubbleMenu } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
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
  Highlighter,
  ExternalLink,
  Trash2,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface HighlightColor {
  name: string;
  color: string;
}

// Define highlight colors
const HIGHLIGHT_COLORS: HighlightColor[] = [
  { name: "yellow", color: "#FEF3C7" },
  { name: "green", color: "#D1FAE5" },
  { name: "blue", color: "#DBEAFE" },
  { name: "red", color: "#FEE2E2" },
  { name: "purple", color: "#EDE9FE" },
];

interface MenuBarProps {
  editor: Editor | null;
}

const MenuBar = ({ editor }: MenuBarProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState<boolean>(false);

  if (!editor) {
    return null;
  }

  const setLink = () => {
    if (editor.isActive("link")) {
      // Get current link URL
      const linkAttrs = editor.getAttributes("link");
      setLinkUrl(linkAttrs.href || "");
    } else {
      setLinkUrl("");
    }

    setIsLinkPopoverOpen(true);
  };

  const applyLink = () => {
    // If no URL is provided, unset the link
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkPopoverOpen(false);
      return;
    }

    // Add https:// if URL doesn't have a protocol
    let url = linkUrl;
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();

    setIsLinkPopoverOpen(false);
  };

  const unsetLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsLinkPopoverOpen(false);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    // Create a FileReader to read the image file
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result && editor) {
        // Insert the image at the current cursor position
        editor
          .chain()
          .focus()
          .setImage({ src: event.target.result as string })
          .run();
      }
    };
    reader.readAsDataURL(file);

    // Clear the input value so the same image can be selected again
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  };

  const openImageUploadDialog = () => {
    if (imageInputRef.current) {
      imageInputRef.current.click();
    }
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

      {/* Highlight Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="px-2 h-8"
            data-active={editor.isActive("highlight") ? "true" : "false"}
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-2">
          <div className="flex gap-1">
            {HIGHLIGHT_COLORS.map((color) => (
              <Button
                key={color.name}
                type="button"
                size="sm"
                variant="ghost"
                className="w-8 h-8 p-0"
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .toggleHighlight({ color: color.color })
                    .run()
                }
                style={{
                  backgroundColor: color.color,
                  border: editor.isActive("highlight", { color: color.color })
                    ? "2px solid black"
                    : "none",
                }}
              />
            ))}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0"
              onClick={() => editor.chain().focus().unsetHighlight().run()}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </PopoverContent>
      </Popover>

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

      {/* Link Popover */}
      <Popover open={isLinkPopoverOpen} onOpenChange={setIsLinkPopoverOpen}>
        <PopoverTrigger asChild>
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
        </PopoverTrigger>
        <PopoverContent className="w-72 p-3">
          <div className="flex flex-col gap-2">
            <Input
              type="text"
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applyLink();
                }
              }}
            />
            <div className="flex gap-2 mt-2">
              <Button onClick={applyLink} size="sm" className="gap-1">
                <LinkIcon className="h-3 w-3" />
                {editor.isActive("link") ? "Update Link" : "Add Link"}
              </Button>
              {editor.isActive("link") && (
                <>
                  <Button
                    onClick={() => window.open(linkUrl, "_blank")}
                    size="sm"
                    variant="outline"
                    className="gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open
                  </Button>
                  <Button
                    onClick={unsetLink}
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                  >
                    <Trash2 className="h-3 w-3" />
                    Remove
                  </Button>
                </>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="px-2 h-8"
        onClick={openImageUploadDialog}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />

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
      Image.configure({
        allowBase64: true,
        HTMLAttributes: {
          class: "mx-auto max-w-full h-auto",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        defaultAlignment: dir === "rtl" ? "right" : "left",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline decoration-primary",
        },
      }),
      Highlight.configure({
        multicolor: true,
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

  // Add bubble menu for links when they are selected
  return (
    <div className={`border rounded-md overflow-hidden ${className}`}>
      {!readOnly && <MenuBar editor={editor} />}

      {/* BubbleMenu for links when selected */}
      {editor && !readOnly && (
        <BubbleMenu
          editor={editor}
          shouldShow={({ editor }) => editor.isActive("link")}
          tippyOptions={{ duration: 100, placement: "bottom" }}
        >
          <div className="bg-popover text-popover-foreground rounded-md shadow-md p-1 flex gap-1">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              onClick={() => {
                const attrs = editor.getAttributes("link");
                window.open(attrs.href, "_blank");
              }}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2"
              onClick={() => {
                const attrs = editor.getAttributes("link");
                // Set up the link popover
                if (attrs.href) {
                  // You need to access and set the state in MenuBar component
                  // For simplicity, we'll just use the editor directly
                  editor
                    .chain()
                    .focus()
                    .extendMarkRange("link")
                    .unsetLink()
                    .run();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </BubbleMenu>
      )}

      <EditorContent editor={editor} className="prose max-w-none p-2" />
    </div>
  );
};

export default RichTextEditor;

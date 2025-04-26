import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
  Pilcrow,
  Highlighter,
  ExternalLink,
  Trash2,
  Table2,
  Plus,
  Minus,
  Terminal,
  ChevronsUpDown,
  Code,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

// Define code languages for code block
const CODE_LANGUAGES = [
  { name: "Plain Text", value: "text" },
  { name: "JavaScript", value: "js" },
  { name: "TypeScript", value: "ts" },
  { name: "HTML", value: "html" },
  { name: "CSS", value: "css" },
  { name: "Python", value: "python" },
  { name: "PHP", value: "php" },
  { name: "Bash", value: "bash" },
  { name: "SQL", value: "sql" },
  { name: "JSON", value: "json" },
];

interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Popover = ({ children, content, isOpen, setIsOpen }: PopoverProps) => {
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, setIsOpen]);

  return (
    <div className="relative" ref={containerRef}>
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {children}
      </div>
      {isOpen && (
        <div
          ref={contentRef}
          className="absolute top-full mt-1 z-50 bg-popover rounded-md border shadow-md"
        >
          {content}
        </div>
      )}
    </div>
  );
};

interface MenuBarProps {
  editor: Editor | null;
  showSource: boolean;
  toggleSource: () => void;
}

const MenuBar = ({ editor, showSource, toggleSource }: MenuBarProps) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState<boolean>(false);
  const [isTablePopoverOpen, setIsTablePopoverOpen] = useState<boolean>(false);
  const [isCodeBlockPopoverOpen, setIsCodeBlockPopoverOpen] =
    useState<boolean>(false);
  const [isHighlightPopoverOpen, setIsHighlightPopoverOpen] =
    useState<boolean>(false);
  const [codeLanguage, setCodeLanguage] = useState<string>("text");

  if (!editor && !showSource) {
    return null;
  }

  const setLink = () => {
    if (editor) {
      // check if the selection contains a valid URL
      const previousUrl = editor.getAttributes("link").href;
      setLinkUrl(previousUrl || "");
      setIsLinkPopoverOpen(true);
    }
  };

  const applyLink = () => {
    if (editor) {
      if (linkUrl === "") {
        editor.chain().focus().extendMarkRange("link").unsetLink().run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: linkUrl })
          .run();
      }
      setIsLinkPopoverOpen(false);
    }
  };

  const unsetLink = () => {
    if (editor) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      setIsLinkPopoverOpen(false);
    }
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

  const insertTable = () => {
    if (editor) {
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
      setIsTablePopoverOpen(false);
    }
  };

  const insertCodeBlock = () => {
    if (editor) {
      editor.chain().focus().setCodeBlock({ language: codeLanguage }).run();
      setIsCodeBlockPopoverOpen(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-1 mb-2 border rounded-t-md bg-muted/30 border-input rtl:space-x-reverse">
      {!showSource && editor && (
        <>
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
          <Popover
            isOpen={isHighlightPopoverOpen}
            setIsOpen={setIsHighlightPopoverOpen}
            content={
              <div className="p-2">
                <div className="flex gap-1">
                  {HIGHLIGHT_COLORS.map((color) => (
                    <Button
                      key={color.name}
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="w-8 h-8 p-0"
                      onClick={() => {
                        if (editor) {
                          editor
                            .chain()
                            .focus()
                            .toggleHighlight({ color: color.color })
                            .run();
                          setIsHighlightPopoverOpen(false);
                        }
                      }}
                      style={{
                        backgroundColor: color.color,
                        border:
                          editor &&
                          editor.isActive("highlight", {
                            color: color.color,
                          })
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
                    onClick={() => {
                      if (editor) {
                        editor.chain().focus().unsetHighlight().run();
                        setIsHighlightPopoverOpen(false);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            }
          >
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "px-2 h-8",
                editor && editor.isActive("highlight") && "bg-muted"
              )}
            >
              <Highlighter className="h-4 w-4" />
            </Button>
          </Popover>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="px-2 h-8"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
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
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
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

          {/* Code Block Popover */}
          <Popover
            isOpen={isCodeBlockPopoverOpen}
            setIsOpen={setIsCodeBlockPopoverOpen}
            content={
              <div className="p-3 w-64">
                <div className="flex flex-col gap-2">
                  <Select value={codeLanguage} onValueChange={setCodeLanguage}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      {CODE_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={insertCodeBlock} size="sm" className="mt-2">
                    Insert Code Block
                  </Button>
                </div>
              </div>
            }
          >
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "px-2 h-8",
                editor && editor.isActive("codeBlock") && "bg-muted"
              )}
            >
              <Terminal className="h-4 w-4" />
            </Button>
          </Popover>

          <div className="w-px h-8 bg-border mx-1" />

          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="px-2 h-8"
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            data-active={
              editor.isActive({ textAlign: "left" }) ? "true" : "false"
            }
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
            data-active={
              editor.isActive({ textAlign: "right" }) ? "true" : "false"
            }
          >
            <AlignRight className="h-4 w-4" />
          </Button>

          <div className="w-px h-8 bg-border mx-1" />

          {/* Table Popover */}
          <Popover
            isOpen={isTablePopoverOpen}
            setIsOpen={setIsTablePopoverOpen}
            content={
              <div className="p-3 w-64">
                <div className="flex flex-col gap-2">
                  {editor.isActive("table") ? (
                    <>
                      <h3 className="font-medium text-sm mb-1">Modify Table</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => {
                            editor.chain().focus().addColumnBefore().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Column Before
                        </Button>
                        <Button
                          onClick={() => {
                            editor.chain().focus().addColumnAfter().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Column After
                        </Button>
                        <Button
                          onClick={() => {
                            editor.chain().focus().deleteColumn().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          variant="destructive"
                          className="w-full"
                        >
                          <Minus className="h-3 w-3 mr-1" /> Delete Column
                        </Button>
                        <Button
                          onClick={() => {
                            editor.chain().focus().addRowBefore().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Row Before
                        </Button>
                        <Button
                          onClick={() => {
                            editor.chain().focus().addRowAfter().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" /> Row After
                        </Button>
                        <Button
                          onClick={() => {
                            editor.chain().focus().deleteRow().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          variant="destructive"
                          className="w-full"
                        >
                          <Minus className="h-3 w-3 mr-1" /> Delete Row
                        </Button>
                        <Button
                          onClick={() => {
                            editor.chain().focus().mergeCells().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          className="w-full col-span-1"
                          disabled={!editor.can().mergeCells()}
                        >
                          Merge Cells
                        </Button>
                        <Button
                          onClick={() => {
                            editor.chain().focus().splitCell().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          className="w-full col-span-1"
                          disabled={!editor.can().splitCell()}
                        >
                          Split Cell
                        </Button>
                        <Button
                          onClick={() => {
                            editor.chain().focus().toggleHeaderRow().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          className="w-full"
                        >
                          <ChevronsUpDown className="h-3 w-3 mr-1" /> Toggle
                          Header
                        </Button>
                        <Button
                          onClick={() => {
                            editor.chain().focus().deleteTable().run();
                            setIsTablePopoverOpen(false);
                          }}
                          size="sm"
                          variant="destructive"
                          className="w-full col-span-1"
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Delete Table
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <h3 className="font-medium text-sm mb-1">Insert Table</h3>
                      <Button onClick={insertTable} size="sm">
                        Insert 3×3 Table
                      </Button>
                    </>
                  )}
                </div>
              </div>
            }
          >
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "px-2 h-8",
                editor && editor.isActive("table") && "bg-muted"
              )}
            >
              <Table2 className="h-4 w-4" />
            </Button>
          </Popover>

          {/* Link Popover */}
          <Popover
            isOpen={isLinkPopoverOpen}
            setIsOpen={setIsLinkPopoverOpen}
            content={
              <div className="p-3 w-72">
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
                      {editor && editor.isActive("link")
                        ? "Update Link"
                        : "Add Link"}
                    </Button>
                    {editor && editor.isActive("link") && (
                      <>
                        <Button
                          onClick={() => {
                            if (editor) {
                              const attrs = editor.getAttributes("link");
                              window.open(attrs.href, "_blank");
                            }
                          }}
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
              </div>
            }
          >
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className={cn(
                "px-2 h-8",
                editor && editor.isActive("link") && "bg-muted"
              )}
              onClick={setLink}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
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
        </>
      )}

      {/* Always show the Source toggle button */}
      <div className="ml-auto">
        <Button
          type="button"
          size="sm"
          variant={showSource ? "default" : "ghost"}
          className="px-2 h-8"
          onClick={toggleSource}
        >
          <Code className="h-4 w-4 mr-1" />
          {showSource ? "Editor View" : "HTML Source"}
        </Button>
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageUpload}
      />
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
  const [showSource, setShowSource] = useState<boolean>(false);
  const [sourceContent, setSourceContent] = useState<string>(value || "");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure any extensions you need
        heading: {
          levels: [1, 2, 3],
        },
        codeBlock: {
          HTMLAttributes: {
            class: "p-4 rounded-md bg-muted font-mono text-sm",
          },
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
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "border-collapse table-auto w-full",
        },
      }),
      TableRow.configure({
        HTMLAttributes: {
          class: "border-b border-muted",
        },
      }),
      TableHeader.configure({
        HTMLAttributes: {
          class: "border-b border-muted bg-muted font-medium p-2 text-start",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-muted p-2",
        },
      }),
    ],
    content: value || "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setSourceContent(html);
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
    // Always update the source content directly from the value prop
    setSourceContent(value || "");

    if (editor && !showSource && editor.getHTML() !== value) {
      // Only update the editor if we're in editor mode and value differs
      editor.commands.setContent(value || "");
    }
  }, [value, editor, showSource]);

  const toggleSource = () => {
    if (!showSource) {
      // Switching to source view - use the exact value from props
      setSourceContent(value || "");
    } else {
      // Switching back to editor view - update editor with possibly modified source
      if (editor) {
        editor.commands.setContent(sourceContent);
        onChange(sourceContent);
      }
    }
    setShowSource(!showSource);
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setSourceContent(newContent);
    onChange(newContent);
  };

  return (
    <div className={`border rounded-md ${className || ""}`}>
      {!readOnly && (
        <MenuBar
          editor={editor}
          showSource={showSource}
          toggleSource={toggleSource}
        />
      )}
      {showSource ? (
        <textarea
          className="w-full min-h-[200px] p-4 font-mono text-sm focus:outline-none  "
          style={{
            direction: "ltr",
          }}
          value={sourceContent}
          onChange={handleSourceChange}
          dir={dir}
        />
      ) : editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="p-4 text-muted-foreground">Loading editor...</div>
      )}
    </div>
  );
};

export default RichTextEditor;

"use client";

import React, { useRef, useState, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import type { Editor as TinyMCEEditor } from "tinymce";

export interface TinyMCEEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  dir?: "rtl" | "ltr";
  height?: number;
  initialValue?: string;
  disabled?: boolean;
  inline?: boolean;
}

/**
 * TinyMCE 6.8.3 Editor component with Persian/RTL support
 * This component is a wrapper around the TinyMCE editor with RTL support and Persian fonts
 * Uses the free, self-hosted version without requiring an API key
 */
const TinyMCEEditorWrapper = ({
  value,
  onChange,
  placeholder = "محتوای خود را وارد کنید...",
  dir = "rtl",
  height = 500,
  initialValue = "",
  disabled = false,
  inline = false,
}: TinyMCEEditorProps) => {
  // Reference to the editor instance
  const editorRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Make sure TinyMCE is fully loaded on client side
    setIsReady(true);
  }, []);

  // Define available Persian fonts
  const persianFonts = [
    "Vazirmatn",
    "IRANSans",
    "Tahoma",
    "Arial",
    "B Nazanin",
    "B Mitra",
    "B Lotus",
    "B Titr",
  ].join(";");

  // Font sizes in Persian standard (with pt unit)
  const fontSizeFormats =
    "8pt 9pt 10pt 11pt 12pt 14pt 16pt 18pt 20pt 22pt 24pt 36pt 48pt";

  // Show loading placeholder until editor is ready
  if (!isReady) {
    return (
      <div className="h-52 min-h-[200px] bg-gray-50 animate-pulse rounded-md"></div>
    );
  }

  return (
    <div className="tinymce-wrapper" dir={dir}>
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js" // Path to self-hosted TinyMCE
        onInit={(evt: any, editor: any) => {
          editorRef.current = editor;
        }}
        initialValue={initialValue || value}
        value={value}
        onEditorChange={onChange}
        init={{
          height,
          menubar: true,
          plugins: [
            "advlist",
            "autolink",
            "lists",
            "link",
            "image",
            "charmap",
            "preview",
            "anchor",
            "searchreplace",
            "visualblocks",
            "code",
            "fullscreen",
            "insertdatetime",
            "media",
            "table",
            "help",
            "wordcount",
            "directionality",
          ].join(" "),
          toolbar1:
            "undo redo | styles fontfamily fontsize | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | ltr rtl | numlist bullist",
          toolbar2:
            "forecolor backcolor removeformat | charmap | insertfile image media link anchor | fullscreen preview",
          toolbar3:
            "table tabledelete | tableprops tablerowprops tablecellprops | tableinsertrowbefore tableinsertrowafter tabledeleterow | tableinsertcolbefore tableinsertcolafter tabledeletecol",
          language: "fa", // Persian language
          directionality: dir,
          branding: false,
          resize: true,
          placeholder,
          font_family_formats: persianFonts,
          font_size_formats: fontSizeFormats,
          content_style: `
            body { 
              font-family: Vazirmatn, IRANSans, Tahoma, Arial, sans-serif; 
              direction: ${dir}; 
              text-align: ${dir === "rtl" ? "right" : "left"};
              font-size: 14px;
              line-height: 1.6;
            }
            img { max-width: 100%; }
            p { margin: 0 0 1em 0; }
            table { width: 100%; border-collapse: collapse; }
            table td, table th { border: 1px solid #ccc; padding: 6px; }
            blockquote { margin: 1em 0; padding-right: 1em; border-right: 3px solid #ccc; }
          `,
          inline,
          readonly: disabled,
          images_upload_handler: (blobInfo: any, progress: any) => {
            return new Promise((resolve, reject) => {
              // Convert image to base64 for simple integration
              const reader = new FileReader();
              reader.onload = () => {
                resolve(reader.result as string);
              };
              reader.onerror = () => {
                reject(`Image upload failed: ${reader.error}`);
              };
              reader.readAsDataURL(blobInfo.blob());
            });
          },
          setup: (editor: any) => {
            // Add custom RTL/LTR formatting
            editor.on("init", () => {
              editor.formatter.register("paragraph-rtl", {
                block: "p",
                attributes: { dir: "rtl", style: "text-align: right" },
              });

              editor.formatter.register("paragraph-ltr", {
                block: "p",
                attributes: { dir: "ltr", style: "text-align: left" },
              });
            });

            // Add custom RTL/LTR buttons
            editor.ui.registry.addButton("rtl", {
              icon: "visualchars",
              tooltip: "راست به چپ",
              onAction: () => {
                editor.formatter.apply("paragraph-rtl");
              },
            });

            editor.ui.registry.addButton("ltr", {
              icon: "visualchars",
              tooltip: "چپ به راست",
              onAction: () => {
                editor.formatter.apply("paragraph-ltr");
              },
            });
          },
        }}
      />
    </div>
  );
};

export default TinyMCEEditorWrapper;

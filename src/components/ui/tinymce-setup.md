# TinyMCE 6.8.3 Setup Guide

This project uses TinyMCE 6.8.3 as a rich text editor. The configuration is set up to use the free, self-hosted version of TinyMCE without requiring an API key.

## Installation

TinyMCE and its React wrapper are already installed as dependencies:

```bash
# These packages are already installed
npm install --save tinymce@6.8.3 @tinymce/tinymce-react
```

## Self-Hosting Setup (Required for Free Version)

To use TinyMCE without an API key, you must set up self-hosting. We've included a script to make this easy:

```bash
# Run the setup script
npm run setup-tinymce

# Or run it directly
./setup-tinymce.sh
```

This script copies all necessary TinyMCE files from `node_modules/tinymce` to the `public/tinymce` directory, which allows TinyMCE to be loaded without an API key.

## Usage

The TinyMCE editor is implemented as a React component in `src/components/ui/tinymce-editor.tsx`. You can import and use it in your components:

```tsx
import TinyMCEEditor from "@/components/ui/tinymce-editor";

// Then use it in your component
<TinyMCEEditor
  value={content}
  onChange={setContent}
  placeholder="محتوای خود را وارد کنید..."
  dir="rtl"
  height={400}
/>;
```

## Features

The current implementation includes:

- RTL (right-to-left) support for Persian language
- Custom toolbar configurations
- Persian font support (Vazirmatn, IRANSans, etc.)
- Custom styling for the editor content
- Image upload handling (base64 conversion)
- Custom RTL/LTR formatting buttons

## Free Version Limitations

The free, self-hosted version of TinyMCE 6.8.3 has some limitations compared to the premium version:

1. Some advanced plugins like "emoticons", "template", "pagebreak", etc. are not available
2. No premium support
3. No cloud hosting (requires self-hosting the TinyMCE files)

## Production Deployment

When deploying to production, make sure:

1. The TinyMCE files are included in your build process
2. The path in `tinymceScriptSrc` in the component matches your server's file structure

If the TinyMCE editor doesn't appear, check your browser's developer console for file path errors.

## Persian Language Support

If you need Persian language support, you may need to add a Persian language file to the `/public/tinymce/langs/` directory. If our setup script didn't find language files, you may need to obtain these separately.

## TypeScript Notes

TinyMCE's React wrapper has some TypeScript issues that may show linter warnings. These don't affect functionality.

## Adding Custom Plugins

If you need to add custom functionality, you can extend the editor using the `setup` function in the TinyMCE configuration.

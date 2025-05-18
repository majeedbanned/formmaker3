#!/bin/bash

# Create TinyMCE directories in public if they don't exist
mkdir -p public/tinymce

# Copy TinyMCE core files and resources
echo "Copying TinyMCE files to public directory..."
cp -r node_modules/tinymce/tinymce.min.js public/tinymce/
cp -r node_modules/tinymce/skins public/tinymce/skins
cp -r node_modules/tinymce/themes public/tinymce/themes
cp -r node_modules/tinymce/icons public/tinymce/icons
cp -r node_modules/tinymce/plugins public/tinymce/plugins
cp -r node_modules/tinymce/models public/tinymce/models

# Handle language files - check if directory exists first
if [ -d "node_modules/tinymce/langs" ]; then
  mkdir -p public/tinymce/langs
  # Copy all available language files
  cp -r node_modules/tinymce/langs/* public/tinymce/langs/
  echo "Language files copied."
else
  echo "No language directory found. Persian language may need to be added separately."
  # Create empty langs directory
  mkdir -p public/tinymce/langs
fi

echo "TinyMCE setup complete! Files are now in public/tinymce/"
echo "TinyMCE is now configured for self-hosting without an API key." 
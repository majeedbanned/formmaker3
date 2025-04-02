export interface FileUploadConfig {
  allowedTypes?: string[];  // e.g., ['image/*', 'application/pdf']
  maxSize?: number;         // in bytes
  directory?: string;       // upload directory
  multiple?: boolean;       // allow multiple files
}

export interface UploadedFile {
  filename: string;
  originalName: string;
  path: string;
  size: number;
  type: string;
  uploadedAt: string;
}

export async function uploadFile(
  file: File,
  config: FileUploadConfig = {}
): Promise<UploadedFile> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    if (config.directory) {
      formData.append('directory', config.directory);
    }

    // Get the current domain
    const domain = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'x-domain': domain
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('File upload error:', error);
    throw error;
  }
}

export function validateFile(file: File, config: FileUploadConfig = {}): string | null {
  if (config.maxSize && file.size > config.maxSize) {
    return `File size exceeds ${config.maxSize / 1024 / 1024}MB limit`;
  }

  if (config.allowedTypes && config.allowedTypes.length > 0) {
    const isValidType = config.allowedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType + '/');
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`;
    }
  }

  return null;
}

export function getFileIcon(fileType: string): string {
  if (fileType.startsWith('image/')) {
    return '🖼️';
  } else if (fileType.startsWith('video/')) {
    return '🎥';
  } else if (fileType.startsWith('audio/')) {
    return '🎵';
  } else if (fileType === 'application/pdf') {
    return '📄';
  } else if (fileType.includes('word')) {
    return '📝';
  } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
    return '📊';
  } else {
    return '📁';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
} 
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload, File, Image, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

interface FileUploadProps {
  bucket: string;
  entityId: string;
  entityType: 'character' | 'story' | 'session';
  attachments: FileAttachment[];
  onAttachmentsChange: (attachments: FileAttachment[]) => void;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  className?: string;
}

export function FileUpload({
  bucket,
  entityId,
  entityType,
  attachments,
  onAttachmentsChange,
  accept = '*/*',
  maxFiles = 10,
  maxSize = 20,
  className
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    const newAttachments: FileAttachment[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      for (const file of Array.from(files)) {
        if (file.size > maxSize * 1024 * 1024) {
          toast({
            title: "File too large",
            description: `${file.name} exceeds ${maxSize}MB limit`,
            variant: "destructive",
          });
          continue;
        }

        const fileExt = file.name.split('.').pop();
        // For new entities, use a timestamp-based folder instead of "new" to avoid conflicts
        const folderName = entityId === 'new' 
          ? `${entityType}s/${Date.now()}-${Math.random().toString(36).substring(2)}`
          : `${entityType}-${entityId}`;
        const fileName = `${user.id}/${folderName}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(fileName, file);

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        const attachment: FileAttachment = {
          id: data.path,
          name: file.name,
          type: file.type,
          size: file.size,
          url: publicUrl,
          uploaded_at: new Date().toISOString(),
        };

        newAttachments.push(attachment);
      }

      onAttachmentsChange([...attachments, ...newAttachments]);
      
      if (newAttachments.length > 0) {
        toast({
          title: "Files uploaded",
          description: `${newAttachments.length} file(s) uploaded successfully`,
        });
      }
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = async (attachment: FileAttachment) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([attachment.id]);

      if (error) throw error;

      onAttachmentsChange(attachments.filter(a => a.id !== attachment.id));
      
      toast({
        title: "File removed",
        description: `${attachment.name} has been removed`,
      });
    } catch (error: any) {
      toast({
        title: "Remove failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(e.dataTransfer.files);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <Label className="text-foreground">File Attachments</Label>
        <div
          className={cn(
            "mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors",
            "border-border hover:border-primary/50",
            dragActive && "border-primary bg-primary/5",
            uploading && "pointer-events-none opacity-50"
          )}
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Input
            ref={fileInputRef}
            type="file"
            multiple
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          
          {uploading ? (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-muted-foreground">Uploading...</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              <div>
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mb-2"
                >
                  Choose Files
                </Button>
                <p className="text-sm text-muted-foreground">
                  or drag and drop files here
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {maxFiles} files, {maxSize}MB each
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {attachments.length > 0 && (
        <div className="space-y-2">
          <Label className="text-foreground">Uploaded Files ({attachments.length})</Label>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg bg-secondary/50"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(attachment.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {attachment.name}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(attachment.size)}</span>
                      <span>•</span>
                      <span>{new Date(attachment.uploaded_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {attachment.type.startsWith('image/') && (
                    <Badge variant="outline" className="text-xs">Image</Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttachment(attachment)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
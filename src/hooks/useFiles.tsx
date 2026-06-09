import { useState } from 'react';
import { notify } from "@/lib/notify";
import { supabase } from '@/integrations/supabase/client';
export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

export function useFiles() {
  const [uploading, setUploading] = useState(false);
  const uploadFile = async (
    file: File,
    bucket: string,
    entityId: string,
    entityType: string
  ): Promise<FileAttachment | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${entityType}-${entityId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      return {
        id: data.path,
        name: file.name,
        type: file.type,
        size: file.size,
        url: publicUrl,
        uploaded_at: new Date().toISOString(),
      };
    } catch (error: any) {
      notify.error("Upload failed", error.message);
      return null;
    }
  };

  const deleteFile = async (bucket: string, filePath: string): Promise<boolean> => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      notify.error("Delete failed", error.message);
      return false;
    }
  };

  const downloadFile = async (bucket: string, filePath: string): Promise<Blob | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(filePath);

      if (error) throw error;
      return data;
    } catch (error: any) {
      notify.error("Download failed", error.message);
      return null;
    }
  };

  return {
    uploading,
    uploadFile,
    deleteFile,
    downloadFile,
  };
}
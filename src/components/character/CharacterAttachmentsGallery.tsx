import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Image, X, Download, ExternalLink, FileIcon } from "lucide-react";

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploaded_at: string;
}

interface CharacterAttachmentsGalleryProps {
  attachments?: FileAttachment[];
}

export function CharacterAttachmentsGallery({ attachments }: CharacterAttachmentsGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<FileAttachment | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<FileAttachment | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [loadingDocument, setLoadingDocument] = useState(false);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const imageAttachments = attachments.filter(a => 
    a.type.startsWith('image/') || 
    /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(a.name)
  );

  const documentAttachments = attachments.filter(a => 
    !a.type.startsWith('image/') && 
    !/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(a.name)
  );

  const isTextFile = (attachment: FileAttachment) => {
    const textTypes = ['text/plain', 'text/markdown', 'text/html', 'application/json'];
    const textExtensions = ['.txt', '.md', '.json', '.html', '.css', '.js', '.ts', '.xml'];
    return textTypes.includes(attachment.type) || 
           textExtensions.some(ext => attachment.name.toLowerCase().endsWith(ext));
  };

  const isPdfFile = (attachment: FileAttachment) => {
    return attachment.type === 'application/pdf' || 
           attachment.name.toLowerCase().endsWith('.pdf');
  };

  const handleDocumentClick = async (attachment: FileAttachment) => {
    setSelectedDocument(attachment);
    
    if (isTextFile(attachment)) {
      setLoadingDocument(true);
      try {
        const response = await fetch(attachment.url);
        const text = await response.text();
        setDocumentContent(text);
      } catch (error) {
        setDocumentContent("Failed to load document content.");
      } finally {
        setLoadingDocument(false);
      }
    } else {
      setDocumentContent(null);
    }
  };

  const closeDocumentDialog = () => {
    setSelectedDocument(null);
    setDocumentContent(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (attachment: FileAttachment) => {
    if (isPdfFile(attachment)) return <FileText className="h-6 w-6 text-red-500" />;
    if (isTextFile(attachment)) return <FileText className="h-6 w-6 text-blue-500" />;
    return <FileIcon className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Attachments</h3>
      
      {/* Image Gallery */}
      {imageAttachments.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <Image className="h-4 w-4" />
            Images ({imageAttachments.length})
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {imageAttachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => setSelectedImage(attachment)}
                className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors cursor-pointer group relative"
              >
                <img
                  src={attachment.url}
                  alt={attachment.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Document List */}
      {documentAttachments.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documents ({documentAttachments.length})
          </h4>
          <div className="space-y-2">
            {documentAttachments.map((attachment) => (
              <button
                key={attachment.id}
                onClick={() => handleDocumentClick(attachment)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary hover:bg-accent/50 transition-colors text-left"
              >
                {getFileIcon(attachment)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{attachment.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Image Lightbox */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent size="lg" className="p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{selectedImage?.name}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a href={selectedImage?.url} download={selectedImage?.name} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-2 flex items-center justify-center">
            {selectedImage && (
              <img
                src={selectedImage.url}
                alt={selectedImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer */}
      <Dialog open={!!selectedDocument} onOpenChange={closeDocumentDialog}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{selectedDocument?.name}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a href={selectedDocument?.url} download={selectedDocument?.name} target="_blank" rel="noopener noreferrer">
                    <Download className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  asChild
                >
                  <a href={selectedDocument?.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedDocument && (
            <div className="mt-4">
              {isPdfFile(selectedDocument) ? (
                <iframe
                  src={selectedDocument.url}
                  className="w-full h-[60vh] rounded-lg border border-border"
                  title={selectedDocument.name}
                />
              ) : isTextFile(selectedDocument) ? (
                <ScrollArea className="h-[60vh] rounded-lg border border-border">
                  {loadingDocument ? (
                    <div className="p-4 text-muted-foreground">Loading...</div>
                  ) : (
                    <pre className="p-4 text-sm whitespace-pre-wrap font-mono">
                      {documentContent}
                    </pre>
                  )}
                </ScrollArea>
              ) : (
                <div className="flex flex-col items-center justify-center h-[40vh] text-muted-foreground">
                  <FileIcon className="h-16 w-16 mb-4" />
                  <p className="text-center mb-4">
                    This file type cannot be previewed directly.
                  </p>
                  <Button asChild>
                    <a href={selectedDocument.url} download={selectedDocument.name}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}

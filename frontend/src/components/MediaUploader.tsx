import { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Film } from 'lucide-react';
import { MediaItem } from '../types';
import { uploadMedia } from '../services/mediaService';

interface MediaUploaderProps {
  media: MediaItem[];
  onChange: (media: MediaItem[]) => void;
}

const MediaUploader = ({ media, onChange }: MediaUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newMedia = [...media];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await uploadMedia(file);
        newMedia.push({
          type: result.resource_type,
          url: result.url,
          publicId: result.public_id,
        });
      } catch (error) {
        console.error('Upload error:', error);
        alert(`Failed to upload ${file.name}`);
      }
    }

    onChange(newMedia);
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    const newMedia = [...media];
    newMedia.splice(index, 1);
    onChange(newMedia);
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-zinc-700">Media Attachments</label>
      
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {media.map((item, index) => (
          <div key={index} className="relative aspect-video overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            {item.type === 'video' ? (
              <video src={item.url} className="h-full w-full object-cover" />
            ) : (
              <img src={item.url} alt="" className="h-full w-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => removeMedia(index)}
              className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X size={14} />
            </button>
            <div className="absolute bottom-1 left-1 rounded bg-black/40 px-1 text-[10px] font-bold text-white uppercase">
              {item.type}
            </div>
          </div>
        ))}
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex aspect-video flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-white text-zinc-400 transition-colors hover:border-[#012585]/30 hover:bg-[#012585]/[0.02] hover:text-[#012585]"
        >
          {uploading ? (
            <div className="animate-pulse text-sm font-bold">Uploading...</div>
          ) : (
            <>
              <Upload size={24} className="mb-2" />
              <span className="text-xs font-bold">Add Media</span>
            </>
          )}
        </button>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        multiple
        accept="image/*,video/*"
        className="hidden"
      />
      <p className="text-xs text-zinc-500">
        Images (JPG, PNG, GIF, WebP) and Videos (MP4, WEBM) supported.
      </p>
    </div>
  );
};

export default MediaUploader;

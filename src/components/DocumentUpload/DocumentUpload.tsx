/**
 * DocumentUpload — drag-and-drop + click file picker.
 * Files are stored as blob URLs for in-session viewing.
 * No backend required.
 */
import { useRef, useState } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Eye, Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { USE_SUPABASE } from '../../context/AppStoreContext';
import { DocumentViewer } from '../DocumentViewer/DocumentViewer';
import styles from './DocumentUpload.module.css';

export interface UploadedFile {
  id: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  url: string;   // blob URL — valid for this browser session
}

interface Props {
  label: string;
  accept?: string;          // e.g. '.pdf,.jpg,.jpeg,.png'
  maxSizeMB?: number;
  value?: UploadedFile | null;
  onChange: (file: UploadedFile | null) => void;
  hint?: string;
}

const MAX_DEFAULT_MB = 5;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(mime: string) {
  return mime.startsWith('image/');
}

export default function DocumentUpload({ label, accept = '.pdf,.jpg,.jpeg,.png', maxSizeMB = MAX_DEFAULT_MB, value, onChange, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null);

  const process = async (file: File) => {
    setError('');
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File is too large. Maximum size is ${maxSizeMB} MB.`);
      return;
    }
    const allowedTypes = accept.split(',').map(a => a.trim().toLowerCase());
    const ext = '.' + file.name.split('.').pop()!.toLowerCase();
    const mimeOk = file.type.startsWith('image/') || file.type === 'application/pdf';
    const extOk  = allowedTypes.includes(ext);
    if (!mimeOk || !extOk) {
      setError(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    try {
      setIsUploading(true);
      const fileId = `doc_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      if (USE_SUPABASE) {
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`public/${fileId}`, file, {
            cacheControl: '3600',
            upsert: false
          });
          
        if (uploadError) throw uploadError;
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(`public/${fileId}`);
          
        onChange({ id: fileId, name: file.name, sizeBytes: file.size, mimeType: file.type, url: urlData.publicUrl });
      } else {
        // Local Mock (Blob URL)
        if (value?.url && value.url.startsWith('blob:')) URL.revokeObjectURL(value.url);
        const url = URL.createObjectURL(file);
        onChange({ id: fileId, name: file.name, sizeBytes: file.size, mimeType: file.type, url });
      }
    } catch (err: any) {
      console.error('Supabase Upload Failed:', err);
      setError('Upload failed. Please check your connection and try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleInput = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) process(file);
    e.target.value = '';
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) process(file);
  };

  const removeFile = async () => {
    if (value) {
      try {
        if (USE_SUPABASE && !value.url.startsWith('blob:')) {
          await supabase.storage.from('documents').remove([`public/${value.id}`]);
        } else if (value.url.startsWith('blob:')) {
          URL.revokeObjectURL(value.url);
        }
      } catch (err) {
        console.error('Failed to remove file from Supabase:', err);
      }
    }
    onChange(null);
    setError('');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.labelRow}>
        <span className={styles.label}>{label}</span>
        {hint && <span className={styles.hint}>{hint}</span>}
      </div>

      {value ? (
        <div className={styles.uploaded}>
          {isImage(value.mimeType) ? (
            <img src={value.url} alt={value.name} className={styles.thumb} />
          ) : (
            <div className={styles.pdfIcon}><FileText size={28} /></div>
          )}
          <div className={styles.fileInfo}>
            <span className={styles.fileName}>{value.name}</span>
            <span className={styles.fileSize}>{formatBytes(value.sizeBytes)}</span>
            <span className={styles.uploadedBadge}><CheckCircle2 size={11} /> Uploaded</span>
          </div>
          <button type="button" onClick={() => setViewingDoc({ url: value.url, name: value.name })} className={styles.viewBtn} title="View file">
            <Eye size={15} />
          </button>
          <button className={styles.removeBtn} onClick={removeFile} title="Remove">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ''} ${error ? styles.hasError : ''} ${isUploading ? styles.uploading : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
        >
          <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={handleInput} disabled={isUploading} />
          {isUploading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <Loader2 size={28} className={styles.spinner} style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }} />
              <p style={{ fontWeight: 500, color: 'var(--text)' }}>Uploading to secure storage...</p>
            </div>
          ) : (
            <>
              <Upload size={22} className={styles.uploadIcon} />
              <p className={styles.dropText}>
                <strong>Drag &amp; drop</strong> or <strong>click to browse</strong>
              </p>
              <p className={styles.dropSub}>{accept.replace(/\./g, '').toUpperCase().split(',').join(', ')} · max {maxSizeMB} MB</p>
            </>
          )}
        </div>
      )}

      {error && (
        <div className={styles.errorMsg}><AlertCircle size={13} />{error}</div>
      )}

      {viewingDoc && (
        <DocumentViewer
          url={viewingDoc.url}
          title={viewingDoc.name}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
}

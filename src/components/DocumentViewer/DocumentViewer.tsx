import React, { useEffect, useState } from 'react';
import { X, Download, Loader2, AlertCircle } from 'lucide-react';
import styles from './DocumentViewer.module.css';

interface DocumentViewerProps {
    url: string;
    onClose: () => void;
    title?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, onClose, title = "Document View" }) => {
    const [viewerUrl, setViewerUrl] = useState<string>(url);
    const [downloadUrl, setDownloadUrl] = useState<string>(url);
    const [loading, setLoading] = useState(true);
    const [isImage, setIsImage] = useState(false);
    const [error, setError] = useState(false);

    // Close on escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        let isMounted = true;
        let objectUrl = '';

        const loadDocument = async () => {
            try {
                // For data URIs or object URLs, use directly
                if (url.startsWith('data:') || url.startsWith('blob:')) {
                    if (url.startsWith('data:image/')) setIsImage(true);
                    setViewerUrl(url);
                    setDownloadUrl(url);
                    setLoading(false);
                    return;
                }

                // Fetch the file to bypass X-Frame-Options and get mime type
                const res = await fetch(url);
                if (!res.ok) throw new Error('Network response was not ok');
                
                let blob = await res.blob();
                if (!isMounted) return;

                if (blob.type.startsWith('image/')) {
                    setIsImage(true);
                } else if (url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)($|\?)/)) {
                    setIsImage(true);
                }
                
                // Chrome iframe doesn't like application/octet-stream for PDFs
                if (blob.type === 'application/octet-stream' && url.toLowerCase().includes('.pdf')) {
                    blob = new Blob([blob], { type: 'application/pdf' });
                }

                objectUrl = URL.createObjectURL(blob);
                setViewerUrl(objectUrl);
                setDownloadUrl(objectUrl);
            } catch (err) {
                console.warn('Could not fetch document for preview, falling back.', err);
                if (!isMounted) return;
                
                // Fallback strategies if fetch fails (e.g. CORS issues)
                if (url.toLowerCase().match(/\.(jpeg|jpg|gif|png|webp|bmp|svg)($|\?)/)) {
                    setIsImage(true);
                    setViewerUrl(url);
                } else if (url.toLowerCase().includes('.pdf')) {
                    setViewerUrl(`https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`);
                } else {
                    setViewerUrl(url); // Hope for the best
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadDocument();

        return () => {
            isMounted = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [url]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <div className={styles.actions}>
                        <a 
                            href={downloadUrl} 
                            download={title || "document"} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={styles.downloadBtn}
                        >
                            <Download size={18} />
                            Download
                        </a>
                        <button onClick={onClose} className={styles.iconButton} aria-label="Close viewer">
                            <X size={20} />
                        </button>
                    </div>
                </div>
                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.messageState}>
                            <Loader2 size={32} className={styles.spinner} style={{ marginBottom: 16 }} />
                            <p>Loading document preview...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.messageState}>
                            <AlertCircle size={32} style={{ marginBottom: 16, color: 'var(--error, #ef4444)' }} />
                            <p>Could not load document preview.</p>
                            <a href={url} download target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary, #2563eb)', textDecoration: 'underline', marginTop: 8 }}>Try downloading the file instead.</a>
                        </div>
                    ) : isImage ? (
                        <div className={styles.imageContainer}>
                            <img src={viewerUrl} alt={title} className={styles.image} onError={() => setError(true)} />
                        </div>
                    ) : (
                        <iframe src={viewerUrl} className={styles.iframe} title={title} onError={() => setError(true)} />
                    )}
                </div>
            </div>
        </div>
    );
};

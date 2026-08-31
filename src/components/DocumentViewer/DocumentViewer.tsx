import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import styles from './DocumentViewer.module.css';

interface DocumentViewerProps {
    url: string;
    onClose: () => void;
    title?: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, onClose, title = "Document View" }) => {
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

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    <div className={styles.actions}>
                        <a 
                            href={url} 
                            download 
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
                    <iframe src={url} className={styles.iframe} title={title} />
                </div>
            </div>
        </div>
    );
};

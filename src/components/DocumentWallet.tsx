import { useState } from 'react';
import { FileText, FolderOpen, Image, ShieldCheck, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DocumentViewer } from './DocumentViewer/DocumentViewer';
import { useAppStore } from '../context/AppStoreContext';
import { PERMIT_TYPES } from '../data/mockData';
import type { Document, PermitApplication } from '../types';

type WalletDocument = Document & {
  applicationId: string;
  serviceLabel: string;
  ownerLabel: string;
};

const SOURCE_LABEL = {
  customer: 'Customer upload',
  provider: 'Service provider upload',
  staff: 'Office staff upload',
};

function getWalletDocuments(apps: PermitApplication[]): WalletDocument[] {
  return apps.flatMap(app => {
    const serviceLabel = PERMIT_TYPES.find(type => type.value === app.type)?.label ?? app.type;
    const documents = app.documents.map(document => ({
      ...document,
      uploadedBy: document.uploadedBy ?? 'customer' as const,
      applicationId: app.id,
      serviceLabel,
      ownerLabel: app.customerName,
    }));

    if (!app.planUrl) return documents;
    return [...documents, {
      id: `plan_${app.id}`,
      name: `Plan revision ${app.planRevisions?.at(-1)?.version ?? ''}`.trim(),
      type: 'pdf',
      uploadedAt: app.planRevisions?.at(-1)?.uploadedAt ?? app.updatedAt,
      uploadedBy: app.planRevisions?.at(-1)?.uploadedBy ?? 'provider' as const,
      status: 'verified' as const,
      url: app.planUrl,
      applicationId: app.id,
      serviceLabel,
      ownerLabel: app.customerName,
    }];
  });
}

export default function DocumentWallet() {
  const [viewingDoc, setViewingDoc] = useState<{ url: string; name: string } | null>(null);
  const { user } = useAuth();
  const { getAppsForUser } = useAppStore();
  const documents = getWalletDocuments(user ? getAppsForUser(user) : []);
  const serviceGroups = [...new Set(documents.map(document => document.serviceLabel))];

  return (
    <div className="page-enter" style={{ maxWidth: 1120, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: 'var(--text)' }}>Document Wallet</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>Your securely stored application documents, grouped by service and uploader.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#166534', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
          <ShieldCheck size={18} /> {documents.length} secured documents
        </div>
      </header>

      {documents.length === 0 ? (
        <div style={{ padding: '64px 24px', textAlign: 'center', border: '1px dashed #cbd5e1', background: '#f8fafc' }}>
          <FolderOpen size={42} color="#64748b" />
          <p style={{ margin: '14px 0 0', color: '#475569' }}>Documents you upload or receive through an application will appear here automatically.</p>
        </div>
      ) : serviceGroups.map(service => {
        const serviceDocuments = documents.filter(document => document.serviceLabel === service);
        const owners = [...new Set(serviceDocuments.map(document => document.ownerLabel))];
        return (
          <section key={service} style={{ marginBottom: 28 }}>
            <div style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: 10, marginBottom: 14 }}>
              <h2 style={{ fontSize: 17, margin: 0, color: '#0f172a' }}>{service}</h2>
              <span style={{ fontSize: 12, color: '#64748b' }}>{serviceDocuments.length} document{serviceDocuments.length === 1 ? '' : 's'} · {owners.join(', ')}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(255px, 1fr))', gap: 12 }}>
              {serviceDocuments.map(document => (
                <article key={`${document.applicationId}_${document.id}`} style={{ border: '1px solid #dbe3ed', padding: 14, background: 'white' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    {document.type.toLowerCase().match(/png|jpg|jpeg|image/) ? <Image size={20} color="#0f766e" /> : <FileText size={20} color="#2563eb" />}
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong style={{ display: 'block', color: '#0f172a', fontSize: 14, overflowWrap: 'anywhere' }}>{document.name}</strong>
                      <span style={{ display: 'block', marginTop: 4, color: '#475569', fontSize: 12 }}>{SOURCE_LABEL[document.uploadedBy ?? 'customer']}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, fontSize: 12, color: '#64748b' }}>
                    <span>{document.applicationId}</span>
                    {document.url && <button type="button" onClick={() => setViewingDoc({ url: document.url!, name: document.name })} aria-label={`Open ${document.name}`} title="Open document" style={{ color: '#2563eb', display: 'inline-flex', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><ExternalLink size={16} /></button>}
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
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
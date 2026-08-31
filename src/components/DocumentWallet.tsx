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
  // Group documents by application ID
  const appGroups = [...new Set(documents.map(d => d.applicationId))];

  return (
    <div className="page-enter" style={{ maxWidth: 1120, margin: '0 auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 28, color: 'var(--text)' }}>Document Wallet</h1>
          <p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>Your securely stored application documents, organized by customer application.</p>
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
      ) : appGroups.map(appId => {
        const appDocs = documents.filter(d => d.applicationId === appId);
        const ownerName = appDocs[0]?.ownerLabel || 'Unknown Customer';
        const serviceName = appDocs[0]?.serviceLabel || 'Service';
        
        return (
          <section key={appId} style={{ marginBottom: 32, background: 'white', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ background: '#f8fafc', padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: 16, margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>{appId}</span>
                  {ownerName}
                </h2>
                <span style={{ fontSize: 13, color: '#64748b', marginTop: 4, display: 'block' }}>{serviceName}</span>
              </div>
              <span style={{ fontSize: 13, color: '#64748b', background: '#e2e8f0', padding: '2px 8px', borderRadius: 12 }}>{appDocs.length} document{appDocs.length === 1 ? '' : 's'}</span>
            </div>
            
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Document Name</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Uploaded By</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500 }}>Status</th>
                    <th style={{ padding: '12px 20px', fontWeight: 500, textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {appDocs.map(doc => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 20px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
                        {doc.type.toLowerCase().match(/png|jpg|jpeg|image/) ? <Image size={18} color="#0f766e" /> : <FileText size={18} color="#2563eb" />}
                        {doc.name}
                      </td>
                      <td style={{ padding: '14px 20px', color: '#475569' }}>{SOURCE_LABEL[doc.uploadedBy ?? 'customer']}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <span className={`badge ${doc.status === 'verified' ? 'badge-success' : doc.status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>{doc.status}</span>
                      </td>
                      <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                        {doc.url && (
                          <button type="button" onClick={() => setViewingDoc({ url: doc.url!, name: doc.name })} className="btn btn-outline" style={{ padding: '4px 12px', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <ExternalLink size={14} /> View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
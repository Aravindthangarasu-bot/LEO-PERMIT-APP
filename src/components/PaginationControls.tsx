interface PaginationControlsProps {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({ page, pageCount, total, onPageChange }: PaginationControlsProps) {
  if (pageCount <= 1) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total} records · Page {page} of {pageCount}</span>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" className="btn btn-outline" disabled={page === 1} onClick={() => onPageChange(page - 1)}>Previous</button>
        <button type="button" className="btn btn-outline" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>Next</button>
      </div>
    </div>
  );
}

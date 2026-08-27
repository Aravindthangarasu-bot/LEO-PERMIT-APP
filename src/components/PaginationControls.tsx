import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function PaginationControls({ page, pageCount, total, onPageChange }: PaginationControlsProps) {
  if (pageCount <= 1) return null;
  const pageNumbers: Array<number | '...'> = [];
  if (pageCount <= 5) {
    for (let index = 1; index <= pageCount; index += 1) pageNumbers.push(index);
  } else {
    pageNumbers.push(1);
    if (page > 3) pageNumbers.push('...');
    for (let index = Math.max(2, page - 1); index <= Math.min(pageCount - 1, page + 1); index += 1) pageNumbers.push(index);
    if (page < pageCount - 2) pageNumbers.push('...');
    pageNumbers.push(pageCount);
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '14px 16px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{total} records · Page {page} of {pageCount}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button type="button" className="btn btn-outline" aria-label="Previous page" disabled={page === 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={15} /> Previous</button>
        {pageNumbers.map((number, index) => number === '...'
          ? <span key={`ellipsis-${index}`} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>
          : <button key={number} type="button" className={`btn ${number === page ? 'btn-primary' : 'btn-outline'}`} aria-current={number === page ? 'page' : undefined} aria-label={`Page ${number}`} onClick={() => onPageChange(number)} style={{ minWidth: 34, padding: '8px 10px' }}>{number}</button>)}
        <button type="button" className="btn btn-outline" aria-label="Next page" disabled={page === pageCount} onClick={() => onPageChange(page + 1)}>Next <ChevronRight size={15} /></button>
      </div>
    </div>
  );
}

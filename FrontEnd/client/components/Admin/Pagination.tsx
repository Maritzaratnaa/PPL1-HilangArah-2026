interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const from = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const to = Math.min(currentPage * itemsPerPage, totalItems);

  if (totalItems === 0) return null;

  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-card border border-border rounded-xl px-4 py-3">
      <span className="text-sm text-muted-foreground">
        Showing <strong>{from}</strong> to <strong>{to}</strong> of <strong>{totalItems}</strong> entries
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors">
            ‹
          </button>
          <span className="text-sm font-semibold min-w-[2rem] text-center">{currentPage}</span>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-muted transition-colors">
            ›
          </button>
        </div>
      )}
    </div>
  );
}
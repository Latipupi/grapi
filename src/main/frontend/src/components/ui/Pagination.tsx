import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalEntries: number;
  indexOfFirstEntry: number;
  indexOfLastEntry: number;
  label?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalEntries,
  indexOfFirstEntry,
  indexOfLastEntry,
  label = 'data',
}) => {
  if (totalPages <= 1) return null;

  const pageNumbers: (number | string)[] = [];
  const maxVisiblePages = 5;

  if (totalPages <= maxVisiblePages) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);
    if (currentPage > 3) {
      pageNumbers.push('...');
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
    if (currentPage < totalPages - 2) {
      pageNumbers.push('...');
    }
    pageNumbers.push(totalPages);
  }

  return (
    <div className="p-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/30">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
        Menampilkan {totalEntries === 0 ? 0 : indexOfFirstEntry + 1} - {Math.min(indexOfLastEntry, totalEntries)} Dari {totalEntries} {label}
      </span>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl flex items-center gap-1.5 font-bold text-xs"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Sebelumnya</span>
        </Button>
        
        <div className="flex items-center gap-1">
          {pageNumbers.map((p, i) => {
            if (p === '...') {
              return (
                <span key={`dots-${i}`} className="w-9 text-center text-slate-400 font-bold text-sm">
                  ...
                </span>
              );
            }
            return (
              <Button
                key={`page-${p}`}
                variant={currentPage === p ? 'primary' : 'outline'}
                size="sm"
                className={`h-9 w-9 p-0 rounded-xl font-bold text-xs ${
                  currentPage === p
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-100 text-white'
                    : ''
                }`}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="h-9 px-3 rounded-xl flex items-center gap-1.5 font-bold text-xs"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <span className="hidden sm:inline">Berikutnya</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

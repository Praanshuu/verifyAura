import React from "react";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
  } from "@/components/ui/table";
  import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
  } from "@/components/ui/pagination";
  
  interface DataTableProps<T> {
    columns: string[];
    rows: T[];
    renderRow: (row: T) => React.ReactNode;
    pagination?: {
      currentPage: number;
      totalPages: number;
      onPageChange: (page: number) => void;
      itemsLabel: string;
      startIndex: number;
      pageSize: number;
      totalItems: number;
    };
  }
  
  export function DataTable<T>({
    columns,
    rows,
    renderRow,
    pagination,
  }: DataTableProps<T>) {
    const renderPaginationItems = () => {
      if (!pagination || pagination.totalPages <= 1) return null;
      
      const items = [];
      const maxVisiblePages = 5;
      let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
      let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
      
      // Adjust start page if we're near the end
      if (endPage - startPage < maxVisiblePages - 1) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
      }
      
      // First page
      if (startPage > 1) {
        items.push(
          <PaginationItem key={1}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                pagination.onPageChange(1);
              }}
              isActive={pagination.currentPage === 1}
            >
              1
            </PaginationLink>
          </PaginationItem>
        );
        
        if (startPage > 2) {
          items.push(
            <PaginationItem key="ellipsis1">
              <span className="px-2">...</span>
            </PaginationItem>
          );
        }
      }
      
      // Visible pages
      for (let i = startPage; i <= endPage; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                pagination.onPageChange(i);
              }}
              isActive={pagination.currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Last page
      if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
          items.push(
            <PaginationItem key="ellipsis2">
              <span className="px-2">...</span>
            </PaginationItem>
          );
        }
        
        items.push(
          <PaginationItem key={pagination.totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault();
                pagination.onPageChange(pagination.totalPages);
              }}
              isActive={pagination.currentPage === pagination.totalPages}
            >
              {pagination.totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      return items;
    };

    return (
      <div className="space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((row) => renderRow(row))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-6">
                  No data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
  
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-muted-foreground">
              Showing {pagination.startIndex + 1} to{" "}
              {Math.min(
                pagination.startIndex + pagination.pageSize,
                pagination.totalItems
              )}{" "}
              of {pagination.totalItems} {pagination.itemsLabel}
            </div>
  
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.currentPage > 1)
                        pagination.onPageChange(pagination.currentPage - 1);
                    }}
                    className={
                      pagination.currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>

                {renderPaginationItems()}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.currentPage < pagination.totalPages)
                        pagination.onPageChange(pagination.currentPage + 1);
                    }}
                    className={
                      pagination.currentPage === pagination.totalPages
                        ? "pointer-events-none opacity-50"
                        : ""
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    );
  }
  
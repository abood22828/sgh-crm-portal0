/**
 * usePagination - Hook مشترك لإدارة حالة ترقيم الصفحات
 * 
 * يوفر:
 * - إدارة الصفحة الحالية وحجم الصفحة
 * - حساب عدد الصفحات الكلي
 * - تقطيع البيانات حسب الصفحة الحالية
 * - إعادة تعيين الصفحة عند تغيير الفلاتر
 */
import { useState, useMemo, useCallback } from "react";
import type { PageSizeValue } from "@/components/Pagination";

interface UsePaginationOptions {
  /** حجم الصفحة الافتراضي */
  defaultPageSize?: PageSizeValue;
  /** الصفحة الافتراضية */
  defaultPage?: number;
}

interface UsePaginationReturn<T> {
  /** الصفحة الحالية */
  currentPage: number;
  /** تعيين الصفحة الحالية */
  setCurrentPage: (page: number) => void;
  /** حجم الصفحة */
  pageSize: PageSizeValue;
  /** تعيين حجم الصفحة (يعيد تعيين الصفحة إلى 1) */
  setPageSize: (size: PageSizeValue) => void;
  /** حجم الصفحة كرقم */
  numericPageSize: number;
  /** عدد الصفحات الكلي */
  totalPages: number;
  /** البيانات المقطعة حسب الصفحة الحالية */
  paginatedData: T[];
  /** إعادة تعيين الصفحة إلى 1 */
  resetPage: () => void;
  /** خصائص جاهزة لمكون Pagination */
  paginationProps: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    pageSize: PageSizeValue;
    onPageSizeChange: (size: PageSizeValue) => void;
  };
}

export function usePagination<T>(
  data: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { defaultPageSize = "100", defaultPage = 1 } = options;

  const [currentPage, setCurrentPage] = useState(defaultPage);
  const [pageSize, setPageSizeState] = useState<PageSizeValue>(defaultPageSize);

  const numericPageSize = pageSize === "all" ? data.length : parseInt(pageSize);
  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(data.length / numericPageSize));

  const paginatedData = useMemo(() => {
    if (pageSize === "all") return data;
    const start = (currentPage - 1) * numericPageSize;
    return data.slice(start, start + numericPageSize);
  }, [data, currentPage, numericPageSize, pageSize]);

  const setPageSize = useCallback((size: PageSizeValue) => {
    setPageSizeState(size);
    setCurrentPage(1);
  }, []);

  const resetPage = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const paginationProps = useMemo(() => ({
    currentPage,
    totalPages,
    onPageChange: setCurrentPage,
    totalItems: data.length,
    itemsPerPage: numericPageSize,
    pageSize,
    onPageSizeChange: setPageSize,
  }), [currentPage, totalPages, data.length, numericPageSize, pageSize, setPageSize]);

  return {
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    numericPageSize,
    totalPages,
    paginatedData,
    resetPage,
    paginationProps,
  };
}

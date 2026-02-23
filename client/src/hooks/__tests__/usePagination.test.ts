import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  const testData = Array.from({ length: 250 }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));

  it('should initialize with default values', () => {
    const { result } = renderHook(() => usePagination(testData));
    
    expect(result.current.currentPage).toBe(1);
    expect(result.current.pageSize).toBe('100');
    expect(result.current.numericPageSize).toBe(100);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.paginatedData.length).toBe(100);
  });

  it('should initialize with custom default values', () => {
    const { result } = renderHook(() => usePagination(testData, { defaultPageSize: '50', defaultPage: 2 }));
    
    expect(result.current.currentPage).toBe(2);
    expect(result.current.pageSize).toBe('50');
    expect(result.current.numericPageSize).toBe(50);
    expect(result.current.totalPages).toBe(5);
    expect(result.current.paginatedData.length).toBe(50);
    expect(result.current.paginatedData[0].id).toBe(51);
  });

  it('should paginate data correctly', () => {
    const { result } = renderHook(() => usePagination(testData, { defaultPageSize: '100' }));
    
    // Page 1: items 1-100
    expect(result.current.paginatedData[0].id).toBe(1);
    expect(result.current.paginatedData[99].id).toBe(100);
    
    // Go to page 2
    act(() => {
      result.current.setCurrentPage(2);
    });
    
    expect(result.current.paginatedData[0].id).toBe(101);
    expect(result.current.paginatedData[99].id).toBe(200);
    
    // Go to page 3 (last page with 50 items)
    act(() => {
      result.current.setCurrentPage(3);
    });
    
    expect(result.current.paginatedData.length).toBe(50);
    expect(result.current.paginatedData[0].id).toBe(201);
  });

  it('should handle "all" page size', () => {
    const { result } = renderHook(() => usePagination(testData));
    
    act(() => {
      result.current.setPageSize('all');
    });
    
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedData.length).toBe(250);
    expect(result.current.currentPage).toBe(1);
  });

  it('should reset page to 1 when page size changes', () => {
    const { result } = renderHook(() => usePagination(testData, { defaultPageSize: '50' }));
    
    act(() => {
      result.current.setCurrentPage(3);
    });
    expect(result.current.currentPage).toBe(3);
    
    act(() => {
      result.current.setPageSize('100');
    });
    expect(result.current.currentPage).toBe(1);
  });

  it('should reset page via resetPage', () => {
    const { result } = renderHook(() => usePagination(testData));
    
    act(() => {
      result.current.setCurrentPage(3);
    });
    expect(result.current.currentPage).toBe(3);
    
    act(() => {
      result.current.resetPage();
    });
    expect(result.current.currentPage).toBe(1);
  });

  it('should provide correct paginationProps', () => {
    const { result } = renderHook(() => usePagination(testData, { defaultPageSize: '100' }));
    
    const props = result.current.paginationProps;
    expect(props.currentPage).toBe(1);
    expect(props.totalPages).toBe(3);
    expect(props.totalItems).toBe(250);
    expect(props.itemsPerPage).toBe(100);
    expect(props.pageSize).toBe('100');
    expect(typeof props.onPageChange).toBe('function');
    expect(typeof props.onPageSizeChange).toBe('function');
  });

  it('should handle empty data', () => {
    const { result } = renderHook(() => usePagination([]));
    
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedData.length).toBe(0);
  });

  it('should handle data smaller than page size', () => {
    const smallData = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const { result } = renderHook(() => usePagination(smallData));
    
    expect(result.current.totalPages).toBe(1);
    expect(result.current.paginatedData.length).toBe(3);
  });
});

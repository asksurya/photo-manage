import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { SelectionProvider, useSelection } from '../../src/contexts/SelectionContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SelectionProvider>{children}</SelectionProvider>
);

describe('SelectionContext', () => {
  it('should start with empty selection', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.isSelectionMode).toBe(false);
  });

  it('should toggle selection mode', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    act(() => { result.current.enterSelectionMode(); });
    expect(result.current.isSelectionMode).toBe(true);
    act(() => { result.current.exitSelectionMode(); });
    expect(result.current.isSelectionMode).toBe(false);
    expect(result.current.selectedIds).toEqual([]);
  });

  it('should toggle photo selection', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('photo-1');
    });
    expect(result.current.selectedIds).toContain('photo-1');
    act(() => { result.current.toggleSelection('photo-1'); });
    expect(result.current.selectedIds).not.toContain('photo-1');
  });

  it('should select all and clear all', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    const allIds = ['photo-1', 'photo-2', 'photo-3'];
    act(() => {
      result.current.enterSelectionMode();
      result.current.selectAll(allIds);
    });
    expect(result.current.selectedIds).toEqual(allIds);
    act(() => { result.current.clearSelection(); });
    expect(result.current.selectedIds).toEqual([]);
  });

  it('should check if photo is selected', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('photo-1');
    });
    expect(result.current.isSelected('photo-1')).toBe(true);
    expect(result.current.isSelected('photo-2')).toBe(false);
  });

  it('should maintain selection when entering and exiting selection mode without calling exitSelectionMode', () => {
    const { result } = renderHook(() => useSelection(), { wrapper });
    act(() => {
      result.current.enterSelectionMode();
      result.current.toggleSelection('photo-1');
      result.current.toggleSelection('photo-2');
    });
    expect(result.current.selectedIds).toContain('photo-1');
    expect(result.current.selectedIds).toContain('photo-2');

    act(() => { result.current.clearSelection(); });
    expect(result.current.selectedIds).toEqual([]);
    expect(result.current.isSelectionMode).toBe(true);
  });
});

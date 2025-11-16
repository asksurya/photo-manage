import React from 'react';
import { render } from '@testing-library/react-native';
import EmptyState from '../../src/components/EmptyState';

describe('EmptyState', () => {
  it('renders correctly', () => {
    const { getByText } = render(<EmptyState />);
    expect(getByText('No Photos Yet')).toBeDefined();
  });
});

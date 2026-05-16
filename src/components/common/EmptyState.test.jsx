import { render } from '@testing-library/react';
import EmptyState from './EmptyState';

test('renders empty state component', () => {
  render(<EmptyState title="No posts found" />);

  expect(document.querySelector('.empty-state')).toBeInTheDocument();
  expect(document.querySelector('.empty-state__title')).toBeInTheDocument();
});
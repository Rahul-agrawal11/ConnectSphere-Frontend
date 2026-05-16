import { render, screen } from '@testing-library/react';
import ErrorMessage from './ErrorMessage';

test('renders error message', () => {
  render(<ErrorMessage message="Something went wrong" />);

  expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
});
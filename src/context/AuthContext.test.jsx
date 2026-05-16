import { render } from '@testing-library/react';
import { AuthProvider } from './AuthContext';

test('renders auth provider', () => {
  render(
    <AuthProvider>
      <div>Test Child</div>
    </AuthProvider>
  );

  expect(document.body).toBeInTheDocument();
});
import { render, screen, waitFor, act } from '@testing-library/react';
import { useContext } from 'react';
import { AuthContext, AuthProvider } from './AuthContext';
import { getMyProfile } from '../api/authApi';

jest.mock('../api/authApi', () => ({
  getMyProfile: jest.fn()
}));

function TestConsumer() {
  const { user, loading, isAuthenticated, loginUser, logoutUser, refreshUser } =
    useContext(AuthContext);

  return (
    <div>
      <p data-testid="loading">{loading ? 'loading' : 'not-loading'}</p>
      <p data-testid="auth">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</p>
      <p data-testid="username">{user?.username || 'no-user'}</p>

      <button
        onClick={() =>
          loginUser({
            accessToken: 'access123',
            refreshToken: 'refresh123',
            userId: 1,
            username: 'rahul',
            email: 'rahul@gmail.com',
            role: 'USER'
          })
        }
      >
        Login
      </button>

      <button onClick={logoutUser}>Logout</button>
      <button onClick={refreshUser}>Refresh</button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

test('sets loading false when no token exists', async () => {
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
  });

  expect(screen.getByTestId('auth')).toHaveTextContent('not-authenticated');
});

test('loginUser stores tokens and sets user', async () => {
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

  await act(async () => {
    screen.getByText('Login').click();
  });

  expect(localStorage.getItem('accessToken')).toBe('access123');
  expect(localStorage.getItem('refreshToken')).toBe('refresh123');
  expect(screen.getByTestId('username')).toHaveTextContent('rahul');
  expect(screen.getByTestId('auth')).toHaveTextContent('authenticated');
});

test('logoutUser removes tokens and clears user', async () => {
  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

  await act(async () => {
    screen.getByText('Login').click();
  });

  await act(async () => {
    screen.getByText('Logout').click();
  });

  expect(localStorage.getItem('accessToken')).toBeNull();
  expect(localStorage.getItem('refreshToken')).toBeNull();
  expect(screen.getByTestId('username')).toHaveTextContent('no-user');
});

test('fetches profile when token exists', async () => {
  localStorage.setItem('accessToken', 'access123');

  getMyProfile.mockResolvedValue({
    data: {
      data: {
        id: 1,
        username: 'rahul',
        email: 'rahul@gmail.com',
        role: 'USER'
      }
    }
  });

  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByTestId('username')).toHaveTextContent('rahul');
  });

  expect(getMyProfile).toHaveBeenCalled();
});

test('clears token when profile API fails', async () => {
  localStorage.setItem('accessToken', 'access123');
  localStorage.setItem('refreshToken', 'refresh123');

  getMyProfile.mockRejectedValue(new Error('Unauthorized'));

  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

  await waitFor(() => {
    expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
  });

  expect(localStorage.getItem('accessToken')).toBeNull();
  expect(localStorage.getItem('refreshToken')).toBeNull();
  expect(screen.getByTestId('username')).toHaveTextContent('no-user');
});

test('refreshUser calls profile API again', async () => {
  getMyProfile.mockResolvedValue({
    data: {
      data: {
        id: 2,
        username: 'updatedRahul',
        email: 'rahul@gmail.com',
        role: 'USER'
      }
    }
  });

  render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );

  await act(async () => {
    screen.getByText('Refresh').click();
  });

  await waitFor(() => {
    expect(screen.getByTestId('username')).toHaveTextContent('updatedRahul');
  });
});
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { AuthProvider } from '../context/AuthContext';
import { NotificationProvider } from '../context/NotificationContext';

describe('LoginPage Component Tests', () => {
  it('renders login form with inputs and one-click demo credentials', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <NotificationProvider>
            <LoginPage />
          </NotificationProvider>
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('University Portal Sign In')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('user@campus.edu')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();

    // Verify demo buttons exist
    expect(screen.getByText('Dr. Vance')).toBeInTheDocument();
    expect(screen.getByText('Prof. Turing')).toBeInTheDocument();
    expect(screen.getByText('Sarah C.')).toBeInTheDocument();
  });
});

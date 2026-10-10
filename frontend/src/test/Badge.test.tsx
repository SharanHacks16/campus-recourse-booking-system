import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { Badge } from '../components/common/Badge';

describe('Badge Component Tests', () => {
  it('renders PENDING status badge correctly', () => {
    render(<Badge status="PENDING" />);
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
  });

  it('renders APPROVED status badge correctly', () => {
    render(<Badge status="APPROVED" />);
    expect(screen.getByText('Approved')).toBeInTheDocument();
  });

  it('renders REJECTED status badge correctly', () => {
    render(<Badge status="REJECTED" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('renders ResourceType pills correctly', () => {
    render(<Badge type="CLASSROOM" />);
    expect(screen.getByText('Classroom')).toBeInTheDocument();

    render(<Badge type="LABORATORY" />);
    expect(screen.getByText('Laboratory')).toBeInTheDocument();

    render(<Badge type="AUDITORIUM" />);
    expect(screen.getByText('Auditorium')).toBeInTheDocument();
  });

  it('renders Role badges correctly', () => {
    render(<Badge role="ADMIN" />);
    expect(screen.getByText('ADMIN')).toBeInTheDocument();

    render(<Badge role="FACULTY" />);
    expect(screen.getByText('FACULTY')).toBeInTheDocument();
  });
});

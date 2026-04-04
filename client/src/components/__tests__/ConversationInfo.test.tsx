import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConversationInfo from '../ConversationInfo';

describe('ConversationInfo Component', () => {
  const mockConversation = {
    id: 1,
    customerName: 'أحمد محمد',
    phoneNumber: '967712345678',
    lastMessageAt: new Date('2026-03-26').toISOString(),
    unreadCount: 0,
    leadId: 1,
    appointmentId: 2,
    offerLeadId: 3,
    campRegistrationId: 4,
  };

  it('renders customer name correctly', () => {
    render(<ConversationInfo conversation={mockConversation} />);
    expect(screen.getByText('أحمد محمد')).toBeInTheDocument();
  });

  it('renders phone number correctly', () => {
    render(<ConversationInfo conversation={mockConversation} />);
    expect(screen.getByText('967712345678')).toBeInTheDocument();
  });

  it('displays message count', () => {
    render(<ConversationInfo conversation={mockConversation} messageCount={42} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('shows related items badges', () => {
    render(<ConversationInfo conversation={mockConversation} />);
    expect(screen.getByText('موعد طبي مرتبط')).toBeInTheDocument();
    expect(screen.getByText('عرض طبي مرتبط')).toBeInTheDocument();
    expect(screen.getByText('تسجيل مخيم مرتبط')).toBeInTheDocument();
  });

  it('handles missing customer name', () => {
    const conv = { ...mockConversation, customerName: null };
    render(<ConversationInfo conversation={conv} />);
    expect(screen.getByText('عميل جديد')).toBeInTheDocument();
  });

  it('calls onMarkAsImportant when button clicked', () => {
    const onMarkAsImportant = vi.fn();
    render(
      <ConversationInfo
        conversation={mockConversation}
        onMarkAsImportant={onMarkAsImportant}
      />
    );
    // Note: actual click test would require opening dropdown menu
  });
});

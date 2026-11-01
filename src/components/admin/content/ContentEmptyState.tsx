'use client';

interface EmptyStateProps {
  message: string;
}

export default function ContentEmptyState({ message }: EmptyStateProps) {
  return <div className="text-center py-8 text-soft">{message}</div>;
}

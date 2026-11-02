// src/__tests__/components/Quiz.test.tsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/jest-globals';
import Quiz from '@/components/Quiz';
import { describe, it, expect } from '../../setupTests';

describe('Quiz Component', () => {
  const mockQuestions = [
    {
      id: 1,
      question: 'What is the capital of France?',
      options: ['Berlin', 'Madrid', 'Paris', 'Rome'],
      answer: 'Paris',
    },
    {
      id: 2,
      question: 'What is 2 + 2?',
      options: ['3', '4', '5', '6'],
      answer: '4',
    },
  ];

  it('renders quiz questions and options', () => {
    render(<Quiz questions={mockQuestions} />);

    // Check if questions are rendered
    expect(
      screen.getByText('What is the capital of France?')
    ).toBeInTheDocument();
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();

    // Check if options are rendered
    mockQuestions[0].options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });

    mockQuestions[1].options.forEach((option) => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('handles empty questions array', () => {
    render(<Quiz questions={[]} />);
    // The component should render but have no question elements
    const questionElements = screen.queryByRole('heading');
    expect(questionElements).not.toBeInTheDocument();
  });
});

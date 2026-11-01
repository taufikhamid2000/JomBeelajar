'use client';

import React, { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

type QuestionType = 'radio' | 'checkbox';

interface QuestionAnswer {
  text: string;
  isCorrect: boolean;
}

interface QuestionFormData {
  text: string;
  type: QuestionType;
  answers: QuestionAnswer[];
  tempId: string; // Used for UI management only
}

const API_MSG =
  'Unable to connect to the API. Please contact the administrator.';

// A blank 4-answer question (first answer marked correct) for the editor.
function createEmptyQuestion(): QuestionFormData {
  return {
    text: '',
    type: 'radio',
    answers: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
    tempId: `new-${Date.now()}`,
  };
}

export default function QuestionsManagementPage() {
  const router = useRouter();
  const params = useParams();
  const { subject, topic, quizId } = params as {
    subject: string;
    topic: string;
    quizId: string;
  };

  const [quizName, setQuizName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuestionFormData[]>([]);
  const [existingQuestionIds, setExistingQuestionIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Check if user is authenticated
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        alert('You need to be logged in to create quiz questions.');
        router.push('/auth');
        return;
      }

      setUserId(session.user.id);
    };

    checkAuth();
  }, [router]);

  // Fetch quiz + existing questions (author view, includes isCorrect)
  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/quiz/${quizId}/author`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || API_MSG);

        setQuizName(data.name);

        if (Array.isArray(data.questions) && data.questions.length > 0) {
          const formattedQuestions: QuestionFormData[] = data.questions.map(
            (q: {
              id: string;
              text: string;
              type: QuestionType;
              options: Array<{ text: string; isCorrect: boolean }>;
            }) => ({
              text: q.text,
              type: q.type,
              answers: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
              })),
              tempId: q.id,
            })
          );
          setQuestions(formattedQuestions);
          setExistingQuestionIds(
            data.questions.map((q: { id: string }) => q.id)
          );
        } else {
          setQuestions((prev) => [...prev, createEmptyQuestion()]);
        }
      } catch (err) {
        logger.error('Error:', err);
        setError(API_MSG);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const addNewQuestion = () => {
    setQuestions((prevQuestions) => [...prevQuestions, createEmptyQuestion()]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prevQuestions) =>
      prevQuestions.filter((_, i) => i !== index)
    );
  };

  const updateQuestion = (
    index: number,
    field: keyof QuestionFormData,
    value: string | QuestionType | { text: string; isCorrect: boolean }[]
  ) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateAnswer = (
    questionIndex: number,
    answerIndex: number,
    field: keyof QuestionAnswer,
    value: string | boolean
  ) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, qIndex) => {
        if (qIndex !== questionIndex) return q;

        const newAnswers = [...q.answers];
        newAnswers[answerIndex] = {
          ...newAnswers[answerIndex],
          [field]: value,
        };

        // For radio buttons, ensure only one answer is correct
        if (
          field === 'isCorrect' &&
          typeof value === 'boolean' &&
          value === true &&
          q.type === 'radio'
        ) {
          newAnswers.forEach((_, aIndex) => {
            if (aIndex !== answerIndex) {
              newAnswers[aIndex] = { ...newAnswers[aIndex], isCorrect: false };
            }
          });
        }

        return { ...q, answers: newAnswers };
      })
    );
  };

  const addAnswer = (questionIndex: number) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => {
        if (i !== questionIndex) return q;
        return {
          ...q,
          answers: [...q.answers, { text: '', isCorrect: false }],
        };
      })
    );
  };

  const removeAnswer = (questionIndex: number, answerIndex: number) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((q, i) => {
        if (i !== questionIndex) return q;

        // Don't remove if it's the last answer or if there are fewer than 2 answers
        if (q.answers.length <= 2) return q;

        const newAnswers = q.answers.filter((_, j) => j !== answerIndex);

        // Make sure at least one answer is marked as correct
        const hasCorrectAnswer = newAnswers.some((a) => a.isCorrect);
        if (!hasCorrectAnswer && newAnswers.length > 0) {
          newAnswers[0].isCorrect = true;
        }

        return { ...q, answers: newAnswers };
      })
    );
  };

  const saveQuestions = async () => {
    try {
      if (!userId) {
        setError(
          'You must be signed in to save questions. Please sign in and try again.'
        );
        return;
      }

      setSaving(true);

      // Validate questions before saving
      for (const [index, question] of questions.entries()) {
        if (!question.text.trim()) {
          setError(`Question ${index + 1} text is required`);
          setSaving(false);
          return;
        }

        if (question.answers.length < 2) {
          setError(`Question ${index + 1} must have at least 2 answers`);
          setSaving(false);
          return;
        }

        for (const [aIndex, answer] of question.answers.entries()) {
          if (!answer.text.trim()) {
            setError(
              `Answer ${aIndex + 1} in question ${index + 1} text is required`
            );
            setSaving(false);
            return;
          }
        }

        if (!question.answers.some((a) => a.isCorrect)) {
          setError(
            `Question ${index + 1} must have at least one correct answer`
          );
          setSaving(false);
          return;
        }
      }

      // Replace-all strategy via JomBeelajar API CRUD: delete every existing question
      // (cascades to its answers), then recreate all questions from the form.
      for (const questionId of existingQuestionIds) {
        const res = await fetch(`/api/questions/${questionId}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || API_MSG);
        }
      }

      for (let i = 0; i < questions.length; i++) {
        const question = questions[i];
        const res = await fetch(`/api/quiz/${quizId}/questions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: question.text,
            type: question.type,
            orderIndex: i,
            answers: question.answers.map((a, aIndex) => ({
              text: a.text,
              isCorrect: a.isCorrect,
              orderIndex: aIndex,
            })),
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || API_MSG);
        }
      }

      alert('Questions saved successfully!');
      router.push(`/quiz/${subject}/${topic}`);
    } catch (err) {
      logger.error('Error saving questions:', err);
      setError(err instanceof Error ? err.message : API_MSG);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-surface rounded-lg shadow-md p-6 flex justify-center items-center h-64">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-brand border-r-transparent border-b-brand border-l-transparent mb-4"></div>
              <p className="text-soft">Loading quiz...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-brand hover:underline flex items-center"
          >
            ← Back
          </button>
        </div>

        <div className="bg-surface rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {quizName}: Add Questions
            </h1>
            <p className="text-soft">Add questions and answers to your quiz</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          <div className="space-y-8">
            {questions.map((question, qIndex) => (
              <div
                key={question.tempId}
                className="border border-border rounded-lg p-4"
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Question {qIndex + 1}</h3>
                  <button
                    onClick={() => removeQuestion(qIndex)}
                    className="text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-soft mb-1">
                    Question Text
                  </label>
                  <textarea
                    value={question.text}
                    onChange={(e) =>
                      updateQuestion(qIndex, 'text', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 !text-black"
                    rows={2}
                    placeholder="Enter your question here"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-soft mb-1">
                    Question Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={question.type === 'radio'}
                        onChange={() => updateQuestion(qIndex, 'type', 'radio')}
                        className="h-4 w-4 text-brand focus:ring-brand/40"
                      />
                      <span className="ml-2 text-sm text-soft">
                        Single choice
                      </span>
                    </label>
                    <label className="inline-flex items-center">
                      <input
                        type="radio"
                        checked={question.type === 'checkbox'}
                        onChange={() =>
                          updateQuestion(qIndex, 'type', 'checkbox')
                        }
                        className="h-4 w-4 text-brand focus:ring-brand/40"
                      />
                      <span className="ml-2 text-sm text-soft">
                        Multiple choice
                      </span>
                    </label>
                  </div>
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-medium text-soft mb-2">
                    Answers
                  </label>

                  <div className="space-y-3">
                    {question.answers.map((answer, aIndex) => (
                      <div
                        key={`${question.tempId}-answer-${aIndex}`}
                        className="flex items-center space-x-2"
                      >
                        <div className="flex-shrink-0">
                          {question.type === 'radio' ? (
                            <input
                              type="radio"
                              checked={answer.isCorrect}
                              onChange={() =>
                                updateAnswer(qIndex, aIndex, 'isCorrect', true)
                              }
                              className="h-4 w-4 text-brand focus:ring-brand/40"
                              name={`question-${question.tempId}`}
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={answer.isCorrect}
                              onChange={(e) =>
                                updateAnswer(
                                  qIndex,
                                  aIndex,
                                  'isCorrect',
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 text-brand focus:ring-brand/40 rounded"
                            />
                          )}
                        </div>

                        <div className="flex-1">
                          <input
                            type="text"
                            value={answer.text}
                            onChange={(e) =>
                              updateAnswer(
                                qIndex,
                                aIndex,
                                'text',
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-brand/40 !text-black"
                            placeholder={`Answer ${aIndex + 1}`}
                          />
                        </div>

                        <button
                          onClick={() => removeAnswer(qIndex, aIndex)}
                          className="text-soft hover:text-red-500"
                          disabled={question.answers.length <= 2}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addAnswer(qIndex)}
                    className="mt-3 inline-flex items-center px-3 py-1 border border-border text-sm rounded-md text-soft bg-surface hover:bg-surface-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Add Answer
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addNewQuestion}
              className="w-full p-3 border border-dashed border-border rounded-lg text-soft hover:bg-surface-2 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              Add New Question
            </button>

            <div className="pt-4 border-t border-border">
              <div className="flex justify-end">
                <button
                  onClick={() => router.back()}
                  className="mr-3 px-4 py-2 border border-border text-soft rounded-md hover:bg-surface-2"
                >
                  Cancel
                </button>
                <button
                  onClick={saveQuestions}
                  disabled={saving || questions.length === 0}
                  className="px-4 py-2 bg-[var(--band-via)] text-white rounded-md hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Questions'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

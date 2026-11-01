import { QuizAttempt } from '../types';
import DatabaseErrorBoundary from '../../DatabaseErrorBoundary';

interface QuizHistoryTabProps {
  quizHistory: QuizAttempt[];
}

export default function QuizHistoryTab({ quizHistory }: QuizHistoryTabProps) {
  return (
    <DatabaseErrorBoundary
      fallback={
        <div className="p-4">
          <h2 className="text-lg font-medium text-strong mb-2">Quiz History</h2>
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-700 dark:text-yellow-300">
              Unable to load quiz history. The database may need to be updated.
            </p>
          </div>
        </div>
      }
    >
      <div>
        <h2 className="text-lg font-medium text-strong mb-4">Quiz History</h2>
        {!quizHistory || quizHistory.length === 0 ? (
          <p className="text-soft py-4">
            This user has not attempted any quizzes yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-soft uppercase tracking-wider">
                    Time Taken
                  </th>
                </tr>
              </thead>
              <tbody className="bg-surface divide-y divide-border">
                {quizHistory.map((quiz) => (
                  <tr key={quiz.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-strong">
                        {quiz.quiz_title ||
                          `Quiz ${quiz.quiz_id.substring(0, 8)}...`}
                      </div>
                      <div className="text-sm text-soft">
                        {quiz.subject && quiz.topic
                          ? `${quiz.subject} - ${quiz.topic}`
                          : ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-strong">
                        {quiz.score}/{quiz.max_score || 100} (
                        {Math.round(
                          (quiz.score / (quiz.max_score || 100)) * 100
                        )}
                        %)
                      </div>
                      <div className="text-xs text-soft">
                        {quiz.correct_answers}/{quiz.total_questions} correct
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-soft">
                      {quiz.time_spent ? `${quiz.time_spent} seconds` : 'N/A'}
                      {!quiz.completed && (
                        <span className="ml-2 text-yellow-500">Incomplete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DatabaseErrorBoundary>
  );
}

import { useContentPlaceholderData } from '@/hooks/useContentPlaceholderData';

export default function ContentPlaceholder() {
  const { quizPrompt, hasData } = useContentPlaceholderData();

  return (
    <div className="bg-[var(--color-card-bg)] rounded-[var(--border-radius)] p-6 md:p-8 shadow mt-6 border border-border">
      <p className="text-[var(--color-subtext)] text-center mb-4">
        Quiz content for this topic is coming soon!
      </p>
      <div className="flex justify-center mt-4">
        <button
          className="inline-flex items-center px-4 py-2 bg-surface hover:bg-surface text-green-600 dark:text-green-400 border border-green-300 dark:border-green-800 rounded transition-colors"
          onClick={() => {
            if (quizPrompt) {
              const chatGPTUrl = `https://chat.openai.com/?prompt=${encodeURIComponent(quizPrompt)}`;
              window.open(chatGPTUrl, '_blank');
            }
          }}
          disabled={!hasData}
        >
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
          </svg>
          Practice Quiz with AI
        </button>
      </div>
    </div>
  );
}

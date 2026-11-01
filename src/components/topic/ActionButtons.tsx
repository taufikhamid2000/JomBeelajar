import { useRouter } from 'next/navigation';
import { Chapter } from '@/types/topics';

export interface ActionButtonsProps {
  chapterData: Chapter | null;
  subject: string;
  topic: string;
}

export default function ActionButtons({
  chapterData,
  subject,
  topic,
}: ActionButtonsProps) {
  // subjectData and topicData removed as they're no longer used
  const router = useRouter();
  return (
    <div className="my-6">
      {/* Primary action - prominent and centered */}
      <div className="flex justify-center mb-4">
        <button
          className="px-5 py-3 bg-[var(--band-via)] hover:bg-[var(--band-from)] dark:bg-[var(--band-via)] dark:hover:bg-[var(--band-from)] text-white rounded-md transition-colors shadow-md font-medium text-lg flex items-center"
          onClick={() =>
            router.push(
              `/quiz/${subject}/${topic}/create?chapter=${encodeURIComponent(chapterData?.name || 'Unknown Chapter')}`
            )
          }
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create a Quiz
        </button>
      </div>{' '}
      {/* Secondary actions removed - moved to ContentPlaceholder */}
    </div>
  );
}

import { Subject, Chapter, Topic } from '@/types/topics';
import TopicMetadata from './TopicMetadata';

export interface TopicHeaderProps {
  subject: Subject;
  chapter: Chapter;
  topic: Topic;
}

export default function TopicHeader({
  subject,
  chapter,
  topic,
}: TopicHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{subject.name}</h1>
      <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-accent)]">
        Form {chapter.form} · {chapter.name}
      </h2>
      <h3 className="text-lg md:text-xl font-medium mt-3 md:mt-4">
        {topic.name}
      </h3>

      {topic.description && (
        <p className="text-[var(--color-subtext)] mt-2 text-sm md:text-base">
          {topic.description}
        </p>
      )}

      <div className="flex items-center mt-2">
        <button
          type="button"
          className="inline-flex items-center px-3 py-1.5 ml-0 my-1 bg-surface hover:bg-surface text-brand border border-brand/40 rounded transition-colors text-sm"
          onClick={() => {
            const descriptionPrompt = `Generate a description for the subject '${subject.name}', tingkatan '${chapter.form}', chapter '${chapter.name}', and topic '${topic.name}' based on the KSSM syllabus.`;
            const chatGPTUrl = `https://chat.openai.com/?prompt=${encodeURIComponent(descriptionPrompt)}`;
            window.open(chatGPTUrl, '_blank');
          }}
        >
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729z" />
          </svg>
          Generate Description
        </button>
      </div>

      <TopicMetadata topic={topic} />
    </div>
  );
}

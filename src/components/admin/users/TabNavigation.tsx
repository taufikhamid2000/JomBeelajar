export type TabType = 'overview' | 'achievements' | 'quizzes' | 'activity';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function TabNavigation({
  activeTab,
  onTabChange,
}: TabNavigationProps) {
  return (
    <div className="border-b border-border">
      <nav className="-mb-px flex">
        <button
          onClick={() => onTabChange('overview')}
          className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
            activeTab === 'overview'
              ? 'border-brand/40 text-brand'
              : 'border-transparent text-soft hover:text-soft hover:border-border'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => onTabChange('achievements')}
          className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
            activeTab === 'achievements'
              ? 'border-brand/40 text-brand'
              : 'border-transparent text-soft hover:text-soft hover:border-border'
          }`}
        >
          Achievements
        </button>
        <button
          onClick={() => onTabChange('quizzes')}
          className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
            activeTab === 'quizzes'
              ? 'border-brand/40 text-brand'
              : 'border-transparent text-soft hover:text-soft hover:border-border'
          }`}
        >
          Quiz History
        </button>
        <button
          onClick={() => onTabChange('activity')}
          className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
            activeTab === 'activity'
              ? 'border-brand/40 text-brand'
              : 'border-transparent text-soft hover:text-soft hover:border-border'
          }`}
        >
          Activity Log
        </button>
      </nav>
    </div>
  );
}

'use client';
import { logger } from '@/lib/logger';

import { useCallback } from 'react';
import { Topic, Chapter, createTopic, deleteTopic } from '@/services';
import ContentManagement from './ContentManagementSimple';
import { Column, CardField } from '@/components/admin/ui';

interface TopicManagementProps {
  topics: Topic[];
  chapters: Chapter[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  refreshTopics: () => Promise<void>;
}

export default function TopicManagement({
  topics,
  chapters,
  loading,
  setLoading,
  setError,
  setSuccessMessage,
  refreshTopics,
}: TopicManagementProps) {
  // Debug: Log chapters data
  logger.log('TopicManagement - chapters data:', {
    chaptersCount: chapters.length,
    chapters: chapters.map((c) => ({ id: c.id, title: c.name })), // Using name but keeping title in the debug output
  });
  // Function to get chapter title by ID
  const getChapterTitle = useCallback(
    (chapterId: string) => {
      const chapter = chapters.find((c) => c.id === chapterId);
      return chapter ? chapter.name : 'Unknown Chapter';
    },
    [chapters]
  ); // Define columns for data table
  const columns: Column<Topic>[] = [
    {
      key: 'name',
      header: 'Title',
      render: (topic: Topic) => (
        <div className="text-sm font-medium text-strong">{topic.name}</div>
      ),
    },
    {
      key: 'chapter',
      header: 'Chapter',
      render: (topic: Topic) => (
        <div className="text-sm text-soft">
          {getChapterTitle(topic.chapter_id)}
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      render: (topic: Topic) => (
        <div className="text-sm text-soft">
          {new Date(topic.created_at).toLocaleDateString()}
        </div>
      ),
    },
  ];
  // Define card fields for mobile view
  const cardFields: CardField<Topic>[] = [
    {
      key: 'name',
      label: 'Title',
      isHeader: true,
      render: (topic: Topic) => (
        <div className="text-base font-medium text-strong">{topic.name}</div>
      ),
    },
    {
      key: 'chapter',
      label: 'Chapter',
      render: (topic: Topic) => (
        <div className="text-sm text-strong">
          {getChapterTitle(topic.chapter_id)}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (topic: Topic) => (
        <div className="text-sm text-strong">
          {new Date(topic.created_at).toLocaleDateString()}
        </div>
      ),
    },
  ]; // Initial form state
  const initialFormState = {
    name: '',
    chapter_id: '',
  };

  // Form renderer with chapter dependencies
  const renderTopicForm = (
    formState: Record<string, unknown>,
    setFormState: (state: Record<string, unknown>) => void,
    loading: boolean
  ) => (
    <>
      <div className="mb-3">
        <label
          htmlFor="topic-title"
          className="block text-sm font-medium text-soft mb-1"
        >
          Topic Title
        </label>
        <input
          id="topic-title"
          type="text"
          value={String(formState.name || '')}
          onChange={(e) =>
            setFormState({
              ...formState,
              name: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter topic title"
          disabled={loading}
          required
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor="topic-chapter"
          className="block text-sm font-medium text-soft mb-1"
        >
          Chapter
        </label>
        <select
          id="topic-chapter"
          value={String(formState.chapter_id || '')}
          onChange={(e) =>
            setFormState({
              ...formState,
              chapter_id: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-md"
          disabled={loading}
          required
        >
          <option value="">Select a Chapter</option>{' '}
          {chapters.map((chapter) => (
            <option key={chapter.id} value={chapter.id}>
              {chapter.name}
            </option>
          ))}{' '}
        </select>
      </div>
    </>
  );

  // Adapter function to match the expected interface for createItem
  const createItemAdapter = async (
    item: Record<string, unknown>
  ): Promise<{ id: string | null; error: Error | null }> => {
    // Validate chapter selection
    if (!item.chapter_id) {
      return { id: null, error: new Error('Please select a chapter') };
    }
    // Convert the generic item to the shape expected by createTopic
    return createTopic({
      name: String(item.name || ''),
      chapter_id: String(item.chapter_id),
    });
  };
  return (
    <ContentManagement<Topic>
      // Core data
      items={topics}
      entityName="Topic"
      entityNamePlural="Topics"
      // UI Configuration
      columns={columns}
      cardFields={cardFields}
      // State management
      loading={loading}
      setLoading={setLoading}
      setError={setError}
      setSuccessMessage={setSuccessMessage}
      // Actions
      refreshItems={refreshTopics}
      createItem={createItemAdapter}
      deleteItem={deleteTopic}
      // Navigation
      baseRoute="/admin/content/topics" // Form handling
      initialFormState={initialFormState}
      renderForm={renderTopicForm}
      // Search functionality
      searchField="name"
    />
  );
}

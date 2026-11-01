'use client';

import { Subject, createSubject, deleteSubject } from '@/services';
import ContentManagement from './ContentManagementSimple';
import { Column, CardField } from '@/components/admin/ui';

interface SubjectManagementProps {
  subjects: Subject[];
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  refreshSubjects: () => Promise<void>;
}

export default function SubjectManagementSimple({
  subjects,
  loading,
  setLoading,
  setError,
  setSuccessMessage,
  refreshSubjects,
}: SubjectManagementProps) {
  // Define columns for data table
  const columns: Column<Subject>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (subject: Subject) => (
        <div className="text-sm font-medium text-strong">{subject.name}</div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (subject: Subject) => (
        <div className="text-sm text-soft truncate max-w-xs">
          {subject.description}
        </div>
      ),
    },
    {
      key: 'topic_count',
      header: 'Topics',
      render: (subject: Subject) => (
        <div className="text-sm text-soft">{subject.topic_count}</div>
      ),
    },
    {
      key: 'quiz_count',
      header: 'Quizzes',
      render: (subject: Subject) => (
        <div className="text-sm text-soft">{subject.quiz_count}</div>
      ),
    },
  ];

  // Define card fields for mobile view
  const cardFields: CardField<Subject>[] = [
    {
      key: 'name',
      label: 'Name',
      isHeader: true,
      render: (subject: Subject) => (
        <div className="text-base font-medium text-strong">{subject.name}</div>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      render: (subject: Subject) => (
        <div className="text-sm text-soft">{subject.description}</div>
      ),
    },
    {
      key: 'topic_count',
      label: 'Topics',
      render: (subject: Subject) => (
        <div className="text-sm text-strong">{subject.topic_count}</div>
      ),
    },
    {
      key: 'quiz_count',
      label: 'Quizzes',
      render: (subject: Subject) => (
        <div className="text-sm text-strong">{subject.quiz_count}</div>
      ),
    },
  ];
  // Initial form state
  const initialFormState = { name: '', description: '' }; // Form renderer
  const renderSubjectForm = (
    formState: Record<string, unknown>,
    setFormState: (state: Record<string, unknown>) => void,
    loading: boolean // Renamed from _loading to loading to avoid lint error
  ) => (
    <>
      <div className="mb-3">
        <label
          htmlFor="subject-name"
          className="block text-sm font-medium text-soft mb-1"
        >
          Subject Name
        </label>
        <input
          id="subject-name"
          type="text"
          value={String(formState.name || '')}
          onChange={(e) =>
            setFormState({
              ...formState,
              name: e.target.value,
            })
          }
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter subject name"
          disabled={loading}
        />
      </div>
      <div className="mb-3">
        <label
          htmlFor="subject-desc"
          className="block text-sm font-medium text-soft mb-1"
        >
          Description
        </label>
        <textarea
          id="subject-desc"
          value={String(formState.description || '')}
          onChange={(e) =>
            setFormState({
              ...formState,
              description: e.target.value,
            })
          }
          rows={3}
          className="w-full px-3 py-2 border rounded-md"
          placeholder="Enter subject description"
          disabled={loading}
        />
      </div>
    </>
  );
  // Adapter function to match the expected interface for createItem
  const createItemAdapter = async (
    item: Record<string, unknown>
  ): Promise<{ id: string | null; error: Error | null }> => {
    // Convert the generic item to the shape expected by createSubject
    return createSubject({
      name: String(item.name || ''),
      description: String(item.description || ''),
      slug: item.slug ? String(item.slug) : undefined,
      icon: item.icon ? String(item.icon) : undefined,
    });
  };

  return (
    <ContentManagement<Subject>
      // Core data
      items={subjects}
      entityName="Subject"
      entityNamePlural="Subjects"
      // UI Configuration
      columns={columns}
      cardFields={cardFields}
      // State management
      loading={loading}
      setLoading={setLoading}
      setError={setError}
      setSuccessMessage={setSuccessMessage}
      // Actions
      refreshItems={refreshSubjects}
      createItem={createItemAdapter}
      deleteItem={deleteSubject}
      // Form handling
      initialFormState={initialFormState}
      renderForm={renderSubjectForm}
      // Search functionality
      searchField="name"
      // Base route for edit pages
      baseRoute="/admin/content/subjects"
    />
  );
}

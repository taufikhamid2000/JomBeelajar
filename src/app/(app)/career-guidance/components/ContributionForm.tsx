'use client';
import { logger } from '@/lib/logger';

import { FC, useState, useEffect } from 'react';
import { CareerContribution } from '../types';
import { submitCareerContribution } from '../services/contributionService';
import { fetchPublicSubjects, PublicSubject } from '@/services/subjectService';
import { supabase } from '@/lib/supabase';

// Reusable Subject Selector Component
interface SubjectSelectorProps {
  subjects: PublicSubject[];
  selectedIds: string[];
  onAddSubject: (subjectId: string) => void;
  onRemoveSubject: (subjectName: string) => void;
  selectedSubjects: string[];
  tagColorClasses: string;
  placeholder?: string;
  required?: boolean;
  isLoading: boolean;
}

const SubjectSelector: FC<SubjectSelectorProps> = ({
  subjects,
  selectedIds,
  onAddSubject,
  onRemoveSubject,
  selectedSubjects,
  tagColorClasses,
  placeholder = 'Search for a subject...',
  required = false,
  isLoading,
}) => {
  const [searchText, setSearchText] = useState('');

  // Filter subjects based on search text and already selected subjects
  const filteredSubjects = searchText.trim()
    ? subjects.filter(
        (subject) =>
          !selectedIds.includes(subject.id) &&
          (subject.name.toLowerCase().includes(searchText.toLowerCase()) ||
            (subject.category &&
              subject.category
                .toLowerCase()
                .includes(searchText.toLowerCase())))
      )
    : [];

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center py-3 px-2 bg-surface rounded-md">
          <svg
            className="animate-spin h-5 w-5 text-strong"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span className="ml-2 text-strong">Loading subjects...</span>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <div className="flex">
              <input
                type="text"
                placeholder={placeholder}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                required={required && selectedSubjects.length === 0}
              />
              <button
                type="button"
                onClick={() => setSearchText('')}
                className="absolute right-3 top-3 text-soft hover:text-white"
                aria-label="Clear search"
              >
                {searchText && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                )}
              </button>
            </div>

            {searchText.length > 0 && (
              <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-muted py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((subject) => (
                    <li
                      key={subject.id}
                      className="relative cursor-pointer select-none py-2 px-3 text-strong hover:bg-muted"
                      onClick={() => {
                        onAddSubject(subject.id);
                        setSearchText('');
                      }}
                    >
                      <div className="flex items-center">
                        <span className="block truncate">
                          {subject.name}{' '}
                          {subject.category && (
                            <span className="text-xs text-soft">
                              ({subject.category})
                            </span>
                          )}
                        </span>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="relative cursor-default select-none py-2 px-3 text-soft">
                    No matching subjects found
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Show selected subjects as tags */}
          {selectedSubjects.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {selectedSubjects.map((subject, idx) => (
                <span
                  key={idx}
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tagColorClasses}`}
                >
                  {subject}
                  <button
                    type="button"
                    onClick={() => onRemoveSubject(subject)}
                    className="ml-1 hover:text-white focus:outline-none"
                    aria-label={`Remove ${subject}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};

interface ContributionFormProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
}

const ContributionForm: FC<ContributionFormProps> = ({
  onSubmitSuccess,
  onCancel,
}) => {
  // Form state
  const [formData, setFormData] = useState<Partial<CareerContribution>>({
    title: '',
    description: '',
    mustLearnSubjects: [],
    shouldLearnSubjects: [],
    canLearnSubjects: [],
    submitterName: '',
    submitterEmail: '',
    additionalNotes: '',
  });
  // State for subjects loaded from the database
  const [subjects, setSubjects] = useState<PublicSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Selected subjects for each category
  const [selectedMustLearn, setSelectedMustLearn] = useState<string[]>([]);
  const [selectedShouldLearn, setSelectedShouldLearn] = useState<string[]>([]);
  const [selectedCanLearn, setSelectedCanLearn] = useState<string[]>([]);
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Fetch subjects when component mounts
  useEffect(() => {
    async function loadSubjects() {
      try {
        setLoadingSubjects(true);
        const { data, error } = await fetchPublicSubjects();
        if (error || !data) {
          logger.error('Error loading subjects:', error);
          return;
        }
        setSubjects(data);
      } catch (err) {
        logger.error('Error fetching subjects:', err);
      } finally {
        setLoadingSubjects(false);
      }
    }

    loadSubjects();
  }, []);

  // Check if user is logged in
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          logger.error('Error checking auth status:', error);
          setIsLoggedIn(false);
          return;
        }

        if (data.session) {
          setIsLoggedIn(true);

          // Get user details
          const { user } = data.session;
          setUserEmail(user.email || null);

          // Use email name as display name if available, otherwise use metadata
          if (user.email) {
            const namePart = user.email.split('@')[0];
            const formattedName =
              namePart.charAt(0).toUpperCase() + namePart.slice(1);
            setUserName(formattedName);
          }

          // If user data is available in user metadata, use it
          if (user.user_metadata) {
            if (user.user_metadata.name) {
              setUserName(user.user_metadata.name);
            } else if (user.user_metadata.full_name) {
              setUserName(user.user_metadata.full_name);
            }
          }
        } else {
          setIsLoggedIn(false);
          setUserEmail(null);
          setUserName(null);
        }
      } catch (err) {
        logger.error('Error in authentication check:', err);
        setIsLoggedIn(false);
      }
    }

    checkAuthStatus();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        setIsLoggedIn(true);
        setUserEmail(session.user.email || null);

        // Set name based on available data
        if (session.user.user_metadata?.name) {
          setUserName(session.user.user_metadata.name);
        } else if (session.user.user_metadata?.full_name) {
          setUserName(session.user.user_metadata.full_name);
        } else if (session.user.email) {
          const namePart = session.user.email.split('@')[0];
          const formattedName =
            namePart.charAt(0).toUpperCase() + namePart.slice(1);
          setUserName(formattedName);
        }
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setUserEmail(null);
        setUserName(null);
      }
    });

    // Clean up on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Handle adding a subject
  const handleAddSubject = (
    subjectId: string,
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    field: keyof Pick<
      CareerContribution,
      'mustLearnSubjects' | 'shouldLearnSubjects' | 'canLearnSubjects'
    >
  ) => {
    setSelected((prev) => {
      if (prev.includes(subjectId)) return prev;
      return [...prev, subjectId];
    });

    const subject = subjects.find((s) => s.id === subjectId);
    if (subject) {
      setFormData((prev) => {
        const updatedSubjects = [...(prev[field] || []), subject.name];
        return { ...prev, [field]: updatedSubjects };
      });
    }
  };

  // Handle removing a subject
  const handleRemoveSubject = (
    subjectName: string,
    setSelected: React.Dispatch<React.SetStateAction<string[]>>,
    field: keyof Pick<
      CareerContribution,
      'mustLearnSubjects' | 'shouldLearnSubjects' | 'canLearnSubjects'
    >
  ) => {
    // Find the subject ID from the name
    const subjectId = subjects.find((s) => s.name === subjectName)?.id;

    // Remove from selected IDs if found
    if (subjectId) {
      setSelected((prev) => prev.filter((id) => id !== subjectId));
    }

    // Remove from form data
    setFormData((prev) => {
      const updatedSubjects = (prev[field] || []).filter(
        (name) => name !== subjectName
      );
      return { ...prev, [field]: updatedSubjects };
    });
  };

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }; // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const updatedFormData = { ...formData };

      // Handle anonymous contributions
      if (isAnonymous) {
        // For anonymous contributions, store a placeholder name
        updatedFormData.submitterName = 'Anonymous Contributor';

        // If logged in, still store their email for admin purposes
        if (isLoggedIn && userEmail) {
          updatedFormData.submitterEmail = userEmail;
        }
      } else {
        // For non-anonymous contributions from logged-in users, use their account info
        if (isLoggedIn) {
          if (userName) {
            updatedFormData.submitterName = userName;
          }
          if (userEmail) {
            updatedFormData.submitterEmail = userEmail;
          }
        }
      }

      setFormData(updatedFormData);

      // Basic validation
      if (!formData.title || !formData.description) {
        throw new Error('Please fill out all required fields.');
      }

      // Check for submitter info only if not logged in and not anonymous
      if (
        !isLoggedIn &&
        !isAnonymous &&
        (!formData.submitterName || !formData.submitterEmail)
      ) {
        throw new Error(
          'Please provide your name and email or choose to contribute anonymously.'
        );
      }

      if (formData.mustLearnSubjects?.length === 0) {
        throw new Error(
          'Please provide at least one subject that must be learned for this career.'
        );
      }

      // Submit the form data
      const result = await submitCareerContribution(
        formData as CareerContribution
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit contribution');
      }

      // Success handling
      setSuccess(true);
      if (onSubmitSuccess) {
        onSubmitSuccess();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'An unknown error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface shadow-lg rounded-lg p-6 max-w-3xl mx-auto border border-border">
      <h2 className="text-2xl font-bold text-strong mb-6">
        Contribute Subject Guidance
      </h2>{' '}
      {success ? (
        <div className="bg-green-950 border border-green-900 text-green-300 p-4 rounded-md mb-6">
          <p className="font-medium">Thank you for your contribution!</p>
          <p className="mt-1">
            {' '}
            Our team will review your submission and add it to our subject
            guidance if approved. You&apos;ll receive an email notification when
            the review is complete.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({
                title: '',
                description: '',
                mustLearnSubjects: [],
                shouldLearnSubjects: [],
                canLearnSubjects: [],
                submitterName: '',
                submitterEmail: '',
                additionalNotes: '',
              });
              // Reset selected subjects state
              setSelectedMustLearn([]);
              setSelectedShouldLearn([]);
              setSelectedCanLearn([]);
            }}
            className="mt-3 text-sm font-medium text-green-400 hover:text-green-200"
          >
            Submit another contribution
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {' '}
          {error && (
            <div className="bg-red-950 border border-red-900 text-red-300 p-4 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            {' '}
            <h3 className="text-lg font-medium text-strong">Career Details</h3>
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-soft"
              >
                Career Title*
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                placeholder="e.g., Cybersecurity Analyst"
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-soft"
              >
                Description*
              </label>{' '}
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                placeholder="Describe the career path and main responsibilities"
                required
              />
            </div>
          </div>
          <div className="space-y-4">
            {' '}
            <h3 className="text-lg font-medium text-strong">
              Required Subjects
            </h3>{' '}
            <div>
              <label
                htmlFor="mustLearn"
                className="block text-sm font-medium text-soft"
              >
                Must Learn Subjects*
              </label>

              <SubjectSelector
                subjects={subjects}
                selectedIds={selectedMustLearn}
                onAddSubject={(subjectId) =>
                  handleAddSubject(
                    subjectId,
                    setSelectedMustLearn,
                    'mustLearnSubjects'
                  )
                }
                onRemoveSubject={(subjectName) =>
                  handleRemoveSubject(
                    subjectName,
                    setSelectedMustLearn,
                    'mustLearnSubjects'
                  )
                }
                selectedSubjects={formData.mustLearnSubjects || []}
                tagColorClasses="bg-red-900 text-red-200"
                placeholder="Search for must learn subjects..."
                required={true}
                isLoading={loadingSubjects}
              />
            </div>{' '}
            <div>
              <label
                htmlFor="shouldLearn"
                className="block text-sm font-medium text-soft"
              >
                Should Learn Subjects
              </label>

              <SubjectSelector
                subjects={subjects}
                selectedIds={selectedShouldLearn}
                onAddSubject={(subjectId) =>
                  handleAddSubject(
                    subjectId,
                    setSelectedShouldLearn,
                    'shouldLearnSubjects'
                  )
                }
                onRemoveSubject={(subjectName) =>
                  handleRemoveSubject(
                    subjectName,
                    setSelectedShouldLearn,
                    'shouldLearnSubjects'
                  )
                }
                selectedSubjects={formData.shouldLearnSubjects || []}
                tagColorClasses="bg-amber-900 text-amber-200"
                placeholder="Search for should learn subjects..."
                isLoading={loadingSubjects}
              />
            </div>{' '}
            <div>
              <label
                htmlFor="canLearn"
                className="block text-sm font-medium text-soft"
              >
                Can Learn Subjects
              </label>

              <SubjectSelector
                subjects={subjects}
                selectedIds={selectedCanLearn}
                onAddSubject={(subjectId) =>
                  handleAddSubject(
                    subjectId,
                    setSelectedCanLearn,
                    'canLearnSubjects'
                  )
                }
                onRemoveSubject={(subjectName) =>
                  handleRemoveSubject(
                    subjectName,
                    setSelectedCanLearn,
                    'canLearnSubjects'
                  )
                }
                selectedSubjects={formData.canLearnSubjects || []}
                tagColorClasses="bg-green-900 text-green-200"
                placeholder="Search for can learn subjects..."
                isLoading={loadingSubjects}
              />
            </div>
          </div>{' '}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-strong">
              {isLoggedIn ? 'Submitter Information' : 'Your Information'}
            </h3>{' '}
            {isLoggedIn ? (
              // Show user info summary card when logged in
              <div className="space-y-4">
                <div className="bg-muted rounded-md p-4 border border-border">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-[var(--band-via)] flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {userName ? userName.charAt(0).toUpperCase() : '?'}
                      </span>
                    </div>
                    <div className="ml-4">
                      <p className="text-strong font-medium">
                        {userName || 'User'}
                      </p>
                      <p className="text-soft text-sm">
                        {userEmail || 'Authenticated user'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-soft">
                    Your contribution will be submitted with your account
                    information.
                  </p>
                </div>

                <div className="flex items-start mt-4">
                  <div className="flex items-center h-5">
                    <input
                      id="anonymous"
                      name="anonymous"
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-4 w-4 text-brand focus:ring-brand/40 border-border rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="anonymous"
                      className="text-soft cursor-pointer"
                    >
                      Contribute anonymously
                    </label>
                    <p className="text-soft">
                      Your name and email will not be publicly associated with
                      this contribution.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Show input fields only for non-logged in users
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="submitterName"
                      className="block text-sm font-medium text-soft"
                    >
                      Your Name*
                    </label>
                    <input
                      type="text"
                      id="submitterName"
                      name="submitterName"
                      value={formData.submitterName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                      required={!isAnonymous}
                      disabled={isAnonymous}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="submitterEmail"
                      className="block text-sm font-medium text-soft"
                    >
                      Your Email*
                    </label>
                    <input
                      type="email"
                      id="submitterEmail"
                      name="submitterEmail"
                      value={formData.submitterEmail}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                      required={!isAnonymous}
                      disabled={isAnonymous}
                    />
                  </div>
                </div>

                <div className="flex items-start mt-3">
                  <div className="flex items-center h-5">
                    <input
                      id="anonymous"
                      name="anonymous"
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="h-4 w-4 text-brand focus:ring-brand/40 border-border rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label
                      htmlFor="anonymous"
                      className="text-soft cursor-pointer"
                    >
                      Contribute anonymously
                    </label>
                    <p className="text-soft">
                      Your contribution will be submitted anonymously. We still
                      need a contact email for moderation purposes, but it
                      won&apos;t be publicly displayed.
                    </p>
                  </div>
                </div>
              </>
            )}
            <div>
              <label
                htmlFor="additionalNotes"
                className="block text-sm font-medium text-soft"
              >
                Additional Notes
              </label>
              <textarea
                id="additionalNotes"
                name="additionalNotes"
                value={formData.additionalNotes}
                onChange={handleChange}
                rows={3}
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                placeholder="Any additional information about this subject guidance"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-strong bg-muted border border-border rounded-md shadow-sm hover:bg-muted focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[var(--band-via)] border border-transparent rounded-md shadow-sm hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Submit Contribution'
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ContributionForm;

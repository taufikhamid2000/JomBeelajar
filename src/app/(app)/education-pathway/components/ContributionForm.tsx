'use client';
import { logger } from '@/lib/logger';

import { FC, useState, useEffect } from 'react';
import { PathwayContribution, PathwayOptionDetail } from '../types';
import { supabase } from '@/lib/supabase';
import PathwayOptionInput from './PathwayOptionInput';

// Mock submission function (to be implemented with real API later)
const submitPathwayContribution = async (
  contribution: PathwayContribution
): Promise<{ success: boolean; error?: string }> => {
  // This is a mock implementation that always succeeds
  // In a real implementation, this would make an API call
  logger.log('Submitting pathway contribution:', contribution);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { success: true };
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
  const [formData, setFormData] = useState<Partial<PathwayContribution>>({
    career: '',
    description: '',
    careerOutlook: {
      demand: 'medium',
      salaryRange: {
        min: 0,
        max: 0,
      },
      growthOutlook: '',
    },
    pathwayOptions: {
      preUniversity: [],
      bachelor: [],
      advanced: [],
      certifications: [],
    },
    additionalNotes: '',
    submitterName: '',
    submitterEmail: '',
  });

  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Form submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
  }, []); // Handle adding a new pathway option
  const handleAddPathwayOption = (
    pathway: 'preUniversity' | 'bachelor' | 'advanced' | 'certifications'
  ) => {
    setFormData((prev) => {
      // Ensure we have an existing pathwayOptions object or create a new one
      const pathwayOptions = prev.pathwayOptions || {
        preUniversity: [],
        bachelor: [],
        advanced: [],
        certifications: [],
      };

      // Get current options for this pathway or default to empty array
      const currentOptions = pathwayOptions[pathway] || [];

      return {
        ...prev,
        pathwayOptions: {
          ...pathwayOptions,
          [pathway]: [
            ...currentOptions,
            {
              name: '',
              description: '',
              advantages: [],
              challenges: [],
              institutions: [],
              requirements: [],
              duration: '',
            },
          ],
        },
      };
    });
  };
  // Handle updating a pathway option
  const handleUpdatePathwayOption = (
    pathway: 'preUniversity' | 'bachelor' | 'advanced' | 'certifications',
    index: number,
    updatedOption: PathwayOptionDetail
  ) => {
    setFormData((prev) => {
      // Ensure we have an existing pathwayOptions object
      const pathwayOptions = prev.pathwayOptions || {
        preUniversity: [],
        bachelor: [],
        advanced: [],
        certifications: [],
      };

      // Get current options for this pathway
      const currentOptions = [...(pathwayOptions[pathway] || [])];
      currentOptions[index] = updatedOption;

      return {
        ...prev,
        pathwayOptions: {
          ...pathwayOptions,
          [pathway]: currentOptions,
        },
      };
    });
  };

  // Handle deleting a pathway option
  const handleDeletePathwayOption = (
    pathway: 'preUniversity' | 'bachelor' | 'advanced' | 'certifications',
    index: number
  ) => {
    setFormData((prev) => {
      // Ensure we have an existing pathwayOptions object
      const pathwayOptions = prev.pathwayOptions || {
        preUniversity: [],
        bachelor: [],
        advanced: [],
        certifications: [],
      };

      // Get current options for this pathway
      const currentOptions = [...(pathwayOptions[pathway] || [])];
      currentOptions.splice(index, 1);

      return {
        ...prev,
        pathwayOptions: {
          ...pathwayOptions,
          [pathway]: currentOptions,
        },
      };
    });
  };

  // Handle form field changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    // Handle nested properties (e.g., careerOutlook.demand)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');

      if (parent === 'careerOutlook') {
        setFormData((prev) => {
          // Ensure we have an existing careerOutlook object
          const careerOutlook = prev.careerOutlook || {
            demand: 'medium',
            salaryRange: { min: 0, max: 0 },
            growthOutlook: '',
          };

          return {
            ...prev,
            careerOutlook: {
              ...careerOutlook,
              [child]: value,
            },
          };
        });
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle salary range changes specifically
  const handleSalaryChange = (field: 'min' | 'max', value: string) => {
    const numValue = parseInt(value, 10) || 0;
    setFormData((prev) => {
      // Ensure we have an existing careerOutlook and salaryRange object
      const careerOutlook = prev.careerOutlook || {
        demand: 'medium',
        salaryRange: { min: 0, max: 0 },
        growthOutlook: '',
      };

      return {
        ...prev,
        careerOutlook: {
          ...careerOutlook,
          salaryRange: {
            ...careerOutlook.salaryRange,
            [field]: numValue,
          },
        },
      };
    });
  };
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const updatedFormData = { ...formData }; // Handle submitter information
      if (isAnonymous) {
        // For anonymous contributions, store a placeholder name
        updatedFormData.submitterName = 'Anonymous Contributor';

        // If logged in, store email for admin purposes but mark as anonymous
        if (isLoggedIn && userEmail) {
          updatedFormData.submitterEmail = userEmail;
        } else {
          // For non-logged in anonymous users, use a placeholder if not provided
          updatedFormData.submitterEmail =
            formData.submitterEmail || 'anonymous@example.com';
        }
      } else if (isLoggedIn) {
        // For logged-in non-anonymous users, use their account info
        updatedFormData.submitterName = userName || 'Authenticated User';
        updatedFormData.submitterEmail = userEmail || '';
      }
      // For non-logged in, non-anonymous users, the form data already has the submitted values

      setFormData(updatedFormData);

      // Basic validation
      if (!formData.career || !formData.description) {
        throw new Error('Please provide a career title and description.');
      } // Check for submitter info only if not logged in and not anonymous
      if (
        !isLoggedIn &&
        !isAnonymous &&
        (!formData.submitterName || !formData.submitterEmail)
      ) {
        throw new Error(
          'Please provide your name and email or check "Contribute anonymously".'
        );
      }

      // Check for required pathway options
      if ((formData.pathwayOptions?.preUniversity?.length || 0) === 0) {
        throw new Error('Please provide at least one pre-university option.');
      }

      if ((formData.pathwayOptions?.bachelor?.length || 0) === 0) {
        throw new Error('Please provide at least one bachelor degree option.');
      }

      // Validate salary range
      const minSalary = formData.careerOutlook?.salaryRange?.min || 0;
      const maxSalary = formData.careerOutlook?.salaryRange?.max || 0;

      if (minSalary < 0 || maxSalary < 0) {
        throw new Error('Salary values cannot be negative');
      }

      if (maxSalary > 0 && minSalary > maxSalary) {
        throw new Error('Minimum salary cannot be greater than maximum salary');
      }

      // Submit the form data
      const result = await submitPathwayContribution(
        formData as PathwayContribution
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
        Contribute an Education Pathway
      </h2>
      {success ? (
        <div className="bg-green-950 border border-green-900 text-green-300 p-4 rounded-md mb-6">
          <p className="font-medium">Thank you for your contribution!</p>
          <p className="mt-1">
            Our team will review your submission and add it to our education
            pathways if approved. You&apos;ll receive an email notification when
            the review is complete.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({
                career: '',
                description: '',
                careerOutlook: {
                  demand: 'medium',
                  salaryRange: {
                    min: 0,
                    max: 0,
                  },
                  growthOutlook: '',
                },
                pathwayOptions: {
                  preUniversity: [],
                  bachelor: [],
                  advanced: [],
                  certifications: [],
                },
                additionalNotes: '',
                submitterName: '',
                submitterEmail: '',
              });
            }}
            className="mt-3 text-sm font-medium text-green-400 hover:text-green-200"
          >
            Submit another contribution
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-950 border border-red-900 text-red-300 p-4 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-strong">
              Career Information
            </h3>
            <div>
              <label
                htmlFor="career"
                className="block text-sm font-medium text-soft"
              >
                Career Title*
              </label>
              <input
                type="text"
                id="career"
                name="career"
                value={formData.career}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                placeholder="e.g., Software Engineer, Medical Doctor"
                required
              />
            </div>
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-soft"
              >
                Description*
              </label>
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
          </div>{' '}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-strong">Career Outlook</h3>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label
                  htmlFor="careerOutlook.demand"
                  className="block text-sm font-medium text-soft"
                >
                  Market Demand
                </label>
                <select
                  id="careerOutlook.demand"
                  name="careerOutlook.demand"
                  value={formData.careerOutlook?.demand || 'medium'}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <p className="mt-1 text-sm text-soft">
                  Current and projected demand for this career
                </p>
              </div>

              <div>
                <label
                  htmlFor="careerOutlook.growthOutlook"
                  className="block text-sm font-medium text-soft"
                >
                  Growth Outlook
                </label>
                <textarea
                  id="careerOutlook.growthOutlook"
                  name="careerOutlook.growthOutlook"
                  value={formData.careerOutlook?.growthOutlook || ''}
                  onChange={handleChange}
                  rows={2}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                  placeholder="Projected growth over the next 5-10 years"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="minSalary"
                  className="block text-sm font-medium text-soft"
                >
                  Minimum Salary (RM)
                </label>
                <input
                  type="number"
                  id="minSalary"
                  name="minSalary"
                  min="0"
                  value={formData.careerOutlook?.salaryRange?.min || 0}
                  onChange={(e) => handleSalaryChange('min', e.target.value)}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                />
              </div>

              <div>
                <label
                  htmlFor="maxSalary"
                  className="block text-sm font-medium text-soft"
                >
                  Maximum Salary (RM)
                </label>
                <input
                  type="number"
                  id="maxSalary"
                  name="maxSalary"
                  min="0"
                  value={formData.careerOutlook?.salaryRange?.max || 0}
                  onChange={(e) => handleSalaryChange('max', e.target.value)}
                  className="mt-1 block w-full rounded-md border-border shadow-sm focus:border-brand/40 focus:ring-brand/40 bg-muted text-strong sm:text-sm"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-strong">
              Educational Pathway
            </h3>

            {/* Pre-University Options */}
            <div className="bg-muted border border-border rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium text-strong">
                  Pre-University Options*
                </h4>
                <button
                  type="button"
                  onClick={() => handleAddPathwayOption('preUniversity')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 text-white"
                >
                  Add Option
                </button>
              </div>
              <p className="text-sm text-soft mb-4">
                Add pre-university pathways such as STPM, Foundation programs,
                A-Levels, etc.
              </p>

              {formData.pathwayOptions?.preUniversity &&
              formData.pathwayOptions.preUniversity.length > 0 ? (
                <div className="space-y-4">
                  {formData.pathwayOptions.preUniversity.map(
                    (option, index) => (
                      <PathwayOptionInput
                        key={`pre-u-${index}`}
                        option={option}
                        onChange={(updatedOption) =>
                          handleUpdatePathwayOption(
                            'preUniversity',
                            index,
                            updatedOption
                          )
                        }
                        onDelete={() =>
                          handleDeletePathwayOption('preUniversity', index)
                        }
                        index={index}
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border rounded-md">
                  <p className="text-soft">
                    No pre-university options added yet
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAddPathwayOption('preUniversity')}
                    className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 text-white"
                  >
                    Add Your First Option
                  </button>
                </div>
              )}
            </div>

            {/* Bachelor's Degree Options */}
            <div className="bg-muted border border-border rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium text-strong">
                  Bachelor&apos;s Degree Options*
                </h4>
                <button
                  type="button"
                  onClick={() => handleAddPathwayOption('bachelor')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 text-white"
                >
                  Add Option
                </button>
              </div>
              <p className="text-sm text-soft mb-4">
                Add bachelor degree pathways related to this career
              </p>

              {formData.pathwayOptions?.bachelor &&
              formData.pathwayOptions.bachelor.length > 0 ? (
                <div className="space-y-4">
                  {formData.pathwayOptions.bachelor.map((option, index) => (
                    <PathwayOptionInput
                      key={`bachelor-${index}`}
                      option={option}
                      onChange={(updatedOption) =>
                        handleUpdatePathwayOption(
                          'bachelor',
                          index,
                          updatedOption
                        )
                      }
                      onDelete={() =>
                        handleDeletePathwayOption('bachelor', index)
                      }
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border rounded-md">
                  <p className="text-soft">
                    No bachelor degree options added yet
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAddPathwayOption('bachelor')}
                    className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 text-white"
                  >
                    Add Your First Option
                  </button>
                </div>
              )}
            </div>

            {/* Advanced Degree Options */}
            <div className="bg-muted border border-border rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium text-strong">
                  Advanced Degree Options (Optional)
                </h4>
                <button
                  type="button"
                  onClick={() => handleAddPathwayOption('advanced')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 text-white"
                >
                  Add Option
                </button>
              </div>
              <p className="text-sm text-soft mb-4">
                Add master&apos;s, PhD or other advanced degree options
              </p>

              {formData.pathwayOptions?.advanced &&
              formData.pathwayOptions.advanced.length > 0 ? (
                <div className="space-y-4">
                  {formData.pathwayOptions.advanced.map((option, index) => (
                    <PathwayOptionInput
                      key={`advanced-${index}`}
                      option={option}
                      onChange={(updatedOption) =>
                        handleUpdatePathwayOption(
                          'advanced',
                          index,
                          updatedOption
                        )
                      }
                      onDelete={() =>
                        handleDeletePathwayOption('advanced', index)
                      }
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border rounded-md">
                  <p className="text-soft">
                    No advanced degree options added yet (optional)
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAddPathwayOption('advanced')}
                    className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 text-white"
                  >
                    Add an Option
                  </button>
                </div>
              )}
            </div>

            {/* Professional Certifications */}
            <div className="bg-muted border border-border rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-base font-medium text-strong">
                  Professional Certifications (Optional)
                </h4>
                <button
                  type="button"
                  onClick={() => handleAddPathwayOption('certifications')}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 text-white"
                >
                  Add Option
                </button>
              </div>
              <p className="text-sm text-soft mb-4">
                Add relevant professional certifications for this career
              </p>

              {formData.pathwayOptions?.certifications &&
              formData.pathwayOptions.certifications.length > 0 ? (
                <div className="space-y-4">
                  {formData.pathwayOptions.certifications.map(
                    (option, index) => (
                      <PathwayOptionInput
                        key={`cert-${index}`}
                        option={option}
                        onChange={(updatedOption) =>
                          handleUpdatePathwayOption(
                            'certifications',
                            index,
                            updatedOption
                          )
                        }
                        onDelete={() =>
                          handleDeletePathwayOption('certifications', index)
                        }
                        index={index}
                      />
                    )
                  )}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-border rounded-md">
                  <p className="text-soft">
                    No certifications added yet (optional)
                  </p>
                  <button
                    type="button"
                    onClick={() => handleAddPathwayOption('certifications')}
                    className="mt-2 inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md bg-[var(--band-via)] hover:bg-[var(--band-from)] focus:outline-none focus:ring-2 focus:ring-brand/40 text-white"
                  >
                    Add a Certification
                  </button>
                </div>
              )}
            </div>
          </div>{' '}
          <div className="space-y-4">
            {/* Anonymous Contribution Option - Always visible */}
            <div className="bg-muted border border-border rounded-md p-4 mb-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="anonymous"
                    name="anonymous"
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-5 w-5 text-brand focus:ring-brand/40 border-border rounded"
                  />
                </div>
                <div className="ml-3">
                  <label
                    htmlFor="anonymous"
                    className="text-lg font-medium text-strong cursor-pointer"
                  >
                    Contribute anonymously
                  </label>
                  <p className="mt-1 text-sm text-soft">
                    Your contribution will be submitted anonymously. Your name
                    will not be publicly associated with this contribution.
                  </p>
                </div>
              </div>
            </div>

            {/* Only show contributor information form for non-logged in users */}
            {!isLoggedIn && (
              <>
                <h3 className="text-lg font-medium text-strong">
                  Your Information
                </h3>
                <div className="bg-muted border border-border rounded-md p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="submitterName"
                        className="block text-sm font-medium text-soft"
                      >
                        Your Name{!isAnonymous && '*'}
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
                        Your Email{!isAnonymous && '*'}
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
                      <p className="mt-1 text-xs text-soft">
                        Email is required for verification but won&apos;t be
                        publicly displayed.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Show logged in user info */}
            {isLoggedIn && !isAnonymous && (
              <>
                <h3 className="text-lg font-medium text-strong">
                  Submitter Information
                </h3>
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
                placeholder="Any additional information about this educational pathway"
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

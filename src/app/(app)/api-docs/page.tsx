import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'API - JomBeelajar' };

type Endpoint = {
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  status: 'live' | 'planned';
  response?: string;
};
type EndpointGroup = { tag: string; endpoints: Endpoint[] };

const METHOD_CLASS: Record<Endpoint['method'], string> = {
  GET: 'text-sky-600 dark:text-sky-400',
  POST: 'text-emerald-600 dark:text-emerald-400',
  PATCH: 'text-amber-600 dark:text-amber-400',
  PUT: 'text-amber-600 dark:text-amber-400',
  DELETE: 'text-destructive',
};

const JSON_TYPE = 'application/json';

// Plain English on purpose: this is a technical reference, not user-facing
// copy. "live" rows are route handlers that exist under src/app/api today
// (used by the web app, signed-in session cookie); they are not a supported
// public API. Everything else is "planned".
const groups: EndpointGroup[] = [
  {
    tag: 'Subjects and topics',
    endpoints: [
      { method: 'GET', path: '/api/subjects', description: 'List subjects.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/subjects/{slug}', description: 'Get one subject.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/subjects/{slug}/chapters', description: "List a subject's chapters.", status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/subjects/{slug}/chapters-with-topics', description: "List a subject's chapters with their topics.", status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/topics/{topicId}', description: 'Get one topic.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/topics/random', description: 'Get a random topic.', status: 'live', response: JSON_TYPE },
    ],
  },
  {
    tag: 'Quizzes',
    endpoints: [
      { method: 'GET', path: '/api/quizzes-list', description: 'List quizzes. Optional ?topicId filters by topic.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/quizzes/random', description: 'Get a random quiz.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/quiz/{quizId}', description: 'Get a quiz.', status: 'live', response: JSON_TYPE },
      { method: 'POST', path: '/api/quiz/{quizId}/submit', description: 'Submit answers for a quiz attempt.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/quiz/{quizId}/comments', description: 'List comments on a quiz.', status: 'live', response: JSON_TYPE },
      { method: 'POST', path: '/api/quiz/{quizId}/comments', description: 'Comment on a quiz.', status: 'live', response: JSON_TYPE },
    ],
  },
  {
    tag: 'Leaderboard and schools',
    endpoints: [
      { method: 'GET', path: '/api/leaderboard', description: 'Student leaderboard. ?timeFrame=daily|weekly|allTime.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/leaderboard/schools', description: 'School leaderboard.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/schools', description: 'List schools.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/schools/{id}', description: 'Get one school.', status: 'live', response: JSON_TYPE },
    ],
  },
  {
    tag: 'Profile and progress',
    endpoints: [
      { method: 'GET', path: '/api/profile/{userId}', description: "Get a user's public profile.", status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/profile/{userId}/achievements', description: "List a user's achievements.", status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/dashboard', description: 'Dashboard data for the signed-in user.', status: 'live', response: JSON_TYPE },
      { method: 'GET', path: '/api/me/progress', description: "The signed-in user's learning progress.", status: 'live', response: JSON_TYPE },
      { method: 'PATCH', path: '/api/me', description: "Update the signed-in user's profile.", status: 'live', response: JSON_TYPE },
    ],
  },
  {
    tag: 'Planned',
    endpoints: [
      { method: 'GET', path: '/api/v1/subjects', description: 'Versioned, API-key-authenticated list of subjects.', status: 'planned' },
      { method: 'GET', path: '/api/v1/quizzes', description: 'Versioned, API-key-authenticated list of quizzes.', status: 'planned' },
      { method: 'GET', path: '/api/v1/me/progress', description: 'Your progress, readable with an API key.', status: 'planned' },
      { method: 'GET', path: '/api/keys', description: 'List your API keys (without their secret values).', status: 'planned' },
      { method: 'POST', path: '/api/keys', description: 'Create a new API key.', status: 'planned' },
      { method: 'DELETE', path: '/api/keys/{id}', description: 'Revoke an API key.', status: 'planned' },
    ],
  },
];

export default function ApiDocsPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <div>
        <h1 className="text-xl font-semibold text-foreground">API</h1>
        <p className="mt-2 text-sm text-foreground/60">
          A REST API for JomBeelajar is on the roadmap.
        </p>
      </div>

      <p className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-foreground">
        Placeholder: the API is not public yet. The endpoints marked live
        exist because the web app uses them, but they only accept a signed-in
        session, are not documented as stable, and may change without notice.
        API keys do not exist yet.
      </p>

      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-foreground/60">
        <p className="text-foreground">Authenticating (planned)</p>
        <p className="mt-1">
          Once API keys ship, requests will send the key as a bearer token.
        </p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-3 text-xs text-foreground">
          <code>{`curl -H "Authorization: Bearer jb_..." https://jombeelajar.taufikhamid.com/api/v1/subjects`}</code>
        </pre>
      </div>

      <div className="flex flex-col gap-6">
        {groups.map((group) => (
          <section key={group.tag} className="flex flex-col gap-2">
            <h2 className="text-sm font-medium text-foreground/60">{group.tag}</h2>
            <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border">
              {group.endpoints.map((endpoint) => (
                <li key={`${endpoint.method} ${endpoint.path}`} className="flex flex-col gap-1.5 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`font-mono text-xs font-semibold ${METHOD_CLASS[endpoint.method]}`}>
                      {endpoint.method}
                    </span>
                    <code className="text-sm text-foreground">{endpoint.path}</code>
                    <span
                      className={
                        endpoint.status === 'live'
                          ? 'rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent'
                          : 'rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground/50'
                      }
                    >
                      {endpoint.status === 'live' ? 'Live' : 'Planned'}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/60">{endpoint.description}</p>
                  {endpoint.status === 'live' && (
                    <>
                      <p className="text-xs text-foreground/40">Auth: signed-in session cookie only</p>
                      {endpoint.response && (
                        <p className="text-xs text-foreground/40">Response: {endpoint.response}</p>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}

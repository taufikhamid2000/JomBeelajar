import { ImageResponse } from 'next/og';

export const alt = 'JomBeelajar';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: 96,
          background: 'linear-gradient(135deg, #0b5f58, #0f766e 55%, #1d6f5a)',
          color: '#ffffff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <svg width="120" height="120" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="8" fill="#ffffff" />
            <path
              d="M16 12.5c-2-1.6-4.6-2.2-7.5-2v11.2c2.9-.2 5.5.4 7.5 2 2-1.6 4.6-2.2 7.5-2V10.5c-2.9-.2-5.5.4-7.5 2Z"
              fill="#0f766e"
            />
            <path d="M16 3.8l1.3 2.9 2.9 1.3-2.9 1.3L16 12.2l-1.3-2.9L11.8 8l2.9-1.3L16 3.8Z" fill="#f59e0b" />
          </svg>
          <div style={{ fontSize: 88, fontWeight: 800 }}>JomBeelajar</div>
        </div>
        <div style={{ marginTop: 40, fontSize: 40, lineHeight: 1.3, maxWidth: 900 }}>
          Quizzes, streaks and leaderboards for Malaysian SPM students.
        </div>
      </div>
    ),
    size
  );
}

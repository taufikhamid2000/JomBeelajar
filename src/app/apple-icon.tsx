import { ImageResponse } from 'next/og';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f766e',
        }}
      >
        <svg width="132" height="132" viewBox="0 0 32 32">
          <path
            d="M16 12.5c-2-1.6-4.6-2.2-7.5-2v11.2c2.9-.2 5.5.4 7.5 2 2-1.6 4.6-2.2 7.5-2V10.5c-2.9-.2-5.5.4-7.5 2Z"
            fill="#ffffff"
          />
          <path d="M16 12.5v11.2" stroke="#0f766e" strokeWidth="1.4" />
          <path
            d="M16 3.8l1.3 2.9 2.9 1.3-2.9 1.3L16 12.2l-1.3-2.9L11.8 8l2.9-1.3L16 3.8Z"
            fill="#fcd34d"
          />
        </svg>
      </div>
    ),
    size
  );
}

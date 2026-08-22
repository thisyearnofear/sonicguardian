import { ImageResponse } from 'next/og';
import { SITE_NAME, SITE_TAGLINE } from '@/lib/site';

export const alt = `${SITE_NAME} — ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: 'linear-gradient(145deg, #020617 0%, #0f172a 45%, #1e1b4b 100%)',
          color: '#f8fafc',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            🎵
          </div>
          <span style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
            {SITE_NAME}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 900 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-0.03em',
            }}
          >
            {SITE_TAGLINE}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.45, color: '#94a3b8', maxWidth: 820 }}>
            ZK sonic identity on Starknet · STRK20 private recovery · Agent validation without
            exposing your pattern
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            {['Starknet', 'STRK20', 'ZK Acoustic'].map((label) => (
              <div
                key={label}
                style={{
                  padding: '10px 18px',
                  borderRadius: 999,
                  border: '1px solid rgba(129, 140, 248, 0.35)',
                  background: 'rgba(99, 102, 241, 0.12)',
                  fontSize: 20,
                  color: '#c7d2fe',
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 22, color: '#64748b' }}>sonicguardian.vercel.app</div>
        </div>

        {/* Decorative waveform */}
        <div
          style={{
            position: 'absolute',
            right: -40,
            bottom: 120,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
            opacity: 0.15,
          }}
        >
          {[120, 200, 160, 280, 180, 240, 140, 220, 190].map((h, i) => (
            <div
              key={i}
              style={{
                width: 16,
                height: h,
                borderRadius: 8,
                background: 'linear-gradient(180deg, #818cf8, #6366f1)',
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

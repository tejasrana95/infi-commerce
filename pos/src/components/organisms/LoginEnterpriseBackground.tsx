'use client';

import React from 'react';

export default function LoginEnterpriseBackground() {
  return (
    <div className="login-bg absolute inset-0 z-0 pointer-events-none" aria-hidden>
      <div
        className="login-blob"
        style={{ width: 420, height: 420, left: -120, top: -80, background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.36), rgba(79,70,229,0.18))' }}
      />
      <div
        className="login-blob"
        style={{ width: 360, height: 360, right: -100, bottom: -80, background: 'radial-gradient(circle at 70% 70%, rgba(6,182,212,0.28), rgba(99,102,241,0.12))' }}
      />
      <div
        className="login-blob"
        style={{ width: 260, height: 260, left: '18%', bottom: -40, background: 'radial-gradient(circle at 50% 50%, rgba(236,72,153,0.12), rgba(99,102,241,0.06))' }}
      />
    </div>
  );
}

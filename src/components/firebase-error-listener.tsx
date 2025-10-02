// src/components/firebase-error-listener.tsx
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/lib/error-emitter';

// This is a client-side component that will listen for permission errors
// and throw them to be caught by the Next.js development error overlay.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: Error) => {
      // In a production environment, you might want to log this to a service
      // like Sentry, but for development, we'll just throw it.
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          throw error;
        }, 0);
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything.
}

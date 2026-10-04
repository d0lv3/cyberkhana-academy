import React, { Suspense, lazy, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { hasSeenTour, onTourRequested } from '../../services/tourService';

const TourHost = lazy(() => import('./TourHost'));

/**
 * Brings the tour in for the two people who will see it: a member who has not
 * been shown around yet, and anyone who asks from the question mark in the
 * header. Everyone else, which is nearly every visit, never downloads it.
 *
 * A request is counted rather than flagged, so asking again after closing the
 * tour opens it again, and the first request, the one that fetched the tour,
 * is still waiting for it when it arrives.
 */
const TourGate: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [requests, setRequests] = useState(0);

  useEffect(() => onTourRequested(() => setRequests((n) => n + 1)), []);

  if (requests === 0 && !(isAuthenticated && !hasSeenTour())) return null;
  return (
    <Suspense fallback={null}>
      <TourHost requests={requests} />
    </Suspense>
  );
};

export default TourGate;

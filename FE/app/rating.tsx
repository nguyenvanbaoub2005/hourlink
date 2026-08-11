import React from 'react';
import RatingScreen from '@screens/rating/RatingScreen';

/**
 * Route: /rating
 * Params (query): appointmentId, revieweeId, revieweeName, revieweeAvatar?, appointmentTitle?
 */
export default function RatingRoute() {
  return <RatingScreen />;
}

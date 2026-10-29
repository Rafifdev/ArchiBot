import React, { useEffect, useState } from 'react';

/**
 * Isolated live counter components.
 * By keeping the 250ms interval within isolated leaf components,
 * ticking numbers re-render only themselves and never trigger
 * re-renders of the parent LandingPage component tree.
 */
export const LiveTotalTxCounter: React.FC = React.memo(() => {
  const [totalTx, setTotalTx] = useState(402845192310);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextTps = Math.floor(3890 + Math.random() * 520);
      setTotalTx((prev) => prev + Math.floor(nextTps / 4));
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return <>{totalTx.toLocaleString('en-US')}+</>;
});

export const LiveTpsCounter: React.FC = React.memo(() => {
  const [liveTps, setLiveTps] = useState(4128);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextTps = Math.floor(3890 + Math.random() * 520);
      setLiveTps(nextTps);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  return <>{liveTps.toLocaleString('en-US')}</>;
});

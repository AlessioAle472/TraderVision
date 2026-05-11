import React, { useEffect, useState } from 'react';

/**
 * AnimatedCounter
 * Animates a number from 0 to its target value.
 *
 * @param {number} value - Target value to reach
 * @param {number} duration - Animation duration in ms
 */
const AnimatedCounter = ({ value, duration = 1000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const finalValue = parseInt(value, 10) || 0;
    
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing function (easeOutQuart) for smooth deceleration
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      
      setCount(Math.floor(easeProgress * finalValue));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(finalValue);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span className="counter-animate">{count}</span>;
};

export default AnimatedCounter;

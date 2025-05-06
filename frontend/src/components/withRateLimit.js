import { useRef } from 'react';
import throttle from 'lodash.throttle';

const withRateLimit = (Component, throttleMs = 1000) => {
  return function RateLimitedComponent(props) {
    const fetchRef = useRef();

    fetchRef.current = throttle(
      async (...args) => {
        if (props.onFetch) {
          return props.onFetch(...args);
        }
      },
      throttleMs,
      { leading: true, trailing: false }
    );

    return <Component {...props} onFetch={fetchRef.current} />;
  };
};

export default withRateLimit;
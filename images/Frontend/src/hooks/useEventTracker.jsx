import { useEffect, useRef, useState } from 'react';
import EventTracker from '../utils/EventTracker';

// Global tracker instance
let trackerInstance = null;

export function useEventTracker() {
  const [isTracking, setIsTracking] = useState(false);
  const formFieldRefs = useRef({});

  // Initialize tracker
  useEffect(() => {
    if (!trackerInstance) {
      trackerInstance = new EventTracker();
      trackerInstance.expose();
      setIsTracking(trackerInstance.isTracking);
    }
  }, []);

  // ===========================
  // FORM TRACKING HOOKS
  // ===========================
  const trackFormField = (fieldName, fieldType, formName = '') => {
    return {
      onFocus: () => {
        if (trackerInstance) {
          trackerInstance.trackFormFocus(fieldName, fieldType, formName);
          formFieldRefs.current[`${formName}_${fieldName}`] = { focused: true };
        }
      },
      onBlur: (e) => {
        if (trackerInstance) {
          trackerInstance.trackFormBlur(fieldName, fieldType, e.target.value, formName);
          formFieldRefs.current[`${formName}_${fieldName}`] = { 
            ...formFieldRefs.current[`${formName}_${fieldName}`], 
            focused: false 
          };
        }
      },
      onChange: (e) => {
        const oldValue = formFieldRefs.current[`${formName}_${fieldName}`]?.lastValue || '';
        if (trackerInstance) {
          trackerInstance.trackFormValueChange(fieldName, fieldType, e.target.value, oldValue, formName);
          formFieldRefs.current[`${formName}_${fieldName}`] = { 
            ...formFieldRefs.current[`${formName}_${fieldName}`], 
            lastValue: e.target.value 
          };
        }
      }
    };
  };

  const trackFormValidation = (fieldName, validationErrors, formName = '') => {
    if (trackerInstance) {
      trackerInstance.trackFormValidation(fieldName, validationErrors, formName);
    }
  };

  const trackFormSubmit = (formData, formName = '', success = true, errors = []) => {
    if (trackerInstance) {
      trackerInstance.trackFormSubmit(formData, formName, success, errors);
    }
  };

  // ===========================
  // NAVIGATION TRACKING
  // ===========================
  const trackPageView = (url) => {
    if (trackerInstance) {
      trackerInstance.trackPageView(url);
    }
  };

  const trackNavigation = (from, to, method = 'click') => {
    if (trackerInstance) {
      trackerInstance.trackNavigation(from, to, method);
    }
  };

  // ===========================
  // CLICK & INTERACTION TRACKING
  // ===========================
  const trackClick = (element, details = {}) => {
    if (trackerInstance) {
      trackerInstance.trackClick(element, details);
    }
  };

  // ===========================
  // LOGIN TRACKING
  // ===========================
  const trackLoginAttempt = (email, success = false, error = null) => {
    if (trackerInstance) {
      trackerInstance.trackLoginAttempt(email, success, error);
    }
  };

  // ===========================
  // CUSTOM EVENT TRACKING
  // ===========================
  const trackCustomEvent = (type, data) => {
    if (trackerInstance) {
      trackerInstance.track(type, data);
    }
  };

  return {
    isTracking,
    tracker: trackerInstance,
    
    // Form tracking
    trackFormField,
    trackFormValidation,
    trackFormSubmit,
    
    // Navigation tracking
    trackPageView,
    trackNavigation,
    
    // Interaction tracking
    trackClick,
    
    // Login tracking
    trackLoginAttempt,
    
    // Custom tracking
    trackCustomEvent
  };
}

// Hook for scroll depth tracking
export function useScrollTracker() {
  const [scrollDepth, setScrollDepth] = useState(0);
  const maxDepth = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = window.pageYOffset;
      const currentDepth = documentHeight > 0 ? Math.round((scrolled / documentHeight) * 100) : 0;
      
      if (currentDepth > maxDepth.current) {
        maxDepth.current = currentDepth;
        setScrollDepth(currentDepth);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return scrollDepth;
}

// Hook for time on page tracking
export function useTimeOnPage() {
  const [timeOnPage, setTimeOnPage] = useState(0);
  const startTime = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOnPage(Date.now() - startTime.current);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return timeOnPage;
}
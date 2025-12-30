class EventTracker {
  constructor() {
    this.userId = localStorage.getItem('userId');
    this.sessionId = this.generateSessionId();
    this.eventQueue = [];
    this.batchSize = 10;
    this.batchInterval = 5000; // 5 seconds
    this.isTracking = false;
    
    // Time tracking
    this.pageStartTime = Date.now();
    this.scrollDepths = [];
    this.maxScrollDepth = 0;
    this.timers = new Map();
    
    // Form tracking
    this.formFieldData = new Map();
    
    // API endpoint
    this.API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5003';
    
    this.init();
  }

  // ===========================
  // INITIALIZATION
  // ===========================
  init() {
    if (!this.userId) {
      console.warn('EventTracker: No user ID found in localStorage');
      return;
    }

    this.isTracking = true;
    
    // Start batch sending
    setInterval(() => this.sendBatch(), this.batchInterval);
    
    // Track initial page view
    this.trackPageView();
    
    // Set up global event listeners
    this.setupEventListeners();
    
    // Track when user leaves page
    window.addEventListener('beforeunload', () => {
      this.flushEvents();
    });
    
    console.log('EventTracker: Initialized for user', this.userId, 'session', this.sessionId);
  }

  // ===========================
  // SESSION MANAGEMENT
  // ===========================
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // ===========================
  // EVENT TRACKING METHODS
  // ===========================
  track(type, data = {}) {
    if (!this.isTracking) return;
    
    const event = {
      type,
      data,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    this.eventQueue.push(event);
    
    // Send immediately for important events
    if (['form_submit', 'login_attempt'].includes(type)) {
      this.flushEvents();
    }
  }

  trackPageView(url = window.location.href) {
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    const pageLoadTime = navigationEntry ? navigationEntry.loadEventEnd - navigationEntry.fetchStart : 0;
    
    this.track('page_view', {
      url,
      referrer: document.referrer,
      pageLoadTime,
      title: document.title
    });

    // Reset page-specific tracking
    this.pageStartTime = Date.now();
    this.scrollDepths = [];
    this.maxScrollDepth = 0;
  }

  trackClick(element, details = {}) {
    const elementInfo = this.getElementInfo(element);
    
    this.track('click', {
      element: elementInfo,
      ...details
    });
  }

  trackNavigation(from, to, method = 'click') {
    this.track('navigation', {
      from,
      to,
      method,
      timestamp: Date.now()
    });
  }

  trackScroll() {
    const scrollPercentage = this.calculateScrollDepth();
    this.scrollDepths.push(scrollPercentage);
    this.maxScrollDepth = Math.max(this.maxScrollDepth, scrollPercentage);
    
    // Track significant scroll events (every 10% increase)
    if (scrollPercentage % 10 === 0) {
      this.track('scroll', {
        scrollDepth: scrollPercentage,
        maxScrollDepth: this.maxScrollDepth,
        scrollPosition: {
          x: window.pageXOffset,
          y: window.pageYOffset
        }
      });
    }
  }

  trackHover(element, duration) {
    const elementInfo = this.getElementInfo(element);
    
    this.track('hover', {
      element: elementInfo,
      duration,
      position: {
        x: element.getBoundingClientRect().left,
        y: element.getBoundingClientRect().top
      }
    });
  }

  // ===========================
  // FORM TRACKING
  // ===========================
  trackFormFocus(fieldName, fieldType, formName = '') {
    const fieldKey = `${formName}_${fieldName}`;
    
    if (!this.formFieldData.has(fieldKey)) {
      this.formFieldData.set(fieldKey, {
        fieldName,
        fieldType,
        formName,
        focusCount: 0,
        totalTimeInField: 0,
        valueChanges: 0,
        firstFocusTime: Date.now(),
        validationErrors: []
      });
    }

    const fieldData = this.formFieldData.get(fieldKey);
    fieldData.focusCount++;
    fieldData.lastFocusTime = Date.now();
    fieldData.isFocused = true;
    
    // Start timer for this field
    this.timers.set(fieldKey, Date.now());

    this.track('form_focus', {
      fieldName,
      fieldType,
      formName,
      focusCount: fieldData.focusCount,
      totalFocusTime: fieldData.totalTimeInField
    });
  }

  trackFormBlur(fieldName, fieldType, currentValue, formName = '') {
    const fieldKey = `${formName}_${fieldName}`;
    const fieldData = this.formFieldData.get(fieldKey);
    
    if (!fieldData || !fieldData.isFocused) return;

    // Calculate time spent in field
    const focusTime = this.timers.get(fieldKey);
    const timeSpent = focusTime ? Date.now() - focusTime : 0;
    fieldData.totalTimeInField += timeSpent;
    fieldData.isFocused = false;
    
    // Clear timer
    this.timers.delete(fieldKey);

    this.track('form_blur', {
      fieldName,
      fieldType,
      formName,
      timeSpent,
      totalTimeInField: fieldData.totalTimeInField,
      focusCount: fieldData.focusCount,
      valueChanges: fieldData.valueChanges,
      currentValue
    });
  }

  trackFormValueChange(fieldName, fieldType, newValue, oldValue, formName = '') {
    const fieldKey = `${formName}_${fieldName}`;
    const fieldData = this.formFieldData.get(fieldKey);
    
    if (fieldData) {
      fieldData.valueChanges++;
    }

    this.track('form_change', {
      fieldName,
      fieldType,
      formName,
      newValue,
      oldValue,
      changeCount: fieldData ? fieldData.valueChanges : 1
    });
  }

  trackFormValidation(fieldName, validationErrors, formName = '') {
    const fieldKey = `${formName}_${fieldName}`;
    const fieldData = this.formFieldData.get(fieldKey);
    
    if (fieldData) {
      fieldData.validationErrors = fieldData.validationErrors.concat(validationErrors);
    }

    this.track('form_validation_error', {
      fieldName,
      formName,
      validationErrors,
      totalErrors: fieldData ? fieldData.validationErrors.length : validationErrors.length
    });
  }

  trackFormSubmit(formData, formName = '', success = true, errors = []) {
    // Get all field data for this form
    const formFields = Array.from(this.formFieldData.entries())
      .filter(([key]) => key.startsWith(formName))
      .map(([key, data]) => data);

    const totalFormTime = this.pageStartTime ? Date.now() - this.pageStartTime : 0;

    this.track('form_submit', {
      formName,
      success,
      errors,
      formData,
      fieldCount: formFields.length,
      totalFormTime,
      avgFieldTime: formFields.length > 0 ? 
        formFields.reduce((sum, field) => sum + field.totalTimeInField, 0) / formFields.length : 0,
      hesitationScore: this.calculateFormHesitation(formFields)
    });

    // Clear form tracking data for successful submits
    if (success) {
      this.clearFormData(formName);
    }
  }

  // ===========================
  // LOGIN ATTEMPT TRACKING
  // ===========================
  trackLoginAttempt(email, success = false, error = null) {
    this.track('login_attempt', {
      email,
      success,
      error,
      timestamp: Date.now()
    });
  }

  // ===========================
  // UTILITY METHODS
  // ===========================
  getElementInfo(element) {
    if (!element) return {};
    
    return {
      tagName: element.tagName?.toLowerCase(),
      id: element.id || '',
      className: element.className || '',
      text: element.textContent?.trim().substring(0, 100) || '',
      href: element.href || '',
      type: element.type || '',
      name: element.name || '',
      value: element.value ? String(element.value).substring(0, 100) : '',
      selector: this.getCSSSelector(element)
    };
  }

  getCSSSelector(element) {
    if (element.id) return `#${element.id}`;
    
    const path = [];
    while (element && element.nodeType === Node.ELEMENT_NODE) {
      let selector = element.nodeName.toLowerCase();
      if (element.id) {
        selector = `#${element.id}`;
        path.unshift(selector);
        break;
      } else {
        let sibling = element;
        let siblingIndex = 1;
        while (sibling.previousElementSibling) {
          sibling = sibling.previousElementSibling;
          if (sibling.nodeName.toLowerCase() === selector) {
            siblingIndex++;
          }
        }
        path.unshift(`${selector}:nth-child(${siblingIndex})`);
      }
      element = element.parentNode;
    }
    return path.join(' > ');
  }

  calculateScrollDepth() {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.pageYOffset;
    
    return documentHeight > 0 ? Math.round((scrolled / documentHeight) * 100) : 0;
  }

  calculateFormHesitation(formFields) {
    if (formFields.length === 0) return 0;
    
    const totalFocusBlurRatio = formFields.reduce((sum, field) => {
      const ratio = field.focusCount > 1 ? 
        (field.focusCount - 1) / field.focusCount : 0;
      return sum + ratio;
    }, 0);
    
    return Math.round((totalFocusBlurRatio / formFields.length) * 100);
  }

  clearFormData(formName) {
    const keysToDelete = Array.from(this.formFieldData.keys())
      .filter(key => key.startsWith(formName));
    
    keysToDelete.forEach(key => this.formFieldData.delete(key));
  }

  // ===========================
  // EVENT LISTENERS
  // ===========================
  setupEventListeners() {
    // Click tracking
    document.addEventListener('click', (e) => {
      if (!this.isTracking) return;
      this.trackClick(e.target, {
        coordinates: { x: e.clientX, y: e.clientY },
        modifiers: {
          ctrl: e.ctrlKey,
          shift: e.shiftKey,
          alt: e.altKey
        }
      });
    }, true);

    // Scroll tracking
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (!this.isTracking) return;
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => this.trackScroll(), 100);
    });

    // Hover tracking (desktop only)
    if (!this.isMobileDevice()) {
      let hoverTimer;
      document.addEventListener('mouseover', (e) => {
        if (!this.isTracking) return;
        
        const target = e.target;
        clearTimeout(hoverTimer);
        
        hoverTimer = setTimeout(() => {
          this.trackHover(target, 1000); // 1 second hover
        }, 500);
      });

      document.addEventListener('mouseout', () => {
        clearTimeout(hoverTimer);
      });
    }

    // Page visibility tracking
    document.addEventListener('visibilitychange', () => {
      if (!this.isTracking) return;
      
      if (document.hidden) {
        this.flushEvents(); // Send queued events when user leaves
      }
    });
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // ===========================
  // BATCH PROCESSING
  // ===========================
  sendBatch() {
    if (this.eventQueue.length === 0) return;
    
    const eventsToSend = this.eventQueue.splice(0, this.batchSize);
    
    fetch(`${this.API_URL}/api/events/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: this.userId,
        events: eventsToSend
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        console.log(`EventTracker: Sent ${eventsToSend.length} events`);
      } else {
        console.error('EventTracker: Failed to send events', data);
        // Re-queue failed events
        this.eventQueue.unshift(...eventsToSend);
      }
    })
    .catch(error => {
      console.error('EventTracker: Network error sending events', error);
      // Re-queue failed events
      this.eventQueue.unshift(...eventsToSend);
    });
  }

  flushEvents() {
    if (this.eventQueue.length > 0) {
      const allEvents = this.eventQueue.splice(0);
      
      // Send immediately as single event for critical ones
      const criticalEvents = allEvents.filter(e => 
        ['form_submit', 'login_attempt'].includes(e.type)
      );
      const regularEvents = allEvents.filter(e => 
        !['form_submit', 'login_attempt'].includes(e.type)
      );

      // Send critical events immediately
      criticalEvents.forEach(event => {
        fetch(`${this.API_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: this.userId,
            ...event
          })
        });
      });

      // Send regular events as batch
      if (regularEvents.length > 0) {
        fetch(`${this.API_URL}/api/events/batch`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: this.userId,
            events: regularEvents
          })
        });
      }
    }
  }

  // ===========================
  // PUBLIC API
  // ===========================
  // Expose methods to window for global access
  expose() {
    window.EventTracker = this;
  }

  // Destroy tracker
  destroy() {
    this.isTracking = false;
    this.flushEvents();
    this.eventQueue = [];
    this.formFieldData.clear();
    this.timers.clear();
  }
}

export default EventTracker;
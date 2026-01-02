// src/utils/analytics.js

class AnalyticsTracker {
  constructor() {
    this.queue = [];
    this.flushTimer = null;
    this.startTime = Date.now();
    this.firstInteractionTime = null;
    this.fieldChanges = new Map();
    this.optionHovers = new Map();
    this.lastProgress = 0;
    this.sessionId = this.generateSessionId();
    this.userUID = this.ensureUserUID();
    this.userId = localStorage.getItem('userId');
    this.init();
  }

  generateSessionId() {
    return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  }

  ensureUserUID() {
    let uid = localStorage.getItem('userUID');
    if (!uid) {
      uid = 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('userUID', uid);
    }
    return uid;
  }

  init() {
    // Flush every 5 seconds or 10 events (more frequent for testing)
    this.flushTimer = setInterval(() => {
      if (this.queue.length > 0) {
        console.debug(`📊 Analytics: flushing ${this.queue.length} events (timer)`);
        this.flush();
      }
    }, 5000);

    // Send beacon on page unload
    window.addEventListener('beforeunload', () => {
      this.flush(true);
    });

    // Track first interaction
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const trackFirstInteraction = () => {
      if (!this.firstInteractionTime) {
        this.firstInteractionTime = Date.now();
        events.forEach(event => window.removeEventListener(event, trackFirstInteraction, true));
      }
    };
    events.forEach(event => window.addEventListener(event, trackFirstInteraction, true));
  }

  getBasePayload() {
    return {
      userUID: this.userUID,
      userId: this.userId,
      sessionId: this.sessionId,
      route: window.location.pathname,
      clientTs: Date.now(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent.substring(0, 200) // Trim for storage
    };
  }

  track(eventName, payload = {}) {
    const event = {
      eventName,
      ...this.getBasePayload(),
      payload: this.sanitizePayload(payload)
    };

    this.queue.push(event);

    if (this.queue.length >= 10) {
      console.debug(`📊 Analytics: flushing ${this.queue.length} events (queue size)`);
      this.flush();
    }
  }

  sanitizePayload(payload) {
    const sanitized = {};
    
    Object.keys(payload).forEach(key => {
      const value = payload[key];
      
      if (typeof value === 'string') {
        // Trim strings and limit length
        sanitized[key] = value.substring(0, 100);
      } else if (typeof value === 'number' && isFinite(value)) {
        sanitized[key] = value;
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 10); // Limit array size
      } else if (typeof value === 'object' && value !== null) {
        // Flatten objects with limited depth
        const flattened = {};
        Object.keys(value).slice(0, 5).forEach(subKey => {
          const subValue = value[subKey];
          if (typeof subValue === 'string') {
            flattened[subKey] = subValue.substring(0, 50);
          } else if (typeof subValue === 'number' && isFinite(subValue)) {
            flattened[subKey] = subValue;
          } else if (typeof subValue === 'boolean') {
            flattened[subKey] = subValue;
          }
        });
        sanitized[key] = flattened;
      }
    });

    return sanitized;
  }

  getFieldBucket(fieldName, value) {
    // Define bucket ranges for different field types
    const buckets = {
      water: [
        { min: 0, max: 0, label: '0' },
        { min: 1, max: 100, label: '1-100' },
        { min: 101, max: 300, label: '101-300' },
        { min: 301, max: 700, label: '301-700' },
        { min: 701, max: Infinity, label: '700+' }
      ],
      sleepHours: [
        { min: 0, max: 4, label: '0-4' },
        { min: 5, max: 8, label: '5-8' },
        { min: 9, max: 12, label: '9-12' },
        { min: 13, max: Infinity, label: '13+' }
      ],
      walks: [
        { min: 0, max: 0, label: '0' },
        { min: 1, max: 2, label: '1-2' },
        { min: 3, max: 4, label: '3-4' },
        { min: 5, max: Infinity, label: '5+' }
      ],
      playtimeMinutes: [
        { min: 0, max: 0, label: '0' },
        { min: 1, max: 15, label: '1-15' },
        { min: 16, max: 60, label: '16-60' },
        { min: 61, max: Infinity, label: '60+' }
      ],
      aloneHours: [
        { min: 0, max: 2, label: '0-2' },
        { min: 3, max: 6, label: '3-6' },
        { min: 7, max: 12, label: '7-12' },
        { min: 13, max: Infinity, label: '12+' }
      ]
    };

    // For text fields, use length buckets (privacy-safe)
    if (typeof value === 'string') {
      const length = value.trim().length;
      if (length === 0) return '0';
      if (length <= 3) return '1-3';
      if (length <= 10) return '4-10';
      return '11+';
    }

    // For numeric fields, use predefined buckets
    if (typeof value === 'number' && buckets[fieldName]) {
      const bucket = buckets[fieldName].find(b => value >= b.min && value <= b.max);
      return bucket ? bucket.label : 'unknown';
    }

    return 'unknown';
  }

  getPageOptionChangeCounts() {
    const counts = {};
    this.fieldChanges.forEach((count, key) => {
      if (key.includes('_changes')) {
        const groupLabel = key.replace('_changes', '');
        counts[groupLabel] = count;
      }
    });
    return counts;
  }

  trackFieldChange(fieldName, value, fieldType = 'text', debounceMs = 500, dogId = null, selectedDate = null) {
    // Debounce to avoid spam
    if (this.fieldChangeTimeouts && this.fieldChangeTimeouts.has(fieldName)) {
      clearTimeout(this.fieldChangeTimeouts.get(fieldName));
    }
    
    if (!this.fieldChangeTimeouts) {
      this.fieldChangeTimeouts = new Map();
    }
    
    this.fieldChangeTimeouts.set(fieldName, setTimeout(() => {
      const currentValue = this.fieldLastBuckets ? this.fieldLastBuckets.get(fieldName) : undefined;
      let bucket;
      
      if (fieldType === 'number') {
        bucket = this.getFieldBucket(fieldName, parseFloat(value));
      } else if (fieldType === 'boolean') {
        bucket = value === 'true' || value === true ? 'true' : 'false';
      } else {
        bucket = this.getFieldBucket(fieldName, value.toString());
      }
      
      // Only log if bucket changes
      if (currentValue !== bucket) {
        const currentCount = this.fieldChanges.get(fieldName) || 0;
        this.fieldChanges.set(fieldName, currentCount + 1);
        
        if (!this.fieldLastBuckets) {
          this.fieldLastBuckets = new Map();
        }
        this.fieldLastBuckets.set(fieldName, bucket);

        this.track('field_changed', {
          fieldName,
          fieldType,
          bucket,
          previousBucket: currentValue,
          changeCount: currentCount + 1,
          dogId,
          selectedDate
        });
      }
      
      this.fieldChangeTimeouts.delete(fieldName);
    }, debounceMs));
  }

  trackOptionHover(groupLabel, option, startTime) {
    const duration = Date.now() - startTime;
    
    // Only track if hover duration >= 150ms
    if (duration >= 150) {
      const hoverKey = `${groupLabel}_${option}`;
      const hoverCount = this.optionHovers.get(hoverKey) || 0;
      this.optionHovers.set(hoverKey, hoverCount + 1);

      this.track('option_hover_duration', {
        groupLabel,
        option,
        durationMs: duration,
        hoverCount: hoverCount + 1
      });
    }
  }

  trackOptionSelected(groupLabel, option, previousOption) {
    this.track('option_selected', {
      groupLabel,
      option,
      previousOption,
      timeSinceLoad: Date.now() - this.startTime
    });

    // Also track option change count for this group
    const changeKey = `${groupLabel}_changes`;
    const currentChanges = this.fieldChanges.get(changeKey) || 0;
    this.fieldChanges.set(changeKey, currentChanges + 1);
  }

  trackProgress(progressPercent) {
    const progressJump = Math.abs(progressPercent - this.lastProgress);
    
    if (progressJump >= 10) {
      this.track('progress_snapshot', {
        progressPercent,
        progressJump,
        timeSinceLoad: Date.now() - this.startTime
      });
      this.lastProgress = progressPercent;
    }
  }

  trackSubmit(outcome, additionalData = {}) {
    this.track(`submit_${outcome}`, {
      timeOnPage: Date.now() - this.startTime,
      timeToFirstInteraction: this.firstInteractionTime ? this.firstInteractionTime - this.startTime : null,
      changedFieldsCount: this.fieldChanges.size,
      hoveredOptionsCount: this.optionHovers.size,
      ...additionalData
    });
  }

  trackPageExit(progressPercent, dogSelected, dogId) {
    this.track('page_exit', {
      timeOnPage: Date.now() - this.startTime,
      timeToFirstInteraction: this.firstInteractionTime ? this.firstInteractionTime - this.startTime : null,
      progressPercent,
      changedFieldsCount: this.fieldChanges.size,
      hoveredOptionsCount: this.optionHovers.size,
      dogSelected,
      dogId
    });
  }

  async flush(useBeacon = false) {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const url = '/api/analytics/batch';
      const payload = JSON.stringify({ events });

      if (useBeacon && navigator.sendBeacon) {
        const success = navigator.sendBeacon(url, payload);
        if (!success) {
          throw new Error('sendBeacon failed');
        }
      } else {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: payload
        });

        if (!response.ok) {
          console.warn('Analytics HTTP error:', response.status, response.statusText);
          // Re-queue events on failure with backoff
          setTimeout(() => {
            this.queue.unshift(...events);
          }, 5000);
          return;
        }
      }
      
      console.debug('📊 Analytics flushed successfully:', events.length, 'events');
    } catch (error) {
      console.warn('📊 Analytics flush failed:', error);
      // Re-queue events on error with exponential backoff
      const backoffTime = Math.min(30000, this.queue.length * 1000);
      setTimeout(() => {
        console.debug('📊 Analytics: re-queueing', events.length, 'events after error');
        this.queue.unshift(...events);
      }, backoffTime);
    }
  }

  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Clear any pending field change timeouts
    if (this.fieldChangeTimeouts) {
      this.fieldChangeTimeouts.forEach(timeout => clearTimeout(timeout));
      this.fieldChangeTimeouts.clear();
    }
    
    this.flush(true);
  }
}

// Create singleton instance
const analytics = new AnalyticsTracker();

export default analytics;
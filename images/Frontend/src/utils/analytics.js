// src/utils/analytics.js

class AnalyticsTracker {
  constructor() {
    this.enabled = false;

    this.queue = [];
    this.flushTimer = null;

    this.startTime = Date.now();
    this.firstInteractionTime = null;

    this.fieldChanges = new Map();
    this.optionHovers = new Map();
    this.lastProgress = 0;

    this.userId = null;
    this.sessionId = null;

    this.fieldChangeTimeouts = new Map();
    this.fieldLastBuckets = new Map();

    this._initGlobalListeners();
  }

  // ---- PUBLIC API ----

  /**
   * Start tracking AFTER login.
   * Call this after you receive { userId, sessionId } from backend.
   */
  start(userId, sessionId) {
    if (!userId || !sessionId) {
      console.warn("📊 Analytics: start() requires userId and sessionId");
      return;
    }

    this.enabled = true;
    this.userId = String(userId);
    this.sessionId = String(sessionId);

    // reset per-session timers
    this.startTime = Date.now();
    this.firstInteractionTime = null;
    this.fieldChanges.clear();
    this.optionHovers.clear();
    this.lastProgress = 0;

    // Start periodic flushing
    if (!this.flushTimer) {
      this.flushTimer = setInterval(() => {
        if (this.queue.length > 0) this.flush();
      }, 5000);
    }

    // Track initial page view when tracking starts
    this.track("page_view", {
      route: window.location.pathname,
      referrer: document.referrer || null,
    });

    console.debug("📊 Analytics started:", { userId: this.userId, sessionId: this.sessionId });
  }

  /**
   * End tracking (optional). You still might also call backend /api/sessions/:sessionId.
   */
  stop() {
    this.enabled = false;
    this.flush(true);
  }

  /**
   * Optional helper if you need to update sessionId (e.g. refreshed token/session).
   */
  setSession(sessionId) {
    if (!sessionId) return;
    this.sessionId = String(sessionId);
  }

  /**
   * Track a single event (only works if enabled).
   */
  track(eventName, payload = {}) {
    if (!this.enabled) return;
    if (!this.userId || !this.sessionId) return;

    const event = {
      eventName,
      ...this.getBasePayload(payload.route),
      payload: this.sanitizePayload(payload),
    };

    this.queue.push(event);

    if (this.queue.length >= 10) {
      this.flush();
    }
  }

  // ---- PAGE LIFECYCLE ----

  trackPageView(route = window.location.pathname, extra = {}) {
    this.track("page_view", { route, ...extra });
  }

  trackPageExit(extra = {}) {
    this.track("page_exit", {
      timeOnPageMs: Date.now() - this.startTime,
      timeToFirstInteractionMs: this.firstInteractionTime
        ? this.firstInteractionTime - this.startTime
        : null,
      changedFieldsCount: this.fieldChanges.size,
      hoveredOptionsCount: this.optionHovers.size,
      ...extra,
    });
  }

  // ---- INTERACTION HELPERS ----

  trackFieldChange(fieldName, value, fieldType = "text", debounceMs = 500, extra = {}) {
    if (!this.enabled) return;

    if (this.fieldChangeTimeouts.has(fieldName)) {
      clearTimeout(this.fieldChangeTimeouts.get(fieldName));
    }

    const timeout = setTimeout(() => {
      const currentBucket = this.fieldLastBuckets.get(fieldName);

      let bucket;
      if (fieldType === "number") {
        bucket = this.getFieldBucket(fieldName, Number(value));
      } else if (fieldType === "boolean") {
        bucket = value === true || value === "true" ? "true" : "false";
      } else {
        bucket = this.getFieldBucket(fieldName, String(value));
      }

      if (currentBucket !== bucket) {
        const currentCount = this.fieldChanges.get(fieldName) || 0;
        this.fieldChanges.set(fieldName, currentCount + 1);
        this.fieldLastBuckets.set(fieldName, bucket);

        this.track("field_changed", {
          fieldName,
          fieldType,
          bucket,
          previousBucket: currentBucket,
          changeCount: currentCount + 1,
          ...extra,
        });
      }

      this.fieldChangeTimeouts.delete(fieldName);
    }, debounceMs);

    this.fieldChangeTimeouts.set(fieldName, timeout);
  }

  trackOptionHover(groupLabel, option, startTime) {
    if (!this.enabled) return;

    const duration = Date.now() - startTime;
    if (duration < 150) return;

    const hoverKey = `${groupLabel}_${option}`;
    const hoverCount = this.optionHovers.get(hoverKey) || 0;
    this.optionHovers.set(hoverKey, hoverCount + 1);

    this.track("option_hover_duration", {
      groupLabel,
      option,
      durationMs: duration,
      hoverCount: hoverCount + 1,
    });
  }

  trackOptionSelected(groupLabel, option, previousOption, extra = {}) {
    this.track("option_selected", {
      groupLabel,
      option,
      previousOption,
      timeSinceStartMs: Date.now() - this.startTime,
      ...extra,
    });

    const changeKey = `${groupLabel}_changes`;
    const currentChanges = this.fieldChanges.get(changeKey) || 0;
    this.fieldChanges.set(changeKey, currentChanges + 1);
  }

  trackProgress(progressPercent) {
    const progressJump = Math.abs(progressPercent - this.lastProgress);
    if (progressJump < 10) return;

    this.track("progress_snapshot", {
      progressPercent,
      progressJump,
      timeSinceStartMs: Date.now() - this.startTime,
    });

    this.lastProgress = progressPercent;
  }

  trackSubmit(outcome, extra = {}) {
    this.track(`submit_${outcome}`, {
      timeOnPageMs: Date.now() - this.startTime,
      timeToFirstInteractionMs: this.firstInteractionTime
        ? this.firstInteractionTime - this.startTime
        : null,
      changedFieldsCount: this.fieldChanges.size,
      hoveredOptionsCount: this.optionHovers.size,
      ...extra,
    });
  }

  // ---- INTERNALS ----

  _initGlobalListeners() {
    // First interaction timing
    const events = ["mousedown", "keydown", "touchstart", "scroll"];
    const trackFirstInteraction = () => {
      if (!this.firstInteractionTime) {
        this.firstInteractionTime = Date.now();
        events.forEach((ev) => window.removeEventListener(ev, trackFirstInteraction, true));
      }
    };
    events.forEach((ev) => window.addEventListener(ev, trackFirstInteraction, true));

    // Try to flush on unload (best effort)
    window.addEventListener("beforeunload", () => {
      if (!this.enabled) return;
      this.trackPageExit();
      this.flush(true);
    });
  }

  getBasePayload(routeOverride) {
    return {
      userId: this.userId,
      sessionId: this.sessionId,
      route: routeOverride || window.location.pathname,
      clientTs: Date.now(),
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent.substring(0, 200),
    };
  }

  sanitizePayload(payload) {
    const sanitized = {};

    Object.keys(payload || {}).forEach((key) => {
      const value = payload[key];

      if (typeof value === "string") {
        sanitized[key] = value.substring(0, 200);
      } else if (typeof value === "number" && isFinite(value)) {
        sanitized[key] = value;
      } else if (typeof value === "boolean") {
        sanitized[key] = value;
      } else if (Array.isArray(value)) {
        sanitized[key] = value.slice(0, 20);
      } else if (typeof value === "object" && value !== null) {
        const flattened = {};
        Object.keys(value)
          .slice(0, 10)
          .forEach((subKey) => {
            const subValue = value[subKey];
            if (typeof subValue === "string") flattened[subKey] = subValue.substring(0, 100);
            else if (typeof subValue === "number" && isFinite(subValue)) flattened[subKey] = subValue;
            else if (typeof subValue === "boolean") flattened[subKey] = subValue;
          });
        sanitized[key] = flattened;
      }
    });

    return sanitized;
  }

  getFieldBucket(fieldName, value) {
    const buckets = {
      water: [
        { min: 0, max: 0, label: "0" },
        { min: 1, max: 100, label: "1-100" },
        { min: 101, max: 300, label: "101-300" },
        { min: 301, max: 700, label: "301-700" },
        { min: 701, max: Infinity, label: "700+" },
      ],
      sleepHours: [
        { min: 0, max: 4, label: "0-4" },
        { min: 5, max: 8, label: "5-8" },
        { min: 9, max: 12, label: "9-12" },
        { min: 13, max: Infinity, label: "13+" },
      ],
      walks: [
        { min: 0, max: 0, label: "0" },
        { min: 1, max: 2, label: "1-2" },
        { min: 3, max: 4, label: "3-4" },
        { min: 5, max: Infinity, label: "5+" },
      ],
      playtimeMinutes: [
        { min: 0, max: 0, label: "0" },
        { min: 1, max: 15, label: "1-15" },
        { min: 16, max: 60, label: "16-60" },
        { min: 61, max: Infinity, label: "60+" },
      ],
      aloneHours: [
        { min: 0, max: 2, label: "0-2" },
        { min: 3, max: 6, label: "3-6" },
        { min: 7, max: 12, label: "7-12" },
        { min: 13, max: Infinity, label: "12+" },
      ],
    };

    if (typeof value === "string") {
      const length = value.trim().length;
      if (length === 0) return "0";
      if (length <= 3) return "1-3";
      if (length <= 10) return "4-10";
      return "11+";
    }

    if (typeof value === "number" && buckets[fieldName]) {
      const b = buckets[fieldName].find((x) => value >= x.min && value <= x.max);
      return b ? b.label : "unknown";
    }

    return "unknown";
  }

  async flush(useBeacon = false) {
    if (!this.enabled) return;
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    try {
      const url = "/api/analytics/batch";
      const body = JSON.stringify({ events });

      if (useBeacon && navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon(url, blob);
        return;
      }

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        credentials: "include",
      });

      if (!response.ok) {
        // Requeue on failure
        this.queue.unshift(...events);
      }
    } catch (err) {
      // Requeue on error
      this.queue.unshift(...events);
    }
  }
}

// Singleton instance
const analytics = new AnalyticsTracker();
export default analytics;

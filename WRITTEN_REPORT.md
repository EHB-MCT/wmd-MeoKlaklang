# Written Report – Weapon of Math Destruction

## 1. Goal of the Project

The goal of this project was to create a data-driven application that collects, stores, analyzes, and visualizes user data on an individual level.  
The project is designed as a “Weapon of Math Destruction” by subtly influencing users based on the data collected about their behavior, habits, and interactions.

The application tracks both **user behavior** and **dog-related health data**, combining them into a detailed user profile.  
Based on this profile, the system provides insights, recommendations, alerts, and visual feedback that can influence how users interact with the application and how they make decisions regarding their pets.

This project demonstrates how seemingly harmless data collection can be used to create powerful behavioral influence mechanisms.

---

## 2. Data Collected

The system collects a wide range of data on an individual user level, including:

### User behavior data
- Login sessions (start time, end time, duration)
- Page views per session
- Navigation patterns
- Hovered UI elements
- Clicked buttons and actions
- Frequency of usage
- Time of day activity

### Dog-related data
- Daily logs per dog
- Emotion of the dog (e.g. happy, stressed, anxious)
- Water intake
- Sleep duration
- Number of walks
- Stress or pain signals
- Appetite and behavior

Each data point is linked to a **unique user ID**, ensuring that individual user profiles can be built and analyzed over time.

---

## 3. User Profiling

Each user is assigned a unique identifier (UID) that allows the backend to distinguish users and build persistent profiles.

Using the collected data, the backend constructs a behavioral profile consisting of:
- Activity intensity
- Consistency of usage
- Daily routines
- Emotional patterns of the dog
- Health trends over time
- Interaction preferences (e.g. most hovered options)

This profile is continuously updated and refined as more data is collected, allowing the system to “learn” more about the user over time.

---

## 4. Influence & Nudging

The collected data directly influences the user-facing part of the application in subtle ways:

- Users receive tips and recommendations based on detected patterns  
  (e.g. stress-related advice if stress signals are logged frequently).
- Visual emphasis is placed on certain actions when risky behavior is detected.
- Health alerts encourage users to log more data or take action.
- Analytics dashboards highlight specific trends, drawing attention to certain behaviors.

Although the system does not force decisions, it **nudges users** toward specific actions by selectively presenting information and insights.

---

## 5. Insights & Patterns

Through visualization and analytics, several patterns become visible:
- Usage peaks at specific times of day
- Emotional trends in dogs correlate with changes in routine
- Some users interact far more with specific UI elements
- Users who log consistently receive more detailed feedback
- Gaps in logging often precede negative health indicators

These insights show how raw interaction data can be transformed into meaningful behavioral signals.

---

## 6. Shortcomings & Data Quality

Despite the large amount of collected data, the system has several limitations:

- User input is subjective and can be inaccurate
- Emotional data is self-reported and therefore biased
- Missing data leads to incomplete profiles
- Users may forget to log or intentionally skip entries
- Hover and interaction data does not always reflect intent

This highlights how data-driven systems can appear precise while being built on imperfect or biased data.

---

## 7. Ethical Considerations

This project raises important ethical questions:
- Users may not fully understand how much data is collected
- Behavioral nudging can influence decisions without explicit consent
- Data can be misinterpreted or used to unfairly judge users
- Health-related recommendations could cause anxiety

The project demonstrates how easily data collection can cross ethical boundaries when transparency and limitations are not clearly communicated.

---

## 8. What I Learned

From this project, I learned:
- How to design and implement a full-stack data collection pipeline
- How to store and analyze user-level data responsibly
- How visualization can strongly influence perception
- How flawed data can still lead to strong conclusions
- Why ethical reflection is essential in data-driven systems

This project made me also learn that AI can help you with alot, but AI can also make everything alot more difficuclt and complexer then it already was.

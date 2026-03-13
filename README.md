# Automated SLA Tracking & Slack Alert Integration

**Role:** Automation Specialist & Operations Lead  
**Timeline:** Peak Season 2025  
*(Note: Code has been sanitized. Webhook URLs and spreadsheet IDs are redacted).*

---

## 🚨 The Problem (The Visibility Blindspot)
During the company's highest-volume Peak season, the inbound transportation team lost visibility on critical Service Level Agreements (SLAs). Specifically, the "Must Unload By" (MUB) performance metric crashed to a dangerous **30%**. 

Supervisors and administrators were relying on manual spreadsheet checks to see which trailers were at risk of breaching their SLA. By the time a manager realized a trailer was running late, the SLA was already missed.

## 💡 The Solution (Real-Time Push Notifications)
I engineered an automated alert system that completely removed the need for managers to check spreadsheets, instead pushing critical data directly to them.

* **Automated Polling:** Wrote a Google AppScript that runs on a 1-hour time-based trigger, querying a live Google Sheet database for trailers that are exactly 1, 2, or 3 hours away from missing their SLA.
* **Slack API Integration:** Integrated an incoming Slack Webhook to instantly parse the at-risk data, format it into a clean monospace table, and push the notification directly to the management Slack channel. 

## 🛠 The Tech Stack
* **Languages:** Google AppScript (JavaScript)
* **APIs:** Slack API (Incoming Webhooks)
* **Platforms:** Google Workspace, Slack Enterprise

## 📈 The Business Impact (The ROI)
* **Massive Metric Recovery:** By providing immediate, automated visibility to the floor, we recovered the MUB SLA performance from **30% to a sustained 100%** through the remainder of Peak season.
* **Proactive Management:** Supervisors transitioned from reactively putting out fires to proactively assigning labor to at-risk trailers *before* they breached.
* **Cross-Functional Alignment:** The automated alerts created a single source of truth for supervisors, admins, and operational managers, drastically improving communication across shifts.

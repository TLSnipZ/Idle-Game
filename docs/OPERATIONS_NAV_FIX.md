# Operations navigation mobile fix

The Operations category bar (`Jobs / Businesses / Automation`) is intentionally non-sticky at all viewport widths.

Reason: on narrow mobile screens the previous sticky behavior caused the segmented navigation to float over Business cards while scrolling, obscuring content and fighting with the already-sticky global HUD.

The buttons remain normal in-page jump navigation. This change is presentation-only and does not affect gameplay, save data, economy, automation, or section semantics.

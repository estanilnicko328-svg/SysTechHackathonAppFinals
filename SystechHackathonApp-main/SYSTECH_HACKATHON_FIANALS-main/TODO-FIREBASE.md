# Firebase Logging Integration TODO
Current Progress: 3/7

## Steps:
- [x] 1. Update index.html: Add Firebase SDK CDNs ✓
- [x] 2. Create firebase-config.js with placeholder ✓
- [x] 3. Update app.js: Init Firebase, add Firestore logging for concerns/audit ✓
- [x] 4. Update dashboard.js: Log exports/metrics ✓
- [ ] 5. Add Analytics events
- [ ] 6. Add error handling + offline fallback
- [ ] 7. Test & complete

**Instructions:** 
1. Go to https://console.firebase.google.com → Add project → Web app.
2. Replace config in firebase-config.js.
3. Enable Firestore (test mode), Analytics.

**Expected:** Submit concern → syncs to Firestore 'concerns' collection, audit to 'auditLog'.

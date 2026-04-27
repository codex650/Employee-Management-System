# Frontend QR Scanner & Kiosk Implementation Plan

This document outlines the steps required to implement the frontend components for the QR-based attendance system in the EMS application.

## 1. Required Dependencies
You will need to install the following libraries to handle camera scanning and QR code generation:
```bash
npm install html5-qrcode qrcode.react
```

---

## 2. Component: QR Kiosk (Manager View)
This page will be displayed on a tablet/screen at the office entrance.

### Features:
- **Fetch Logic:** Call `GET /api/attendance/qr-token-generator` to get a fresh JWT.
- **Display:** Render the JWT as a QR code using `qrcode.react`.
- **Auto-Refresh:** Use a `setInterval` (60 seconds) to fetch a new token before the current one expires.
- **Countdown Timer:** Display a "Refreshing in X seconds" visual to let users know the code is live.

### Technical Snippet (Logic):
```javascript
useEffect(() => {
  const fetchToken = async () => {
    const response = await api.get('/attendance/qr-token-generator');
    setQrToken(response.data.qrToken);
  };

  fetchToken();
  const interval = setInterval(fetchToken, 60000); // Refresh every minute
  return () => clearInterval(interval);
}, []);
```

---

## 3. Component: QR Scanner (Employee View)
This component allows employees to use their mobile cameras to clock in/out.

### Features:
- **Camera Access:** Use `html5-qrcode` for a high-performance scanning experience.
- **Validation:** Once a QR code is detected, extract the token and send it to the backend.
- **User Feedback:** Show a success animation (checkmark) or an error message (cross) if the scan fails or the token is expired.

### Integration Flow:
1. User clicks **"Scan to Clock-In"** on their dashboard.
2. A modal/overlay opens with the camera active.
3. User points camera at the office Kiosk.
4. On success:
   ```javascript
   const onScanSuccess = (decodedText) => {
     // decodedText is the qrToken
     api.post('/attendance/clock-in', { qrToken: decodedText });
   };
   ```

---

## 4. Design Guidelines
- **Kiosk:** Should have a clean, high-contrast design. The QR code should be large enough to be scanned from 1-2 meters away.
- **Scanner:** Include a "Guiding Frame" in the camera view to help users center the QR code.
- **Mobile-First:** Ensure the scanner works smoothly on iOS and Android browsers (requires HTTPS).

---

## 5. Security Checklist
- [ ] Ensure the site is running on **HTTPS** (Browser camera APIs require it).
- [ ] Implement a loading state so the employee doesn't accidentally scan twice while the first request is processing.
- [ ] Handle "Permission Denied" errors gracefully by showing instructions on how to enable camera access.

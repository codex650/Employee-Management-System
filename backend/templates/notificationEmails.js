const getAttendanceEmailTemplate = (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: ${data.isLate ? '#f44336' : '#4CAF50'};">
            ${data.isLate ? '⚠️ Late Arrival Alert' : 'Clock-In Notification'}
        </h2>
        <p><strong>Employee:</strong> ${data.employeeName}</p>
        <p><strong>Department:</strong> ${data.department}</p>
        <p><strong>Time:</strong> ${data.time}</p>
        ${data.isLate ? `<p style="color: #f44336;"><strong>Late by:</strong> ${data.lateMinutes} minutes</p>` : ''}
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">This is an automated message from EMS.</p>
    </div>
</body>
</html>
`;

const getLeaveEmailTemplate = (data) => `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
        <h2 style="color: #2196F3;">Leave Request Update</h2>
        <p><strong>Employee:</strong> ${data.employeeName}</p>
        <p><strong>Type:</strong> ${data.leaveType}</p>
        <p><strong>Duration:</strong> ${data.startDate} to ${data.endDate} (${data.days} days)</p>
        <p><strong>Status:</strong> <span style="font-weight: bold; color: ${data.status === 'Approved' ? '#4CAF50' : data.status === 'Rejected' ? '#f44336' : '#FF9800'};">${data.status}</span></p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #777;">This is an automated message from EMS.</p>
    </div>
</body>
</html>
`;

module.exports = {
    getAttendanceEmailTemplate,
    getLeaveEmailTemplate
};

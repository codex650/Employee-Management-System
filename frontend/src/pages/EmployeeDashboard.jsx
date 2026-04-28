import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  FaUser, 
  FaClock, 
  FaCalendarAlt, 
  FaFileAlt, 
  FaSignOutAlt, 
  FaSun, 
  FaMoon, 
  FaBars, 
  FaTimes,
  FaCheckCircle,
  FaTimesCircle,
  FaQrcode
} from 'react-icons/fa';

const EmployeeDashboard = () => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );
  
  // Data states
  const [employeeData, setEmployeeData] = useState(null);
  const [attendanceToday, setAttendanceToday] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [documents, setDocuments] = useState([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Form states
  const [qrToken, setQrToken] = useState('');
  const [attendanceNotes, setAttendanceNotes] = useState('');
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'vacation',
    startDate: '',
    endDate: '',
    reason: '',
    halfDay: false,
    halfDaySession: 'morning'
  });
  const [leaveError, setLeaveError] = useState('');
  const [leaveMessage, setLeaveMessage] = useState('');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch fresh employee data (populated)
      if (user?.employee?._id) {
        const empRes = await api.get(`/employees/${user.employee._id}`);
        setEmployeeData(empRes.data.employee);
      }
      
      const [todayRes, historyRes, balanceRes, requestsRes, docsRes] = await Promise.all([
        api.get('/attendance/my-today').catch(() => ({ data: { clockedIn: false } })),
        api.get('/attendance/my-history').catch(() => ({ data: { history: [] } })),
        api.get('/leaves/balance').catch(() => ({ data: { balance: {} } })),
        api.get('/leaves/my-requests').catch(() => ({ data: { leaves: [] } })),
        api.get('/documents/my-documents').catch(() => ({ data: { documents: [] } }))
      ]);

      setAttendanceToday(todayRes?.data);
      setAttendanceHistory(historyRes?.data?.attendance || []);
      setLeaveBalance(balanceRes?.data?.balance);
      setLeaveRequests(requestsRes?.data?.leaves || []);
      setDocuments(docsRes?.data?.documents || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleClockIn = async (e) => {
    e.preventDefault();
    if (!qrToken) {
      alert('QR Token is required to clock in.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/clock-in', { qrToken, notes: attendanceNotes });
      alert(res.data.message);
      setQrToken('');
      setAttendanceNotes('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Clock in failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async (e) => {
    e.preventDefault();
    if (!qrToken) {
      alert('QR Token is required to clock out.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.post('/attendance/clock-out', { qrToken, notes: attendanceNotes });
      alert(res.data.message);
      setQrToken('');
      setAttendanceNotes('');
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Clock out failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setLeaveError('');
    setLeaveMessage('');
    setActionLoading(true);
    try {
      const res = await api.post('/leaves/request', leaveForm);
      setLeaveMessage(res.data.message);
      setLeaveForm({
        leaveType: 'vacation',
        startDate: '',
        endDate: '',
        reason: '',
        halfDay: false,
        halfDaySession: 'morning'
      });
      // Refresh leaves
      const requestsRes = await api.get('/leaves/my-requests');
      setLeaveRequests(requestsRes.data.leaves || []);
      const balanceRes = await api.get('/leaves/balance');
      setLeaveBalance(balanceRes.data.balance);
    } catch (error) {
      setLeaveError(error.response?.data?.message || 'Leave request failed');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadDoc = async (id, title) => {
    try {
      const response = await api.get(`/documents/${id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', title || 'document');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Download failed');
    }
  };

  // Skeleton Component
  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-slate-800 rounded-none ${className}`}></div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <FaUser /> },
    { id: 'attendance', name: 'Attendance', icon: <FaClock /> },
    { id: 'leaves', name: 'Leaves', icon: <FaCalendarAlt /> },
    { id: 'documents', name: 'Documents', icon: <FaFileAlt /> },
  ];

  return (
    <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-50 text-slate-800'}`}>
      
      {/* Mobile Sidebar Toggle */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="bg-blue-600 text-white p-4 rounded-none shadow-lg hover:bg-blue-700 transition-all duration-200"
        >
          {isSidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-auto border-r
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isDarkMode 
          ? 'bg-slate-950 text-slate-100 border-slate-800' 
          : 'bg-white text-slate-800 border-gray-200'}
      `}>
        <div className={`h-20 flex items-center justify-center border-b px-6 ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
          <span className="text-xl font-bold tracking-wider text-blue-600 dark:text-blue-400">
            EMS <span className="text-orange-500">PORTAL</span>
          </span>
        </div>
        
        <nav className="mt-6 px-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setCurrentTab(tab.id);
                setIsSidebarOpen(false);
              }}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-none text-sm font-medium transition-all duration-200
                ${currentTab === tab.id 
                  ? 'bg-blue-600 text-white border-l-4 border-orange-500' 
                  : isDarkMode 
                    ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-100' 
                    : 'text-slate-600 hover:bg-gray-100 hover:text-slate-800'}
              `}
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>

        <div className={`absolute bottom-6 w-full px-4 border-t pt-6 ${isDarkMode ? 'border-slate-800' : 'border-gray-200'}`}>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-none text-sm font-medium border transition-all ${
              isDarkMode 
                ? 'border-slate-800 hover:bg-slate-900 text-slate-300' 
                : 'border-gray-200 hover:bg-gray-100 text-slate-600'
            }`}
          >
            {isDarkMode ? <FaSun className="text-orange-400" /> : <FaMoon className="text-blue-600" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          
          <button
            onClick={logout}
            className="w-full mt-2 flex items-center justify-center space-x-2 px-4 py-2 rounded-none text-sm font-medium bg-red-600 hover:bg-red-700 text-white transition-all"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>


      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 transition-colors">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 capitalize">
            {currentTab}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400 hidden sm:block">
              {user?.email}
            </span>
            <div className="h-10 w-10 bg-blue-600 text-white flex items-center justify-center font-bold text-lg rounded-none">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {loading ? (
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          ) : (
            <>
              {/* OVERVIEW TAB */}
              {currentTab === 'overview' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 shadow-sm border-l-4 border-l-blue-600 transition-all duration-300">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                      Welcome back, <span className="text-orange-500">{employeeData?.firstName || 'Employee'}!</span>
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">
                      Access your portal features using the sidebar navigation.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Personal Info */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800">
                      <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 border-b pb-2 border-gray-100 dark:border-slate-800">
                        Profile Details
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="font-medium text-slate-500">First Name:</span> <span>{employeeData?.firstName}</span></div>
                        <div className="flex justify-between"><span className="font-medium text-slate-500">Last Name:</span> <span>{employeeData?.lastName}</span></div>
                        <div className="flex justify-between"><span className="font-medium text-slate-500">Email:</span> <span>{employeeData?.email}</span></div>
                        <div className="flex justify-between"><span className="font-medium text-slate-500">Phone:</span> <span>{employeeData?.phone || 'N/A'}</span></div>
                      </div>
                    </div>

                    {/* Employment Info */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800">
                      <h4 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 border-b pb-2 border-gray-100 dark:border-slate-800">
                        Employment Details
                      </h4>
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between"><span className="font-medium text-slate-500">Department:</span> <span>{employeeData?.department?.name || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="font-medium text-slate-500">Position:</span> <span>{employeeData?.position?.name || 'N/A'}</span></div>
                        <div className="flex justify-between"><span className="font-medium text-slate-500">Status:</span> <span className="text-green-500 capitalize">{employeeData?.status}</span></div>
                        <div className="flex justify-between">
                          <span className="font-medium text-slate-500">Hire Date:</span> 
                          <span>{employeeData?.hireDate ? new Date(employeeData.hireDate).toLocaleDateString() : 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ATTENDANCE TAB */}
              {currentTab === 'attendance' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Today's Clock In/Out</h3>
                    
                    {attendanceToday?.attendance ? (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
                        <div>
                          <p className="text-sm text-slate-500">Status: <span className="font-bold text-orange-500 capitalize">{attendanceToday.attendance.status}</span></p>
                          <p className="text-sm text-slate-500">Clocked In: <span className="font-medium text-slate-800 dark:text-slate-100">{new Date(attendanceToday.attendance.clockIn).toLocaleTimeString()}</span></p>
                          {attendanceToday.attendance.clockOut && (
                            <p className="text-sm text-slate-500">Clocked Out: <span className="font-medium text-slate-800 dark:text-slate-100">{new Date(attendanceToday.attendance.clockOut).toLocaleTimeString()}</span></p>
                          )}
                        </div>
                        <div className="mt-4 sm:mt-0 flex items-center text-green-500 font-medium">
                          <FaCheckCircle className="mr-2" /> 
                          {attendanceToday.clockedOut ? 'Completed for today' : 'Clocked In'}
                        </div>
                      </div>
                    ) : (
                      <p className="text-slate-500 text-sm mb-4">You have not clocked in yet today.</p>
                    )}

                    {/* Clock In / Out Action Form */}
                    {(!attendanceToday?.clockedOut) && (
                      <form className="mt-6 space-y-4 max-w-md" onSubmit={attendanceToday?.clockedIn ? handleClockOut : handleClockIn}>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center">
                            <FaQrcode className="mr-2 text-orange-500" /> QR Code Token
                          </label>
                          <input
                            type="text"
                            value={qrToken}
                            onChange={(e) => setQrToken(e.target.value)}
                            placeholder="Enter 6-digit or generated token"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                          <textarea
                            value={attendanceNotes}
                            onChange={(e) => setAttendanceNotes(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none focus:ring-2 focus:ring-blue-500 outline-none"
                            rows="2"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className={`w-full py-2 font-semibold rounded-none text-white transition-all ${attendanceToday?.clockedIn ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'} disabled:bg-slate-500`}
                        >
                          {actionLoading ? 'Processing...' : attendanceToday?.clockedIn ? 'Clock Out' : 'Clock In'}
                        </button>
                      </form>
                    )}
                  </div>

                  {/* Attendance History */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-none border border-gray-200 dark:border-slate-800 overflow-x-auto">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Attendance History</h3>
                    <table className="w-full text-left border-collapse min-w-[600px] text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Clock In</th>
                          <th className="py-3 px-4">Clock Out</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendanceHistory.length === 0 ? (
                          <tr><td colSpan="5" className="py-4 text-center text-slate-500">No attendance history found.</td></tr>
                        ) : (
                          attendanceHistory.map((record) => (
                            <tr key={record._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                              <td className="py-3 px-4">{new Date(record.date).toLocaleDateString()}</td>
                              <td className="py-3 px-4">{new Date(record.clockIn).toLocaleTimeString()}</td>
                              <td className="py-3 px-4">{record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : 'N/A'}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 text-xs font-semibold rounded-none ${record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                  {record.status}
                                </span>
                              </td>
                              <td className="py-3 px-4">{record.totalHours ? `${record.totalHours}h` : 'N/A'}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* LEAVES TAB */}
              {currentTab === 'leaves' && (
                <div className="space-y-6">
                  {/* Leave Balances */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {leaveBalance && Object.entries(leaveBalance).map(([type, pool]) => (
                      <div key={type} className="bg-white dark:bg-slate-900 p-4 border border-gray-200 dark:border-slate-800 rounded-none shadow-sm text-center">
                        <span className="text-xs uppercase font-bold text-slate-500 tracking-wider">{type}</span>
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{pool.total ? (pool.total - pool.used - pool.pending) : '∞'}</div>
                        <span className="text-[10px] text-slate-400">Days Available</span>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Apply Form */}
                    <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none md:col-span-1 h-fit">
                      <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Request Leave</h3>
                      
                      {leaveError && <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-xs">{leaveError}</div>}
                      {leaveMessage && <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 text-xs">{leaveMessage}</div>}

                      <form className="space-y-4" onSubmit={handleLeaveSubmit}>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Leave Type</label>
                          <select
                            value={leaveForm.leaveType}
                            onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none text-sm"
                          >
                            <option value="vacation">Vacation</option>
                            <option value="sick">Sick</option>
                            <option value="personal">Personal</option>
                            <option value="unpaid">Unpaid</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
                            <input
                              type="date"
                              value={leaveForm.startDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
                            <input
                              type="date"
                              value={leaveForm.endDate}
                              onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none text-sm"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Reason</label>
                          <textarea
                            value={leaveForm.reason}
                            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none text-sm"
                            rows="2"
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={actionLoading}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-none transition-all disabled:bg-slate-500 text-sm"
                        >
                          {actionLoading ? 'Submitting...' : 'Submit Request'}
                        </button>
                      </form>
                    </div>

                    {/* Leave History */}
                    <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none md:col-span-2 overflow-x-auto">
                      <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Leave Requests</h3>
                      <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                            <th className="py-3 px-4">Type</th>
                            <th className="py-3 px-4">Dates</th>
                            <th className="py-3 px-4">Days</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {leaveRequests.length === 0 ? (
                            <tr><td colSpan="4" className="py-4 text-center text-slate-500">No leave requests found.</td></tr>
                          ) : (
                            leaveRequests.map((leave) => (
                              <tr key={leave._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                <td className="py-3 px-4 capitalize">{leave.leaveType}</td>
                                <td className="py-3 px-4 text-xs">
                                  {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                                </td>
                                <td className="py-3 px-4">{leave.daysRequested}</td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-1 text-xs font-semibold rounded-none ${
                                    leave.status === 'approved' ? 'bg-green-100 text-green-800' : 
                                    leave.status === 'pending' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                                  }`}>
                                    {leave.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB */}
              {currentTab === 'documents' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">My Documents</h3>
                    
                    {documents.length === 0 ? (
                      <p className="text-slate-500 text-sm">No documents assigned or uploaded for you.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {documents.map((doc) => (
                          <div key={doc._id} className="p-4 border border-gray-200 dark:border-slate-800 rounded-none flex flex-col justify-between bg-gray-50 dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all">
                            <div>
                              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-2">
                                <FaFileAlt />
                                <span className="font-bold text-sm truncate">{doc.title}</span>
                              </div>
                              <p className="text-xs text-slate-500 capitalize">Category: {doc.category}</p>
                              <p className="text-xs text-slate-400 mt-1 truncate">{doc.description || 'No description provided.'}</p>
                            </div>
                            <button
                              onClick={() => downloadDoc(doc._id, doc.title)}
                              className="mt-4 w-full py-1.5 border border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-400 dark:hover:text-slate-900 text-xs font-medium rounded-none transition-all"
                            >
                              Download File
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default EmployeeDashboard;


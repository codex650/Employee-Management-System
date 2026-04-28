import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  FaUsers, 
  FaClock, 
  FaCalendarAlt, 
  FaMoneyCheckAlt, 
  FaSignOutAlt, 
  FaSun, 
  FaMoon, 
  FaBars, 
  FaTimes,
  FaCheck,
  FaBan,
  FaQrcode,
  FaPlus,
  FaChartPie
} from 'react-icons/fa';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [currentTab, setCurrentTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );
  
  // Data states
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [designations, setDesignations] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    pendingLeaves: 0
  });

  // Action states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [qrToken, setQrToken] = useState('');
  const [qrExpiresIn, setQrExpiresIn] = useState(null);

  // Form states
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    hireDate: '',
    salary: ''
  });
  const [payrollForm, setPayrollForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

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
      const [empRes, deptRes, desigRes, attRes, leavesRes] = await Promise.all([
        api.get('/employees').catch(() => ({ data: { employees: [] } })),
        api.get('/departments').catch(() => ({ data: { departments: [] } })),
        api.get('/designations').catch(() => ({ data: { designations: [] } })),
        api.get('/attendance/all').catch(() => ({ data: { attendance: [] } })),
        api.get('/leaves/pending').catch(() => ({ data: { leaves: [] } }))
      ]);

      const empList = empRes.data.employees || [];
      const deptList = deptRes.data.departments || [];
      const desigList = desigRes.data.designations || [];
      const attList = attRes.data.attendance || [];
      const leavesList = leavesRes.data.leaves || [];

      setEmployees(empList);
      setDepartments(deptList);
      setDesignations(desigList);
      setAttendance(attList);
      setPendingLeaves(leavesList);

      // Simple stats calculations
      const today = new Date().toISOString().split('T')[0];
      const presentCount = attList.filter(a => 
        new Date(a.date).toISOString().split('T')[0] === today
      ).length;

      setStats({
        totalEmployees: empList.length,
        presentToday: presentCount,
        pendingLeaves: leavesList.length
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/employees', employeeForm);
      alert(res.data.message || 'Employee added successfully');
      setEmployeeForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        department: '',
        position: '',
        hireDate: '',
        salary: ''
      });
      fetchData(); // Refresh list
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.errors?.join(', ') || 'Failed to add employee';
      alert(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveDecision = async (id, decision, reason = '') => {
    setActionLoading(true);
    try {
      const endpoint = `/leaves/${id}/${decision}`;
      const payload = decision === 'reject' ? { reason: reason || 'Not approved' } : {};
      const res = await api.put(endpoint, payload);
      alert(res.data.message || `Leave ${decision}ed successfully`);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const generateQR = async () => {
    setActionLoading(true);
    try {
      const res = await api.get('/attendance/qr-token-generator');
      setQrToken(res.data.qrToken);
      setQrExpiresIn(res.data.expiresIn);
    } catch (error) {
      alert(error.response?.data?.message || 'QR generation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRunPayroll = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.post('/salary/payroll/generate', payrollForm);
      alert(res.data.message || 'Payroll generated successfully');
    } catch (error) {
      alert(error.response?.data?.message || 'Payroll generation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 dark:bg-slate-800 rounded-none ${className}`}></div>
  );

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <FaChartPie /> },
    { id: 'employees', name: 'Employees', icon: <FaUsers /> },
    { id: 'attendance', name: 'Attendance', icon: <FaClock /> },
    { id: 'leaves', name: 'Leaves', icon: <FaCalendarAlt /> },
    { id: 'payroll', name: 'Payroll', icon: <FaMoneyCheckAlt /> },
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
            EMS <span className="text-orange-500">ADMIN</span>
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
              A
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 border-l-4 border-l-blue-600 border-y border-r border-gray-200 dark:border-slate-800 rounded-none shadow-sm text-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Employees</span>
                      <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.totalEmployees}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 border-l-4 border-l-orange-500 border-y border-r border-gray-200 dark:border-slate-800 rounded-none shadow-sm text-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Present Today</span>
                      <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.presentToday}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 border-l-4 border-l-red-500 border-y border-r border-gray-200 dark:border-slate-800 rounded-none shadow-sm text-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Leaves</span>
                      <div className="text-3xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stats.pendingLeaves}</div>
                    </div>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Quick Links</h3>
                    <div className="flex flex-wrap gap-4">
                      <button onClick={() => setCurrentTab('employees')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-none">Manage Employees</button>
                      <button onClick={() => setCurrentTab('leaves')} className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-none">Review Requests</button>
                    </div>
                  </div>
                </div>
              )}

              {/* EMPLOYEES TAB */}
              {currentTab === 'employees' && (
                <div className="space-y-6">
                  {/* Add Employee Form */}
                  <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                      <FaPlus className="mr-2 text-xs" /> Add New Employee
                    </h3>
                    <form className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm" onSubmit={handleAddEmployee}>
                      <input
                        type="text"
                        placeholder="First Name"
                        value={employeeForm.firstName}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, firstName: e.target.value })}
                        className="p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Last Name"
                        value={employeeForm.lastName}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                        className="p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <input
                        type="email"
                        placeholder="Email Address"
                        value={employeeForm.email}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                        className="p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Phone (Optional)"
                        value={employeeForm.phone}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                        className="p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={employeeForm.department}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                        className="p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none"
                        required
                      >
                        <option value="">Select Department</option>
                        {departments.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                      <select
                        value={employeeForm.position}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                        className="p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none"
                        required
                      >
                        <option value="">Select Position</option>
                        {designations.map(d => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                      <input
                        type="date"
                        value={employeeForm.hireDate}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, hireDate: e.target.value })}
                        className="p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none"
                        required
                      />
                      <input
                        type="number"
                        placeholder="Base Salary"
                        value={employeeForm.salary}
                        onChange={(e) => setEmployeeForm({ ...employeeForm, salary: e.target.value })}
                        className="p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="p-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-none transition-all disabled:bg-slate-500"
                      >
                        {actionLoading ? 'Saving...' : 'Add Employee'}
                      </button>
                    </form>
                  </div>

                  {/* Employees List */}
                  <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none overflow-x-auto">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Employee Roster</h3>
                    <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                          <th className="py-3 px-4">Name</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Department</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {employees.map((emp) => (
                          <tr key={emp._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-medium">{emp.firstName} {emp.lastName}</td>
                            <td className="py-3 px-4 text-slate-500">{emp.email}</td>
                            <td className="py-3 px-4">{emp.department?.name || 'N/A'}</td>
                            <td className="py-3 px-4">{emp.position?.name || 'N/A'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-none ${emp.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
                                {emp.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ATTENDANCE TAB */}
              {currentTab === 'attendance' && (
                <div className="space-y-6">
                  {/* QR Generator */}
                  <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4 flex items-center">
                      <FaQrcode className="mr-2" /> Kiosk QR Token Generator
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                      <button
                        onClick={generateQR}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-none"
                      >
                        Generate New Token
                      </button>
                      {qrToken && (
                        <div className="p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 w-full break-all text-xs font-mono select-all">
                          <p className="text-orange-500 font-bold mb-1">Copy for portal entry:</p>
                          {qrToken}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Attendance Logs */}
                  <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none overflow-x-auto">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">All Attendance Logs</h3>
                    <table className="w-full text-left border-collapse text-sm min-w-[700px]">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4">Clock In</th>
                          <th className="py-3 px-4">Clock Out</th>
                          <th className="py-3 px-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((att) => (
                          <tr key={att._id} className="border-b border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/50">
                            <td className="py-3 px-4 font-medium">{att.employeeId?.firstName} {att.employeeId?.lastName}</td>
                            <td className="py-3 px-4">{new Date(att.date).toLocaleDateString()}</td>
                            <td className="py-3 px-4">{new Date(att.clockIn).toLocaleTimeString()}</td>
                            <td className="py-3 px-4">{att.clockOut ? new Date(att.clockOut).toLocaleTimeString() : 'In Progress'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-0.5 text-xs font-semibold rounded-none ${att.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                {att.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* LEAVES TAB */}
              {currentTab === 'leaves' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none overflow-x-auto">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Pending Leave Requests</h3>
                    <table className="w-full text-left border-collapse text-sm min-w-[600px]">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800">
                          <th className="py-3 px-4">Employee</th>
                          <th className="py-3 px-4">Type</th>
                          <th className="py-3 px-4">Days</th>
                          <th className="py-3 px-4">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingLeaves.length === 0 ? (
                          <tr><td colSpan="4" className="py-4 text-center text-slate-500">No pending leave requests.</td></tr>
                        ) : (
                          pendingLeaves.map((leave) => (
                            <tr key={leave._id} className="border-b border-gray-100 dark:border-slate-800">
                              <td className="py-3 px-4 font-medium">{leave.employeeId?.firstName} {leave.employeeId?.lastName}</td>
                              <td className="py-3 px-4 capitalize">{leave.leaveType}</td>
                              <td className="py-3 px-4">{leave.daysRequested}</td>
                              <td className="py-3 px-4 flex items-center space-x-2">
                                <button
                                  onClick={() => handleLeaveDecision(leave._id, 'approve')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded-none flex items-center text-xs"
                                >
                                  <FaCheck className="mr-1" /> Approve
                                </button>
                                <button
                                  onClick={() => handleLeaveDecision(leave._id, 'reject')}
                                  disabled={actionLoading}
                                  className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-none flex items-center text-xs"
                                >
                                  <FaBan className="mr-1" /> Reject
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* PAYROLL TAB */}
              {currentTab === 'payroll' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 border border-gray-200 dark:border-slate-800 rounded-none max-w-md">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-4">Run Monthly Payroll</h3>
                    <form className="space-y-4 text-sm" onSubmit={handleRunPayroll}>
                      <div>
                        <label className="block text-slate-500 mb-1">Month (1-12)</label>
                        <input
                          type="number"
                          min="1"
                          max="12"
                          value={payrollForm.month}
                          onChange={(e) => setPayrollForm({ ...payrollForm, month: parseInt(e.target.value) })}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 mb-1">Year</label>
                        <input
                          type="number"
                          min="2000"
                          value={payrollForm.year}
                          onChange={(e) => setPayrollForm({ ...payrollForm, year: parseInt(e.target.value) })}
                          className="w-full p-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-none"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={actionLoading}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-none disabled:bg-slate-500 transition-all"
                      >
                        {actionLoading ? 'Running Payroll Engine...' : 'Generate Payroll'}
                      </button>
                    </form>
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

export default AdminDashboard;

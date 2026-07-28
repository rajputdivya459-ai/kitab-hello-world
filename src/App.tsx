import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SessionProvider } from "@/auth/SessionProvider";
import { RoleSwitcher } from "@/auth/RoleSwitcher";
import { ScrollToTop } from "@/components/ScrollToTop";


// Public Pages
import Index from "./pages/Index";
import Departments from "./pages/Departments";
import Faculty from "./pages/Faculty";
import Events from "./pages/Events";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminFaculty from "./pages/admin/AdminFaculty";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminGallery from "./pages/admin/AdminGallery";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminStats from "./pages/admin/AdminStats";
import AdminHomepage from "./pages/admin/AdminHomepage";
import AdminAbout from "./pages/admin/AdminAbout";
import AdminSocialLinks from "./pages/admin/AdminSocialLinks";
import AdminExploreVideos from "./pages/admin/AdminExploreVideos";
import AdminPrograms from "./pages/admin/AdminPrograms";
import AdminFinance from "./pages/admin/AdminFinance";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminCourseStructure from "./pages/admin/AdminCourseStructure";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminDefaulters from "./pages/admin/AdminDefaulters";
import AdminAttendance from "./pages/admin/AdminAttendance";
import AdminExams from "./pages/admin/AdminExams";
import AdminResults from "./pages/admin/AdminResults";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminNotices from "./pages/admin/AdminNotices";
import AdminHomework from "./pages/admin/AdminHomework";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminStaff from "./pages/admin/AdminStaff";
import AdminTeacherAssignments from "./pages/admin/AdminTeacherAssignments";
import AdminStaffAttendance from "./pages/admin/AdminStaffAttendance";
import AdminTransport from "./pages/admin/AdminTransport";
import AdminIdCards from "./pages/admin/AdminIdCards";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminLeaves from "./pages/admin/AdminLeaves";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminInquiries from "./pages/admin/AdminInquiries";
import AdminVisitors from "./pages/admin/AdminVisitors";
import AdminReminders from "./pages/admin/AdminReminders";
import AdminIdentity from "./pages/admin/AdminIdentity";
import AdminApprovals from "./pages/admin/AdminApprovals";
import AdminAuditLog from "./pages/admin/AdminAuditLog";
import AdminStudentRequests from "./pages/admin/AdminStudentRequests";
import AdminFinanceRequests from "./pages/admin/AdminFinanceRequests";
import AdminTimetable from "./pages/admin/AdminTimetable";
import AdminExamScheduler from "./pages/admin/AdminExamScheduler";
import StudentTimetable from "./pages/student/StudentTimetable";
import StudentExams from "./pages/student/StudentExams";
import ParentTimetable from "./pages/parent/ParentTimetable";
import ParentExams from "./pages/parent/ParentExams";
import TeacherTimetable from "./pages/teacher/TeacherTimetable";
import TeacherInvigilation from "./pages/teacher/TeacherInvigilation";
import PrincipalDashboard from "./pages/principal/PrincipalDashboard";
import AccountantDashboard from "./pages/accountant/AccountantDashboard";
import StaffDashboardPage from "./pages/staff/StaffDashboard";


import ParentTransport from "./pages/parent/ParentTransport";
import ParentLogin from "./pages/parent/ParentLogin";
import ParentShell from "./layouts/ParentShell";
import ParentDashboard from "./pages/parent/ParentDashboard";
import ParentFees from "./pages/parent/ParentFees";
import ParentReceipts from "./pages/parent/ParentReceipts";
import ParentAttendance from "./pages/parent/ParentAttendance";
import ParentResults from "./pages/parent/ParentResults";
import ParentNotices from "./pages/parent/ParentNotices";
import StudentLogin from "./pages/student/StudentLogin";
import StudentShell from "./layouts/StudentShell";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAttendance from "./pages/student/StudentAttendance";
import StudentFees from "./pages/student/StudentFees";
import StudentResults from "./pages/student/StudentResults";
import StudentNotices from "./pages/student/StudentNotices";
import TeacherLogin from "./pages/teacher/TeacherLogin";
import TeacherShell from "./layouts/TeacherShell";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherClasses from "./pages/teacher/TeacherClasses";
import TeacherAttendance from "./pages/teacher/TeacherAttendance";
import TeacherMarks from "./pages/teacher/TeacherMarks";
import TeacherHomework from "./pages/teacher/TeacherHomework";
import TeacherNotices from "./pages/teacher/TeacherNotices";
import TeacherProfile from "./pages/teacher/TeacherProfile";
import { RequireRole } from "@/components/RequireRole";
import { RequirePermission } from "@/components/RequirePermission";
import type { Action } from "@/lib/permissions";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import Login from "./pages/Login";
import MyProfile from "./pages/profile/MyProfile";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <SessionProvider>
        <SiteSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>

            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<Index />} />
              <Route path="/departments" element={<Departments />} />
              <Route path="/faculty" element={<Faculty />} />
              <Route path="/events" element={<Events />} />
              <Route path="/gallery" element={<Gallery />} />
              <Route path="/contact" element={<Contact />} />

              {/* Unified Login (with developer quick access panel) */}
              <Route path="/login" element={<Login />} />

              {/* Admin Routes */}
              <Route path="/admin" element={<AdminLogin />} />

              {([
                ['dashboard', <Dashboard />, 'dashboard.read'],
                ['settings', <AdminSettings />, 'settings.write'],
                ['stats', <AdminStats />, 'website.write'],
                ['homepage', <AdminHomepage />, 'website.write'],
                ['about', <AdminAbout />, 'website.write'],
                ['departments', <AdminDepartments />, 'website.write'],
                ['members', <AdminMembers />, 'website.write'],
                ['faculty', <AdminFaculty />, 'website.write'],
                ['events', <AdminEvents />, 'website.write'],
                ['gallery', <AdminGallery />, 'website.write'],
                ['social-links', <AdminSocialLinks />, 'website.write'],
                ['explore-videos', <AdminExploreVideos />, 'website.write'],
                ['programs', <AdminPrograms />, 'website.write'],
                ['finance', <AdminFinance />, 'finance.read'],
                ['analytics', <AdminAnalytics />, 'analytics.read'],
                ['course-structure', <AdminCourseStructure />, 'settings.write'],
                ['students', <AdminStudents />, 'students.read'],
                ['defaulters', <AdminDefaulters />, 'defaulters.read'],
                ['attendance', <AdminAttendance />, 'attendance.read'],
                ['exams', <AdminExams />, 'exams.read'],
                ['results', <AdminResults />, 'results.read'],
                ['notifications', <AdminNotifications />, 'notifications.read'],
                ['notices', <AdminNotices />, 'notices.read'],
                ['homework', <AdminHomework />, 'homework.read'],
                ['announcements', <AdminAnnouncements />, 'notices.write'],
                ['staff', <AdminStaff />, 'staff.read'],
                ['teacher-assignments', <AdminTeacherAssignments />, 'staff.write'],
                ['staff-attendance', <AdminStaffAttendance />, 'attendance.read'],
                ['messages', <AdminMessages />, 'messages.read'],
                ['transport', <AdminTransport />, 'transport.read'],
                ['id-cards', <AdminIdCards />, 'idcards.read'],
                ['certificates', <AdminCertificates />, 'certificates.read'],
                ['leaves', <AdminLeaves />, 'leaves.read'],
                ['calendar', <AdminCalendar />, 'calendar.read'],
                ['inquiries', <AdminInquiries />, 'inquiries.read'],
                ['visitors', <AdminVisitors />, 'visitors.read'],
                ['reminders', <AdminReminders />, 'reminders.read'],
                ['identity', <AdminIdentity />, 'identity.read'],
                ['approvals', <AdminApprovals />, 'approvals.read'],
                ['audit-log', <AdminAuditLog />, 'audit.read'],
                ['student-requests', <AdminStudentRequests />, 'students.write'],
                ['finance-requests', <AdminFinanceRequests />, 'finance.write'],
                ['timetable', <AdminTimetable />, 'timetable.read'],
                ['profile', <MyProfile />, 'dashboard.read'],
              ] as Array<[string, JSX.Element, Action]>).map(([path, element, action]) => (
                <Route key={path} path={`/admin/${path}`} element={<RequirePermission action={action}>{element}</RequirePermission>} />
              ))}

              {/* Role-specific dashboards & profiles (share admin layout, role-specific sidebar) */}
              <Route path="/principal/dashboard" element={<RequirePermission action="dashboard.read"><PrincipalDashboard /></RequirePermission>} />
              <Route path="/principal/profile"   element={<RequirePermission action="dashboard.read"><MyProfile /></RequirePermission>} />
              <Route path="/accountant/dashboard" element={<RequirePermission action="dashboard.read"><AccountantDashboard /></RequirePermission>} />
              <Route path="/accountant/profile"   element={<RequirePermission action="dashboard.read"><MyProfile /></RequirePermission>} />
              <Route path="/staff/dashboard" element={<RequirePermission action="dashboard.read"><StaffDashboardPage /></RequirePermission>} />
              <Route path="/staff/profile"   element={<RequirePermission action="dashboard.read"><MyProfile /></RequirePermission>} />




              {/* Parent Portal */}
              <Route path="/parent/login" element={<ParentLogin />} />
              <Route path="/parent" element={<ParentShell />}>
                <Route path="dashboard" element={<ParentDashboard />} />
                <Route path="fees" element={<ParentFees />} />
                <Route path="receipts" element={<ParentReceipts />} />
                <Route path="attendance" element={<ParentAttendance />} />
                <Route path="results" element={<ParentResults />} />
                <Route path="notices" element={<ParentNotices />} />
                <Route path="transport" element={<ParentTransport />} />
                <Route path="timetable" element={<ParentTimetable />} />
                <Route path="profile" element={<MyProfile />} />
              </Route>

              {/* Student Portal */}
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student" element={<StudentShell />}>
                <Route path="dashboard" element={<StudentDashboard />} />
                <Route path="attendance" element={<StudentAttendance />} />
                <Route path="fees" element={<StudentFees />} />
                <Route path="results" element={<StudentResults />} />
                <Route path="timetable" element={<StudentTimetable />} />
                <Route path="notices" element={<StudentNotices />} />
                <Route path="profile" element={<MyProfile />} />
              </Route>

              {/* Teacher Portal */}
              <Route path="/teacher/login" element={<TeacherLogin />} />
              <Route path="/teacher" element={<TeacherShell />}>
                <Route path="dashboard" element={<TeacherDashboard />} />
                <Route path="classes" element={<TeacherClasses />} />
                <Route path="timetable" element={<TeacherTimetable />} />
                <Route path="attendance" element={<TeacherAttendance />} />
                <Route path="marks" element={<TeacherMarks />} />
                <Route path="homework" element={<TeacherHomework />} />
                <Route path="notices" element={<TeacherNotices />} />
                <Route path="profile" element={<TeacherProfile />} />
                <Route path="my-profile" element={<MyProfile />} />
              </Route>


              <Route path="*" element={<NotFound />} />
            </Routes>
            <RoleSwitcher />
          </BrowserRouter>
          </TooltipProvider>
        </SiteSettingsProvider>
      </SessionProvider>
    </AuthProvider>
  </QueryClientProvider>
);


export default App;

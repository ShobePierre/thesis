import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";
import AnnouncementComposer from "./components/AnnouncementComposer";
import AnnouncementsList from "./components/AnnouncementsList";
import ActivityBuilder from "./components/ActivityBuilder";
import CodeBlockSubmissionViewer from "../../components/CodeBlockSubmissionViewer";
import QuizSubmissionViewer from "../../components/QuizSubmissionViewer";
import SimPCSubmissionViewer from "../../components/SimPCSubmissionViewer";
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CanvasEditor from "../../activities/Experiment/CanvasEditor";

function SubClass() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isAnnouncementOpen, setIsAnnouncementOpen] = useState(false);
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [instructorName] = useState(
    () => localStorage.getItem("username") || "Instructor"
  );
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [students, setStudents] = useState([]);
    const [notificationsList, setNotificationsList] = useState([]);
  const [isEditingActivity, setIsEditingActivity] = useState(false);
  const [editingActivityData, setEditingActivityData] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [subjectData, setSubjectData] = useState(null);
  const [loadingSubject, setLoadingSubject] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [openDateTime, setOpenDateTime] = useState("");
  const [dueDateTime, setDueDateTime] = useState("");
  // timeLimit removed — per UX decision no per-activity time limit
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [isCreatingActivity, setIsCreatingActivity] = useState(false);
  const createMenuRef = useRef(null);
  const photoVideoInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const editFileInputRef = useRef(null);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [editingText, setEditingText] = useState("");
  const [editingAttachments, setEditingAttachments] = useState([]);
  const [activeTab, setActiveTab] = useState(() => location.state?.initialTab || "announcements");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [activeActivityTab, setActiveActivityTab] = useState("instructions");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentGrade, setStudentGrade] = useState("");
  const [studentSubmissions, setStudentSubmissions] = useState({});
  const [studentFeedback, setStudentFeedback] = useState("");
  const [linkedQuizIdForGrading, setLinkedQuizIdForGrading] = useState(null);
  const [canvasEditorOpen, setCanvasEditorOpen] = useState(false);
  const [canvasEditorData, setCanvasEditorData] = useState(null);
  // Base API path (server is mounted under /api)
  const API_BASE_URL = "http://localhost:5000/api";

  // Derived counts for UI
  const turnedInCount = Object.keys(studentSubmissions || {}).length;
  const gradedCount = Object.values(studentSubmissions || {}).filter(
    (s) => s && s.grade !== null && s.grade !== undefined
  ).length;

  const classInfo = useMemo(() => {
    const defaults = {
      id: Date.now(),
      className: "Untitled Class",
      section: "Section details",
      subject: "Subject",
      code: Math.random().toString(36).slice(2, 8).toUpperCase(),
    };
    const localData = { ...defaults, ...(location.state?.classData || {}) };
    
    // Merge with API data if available (API data takes priority)
    if (subjectData) {
      return {
        ...localData,
        subject_id: subjectData.subject_id,
        instructor_id: subjectData.instructor_id,
        title: subjectData.title || localData.className,
        className: subjectData.title || localData.className,
        description: subjectData.description || localData.subject,
        subject: subjectData.description || localData.subject,
        // Map description to section for display
        section: subjectData.description || localData.section || "Section details",
        class_code: subjectData.class_code || localData.code,
        code: subjectData.class_code || localData.code,
        created_at: subjectData.created_at,
      };
    }
    
    return localData;
  }, [location.state, subjectData]);

  // Fetch subject data from API
  useEffect(() => {
    const fetchSubjectData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }
      const subjectId = classInfo.subject_id || classInfo.id;
      const classCode = classInfo.class_code || classInfo.code;
      if (!subjectId && !classCode) {
        return;
      }
      setLoadingSubject(true);
      try {
        let url;
        if (subjectId) {
          url = `http://localhost:5000/api/instructor/subjects/${subjectId}`;
        } else {
          url = `http://localhost:5000/api/instructor/subjects?class_code=${classCode}`;
        }
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data && response.data.subject) {
          setSubjectData(response.data.subject);
        }
      } catch (error) {
        // Don't show error alert if subject not found - use local data instead
      } finally {
        setLoadingSubject(false);
      }
    };
    fetchSubjectData();
  }, []);

  // Fetch announcements when subject data is available
  useEffect(() => {
    if (subjectData || classInfo.subject_id || classInfo.id) {
      fetchAnnouncements();
      fetchActivities();
      fetchStudents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjectData, classInfo.subject_id, classInfo.id]);

  // Build notifications from activity submissions
  useEffect(() => {
    // Only proceed if we have activities
    if (!activities || activities.length === 0) {
      setNotificationsList([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    let cancelled = false;

    const gather = async () => {
      try {
        const promises = activities.map((a) =>
          axios
            .get(`${API_BASE_URL}/activity/${a.activity_id}/submissions`, {
              headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => ({ activity: a, submissions: res.data?.submissions || [] }))
            .catch(() => ({ activity: a, submissions: [] }))
        );

        const results = await Promise.all(promises);

        // Flatten submissions into notification entries, most recent first
        const entries = [];
        results.forEach(({ activity, submissions }) => {
          submissions.forEach((s) => {
            // Skip submissions that already have a grade (instructor already graded)
            if (s.grade !== null && s.grade !== undefined) return;

            entries.push({
              id: s.submission_id || `${activity.activity_id}-${s.student_id}`,
              activity_id: activity.activity_id,
              activity_title: activity.title || activity.name || activity.activity_name || 'Activity',
              student_id: s.student_id,
              submitted_at: s.submitted_at || s.created_at || s.timestamp || null,
              grade: s.grade ?? null,
              message: s.submission_text || (s.attachments && s.attachments.length ? 'Submitted attachments' : 'Submitted work'),
              raw: s,
            });
          });
        });

        // Sort newest first
        entries.sort((a, b) => {
          const ta = a.submitted_at ? Date.parse(a.submitted_at) : 0;
          const tb = b.submitted_at ? Date.parse(b.submitted_at) : 0;
          return tb - ta;
        });

        if (!cancelled) {
          // Attach student names from students list if available
          const withNames = entries.map((e) => {
            const student = students.find((st) => st.user_id === e.student_id) || {};
            return { ...e, student_name: student.username || student.email || `Student ${e.student_id}` };
          });
          setNotificationsList(withNames);
        }
      } catch (err) {
        console.error('Failed to gather submission notifications', err);
      }
    };

    // Run immediately then poll periodically to pick up new submissions
    gather();
    const timer = setInterval(() => {
      gather();
    }, 15000); // poll every 15s

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [activities, students]);

  // Fetch linked quiz ID when selecting a Quiz activity for grading
  useEffect(() => {
    if (!selectedActivity || !selectedStudent) {
      setLinkedQuizIdForGrading(null);
      return;
    }

    let config = selectedActivity.config_json;
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        config = {};
      }
    }

    if (config.activity_name !== 'Quiz') {
      setLinkedQuizIdForGrading(null);
      return;
    }

    // Fetch the linked quiz ID from the activity
    const fetchLinkedQuiz = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        // Try to get quiz ID from the activity endpoint
        const res = await axios.get(`${API_BASE_URL}/activity/${selectedActivity.activity_id}/quiz`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        console.log('Quiz API response:', res.data);
        
        if (res.data?.quiz_id) {
          console.log('Quiz ID found:', res.data.quiz_id);
          setLinkedQuizIdForGrading(res.data.quiz_id);
        } else if (res.data?.id) {
          // Sometimes the response might have id instead of quiz_id
          console.log('Quiz ID found (as id):', res.data.id);
          setLinkedQuizIdForGrading(res.data.id);
        } else {
          console.warn('No quiz ID found in response:', res.data);
          setLinkedQuizIdForGrading(null);
        }
      } catch (err) {
        console.error('Failed to fetch linked quiz:', err);
        // Try alternative: check if quiz_id is in config
        if (config.quiz_id) {
          console.log('Using quiz_id from config:', config.quiz_id);
          setLinkedQuizIdForGrading(config.quiz_id);
        } else {
          setLinkedQuizIdForGrading(null);
        }
      }
    };

    fetchLinkedQuiz();
  }, [selectedActivity, selectedStudent]);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        createMenuRef.current &&
        !createMenuRef.current.contains(event.target)
      ) {
        setIsCreateMenuOpen(false);
      }
    }

    if (isCreateMenuOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isCreateMenuOpen]);

  const createMenuItems = [
    { label: "Assignment", description: "Share updates with everyone" }
  ];

  const goToFeature = (title, description) => {
    navigate("/instructor/feature", {
      state: {
        title,
        description,
        ctaLabel: "Back to Class",
      },
    });
  };

  const handleCanvasEditorSubmit = (editedFile) => {
    // For instructors, this downloads the edited file
    const url = URL.createObjectURL(editedFile);
    const link = document.createElement('a');
    link.href = url;
    link.download = editedFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    setCanvasEditorOpen(false);
    setCanvasEditorData(null);
    alert('Edited image downloaded successfully!');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(classInfo.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const handleCopyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/join?code=${classInfo.code}`;
    const inviteDetails = `Join ${classInfo.className || "my class"}!\n\nClass Code: ${classInfo.code}\n\nJoin Link: ${inviteLink}`;
    
    try {
      await navigator.clipboard.writeText(inviteDetails);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Failed to copy invite:", err);
    }
  };

  const handlePostAnnouncement = async () => {
    if (!announcementText.trim()) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) {
      alert("Cannot post: Subject ID not found.");
      return;
    }

    const formData = new FormData();
    formData.append("subject_id", subjectId);
    formData.append("content", announcementText.trim());
    

    
    selectedAttachments.forEach((attachment, index) => {

      formData.append("attachments", attachment.file);
    });

    setIsPosting(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/instructor/announcements",
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
          },
        }
      );



      const createdAnnouncement = response.data?.announcement;
      


      if (!createdAnnouncement) {

        alert("Error: No announcement data returned from server");
        setIsPosting(false);
        return;
      }

      const newAnnouncement = {
        announcement_id: createdAnnouncement.announcement_id,
        content: createdAnnouncement.content,
        created_at: createdAnnouncement.created_at || new Date().toISOString(),
        instructor_name: createdAnnouncement.instructor_name || instructorName,
        instructor_id: createdAnnouncement.instructor_id,
        attachments: createdAnnouncement.attachments || [],
      };



      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      setIsAnnouncementOpen(false);
      setAnnouncementText("");
      setSelectedAttachments([]);
    } catch (error) {

      alert(error.response?.data?.message || "Failed to post announcement. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const fetchAnnouncements = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/api/instructor/announcements?subject_id=${subjectId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );


      if (response.data && Array.isArray(response.data.announcements)) {
        setAnnouncements(response.data.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const fetchActivities = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/api/activity`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        // Filter activities by subject_id
        const filteredActivities = response.data.filter(activity => activity.subject_id === subjectId);

        // Fetch attachments for each activity (parallel)
        const activitiesWithAttachments = await Promise.all(
          filteredActivities.map(async (activity) => {
            try {
              const attRes = await axios.get(
                `http://localhost:5000/api/activity/${activity.activity_id}/attachments`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              activity.attachments = Array.isArray(attRes.data) ? attRes.data : attRes.data?.attachments || [];
            } catch (err) {
              activity.attachments = activity.attachments || [];
            }
            return activity;
          })
        );

        setActivities(activitiesWithAttachments);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    }
  };

  const fetchStudents = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) return;

    try {
      const response = await axios.get(
        `http://localhost:5000/api/instructor/subjects/${subjectId}/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && Array.isArray(response.data.students)) {
        const studentsResp = response.data.students;
        // fetch avatars for students in parallel
        try {
          const token = localStorage.getItem('token');
          const avatarPromises = studentsResp.map(s => fetch(`http://localhost:5000/api/user/${s.user_id}/avatar`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json().catch(() => null) : null).catch(() => null));
          const avatarResults = await Promise.all(avatarPromises);
          const studentsWithAvatars = studentsResp.map((s, i) => {
            const res = avatarResults[i];
            const avatarPath = res && res.avatar && res.avatar.file_path ? (res.avatar.file_path.startsWith('http') ? res.avatar.file_path : `http://localhost:5000${res.avatar.file_path}`) : null;
            return { ...s, avatarUrl: avatarPath };
          });
          setStudents(studentsWithAvatars);
        } catch (err) {
          console.error('Failed to fetch student avatars', err);
          setStudents(studentsResp);
        }
        
        // Mock submission data for each student (for demo purposes)
        const mockSubmissions = {};
        response.data.students.forEach((student, idx) => {
          if (idx % 2 === 0) {
            // Some students have submissions
            mockSubmissions[student.user_id] = [
              {
                name: `assignment_${student.username}.pdf`,
                type: 'pdf',
                size: '2.4 MB',
                url: '#'
              },
              {
                name: `report_${student.username}.docx`,
                type: 'document',
                size: '1.1 MB',
                url: '#'
              }
            ];
          }
        });
        setStudentSubmissions(mockSubmissions);
      } else {
        setStudents([]);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    }
  };

  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/instructor/announcements/${announcementId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setAnnouncements((prev) =>
        prev.filter((a) => a.announcement_id !== announcementId)
      );
    } catch (error) {
      console.error("Error deleting announcement:", error);
      alert(error.response?.data?.message || "Failed to delete announcement. Please try again.");
    }
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/activity/${activityId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setActivities((prev) =>
        prev.filter((a) => a.activity_id !== activityId)
      );
      alert("Activity deleted successfully!");
    } catch (error) {
      console.error("Error deleting activity:", error);
      alert(error.response?.data?.message || "Failed to delete activity. Please try again.");
    }
  };

  const handleEditActivity = (activity) => {
    let config = activity.config_json;
    if (typeof config === 'string') {
      try {
        config = JSON.parse(config);
      } catch (e) {
        config = {};
      }
    }

    setEditingActivityData({
      activity_id: activity.activity_id,
      title: activity.title,
      description: activity.description,
      activity_name: config.activity_name || "",
      instructions: config.instructions || "",
      open_date_time: config.open_date_time || "",
      due_date_time: config.due_date_time || "",
      // time_limit removed
      quiz_data: null, // Will be populated if this is a Quiz activity
    });
    // Load existing attachments for this activity and populate editingAttachments
    (async () => {
      const token = localStorage.getItem("token");
      try {
        if (token) {
          const res = await axios.get(`${API_BASE_URL}/activity/${activity.activity_id}/attachments`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const attachments = Array.isArray(res.data) ? res.data : res.data?.attachments || [];
          const mapped = attachments.map((att) => ({
            id: String(att.id || att.attachment_id || att.stored_name || `${Date.now()}-${Math.random()}`),
            file: att,
            mimeType: att.mime_type,
            isExisting: true,
          }));
          setEditingAttachments(mapped);
        } else {
          setEditingAttachments([]);
        }

        // If this is a Quiz activity, fetch the linked quiz
        if (config.activity_name === 'Quiz') {
          try {
            const quizRes = await axios.get(`${API_BASE_URL}/activity/${activity.activity_id}/quiz`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            
            if (quizRes.data?.quiz_id) {
              // Fetch full quiz data with questions
              const fullQuizRes = await axios.get(`${API_BASE_URL}/quiz/${quizRes.data.quiz_id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              
              setEditingActivityData((prev) => ({
                ...prev,
                quiz_data: fullQuizRes.data?.quiz || null,
              }));
            }
          } catch (quizErr) {
            console.error('Failed to load quiz data for edit', quizErr);
            // Quiz may not exist yet, which is fine
          }
        }
      } catch (err) {
        console.error('Failed to load activity attachments for edit', err);
        setEditingAttachments([]);
      } finally {
        setIsEditingActivity(true);
      }
    })();
  };

  const openActivity = async (activity) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setTimeout(() => setSelectedActivity(activity), 0);
      return;
    }

    try {
      const subRes = await axios.get(
        `${API_BASE_URL}/activity/${activity.activity_id}/submissions`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const submissions = subRes.data?.submissions || [];
      const submissionsByStudent = {};
      submissions.forEach((sub) => {
        submissionsByStudent[sub.student_id] = {
          submission_id: sub.submission_id,
          submission_text: sub.submission_text,
          submitted_at: sub.submitted_at,
          grade: sub.grade,
          feedback: sub.feedback,
          attachments: sub.attachments || [],
          // Include performance and dragdrop fields
          performance_score: sub.performance_score,
          performance_grade: sub.performance_grade,
          performance_data: sub.performance_data,
          performance_report: sub.performance_report,
          checkpoint_data: sub.checkpoint_data,
          overall_score: sub.overall_score,
          overall_percentage: sub.overall_percentage,
          letter_grade: sub.letter_grade,
          completion_status: sub.completion_status,
          cpu_score: sub.cpu_score,
          cmos_score: sub.cmos_score,
          ram_score: sub.ram_score,
          total_wrong_attempts: sub.total_wrong_attempts,
          total_correct_attempts: sub.total_correct_attempts,
          total_drag_operations: sub.total_drag_operations,
          total_idle_seconds: sub.total_idle_seconds,
          sequence_followed: sub.sequence_followed,
          time_taken_seconds: sub.time_taken_seconds,
          quiz_attempt_id: sub.quiz_attempt_id
        };
      });
      setStudentSubmissions(submissionsByStudent);
    } catch (err) {
      console.error("Error fetching submissions:", err);
    }

    setTimeout(() => setSelectedActivity({ ...activity }), 0);
  };

  const handleSelectStudent = (student) => {
    setSelectedStudent(student);
    const submission = studentSubmissions[student.user_id];
    if (submission) {
      setStudentGrade(submission.grade ? submission.grade.toString() : "");
      setStudentFeedback(submission.feedback || "");
    } else {
      setStudentGrade("");
      setStudentFeedback("");
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent || !selectedActivity) {
      alert("Please select a student and activity.");
      return;
    }

    const submission = studentSubmissions[selectedStudent.user_id];
    if (!submission) {
      alert("No submission found for this student.");
      return;
    }

    if (!studentGrade && !studentFeedback) {
      alert("Please enter a grade or feedback.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/activity/${selectedActivity.activity_id}/submissions/${submission.submission_id}/grade`,
        {
          grade: studentGrade ? parseFloat(studentGrade) : null,
          feedback: studentFeedback
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Grade saved successfully!");

      // Update the local submission data
      setStudentSubmissions((prev) => ({
        ...prev,
        [selectedStudent.user_id]: {
          ...prev[selectedStudent.user_id],
          grade: studentGrade ? parseFloat(studentGrade) : null,
          feedback: studentFeedback
        }
      }));

      // Remove any notification related to this submission so it disappears from instructor notifications
      setNotificationsList((prev) =>
        prev.filter(
          (n) => !(n.activity_id === selectedActivity.activity_id && String(n.student_id) === String(selectedStudent.user_id))
        )
      );

      // Close the tab/modal
      setSelectedActivity(null);
      setSelectedStudent(null);
    } catch (error) {
      console.error("Error saving grade:", error);
      alert(error.response?.data?.message || "Failed to save grade. Please try again.");
    }
  };

  const handleSaveActivityEdit = async () => {
    if (!editingActivityData || !editingActivityData.title) {
      alert("Please enter an activity title.");
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      // Build FormData to allow uploading new files and keeping existing ones
      const formData = new FormData();
      formData.append('title', editingActivityData.title);
      formData.append('description', editingActivityData.description || '');
      formData.append('config_json', JSON.stringify({
        activity_name: editingActivityData.activity_name,
        instructions: editingActivityData.instructions,
        open_date_time: editingActivityData.open_date_time,
        due_date_time: editingActivityData.due_date_time,
        // time_limit removed
      }));

      // Append new files (only items where file is an instance of File)
      editingAttachments.forEach((att) => {
        if (att.file instanceof File) {
          formData.append('attachments', att.file);
        }
      });

      // Provide list of existing attachment ids to keep (server will delete others)
      const keepAttachmentIds = editingAttachments
        .filter((att) => !(att.file instanceof File))
        .map((att) => att.id)
        .filter(Boolean);

      if (keepAttachmentIds.length > 0) {
        formData.append('keepAttachmentIds', keepAttachmentIds.join(','));
      }

      const response = await axios.put(
        `http://localhost:5000/api/activity/${editingActivityData.activity_id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Save quiz data if this is a Quiz activity
      if (editingActivityData.activity_name === 'Quiz' && editingActivityData.quiz_data) {
        try {
          // Update quiz metadata (title, passing_score, time_limit, shuffle options)
          await axios.put(
            `http://localhost:5000/api/quiz/${editingActivityData.quiz_data.quiz_id}`,
            {
              title: editingActivityData.quiz_data.title,
              passing_score: editingActivityData.quiz_data.passing_score,
              time_limit_minutes: editingActivityData.quiz_data.time_limit_minutes,
              shuffle_questions: editingActivityData.quiz_data.shuffle_questions,
              shuffle_choices: editingActivityData.quiz_data.shuffle_choices,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          // Update question points if any questions were modified
          if (editingActivityData.quiz_data.questions && Array.isArray(editingActivityData.quiz_data.questions)) {
            for (const question of editingActivityData.quiz_data.questions) {
              if (question.question_id && question.points !== undefined) {
                await axios.put(
                  `http://localhost:5000/api/quiz/questions/${question.question_id}`,
                  { points: question.points },
                  { headers: { Authorization: `Bearer ${token}` } }
                ).catch((err) => {
                  console.warn(`Failed to update question ${question.question_id} points:`, err);
                  // Don't fail entirely if question update fails
                });
              }
            }
          }
          console.log('Quiz data saved successfully');
        } catch (quizErr) {
          console.error('Error saving quiz data:', quizErr);
          alert('Activity saved but there was an issue saving quiz changes. Please try again.');
        }
      }

      // Prefer the server-returned activity object if available, otherwise build an updated object
      const returnedActivity = response.data?.activity || null;
      const updatedAttachments = response.data?.attachments || returnedActivity?.attachments || [];

      setActivities((prev) =>
        prev.map((a) => {
          if (a.activity_id !== editingActivityData.activity_id) return a;

          // Build normalized config object using server response when available
          const newConfig = returnedActivity
            ? (typeof returnedActivity.config_json === 'string'
                ? JSON.parse(returnedActivity.config_json || '{}')
                : returnedActivity.config_json || {})
            : {
                activity_name: editingActivityData.activity_name,
                instructions: editingActivityData.instructions,
                open_date_time: editingActivityData.open_date_time,
                due_date_time: editingActivityData.due_date_time,
                // time_limit removed from merged config
              };

          const merged = {
            ...a,
            title: returnedActivity?.title || editingActivityData.title || a.title,
            description: returnedActivity?.description || editingActivityData.description || a.description,
            config_json: returnedActivity?.config_json || newConfig,
            attachments: updatedAttachments.length ? updatedAttachments : a.attachments || [],
          };

          // If selectedActivity is open and matches this activity, update that too
          if (selectedActivity && selectedActivity.activity_id === merged.activity_id) {
            setSelectedActivity((prev) => ({ ...(prev || {}), ...merged }));
          }

          return merged;
        })
      );

      setIsEditingActivity(false);
      setEditingActivityData(null);
      setEditingAttachments([]);
      alert('Activity updated successfully!');
    } catch (error) {
      console.error('Error updating activity:', error);
      alert(error.response?.data?.message || 'Failed to update activity. Please try again.');
    }
  };

  const handleCancelActivityEdit = () => {
    setIsEditingActivity(false);
    setEditingActivityData(null);
    setEditingAttachments([]);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setEditingText(announcement.content);
    // Convert existing attachments to have proper id and file properties
    const attachmentsWithIds = (announcement.attachments || []).map((att) => ({
      id: String(att.attachment_id || att.posting_id), // Use the actual DB ID
      file: att, // existing attachment object, not a File
      mimeType: att.mime_type,
      isExisting: true, // Mark as existing for easier identification
    }));
    setEditingAttachments(attachmentsWithIds);
    setIsEditMode(true);
  };

  const handleSaveEdit = async () => {
    if (!editingText.trim() || !editingAnnouncement) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("content", editingText.trim());
      
      // Add only new file attachments (not existing ones)
      editingAttachments.forEach((attachment) => {
        if (attachment.file instanceof File) {
          formData.append("attachments", attachment.file);
        }
      });

      // Add IDs of attachments to keep (existing ones that weren't removed)
      const keepAttachmentIds = editingAttachments
        .filter((att) => !(att.file instanceof File)) // Only existing attachments
        .map((att) => att.id)
        .filter(id => id); // Filter out empty IDs
      
      if (keepAttachmentIds.length > 0) {
        formData.append("keepAttachmentIds", keepAttachmentIds.join(","));
      }

      const response = await axios.put(
        `http://localhost:5000/api/instructor/announcements/${editingAnnouncement.announcement_id}`,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updatedAnnouncement = response.data?.announcement || editingAnnouncement;

      setAnnouncements((prev) =>
        prev.map((a) =>
          a.announcement_id === editingAnnouncement.announcement_id
            ? { 
                ...a, 
                content: editingText.trim(),
                attachments: updatedAnnouncement.attachments || [], 
                updated_at: response.data?.announcement?.updated_at 
              }
            : a
        )
      );

      setIsEditMode(false);
      setEditingAnnouncement(null);
      setEditingText("");
      setEditingAttachments([]);
    } catch (error) {
      console.error("Error updating announcement:", error);
      alert(error.response?.data?.message || "Failed to update announcement. Please try again.");
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditingAnnouncement(null);
    setEditingText("");
    setEditingAttachments([]);
  };

  const handleEditAttachmentSelect = (fileList) => {
    if (!fileList || !fileList.length) {
      return;
    }
    
    const MAX_ATTACHMENTS = 6;
    const filesArray = [...fileList];
    
    setEditingAttachments((prev) => {
      const availableSlots = MAX_ATTACHMENTS - prev.length;
      if (availableSlots <= 0) {
        alert("You can attach up to 6 files per post.");
        return prev;
      }
      
      const newAttachments = filesArray.slice(0, availableSlots).map((file) => ({
        id: `${Date.now()}-${Math.random()}`,
        file: file,
        mimeType: file.type,
      }));
      
      return [...prev, ...newAttachments];
    });
    
    if (editFileInputRef.current) {
      editFileInputRef.current.value = "";
    }
  };

  const handleEditAttachmentRemove = (id) => {
    setEditingAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getAttachmentIcon = (mimeType) => {
    if (!mimeType) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.includes("pdf")) return "📄";
    if (
      mimeType.includes("word") ||
      mimeType.includes("presentation") ||
      mimeType.includes("excel")
    ) {
      return "📄";
    }
    return "📎";
  };

  // Given an array of attachments, return latest and history arrays
  // latest: the attachments that were uploaded most recently (by timestamp fields)
  // history: all other attachments
  const splitCurrentAndHistory = (attachments = []) => {
    if (!attachments || attachments.length === 0) return { latest: [], history: [] };

    const getTimestamp = (a = {}) => {
      // Several possible timestamp keys we might encounter from API
      const keys = ["uploaded_at", "created_at", "updated_at", "submitted_at", "timestamp", "time"];
      for (const k of keys) {
        if (a[k]) {
          const n = Date.parse(a[k]);
          if (!isNaN(n)) return n;
        }
      }
      return null;
    };

    // Try to extract timestamps. If we find any valid timestamp, use the newest timestamp as latest set
    const ts = attachments.map(getTimestamp);
    const hasAny = ts.some((t) => t !== null);

    if (hasAny) {
      const maxT = Math.max(...ts.map((t) => (t === null ? -Infinity : t)));
      const latest = attachments.filter((a) => (getTimestamp(a) || -Infinity) === maxT);
      const history = attachments.filter((a) => (getTimestamp(a) || -Infinity) !== maxT);
      return { latest, history };
    }

    // Fallback: treat last item as latest, rest as history
    if (attachments.length === 1) return { latest: attachments, history: [] };
    return { latest: [attachments[attachments.length - 1]], history: attachments.slice(0, -1) };
  };

  const handleAttachmentSelect = (fileList) => {
    console.log("=== handleAttachmentSelect called ===");
    console.log("fileList:", fileList);
    console.log("fileList.length:", fileList?.length);
    
    if (!fileList || !fileList.length) {
      console.warn("No files or empty list");
      return;
    }
    
    const MAX_ATTACHMENTS = 6;
    console.log("Files selected:", fileList.length);
    
    // Convert FileList to array using spread operator (more reliable than Array.from)
    const filesArray = [...fileList];
    console.log("Files array after spread:", filesArray.length);
    
    // Log each file
    for (let i = 0; i < filesArray.length; i++) {
      const file = filesArray[i];
      console.log(`File ${i}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      });
    }
    
    setSelectedAttachments((prev) => {
      console.log("Previous attachments:", prev.length);
      const availableSlots = MAX_ATTACHMENTS - prev.length;
      if (availableSlots <= 0) {
        alert("You can attach up to 6 files per post.");
        return prev;
      }

      const incoming = filesArray.slice(0, availableSlots);
      console.log("Incoming files after slice:", incoming.length);
      const next = [...prev];

      incoming.forEach((file, idx) => {
        console.log(`Processing file ${idx}:`, file.name);
        const isDuplicate = next.some(
          (item) =>
            item.file.name === file.name &&
            item.file.size === file.size &&
            item.file.lastModified === file.lastModified
        );
        console.log(`File ${idx} is duplicate?`, isDuplicate);
        if (!isDuplicate) {
          const newItem = {
            id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()
              .toString(36)
              .slice(2, 8)}`,
            file,
            mimeType: file.type,
          };
          console.log(`Adding file ${idx} with id:`, newItem.id);
          next.push(newItem);
        }
      });

      console.log("Final attachments count:", next.length);
      return next;
    });
  };

  const handleAttachmentRemove = (id) => {
    setSelectedAttachments((prev) => prev.filter((item) => item.id !== id));
  };

  // Preview state for attachment lightbox
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const handleDrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer?.files?.length) {
      handleAttachmentSelect(event.dataTransfer.files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const triggerPhotoVideoPicker = () => {
    photoVideoInputRef.current?.click();
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const quickActions = [
    {
      label: "Image",
      icon: "🖼",
      onClick: triggerPhotoVideoPicker,
    },
    {
      label: "Attachment",
      icon: "📎",
      onClick: triggerFilePicker,
    },
    {
      label: "Video",
      icon: "🎥",
      onClick: triggerPhotoVideoPicker,
    },
    {
      label: "Activity",
      icon: "⭐",
      onClick: () =>
        goToFeature(
          "Interactive Activity",
          "Host quick polls and activities to keep your class engaged. This feature is coming soon."
        ),
    },
    {
      label: "Schedule",
      icon: "⏰",
      onClick: () =>
        goToFeature(
          "Scheduled Post",
          "Plan announcements in advance and have them publish automatically."
        ),
    },
  ];

  const handleCreateActivity = async (attachments = [], linkedQuizId = null, codeBlockData = null) => {
    if (!activityName || !openDateTime || !dueDateTime || !title) {
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) {
      alert("Cannot create activity: Subject ID not found.");
      return;
    }

    setIsCreatingActivity(true);
    try {
      // Format datetime strings for API
      const openDate = new Date(openDateTime);
      const dueDate = new Date(dueDateTime);

      // Prepare payload as FormData so attachments (if any) are uploaded
      const formData = new FormData();
      formData.append("subject_id", subjectId);
      formData.append("activity_name", title); // activity TYPE (CodeLab / Sim Pc / ...)
      formData.append("title", activityName); // activity display title (longer user input)
      formData.append("instructions", instructions || "");
      formData.append("open_date_time", openDate.toISOString());
      formData.append("due_date_time", dueDate.toISOString());
      // time_limit removed - not submitted by the UI

      // Add Code Block Activity data if provided
      if (codeBlockData) {
        formData.append("language", codeBlockData.language);
        formData.append("code", codeBlockData.code);
        formData.append("blocks", JSON.stringify(codeBlockData.blocks));
        formData.append("hiddenBlockIds", JSON.stringify(codeBlockData.hiddenBlockIds));
        formData.append("correctBlockOrder", JSON.stringify(codeBlockData.correctBlockOrder));
        formData.append("difficulty", codeBlockData.difficulty);
        formData.append("hints", JSON.stringify(codeBlockData.hints));
      }

      // Attach files
      if (attachments && attachments.length > 0) {
        attachments.forEach((file) => {
          formData.append("attachments", file);
        });
      }

      console.log("Creating activity with form data, files:", attachments?.length || 0, "codeBlockData:", codeBlockData);

      const response = await axios.post("http://localhost:5000/api/activity", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Activity created:", response.data);
      
      // If this is a Quiz activity, link the quiz to the activity
      if (title === "Quiz" && linkedQuizId && response.data?.activity_id) {
        try {
          await axios.post(`http://localhost:5000/api/activity/${response.data.activity_id}/quiz`, 
            { activity_id: response.data.activity_id, quiz_id: linkedQuizId },
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          console.log("Quiz linked to activity successfully");
        } catch (linkErr) {
          console.error("Failed to link quiz to activity:", linkErr);
          alert("Activity created but failed to link quiz. Please try linking manually.");
        }
      }
      
      alert("Activity created successfully!");
      
      // Defer ALL state updates to next tick to avoid "setState during render" warning
      // when parent is updated by child component (ActivityBuilder)
      setTimeout(() => {
        // Immediately add created activity to the list (with attachments if returned)
        if (response.data?.activity) {
          const createdActivity = response.data.activity;
          // Ensure activity has attachments array
          if (!createdActivity.attachments) {
            createdActivity.attachments = [];
          }
          setActivities((prev) => [createdActivity, ...prev]);
        }

        // Reset form and close modal
        setIsCreateActivityOpen(false);
        setActivityName("");
        setOpenDateTime("");
        setDueDateTime("");
        // timeLimit removed; nothing to reset
        setTitle("");
        setInstructions("");
      }, 0);

      // Refresh activities list to stay in sync with backend (in background)
      await fetchActivities();
    } catch (error) {
      console.error("Error creating activity:", error);
      alert(error.response?.data?.message || "Failed to create activity. Please try again.");
    } finally {
      setIsCreatingActivity(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white">
      <Header
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        showMenu={false}
      />

      <div className="flex flex-1 md:ml-72">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main className="flex-1 px-6 sm:px-10 py-18 mt-15 space-y-10 w-full">
          {/* Back to Classes & Welcome Section Combined */}
          <div className="relative flex flex-col items-center justify-center text-center">
            <button
              onClick={() =>
                navigate("/instructor/dashboard", {
                  state: { newClass: classInfo },
                })
              }
              className="absolute left-0 text-sm font-medium text-blue-600 rounded-full border border-blue p-2 hover:text-blue-700"
            >
              ← Back to classes
            </button>
            <h1 className="text-4xl font-bold text-gray-800">
              Welcome, Prof. <span className="text-blue-600">{instructorName}</span>!
            </h1>
          </div>

          {/* Class Info and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold text-gray-800">
                {classInfo.className}
              </h2>
              <p className="text-gray-500">
                {classInfo.section || classInfo.description || "No description"}
              </p>
            </div>
          </div>

          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2d7bf3] via-[#37b0ff] to-[#8adFFF] text-white shadow-xl">
            <div className="absolute inset-0">
              <div className="absolute -top-24 -left-20 h-64 w-64 rounded-full bg-white/20 blur-2xl" />
              <div className="absolute -bottom-16 right-10 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
              <div className="absolute left-24 top-10 h-24 w-24 rounded-3xl border border-white/25 rotate-12" />
              <div className="absolute right-16 bottom-16 h-20 w-20 rounded-full bg-white/20" />
            </div>
            <div className="relative z-10 p-8 lg:p-12 flex flex-col gap-8">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                <div>
                  <p className="uppercase tracking-[0.25em] text-white/80 text-xs">
                    stream overview
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold leading-snug">
                    Stay Connected & Informed
                  </h2>
                  <p className="mt-3 text-white/80 text-sm max-w-2xl">
                    Share announcements, resources, and real-time updates to keep your learning community aligned and engaged.
                  </p>
                </div>
                <div className="bg-white/15 rounded-3xl p-6 w-full sm:w-auto sm:min-w-[220px]">
                  <p className="text-white/70 uppercase tracking-wide text-xs">
                    class code
                  </p>
                  <p className="mt-3 text-3xl font-semibold tracking-[0.35em]">
                    {classInfo.code}
                  </p>
                  <button
                    onClick={handleCopyCode}
                    className={`mt-6 w-full rounded-xl py-2 text-sm font-medium transition ${
                      copiedCode
                        ? "bg-green-500/30 text-white"
                        : "bg-white/20 hover:bg-white/30"
                    }`}
                  >
                    {copiedCode ? "Copied!" : "Copy code"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Actions bar outside the banner */}
          <div className="mt-4 lg:mt-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("newsfeed")}
                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 ${
                  activeTab === "newsfeed"
                    ? "bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Newsfeed
              </button>
              <button
                onClick={() => setActiveTab("classwork")}
                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 ${
                  activeTab === "classwork"
                    ? "bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Classwork
              </button>
              <button
                onClick={() => setActiveTab("people")}
                className={`px-6 py-2 rounded-full text-sm font-semibold border transition-transform duration-200 ${
                  activeTab === "people"
                    ? "bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Class People
              </button>
              <button
                onClick={() => setActiveTab("grades")}
                className={`px-6 py-2 rounded-full text-sm font-semibold transition-transform duration-200 ${
                  activeTab === "grades"
                    ? "bg-[#2d7bf3] text-white shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Grades
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "grades" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Grades Center</h3>
              <p className="text-gray-500 mb-6">Track student performance, provide timely feedback, and analyze class trends across assignments.</p>
              {students.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold text-gray-700">{students.length}</span> student{students.length !== 1 ? 's' : ''} joined
                  </div>
                  <div className="grid gap-3">
                    {students.map((student) => (
                      <button
                        key={student.user_id}
                        className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition w-full text-left ${selectedStudent?.user_id === student.user_id ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                        onClick={async () => {
                          if (selectedStudent?.user_id === student.user_id) {
                            setSelectedStudent(null);
                          } else {
                            setSelectedStudent(student);
                            // Fetch all submissions for this student across all activities
                            const token = localStorage.getItem("token");
                            if (!token) return;
                            const submissionsByActivity = {};
                            for (const activity of activities) {
                              try {
                                const subRes = await axios.get(
                                  `${API_BASE_URL}/activity/${activity.activity_id}/submissions`,
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );
                                const submissions = subRes.data?.submissions || [];
                                const studentSubmission = submissions.find(sub => sub.student_id === student.user_id);
                                submissionsByActivity[activity.activity_id] = studentSubmission || null;
                              } catch (err) {
                                submissionsByActivity[activity.activity_id] = null;
                              }
                            }
                            setStudentSubmissions(submissionsByActivity);
                          }
                        }}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {student.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {student.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            Student
                          </span>
                          <span className="text-xs text-gray-500">
                            Joined {new Date(student.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Student details and activities section */}
                  {selectedStudent && (
                    <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center">
                          {selectedStudent.avatarUrl ? (
                            <img src={selectedStudent.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold">
                              {selectedStudent.username.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{selectedStudent.username}</p>
                          <p className="text-xs text-gray-500">{selectedStudent.email}</p>
                        </div>
                        <div className="pl-6 border-l border-gray-200 ml-4">
                          <h4 className="text-lg font-semibold text-gray-800">{classInfo.className}</h4>
                          <p className="text-xs text-gray-500">{classInfo.section}</p>
                        </div>
                      </div>
                      <hr className="my-6 border-gray-300" />
                      {/* Activities for selected student */}
                      <div className="space-y-4">
                        {activities.length > 0 ? (
                          activities.map((activity, idx) => {
                            const submission = studentSubmissions[activity.activity_id];
                            return (
                              <div key={activity.activity_id || idx}>
                                <div className="font-semibold text-gray-800 mb-1">{activity.title || `ACTIVITY ${idx + 1}`}</div>
                                <div className={`text-sm mb-4 ${submission ? 'text-green-600' : 'text-gray-500'}`}> 
                                  {submission ? (
                                    <div className="flex items-center gap-3">
                                      <div>
                                        <span className="mr-2">✔ Submitted</span>
                                        {submission.submitted_at && (
                                          <span className="text-xs">{new Date(submission.submitted_at).toLocaleDateString()}</span>
                                        )}
                                      </div>
                                      {submission && submission.grade !== null && submission.grade !== undefined && submission.grade !== '' ? (
                                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded font-semibold text-sm">
                                          {Number.isFinite(Number(submission.grade)) ? Number(submission.grade).toFixed(2) : submission.grade}
                                        </div>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <>No submission</>
                                  )}
                                </div>
                                {idx < activities.length - 1 && (
                                  <hr className="my-2 border-gray-200" />
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-gray-500">No activities found.</div>
                        )}
                      </div>
                      <button
                        className="mt-6 px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition"
                        onClick={() => setSelectedStudent(null)}
                      >
                        Back
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No students joined yet</p>
                  <p className="text-sm text-gray-400">
                    Students will appear here once they join your class using the class code
                  </p>
                </div>
              )}
            </section>
          )}

          {activeTab === "people" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Class People</h3>
              
              {students.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 mb-4">
                    <span className="font-semibold text-gray-700">{students.length}</span> student{students.length !== 1 ? 's' : ''} enrolled
                  </div>
                  <div className="grid gap-3">
                    {students.map((student) => (
                      <div
                        key={student.user_id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                            {student.avatarUrl ? (
                              <img src={student.avatarUrl} alt="avatar" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                                {student.username.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">
                              {student.username}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                            Student
                          </span>
                          <span className="text-xs text-gray-500">
                            Joined {new Date(student.joined_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No students enrolled yet</p>
                  <p className="text-sm text-gray-400">
                    Students will appear here once they join your class using the class code
                  </p>
                </div>
              )}
            </section>
          )}

          {activeTab === "classwork" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <div className="flex items-start justify-between">
                <div className="relative" ref={createMenuRef}>
                  <button
                    onClick={() => setIsCreateMenuOpen((prev) => !prev)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white shadow-lg transition transform hover:-translate-y-0.5"
                    style={{
                      background: "linear-gradient(90deg,#2d7bf3 0%,#37b0ff 50%,#8adfff 100%)",
                      boxShadow: "0 10px 25px rgba(45,123,243,0.18)",
                    }}
                  >
                    <span className="text-lg font-bold leading-none">+</span>
                    <span>Classwork Activities</span>
                  </button>

                  {isCreateMenuOpen && (
                    <div className="absolute left-0 mt-3 w-72 rounded-3xl border border-blue-100 bg-white/95 backdrop-blur-sm shadow-2xl shadow-blue-200/40 overflow-hidden z-20">
                      <div className="bg-gradient-to-r from-[#e7f1ff] to-white px-5 py-4"></div>
                      <div className="divide-y divide-blue-50">
                        {createMenuItems.map((item) => (
                          <button
                            key={item.label}
                            onClick={() => {
                              if (item.label === "Assignment") {
                                setIsCreateActivityOpen(true);
                                setIsCreateMenuOpen(false);
                              }
                            }}
                            className="w-full text-left px-5 py-4 hover:bg-blue-50/70 transition-colors duration-150"
                          >
                            <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                            <p className="text-xs text-gray-500 mt-1">{item.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {activities.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {activities.map((activity) => {
                    let config = activity.config_json;
                    // Parse config_json if it's a string
                    if (typeof config === 'string') {
                      try {
                        config = JSON.parse(config);
                      } catch (e) {
                        config = {};
                      }
                    }
                    
                    // Ensure we consider an activity "active" if the config explicitly marks it active
                    // OR if the activity has been created (activity.activity_id exists).
                    const isActive = Boolean((config && config.active) || activity.activity_id);

                    return (
                      <div
                          key={activity.activity_id}
                          onClick={() => openActivity(activity)}
                          className="relative bg-gradient-to-br from-white via-blue-50/30 to-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 cursor-pointer ring-1 ring-white/60 border border-white/40 overflow-hidden backdrop-blur-sm group"
                        >
                          {/* Animated gradient background */}
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
                          
                          {/* Animated left accent bar */}
                          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-gradient-to-b from-blue-500 via-purple-500 to-pink-500 group-hover:w-2 transition-all duration-300" />
                          
                        <div className="relative z-10 flex items-start justify-between">
                          <div className="flex-1 pr-6">
                            <div className="flex items-center gap-3 mb-4">
                              <h4 className="font-extrabold text-2xl text-gray-800 leading-tight tracking-tight group-hover:text-blue-600 transition-colors">{activity.title}</h4>
                              <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${
                                config.activity_name === 'Code Block Activity' ? 'bg-green-100 text-green-700' :
                                config.activity_name === 'Quiz' ? 'bg-purple-100 text-purple-700' :
                                config.activity_name === 'Sim Pc' ? 'bg-cyan-100 text-cyan-700' :
                                'bg-orange-100 text-orange-700'
                              }`}>
                                {config.activity_name || 'Activity'}
                              </span>
                            </div>
                            
                            {/* Activity Type Buttons */}
                            <div className="flex flex-wrap gap-2 mb-4">
                              {["Code Block Activity", "Sim Pc", "Quiz", "DIY Activity"].map((type) => (
                                <button
                                  key={type}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 ${
                                    config.activity_name === type
                                      ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md"
                                      : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm"
                                  }`}
                                >
                                  {type}
                                </button>
                              ))}
                            </div>
                            
                            {config.instructions && (
                              <div className="mt-4 p-3 bg-blue-50/60 backdrop-blur-sm rounded-lg border border-blue-200/50">
                                <h2 className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Instructions</h2>
                                <p className="text-sm text-gray-700 line-clamp-2">{config.instructions}</p>
                              </div>
                            )}
                          </div>
                          
                          {/* right column - status / dates / actions */}
                          <div className="ml-6 flex flex-col items-end gap-4 min-w-[180px]">
                            {/* Status Badge */}
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-md ${
                              isActive 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-400 text-white' 
                                : 'bg-gradient-to-r from-gray-400 to-gray-500 text-white'
                            }`}>
                              {isActive ? '✓ ACTIVE' : '⚬ DRAFT'}
                            </div>

                            {/* Date Cards */}
                            <div className="flex gap-3 w-full">
                              {config.open_date_time && (
                                <div className="flex-1 px-3 py-2.5 rounded-lg bg-white/70 backdrop-blur-sm border border-green-200/50 shadow-sm hover:shadow-md transition-shadow text-center">
                                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Open</div>
                                  <div className="text-xs text-gray-800 font-bold">{new Date(config.open_date_time).toLocaleDateString()}</div>
                                  <div className="text-[10px] text-gray-600 mt-0.5">{new Date(config.open_date_time).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</div>
                                </div>
                              )}

                              {config.due_date_time && (
                                <div className="flex-1 px-3 py-2.5 rounded-lg bg-white/70 backdrop-blur-sm border border-orange-200/50 shadow-sm hover:shadow-md transition-shadow text-center">
                                  <div className="text-[10px] text-gray-500 uppercase font-bold mb-1">Due</div>
                                  <div className="text-xs text-gray-800 font-bold">{new Date(config.due_date_time).toLocaleDateString()}</div>
                                  <div className="text-[10px] text-gray-600 mt-0.5">{new Date(config.due_date_time).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</div>
                                </div>
                              )}
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 w-full pt-2">
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditActivity(activity); }}
                                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                              >
                                ✏️ Edit
                              </button>

                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteActivity(activity.activity_id); }}
                                className="flex-1 px-3 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 hover:border-red-300 hover:shadow-md transition-all duration-200 transform hover:scale-105"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <p className="text-gray-500">No activities yet. Create one to get started.</p>
                </div>
              )}
            </section>
          )}

          {activeTab === "newsfeed" && (
          <section className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
            <div className="space-y-6">
              <div className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
                <div
                  onClick={() => setIsAnnouncementOpen(true)}
                  className="flex flex-col bg-gray-50 border border-gray-200 rounded-full px-5 py-3 cursor-pointer hover:bg-gray-100 transition-all"
                >
                  <span className="text-xs text-gray-400 font-medium leading-none mb-1">
                    Announcement
                  </span>
                  <span className="text-gray-500 text-sm">
                    What&apos;s on your mind
                  </span>
                </div>

                <div className="flex gap-3 px-2 mt-4">
                </div>

                <input
                  type="file"
                  ref={photoVideoInputRef}
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleAttachmentSelect(event.target.files);
                    event.target.value = "";
                  }}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  className="hidden"
                  onChange={(event) => {
                    handleAttachmentSelect(event.target.files);
                    event.target.value = "";
                  }}
                />

                {/* Announcements List */}
                <AnnouncementsList
                  announcements={announcements}
                  API_BASE_URL={API_BASE_URL}
                  getAttachmentIcon={getAttachmentIcon}
                  onDelete={handleDeleteAnnouncement}
                  onEdit={handleEditAnnouncement}
                />
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
                <h3 className="text-lg font-semibold text-gray-800">Student Progress</h3>
                <p className="mt-3 text-sm text-gray-500">Recent student submissions and activity across your class.</p>

                <div className="mt-4">
                  {notificationsList && notificationsList.length > 0 ? (
                    <ul className="space-y-3 max-h-48 overflow-auto">
                      {notificationsList.map((n) => (
                        <li
                          key={n.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            // Open the related activity and select the student
                            const activity = activities.find((a) => a.activity_id === n.activity_id);
                            if (activity) {
                              openActivity(activity);
                            }
                            const stud = students.find((s) => (s.user_id || s.id) === n.student_id);
                            if (stud) {
                              setSelectedStudent(stud);
                            }
                          }}
                          className="p-3 border rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-semibold">
                              { (n.student_name || '').charAt(0).toUpperCase() }
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{n.student_name || `Student ${n.student_id}`}</p>
                                  <p className="text-xs text-gray-500 truncate">submitted to <span className="font-semibold text-gray-700">{n.activity_title}</span></p>
                                </div>
                                <div className="text-xs text-gray-400 whitespace-nowrap ml-2">{n.submitted_at ? new Date(n.submitted_at).toLocaleString() : ''}</div>
                              </div>
                              <div className="text-xs text-gray-500 mt-2 line-clamp-2">{n.message}</div>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="mt-3 text-sm text-gray-500">No upcoming submissions. Submissions will appear here when students turn in work.</div>
                  )}
                </div>

                
              </div>
            </div>
          </section>
          )}

          {activeTab === "announcements" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Announcements</h3>
              <p className="text-gray-500">View announcements in the Newsfeed tab.</p>
            </section>
          )}
        </main>

      {/* Announcement Composer Modal */}
      {/* Announcement Composer Modal */}
      <AnnouncementComposer
        isOpen={isAnnouncementOpen}
        onClose={() => {
          setIsAnnouncementOpen(false);
          setAnnouncementText("");
          setSelectedAttachments([]);
        }}
        classInfo={classInfo}
        instructorName={instructorName}
        onAnnouncementPosted={(newAnnouncement) => {
          setAnnouncements((prev) => [newAnnouncement, ...prev]);
        }}
        selectedAttachments={selectedAttachments}
        setSelectedAttachments={setSelectedAttachments}
        announcementText={announcementText}
        setAnnouncementText={setAnnouncementText}
        isPosting={isPosting}
        setIsPosting={setIsPosting}
        photoVideoInputRef={photoVideoInputRef}
        fileInputRef={fileInputRef}
        getAttachmentIcon={getAttachmentIcon}
        formatFileSize={formatFileSize}
      />

      {/* Create Activity Modal */}
      <ActivityBuilder
        isOpen={isCreateActivityOpen}
        onClose={() => setIsCreateActivityOpen(false)}
        activityName={activityName}
        setActivityName={setActivityName}
        openDateTime={openDateTime}
        setOpenDateTime={setOpenDateTime}
        dueDateTime={dueDateTime}
        setDueDateTime={setDueDateTime}
        
        title={title}
        setTitle={setTitle}
        instructions={instructions}
        setInstructions={setInstructions}
        isCreatingActivity={isCreatingActivity}
        onCreateActivity={handleCreateActivity}
        onReset={() => {
          setActivityName("");
          setOpenDateTime("");
          setDueDateTime("");
          // timeLimit removed from modal reset
          setTitle("");
          setInstructions("");
        }}
      />

      {/* Edit Announcement Modal */}
      {isEditMode && editingAnnouncement && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={handleCancelEdit}
        >
          <div
            className="bg-white rounded-3xl shadow-[0_25px_60px_rgba(15,23,42,0.18)] w-full max-w-2xl mx-4 overflow-hidden border border-indigo-50 max-h-[90vh] flex flex-col"
            style={{ animation: 'popUp 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-[#f5f2ff] to-white border-b border-indigo-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold tracking-[0.3em] text-indigo-400">
                  INSTRUCTOR POST
                </p>
                <h2 className="text-lg font-semibold text-slate-800 mt-1">
                  Edit post
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="h-9 w-9 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-slate-700 hover:shadow transition"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1">
              {/* User Row */}
              <div className="px-6 pt-5 pb-3 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-semibold text-lg">
                  {instructorName
                    .split(" ")
                    .map((n) => n.charAt(0))
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{instructorName}</p>
                  <p className="text-xs text-slate-400">
                    What&apos;s happening in {classInfo.className}?
                  </p>
                </div>
              </div>

              {/* Text Input Area */}
              <div className="px-6 pb-4">
                <textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  placeholder={`Share an update with ${classInfo.className}`}
                  className="w-full min-h-[180px] px-4 py-3 border-2 border-indigo-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 text-gray-800 placeholder-gray-400 resize-none text-base bg-indigo-50/40"
                  autoFocus
                />
              </div>

              {editingAttachments.length > 0 && (
                <div className="px-6 pb-4">
                  {/* File List */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-indigo-600 uppercase tracking-[0.25em] mb-3">
                      Files ({editingAttachments.length}/6)
                    </p>
                    {editingAttachments.map((attachment) => {
                      const isNewFile = attachment.file instanceof File;
                      const fileName = isNewFile ? attachment.file.name : attachment.file?.file_name;
                      const fileSize = isNewFile ? attachment.file.size : attachment.file?.file_size;
                      const mimeType = isNewFile ? attachment.file.type : attachment.file?.mime_type;
                      const isImage = mimeType?.startsWith("image/");
                      const isVideo = mimeType?.startsWith("video/");
                      const previewUrl = isNewFile && (isImage || isVideo) ? URL.createObjectURL(attachment.file) : null;

                      return (
                        <div
                          key={attachment.id}
                          className="rounded-xl border border-indigo-100 bg-indigo-50/60 overflow-hidden"
                        >
                          {/* Preview */}
                          {previewUrl && (isImage || isVideo) && (
                            <div className="relative w-full bg-black/5 max-h-40 overflow-hidden">
                              {isImage && (
                                <img
                                  src={previewUrl}
                                  alt={fileName}
                                  className="w-full h-40 object-cover"
                                />
                              )}
                              {isVideo && (
                                <video
                                  src={previewUrl}
                                  className="w-full h-40 object-cover"
                                  controls
                                />
                              )}
                            </div>
                          )}

                          {/* File Info */}
                          <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-lg" aria-hidden>
                                {getAttachmentIcon(mimeType)}
                              </span>
                              <div className="min-w-0">
                                <p className="font-medium truncate">{fileName}</p>
                                <p className="text-xs text-indigo-400">
                                  {formatFileSize(fileSize)}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleEditAttachmentRemove(attachment.id)}
                              className="text-xs font-semibold text-indigo-500 hover:text-indigo-700 transition ml-2 flex-shrink-0"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Formatting Toolbar */}
              <div className="px-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    title="Add attachment"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg border border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition"
                  >
                    Add attachment
                  </button>
                </div>
              </div>

              <input
                ref={editFileInputRef}
                type="file"
                multiple
                onChange={(e) => handleEditAttachmentSelect(e.target.files)}
                className="hidden"
              />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 flex items-center justify-end gap-3 bg-indigo-50/40 border-t border-indigo-100">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-indigo-500 font-semibold hover:bg-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!editingText.trim()}
                onClick={handleSaveEdit}
                className={`px-6 py-2 rounded-lg font-medium transition ${
                  editingText.trim()
                    ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-200"
                    : "bg-indigo-100 text-indigo-300 cursor-not-allowed"
                }`}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Activity Modal */}
      {isEditingActivity && editingActivityData && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 overflow-y-auto"
          onClick={handleCancelActivityEdit}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between p-6 rounded-t-2xl z-10 shadow-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleCancelActivityEdit}
                  className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-white">Edit Activity</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-amber-500">
                EDITING
              </span>
            </div>

            <div className="p-6 space-y-8 max-h-[calc(100vh-280px)] overflow-y-auto">
              {/* Step 1: Activity Name & Details */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">1</span>
                  <h3 className="text-lg font-semibold text-gray-800">Activity Name</h3>
                </div>
                <div>
                  <input
                    type="text"
                    value={editingActivityData.title}
                    onChange={(e) => setEditingActivityData({...editingActivityData, title: e.target.value})}
                    placeholder="Activity name*"
                    maxLength={100}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                  />
                  <p className="text-xs text-gray-500 mt-1">{editingActivityData.title?.length || 0}/100</p>
                </div>
              </div>

              {/* Step 2: Activity Type */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">2</span>
                  <h3 className="text-lg font-semibold text-gray-800">Activity Type *</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {["Code Block Activity", "Sim Pc", "Quiz", "DIY Activity"].map((activity) => {
                    const selected = editingActivityData.activity_name === activity;
                    const emojis = {
                      "Code Block Activity": "📦",
                      "Sim Pc": "💻",
                      "Quiz": "❓",
                      "DIY Activity": "🔧"
                    };
                    return (
                      <button
                        type="button"
                        key={activity}
                        onClick={() => setEditingActivityData({...editingActivityData, activity_name: activity})}
                        className={`p-4 rounded-xl font-semibold transition transform hover:scale-105 border-2 ${
                          selected
                            ? "bg-blue-600 text-white border-blue-700 shadow-lg"
                            : "bg-white text-gray-700 border-gray-200 hover:border-blue-400"
                        }`}
                      >
                        <div className="text-2xl mb-2">{emojis[activity]}</div>
                        <div className="font-bold">{activity}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Resources */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">3</span>
                  <h3 className="text-lg font-semibold text-gray-800">Resources & Attachments</h3>
                </div>
                <div className="flex items-center gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => editFileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                  >
                    + Add File
                  </button>
                  <p className="text-sm text-gray-600">Add resources for students</p>
                </div>

                {editingAttachments.length > 0 && (
                  <div className="space-y-2 mt-4">
                    <h4 className="font-semibold text-gray-700 mb-3">{editingAttachments.length} file(s) attached</h4>
                    {editingAttachments.map((attachment, idx) => {
                      const isNewFile = attachment.file instanceof File;
                      const fileName = isNewFile ? attachment.file.name : attachment.file?.file_name || attachment.file?.original_name;
                      const fileSize = isNewFile ? (attachment.file.size / 1024 / 1024).toFixed(2) : (attachment.file?.file_size / 1024 / 1024).toFixed(2);
                      return (
                        <div key={attachment.id || idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:shadow-sm transition">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded font-bold text-blue-600 text-xs">
                              {fileName.split('.').pop().toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{fileName}</div>
                              <div className="text-xs text-gray-500">{fileSize} MB</div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleEditAttachmentRemove(attachment.id)}
                            className="px-3 py-1 text-sm font-semibold text-red-600 hover:bg-red-50 rounded transition"
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <input
                  ref={editFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleEditAttachmentSelect(e.target.files)}
                />
              </div>

              {/* Step 4: Schedule */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">4</span>
                  <h3 className="text-lg font-semibold text-gray-800">Schedule Availability *</h3>
                </div>
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Open date and time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Open Date & Time</label>
                    <input
                      type="datetime-local"
                      value={editingActivityData.open_date_time?.slice(0, 16) || ""}
                      onChange={(e) => setEditingActivityData({...editingActivityData, open_date_time: new Date(e.target.value).toISOString()})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium"
                    />
                    <p className="text-xs text-gray-600 mt-2">When students can start</p>
                  </div>

                  {/* Due date and time */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date & Time</label>
                    <input
                      type="datetime-local"
                      value={editingActivityData.due_date_time?.slice(0, 16) || ""}
                      onChange={(e) => setEditingActivityData({...editingActivityData, due_date_time: new Date(e.target.value).toISOString()})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 font-medium"
                    />
                    <p className="text-xs text-gray-600 mt-2">When it's no longer accessible</p>
                  </div>
                </div>
              </div>

              {/* Step 5: Instructions */}
              <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold">5</span>
                  <h3 className="text-lg font-semibold text-gray-800">Instructions for Students</h3>
                </div>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <textarea
                    value={editingActivityData.instructions || ""}
                    onChange={(e) => setEditingActivityData({...editingActivityData, instructions: e.target.value})}
                    placeholder="Provide clear instructions for students..."
                    rows={10}
                    className="w-full px-4 py-3 border-0 focus:outline-none text-gray-800 resize-none font-medium"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-2">💡 Tip: Clear instructions help students understand what's expected</p>
              </div>

              {/* Step 6: Quiz Editor (Only for Quiz activities) */}
              {editingActivityData.activity_name === 'Quiz' && editingActivityData.quiz_data && (
                <div className="bg-white rounded-xl border-2 border-purple-200 p-6 shadow-sm hover:shadow-md transition">
                  <div className="flex items-center gap-3 mb-6">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-600 font-bold">6</span>
                    <h3 className="text-lg font-semibold text-gray-800">❓ Quiz Questions</h3>
                  </div>

                  {/* Quiz Settings */}
                  <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Quiz Title</label>
                        <input
                          type="text"
                          value={editingActivityData.quiz_data?.title || ""}
                          onChange={(e) => setEditingActivityData({
                            ...editingActivityData,
                            quiz_data: { ...editingActivityData.quiz_data, title: e.target.value }
                          })}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Passing Score (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingActivityData.quiz_data?.passing_score || 60}
                          onChange={(e) => setEditingActivityData({
                            ...editingActivityData,
                            quiz_data: { ...editingActivityData.quiz_data, passing_score: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Time Limit (minutes)</label>
                        <input
                          type="number"
                          min="0"
                          value={editingActivityData.quiz_data?.time_limit_minutes || 0}
                          onChange={(e) => setEditingActivityData({
                            ...editingActivityData,
                            quiz_data: { ...editingActivityData.quiz_data, time_limit_minutes: parseInt(e.target.value) }
                          })}
                          className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingActivityData.quiz_data?.shuffle_questions || false}
                            onChange={(e) => setEditingActivityData({
                              ...editingActivityData,
                              quiz_data: { ...editingActivityData.quiz_data, shuffle_questions: e.target.checked }
                            })}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          Shuffle Questions
                        </label>
                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingActivityData.quiz_data?.shuffle_choices || false}
                            onChange={(e) => setEditingActivityData({
                              ...editingActivityData,
                              quiz_data: { ...editingActivityData.quiz_data, shuffle_choices: e.target.checked }
                            })}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          Shuffle Choices
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-gray-700">Questions ({editingActivityData.quiz_data?.questions?.length || 0})</h4>
                    {editingActivityData.quiz_data?.questions && editingActivityData.quiz_data.questions.length > 0 ? (
                      editingActivityData.quiz_data.questions.map((question, qIdx) => (
                        <div key={question.question_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white transition">
                          <div className="flex items-start gap-3 mb-3">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold">{qIdx + 1}</span>
                            <div className="flex-1">
                              <input
                                type="text"
                                value={question.question_text || ""}
                                onChange={(e) => {
                                  const updated = [...editingActivityData.quiz_data.questions];
                                  updated[qIdx] = { ...question, question_text: e.target.value };
                                  setEditingActivityData({
                                    ...editingActivityData,
                                    quiz_data: { ...editingActivityData.quiz_data, questions: updated }
                                  });
                                }}
                                placeholder="Enter question text..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 font-medium"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={question.points || 1}
                                onChange={(e) => {
                                  const updated = [...editingActivityData.quiz_data.questions];
                                  updated[qIdx] = { ...question, points: parseInt(e.target.value) };
                                  setEditingActivityData({
                                    ...editingActivityData,
                                    quiz_data: { ...editingActivityData.quiz_data, questions: updated }
                                  });
                                }}
                                className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 text-center"
                              />
                              <span className="text-xs text-gray-600 font-semibold">pts</span>
                            </div>
                          </div>

                          {/* Question Type Badge */}
                          <div className="mb-3 flex items-center gap-2">
                            <span className="text-xs font-semibold text-gray-600">Type:</span>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              question.question_type === 'multiple_choice' ? 'bg-blue-100 text-blue-700' :
                              question.question_type === 'checkbox' ? 'bg-green-100 text-green-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {question.question_type === 'multiple_choice' ? '○ Multiple Choice' :
                               question.question_type === 'checkbox' ? '☑ Multiple Select' :
                               '✏ Short Answer'}
                            </span>
                          </div>

                          {/* Choices for Multiple Choice and Checkbox */}
                          {(question.question_type === 'multiple_choice' || question.question_type === 'checkbox') && (
                            <div className="space-y-2 mt-4 pl-4 border-l-4 border-purple-300">
                              <h5 className="text-xs font-bold text-gray-700 uppercase">Choices</h5>
                              {question.choices && question.choices.length > 0 ? (
                                question.choices.map((choice, cIdx) => (
                                  <div key={choice.question_choice_id || cIdx} className="flex items-center gap-2 text-sm">
                                    <input
                                      type="checkbox"
                                      checked={choice.is_correct || false}
                                      disabled
                                      className="w-4 h-4"
                                    />
                                    <span className={`flex-1 px-2 py-1 rounded text-sm ${choice.is_correct ? 'bg-green-100 text-green-800 font-semibold' : 'bg-gray-100 text-gray-800'}`}>
                                      {choice.choice_text}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                <p className="text-xs text-gray-500 italic">No choices added</p>
                              )}
                            </div>
                          )}

                          {/* Short Answer */}
                          {question.question_type === 'short_answer' && question.answer && (
                            <div className="mt-4 pl-4 border-l-4 border-purple-300">
                              <h5 className="text-xs font-bold text-gray-700 uppercase mb-2">Expected Answer</h5>
                              <div className="bg-white p-2 rounded border border-gray-300 text-sm text-gray-800">
                                {question.answer.correct_answer_text}
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">📝 No questions added yet</p>
                        <p className="text-xs text-gray-400 mt-1">Create this quiz first to add questions</p>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 mt-4 text-center italic">💡 View full quiz details in a separate quiz editor</p>
                </div>
              )}
            </div>

            {/* Enhanced Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 to-white flex items-center justify-end gap-3 p-6 border-t border-gray-200 rounded-b-2xl shadow-md">
              <button
                onClick={handleCancelActivityEdit}
                className="px-6 py-2 text-gray-700 font-semibold hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveActivityEdit}
                className="px-8 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold hover:shadow-lg transition transform hover:scale-105"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Details Modal - Enhanced */}
      {selectedActivity && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto"
          onClick={() => setSelectedActivity(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Enhanced Header with Gradient */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-500 flex items-center justify-between p-6 rounded-t-2xl z-10 shadow-md">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedActivity(null)}
                  className="p-2 hover:bg-white/20 rounded-lg transition text-white"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h2 className="text-2xl font-bold text-white">{selectedActivity.title}</h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-blue-700">
                ACTIVITY
              </span>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setActiveActivityTab("instructions");
                  setSelectedStudent(null);
                }}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition ${
                  activeActivityTab === "instructions"
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                📋 Instructions
              </button>
              <button
                onClick={() => setActiveActivityTab("student-work")}
                className={`px-6 py-3 border-b-2 font-medium text-sm transition ${
                  activeActivityTab === "student-work"
                    ? "border-blue-600 text-blue-600 bg-white"
                    : "border-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                👥 Student Work
              </button>
            </div>

            {/* Content */}
            <div className="max-h-[calc(100vh-280px)] overflow-y-auto p-6">
              {activeActivityTab === "instructions" ? (
                <div className="space-y-6">
                  {(() => {
                    let cfg = selectedActivity.config_json;
                    if (typeof cfg === 'string') {
                      try { cfg = JSON.parse(cfg); } catch (e) { cfg = {}; }
                    }
                    
                    return (
                      <div className="space-y-6">
                        {/* Activity Info Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Activity Type */}
                            <div>
                              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-2">Activity Type</p>
                              <div className="flex flex-wrap gap-2">
                                {["Code Block Activity", "Sim Pc", "Quiz", "DIY Activity"].map((type) => (
                                  <span
                                    key={type}
                                    className={`px-3 py-1 rounded-full text-sm font-semibold transition transform ${
                                      cfg.activity_name === type
                                        ? "bg-blue-600 text-white shadow-md scale-105"
                                        : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400"
                                    }`}
                                  >
                                    {type === "Code Block Activity" ? "📦" : type === "Sim Pc" ? "🖥️" : type === "Quiz" ? "❓" : "🔧"} {type}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                              {cfg.open_date_time && (
                                <div className="bg-white rounded-lg p-3 border border-blue-200">
                                  <p className="text-xs font-bold text-gray-600 uppercase">Opens</p>
                                  <p className="text-sm font-semibold text-blue-600 mt-1">{new Date(cfg.open_date_time).toLocaleDateString()}</p>
                                  <p className="text-xs text-gray-500">{new Date(cfg.open_date_time).toLocaleTimeString()}</p>
                                </div>
                              )}
                              {cfg.due_date_time && (
                                <div className="bg-white rounded-lg p-3 border border-red-200">
                                  <p className="text-xs font-bold text-gray-600 uppercase">Due</p>
                                  <p className="text-sm font-semibold text-red-600 mt-1">{new Date(cfg.due_date_time).toLocaleDateString()}</p>
                                  <p className="text-xs text-gray-500">{new Date(cfg.due_date_time).toLocaleTimeString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Instructions Card */}
                        {cfg.instructions && (
                          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="text-2xl">📝</span>
                              <h3 className="text-lg font-semibold text-gray-800">Instructions</h3>
                            </div>
                            <div className="text-gray-700 whitespace-pre-line leading-relaxed text-sm p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                              {cfg.instructions}
                            </div>
                          </div>
                        )}

                        {/* Attachments Card */}
                        {selectedActivity?.attachments && selectedActivity.attachments.length > 0 && (
                          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold">📎</span>
                              <h3 className="text-lg font-semibold text-gray-800">Resources & Attachments</h3>
                              <span className="ml-auto px-3 py-1 bg-amber-100 text-amber-700 text-sm font-bold rounded-full">
                                {selectedActivity.attachments.length} file{selectedActivity.attachments.length !== 1 ? 's' : ''}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {selectedActivity.attachments.map((att, idx) => (
                                (() => {
                                  let fileUrl = '#';
                                  let downloadUrl = '#';
                                  if (att.file_path && typeof att.file_path === 'string') {
                                    if (att.file_path.startsWith('http')) {
                                      fileUrl = att.file_path;
                                      downloadUrl = att.file_path;
                                    } else if (att.file_path.startsWith('/')) {
                                      fileUrl = `${API_BASE_URL}${att.file_path}`;
                                    } else if (att.file_path.includes('uploads')) {
                                      fileUrl = `${API_BASE_URL}/${att.file_path}`;
                                    } else {
                                      fileUrl = `${API_BASE_URL}/${att.file_path}`;
                                    }
                                  } else if (att.url && typeof att.url === 'string') {
                                    fileUrl = att.url.startsWith('http') ? att.url : `${API_BASE_URL}${att.url.startsWith('/') ? '' : '/'}${att.url}`;
                                  } else if (att.stored_name && typeof att.stored_name === 'string') {
                                    fileUrl = `${API_BASE_URL}/uploads/activity_files/${att.stored_name}`;
                                    downloadUrl = `${API_BASE_URL}/activity/download/${encodeURIComponent(att.stored_name)}`;
                                  }
                                  if (!downloadUrl || downloadUrl === '#') {
                                    if (att.stored_name && typeof att.stored_name === 'string') {
                                      downloadUrl = `${API_BASE_URL}/activity/download/${encodeURIComponent(att.stored_name)}`;
                                    } else {
                                      downloadUrl = fileUrl;
                                    }
                                  }
                                  const isImage = att.mime_type && att.mime_type.startsWith('image/');
                                  const isVideo = att.mime_type && att.mime_type.startsWith('video/');
                                  const isPdf = att.mime_type && att.mime_type.includes('pdf');
                                  const icon = isImage ? '🖼️' : isVideo ? '🎥' : isPdf ? '📄' : '📎';

                                  return (
                                    <div key={att.id || att.stored_name || `${idx}-${att.original_name || att.file_name}`} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-blue-400 transition">
                                      <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border-2 border-gray-200 text-xl font-bold">
                                          {icon}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-semibold text-gray-800 truncate">{att.original_name || att.file_name || att.name}</p>
                                          <p className="text-xs text-gray-500 mt-1">{att.file_size ? formatFileSize(att.file_size) : 'Size unknown'}</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        {(isImage || isPdf) && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (isImage || isVideo) {
                                                setAttachmentPreview({ type: isImage ? 'image' : 'video', src: fileUrl, name: att.original_name || att.file_name });
                                              } else if (isPdf) {
                                                setCanvasEditorData({
                                                  fileUrl,
                                                  mimeType: att.mime_type,
                                                  filename: att.original_name || att.file_name || att.name,
                                                });
                                                setCanvasEditorOpen(true);
                                              }
                                            }}
                                            className="flex-1 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-xs font-semibold hover:bg-purple-200 transition"
                                          >
                                            👁️ Preview
                                          </button>
                                        )}
                                        <a href={downloadUrl} target="_blank" rel="noreferrer" download className="flex-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-semibold hover:bg-blue-200 transition text-center">
                                          ⬇️ Download
                                        </a>
                                      </div>
                                    </div>
                                  );
                                })()
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  {!selectedStudent ? (
                    <div className="space-y-4">
                      {/* Student Work Header */}
                      <div className="flex items-center justify-between mb-6">

                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{selectedActivity.title}</h3>
                          <p className="text-sm text-gray-500 mt-1">Review and grade student submissions</p>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex gap-6 mb-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{Object.keys(studentSubmissions).length}</p>
                          <p className="text-xs text-gray-500 mt-1">Turned in</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                          <p className="text-xs text-gray-500 mt-1">Assigned</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-800">{gradedCount}</p>
                          <p className="text-xs text-gray-500 mt-1">Graded</p>
                        </div>
                      </div>

                      {/* Student List */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex items-center justify-between mb-4">
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="w-4 h-4" />
                            <span className="text-sm font-medium text-gray-700">All students</span>
                          </label>
                          <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                            <option>Sort by status</option>
                            <option>Turned in</option>
                            <option>Not turned in</option>
                            <option>Graded</option>
                          </select>
                        </div>

                        {/* Student submissions */}
                        <div className="space-y-3 mt-4">
                          {students.length > 0 ? (
                            students.map((student) => {
                              const hasSubmission = studentSubmissions[student.user_id];
                              return (
                                <div
                                  key={student.user_id}
                                  onClick={() => handleSelectStudent(student)}
                                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-blue-50 cursor-pointer transition"
                                >
                                  <div className="flex items-center gap-3">
                                    <input type="checkbox" className="w-4 h-4" />
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center">
                                      {student.avatarUrl ? (
                                        <img
                                          src={student.avatarUrl}
                                          alt={`${student.username} avatar`}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                          {student.username ? student.username.charAt(0).toUpperCase() : "S"}
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-gray-800">{student.username}</p>
                                      {hasSubmission ? (
                                        <p className="text-xs text-green-600 font-medium">✓ Submitted {new Date(hasSubmission.submitted_at).toLocaleDateString()}</p>
                                      ) : (
                                        <p className="text-xs text-gray-500">Not submitted</p>
                                      )}
                                    </div>
                                  </div>
                                  <span className="px-3 py-1 rounded-lg bg-white border border-gray-200 text-gray-700 text-sm font-medium">
                                    {hasSubmission && hasSubmission.grade !== null && hasSubmission.grade !== undefined
                                      ? hasSubmission.grade
                                      : '-'}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center text-gray-500 py-8">No students in this class</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full">
                      {/* Header with Back button and Student Info */}
                      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <button
                            onClick={() => setSelectedStudent(null)}
                            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 transition"
                          >
                            ← Back
                          </button>
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center bg-gray-100">
                              {selectedStudent?.avatarUrl ? (
                                <img
                                  src={selectedStudent.avatarUrl}
                                  alt={`${selectedStudent.username} avatar`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-semibold text-sm">
                                  {selectedStudent.username.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-800 truncate">{selectedStudent.username}</p>
                              <p className="text-xs text-gray-500 truncate">{selectedStudent.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Main Content Area - Google Classroom Style Split View */}
                      <div className="flex-1 overflow-hidden flex gap-6 p-6 bg-gray-50">
                        {/* Left Side - Submission Preview (Google Classroom Style) */}
                        <div className="flex-1 min-w-0 overflow-y-auto space-y-4">
                          {studentSubmissions[selectedStudent.user_id] ? (
                            <>
                              {/* Quiz Submission Preview (if Quiz activity) */}
                              {(() => {
                                let config = selectedActivity.config_json;
                                if (typeof config === 'string') {
                                  try {
                                    config = JSON.parse(config);
                                  } catch (e) {
                                    config = {};
                                  }
                                }
                                
                                if (config.activity_name === 'Quiz' && linkedQuizIdForGrading) {
                                  return (
                                    <div className="bg-white rounded-lg shadow-sm p-4">
                                      <QuizSubmissionViewer 
                                        submission={studentSubmissions[selectedStudent.user_id].submission_text} 
                                        quizId={linkedQuizIdForGrading}
                                        studentName={selectedStudent.username}
                                        studentId={selectedStudent.user_id}
                                        activityId={selectedActivity.activity_id}
                                        attemptId={studentSubmissions[selectedStudent.user_id].quiz_attempt_id}
                                      />
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* SimPC Submission Preview (if Sim PC / Dragdrop activity) */}
                              {(() => {
                                let config = selectedActivity.config_json;
                                if (typeof config === 'string') {
                                  try {
                                    config = JSON.parse(config);
                                  } catch (e) {
                                    config = {};
                                  }
                                }
                                
                                const submission = studentSubmissions[selectedStudent.user_id];
                                // Check if it's dragdrop type OR SimPC activity name
                                const isDragdropType = selectedActivity.type === 'dragdrop';
                                const isSimPCName = config.activity_name && config.activity_name.toLowerCase().includes('sim');

                                console.log('SimPC Check:', {
                                  isDragdropType,
                                  isSimPCName,
                                  hasSubmission: !!submission,
                                  submission: submission ? JSON.stringify({
                                    overall_score: submission.overall_score,
                                    overall_percentage: submission.overall_percentage,
                                    letter_grade: submission.letter_grade,
                                    cpu_score: submission.cpu_score
                                  }) : null
                                });
                                
                                // Show SimPC viewer for dragdrop activities
                                if (isDragdropType && submission) {
                                  return (
                                    <div className="bg-white rounded-lg shadow-sm p-4">
                                      <SimPCSubmissionViewer 
                                        submission={submission} 
                                        studentName={selectedStudent.username}
                                      />
                                    </div>
                                  );
                                }
                                return null;
                              })()}

                              {/* Code Block Submission Preview */}
                              {(() => {
                                try {
                                  const data = JSON.parse(studentSubmissions[selectedStudent.user_id].submission_text);
                                  if (data.submissionType === 'codeblock') {
                                    return (
                                      <div className="bg-white rounded-lg shadow-sm p-4">
                                        <CodeBlockSubmissionViewer submissionText={studentSubmissions[selectedStudent.user_id].submission_text} />
                                      </div>
                                    );
                                  }
                                } catch (e) {
                                  // Not JSON, continue
                                }
                                return null;
                              })()}

                              {/* Plain Text Submission Preview */}
                              {(() => {
                                try {
                                  JSON.parse(studentSubmissions[selectedStudent.user_id].submission_text);
                                  return null; // Already handled above
                                } catch (e) {
                                  // Not JSON, show as plain text
                                }
                                return (
                                  <div className="bg-white rounded-lg shadow-sm p-4">
                                    <p className="text-sm font-semibold text-gray-800 mb-3">📝 Submission Text</p>
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{studentSubmissions[selectedStudent.user_id].submission_text}</p>
                                    </div>
                                  </div>
                                );
                              })()}

                              {/* Submission Attachments */}
                              {(() => {
                                const attachments = studentSubmissions[selectedStudent.user_id].attachments || [];
                                const { latest, history } = splitCurrentAndHistory(attachments);
                                if (latest.length === 0 && history.length === 0) return null;

                                return (
                                  <div className="bg-white rounded-lg shadow-sm p-4">
                                    <p className="text-sm font-semibold text-gray-800 mb-3">📎 Attachments</p>
                                    <div className="space-y-2">
                                      {latest && latest.length > 0 && latest.map((file, idx) => {
                                        let href = '#';
                                        if (file.url && typeof file.url === 'string') {
                                          href = file.url.startsWith('http') ? file.url : `${API_BASE_URL}${file.url.startsWith('/') ? '' : '/'}${file.url}`;
                                        } else if (file.file_path && typeof file.file_path === 'string') {
                                          href = file.file_path.startsWith('http') ? file.file_path : `${API_BASE_URL}${file.file_path.startsWith('/') ? '' : '/'}${file.file_path}`;
                                        } else if (file.stored_name && typeof file.stored_name === 'string') {
                                          href = `${API_BASE_URL}/uploads/activity_files/${file.stored_name}`;
                                        }

                                        const isImage = file.mime_type && file.mime_type.startsWith('image/');
                                        const icon = isImage ? '🖼️' : '📎';
                                        
                                        return (
                                          <a
                                            key={idx}
                                            href={href}
                                            download
                                            className="flex items-center gap-3 p-2 bg-gray-50 border border-gray-200 rounded hover:bg-gray-100 transition"
                                          >
                                            <span className="text-lg flex-shrink-0">{icon}</span>
                                            <span className="text-sm text-blue-600 font-medium truncate hover:underline">{file.original_name}</span>
                                          </a>
                                        );
                                      })}
                                    </div>
                                    {studentSubmissions[selectedStudent.user_id].submitted_at && (
                                      <p className="text-xs text-gray-500 mt-3">
                                        Submitted on {new Date(studentSubmissions[selectedStudent.user_id].submitted_at).toLocaleString()}
                                      </p>
                                    )}
                                  </div>
                                );
                              })()}
                            </>
                          ) : (
                            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                              <p className="text-lg text-gray-500">📭 No submission yet</p>
                            </div>
                          )}
                        </div>

                        {/* Right Side - Grading Panel (Like Google Classroom) */}
                        <div className="w-80 flex-shrink-0 bg-white rounded-lg shadow-sm p-6 border border-gray-200 overflow-y-auto">
                          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                            ✍️ Grade & Feedback
                          </h3>

                          {/* Grade Input */}
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Score</label>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                value={studentGrade}
                                onChange={(e) => setStudentGrade(e.target.value)}
                                placeholder="0"
                                min="0"
                                max="100"
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white"
                              />
                              <span className="flex items-center px-3 py-3 bg-gray-100 rounded-lg text-gray-700 font-semibold">/100</span>
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="border-t border-gray-200 my-6"></div>

                          {/* Feedback Textarea */}
                          <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Feedback</label>
                            <textarea
                              value={studentFeedback}
                              onChange={(e) => setStudentFeedback(e.target.value)}
                              placeholder="Add feedback for the student..."
                              rows="6"
                              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white resize-none"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="space-y-2">
                            <button 
                              onClick={handleSaveGrade} 
                              className="w-full px-4 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition shadow-sm"
                            >
                              ✓ Save Grade
                            </button>
                            <button
                              onClick={() => { setSelectedStudent(null); setStudentGrade(''); setStudentFeedback(''); }}
                              className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer with action buttons */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditActivity(selectedActivity);
                  setSelectedActivity(null);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this activity?')) {
                    handleDeleteActivity(selectedActivity.activity_id);
                    setSelectedActivity(null);
                  }
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Preview Modal */}
      {attachmentPreview && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60" onClick={() => setAttachmentPreview(null)}>
          <div className="max-w-[90vw] max-h-[90vh] bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b flex items-center justify-between">
              <div className="text-sm font-medium">{attachmentPreview.name}</div>
              <button onClick={() => setAttachmentPreview(null)} className="px-3 py-1 rounded bg-gray-100">Close</button>
            </div>
            <div className="p-4">
              {attachmentPreview.type === 'image' ? (
                <img src={attachmentPreview.src} alt={attachmentPreview.name} className="max-w-full max-h-[75vh] object-contain" />
              ) : (
                <video src={attachmentPreview.src} controls className="max-w-full max-h-[75vh]" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Canvas Editor Modal */}
      {canvasEditorOpen && canvasEditorData && (
        <div className="fixed inset-0 z-[100]">
          <CanvasEditor
            fileUrl={canvasEditorData.fileUrl}
            mimeType={canvasEditorData.mimeType}
            filename={canvasEditorData.filename}
            onClose={() => {
              setCanvasEditorOpen(false);
              setCanvasEditorData(null);
            }}
            onSubmit={handleCanvasEditorSubmit}
          />
        </div>
      )}
      </div>
    </div>
  );
}

export default SubClass;


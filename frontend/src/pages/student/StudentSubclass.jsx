import React, { useEffect, useState, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Header from "../../web_components/Header";
import Sidebar from "./Sidebar";
import AnnouncementsList from "../instructor/components/AnnouncementsList";
import CanvasEditor from "../../activities/Experiment/CanvasEditor";
import SimPCActivityView from "../../activities/simpc/SimPCActivityView";
import CodeLabActivityView from "../../activities/codelab/CodeLabActivityView";
import CodeBlockActivityView from "../../features/DragDrop/components/CodeBlockActivityView";
import QuizAttempt from "../../activities/Quiz/QuizAttempt";
import QuizResults from "../../activities/Quiz/QuizResults";

function StudentSubclass() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [subjectData, setSubjectData] = useState(location.state?.classData || null);
  const [loading, setLoading] = useState(!location.state?.classData);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState(() => location.state?.initialTab || "newsfeed");
  const [announcements, setAnnouncements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [members, setMembers] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [submissionText, setSubmissionText] = useState("");
  const [submissionAttachments, setSubmissionAttachments] = useState([]);
  const [existingSubmissionAttachments, setExistingSubmissionAttachments] = useState([]);
  const [mySubmission, setMySubmission] = useState(null);
  const [requestingNewAttempt, setRequestingNewAttempt] = useState(false);
  const [selectedActivityIsPastDue, setSelectedActivityIsPastDue] = useState(false);
  const [selectedActivityIsNotOpen, setSelectedActivityIsNotOpen] = useState(false);
  const [isSimPCOpen, setIsSimPCOpen] = useState(false);
  const [isCodeLabOpen, setIsCodeLabOpen] = useState(false);
  const [isCodeBlockOpen, setIsCodeBlockOpen] = useState(false);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [linkedQuizId, setLinkedQuizId] = useState(null);
  const [quizAttemptId, setQuizAttemptId] = useState(null);
  const [canvasEditorOpen, setCanvasEditorOpen] = useState(false);
  const [canvasEditorData, setCanvasEditorData] = useState(null);
  const submissionFileInputRef = React.useRef(null);
  const API_BASE_URL = "http://localhost:5000/api";
  const FILE_BASE_URL = "http://localhost:5000";

  const getAttachmentIcon = (mimeType) => {
    if (!mimeType) return "📄";
    if (mimeType.startsWith("image/")) return "🖼️";
    if (mimeType.startsWith("video/")) return "🎥";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("presentation") || mimeType.includes("excel")) {
      return "📄";
    }
    return "📎";
  };

  // Split attachments into latest (most recent uploads) and history
  const splitCurrentAndHistory = (attachments = []) => {
    if (!attachments || attachments.length === 0) return { latest: [], history: [] };

    const getTimestamp = (a = {}) => {
      const keys = ["uploaded_at", "created_at", "updated_at", "submitted_at", "timestamp", "time"];
      for (const k of keys) {
        if (a[k]) {
          const n = Date.parse(a[k]);
          if (!isNaN(n)) return n;
        }
      }
      return null;
    };

    const ts = attachments.map(getTimestamp);
    const hasAny = ts.some((t) => t !== null);
    if (hasAny) {
      const maxT = Math.max(...ts.map((t) => (t === null ? -Infinity : t)));
      const latest = attachments.filter((a) => (getTimestamp(a) || -Infinity) === maxT);
      const history = attachments.filter((a) => (getTimestamp(a) || -Infinity) !== maxT);
      return { latest, history };
    }

    // fallback: last item is latest
    if (attachments.length === 1) return { latest: attachments, history: [] };
    return { latest: [attachments[attachments.length - 1]], history: attachments.slice(0, -1) };
  };

  const classInfo = useMemo(() => {
    // Priority: subjectData > location.state.classData > defaults
    if (subjectData) {
      return {
        subject_id: subjectData.subject_id,
        instructor_id: subjectData.instructor_id,
        className: subjectData.title || "Untitled Class",
        description: subjectData.description || "Section details",
        code: subjectData.class_code || "",
        class_code: subjectData.class_code || "",
        created_at: subjectData.created_at,
      };
    }
    // Fallback to location state
    if (location.state?.classData) {
      return {
        subject_id: location.state.classData.subject_id,
        instructor_id: location.state.classData.instructor_id,
        className: location.state.classData.title || "Untitled Class",
        description: location.state.classData.description || "Section details",
        code: location.state.classData.class_code || "",
        class_code: location.state.classData.class_code || "",
        created_at: location.state.classData.created_at,
      };
    }

    // Final fallback
    return {
      className: "Untitled Class",
      description: "Section details",
      code: "",
      class_code: "",
    };
  }, [location.state, subjectData]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchSubject = async () => {
      // If we don't have subjectData yet, fetch it
      if (subjectData) return;

      try {
        setLoading(true);
        let url;

        if (params.id) {
          url = `${API_BASE_URL}/student/subjects/${params.id}`;
        } else if (location.state?.classData?.subject_id) {
          url = `${API_BASE_URL}/student/subjects/${location.state.classData.subject_id}`;
        } else if (location.state?.classData?.class_code) {
          url = `${API_BASE_URL}/student/subjects?class_code=${location.state.classData.class_code}`;
        }

        if (!url) {
          console.log("No subject ID or class code available");
          setLoading(false);
          return;
        }

        const res = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data?.subject) {
          setSubjectData(res.data.subject);
        } else {
          console.error("No subject data returned");
        }
      } catch (err) {
        console.error("Error fetching subject:", err);
        alert(err.response?.data?.message || "Failed to load class.");
        navigate("/student/StudentDashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchSubject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, params.id, navigate, subjectData]);

  // fetch announcements for students when subjectData becomes available
  useEffect(() => {
    const fetchAnnouncements = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const subjectId = classInfo.subject_id || classInfo.id;
      if (!subjectId) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/student/announcements?subject_id=${subjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAnnouncements(res.data?.announcements || []);
      } catch (err) {
        console.error("Error fetching student announcements:", err);
      }
    };

    fetchAnnouncements();
  }, [subjectData, classInfo.subject_id, classInfo.id]);

  // fetch class members (exposed so we can call it on tab click or manual refresh)
  const fetchMembers = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const subjectId = classInfo.subject_id || classInfo.id;
    if (!subjectId) return;

    try {
      const res = await axios.get(`${API_BASE_URL}/student/subjects/${subjectId}/members`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const membersResp = res.data?.members || [];
      try {
        // fetch avatars for members in parallel
        const avatarPromises = membersResp.map((m) =>
          fetch(`${API_BASE_URL}/user/${m.user_id}/avatar`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => (r.ok ? r.json().catch(() => null) : null))
            .catch(() => null)
        );

        const avatarResults = await Promise.all(avatarPromises);
        const membersWithAvatars = membersResp.map((m, i) => {
          const resA = avatarResults[i];
          const avatarPath = resA && resA.avatar && resA.avatar.file_path ? (resA.avatar.file_path.startsWith('http') ? resA.avatar.file_path : `${FILE_BASE_URL}${resA.avatar.file_path}`) : null;
          return { ...m, avatarUrl: avatarPath };
        });

        setMembers(membersWithAvatars);
      } catch (err) {
        console.error('Failed to fetch member avatars', err);
        setMembers(membersResp);
      }
    } catch (err) {
      console.error("Error fetching class members:", err);
      setMembers([]);
    }
  };

  // Fetch members when student opens the Class People tab
  useEffect(() => {
    if (activeTab === "people" && (subjectData || classInfo.subject_id || classInfo.id)) {
      fetchMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, subjectData, classInfo.subject_id, classInfo.id]);

  // fetch activities for students when classwork tab selected
  useEffect(() => {
    const fetchActivities = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      const subjectId = classInfo.subject_id || classInfo.id;
      if (!subjectId) return;

      try {
        const res = await axios.get(`${API_BASE_URL}/student/activities?subject_id=${subjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        let activitiesList = Array.isArray(res.data) ? res.data : res.data || [];

        // Fetch attachments and the student's own submission for each activity (parallel)
        const activitiesWithDetails = await Promise.all(
          activitiesList.map(async (activity) => {
            try {
              const [attRes, subRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/activity/${activity.activity_id}/attachments`, {
                  headers: { Authorization: `Bearer ${token}` },
                }),
                axios
                  .get(`${API_BASE_URL}/activity/${activity.activity_id}/my-submission`, {
                    headers: { Authorization: `Bearer ${token}` },
                  })
                  .catch(() => ({ data: { submission: null } })),
              ]);
              activity.attachments = Array.isArray(attRes.data) ? attRes.data : attRes.data?.attachments || [];
              activity.my_submission = subRes.data?.submission || null;
            } catch (err) {
              activity.attachments = [];
              activity.my_submission = null;
            }
            return activity;
          })
        );

        setActivities(activitiesWithDetails);
      } catch (err) {
        console.error("Error fetching student activities:", err);
      }
    };

    if (activeTab === "classwork" && (subjectData || classInfo.subject_id || classInfo.id)) {
      fetchActivities();
    }
  }, [activeTab, subjectData, classInfo.subject_id, classInfo.id]);

  // If navigation included an activity id to open, wait until activities are loaded and open it
  useEffect(() => {
    const openFromNav = async () => {
      try {
        const idToOpen = location.state?.openActivityId;
        if (!idToOpen || activities.length === 0) return;

        const found = activities.find((a) => String(a.activity_id || a.id) === String(idToOpen));
        if (found) {
          // call the same openActivity handler used by clicks
          await openActivity(found);
        }
      } catch (err) {
        // ignore
      }
    };
    openFromNav();
    // only react to changes in activities or navigation state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities, location.state?.openActivityId]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const openActivity = async (activity) => {
    setSelectedActivity(activity);

    // compute whether this activity is past due (if due_date_time provided in config)
    try {
      let cfg = activity.config_json;
      if (typeof cfg === "string") cfg = JSON.parse(cfg || "{}");
      if (cfg && cfg.due_date_time) {
        const due = new Date(cfg.due_date_time);
        setSelectedActivityIsPastDue(new Date() > due);
      } else {
        setSelectedActivityIsPastDue(false);
      }
      // compute whether activity is open yet (open_date_time)
      try {
        if (cfg && cfg.open_date_time) {
          const openAt = new Date(cfg.open_date_time);
          setSelectedActivityIsNotOpen(new Date() < openAt);
        } else {
          setSelectedActivityIsNotOpen(false);
        }
      } catch (e) {
        setSelectedActivityIsNotOpen(false);
      }
    } catch (e) {
      setSelectedActivityIsPastDue(false);
      setSelectedActivityIsNotOpen(false);
    }

    // Fetch student's own submission for this activity
    const token = localStorage.getItem("token");
    if (!token) return;
    
    // Check if this is a SimPC activity
    let cfg = activity.config_json;
    if (typeof cfg === "string") {
      try {
        cfg = JSON.parse(cfg || "{}");
      } catch (e) {
        cfg = {};
      }
    }

    if (cfg?.activity_name === "Sim Pc") {
      // Check if already completed before opening
      try {
        const res = await axios.get(`${API_BASE_URL}/activity/${activity.activity_id}/my-submission`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data?.completion_status === 'completed') {
          alert("You have already completed this SimPC activity. You cannot retake it.");
          return;
        }
      } catch (err) {
        console.error("Failed to check completion status:", err);
      }
      setIsSimPCOpen(true);
      return;
    }

    if (cfg?.activity_name === "CodeLab") {
      setIsCodeLabOpen(true);
      return;
    }

    if (cfg?.activity_name === "Code Block Activity") {
      setIsCodeBlockOpen(true);
      return;
    }

    if (cfg?.activity_name === "Quiz") {
      // Fetch the linked quiz ID for this activity
      try {
        const quizRes = await axios.get(`${API_BASE_URL}/activity/${activity.activity_id}/quiz`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLinkedQuizId(quizRes.data?.quiz_id);
        setIsQuizOpen(true);
      } catch (err) {
        console.error("Failed to fetch linked quiz:", err);
        alert("Failed to load quiz. Please try again.");
      }
      return;
    }

    try {
      const res = await axios.get(`${API_BASE_URL}/activity/${activity.activity_id}/my-submission`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const submission = res.data?.submission || null;
      setMySubmission(submission);
      // populate submission text and show previously uploaded attachments
      setSubmissionText(submission?.submission_text || "");
      setExistingSubmissionAttachments(Array.isArray(submission?.attachments) ? submission.attachments : []);
      // keep any new-file inputs that were previously added (don't clear them)
    } catch (err) {
      setMySubmission(null);
      setSubmissionText("");
      setExistingSubmissionAttachments([]);
      // keep any new-file inputs that were previously added (don't clear them)
    }
  };

  const handleAddSubmissionFile = (fileList) => {
    if (selectedActivityIsPastDue || selectedActivityIsNotOpen) {
      alert("This activity is not open yet. You cannot add attachments.");
      return;
    }
    if (!fileList || !fileList.length) return;
    const filesArray = Array.from(fileList);
    setSubmissionAttachments((prev) => [...prev, ...filesArray]);
  };

  const handleRemoveSubmissionFile = (index) => {
    setSubmissionAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitActivity = async () => {
    if (!selectedActivity || (!submissionText.trim() && submissionAttachments.length === 0)) {
      alert("Please enter feedback or attach a file.");
      return;
    }

    if (selectedActivityIsNotOpen) {
      alert(`This activity is not open yet. You can submit when it opens at ${new Date(selectedActivity.config_json?.open_date_time || selectedActivity.open_date_time).toLocaleString()}`);
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
      formData.append("activity_id", selectedActivity.activity_id);
      formData.append("submission_text", submissionText.trim());

      submissionAttachments.forEach((file) => {
        formData.append("attachments", file);
      });

      const postRes = await axios.post(`${API_BASE_URL}/activity/${selectedActivity.activity_id}/submission`, formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert("Submission sent successfully!");
      // Try to use returned submission from post response if available; otherwise fetch the saved submission.
      let savedSubmission = postRes?.data?.submission || null;
      if (!savedSubmission) {
        try {
          const refresh = await axios.get(`${API_BASE_URL}/activity/${selectedActivity.activity_id}/my-submission`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          savedSubmission = refresh.data?.submission || null;
        } catch (e) {
          // ignore
        }
      }

      if (savedSubmission) {
        setMySubmission(savedSubmission);
        setExistingSubmissionAttachments(Array.isArray(savedSubmission?.attachments) ? savedSubmission.attachments : []);

        // Update activities list so `activity.my_submission` shows immediately (no page refresh)
        setActivities((prev) =>
          prev.map((act) =>
            act.activity_id === selectedActivity.activity_id
              ? { ...act, my_submission: savedSubmission }
              : act
          )
        );
      }
      // close modal and clear text, but keep new-file inputs so user can re-submit if needed
      setSelectedActivity(null);
      setSubmissionText("");
      setSubmissionAttachments([]);
    } catch (error) {
      console.error("Error submitting activity:", error);
      alert(error.response?.data?.message || "Failed to submit. Please try again.");
    }
  };

  const handleCanvasEditorSubmit = (editedFile) => {
    // Add the edited file to submission attachments
    setSubmissionAttachments((prev) => [...prev, editedFile]);
    setCanvasEditorOpen(false);
    setCanvasEditorData(null);
    alert("Edited image added to submission! You can now submit it with your response.");
  };

  const handleRequestNewAttempt = async () => {
    if (!selectedActivity) return;

    const confirmed = window.confirm(
      "Are you sure you want to request a new attempt? You will be able to submit again."
    );

    if (!confirmed) return;

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Session expired. Please log in again.");
      navigate("/login");
      return;
    }

    try {
      setRequestingNewAttempt(true);
      await axios.post(
        `${API_BASE_URL}/activity/${selectedActivity.activity_id}/request-attempt`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Clear the submission to allow new submission
      setMySubmission(null);
      setSubmissionText("");
      setExistingSubmissionAttachments([]);
      setSubmissionAttachments([]);
      alert("New attempt requested! You can now submit again.");
    } catch (error) {
      console.error("Error requesting new attempt:", error);
      alert(error.response?.data?.message || "Failed to request new attempt. Please try again.");
    } finally {
      setRequestingNewAttempt(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(classInfo.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleCopyInviteLink = async () => {
    const inviteLink = `${window.location.origin}/join?code=${classInfo.code}`;
    const inviteDetails = `Join ${classInfo.className}!\n\nClass Code: ${classInfo.code}\n\nJoin Link: ${inviteLink}`;
    try {
      await navigator.clipboard.writeText(inviteDetails);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      console.error("Copy invite failed", err);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!subjectData) {
    return <div className="flex items-center justify-center min-h-screen">Class not found.</div>;
  }

  // If Code Block Activity is open, show full-screen view
  if (isCodeBlockOpen && selectedActivity) {
    const codeBlockData = {
      language: selectedActivity.language || selectedActivity.config_json?.language || 'python',
      code: selectedActivity.code || selectedActivity.config_json?.code || '',
      hiddenBlockIds: selectedActivity.hidden_block_ids || selectedActivity.config_json?.hiddenBlockIds || selectedActivity.hidden_block_ids || [],
    };

    console.log("=== StudentSubclass - Code Block Activity ===");
    console.log("Selected Activity:", selectedActivity);
    console.log("Code Block Data to pass:", codeBlockData);
    console.log("==========================================");

    return (
      <div className="flex min-h-screen bg-gray-900">
        <CodeBlockActivityView
          activityId={selectedActivity.activity_id || selectedActivity.id}
          activityData={codeBlockData}
          onExit={() => {
            setIsCodeBlockOpen(false);
            setSelectedActivity(null);
          }}
          onSubmit={() => {
            setIsCodeBlockOpen(false);
            setSelectedActivity(null);
          }}
        />
      </div>
    );
  }

  return (
    // Increase base font size and make fonts bolder across the Student class UI
    <div className="flex min-h-screen bg-gradient-to-br from-[#cfe3fa] via-[#e6f0ff] to-white text-lg font-semibold">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} onLogout={handleLogout} />

        <main className="flex-1 px-6 sm:px-10 py-10 mt-12 space-y-10 md:ml-24">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <button onClick={() => navigate("/student/StudentDashboard")} className="text-base font-bold text-blue-600 rounded-full border border-blue p-2 hover:text-blue-700">
                ← Back to classes
              </button>
              <h1 className="mt-4 text-4xl font-extrabold text-gray-800">{classInfo.className}</h1>
              <p className="text-gray-500">{classInfo.description}</p>
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
                  <p className="uppercase tracking-[0.25em] text-white/80 text-sm font-semibold">stream overview</p>
                  <h2 className="mt-3 text-4xl font-extrabold leading-snug">Stay On Track</h2>
                  <p className="mt-3 text-white/80 text-base max-w-2xl">
                    Receive announcements, explore shared resources, and remain aligned with your class's learning journey.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <div className="mt-4 lg:mt-6">
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setActiveTab("newsfeed")}
                className={`px-6 py-2 rounded-full text-base font-bold border transition-transform duration-200 ${
                  activeTab === "newsfeed"
                    ? "bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Newsfeed
              </button>
              <button
                onClick={() => setActiveTab("classwork")}
                className={`px-6 py-2 rounded-full text-base font-bold border transition-transform duration-200 ${
                  activeTab === "classwork"
                    ? "bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Classwork
              </button>
              <button
                onClick={() => setActiveTab("people")}
                className={`px-6 py-2 rounded-full text-base font-bold border transition-transform duration-200 ${
                  activeTab === "people"
                    ? "bg-[#2d7bf3] text-white border-[#2d7bf3] shadow-lg shadow-blue-200/40"
                    : "bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5"
                }`}
              >
                Class People
              </button>
              <button
                onClick={() => navigate("/compiler")}
                className={`px-6 py-2 rounded-full text-base font-bold border transition-transform duration-200 bg-white text-[#2d7bf3] border-white/40 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5`}
              >
                Coding Playground
              </button>
              
              {/* Grades tab removed for student view */}
            </div>
          </div>

          {activeTab === "newsfeed" && (
            <section className="grid gap-8 xl:grid-cols-[1.8fr_1fr]">
              <div className="space-y-6">
                <div className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
                  <div className="mt-6">
                    <AnnouncementsList announcements={announcements} API_BASE_URL={API_BASE_URL} getAttachmentIcon={getAttachmentIcon} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
                  <h3 className="text-xl font-bold text-gray-800">Upcoming</h3>
                  <p className="mt-3 text-base text-gray-500">No scheduled tasks yet. Ask your instructor to post activities.</p>
                </div>
              </div>
            </section>
          )}

          {activeTab === "classwork" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">Classwork</h3>
                  <p className="text-base text-gray-500">View activities posted by your instructor.</p>
                </div>
              </div>

              {activities.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {activities.map((activity) => {
                    let config = activity.config_json;
                    if (typeof config === "string") {
                      try {
                        config = JSON.parse(config);
                      } catch (e) {
                        config = {};
                      }
                    }

                    const isPastDue = (() => {
                      try {
                        const d = config && config.due_date_time ? new Date(config.due_date_time) : null;
                        return d ? new Date() > d : false;
                      } catch (e) {
                        return false;
                      }
                    })();

                    const isNotOpen = (() => {
                      try {
                        const o = config && config.open_date_time ? new Date(config.open_date_time) : null;
                        return o ? new Date() < o : false;
                      } catch (e) {
                        return false;
                      }
                    })();

                    return (
                      <div
                        key={activity.activity_id}
                        className="relative rounded-3xl bg-white ring-1 ring-gray-200 border-2 border-dashed border-gray-200 shadow-sm hover:shadow-md transition p-4 overflow-hidden"
                      >
                        {/* left accent stripe */}
                        <div className="absolute left-0 top-0 bottom-0 w-3 -translate-x-1 rounded-l-3xl bg-gradient-to-b from-green-600 to-green-400 shadow-inner" />

                        {/* status badge moved into the center column for aligned layout */}

                        <div className="flex items-center gap-6 pl-6">
                          {/* left column: title + tags */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="min-w-0">
                                <h4 className="text-2xl font-extrabold italic text-gray-900 leading-tight truncate">{activity.title}</h4>
                                {config.instructions && <p className="text-sm text-gray-500 mt-1 truncate max-w-xl">{config.instructions}</p>}
                              </div>

                              {/* small vertical chunk removed for clean right column */}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-3">
                              {['Sim Pc','Quiz','Code Block Activity','DIY Activity'].map((type)=> (
                                <button 
                                  key={type} 
                                  onClick={() => {
                                    if (!activity.my_submission) {
                                      openActivity(activity);
                                    }
                                  }}
                                  disabled={!!activity.my_submission}
                                  className={`px-3 py-1 rounded-full text-sm font-semibold border transition ${
                                    config.activity_name === type 
                                      ? activity.my_submission
                                        ? 'bg-gray-400 text-white border-gray-400 cursor-not-allowed opacity-60'
                                        : 'bg-blue-600 text-white border-blue-600' 
                                      : 'bg-white text-gray-700 border-gray-200'
                                  }`}
                                  title={activity.my_submission ? "Already submitted - request new attempt to modify" : ""}
                                >
                                  {config.activity_name === type && activity.my_submission && '✓ '}
                                  {type}
                                </button>
                              ))}
                            </div>

                            {activity.attachments && activity.attachments.length > 0 && (
                              <div className="mt-3 text-sm text-gray-600">📎 {activity.attachments.length} attachment{activity.attachments.length !== 1 ? 's' : ''}</div>
                            )}
                          </div>

                          {/* center column with separator and dates */}
                          <div className="flex flex-col items-center justify-center text-center px-6 border-l border-r border-gray-100">
                            {/* centered status badge */}
                            <div className={`mb-2 text-sm font-semibold px-3 py-1 rounded-full ${isNotOpen || isPastDue ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
                              {isNotOpen || isPastDue ? "NOT - ACTIVE" : "ACTIVE"}
                            </div>
                            <div className="flex items-center gap-4 mb-2">
                              {config.open_date_time ? (
                                <div className="min-w-[120px]">
                                  <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-black inline" fill="currentColor" aria-hidden="true">
                                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM5 9h14v10H5z" />
                                    </svg>
                                    Open
                                  </p>
                                  <div className="text-sm text-gray-700">{new Date(config.open_date_time).toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-400 mt-0">{new Date(config.open_date_time).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</div>
                                </div>
                              ) : null}

                              {config.due_date_time ? (
                                <div className="min-w-[120px]">
                                  <p className="text-xs text-gray-500 uppercase font-medium flex items-center justify-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4 text-black inline" fill="currentColor" aria-hidden="true">
                                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zM5 9h14v10H5z" />
                                    </svg>
                                    Due
                                  </p>
                                  <div className="text-sm text-gray-700">{new Date(config.due_date_time).toLocaleDateString()}</div>
                                  <div className="text-xs text-gray-400 mt-0">{new Date(config.due_date_time).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}</div>
                                </div>
                              ) : null}
                            </div>
                          </div>

                          {/* right column: turned-in + grade */}
                          <div className="flex flex-col items-center justify-center gap-3 pl-6 pr-3">
                            {activity.my_submission && (
                              <div className="px-4 py-2 rounded-full bg-green-500 text-white text-base font-extrabold tracking-wide">TURNED IN</div>
                            )}

                            {/* grade box */}
                            {activity.my_submission && activity.my_submission.grade !== null ? (
                              <div className="w-24 h-24 bg-white border-2 border-black rounded-lg flex items-center justify-center">
                                <div className="text-4xl font-extrabold text-black leading-none">{Number.isFinite(Number(activity.my_submission.grade)) ? Number(activity.my_submission.grade).toFixed(0) : activity.my_submission.grade}</div>
                              </div>
                            ) : (
                              <div className="w-24 h-24 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center text-sm text-gray-500">—</div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <p className="text-gray-500">No activities yet. Ask your instructor to post activities.</p>
                </div>
              )}
            </section>
          )}

          {/* SimPC Activity View - Full Screen */}
          {isSimPCOpen && selectedActivity && (
            <SimPCActivityView
              activity={selectedActivity}
              onBack={() => {
                setIsSimPCOpen(false);
                setSelectedActivity(null);
              }}
              onSubmit={() => {
                setIsSimPCOpen(false);
                setSelectedActivity(null);
              }}
            />
          )}

          {/* CodeLab Activity View - Full Screen */}
          {isCodeLabOpen && selectedActivity && (
            <CodeLabActivityView
              activity={selectedActivity}
              onBack={() => {
                setIsCodeLabOpen(false);
                setSelectedActivity(null);
              }}
              onSubmit={() => {
                setIsCodeLabOpen(false);
                setSelectedActivity(null);
              }}
            />
          )}

          {/* Quiz Activity View - Full Screen */}
          {isQuizOpen && selectedActivity && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 my-8 shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
                  <h2 className="text-2xl font-extrabold text-gray-800">{selectedActivity.title}</h2>
                  <button 
                    onClick={() => {
                      setIsQuizOpen(false);
                      setSelectedActivity(null);
                      setQuizAttemptId(null);
                    }} 
                    className="text-gray-400 hover:text-gray-600 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  <QuizAttempt 
                    quizId={linkedQuizId}
                    activityId={selectedActivity.activity_id}
                    onSubmit={(results) => {
                      // Quiz submitted successfully
                      alert("Quiz submitted successfully!");
                      setIsQuizOpen(false);
                      setSelectedActivity(null);
                      setQuizAttemptId(null);
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Activity Details Modal */}
          {selectedActivity && !isSimPCOpen && !isCodeLabOpen && !isCodeBlockOpen && !isQuizOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
              <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 my-8 shadow-2xl">
                {/* Enhanced Header */}
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
                  <span className="px-3 py-1 rounded-full text-xs font-bold text-white bg-blue-400">
                    📋 DETAILS
                  </span>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {(() => {
                    let cfg = selectedActivity.config_json;
                    if (typeof cfg === "string") {
                      try {
                        cfg = JSON.parse(cfg);
                      } catch (e) {
                        cfg = {};
                      }
                    }

                    return (
                      <>
                        {/* Activity Info Card */}
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 p-6 shadow-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Activity Type */}
                            <div>
                              <p className="text-xs font-bold text-gray-600 uppercase tracking-wide mb-3">📝 Activity Type</p>
                              <div className="flex flex-wrap gap-2">
                                {["Code Block Activity", "CodeLab", "Sim Pc", "Quiz", "DIY Activity"].map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => {
                                      if (cfg.activity_name === type) {
                                        if (type === "CodeLab") {
                                          setIsCodeLabOpen(true);
                                        } else if (type === "Sim Pc") {
                                          setIsSimPCOpen(true);
                                        } else if (type === "Code Block Activity") {
                                          setIsCodeBlockOpen(true);
                                        } else if (type === "Quiz") {
                                          setIsQuizOpen(true);
                                        }
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-full text-sm font-semibold transition transform ${cfg.activity_name === type ? "bg-blue-600 text-white shadow-md scale-105" : "bg-white text-gray-700 border border-gray-300 hover:border-blue-400"}`}
                                  >
                                    {type === "Code Block Activity" ? "📦" : type === "CodeLab" ? "💻" : type === "Sim Pc" ? "🖥️" : type === "Quiz" ? "❓" : "🔧"} {type}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Key Metrics */}
                            <div className="grid grid-cols-2 gap-3">
                              {cfg.open_date_time && (
                                <div className="bg-white rounded-lg p-3 border border-blue-200">
                                  <p className="text-xs font-bold text-gray-600 uppercase">🔓 Opens</p>
                                  <p className="text-sm font-semibold text-blue-600 mt-1">{new Date(cfg.open_date_time).toLocaleDateString()}</p>
                                  <p className="text-xs text-gray-500">{new Date(cfg.open_date_time).toLocaleTimeString()}</p>
                                </div>
                              )}
                              {cfg.due_date_time && (
                                <div className="bg-white rounded-lg p-3 border border-red-200">
                                  <p className="text-xs font-bold text-gray-600 uppercase">⏱️ Due</p>
                                  <p className="text-sm font-semibold text-red-600 mt-1">{new Date(cfg.due_date_time).toLocaleDateString()}</p>
                                  <p className="text-xs text-gray-500">{new Date(cfg.due_date_time).toLocaleTimeString()}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Instructions Card */}
                        {cfg.instructions && (
                          <div className="bg-white rounded-xl border-l-4 border-blue-500 p-6 shadow-sm hover:shadow-md transition">
                            <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                              <span>📖 Instructions</span>
                            </h4>
                            <p className="text-gray-700 text-base leading-relaxed whitespace-pre-line">{cfg.instructions}</p>
                          </div>
                        )}

                        {/* Attachments Card */}
                        {selectedActivity?.attachments && selectedActivity.attachments.length > 0 && (
                          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm hover:shadow-md transition">
                            <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <span>📎 Resources & Attachments</span>
                              <span className="ml-auto px-2 py-1 rounded-full bg-gray-200 text-gray-700 text-sm font-semibold">{selectedActivity.attachments.length}</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {selectedActivity.attachments.map((att, idx) => {
                                let fileUrl = "#";
                                let downloadUrl = "#";
                                if (att.url && att.url.startsWith("http")) {
                                  fileUrl = att.url;
                                  downloadUrl = att.url;
                                } else if (att.file_path && typeof att.file_path === "string") {
                                  if (att.file_path.startsWith("http")) {
                                    fileUrl = att.file_path;
                                    downloadUrl = att.file_path;
                                  } else if (att.file_path.startsWith("/")) {
                                    fileUrl = `${API_BASE_URL}${att.file_path}`;
                                  } else {
                                    fileUrl = `${API_BASE_URL}/${att.file_path}`;
                                  }
                                } else if (att.stored_name) {
                                  fileUrl = `${API_BASE_URL}/uploads/activity_files/${att.stored_name}`;
                                  downloadUrl = `${API_BASE_URL}/activity/download/${encodeURIComponent(att.stored_name)}`;
                                }
                                if (!downloadUrl || downloadUrl === "#") {
                                  if (att.stored_name) downloadUrl = `${API_BASE_URL}/activity/download/${encodeURIComponent(att.stored_name)}`;
                                  else downloadUrl = fileUrl;
                                }

                                const isImage = att.mime_type && att.mime_type.startsWith("image/");
                                const isVideo = att.mime_type && att.mime_type.startsWith("video/");
                                const isPdf = att.mime_type && att.mime_type.includes("pdf");

                                return (
                                  <div key={att.id || idx} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-white hover:shadow-md transition">
                                    <div className="flex items-start gap-3 mb-3">
                                      <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg font-bold text-blue-600 flex-shrink-0 text-lg">
                                        {isImage ? "🖼️" : isVideo ? "🎬" : isPdf ? "📄" : "📎"}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{att.original_name || att.file_name}</p>
                                        <p className="text-xs text-gray-500">{att.mime_type || "Unknown"}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      {(isImage || isVideo) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setAttachmentPreview({ type: isImage ? "image" : "video", src: fileUrl, name: att.original_name || att.file_name });
                                          }}
                                          className="flex-1 px-3 py-2 rounded-lg bg-purple-100 text-purple-700 text-xs font-bold hover:bg-purple-200 transition"
                                        >
                                          👁️ Preview
                                        </button>
                                      )}
                                      {(isImage || isPdf) && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCanvasEditorData({
                                              fileUrl,
                                              mimeType: att.mime_type,
                                              filename: att.original_name || att.file_name,
                                            });
                                            setCanvasEditorOpen(true);
                                          }}
                                          className="flex-1 px-3 py-2 rounded-lg bg-orange-100 text-orange-700 text-xs font-bold hover:bg-orange-200 transition"
                                          title="Edit with canvas"
                                        >
                                          ✏️ Annotate
                                        </button>
                                      )}
                                      <a href={downloadUrl} target="_blank" rel="noreferrer" download className="flex-1 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold hover:bg-blue-200 transition text-center">
                                        ⬇️ Download
                                      </a>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Submission Form */}
                        <div className="pt-4 border-t border-gray-200">
                          <h4 className="text-base font-bold text-gray-800 mb-3">Submit your work</h4>

                          {/* Show grade and feedback if available */}
                          {mySubmission && (mySubmission.grade !== null || mySubmission.feedback) && (
                            <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-green-700 font-bold">Grade:</span>
                                <span className="px-3 py-1 rounded bg-green-200 text-green-900 font-semibold">{mySubmission.grade !== null ? mySubmission.grade : "-"}</span>
                              </div>
                              {mySubmission.feedback && (
                                <div className="text-green-700 text-base">
                                  <span className="font-bold">Feedback:</span> {mySubmission.feedback}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="space-y-4">
                            <div>
                              <label className="block text-base font-bold text-gray-700 mb-2">Your response</label>
                              <textarea
                                value={submissionText}
                                onChange={(e) => setSubmissionText(e.target.value)}
                                placeholder="Share your response or feedback..."
                                rows="4"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                              />
                            </div>

                            <div>
                              <label className="block text-base font-bold text-gray-700 mb-2">Attach files (optional)</label>

                              {/* Show previously uploaded submission attachments (read-only) */}
                              {existingSubmissionAttachments.length > 0 && (
                                <div className="mb-3 space-y-2">
                                  {(() => {
                                    const { latest } = splitCurrentAndHistory(existingSubmissionAttachments);
                                    return latest.map((att, idx) => {
                                    let href = "#";
                                    // Build href from url, file_path, or stored_name
                                    if (att.url && typeof att.url === "string") {
                                      if (att.url.startsWith("http")) {
                                        href = att.url;
                                      } else if (att.url.startsWith("/")) {
                                        href = `${API_BASE_URL}${att.url}`;
                                      } else if (att.url.includes("uploads")) {
                                        href = `${API_BASE_URL}/${att.url}`;
                                      } else {
                                        href = `${API_BASE_URL}/${att.url}`;
                                      }
                                    } else if (att.file_path && typeof att.file_path === "string") {
                                      if (att.file_path.startsWith("http")) {
                                        href = att.file_path;
                                      } else if (att.file_path.startsWith("/")) {
                                        href = `${API_BASE_URL}${att.file_path}`;
                                      } else {
                                        href = `${API_BASE_URL}/${att.file_path}`;
                                      }
                                    } else if (att.stored_name && typeof att.stored_name === "string") {
                                      href = `${API_BASE_URL}/uploads/activity_files/${att.stored_name}`;
                                    }

                                    const isImage = att.mime_type && att.mime_type.startsWith("image/");
                                    const isVideo = att.mime_type && att.mime_type.startsWith("video/");

                                    return (
                                      <div key={att.id || idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (isImage || isVideo) {
                                              setAttachmentPreview({ type: isImage ? "image" : "video", src: href, name: att.original_name || att.file_name });
                                            } else {
                                              window.open(href, "_blank", "noopener");
                                            }
                                          }}
                                          className="flex items-center gap-3 min-w-0 flex-1 text-left hover:opacity-80 transition"
                                        >
                                          <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center text-xl flex-shrink-0">{getAttachmentIcon(att.mime_type)}</div>
                                          <div className="min-w-0">
                                            <p className="text-base text-gray-700 truncate">{att.original_name || att.file_name}</p>
                                            <p className="text-sm text-gray-500">Previously uploaded</p>
                                          </div>
                                        </button>
                                        <a href={href} target="_blank" rel="noreferrer" download className="px-2 py-1 rounded bg-blue-100 text-blue-700 text-sm font-bold flex-shrink-0 ml-2">
                                          Download
                                        </a>
                                      </div>
                                    );
                                    });
                                    })()}
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  if (!selectedActivityIsPastDue) submissionFileInputRef.current?.click();
                                  else alert("This activity is past due. You cannot add attachments.");
                                }}
                                disabled={selectedActivityIsPastDue}
                                className={`px-4 py-2 rounded-lg text-base font-bold ${selectedActivityIsPastDue ? "bg-gray-200 text-gray-500 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"}`}
                              >
                                Add attachment
                              </button>
                              <input ref={submissionFileInputRef} type="file" multiple className="hidden" onChange={(e) => handleAddSubmissionFile(e.target.files)} />

                              {submissionAttachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {submissionAttachments.map((file, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded">
                                      <span className="text-base text-gray-700">{file.name}</span>
                                      <button type="button" onClick={() => handleRemoveSubmissionFile(idx)} className="text-red-600 hover:text-red-700 text-base font-bold">
                                        Remove
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 flex gap-3 justify-end bg-gray-50 rounded-b-2xl">
                  {selectedActivityIsPastDue && (
                    <div className="flex-1 text-left text-base text-red-600 font-bold">note: this activity is past due — attachments and submit are disabled</div>
                  )}
                  {selectedActivityIsNotOpen && (
                    <div className="flex-1 text-left text-base text-yellow-700 font-bold">note: this activity is not open yet — opens at {new Date(selectedActivity.config_json?.open_date_time || selectedActivity.open_date_time).toLocaleString()}</div>
                  )}
                  <button onClick={() => setSelectedActivity(null)} className="px-6 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition">
                    Close
                  </button>
                  {mySubmission ? (
                    // Show "Request New Attempt" button when submission exists
                    <button
                      onClick={handleRequestNewAttempt}
                      disabled={requestingNewAttempt || selectedActivityIsPastDue}
                      className={`px-6 py-2 rounded-lg font-medium transition ${
                        requestingNewAttempt || selectedActivityIsPastDue
                          ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                          : "bg-amber-500 text-white hover:bg-amber-600"
                      }`}
                    >
                      {requestingNewAttempt ? "Requesting..." : "🔄 Request New Attempt"}
                    </button>
                  ) : (
                    // Show "Submit" button when no submission exists
                    <button
                      onClick={handleSubmitActivity}
                      disabled={selectedActivityIsPastDue || selectedActivityIsNotOpen}
                      className={`px-6 py-2 rounded-lg ${selectedActivityIsPastDue || selectedActivityIsNotOpen ? "bg-gray-300 text-gray-600 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"} font-medium transition`}
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attachment Preview Modal */}
          {attachmentPreview && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60" onClick={() => setAttachmentPreview(null)}>
              <div className="max-w-[90vw] max-h-[90vh] bg-white rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <div className="p-3 border-b flex items-center justify-between">
                  <div className="text-base font-semibold">{attachmentPreview.name}</div>
                  <button onClick={() => setAttachmentPreview(null)} className="px-3 py-1 rounded bg-gray-100">
                    Close
                  </button>
                </div>
                <div className="p-4">
                  {attachmentPreview.type === "image" ? (
                    <img src={attachmentPreview.src} alt={attachmentPreview.name} className="max-w-full max-h-[75vh] object-contain" />
                  ) : (
                    <video src={attachmentPreview.src} controls className="max-w-full max-h-[75vh]" />
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "people" && (
            <section className="rounded-3xl bg-white shadow-lg border border-white/60 px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Class People</h3>
                <button onClick={fetchMembers} className="ml-3 px-3 py-1 rounded-md bg-gray-100 text-gray-700 text-base hover:bg-gray-200">
                  Refresh
                </button>
              </div>

              {members.length > 0 ? (
                <div className="space-y-3">
                  <div className="text-base text-gray-600 mb-4">
                    <span className="font-semibold text-gray-700">{members.length}</span> student{members.length !== 1 ? "s" : ""} enrolled
                  </div>
                  <div className="grid gap-3">
                    {members.map((member) => (
                      <div key={member.user_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-base">
                            {member.avatarUrl ? (
                              <img src={member.avatarUrl} alt={`${member.username} avatar`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white font-semibold text-base">{member.username?.charAt(0)?.toUpperCase()}</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-gray-800 truncate">{member.username}</p>
                            <p className="text-sm text-gray-500 truncate">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="inline-flex px-3 py-1 text-sm font-bold rounded-full bg-blue-100 text-blue-700">Student</span>
                          <span className="text-sm text-gray-500">Joined {new Date(member.joined_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-2">No students enrolled yet</p>
                  <p className="text-base text-gray-400">You will see other students here once they join the class</p>
                </div>
              )}
            </section>
          )}
        </main>

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

export default StudentSubclass;

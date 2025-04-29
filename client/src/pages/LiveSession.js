import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import axios from 'axios';
import Chat from '../components/Chat';

function LiveSession() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchCourse();
    // Get user from localStorage
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    const interval = setInterval(fetchCourse, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourse(response.data);
      
      // Find active live session
      const active = response.data.lessons.find(
        lesson => lesson.isLive && lesson.liveSession.status === 'ongoing'
      );
      setActiveSession(active);
    } catch (err) {
      setError('Failed to fetch course data');
    } finally {
      setLoading(false);
    }
  };

  const startSession = async (lessonId) => {
    try {
      const response = await axios.post(`/api/courses/${courseId}/lessons/${lessonId}/start`);
      const { meetingUrl, meetingId, password } = response.data;
      
      // Open Zoom meeting in a new tab
      window.open(meetingUrl, '_blank');
      fetchCourse();
    } catch (err) {
      setError('Failed to start live session');
    }
  };

  const endSession = async (lessonId) => {
    try {
      await axios.post(`/api/courses/${courseId}/lessons/${lessonId}/end`);
      fetchCourse();
    } catch (err) {
      setError('Failed to end live session');
    }
  };

  const handleJoinClick = (lesson) => {
    setSelectedLesson(lesson);
    setJoinDialogOpen(true);
  };

  const handleJoinSession = async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/lessons/${selectedLesson._id}/meeting`);
      const { meetingUrl } = response.data;
      window.open(meetingUrl, '_blank');
      setJoinDialogOpen(false);
      setPassword('');
    } catch (error) {
      console.error('Error joining session:', error);
    }
  };

  const getSessionStatus = (lesson) => {
    if (!lesson.isLive) return null;
    
    const now = new Date();
    const startTime = new Date(lesson.liveSession.startTime);
    const endTime = new Date(lesson.liveSession.endTime);
    
    if (now < startTime) return 'Scheduled';
    if (now > endTime) return 'Completed';
    return 'Ongoing';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  if (!course || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Live Sessions - {course.title}
            </Typography>
            {course.lessons.map((lesson) => (
              <Box key={lesson._id} sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="h6">{lesson.title}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Status: {lesson.liveSession?.status || 'Not started'}
                </Typography>
                {lesson.liveSession?.status === 'active' && (
                  <Typography variant="body2" color="textSecondary">
                    Meeting ID: {lesson.liveSession.meetingId}
                  </Typography>
                )}
                <Box sx={{ mt: 2 }}>
                  {user.role === 'teacher' ? (
                    <>
                      {lesson.liveSession?.status === 'active' ? (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={() => endSession(lesson._id)}
                        >
                          End Session
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => startSession(lesson._id)}
                        >
                          Start Session
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => handleJoinClick(lesson)}
                      disabled={lesson.liveSession?.status !== 'active'}
                    >
                      Join Session
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          {course.lessons.some(lesson => lesson.liveSession?.status === 'active') && (
            <Chat
              meetingId={course.lessons.find(lesson => lesson.liveSession?.status === 'active')?.liveSession?.meetingId}
              userId={user._id}
              userName={user.name}
            />
          )}
        </Grid>
      </Grid>

      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)}>
        <DialogTitle>Join Live Session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Meeting Password"
            type="password"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleJoinSession} color="primary">
            Join
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default LiveSession; 
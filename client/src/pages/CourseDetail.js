import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  Avatar,
  Rating,
} from '@mui/material';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import axios from 'axios';

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentLesson, setCurrentLesson] = useState(null);
  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`/api/courses/${id}`);
        setCourse(response.data);
        if (response.data.lessons.length > 0) {
          setCurrentLesson(response.data.lessons[0]);
        }
        
        // Check if user is enrolled
        const enrollmentResponse = await axios.get(`/api/courses/${id}/enrollment`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setIsEnrolled(enrollmentResponse.data.isEnrolled);
      } catch (err) {
        setError('Failed to load course details');
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [id]);

  const handleEnroll = async () => {
    try {
      await axios.post(`/api/courses/${id}/enroll`, null, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });
      setIsEnrolled(true);
    } catch (err) {
      setError('Failed to enroll in the course');
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Course Content */}
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h4" component="h1" gutterBottom>
                {course.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Chip
                  label={course.category}
                  color="primary"
                  sx={{ mr: 2 }}
                />
                <Rating value={4.5} precision={0.5} readOnly />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  (120 reviews)
                </Typography>
              </Box>
              <Typography variant="body1" paragraph>
                {course.description}
              </Typography>
            </Paper>

            {/* Video Player */}
            {currentLesson && (
              <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  {currentLesson.title}
                </Typography>
                <Box
                  sx={{
                    position: 'relative',
                    paddingTop: '56.25%', // 16:9 Aspect Ratio
                    backgroundColor: '#000',
                    borderRadius: 1,
                    overflow: 'hidden',
                  }}
                >
                  <video
                    controls
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                    }}
                    src={currentLesson.videoUrl}
                  />
                </Box>
              </Paper>
            )}

            {/* Course Content */}
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom>
                Course Content
              </Typography>
              <List>
                {course.lessons.map((lesson, index) => (
                  <React.Fragment key={lesson._id}>
                    <ListItem
                      button
                      onClick={() => setCurrentLesson(lesson)}
                      selected={currentLesson?._id === lesson._id}
                    >
                      <ListItemText
                        primary={`${index + 1}. ${lesson.title}`}
                        secondary={`${Math.floor(lesson.duration / 60)} min`}
                      />
                      <PlayCircleIcon color="primary" />
                    </ListItem>
                    {index < course.lessons.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Course Details
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Instructor
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <Avatar src={course.teacher.profilePicture} sx={{ mr: 2 }} />
                  <Typography variant="body1">
                    {course.teacher.name}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Price
                </Typography>
                <Typography variant="h5" color="primary">
                  ${course.price}
                </Typography>
              </Box>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleEnroll}
                disabled={isEnrolled}
              >
                {isEnrolled ? 'Enrolled' : 'Enroll Now'}
              </Button>
            </Paper>

            {/* Requirements */}
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Requirements
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText primary="Basic computer knowledge" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Internet connection" />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Dedication to learn" />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default CourseDetail; 
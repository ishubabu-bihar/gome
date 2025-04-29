import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

function CreateCourse() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    price: '',
    thumbnail: null,
    lessons: [],
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentLesson, setCurrentLesson] = useState({
    title: '',
    content: '',
    video: null,
    duration: '',
    isLive: false,
    startTime: '',
    endTime: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleLessonChange = (e) => {
    const { name, value } = e.target;
    setCurrentLesson({
      ...currentLesson,
      [name]: value,
    });
  };

  const handleThumbnailUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        thumbnail: file,
      });
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCurrentLesson({
        ...currentLesson,
        video: file,
      });
    }
  };

  const addLesson = () => {
    if (!currentLesson.title || (!currentLesson.video && !currentLesson.isLive)) {
      setError('Please fill in all lesson details');
      return;
    }

    if (currentLesson.isLive && (!currentLesson.startTime || !currentLesson.endTime)) {
      setError('Please specify start and end time for live session');
      return;
    }

    setFormData({
      ...formData,
      lessons: [
        ...formData.lessons,
        {
          ...currentLesson,
          order: formData.lessons.length + 1,
        },
      ],
    });

    setCurrentLesson({
      title: '',
      content: '',
      video: null,
      duration: '',
      isLive: false,
      startTime: '',
      endTime: '',
    });
  };

  const removeLesson = (index) => {
    const updatedLessons = formData.lessons.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      lessons: updatedLessons,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.title || !formData.description || !formData.category || !formData.price) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.lessons.length === 0) {
      setError('Please add at least one lesson');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('price', formData.price);
      if (formData.thumbnail) {
        formDataToSend.append('thumbnail', formData.thumbnail);
      }

      // Upload course data
      const response = await axios.post('/api/courses', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      });

      const courseId = response.data._id;

      // Upload lessons
      for (const lesson of formData.lessons) {
        const lessonData = new FormData();
        lessonData.append('title', lesson.title);
        lessonData.append('content', lesson.content);
        lessonData.append('duration', lesson.duration);
        lessonData.append('order', lesson.order);
        lessonData.append('video', lesson.video);

        await axios.post(`/api/courses/${courseId}/lessons`, lessonData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
      }

      setSuccess('Course created successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create course');
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Create New Course
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Course Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                multiline
                rows={4}
                label="Course Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  label="Category"
                  onChange={handleChange}
                >
                  <MenuItem value="Programming">Programming</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Business">Business</MenuItem>
                  <MenuItem value="Marketing">Marketing</MenuItem>
                  <MenuItem value="Language">Language</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleChange}
                InputProps={{
                  startAdornment: '$',
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
              >
                Upload Course Thumbnail
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleThumbnailUpload}
                />
              </Button>
              {formData.thumbnail && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Selected: {formData.thumbnail.name}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Add Lessons
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Lesson Title"
                    name="title"
                    value={currentLesson.title}
                    onChange={handleLessonChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Duration (minutes)"
                    name="duration"
                    type="number"
                    value={currentLesson.duration}
                    onChange={handleLessonChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    label="Lesson Content"
                    name="content"
                    value={currentLesson.content}
                    onChange={handleLessonChange}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={currentLesson.isLive}
                        onChange={(e) => setCurrentLesson({
                          ...currentLesson,
                          isLive: e.target.checked
                        })}
                        name="isLive"
                      />
                    }
                    label="Live Session"
                  />
                </Grid>
                {currentLesson.isLive ? (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Start Time"
                        type="datetime-local"
                        name="startTime"
                        value={currentLesson.startTime}
                        onChange={handleLessonChange}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="End Time"
                        type="datetime-local"
                        name="endTime"
                        value={currentLesson.endTime}
                        onChange={handleLessonChange}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    </Grid>
                  </>
                ) : (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                    >
                      Upload Video
                      <input
                        type="file"
                        hidden
                        accept="video/*"
                        onChange={handleVideoUpload}
                      />
                    </Button>
                    {currentLesson.video && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        Selected: {currentLesson.video.name}
                      </Typography>
                    )}
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={addLesson}
                    fullWidth
                  >
                    Add Lesson
                  </Button>
                </Grid>
              </Grid>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Course Lessons
              </Typography>
              <List>
                {formData.lessons.map((lesson, index) => (
                  <ListItem key={index}>
                    <ListItemText
                      primary={`${index + 1}. ${lesson.title}`}
                      secondary={
                        lesson.isLive
                          ? `Live Session: ${new Date(lesson.startTime).toLocaleString()} - ${new Date(lesson.endTime).toLocaleString()}`
                          : `Duration: ${lesson.duration} minutes`
                      }
                    />
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        onClick={() => removeLesson(index)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                Create Course
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default CreateCourse; 
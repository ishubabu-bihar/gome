import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
} from '@mui/material';
import axios from 'axios';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // TODO: Replace with your actual API endpoint
        const response = await axios.get('/api/users/me', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        setUser(response.data);
        
        // Fetch courses based on user role
        const coursesResponse = await axios.get(
          user?.role === 'teacher' ? '/api/courses/my-courses' : '/api/courses/enrolled',
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        setCourses(coursesResponse.data);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user?.role]);

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
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome, {user?.name}!
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          {user?.role === 'teacher' ? 'Your Teaching Dashboard' : 'Your Learning Dashboard'}
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {courses.map((course) => (
          <Grid item key={course._id} xs={12} sm={6} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {course.title}
                </Typography>
                <Typography color="text.secondary" gutterBottom>
                  {course.category}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {course.description}
                </Typography>
                {user?.role === 'teacher' && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Students enrolled: {course.students?.length || 0}
                  </Typography>
                )}
              </CardContent>
              <CardActions>
                <Button size="small" color="primary">
                  {user?.role === 'teacher' ? 'Manage Course' : 'Continue Learning'}
                </Button>
                <Button size="small" color="primary">
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {user?.role === 'teacher' && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Button variant="contained" color="primary" size="large">
            Create New Course
          </Button>
        </Box>
      )}
    </Container>
  );
}

export default Dashboard; 
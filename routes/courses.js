const express = require('express');
const router = express.Router();
const Course = require('../models/Course');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const zoomService = require('../services/zoomService');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = uuidv4() + path.extname(file.originalname);
    cb(null, uniqueSuffix);
  }
});

const upload = multer({ storage: storage });

// Create a new course
router.post('/', auth, upload.single('thumbnail'), async (req, res) => {
  try {
    const { title, description, category, price } = req.body;
    
    const course = new Course({
      title,
      description,
      category,
      price,
      teacher: req.user.id,
      thumbnail: req.file ? req.file.path : null
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Add a lesson to a course
router.post('/:courseId/lessons', auth, upload.single('video'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { title, content, duration, isLive, startTime, endTime } = req.body;
    
    const lesson = {
      title,
      content,
      duration,
      order: course.lessons.length + 1,
      isLive: isLive === 'true',
      videoUrl: req.file ? req.file.path : null
    };

    if (isLive === 'true') {
      lesson.liveSession = {
        startTime,
        endTime,
        status: 'scheduled'
      };
    }

    course.lessons.push(lesson);
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Start a live session
router.post('/:courseId/lessons/:lessonId/start', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (!lesson.isLive) {
      return res.status(400).json({ message: 'This is not a live lesson' });
    }

    // Create Zoom meeting
    const meeting = await zoomService.createMeeting(
      `${course.title} - ${lesson.title}`,
      lesson.liveSession.startTime,
      lesson.duration,
      uuidv4().substring(0, 8) // Generate a random password
    );

    lesson.liveSession.status = 'ongoing';
    lesson.liveSession.meetingUrl = meeting.join_url;
    lesson.liveSession.meetingId = meeting.id;
    lesson.liveSession.password = meeting.password;
    
    await course.save();
    res.json({
      meetingUrl: meeting.join_url,
      meetingId: meeting.id,
      password: meeting.password
    });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// End a live session
router.post('/:courseId/lessons/:lessonId/end', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    lesson.liveSession.status = 'completed';
    await course.save();
    res.json({ message: 'Live session ended successfully' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get meeting details
router.get('/:courseId/lessons/:lessonId/meeting', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (!lesson.isLive || !lesson.liveSession.meetingId) {
      return res.status(400).json({ message: 'No meeting found for this lesson' });
    }

    const meeting = await zoomService.getMeeting(lesson.liveSession.meetingId);
    res.json(meeting);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get meeting participants
router.get('/:courseId/lessons/:lessonId/participants', auth, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.teacher.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const lesson = course.lessons.id(req.params.lessonId);
    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    if (!lesson.isLive || !lesson.liveSession.meetingId) {
      return res.status(400).json({ message: 'No meeting found for this lesson' });
    }

    const participants = await zoomService.getMeetingParticipants(lesson.liveSession.meetingId);
    res.json(participants);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single course
router.get('/:id', async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email');
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router; 
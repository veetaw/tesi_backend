var express = require('express');
var router = express.Router();

const Courses = require('../services/courses');
var authenticateToken = require('../middleware/authenticateToken');

var coursesORM = new Courses();

router.get('/corsi', authenticateToken, async function(req, res, next) {
  res.json(await coursesORM.getAllCourses());
});

router.get('/corso/:id', authenticateToken, async function(req, res, next) {
  res.json(await coursesORM.getCourseInfo(req.params.id));
});

module.exports = router;

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

router.post("/leaderboard", authenticateToken, async function (req, res, next) {
  var resp = await coursesORM.savePoints(req.user.name, req.user.user_id, req.body.course_id, req.body.points);

  res.json(resp); 
});

router.get("/leaderboard/:id", authenticateToken, async function (req, res, next) {
  var resp = await coursesORM.getLeaderboard(req.params.id);

  res.json(resp);
});


module.exports = router;

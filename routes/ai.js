var express = require("express");
var authenticateToken = require("../middleware/authenticateToken");

const ClaudeAI = require("../services/claude-ai");

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

var router = express.Router();
var apiWrapper = new ClaudeAI();

router.post(
  "/createCourse",
  authenticateToken,
  async function (req, res, next) {
    const { course_name, argomenti } = req.body;

    if (course_name == null || argomenti == null) {
      res.json({ ok: false });
      return;
    }
    res.json({ ok: true, message: "Il corso sarà disponibile a breve" });

    try {
      await apiWrapper.create_course(course_name, argomenti);
    } catch (e) {
      console.log(e);
    }
  }
);

router.get("/genMCQ", authenticateToken, async function (req, res, next) {
  if (req.query.nr_domande == null || req.query.argomento == null) {
    res.json({ error: 404 });
    return;
  }

  var apiResponse = await apiWrapper.gen_mcq(
    req.query.argomento,
    req.query.nr_domande
  );
  res.send(apiResponse);
});

router.get("/genOQ", authenticateToken, async function (req, res, next) {
  if (req.query.nr_domande == null || req.query.argomento == null) {
    res.json({ error: 404 });
    return;
  }

  var apiResponse = await apiWrapper.gen_oq(
    req.query.argomento,
    req.query.nr_domande
  );
  res.send(apiResponse);
});

router.post("/checkOQ", authenticateToken, async function (req, res, next) {
  var resp = await apiWrapper.check_oq(req.body.domanda, req.body.risposta);

  res.json(resp);
});

router.post(
  "/explain",
  authenticateToken,
  upload.single("appunti"),
  async function (req, res, next) {
    const fileBuffer = req.file.buffer;

    var resp = await apiWrapper.explain(
      req.user,
      fileBuffer,
      req.body.highlight
    );

    res.json(resp);
  }
);

router.post(
  "/genQuizPdf",
  authenticateToken,
  upload.single("appunti"),
  async function (req, res, next) {
    const fileBuffer = req.file.buffer;

    var resp = await apiWrapper.gen_quiz_pdf(
      fileBuffer,
    );

    res.json(resp);
  }
);

router.post("/chat", authenticateToken, async function (req, res, next) {
  var resp = await apiWrapper.chat(req.user, req.body.domanda);

  res.json(resp);
});

router.post("/chatCourse", authenticateToken, async function (req, res, next) {
  var resp = await apiWrapper.chatCourse(
    req.user,
    req.body.course_id,
    req.body.domanda
  );

  res.json(resp);
});

router.post("/closeChat", authenticateToken, async function (req, res, next) {
  var resp = await apiWrapper.closeChat(req.user);

  res.json(resp);
});

module.exports = router;

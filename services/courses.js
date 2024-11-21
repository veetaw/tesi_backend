const {
  Corso,
  Level,
  MultipleChoiceQuestion,
  OpenQuestion,
  Leaderboard,
} = require("../models/model");

class Courses {
  async getAllCourses() {
    try {
      var corsi = await Corso.findAll();

      return corsi.map((corso) => corso.toBasicData());
    } catch (error) {
      console.log("Errore nella ricerca dei corsi!");
      return null;
    }
  }

  async getCourseInfo(id) {
    var corso = await Corso.findOne({
      where: { id: id },
      include: [
        {
          model: Level,
          as: "levels",
          include: [
            { model: MultipleChoiceQuestion, as: "multiple_choice" },
            { model: OpenQuestion, as: "open_questions" },
          ],
        },
      ],
    });

    return corso.toStructuredData();
  }

  async savePoints(user_name, user_id, course_id, points) {
    try {
      const existingEntry = await Leaderboard.findOne({
        where: { user_id: user_id, course_id: course_id },
      });

      if (existingEntry) {
        existingEntry.punteggio = parseInt(existingEntry.punteggio) + parseInt(points);
        await existingEntry.save();
      } else {
        console.log("creo nuovo punteggio");
        await Leaderboard.create({
          user_id: user_id,
          course_id: course_id,
          nome: user_name,
          punteggio: points,
        });
      }

      return true;
    } catch (error) {
      console.log("Errore nel salvataggio dei punti!", error);
      return null;
    }
  }

  async getLeaderboard(course_id) {
    try {
      var leaderboard = await Leaderboard.findAll({
        where: { course_id: course_id },
        order: [["punteggio", "DESC"]],
      });

      return leaderboard;
    } catch (error) {
      console.log("Errore nella ricerca della classifica!", error);
      return null;
    }
  }
}

module.exports = Courses;

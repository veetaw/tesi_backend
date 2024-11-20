const { Corso, Level, MultipleChoiceQuestion, OpenQuestion } = require("../models/model");

class Courses {
  async getAllCourses() {
    try {
      var corsi = await Corso.findAll();

      return corsi.map(corso => corso.toBasicData());;
    } catch (error) {
      console.log("Errore nella ricerca dei corsi!");
      return null;
    }
  }

  async getCourseInfo(id) {
    var corso = await Corso.findOne({
        where: {id: id},
        include: [{
          model: Level,
          as: "levels",
          include: [
            { model: MultipleChoiceQuestion, as: "multiple_choice" },
            { model: OpenQuestion, as: "open_questions" }
          ],
        }],
    });

    return corso.toStructuredData();
  }
}

module.exports = Courses;

// models.js
const { DataTypes } = require("sequelize");
const sequelize = require("../services/db");

// Modello Corso
const Corso = sequelize.define("Corso", {
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  argomenti: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

Corso.prototype.toBasicData = function () {
  return {
    id: this.id, 
    nome: this.nome,
    argomenti: this.argomenti,
  };
};

Corso.prototype.toStructuredData = function () {
  return {
    id: this.id,
    nome: this.nome,
    argomenti: this.argomenti,
    levels: this.levels ? this.levels.map((level) => ({
      livello: level.livello,
      open_questions: level.open_questions ? level.open_questions.map((oq) => ({
        domanda: oq.domanda,
        suggerimento: oq.suggerimento,
      })) : [],    
      multiple_choice: level.multiple_choice ? level.multiple_choice.map((mcq) => ({
        question: mcq.question,
        a: mcq.a,
        b: mcq.b,
        c: mcq.c,
        d: mcq.d,
        true: mcq.true,
        suggerimento: mcq.suggerimento,
        spiegazione: mcq.spiegazione,
      })) : [],
    })) : [],
  };
};

// Modello Level
const Level = sequelize.define("Level", {
  livello: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

// Modello MultipleChoiceQuestion
const MultipleChoiceQuestion = sequelize.define("MultipleChoiceQuestion", {
  question: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  a: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  b: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  c: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  d: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  true: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  suggerimento: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  spiegazione: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

// Modello OpenQuestion
const OpenQuestion = sequelize.define("OpenQuestion", {
  domanda: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  suggerimento: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

// Modello Leaderboard
const Leaderboard = sequelize.define("Leaderboard", {
  user_id: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  course_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  punteggio: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false,
  }
});

Corso.hasMany(Leaderboard, { as: "leaderboards", foreignKey: "course_id" });
Leaderboard.belongsTo(Corso, { foreignKey: "course_id" });

Corso.hasMany(Level, { as: "levels" });
Level.belongsTo(Corso);

Level.hasMany(MultipleChoiceQuestion, { as: "multiple_choice" });
MultipleChoiceQuestion.belongsTo(Level);

Level.hasMany(OpenQuestion, { as: "open_questions" });
OpenQuestion.belongsTo(Level);

module.exports = { Corso, Level, MultipleChoiceQuestion, OpenQuestion, Leaderboard };

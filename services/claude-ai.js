const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../secret.env") });
const Anthropic = require("@anthropic-ai/sdk");

const ClaudeConst = require("./claude-const.js");
const Prompt = require("./prompt.js");

const {
  Corso,
  Level,
  MultipleChoiceQuestion,
  OpenQuestion,
} = require("../models/model");
const { type } = require("os");
const { text } = require("express");

var history = [];
var oq_history = [];
var sessionHistory = {};
var appuntiHistory = {};

class ClaudeAI {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_AI_API_KEY,
    });
  }

  async create_course(nome_corso, argomenti) {
    var levels = [];

    for (let index = 0; index < 10; index++) {
      levels.push({
        livello: index,
        open_questions: await this.gen_oq(
          argomenti,
          Math.min(index + 1, 3),
          index + 1
        ),
        multiple_choice: await this.gen_mcq(
          argomenti,
          Math.min(index + 1, 6),
          index + 1
        ),
      });
    }

    var _corsoData = {
      nome: nome_corso,
      argomenti: argomenti,
      levels: levels,
    };

    await salvaCorso(_corsoData);
  }

  async gen_mcq(argomento, nr_domande, livello) {
    history.push({
      role: "user",
      content: Prompt.get_mcq_prompt(argomento, nr_domande, livello),
    });

    const message = await this.client.messages.create({
      max_tokens: ClaudeConst.CLAUDE_MAX_TOKENS,
      temperature: ClaudeConst.CLAUDE_TEMPERATURE,
      model: ClaudeConst.CLAUDE_MODEL,
      system: Prompt.SYS_MCQ_PROMPT,
      messages: history,
    });

    console.log("RAW MCQ RESPONSE", message.content[0].text);

    const sanitizedJsonText = message.content[0].text.replace(/[\r\n]+/g, " ");

    history.push({
      role: "assistant",
      content: sanitizedJsonText,
    });

    return JSON.parse(sanitizedJsonText);
  }

  async gen_oq(argomento, nr_domande, livello) {
    oq_history.push({
      role: "user",
      content: Prompt.get_oq_prompt(argomento, nr_domande, livello),
    });

    const message = await this.client.messages.create({
      max_tokens: ClaudeConst.CLAUDE_MAX_TOKENS,
      temperature: ClaudeConst.CLAUDE_TEMPERATURE,
      model: ClaudeConst.CLAUDE_MODEL,
      system: Prompt.SYS_OQ_PROMPT,
      messages: oq_history,
    });

    console.log("RAW OQ MESSAGE:", message.content[0].text);

    const sanitizedJsonText = message.content[0].text.replace(/[\r\n]+/g, " ");

    oq_history.push({
      role: "assistant",
      content: sanitizedJsonText,
    });

    return JSON.parse(sanitizedJsonText);
  }

  async check_oq(domanda, risposta) {
    const message = await this.client.messages.create({
      max_tokens: ClaudeConst.CLAUDE_MAX_TOKENS,
      temperature: ClaudeConst.CLAUDE_TEMPERATURE,
      model: ClaudeConst.CLAUDE_MODEL,
      system: Prompt.SYS_OQ_CHECK_PROMPT,
      messages: [
        {
          role: "user",
          content: Prompt.get_oq_check_prompt(domanda, risposta),
        },
      ],
    }); 

    console.log("RAW CHECK_OQ RESPONSE ", message.content[0].text);

    const sanitizedJsonText = message.content[0].text.replace(/[\r\n]+/g, " ");

    return JSON.parse(sanitizedJsonText);
  }

  async explain(token, pdfBuffer, highlight) {
    try {
      if (!sessionHistory[token]) {
        const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
            
        sessionHistory[token] = [
          {
            role: "user",
            content: [
              {
                type: 'document',
                source: {
                  media_type: 'application/pdf',
                  type: 'base64',
                  data: pdfBase64,
                },
              },
              {
                type: 'text',
                text: Prompt.get_explain_prompt(highlight)
              }
            ],
          },
        ];
      }
      

      const message = await this.client.messages.create({
        model: ClaudeConst.CLAUDE_MODEL,
        max_tokens: ClaudeConst.CLAUDE_MAX_TOKENS,
        temperature: ClaudeConst.CLAUDE_TEMPERATURE,
        system: Prompt.sys_explain_prompt,
        messages: sessionHistory[token],
      });

      console.log(message.content)

      console.log("RAW EXPLAIN RESPONSE ", message.content[0].text);

      const sanitizedJsonText = message.content[0].text.replace(
        /[\r\n]+/g,
        " "
      );

      sessionHistory[token].push({
        role: "assistant",
        content: sanitizedJsonText,
      });

      return JSON.parse(sanitizedJsonText);
    } catch (e) {
      console.log(e);
    }
  }

  async closeChat(token) {
    delete sessionHistory[token];
    delete appuntiHistory[token];
  }

  async chat(token, domanda) {
    if (!sessionHistory[token]) {
      sessionHistory[token] = [];
    }

    sessionHistory[token].push({
      role: "user",
      content: Prompt.get_chat_prompt(domanda),
    });

    const message = await this.client.beta.messages.create({
      max_tokens: ClaudeConst.CLAUDE_MAX_TOKENS,
      temperature: ClaudeConst.CLAUDE_TEMPERATURE,
      model: 'claude-3-5-sonnet-20241022',
      betas: ["pdfs-2024-09-25"],
      system: Prompt.sys_explain_prompt,
      messages: sessionHistory[token],
    });

    console.log("RAW CHAT RESPONSE ", message.content[0].text);

    const sanitizedJsonText = message.content[0].text.replace(/[\r\n]+/g, " ");

    sessionHistory[token].push({
      role: "assistant",
      content: sanitizedJsonText,
    });

    return JSON.parse(sanitizedJsonText);
  }
  async chatCourse(token, id_corso, domanda) {
    if (!sessionHistory[token]) {
      sessionHistory[token] = [];
    }

    sessionHistory[token].push({
      role: "user",
      content: Prompt.get_chat_prompt(domanda),
    });

    const corso = await Corso.findByPk(id_corso);
    const argomenti = corso ? corso.argomenti : '';

    const message = await this.client.beta.messages.create({
      max_tokens: ClaudeConst.CLAUDE_MAX_TOKENS,
      temperature: ClaudeConst.CLAUDE_TEMPERATURE,
      model: 'claude-3-5-sonnet-20241022',
      betas: ["pdfs-2024-09-25"],
      system: Prompt.get_sys_explain_prompt(argomenti),
      messages: sessionHistory[token],
    });

    console.log("RAW CHAT RESPONSE ", message.content[0].text);

    const sanitizedJsonText = message.content[0].text.replace(/[\r\n]+/g, " ");

    sessionHistory[token].push({
      role: "assistant",
      content: sanitizedJsonText,
    });

    return JSON.parse(sanitizedJsonText);
  }
}
async function salvaCorso(corsoData) {
  try {
    const corso = await Corso.create({
      nome: corsoData.nome,
      argomenti: corsoData.argomenti,
    });

    for (const levelData of corsoData.levels) {
      const level = await Level.create({
        livello: levelData.livello,
        CorsoId: corso.id,
      });

      console.log(levelData.open_questions);

      for (const oqData of Array.isArray(levelData.open_questions)
        ? levelData.open_questions
        : []) {
        await OpenQuestion.create({
          domanda: oqData.domanda,
          suggerimento: oqData.suggerimento,
          LevelId: level.id,
        });
      }

      for (const mcqData of Array.isArray(levelData.multiple_choice)
        ? levelData.multiple_choice
        : []) {
        await MultipleChoiceQuestion.create({
          question: mcqData.question,
          a: mcqData.a,
          b: mcqData.b,
          c: mcqData.c,
          d: mcqData.d,
          true: mcqData.true,
          suggerimento: mcqData.suggerimento,
          spiegazione: mcqData.spiegazione,
          LevelId: level.id,
        });
      }
    }

    console.log("Corso salvato con successo!");
  } catch (error) {
    console.error("Errore durante il salvataggio:", error);
  }
}

module.exports = ClaudeAI;

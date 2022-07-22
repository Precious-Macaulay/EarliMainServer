const Agenda = require("agenda");
require("dotenv").config();
const url = process.env.MONGOOSE_URL;
const connectionOpts = {
  db: { address: url , collection: "agendaJobs" },
};

const agenda = new Agenda(connectionOpts);

const jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(",") : [];

jobTypes.forEach((type) => {
  require("../jobs/" + type)(agenda);
});

if (jobTypes.length) {
  agenda.start(); // Returns a promise
} 

module.exports = agenda;

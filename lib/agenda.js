const Agenda = require("agenda");

const connectionOpts = {
  db: { address: "localhost:27017/agenda", collection: "agendaJobs" },
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

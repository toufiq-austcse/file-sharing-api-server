const cron = require('node-cron');

class Scheduler {
	constructor() {
		this.jobs = new Map();
	}

	scheduleJob(name, cronExpression, task) {
		const job = cron.schedule(cronExpression, task, {
			scheduled: false,
		});
		this.jobs.set(name, job);
		return job;
	}

	startJob(name) {
		const job = this.jobs.get(name);
		if (job) {
			job.start();
			console.log(`Job '${name}' started`);
		}
	}

	stopJob(name) {
		const job = this.jobs.get(name);
		if (job) {
			job.stop();
			console.log(`Job '${name}' stopped`);
		}
	}

	stopAll() {
		this.jobs.forEach((job, name) => {
			job.stop();
			console.log(`Job '${name}' stopped`);
		});
	}
}

module.exports = new Scheduler();

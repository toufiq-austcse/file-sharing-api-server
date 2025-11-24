const cron = require('node-cron');

/**
 * Scheduler class to manage scheduled jobs using cron expressions.
 */
class Scheduler {
	/**
	 * Initializes the Scheduler with an empty job map.
	 */
	constructor() {
		this.jobs = new Map();
	}

	/**
	 * Schedules a job with the given name, cron expression, and task function.
	 * @param name
	 * @param cronExpression
	 * @param task
	 * @returns {ScheduledTask}
	 */
	scheduleJob(name, cronExpression, task) {
		const job = cron.schedule(cronExpression, task, {
			scheduled: false,
		});
		this.jobs.set(name, job);
		return job;
	}

	/**
	 * Starts the job with the given name.
	 * @param name
	 */
	startJob(name) {
		const job = this.jobs.get(name);
		if (job) {
			job.start();
			console.log(`Job '${name}' started`);
		}
	}

	/**
	 * Stops the job with the given name.
	 * @param name
	 */
	stopJob(name) {
		const job = this.jobs.get(name);
		if (job) {
			job.stop();
			console.log(`Job '${name}' stopped`);
		}
	}

	/**
	 * Stops all scheduled jobs.
	 */
	stopAll() {
		this.jobs.forEach((job, name) => {
			job.stop();
			console.log(`Job '${name}' stopped`);
		});
	}
}

module.exports = new Scheduler();

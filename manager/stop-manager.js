
exports.stopManager = (signer, cronJobs) => {
    // Stop scheduled jobs
    console.log('Stopping scheduled jobs...')
    for (let job of cronJobs.values()) {
        job.stop()
    }
    // Stop connection
    console.log('Stopping connection...')
    signer.provider.destroy()
}
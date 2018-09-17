module.exports = seconds =>
    new Promise(resolve => setTimeout(resolve, (seconds || 1) * 1000))

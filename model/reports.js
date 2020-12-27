const mongoose = require('mongoose')

const reportsSchema = mongoose.Schema({
	corpCode : String,
	yearAndQuarter : String,
	rceptCode : String,
	isDownloaded : Boolean
})

const Reports = mongoose.model('Reports', reportsSchema)

module.exports = Reports
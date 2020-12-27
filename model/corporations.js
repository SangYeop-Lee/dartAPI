const mongoose = require('mongoose')

const corporationSchema = mongoose.Schema({
	corpName: String,
	corpCode: String
})

const Corporations = mongoose.model('Corporations', corporationSchema)

module.exports = Corporations
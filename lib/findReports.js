const mongoose = require('mongoose');
const Reports = require('../model/reports');
const Corporations = require('../model/corporations');
const async = require('async');
const fs = require('fs');

module.exports = async function (yearAndQuarter, keyword='tof') {
	
	mongoose.connect('mongodb://localhost:27017/', 
									 {useNewUrlParser: true, useUnifiedTopology: true});
	
	const re = new RegExp(keyword, 'i');
	
	const reports = await Reports.find({yearAndQuarter: yearAndQuarter})
		.find({content: re})
		.select('corpCode rceptCode').lean()
	
	const corpCodes = reports.map(el => el.corpCode)
	
	const corps = await Corporations.find({corpCode: corpCodes}).lean()
	
	const res = reports.map(report => {
		return {
			corpName: corps.find(corp => corp.corpCode===report.corpCode).corpName,
			rceptCode: report.rceptCode
		}
	})
	
	mongoose.disconnect();
	
	return res;
}
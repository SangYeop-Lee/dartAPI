const readline = require('readline');
const fs = require('fs');
const Reports = require('../model/reports');
const Corporations = require('../model/corporations');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/', 
									 {useNewUrlParser: true, useUnifiedTopology: true});

module.exports = function findReports (keywords=["tof", "반도체"], filename="18Q3", callback) {
	let res = [];
	let re = new RegExp(keywords.shift(), 'i');
	
	const readInterface = readline.createInterface({
    input: fs.createReadStream(`${__dirname}/../reports/${filename}`)
	});
	
	readInterface.on('line', (input) => {
		if(re.test(input))
			res.push(input);
	});
	
	readInterface.on('close', async () => {
		while (keywords.length) {
			re = new RegExp(keywords.shift(), 'i');
			res = res.filter( line => re.test(line) );
		}
		res = res.map( line => line.slice(0, line.indexOf(',')));
		
		// find corpname from rcept_no;
		// return [{corpName: ..., rceptCode: ...,}, ...]
		// fix by using populate
		const reports = await Reports.find({rceptCode: res})
			.select('corpCode rceptCode').lean()
		
		const corps = await Corporations.find({corpCode: corpCodes}).lean()
		
		mongoose.disconnect();
		console.log(reports);
	})
}

module.exports();
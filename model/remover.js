const mongoose = require('mongoose');
const Reports = require('./reports');

mongoose.connect('mongodb://localhost:27017/', 
								 {useNewUrlParser: true, useUnifiedTopology: true});


Reports.updateMany({yearAndQuarter: getYearAndQuarter (2018, 4)[0]}, {isDownloaded: false}, (err) => {
	if (err) console.error(err);
	mongoose.disconnect();
})

function getYearAndQuarter (year, quarter) {
	const res1 = [];
	for (let i=0; i<3; i++)
		res1.push(year+'.'+((quarter-1)*3+i+1).toString().padStart(2, 0));
	const res2 = year%100+"Q"+quarter;
	return [res1, res2];
}
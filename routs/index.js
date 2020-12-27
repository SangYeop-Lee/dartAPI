const express = require('express');
const router = express.Router();
const fs = require('fs');
const findReports = require('../lib/findReports');

router.get('/', (req, res, next) => {
	fs.readdir(`${__dirname}/../reporst/`, (err, files) => {
		if (err) return next(err);
		res.render('index', { year_options : files });
	})
})

router.get('/search', (req, res) => {
	
	const q = req.query;

	(async function () {
		const reports = await findReports(getYearAndQuarter(+q.year, +q.quarter), q.keyword);
		res.render('search', {reports : reports})
	})()
})

function getYearAndQuarter (year, quarter) {
	let res = [];
	for (let i=0; i<3; i++)
		res.push(year+'.'+padZero((quarter-1)*3+i+1));
	return res;
}

function padZero (number) {
	if (number<10) return '0'+number;
	return number;
}

module.exports = router;
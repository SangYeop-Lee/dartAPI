const fetch = require('node-fetch');
const qs = require('qs');
const mongoose = require('mongoose');
const Reports = require('../model/reports');
const Corporations = require('../model/corporations');
const async = require('async');
const credentials = require('./credentials');

mongoose.connect('mongodb://localhost:27017/', 
									 {useNewUrlParser: true, useUnifiedTopology: true});

function padZero (number) {
	if (number<10) return '0'+number;
	return number;
}

function getUrl(corp_code) {
	let end_de = "",
			bgn_de = "";
	let today = new Date();
	
	// 현재로부터 3년간 데이터를 가져온다.
	end_de += today.getFullYear();
	bgn_de += today.getFullYear()-3;

	let monthAndDate = "";
	monthAndDate += padZero(today.getMonth()+1);
	monthAndDate += padZero(today.getDate());

	end_de += monthAndDate;
	bgn_de += monthAndDate;

	const headers = {
		'crtfc_key' : credentials.crtfc_key,
		'corp_code' : corp_code,
		'bgn_de' : bgn_de,
		'end_de' : end_de,
		'last_reprt_at' : 'Y',
		'pblntf_ty' : 'A',
		// 'pblntf_detail_ty': undefined,
	}
	
	let url = 'https://opendart.fss.or.kr/api/list.json?';
	url += qs.stringify(headers);
	
	return url;
}

function insertData (corp_code, callback) {
	const url = getUrl(corp_code);
	console.log(`fetching from ${url}...`);
	fetch(url)
	.then(res => res.text())
	.then(text => {
		console.log('got text data.')
		let json = JSON.parse(text);
		
		if (json.status !== '000') {
			console.log(`status no.: ${json.status}`);
			return callback(null);
		}
		console.log(`status code: ${json.status}`);
		
		json = json.list;
		
		const corp_cls = json[0].corp_cls;
		if (corp_cls!=='Y' && corp_cls!=='K') {
			console.log(`corp_cls: ${corp_cls}`);
			return callback(null);
		}

		async.filter(json, function (reportInfo, cb) {
			Reports.exists({ rceptCode: reportInfo.rcept_no }, (err, res) => {
				cb(null, !res); // return false
			})
		}, function (err, results) {
			if (err) return callback(err);

			const targets = results.map( el => {
				const re = /\(([^)]*)\)/;
				return {
					corpCode: el.corp_code,
					yearAndQuarter: el.report_nm.match(re)[1],
					rceptCode: el.rcept_no,
					isDownloaded: false
				};
			})

			Reports.insertMany(targets, (err, res) => {
				if (err) return callback(err);
				if (res.length)
					console.log(`${res.length} documents inserted`);
				else
					console.log(`no document inserted`);
				callback(null);
			})
		})
	})
	.catch (err => callback(err))
}

// what is socket hang up error

Corporations.find({}).limit(3).exec( (err, docs) => {

	console.log(`${docs.length} documents found`);

	async.eachSeries(docs, (item, callback) => {
		console.log(item)
		insertData(item.corpCode, callback)
	}, (err) => {
		if (err) console.log(err);
		mongoose.disconnect();
	})
})

const fetch = require('node-fetch');
const qs = require('qs');
const mongoose = require('mongoose');
const Reports = require('../model/reports');
const async = require('async');
const unzipper = require('unzipper');
const { Readable } = require('stream');
const parser = require('xml2json');
const iconv = require('iconv-lite');
const fs = require('fs');
const credentials = require('./credentials');

/*
done:
	2018: 1, 2, 3, 4
	2019: 1, 2, 3, 4
	2020: 1, 2
*/

main();

function main (year=2020, q=3) {
	mongoose.connect('mongodb://localhost:27017/', 
									 {useNewUrlParser: true, useUnifiedTopology: true});
	
	const [targetYearAndQuarter, filename] = getYearAndQuarter(year, q);

	Reports.find({yearAndQuarter: targetYearAndQuarter, isDownloaded: false})
		.select('rceptCode')
		.exec((err, docs) => {
			if (err) return console.log(err);

			console.log(`${docs.length} documents found`);
			let i = 0;
			async.eachSeries(docs, (doc, callback) => {
				console.log(`${++i}th document.`);
				// console.log(`inserting rceptCode: ${doc.rceptCode}`);
				insertData(doc.rceptCode, filename, callback);
			}, err => {
				if (err) console.log(err);
				mongoose.disconnect();
			})
		})
}

function getYearAndQuarter (year, quarter) {
	const res1 = [];
	for (let i=0; i<3; i++)
		res1.push(year+'.'+((quarter-1)*3+i+1).toString().padStart(2, 0));
	const res2 = year%100+"Q"+quarter;
	return [res1, res2];
}

function getUrl (rcept_no) {
	const headers = {
		'crtfc_key' : credentials.crtfc_key,
		'rcept_no' : rcept_no
	};
	let url = 'https://opendart.fss.or.kr/api/document.xml?';
	url += qs.stringify(headers);
	return url;
}

async function checkError(res) {
	const buf = await res.buffer()
	
	if (buf.length>1000) { // res.status >= 200 && res.status < 300
		return buf;
	} else {
		console.log('error');
		throw new Error();
	}
}

function insertData (rcept_no, filename, callback) {
	const url = getUrl(rcept_no);
	fetch(url)
	.then(checkError)
	.then(buffer => new Readable({
		read() {
			this.push(buffer);
			this.push(null);
		}
	}))
	.then(stream => {
		console.log('unzipping stream...');
		
		const re = new RegExp(rcept_no+".xml");
		const bufs = [];
		
		stream
		.pipe(unzipper.ParseOne(re))
		.on('data', d => bufs.push(d) )
		.on('end', () => {
			
			let content = Buffer.concat(bufs);
			content = iconv.decode(content, 'euc-kr');
			content = content.substring(content.indexOf('<TITLE ATOC="Y" AASSOCNOTE="D-0-2-0-0">'), content.indexOf('<TITLE ATOC="Y" AASSOCNOTE="D-0-3-0-0">'));
			content = content.replace(/\n/g, "");
			content = content.replace(/<TABLE.*?\/TABLE>/gm, "");
			content = content.replace(/[<][^>]*[>]/gm, "");
			content = content.replace(/\&cr;/g, "");
			content = content.replace(/[^A-Za-z가-힣]/g, " ");
			content = content.replace(/ .(?= )|\S{10,}/g, " ");
			content = content.replace(/\s+/g, " ");

			fs.appendFileSync(`${__dirname}/../reports/${filename}`, rcept_no+','+content+'\n');
			
			Reports.updateOne({rceptCode: rcept_no}, {isDownloaded: true}, err => {
				if (err) return callback(err);
				callback(null);
			})
		})
		
		.on('error', () => {
			console.log('file not found');
			callback(null);
		})
	})
	.catch(() => {
		callback(null);
	})
}
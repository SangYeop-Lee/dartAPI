const fetch = require('node-fetch');
const unzipper = require('unzipper');
const { Readable } = require('stream');
const parser = require('xml2json');
const Corporations = require('../model/corporations');
const mongoose = require('mongoose');
const etl = require('etl');
const credentials = require('./credentials');

url = 'https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${credentials.crtfc_key}';

mongoose.connect('mongodb://localhost:27017/', 
								 {useNewUrlParser: true, useUnifiedTopology: true});

fetch(url)
	.then(res => res.buffer())
	.then(buffer => new Readable({
		read() {
			this.push(buffer);
			this.push(null);
		}
	}))
	.then(stream => {
		stream
		.pipe(unzipper.Parse())
		.pipe(etl.map(async entry => {
			if (entry.path == "CORPCODE.xml") {
				let content = await entry.buffer();
				content = content.toString();
				
				console.log(new Date().getSeconds());
				content = parser.toJson(content, {object: true}).result.list
					.filter( el => el.stock_code )
					.map( el => {
						return {
							corpCode: el.corp_code,
							corpName: el.corp_name
						}
					})
					.filter( async el => {
						return !await Corporations.exists({ corpName: el.corpName })
					});
				
				console.log(new Date().getSeconds());
				
				Corporations.insertMany(content, (err, res) => {
					if (err) return console.log(err);
					return mongoose.disconnect();
				})
				
			}
			else {
				entry.autodrain();
			}
		}))
	})
	
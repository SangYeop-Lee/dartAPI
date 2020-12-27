const express = require('express');
const handlebars = require('express-handlebars')
const morgan = require('morgan')
const bodyParser = require('body-parser')

const index_router = require('./routs/index')

const app = express();

app.use(express.static(__dirname + '/public'));

app.use(morgan("short"));
app.use(bodyParser.urlencoded({ extended: true }))

app.engine('.hbs', handlebars({extname: '.hbs'}));
app.set('view engine', '.hbs');
app.set('view options', { layout: 'layout.hbs' });

const port = 3000;

app.use(index_router);

app.use((req, res, next) => {
	res.status(404)
	res.render('error')
})

app.use((err, req, res, next) => {
	res.status(500)
	console.log(err.stack)
	res.render('error')
})

app.listen(port, () => {
  console.log(`Example app listening at https://dartapi-xjvgz.run.goorm.io`)
})
/*

url : https://dartapi-xjvgz.run.goorm.io

routing :
	app.METHOD(PATH, HANDLER)
	METHOD : get, post
	PATH : e.g. '/'
	HANDLER : (req, res) => {}
		res.send(html)

static files :
	app.use(express.static('public'))
*/
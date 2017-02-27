let fs = require('fs');
let cheerio = require('cheerio');
var body = '<h1><span style="font-size: 16px;">中文</span></h1>';

var $ = cheerio.load(body);
console.log($('span').html())

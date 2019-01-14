var tress = require('tress');
var needle = require('needle');
var cheerio = require('cheerio');
var resolve = require('url').resolve;
var fs = require('fs');
import aliasAdd from '../controllers/eth_Alias_controller'


var URL = 'https://etherscan.io/labelcloud';
var results = [];

var q = tress(function(url, callback){
    needle.get(url, function(err, res){
        if (err) {
            console.log(err);
            q.push(url);
        }

        // парсим DOM
        var $ = cheerio.load(res.body);

        //информация о новости
            if (url.search('tokens') != -1){    
            console.log ($('h1').text())
            results.push($(".table-hover > tbody > tr").map((i, element) => ({
            address: $(element).find('td:nth-of-type(1)').text().trim(),
            tokenName: $(element).find('td:nth-of-type(2)').text().trim(),
            tokenTicker: $(element).find('td:nth-of-type(3)').text().trim(),
            url: $(element).find('td:nth-of-type(4)').text().trim(),
            source: url    
            })).get())
            results.forEach(res => res.forEach(res => aliasAdd(res)))
        }
        
        if (url.search('accounts') != -1){
            console.log ($('h1').text())
            results.push($(".table-hover > tbody > tr").map((i, element) => ({
            address: $(element).find('td:nth-of-type(2)').text().trim(),
            tokenName: $(element).find('td:nth-of-type(3)').text().trim(),
            tokenTicker: '',
            url: '',
            source: url    
            })).get())
            results.forEach(res => res.forEach(res => aliasAdd(res)))
        }
        

        //categories' list 
        $('.secondary-container > div > ul > li > a').each(function(){    
            q.push(resolve(URL, $(this).attr('href')));
            console.log(resolve(URL, $(this).attr('href')))
        });

        //паджинатор
        $('.col-md-6 > p > a').each(function() {
            if ($(this).text() === 'Next' && $(this).attr('disabled') != 'disabled'){
            // не забываем привести относительный адрес ссылки к абсолютному
            q.push(resolve(URL, $(this).attr('href')));
            console.log(resolve(URL, $(this).attr('href')))}
        });

        callback();
    });
}, 1); // запускаем 10 параллельных потоков

q.push(URL);
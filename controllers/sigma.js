/*

 ______ _                       _   _             
 \  ___|_)                     | | (_)            
  \ \   _  __ _ _ __ ___   __ _| |_ _  ___  _ __  
   > > | |/ _` | '_ ` _ \ / _` | __| |/ _ \| '_ \ 
  / /__| | (_| | | | | | | (_| | |_| | (_) | | | |
 /_____)_|\__, |_| |_| |_|\__,_|\__|_|\___/|_| |_|
           __/ |                                  
          |___/                                   

*/

//*******************************************************************

'use strict';

//*******************************************************************
// required modules

var svg2png = require('svg2png');

//*******************************************************************
// sigma

var process = function(req, res, mathjax){

	var params = req.params;
	var ext = params.ext;
	var req_content = req.headers['content-type'];
	
	var res_content = 'image/svg+xml';
	var type = 'svg';
	
	var input = req.query.input || req.query.math || req.query.m || req.query.sigma || req.query.s; // math to convert	
	var lang = req.query.lang || req.query.l; // TeX [t] or AsciiMath [a]
		
	var width = req.query.width || req.query.w;
	var height = req.query.height || req.query.h;
	
	//*******************************************************************
	
	var format = 'AsciiMath';
	if (lang) {		
		if ((lang === 'AsciiMath') || (lang === 'asciimath') || (lang === 'ascii') || (lang === 'a')) {
			format = 'AsciiMath';			
		}
		else if ((lang === 'TeX') || (lang === 'tex') || (lang === 't')) {
			format = 'TeX';			
		}
	}
		
	if (req_content) {
		
		if (req_content === 'image/svg+xml') {
			type = 'svg';
		}
		else if (req_content === 'image/png') {
			type = 'png';
		}
		else if ((req_content === 'application/mathml+xml') || (req_content === 'application/mathml-presentation+xml') || (req_content === 'application/mathml-content+xml')) {
			type = 'mml';
		}
		else if (req_content === 'text/html') {
			type = 'html';
		}	
	}
	
	if (ext) {
		if ((ext === 'svg') || (ext === 'png') || (ext === 'mml') || (ext === 'html')) {
			type = ext;
		}
	}
	
	//*******************************************************************
	
	if (type === 'svg') {
		res_content = 'image/svg+xml';
	}
	else if (type === 'png') {
		res_content = 'image/png';
	}
	else if (type === 'mml') {
		res_content = 'application/mathml+xml';
	}
	else if (type === 'html') {
		res_content = 'text/html';
	}
		
	var svg = true;
	var mml = false;
	
	if ((type === 'mml') || (type === 'html')) {		
		var svg = false;
		var mml = true;
	}
	
	//	\\sum_{i=1}^N2^i 	//TeX
	//	sum_(i=1)^N 2^i  	// AsciiMath
		
	console.log('params : ' + JSON.stringify(params) ) ;
	console.log('ext : ' + ext );
	console.log('req_content : ' + req_content );
	console.log('res_content : ' + res_content );
	console.log('lang : ' + lang );
	console.log('format : ' + format );
	console.log('input : ' + input );
	console.log('type : ' + type );
	console.log('svg : ' + svg );
	console.log('mml : ' + mml );
	console.log('width : ' + width );
	console.log('height : ' + height );
	
	//*******************************************************************
	
	var output = '';
	
	if (input) {		
		mathjax.typeset({
			math: input,
			format: format, 	
			svg:svg, 
			mml:mml, 
		}, function (data) {
			if (data.errors) {
				console.error('data.errors : ' + data.errors );
			}
			else {
				if (svg) {
					output = data.svg;					
					//console.log('output svg : ' + output );
				}
				else if (mml) {					
					output = data.mml;					
					//console.log('output mml : ' + output );
				}	
				
				if (type === 'png') {					
					
					var png_opts = {};
										
					if (width) {						
						png_opts.width = width;
					}
					if (height) {						
						png_opts.height = height;
					}
					
					if ((!width) && (!height)) {						
						png_opts.height = 32;
					}
					
					console.log('png_opts : ' + JSON.stringify(png_opts) );
					
					res.setHeader('content-type', res_content);						
					
					svg2png(new Buffer(output), png_opts)
						.then(buffer => res.send(buffer))
						.catch(e => console.error('svg2png errors : '+ e));					
				}
				else {
					
					if (type === 'html') {		
						output = '<!doctype html><html><head><title>&Sigma;igmation - '+ input +'</title><script type="text/javascript" async src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-MML-AM_CHTML"></script><body>'+ output +'</body></html>';
					}
					
					res.setHeader('content-type', res_content);	
					res.send(output);					
				}			
			}
		});
	}	
};

//*******************************************************************
// exports

module.exports.process = process;

//*******************************************************************

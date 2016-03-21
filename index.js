/*
dule dependencies.
 */

var logger = require('koa-logger');
var serve = require('koa-static');
var parse = require('co-busboy');
var koa = require('koa');
var https = require('https');
var fs = require('fs');
var app = koa();
var os = require('os');
var path = require('path');

// log requests

app.use(logger());

// custom 404
app.use(function *(next){
  console.log('Method ' +this.method);
  console.log('URL ' +this.url);
  console.log('idempotent: ' + this.idempotent,'\n');
  
  yield next;
});

app.use(function *(next){
  yield next;
  if( this.url === 'upload') return;
  if (this.body || !this.idempotent) return;
  this.redirect('/404.html');
});

// serve files from ./public

app.use(serve(__dirname + '/public'));

// handle uploads

app.use(function *(next){
  // ignore non-POSTs
  if ('POST' != this.method) return yield next;

  // multipart upload
  console.log('got POST at '+ this.url);
  
  // the body isn't multipart, so busboy can't parse it 
  if (!this.request.is('multipart/*')) return yield next;
  
  var parts = parse(this);
  var part;
  var imgname;

  while (part = yield parts) {
      console.log(part.fieldname);
      if(part.fieldname === 'imagedata') {
            imgname = Math.random().toString()+ '.png';
            var stream = fs.createWriteStream(path.join('./', '/public', imgname));
            
            part.pipe(stream);
           
            console.log('uploading %s', part.name, stream.path);
             
            url = imgname;
      }
  }
  
  this.body = 'http://localhost:8080/'+ url ;
});

// listen
app.listen(8080);
console.log('listening on port 8080');

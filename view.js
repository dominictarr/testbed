var express = require('express')
  , app = express.createServer()
  , http = require('http')
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    testbedPackage: {}, 
    status: 'success', //sets the tab icon
    basedir: __dirname//{} //config.basedir
    });
});

/*res.render('empty',{}, function (err,data){
  if(err)
    throw err

  console.log(data)
})*/

app.get('/', function (req,res){

  res.render('hello',{}/*,function (err,html){
    if(err)
      throw err
    console.log(html)
  }*/)
})

app.listen(8001,function (){

})
setTimeout(function (){
  http.get({host:'localhost', port:8001, path:'/'}, function (){
//    app.close()
  })
},100)

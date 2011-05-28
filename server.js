var express = require('express') 
  , app = express.createServer()
  , testbed = new (require('./testbed'))(process.cwd() + '/workspace')
  , cradle = require('cradle')
  , request = require('request')
  , url = require('url')
  
  db = new(cradle.Connection)().database('testbed')

  
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

function save (repo){
  if(repo._id && !repo.saving){
    repo.saving = true
    
    db.get('' + repo._id, function (err,doc){
      db.save({
        _id: '' + repo._id,
        _rev: doc && doc._rev,
        time: new Date,
        username: repo.username,
        project: repo.project,
        state: repo.state,
        },
        function (err,data){
          repo._rev = data._rev
          repo.saving = null
          if(repo.changed){
            save(repo)
            repo.changed = null
          }
        })
    })
  } else {
    repo.changed = true
  }
}

app.post('/', function (req,res){

  repo = testbed.Repo(req.body.repository.owner.name,req.body.repository.name)

  repo.on('change',function (event){
    console.log([repo.username,repo.project].join('/'),[].shift.call(arguments))
    while(arguments.length)
      console.log([].shift.call(arguments))
    console.log('--------------------------------')
    save(repo)
  })

  repo.integrate(function (err,data){
    if(err){
      return res.send({error: err, reason:  "could not connect to github or npm", data: data})
    }
    res.send(data)
  })

})

app.get('/:username/:project/:commit', function (req,res){

  db.get([req.params.username, req.params.project, req.params.commit].join(','),
  function (err,data){
    res.render('result',data)
  })
})

app.get('/:username?/:project?', function (req,res){

  var path = url.parse(req.url).pathname

  var start = path.split('/').slice(1)
    , end = start.slice(0).concat('ZZZZZZZ')
    , opts = (path !== '/' ? {startkey:start,endkey:end} : {})
  console.log("START:",start)

  db.view('all/status',opts, function (err,data){
  if(err) {res.send(err)}
  data.__proto__ = Array.prototype //GOD DAMMIT! leave Array.prototype alone!
  console.log(JSON.stringify(data))
  data = JSON.parse(JSON.stringify(data))
   console.log('******************',data)
  // res.render('index', {rows: [{key:[1]},{key:[1,5]},{key:[2,3]}]})
    //res.send(data)
    res.render('index', {
      rows: data
    })
  })
})


app.listen(3000);
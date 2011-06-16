
var log = console.log
  , render = require('render')
  , overwrite = require('../model/overwrite')

module.exports = function (db,Repo,config) { //I think dependency injection may be an antipattern
  function filter (obj,keys) {
    var n = {}
    Object.keys(obj).forEach(function (i){
      if(!~keys.indexOf(i))
        n[i] = obj[i]
    })
    return n
  }

  function save (repo) { //pull this out also.
    if(repo._id && !repo.saving){
      repo.saving = true

      db.get('' + repo._id, function (err, doc){

        var obj = filter (doc || repo,['_events'])
        obj._id = '' + repo._id
        obj._rev = doc && doc._rev
        obj.time = new Date()
        db.save(obj,
          function (err, data){
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

  return function (req,cont){
    var payload
    if(!req.body)
      return cont ({statusCode: 400, error: "Expected payload: property"})

    try {
      payload = JSON.parse(req.body.payload)
    } catch (err) {
      console.error('could not parse POST JSON')
      return cont ({
        statusCode: 400, 
        error: "was not valid JSON",
        was: req.body.payload,
        exception: err.stack 
        })
    }

    log('loading new repo')
    render.ct.log(payload)

    repo = Repo(
      payload.repository.owner.name,
      payload.repository.name, 
      config.basedir) // load that from config.

    repo.post = payload

    repo.on('change',function (event){
      console.log('change',event, repo._id)
      save(repo)
    })

    repo.integrate(function (err,data){
      //log
      if(err){//not necessarily the right error message.
        return cont({statusCode: 503, error: err, reason:  "could not connect to github or npm", data: data})
      }
      //,function (err2,data2){   //save to database.
        if(err)
          return cont({statusCode: 503, error: err, reason:  "database error", data: data})
  
        cont(null, {ok: true} )
      //})
    }) 
  }
}
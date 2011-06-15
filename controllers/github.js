
var log = console.log
  , render = require('render')
  , overwrite = require('../model/overwrite')

module.exports = function (db,Repo,config) { //I think dependency injection may be an antipattern

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
      overwrite(db,repo,function (){
        console.log("SAVED",event, repo._id)
      })
    })

    repo.integrate(function (err,data){
      //log
      if(err){//not necessarily the right error message.
        return cont({statusCode: 503, error: err, reason:  "could not connect to github or npm", data: data})
      }
      overwrite(db,repo,function (err2,data2){   //save to database.
        if(err)
          return cont({statusCode: 503, error: err, reason:  "database error", data: data})
  
        cont(null, data2)
      })
    }) 
  }
}
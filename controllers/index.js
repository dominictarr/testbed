
module.exports = function (db,Repo,config){
  return {
    summary: require('./summary')(db)
  , result: require('./result')(db)
  , github: require('./github')(db,Repo,config)
  //, summary: require('./summary')
  }
}
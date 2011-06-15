var config_file = process.env.HOME + '/.testbedrc'
  , eyes = require('eyes')
  , exec = require('child_process').exec
  , fs = require('fs')
  , render = require('render')
  , config 
  , defaults = {
      host: 'http://localhost',
      port: 3000,
      basedir: __dirname + '/testbed',
      database: {name:'testbed', host:"http://localhost",port: 5984}
    }

exports.deploy = function (ready){

  try {
    config = fs.readFileSync(config_file)
  } catch (err){
    console.error('could not find ~/.testbedrc')
    console.error('creating default ~/.testbedrc = ')

    render.cf.log(defaults)

    console.log("PLEASE REVIEW")

    fs.writeFileSync(config_file, render.cf(defaults))
    process.exit(1)
  }
  try {
    config = eval ('(' + config + ')' )
  } catch (err){
    console.error('ERROR LOADING CONFIG')
    console.error(err.stack)
    console.log(config)
    process.exit(1)
  }

  console.log('configuration loaded')

  exec('mkdir -p ' + config.basedir, function (err){
    console.log('created testbed basedir:' + config.basedir)
    ready && ready()
  })
return config
}
  
exports.testing = function (){
  exec('mkdir -p ' + config.basedir, function (err){
    console.log('created testbed basedir:' + config.basedir)
    ready && ready()
  })
  return defaults
}

//module.exports = config
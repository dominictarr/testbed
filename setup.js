var w = require('winston')
  , config_file = process.env.HOME + '/.testbedrc'
  , eyes = require('eyes')
  , exec = require('child_process').exec
  , fs = require('fs')
  , defaults = {
      host: 'http://localhost',
      port: 3000,
      basedir: __dirname + '/testbed',
      database: {name:'testbed', host:"http://localhost",port: 5983}
    }

exports.deploy = function (ready){

  try{
    config = fs.readFileSync(config_file)
  } catch (err){
      w.error('could not find ~/.testbedrc')
      w.error('creating default ~/.testbedrc = ')

      eyes.inspect(defaults)

      w.info ("PLEASE REVIEW")

      fs.writeFileSync(config_file, JSON.stringify(defaults))
    process.exit(1)
  }
  try{
    config = eval ('(' + config + ')' )
  } catch (err){
    w.error('ERROR LOADING CONFIG')
    w.error(err.stack)
    w.info(config)
    process.exit(1)
  }

  w.info('configuration loaded')

  exec('mkdir -p ' + config.basedir, function (err){
    w.info('created testbed basedir:' + config.basedir)
    ready && ready()
  })
return config
}
  
exports.testing = function (){
  exec('mkdir -p ' + config.basedir, function (err){
    w.info('created testbed basedir:' + config.basedir)
    ready && ready()
  })
  return defaults
}

//module.exports = config
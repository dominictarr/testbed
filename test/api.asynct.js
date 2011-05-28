var Testbed = require('testbed')
  , it = require('it-is')
  , tmp = __dirname + '/tmp'
  , testbed = new Testbed(tmp)
 
exports ['can has api'] = function (test){

  it(testbed).has({Repo: it.function()})
  var x = testbed.Repo('username','project')
  it(x).has({
    username:'username',
    project:'project',
    pull:it.function(),
    clone:it.function(),
    init:it.function(),
    update:it.function(),
    cloneOrPull: it.function (),
    integrate: it.function (),
    gitRepo: it.function (),
    state: {init: false, update: false}
    })

  test.done() 

}
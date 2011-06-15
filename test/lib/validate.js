
var it = require('it-is').style('colour')
  , valid = exports
  , is_str = it.typeof('string')

valid.commit = 
  it.has ({
    author: {
      name: is_str,
      email: is_str,
      username: is_str
    },
    id: is_str,
    message: is_str
  })

valid.repository =
  it.has({
    language:is_str,
    name: is_str,
    description: is_str,
    url: is_str,
    owner: {
      name: is_str,
      email: is_str
    },
  })

valid.github = 
  it.has({
    commits: it.every(valid.commit),
    repository: valid.repository
  })

valid.package = 
  it.has({
    name: is_str,
    version: is_str
  })

valid.report = 
  it.has ({
    status: is_str,
    failures: [],
    tests: [] 
  })

valid.result = 
  it.has({
    post: valid.github,
//    package: valid.package, //not used in any views.
    report: valid.report,
    type: 'repo',
    username: is_str,
    time: function (time){
      it(new Date(time).toString()).notEqual('Invalid Date')
    },
    _id: it.typeof('string')
  })

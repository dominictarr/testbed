var init = require('../')

exports ['will callback error if there is no couchdb running'] = function (test){

  init('test',{host:'http:/asdhk.sdvono.com', port:2359}).ready(function (err,db){
    it(err).ok()
    it(db).equal(null)
    test.done()
  })
}
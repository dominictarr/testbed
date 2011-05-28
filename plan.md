
/*
git log //parse current commit

//if everything worked save data in couch for commit.


testbed pull/clones the repo 
inits
npm updates
meta-tests

and emits events at each stage.

CREATE: server
which does all that stuff, and updates couch on events.

server calls testbed.js listens for events, updates couch, serves response.

POST
{payload: { repository: {name: project, owner: {name: username}}}}

then it responds to
GET
/username/project{?/commit}


~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

node race - 
it's just like meta test, but the convention is that the tests are in a seperate repo. (this will make API changes completely obvious. this will be the 9th iteration.)

pull down project like before & npm update. also, list races your entering.

then, for each race:

ln -s [new_contender] [racepath]/node_module/contender 

meta-test -[adapter] test/*.js

update results under test:[contender:commit]

//when a race is updated, re-run all contenders.
*/
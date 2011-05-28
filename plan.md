
/*
git log //parse current commit

POST
{payload: JSON.stringify({ repository: {name: project, owner: {name: username}}})}

//json within json. stupid, i know.

look into permissions downgrading (npm does it) and chroot.

grab other commit information. (just save the github post)

test and initialize database.

nicer views.

support for more test adapters.

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
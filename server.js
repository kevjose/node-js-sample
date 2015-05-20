// server.js

    // set up ========================
    var express  = require('express');
    var app      = express();                               // create our app w/ express
    var mongoose = require('mongoose');                     // mongoose for mongodb
    var morgan = require('morgan');             // log requests to the console (express4)
    var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
    var multer = require('multer');
    var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)
    var User = require('./models/User.js');
    var Post = require('./models/Post.js');
    var jwt = require('jwt-simple');
    var http = require('http').createServer(app);
    var io = require('socket.io')(http);
    mongoose.connect('mongodb://kevin:opensesm@ds061288.mongolab.com:61288/psjwt');

    io.sockets.on('connection', function(socket){
        socket.on('send msg', function(data){
            io.sockets.emit('get msg', data);
            console.log(data);
        })
    })

    var fs = require('fs');
    var Grid = require('gridfs-stream');

    /* Cron Jobs 1
    var Agenda = require("Agenda");
    var agenda = new Agenda({db: { address: 'localhost:27017/agenda-example'}});

    agenda.define('delete old users', function() {
      console.log("hiiiiiiiiiiiiiiiiiiiii");
    });

    agenda.every('1 second', 'delete old users');

    agenda.start();*/

    var schedule = require('node-schedule');

    var rule = new schedule.RecurrenceRule();
    rule.minute = 5;

    var j = schedule.scheduleJob(rule, function(){
        console.log('The answer to life, the universe, and everything!');
    });

    // configuration =================
	app.use(express.static(__dirname + '/public'));                 // set the static files location /public/img will be /img for users
    app.use(morgan('dev'));                                         // log every request to the console
    app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
    app.use(bodyParser.json());                                     // parse application/json
    app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
    app.use(methodOverride());
    app.use(multer());// for mutltipart form data

	app.use(function(req, res, next) {
	  res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With,Content-Type,Content-Range, Content-Disposition,Authorization,Accept');
	  res.header('Access-Control-Allow-Methods', 'OPTIONS, HEAD,GET,PUT,POST,DELETE');
	  next();
	})

	// application -------------------------------------------------------------

	app.post('/register',function(req,res){
        var user = req.body;

        var searchUser = {
            email:user.email
        };

        User.findOne(searchUser,function(err,user){
            if(err) throw err

            if(user)
                return res.status(401).send({message: 'Email exists'});

            var newUser = new User({
                email: req.body.email,
                password: req.body.password
            });
            newUser.save(function(err){
                createSendToken(newUser, res);
            })
        })
    })

    app.post('/login',function(req,res){
        req.user = req.body;
        var searchUser = {
            email:req.user.email
        };

        User.findOne(searchUser,function(err,user){
            if(err) throw err

            if(!user)
                return res.status(401).send({message: 'Wrong email/password'});

            user.comparePasswords(req.user.password, function(err, isMatch){
                if(err) throw err;

                if(!isMatch)
                    return res.status(401).send({message: 'Wrong email/password'});

                createSendToken(user, res);
            });
        })
    })

    app.post('/upload',function(req,res){
        console.log(req.files);

        var files = req.files;
        console.log(files.file.mimetype);
        Grid.mongo = mongoose.mongo;
        mongoose.createConnection('mongodb://kevin:opensesm@ds061288.mongolab.com:61288/psjwt')
        .once('open', function () {
            console.log('open');
            var id = mongoose.Types.ObjectId();
            console.log(id);
            var conn = mongoose.connection;
            var gfs = Grid(conn.db);

            // streaming to gridfs
            //filename to store in mongodb
            var writestream = gfs.createWriteStream({
                _id: id,
                filename: files.file.originalname,
                content_type:files.file.mimetype
            });
            fs.createReadStream(files.file.path).pipe(writestream);

            writestream.on('close', function (file) {
                // do something with `file`
                console.log(file.filename + 'Written To DB');
            });
        });
        res.status(200).send({
            message: 'upload'
        });
    })

    app.get('/download/:id',function(req,res){
        Grid.mongo = mongoose.mongo;
        var conn = mongoose.connection;
        var gfs = Grid(conn.db);
        gfs.files.find({_id:mongoose.Types.ObjectId(req.params.id)}).toArray(function (err, files) {
            if(files.length===0){
                return res.status(400).send({
                    message: 'File not found'
                });
            }
            console.log(files);
            res.writeHead(200, {'Content-Type':files[0].contentType});
            var readstream = gfs.createReadStream({
                  filename: files[0].filename
            });

            readstream.on('data', function(data) {
                res.write(data);

            });

            readstream.on('end', function() {
                res.end();

            });

            readstream.on('error', function (err) {
              console.log('An error occurred!', err);
              throw err;
            });

        });
    })

    function createSendToken(user, res){
        var payload = {
            sub: user.id
        }

        var token = jwt.encode(payload,"shhh..");
        res.status(200).send({
            user: user.toJson(),
            token: token
        });
    }

    var posts = [
        'Kevin',
        'Bony',
        'Shabin'
    ];
    app.get('/posts', function(req,res){
        if(!req.headers.authorization){
            return res.status(401).send({
                message: 'You are not authorized'
            });
        }
        var token = req.headers.authorization.split(' ')[1];
        var payload = jwt.decode(token, "shhh..");

        if(!payload.sub){
            res.status(401).send({
                message: 'Authentication failed'
            });
        }else{
            var userId =payload.sub;
        }

        Post.find({ 'createdBy': userId },function (err, posts) {
        if (err) throw err;

            res.json(posts);

        })

    })

    app.post('/create/post', function(req, res) {
        if(!req.headers.authorization){
            return res.send({
                message: 'You are not authorized'
            });
        }
        var token = req.headers.authorization.split(' ')[1];
        var payload = jwt.decode(token, "shhh..");

        if(!payload.sub){
            res.status(401).send({
                message: 'Authentication failed'
            });
        }
        // create a todo, information comes from AJAX request from Angular
        var post = req.body;
        var newPost = new Post({
            text: post.text,
            createdBy: payload.sub
        });
        newPost.save(function(err){
            if (err) throw err;

            console.log('Post saved successfully!');
            res.send("Saved");
        })

    });

    /*app.get('/', function(req, res) {
        res.sendfile('./public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    })*/




    // listen (start app with node server.js) ======================================
    app.set('port', (process.env.PORT || 8080));
	  http.listen(process.env.PORT || 8080);
    console.log("App listening on port 8080");

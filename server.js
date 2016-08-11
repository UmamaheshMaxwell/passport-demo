var fs = require("fs");
var https = require('https');

var express = require('express');
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var expressSession = require("express-session");

var passport = require("passport");
var passportLocal = require("passport-local");
var passportHttp = require("passport-http")

var app = express();

var server = https.createServer({
	cert:fs.readFileSync(__dirname + "/ca.crt"),
	key: fs.readFileSync(__dirname + "/ca.key")	
},app);

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: false}))
app.use(cookieParser())
app.use(expressSession({ 
	secret : process.env.SESSION_SECRET || "secret",
	resave: false,
	saveUninitialized: false

}));


app.use(passport.initialize());
app.use(passport.session());

function ensureAuthenticated(req, res, next){
	if(req.isAuthenticated()){
		next();
	}
	else{
		res.send(403);
	}
}

passport.use(new passportLocal.Strategy(verifyCredentials));

passport.use(new passportHttp.BasicStrategy(verifyCredentials));

function verifyCredentials(username, password, done){
	console.log("Passport Strategy Section");
	if(username === password){
		done(null, { id: username, name:username})
	}else{
		done(null, null)
	}
}

passport.serializeUser(function(user,done){
	console.log("Passport serialize Section");
	done(null,user.id);
});

passport.deserializeUser(function(id, done){
	console.log("Passport serialize Section");
	done(null,{id:id, name:id});
})
app.get("/", function(req, res){
	res.render("index",{
		isAuthenticated: req.isAuthenticated(),
		user: req.user
	});

})

app.get("/login", function(req, res){
	res.render("login");
});

app.post("/login", passport.authenticate('local'),function(req, res){
	res.redirect("/");

})

app.get("/logout", function(req, res){
	req.logout();
	res.redirect("/")
});

app.use("/api", passport.authenticate("basic", {session: false}));

app.get("/api/data", ensureAuthenticated, function(req, res){
	res.json([
			{value: 'foo'},
			{value: 'bar'},
			{value: 'baz'}
		]);
})

var port = process.env.PORT || 1337;

server.listen(port, function(){
	console.log("Server Listening to Port " + port);
})
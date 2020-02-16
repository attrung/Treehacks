var express = require("express");
var app = express();
var bodyParser = require("body-parser");
const houndifyExpress = require('houndify').HoundifyExpress;
const Houndify = require('houndify');

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");


app.use(express.static(__dirname + "/public"));

app.get("/", function(req, res){
  res.render("landing");
});

app.get("/home", function(req, res){
  res.redirect("/");
});

app.get('/houndifyAuth', houndifyExpress.createAuthenticationHandler({
  clientId:  "zps_7PSMlmeNbpVdeQfi5g==",
  clientKey: "xGW0T-wp27AT6ye6gARikAtHwpAttJw6Wo0qjezCWqrRHVjvM66YCNLRhD6WfNStA0NfJoke67kJELULzCIQTg=="
}));

//proxies text requests
app.post('/textSearchProxy', houndifyExpress.createTextProxyHandler());

app.get("/main", function(req, res){
  res.render("main");
})

app.get("/map", function(req, res){
  res.render("main2")
})

app.listen(process.env.PORT, process.env.IP, function(){
  console.log("Server started!");
})

var express = require("express");
var fire = require("./firebase");
var app = express();
var bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

const log4js = require('log4js')
const logger = log4js.getLogger();
logger.level = 'debug';

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

const DAYS = 1;
const expiresIn = 60 * 60 * 24 * DAYS * 1000;
const COOKIE_OPT = {maxAge: expiresIn, httpOnly: true};

app.use("/", express.static( __dirname + "/static"));
app.set("view engine", "ejs");

app.get("/", function (req, res) {
    res.render("./index.ejs");
});

app.get("/u/:id",async function (req, res) {
    const id = req.params.id;
    if(!id) return pushNotFound(res);

    const user = await fire.getUserByid(id);
    if(!user || !user.uid) return pushNotFound(res);

    const post = await fire.getNewPostOnUser(user.uid);
    if(!post) return pushNotFound(res);

    res.writeHead(302, {
        'Location': '/res/'+post.guid
    });
    res.end();
});

app.get("/mypage",async function (req, res) {
    const uid = await getUidFromSession(req); // Auth
    if(!uid) return res.json({status:"session error."})

    const posts = await fire.getPosts(uid);
    const user = await fire.getUserByUid(uid);
    if(!user || !posts) return pushNotFound(res);

    const data = {
        posts : posts,
        user : user
    }
    res.render("./mypage/",data);
});

app.get("/mypage/:postid",async function (req, res) {
    const postid = req.params.postid;
    const uid = await getUidFromSession(req); // Auth
    if(!uid) return res.json({status:"session error."})

    if(!postid) return pushNotFound(res);
    var post = await fire.getPost(postid);
    if(!post) return pushNotFound(res);
    var ress = await fire.getRes(postid);
    
    var data = {
        post : post,
        nocheck : [],
        checked : [],
    }
     
    if(ress) for(var r of ress){
        console.log(r)
        if(r["reply"]) data.checked.push(r);
        else data.nocheck.push(r);
    }

    res.render("./mypage/post/",data);
});

app.get("/res/:postid",async function (req, res) {

    const postid = req.params.postid;
    const post = await fire.getPost(postid);

    if(!post || !post.uid) return pushNotFound(res);
    const user = await fire.getUserByUid(post.uid);
    const id = user ? user.id : "";

    const data = {
        id : id,
        postid : postid,
        message : post.message
    }
    res.render("./res/index.ejs",data);
});

app.get("/create", function (req, res) {
    res.render("./create",);
});

/** Post */
app.post("/res/:postid",async function(req,res){
    const postid = req.params.postid;
    const message = req.body.message;

    if(!postid||!message) return pushNotFound(res);

    const r = await fire.addRes(postid,message)
    if(!r) return pushNotFound(res); 
    
    res.render("./res/sended.ejs",{message:message});
    res.end();
});

app.post("/create",async function (req, res) {
    const message = req.body.message;
    if(!message) return pushNotFound(res);

    const uid = await getUidFromSession(req) // Auth
    if(!uid) return pushNullSession(res);

    var guid = await fire.createPost(uid,message);
    res.render("./create/sended.ejs",{message:message});
});

/* Auth */
app.post('/login', async (req, res) => {
    // Get the ID token passed and the CSRF token.
    console.log(req.body);
    var idToken = req.body.idtoken.toString();
    var r = await fire.getSession(idToken,COOKIE_OPT);
    if(r){
        res.cookie("session",r,COOKIE_OPT);
        res.json({
            status : "success"
        })
    }else res.json({status:"error"})
});

app.post('/loggout', (req, res) => {
    res.clearCookie('session');
    res.redirect('/login');
});


app.listen(80,()=>console.log("start"));

async function getUidFromSession(req){
    var session = req.cookies.session;
    if(!session) null;
    var f = await fire.chackSession(session); // signin chk
    const uid = f ? f.uid : null;
    return uid; 
}

function pushNotFound(res){
    res.json({status:"Not Found"});
    res.end();
}

function pushNullSession(res){
    res.json({status:"auth error. null session."});
}
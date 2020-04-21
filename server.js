var express = require("express");
var fire = require("./firebase");
var app = express();
var bodyParser = require('body-parser');
const cookieParser = require('cookie-parser')

const fs = require("fs");
const http = require("http");
const https = require("https");
const SSL_KEY = "./server-key.pem";
const SSL_CERT = "./server-cert.pem"; //"/etc/letsencrypt/live/ccsv.g-cc.jp/cert.pem" 
const OPTIONS = {
    key: fs.readFileSync( SSL_KEY ),
    cert: fs.readFileSync( SSL_CERT ),
};

const log4js = require('log4js')
const logger = log4js.getLogger();
logger.level = 'debug';



app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(cookieParser());

const DAYS = 14;
const expiresIn = 60 * 60 * 24 * DAYS * 1000;
const COOKIE_OPT = {maxAge: expiresIn, httpOnly: true};

app.use("/", express.static( __dirname + "/static"));
app.set("view engine", "ejs");

app.get("/",async function (req, res) {
    var session = req.cookies.session;
    console.log("s is",session)
    if(session) {
        res.writeHead(302, {
            'Location': '/mypage'
        }); // ログイン中リダイレクト
        res.end();
        return;
    }
    res.render("./index.ejs");
});

app.get("/u/:id",async function (req, res) {
    const id = req.params.id;
    if(!id) return pushNotFound(res);

    const user = await fire.getUserByid(id);
    if(!user || !user.uid) return pushNotFound(res);

    const post = await fire.getNewPostOnUser(user.uid);
    //if(!post) return res.render("./res/nopost.ejs",{name:id})

    res.render("./user/",{
        post : post,
        user : user
    });
});

app.get("/mypage",async function (req, res) { // ログイン・登録後もここ
    const uid = await getUidFromSession(req); // Auth
    if(!uid) return pushNullSession(res);

    const posts = await fire.getPosts(uid);
    const user = await fire.getUserByUid(uid);
    if(!user) {
        res.writeHead(302, {
            'Location': '/mkuser/'
        });
        res.end();
        return;
    }
    if(!posts) return pushNotFound(res);

    const data = {
        posts : posts,
        user : user
    }
    console.log(data)
    res.render("./mypage/",data);
});

app.get("/every",async function (req, res) { // ログイン・登録後もここ
    const posts = await fire.getQuestionToEvery();
    if(!posts) return pushNotFound(res);

    var data = {
        posts : posts
    }

    res.render("./every/",data);
});

app.get("/myquestion",async function (req, res) { 
    const uid = await getUidFromSession(req); // Auth
    if(!uid) return pushNullSession(res);

    var data = {
        nocheck : [],
        checked : [],
    }

    var qss = await fire.getQuestionToMe(uid);

    if(qss) for(var r of qss){
        if(r["reply"]) data.checked.push(r);
        else data.nocheck.push(r);
    }

    res.render("./mypage/question.ejs",data);
});

app.get("/mypage/:postid",async function (req, res) {
    const postid = req.params.postid;
    const uid = await getUidFromSession(req); // Auth
    if(!uid) return pushNullSession(res);

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

app.get("/signin", function (req, res) {
    res.render("./signin");
});

app.get("/mkuser/",function (req,res){
    res.render("./mkuser");
})

/** Post */

/** 投稿にリプライ Ajax */
app.post("/rep/:resid",async function(req,res){
    const resid = req.params.resid;
    const message = req.body.message;
    if(!resid||!message) return pushNotFound(res);

    const uid = await getUidFromSession(req); // Auth
    if(!uid) return pushNullSession(res);

    fire.setResReply(resid,message);
    
    res.json({status:"success"});
    res.end();
});

/** 質問に回答 Ajax */
app.post("/myquestion/:qid",async function(req,res){
    const qid = req.params.qid;
    const message = req.body.message;
    if(!qid||!message) return pushNotFound(res);

    const uid = await getUidFromSession(req); // Auth
    if(!uid) return pushNullSession(res);

    fire.setAnswer(qid,message);
    
    res.json({status:"success"});
    res.end();
});

app.post("/res/:postid",async function(req,res){
    const postid = req.params.postid;
    const message = req.body.message;

    if(!postid||!message) return pushNotFound(res);

    const r = await fire.addRes(postid,message)
    if(!r) return pushNotFound(res); 
    
    res.render("./res/sended.ejs",{message:message});
    res.end();
});

/**質問をPOST */
app.post("/q/:uid",async function(req,res){
    const uid = req.params.uid;
    const message = req.body.message;
    if(!uid||!message) return pushNotFound(res);

    await fire.addQue(uid,message);
    res.render("./user/sended.ejs",{message:message});
    res.end();
});

/**アカウントID作成 Ajax */
app.post("/mkuser",async function(req,res){

    const id = req.body.id;
    if(!isHarfEisu(id)) return res.end();

    const uid = await getUidFromSession(req);
    if(!uid) return pushNotFound(res);
    
    var user = await fire.getUserByid(id);
    if(user) return res.json({status:"error",message:"既にユーザーが存在します。[Already exists.]"})

    user = await fire.createUser(uid,id);
    console.log("created")
    return res.json({status:"success"})

    function isHarfEisu(str){
        str = (str==null)?"":str;
        if(str.match(/^[A-Za-z0-9]+$/)){
          return true;
        }else{
          return false;
        }
    }
})

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
        res.cookie('session_time',new Date().getTime(),COOKIE_OPT);
        res.json({
            status : "success"
        })
    }else res.json({status:"error"})
});

app.get('/signout', (req, res) => { // GET
    res.clearCookie('session');
    res.clearCookie('session_time');
    res.render("./signout/")
});

const sv = https.createServer( OPTIONS, app );

sv.listen(443,()=>{
    console.log("start ApiSV.")
})

var app2 = express();

const sv2 = http.createServer(app2);

sv2.listen(80,()=>{
    console.log("start echo on http.")
});

function checkSession(res){
    
}

function _checkSessionInTime(timestamp){
    const LIFE_TIME = 60 * 60 * 1000; // (1h)
    if(isNaN(timestamp)) return false;
    return timestamp < new Date().getTime() + LIFE_TIME;
}

/** IDTokenを使い、新しいセッションを作成します。 */
async function _createNewSession(res,idToken){
    var st = await fire.getSession(idToken,COOKIE_OPT);
    if(st){
        res.cookie("session",st,COOKIE_OPT);
        res.cookie('session_time',new Date().getTime(),COOKIE_OPT);
    }else return false
    return st;
}

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
    res.writeHead(302, {
        'Location': '/signin/'
    });
    res.end();
}

test();
function test(){
    console.log(_checkSessionInTime(1587378656632))
}
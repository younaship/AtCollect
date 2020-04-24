var ac = {};
var view = {};

var db = null;
ac.fire_auth_state = null;
ac.uid = null;
ac.authIsReady = false;

/* --- OAuth --- */
/** Must init before use. */

function initFire(){
// Your web app's Firebase configuration
    var firebaseConfig = {
        apiKey: "AIzaSyBt_yWWVmAxNyaRLfazHOYPx8LhUIEbucA",
        authDomain: "at-collect.firebaseapp.com",
        databaseURL: "https://at-collect.firebaseio.com",
        projectId: "at-collect",
        storageBucket: "at-collect.appspot.com",
        messagingSenderId: "599682071066",
        appId: "1:599682071066:web:462e879eb2d3bc94fa6fa3",
        measurementId: "G-BCZ7KMF3N7"
    };
    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    firebase.auth().onAuthStateChanged(async(user) => {
        if(user) {
            ac.uid = user.uid;
            ac.fire_auth_state = user;
            ac.authIsReady = true;
            console.log("signin : ",ac.uid)
        }
        else ac.fire_auth_state = null;
    });

    db = firebase.firestore();
    console.log("fire inited.")
}

/**ログアウトします。 */
function logout(){
    firebase.auth().signOut();
}

function chkLoginAsync(waitCount){
    if(!waitCount) waitCount = 30; 
    return new Promise((x)=>{
        console.log("waiting auth result...")
        let int = setInterval(()=>{
            if(waitCount>0) waitCount--;
            else stop();
            if( ac.fire_auth_state ){
                console.log("complite get auth data.["+waitCount+"]");
                stop();
            };
        },100);
        function stop(){
            clearInterval(int);
            int = null;
            x(ac.fire_auth_state);
        }
    });
}


async function getToken(){
    return await firebase.auth().currentUser.getIdToken(true);
}

async function signInSv(data=null){

    const token = await getToken();
    
    return new Promise((x)=>{
        $.ajax({
            url:'/login',
            type:'POST',
            data:{
                uid : ac.uid || null,
                idtoken : token,
                data : data
            }
        })
        .done( (data) => {
            x(true);
        })
        .fail( (data) => {
            x(false);
        })
    })

}

/** callback({pushdata},"name")  */
ac.chkRedSignIn = function(callback,type="none"){

    firebase.auth().getRedirectResult().then(function(result) {
        if (result.credential) {
            var token = result.credential.accessToken;
            var secret = result.credential.secret;

            var name = result.user.displayName;
            var uid = result.user.uid;

            if(callback) callback({
                type : type,
                token : token,
                secret : secret,
                name : name,
                uid : uid,
            },name);
        }

        }).catch(function(error) {
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
            if(callback) callback(null);
        });
    
}

ac.signInWithMail = async function(){
    await firebase.auth().signInWithEmailAndPassword("a@test.jp","testuser");    
}

ac.signInWithTw = async function(){
    var provider = new firebase.auth.TwitterAuthProvider();
    firebase.auth().signInWithRedirect(provider);
}

ac.signInWithFace = async function(){
    var provider = new firebase.auth.FacebookAuthProvider();
    firebase.auth().signInWithRedirect(provider);
}

/* */

ac.sendReply = function(resid,reply){
    return new Promise((x)=>{
        $.ajax({
            url : '/rep/' +  resid,
            type : 'POST',
            data : {
                message : reply
            }
        })
        .done( (data) => {
            console.log("Ajax Success",data);
            if(data.status == "success") x(true);
            else x(false);
        })
        .fail( (data) => {
            console.log("Ajax Err",data);
            x(null)
        });
    }) 
}

ac.sendCheckedReply = function(pids){
    return new Promise((x)=>{
        $.ajax({
            url : '/rep',
            type : 'POST',
            data : {
                pids : pids
            }
        })
        .done( (data) => {
            console.log("Ajax Success",data);
            if(data.status == "success") x(true);
            else x(false);
        })
        .fail( (data) => {
            console.log("Ajax Err",data);
            x(null)
        });
    }) 
}

ac.sendAnswer = function(qid,reply){
    return new Promise((x)=>{
        $.ajax({
            url : '/myquestion/' +  qid,
            type : 'POST',
            data : {
                message : reply
            }
        })
        .done( (data) => {
            console.log("Ajax Success",data);
            if(data.status == "success") x(true);
            else x(false);
        })
        .fail( (data) => {
            console.log("Ajax Err",data);
            x(null)
        });
    }) 
}

ac.sendCheckedQuestion = function(qids){
    return new Promise((x)=>{
        $.ajax({
            url : '/myquestion',
            type : 'POST',
            data : {
                qids : qids
            }
        })
        .done( (data) => {
            console.log("Ajax Success",data);
            if(data.status == "success") x(true);
            else x(false);
        })
        .fail( (data) => {
            console.log("Ajax Err",data);
            x(null)
        });
    }) 
}

ac.sendQusetionToMe = function(message){ 
    const uid = ac.uid;
    if(!uid) return;
    return new Promise((x)=>{
        $.ajax({
            url : '/q/' + uid ,
            type : 'POST',
            data : {
                message : message,
                pri : true
            }
        })
        .done( (data) => {
            console.log("Ajax Success",data);
            x(true);
        })
        .fail( (data) => {
            console.log("Ajax Err",data);
            x(false);
        })
    });
}

view.showShareMyUrlWd = function(){
    
}


/* Cookie */
function setCookie(key,val){
    Cookies.set(key,val,{expires: 365 , path:"/"});
}
function getCookie(key){
    return Cookies.get(key);
}

/* Tool */
function getParam(name) {
    const url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function isHarfEisu(str){
  str = (str==null)?"":str;
  if(str.match(/^[A-Za-z0-9]+$/)){
    return true;
  }else{
    return false;
  }
}

function copyToClip(str){
    let textarea = $('<textarea></textarea>');
    textarea.text(str);
    $("body").append(textarea);
    textarea.select();
    document.execCommand('copy');
    textarea.remove();
}
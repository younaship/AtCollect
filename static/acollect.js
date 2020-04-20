var ac = {};

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
        }
        else ac.fire_auth_state = null;
    });

    db = firebase.firestore();
    console.log("fire inited.")
}

async function getToken(){
    return await firebase.auth().currentUser.getIdToken(true);
}

async function signIn(){

    await firebase.auth().signInWithEmailAndPassword("a@test.jp","testuser");
    const token = await getToken();
    
    $.ajax({
        url:'/login',
        type:'POST',
        data:{
            csrtoken : "csrfToken",
            idtoken : token
        }
    })
    // Ajaxリクエストが成功した時発動
    .done( (data) => {
        console.log("Ajax Success",data);
    })
    // Ajaxリクエストが失敗した時発動
    .fail( (data) => {
        console.log("Ajax Err",data);
    })

}

/* */

async function sendMessage(postid,message){  // No Use
    var token = await getToken();
    $.ajax({
        url : '/send/' + postid ,
        type : 'POST',
        data : {
            token : token,
            message : message
        }
    })
    .done( (data) => {
        console.log("Ajax Success",data);
    })
    .fail( (data) => {
        console.log("Ajax Err",data);
    })
}


/* Cookie */
function setCookie(key,val){
    Cookies.set(key,val,{expires: 365 , path:"/"});
}
function getCookie(key){
    return Cookies.get(key);
}

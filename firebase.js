var admin = require("firebase-admin");
var serviceAccount = require("./at-collect-firebase-adminsdk-3tqzn-3019b56693.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://at-collect.firebaseio.com"
});

const db = admin.firestore();

/** Uidからユーザー情報を取得します。 */
exports.getUserByUid = function(uid){
  return new Promise(async(x)=>{
    var snap = await db.collection("/users").where("uid","==",uid).limit(1)
      .get().catch((e)=>console.error(e));
    if(snap && snap.size>0) x(snap.docs[0].data());
    else x(null)
  });
}

/** idからユーザー情報(uid等)を取得します。 */
exports.getUserByid = function(id){
  return new Promise(async(x)=>{
    var snap = await db.collection("/users").where("id","==",id).limit(1)
      .get().catch((e)=>console.error(e));
    if(snap && snap.size>0) x(snap.docs[0].data());
    else x(null)
  });
}

/** 投稿を取得します。 */
exports.getPost = function(postid){
  return new Promise(async(x)=>{
    var doc = await db.doc("/posts/"+postid).get();
    x(doc.data());
  }).catch((e)=>x(null));
}

/** uidの最新投稿を取得します。 */
exports.getNewPostOnUser = function(uid){
  return new Promise(async(x)=>{
    var snap = await db.collection("/posts").where("uid","==",uid).orderBy("time","desc").limit(1)
      .get().catch((e)=>console.error(e));
    if(snap && snap.size>0) x(snap.docs[0].data());
    else x(null);
  });
}

<<<<<<< Updated upstream
=======
/** uidへの質問一覧を取得 */
exports.getQuestionToEvery = function(start = 0,size = 10){
  return new Promise((x)=>{
    var q = db.collection("/question").where("pri","==",false).orderBy("time","desc").limit(start+size);
    q.onSnapshot((snap)=>{
      var data = [];
      for(var d of snap.docs) data.push(d.data());
      x(data);
    },(e)=>{
      console.error(e)
      x(null)
    })
  });
}

/** uidへの質問一覧を取得 */
exports.getQuestionToMe = function(uid,start = 0,size = 10){
  return new Promise((x)=>{
    var q = db.collection("/question").where("to","==",uid).orderBy("time","desc").limit(start+size);
    q.onSnapshot((snap)=>{
      var data = [];
      for(var d of snap.docs) data.push(d.data());
      x(data);
    },(e)=>{
      console.error(e)
      x(null)
    })
  });
}

>>>>>>> Stashed changes
/** ユーザーの投稿一覧を取得します。 */
exports.getPosts = function(uid,start = 0,size = 10){
  return new Promise((x)=>{
    var q = db.collection("/posts").where("uid","==",uid).orderBy("time","desc").limit(start+size);
    q.onSnapshot((snap)=>{
      var data = [];
      for(var d of snap.docs) data.push(d.data());
      x(data);
    },(e)=>{
      console.error(e)
      x(null)
    })
  });
}

/** 投稿に対する匿名コメント一覧を取得します。 */
exports.getRes = function(postid){
  return new Promise((x)=>{
    var q = db.collection("/res").where("to","==",postid).orderBy("time","desc").limit(100);
    q.onSnapshot((snap)=>{
      var data = [];
      for(var d of snap.docs) data.push(d.data());
      x(data);
    },(e)=>{
      console.error(e)
      x(null)
    })
  });
}

/** 匿名コメントをします。 */
exports.addRes = function(postid,message){
  return new Promise(async(x)=>{
    try{
      var r = await db.collection("/res/").add({
        to : postid,
        message : message,
        time : admin.firestore.FieldValue.serverTimestamp(),
      });
      
      r.update({
        guid : r.id
      });
      x(r.id);
    
    }catch(e){
      x(null);
    }
  })
}

<<<<<<< Updated upstream
=======
/** uidへ匿名質問をします。*/
exports.addQue = function(uid,message,private = false){
  return new Promise(async(x)=>{
    try{
      var r = await db.collection("/question/").add({
        to : uid,
        message : message,
        time : admin.firestore.FieldValue.serverTimestamp(),
        pri : private
      });
      
      r.update({
        guid : r.id
      });
      x(r.id);
    
    }catch(e){
      x(null);
    }
  })
}

>>>>>>> Stashed changes
/** 匿名コメントにリプします。 */
exports.setResReply = function(guid,message){
  return new Promise((x)=>{
    db.doc("/res/"+guid).update({
      reply : message
    }).then((r)=>x(r)).catch((e)=>x(null));
  })
}

/** 質問にリプします。 */
exports.setAnswer = function(guid,message){
  return new Promise((x)=>{
    db.doc("/question/"+guid).update({
      reply : message
    }).then((r)=>x(r)).catch((e)=>x(null));
  })
}

/** <A>Sessionを取得します。 */
exports.getSession = function(idToken){
  return new Promise((x)=>{
    const DAYS = 14;
    const expiresIn = 60 * 60 * 24 * DAYS * 1000;

    admin.auth().createSessionCookie(idToken, {expiresIn})
      .then((sessionCookie) => {
        x(sessionCookie);
      }, (e) => {
        console.log("auth err",e)
        x(null);
    });
  });
}

exports.getUidByToken = function(idToken){
  if(!idToken) return null; 
  return new Promise((x)=>{
    admin.auth().verifyIdToken(idToken)
    .then(function(decodedToken) {
      let uid = decodedToken.uid;
      x(uid);
    }).catch(function(e) {
      console.log("Err Token",e)
      x(null);
    });
  })
}

/* ---PUSH--- */

/**Postを作成し、GUIDを返します。 */
exports.createPost = function(uid,message){
  return new Promise(async(x)=>{
    var ref = await db.collection("/posts").add({
      uid : uid,
      message : message,
      time : admin.firestore.FieldValue.serverTimestamp(),
    }).catch((e)=>console.error(e));

    ref.update({
      guid : ref.id
    })

    console.log("createed",ref)
    x(ref.id);
  })
}

/**ユーザーを作成、IDを返します。 */
exports.createUser = function(uid,id){
  return new Promise(async(x)=>{
    var ref = await db.collection("/users").add({
      uid : uid,
      id : id,
      time : admin.firestore.FieldValue.serverTimestamp(),
    }).catch((e)=>console.error(e));
    x(ref.id);
  })
}

exports.chackSession = function(sessionCookie){
  if(!sessionCookie) return false;
  return new Promise((x)=>{
    admin.auth().verifySessionCookie( sessionCookie, true )
      .then((decodedClaims) => {
        x(decodedClaims);
      })
      .catch(error => {
        x(null);
      }
    );
  })
}

//firebase.firestore.FieldValue.serverTimestamp()
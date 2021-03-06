const functions = require('firebase-functions'); 
const app = require('express')();
const FBAuth = require('./util/fbAuth');

const cors = require('cors');
app.use(cors());

const { db }= require('./util/admin');

const { getAllPosts, 
        singlePost, 
        getPost,
        commentPost,
        likePost,
        unlikePost,
        deletePost,
        getComments,
      } = require('./handlers/post');

const { 
        signup, 
        login, 
        uploadImage, 
        addUserDetails,
        getAuthenticatedUser,
        getUserDetails,
        markNotificationsRead 
       } = require('./handlers/user');

//Post routes
app.get('/posts', getAllPosts );
app.post('/post', FBAuth, singlePost); 
app.get('/post/:postId', getPost);
app.post('/post/:postId/comment', FBAuth, commentPost);
app.get('/post/:postId/like', FBAuth, likePost);
app.get('/post/:postId/unlike', FBAuth, unlikePost);
app.delete('/post/:postId', FBAuth, deletePost);
app.get('/comments', getComments);


//Singup and Login
app.post('/signup', signup);
app.post('/login', login);

//Users routes
app.post('/user/image', FBAuth, uploadImage);
app.post('/user', FBAuth, addUserDetails);
app.get('/user', FBAuth, getAuthenticatedUser);
app.get('/user/:handle', getUserDetails);
app.post('/notifications', FBAuth, markNotificationsRead);


exports.api = functions.https.onRequest(app);

exports.createNotificationOnLike = functions.firestore.document('likes/{id}')
       .onCreate((snapshot) => {
        return db.doc(`/posts/${snapshot.data().postId}`)
                 .get()
                 .then((doc) => {
                    if(doc.exists && doc.data().userHandle !== snapshot.data().userHandle){
                     return db.doc(`/notifications/${snapshot.id}`).set({
                         createdAt: new Date().toISOString(),
                         recipient: doc.data().userHandle,
                         sender: snapshot.data().userHandle,
                         type: 'like',
                         read: false,
                         postId: doc.id
                     });
                 }
             })
             .catch(err => {
                 console.error(err);
             });
       });


exports.deleteNotificationOnUnlike = functions
        .firestore.document('likes/{id}')
        .onDelete((snapshot) => {
            return db
            .doc(`/notifications/${snapshot.id}`)
            .delete()
            .catch((err) => {
                console.error(err);
                return;
            });
        });

exports.createNotificationOnComment = functions
       .firestore.document('comments/{id}')
       .onCreate(async (snapshot)=> {
        try {
               const doc = await db.doc(`/posts/${snapshot.data().postId}`)
                   .get();
               if (doc.exists && doc.data().userHandle !== snapshot.data().userHandle) {
                   return db.doc(`/notifications/${snapshot.id}`).set({
                       createdAt: new Date().toISOString(),
                       recipient: doc.data().userHandle,
                       sender: snapshot.data().userHandle,
                       type: 'comment',
                       read: false,
                       postId: doc.id
                   });
               }
           }
           catch (err) {
               console.error(err);
               return;
           }
    });


exports.onUserImageChange = functions.firestore.document('/users/{userId}')
    .onUpdate((change) => {
        console.log(change.before.data());
        console.log(change.after.data());
        if(change.before.data().imageUrl !== change.after.data().imageUrl){
            console.log('image has changed');
            const batch = db.batch();
            return db
                .collection('posts')
                .where('userHandle', '==', change.before.data().handle)
                .get()
                .then((data) => {
                  data.forEach((doc) => {
                    const post = db.doc(`/posts/${doc.id}`);
                    batch.update(post, {userImage: change.after.data().imageUrl});
                });
                return batch.commit();
        });
    } else return true;
});

exports.onPostDelete = functions.firestore.document('/posts/{postId}')
    .onDelete((snapshot, context) => {
        const postId = context.params.postId;
        const batch = db.batch();
        return db
            .collection('comments')
            .where('postId', '==', context.params.postId)
            .get()
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/comments/${doc.id}`));
                });
                return db
                       .collection('likes')
                       .where('postId', '==', context.params.postId)
                       .get();
            })
            .then((data) => {
                data.forEach((doc) => {
                    batch.delete(db.doc(`/likes/${doc.id}`));
                });
                return db
                    .collection('notifications')
                    .where('postId', '==', context.params.postId)
                    .get();
            })
            .then(data => {
                data.forEach(doc => {
                batch.delete(db.doc(`/notifications/${doc.id}`));
                });
                return batch.commit();
    })
    .catch(err=> console.error(err));
});
    



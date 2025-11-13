import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA_izgeYjlt4lrQbh4I5vrNkb0LxWZJIRs",
    authDomain: "nclyne-users.firebaseapp.com",
    projectId: "nclyne-users",
    storageBucket: "nclyne-users.appspot.com",
    messagingSenderId: "843296369716",
    appId: "1:843296369716:web:c4bd81678e7dd3b22fae61"
  };

const app = initializeApp(firebaseConfig);

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
    prompt: "select_account"
});

export const auth = getAuth();
export const signInWithGooglePopup = ()=> signInWithPopup(auth, googleProvider);

export const db = getFirestore();

export const createUserDocumentFromAuth = async (userAuth, additionalInfo)=>{
    if(!userAuth) return;
    const userDocRef = doc(db, 'users', userAuth.uid);


    const userSnapshot = await getDoc(userDocRef);

    if(!userSnapshot.exists()){
        const{ displayName, email} = userAuth;
        const createdAt = new Date();

        try{
            await setDoc(userDocRef, {displayName, email, createdAt});
        }catch(err){
            console.log("Error creating this event", err.message);
        }
    }
}
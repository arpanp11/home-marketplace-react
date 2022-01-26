import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

import googleIcon from '../assets/svg/googleIcon.svg';
import { db } from '../firebase.config';

function OAuth() {
  const navigate = useNavigate();
  const location = useLocation();

  const googleClickHandler = async () => {
    try {
      const auth = getAuth();
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      //   check for user
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);

      //   if user doesn't exist , create a new one
      if (!docSnap.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          name: user.displayName,
          email: user.email,
          timestamp: serverTimestamp(),
        });
      }
      navigate('/');
    } catch (error) {
      toast.error('Could not authorize with Google');
    }
  };

  return (
    <div className='socialLogin'>
      <p>Sign {location.pathname === '/sign-up' ? 'up' : 'in'} with </p>
      <button className='socialIconDiv' onClick={googleClickHandler}>
        <img src={googleIcon} alt='google' className='socialIconImg' />
      </button>
    </div>
  );
}

export default OAuth;

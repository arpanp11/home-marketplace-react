import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { toast } from 'react-toastify';
import { ReactComponent as ArrowRightIcon } from '../assets/svg/keyboardArrowRightIcon.svg';

function Forgotpassword() {
  const [email, setEmail] = useState('');

  const changeHandler = (e) => {
    setEmail(e.target.value);
  };

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      toast.success('Email was sent.');
    } catch (error) {
      toast.error('Could not send reset email.');
    }
  };

  return (
    <div className='pageContainer'>
      <header>
        <p className='pageHeader'>Forgot Password</p>
      </header>
      <main>
        <form onSubmit={submitHandler}>
          <input
            type='email'
            id='email'
            value={email}
            className='emailInput'
            placeholder='Email'
            onChange={changeHandler}
          />
          <Link className='forgotPasswordLink' to='/sign-in'>
            Sign In
          </Link>

          <div className='signInBar'>
            <div className='signInText'>Send Reset Link</div>
            <button className='signInButton'>
              <ArrowRightIcon fill='#FFFFFF' width='34px' height='34px' />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default Forgotpassword;

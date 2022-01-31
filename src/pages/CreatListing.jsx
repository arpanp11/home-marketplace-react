import { useState, useEffect, useRef } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

import Spinner from '../components/Spinner';
import { db } from '../firebase.config';

function CreatListing() {
  // eslint-disable-next-line
  const [geolocationEnabled, setGeolocationEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: 'rent',
    name: '',
    bedrooms: 1,
    bathrooms: 1,
    parking: false,
    furnished: false,
    address: '',
    offer: false,
    regularPrice: 0,
    discountedPrice: 0,
    images: {},
    latitude: 0,
    longitude: 0,
  });

  const {
    type,
    name,
    bedrooms,
    bathrooms,
    parking,
    furnished,
    address,
    offer,
    regularPrice,
    discountPrice,
    images,
    latitude,
    longitude,
  } = formData;

  const auth = getAuth();
  const navigate = useNavigate();
  const isMounted = useRef(true);

  useEffect(() => {
    if (isMounted) {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          setFormData({ ...formData, userRef: user.uid });
        } else {
          navigate('/sign-in');
        }
      });
    }
    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMounted]);

  const submitHandler = async (e) => {
    e.preventDefault();

    setLoading(true);

    // check discound price with regular price
    if (discountPrice >= regularPrice) {
      setLoading(false);
      toast.error('Discount price needs to be less than regular price');
      return;
    }

    // setup image upload limit
    if (images.length > 6) {
      setLoading(false);
      toast.error('Max 6 images');
      return;
    }

    //geolocation logic
    let geolocation = {};
    let location;

    if (geolocationEnabled) {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address}&key=${process.env.REACT_APP_GEOCODE_API_KEY}`
      );

      const data = await response.json();

      // ??--> check if value on left is null, then use right side value
      geolocation.lat = data.results[0]?.geometry.location.lat ?? 0;
      geolocation.lng = data.results[0]?.geometry.location.lng ?? 0;

      location =
        data.status === 'ZERO_RESULTS'
          ? undefined
          : data.results[0]?.formatted_address;

      if (location === undefined || location.includes('undefined')) {
        setLoading(false);
        toast.error('Please enter a correct address');
        return;
      }
    } else {
      geolocation.lat = latitude;
      geolocation.lng = longitude;
    }

    // store image in firebase database
    const storeImage = async (image) => {
      return new Promise((resolve, reject) => {
        const storage = getStorage();
        const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;

        // storage referance
        const storageRef = ref(storage, 'images/' + fileName);

        const uploadTask = uploadBytesResumable(storageRef, image);

        // refer firebase web document
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress =
              (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            switch (snapshot.state) {
              case 'paused':
                console.log('Upload is paused');
                break;
              case 'running':
                console.log('Upload is running');
                break;
              default:
                break;
            }
          },
          (error) => {
            reject(error);
          },
          () => {
            // Handle successful uploads on complete
            // For instance, get the download URL: https://firebasestorage.googleapis.com/...
            getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
              resolve(downloadURL);
            });
          }
        );
      });
    };

    const imageUrls = await Promise.all(
      [...images].map((image) => storeImage(image))
    ).catch(() => {
      setLoading(false);
      toast.error('Images not uploaded');
      return;
    });

    // console.log(imageUrls);

    const formDataCopy = {
      ...formData,
      imageUrls,
      geolocation,
      timestamp: serverTimestamp(),
    };

    formDataCopy.location = address;
    // clean up, don't want image and address to save
    delete formDataCopy.images;
    delete formDataCopy.address;
    !formDataCopy.offer && delete formDataCopy.discountedPrice;

    const docRef = await addDoc(collection(db, 'listings'), formDataCopy);
    setLoading(false);
    toast.success('Listing saved');
    navigate(`/category/${formDataCopy.type}/${docRef.id}`);
  };

  const mutateHandler = (e) => {
    let boolean = null;

    if (e.target.value === 'true') {
      boolean = true;
    }
    if (e.target.value === 'false') {
      boolean = false;
    }

    // check if is files
    if (e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        images: e.target.files,
      }));
    }

    // check if id text/booleans/numbers
    if (!e.target.files) {
      setFormData((prevState) => ({
        ...prevState,
        // ??--> check if value on left is null, then use right side value
        [e.target.id]: boolean ?? e.target.value,
      }));
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className='profile'>
      <header>
        <p className='pageHeader'>Create a Listing</p>
      </header>
      <main>
        <form onSubmit={submitHandler}>
          <label className='formLabel'>Sell / Rent</label>

          <div className='formButtons'>
            {/* sell button */}
            <button
              type='button'
              className={type === 'sale' ? 'formButtonActive' : 'formButton'}
              id='type'
              value='sale'
              onClick={mutateHandler}
            >
              Sell
            </button>
            {/* rent button */}
            <button
              type='button'
              className={type === 'rent' ? 'formButtonActive' : 'formButton'}
              id='type'
              value='rent'
              onClick={mutateHandler}
            >
              Rent
            </button>
          </div>

          {/* name */}
          <label className='formLabel'>Name</label>
          <input
            className='formInputName'
            type='text'
            id='name'
            value={name}
            onChange={mutateHandler}
            maxLength='32'
            minLength='10'
            required
          />

          <div className='formRooms flex'>
            {/* bedroom no. */}
            <div>
              <label className='formLabel'>Bedrooms</label>
              <input
                className='formInputSmall'
                type='number'
                id='bedrooms'
                value={bedrooms}
                onChange={mutateHandler}
                min='1'
                max='50'
                required
              />
            </div>
            {/* bathroom no. */}
            <div>
              <label className='formLabel'>Bathrooms</label>
              <input
                className='formInputSmall'
                type='number'
                id='bathrooms'
                value={bathrooms}
                onChange={mutateHandler}
                min='1'
                max='50'
                required
              />
            </div>
          </div>

          {/* parking spot */}
          <label className='formLabel'>Parking spot</label>
          <div className='formButtons'>
            <button
              className={parking ? 'formButtonActive' : 'formButton'}
              type='button'
              id='parking'
              value={true}
              onClick={mutateHandler}
              min='1'
              max='50'
            >
              Yes
            </button>
            <button
              className={
                !parking && parking !== null ? 'formButtonActive' : 'formButton'
              }
              type='button'
              id='parking'
              value={false}
              onClick={mutateHandler}
            >
              No
            </button>
          </div>

          {/* furnished */}
          <label className='formLabel'>Furnished</label>
          <div className='formButtons'>
            <button
              className={furnished ? 'formButtonActive' : 'formButton'}
              type='button'
              id='furnished'
              value={true}
              onClick={mutateHandler}
            >
              Yes
            </button>
            <button
              className={
                !furnished && furnished !== null
                  ? 'formButtonActive'
                  : 'formButton'
              }
              type='button'
              id='furnished'
              value={false}
              onClick={mutateHandler}
            >
              No
            </button>
          </div>

          {/* address */}
          <label className='formLabel'>Address</label>
          <textarea
            className='formInputAddress'
            type='text'
            id='address'
            value={address}
            onChange={mutateHandler}
            required
          />

          {!geolocationEnabled && (
            <div className='formLatLng flex'>
              <div>
                <label className='formLabel'>Latitude</label>
                <input
                  className='formInputSmall'
                  type='number'
                  id='latitude'
                  value={latitude}
                  onChange={mutateHandler}
                  required
                />
              </div>
              <div>
                <label className='formLabel'>Longitude</label>
                <input
                  className='formInputSmall'
                  type='number'
                  id='longitude'
                  value={longitude}
                  onChange={mutateHandler}
                  required
                />
              </div>
            </div>
          )}

          {/* offer */}
          <label className='formLabel'>Offer</label>
          <div className='formButtons'>
            <button
              className={offer ? 'formButtonActive' : 'formButton'}
              type='button'
              id='offer'
              value={true}
              onClick={mutateHandler}
            >
              Yes
            </button>
            <button
              className={
                !offer && offer !== null ? 'formButtonActive' : 'formButton'
              }
              type='button'
              id='offer'
              value={false}
              onClick={mutateHandler}
            >
              No
            </button>
          </div>

          {/* regular price */}
          <label className='formLabel'>Regular Price</label>
          <div className='formPriceDiv'>
            <input
              className='formInputSmall'
              type='number'
              id='regularPrice'
              value={regularPrice}
              onChange={mutateHandler}
              min='50'
              max='750000000'
              required
            />
            {type === 'rent' && <p className='formPriceText'>$ / Month</p>}
          </div>

          {offer && (
            <>
              <label className='formLabel'>Discount Price</label>
              <input
                className='formInputSmall'
                type='number'
                id='discountPrice'
                value={discountPrice}
                onChange={mutateHandler}
                min='50'
                max='750000000'
                required={offer}
              />
            </>
          )}

          {/* images */}
          <label className='formLabel'>Images</label>
          <p className='imagesInfo'>
            The first image will be the cover (max 6).
          </p>
          <input
            className='formInputFile'
            type='file'
            id='images'
            onChange={mutateHandler}
            max='6'
            accept='.jpg,.png,.jpeg'
            multiple
            required
          />

          <button type='submit' className='primaryButton createListingButton'>
            Create Listing
          </button>
        </form>
      </main>
    </div>
  );
}

export default CreatListing;

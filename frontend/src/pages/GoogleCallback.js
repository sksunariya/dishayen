import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { updateUser } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google authentication failed');
      navigate('/login');
      return;
    }

    if (token) {
      localStorage.setItem('token', token);
      
      // Fetch user data
      import('../utils/api').then(({ default: api }) => {
        api.get('/auth/me')
          .then(response => {
            updateUser(response.data.user);
            toast.success('Logged in with Google successfully!');
            navigate('/');
          })
          .catch(() => {
            toast.error('Failed to fetch user data');
            navigate('/login');
          });
      });
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, updateUser]);

  return <LoadingSpinner />;
};

export default GoogleCallback;


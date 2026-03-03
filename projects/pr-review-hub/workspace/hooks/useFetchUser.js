import axios from 'axios';

const useFetchUser = (userId) => {
  return axios.get(`https://api.example.com/users/${userId}`);
};

export default useFetchUser;

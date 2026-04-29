import axios from 'axios';

const api = axios.create({
  baseURL: 'https://darkgray-yak-842420.hostingersite.com/api/v1',
});

export default api;

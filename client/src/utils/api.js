import axios from 'axios';

class API {
  constructor() {
    const baseURL = process.env.NODE_ENV === 'production'
      ? process.env.REACT_APP_API_URL || '' // Will default to same domain in production
      : 'http://localhost:3001';

    this.instance = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    this.instance.interceptors.request.use(
      config => {
        console.log('Making request:', {
          url: config.url,
          method: config.method,
          data: config.data,
          baseURL: config.baseURL
        });
        return config;
      },
      error => {
        console.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    this.instance.interceptors.response.use(
      response => {
        console.log('Response received:', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      error => {
        console.error('API Error Details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          config: {
            url: error.config?.url,
            method: error.config?.method,
            baseURL: error.config?.baseURL,
            data: error.config?.data
          }
        });
        return Promise.reject(error);
      }
    );
  }

  post(url, data) {
    const apiUrl = url.startsWith('/api') ? url : `/api${url}`;
    console.log('Making POST request to:', apiUrl, 'with data:', data);
    return this.instance.post(apiUrl, data);
  }

  get(url) {
    const apiUrl = url.startsWith('/api') ? url : `/api${url}`;
    return this.instance.get(apiUrl);
  }

  put(url, data) {
    const apiUrl = url.startsWith('/api') ? url : `/api${url}`;
    return this.instance.put(apiUrl, data);
  }

  delete(url) {
    const apiUrl = url.startsWith('/api') ? url : `/api${url}`;
    return this.instance.delete(apiUrl);
  }
}

export default new API();
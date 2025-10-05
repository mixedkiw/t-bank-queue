// Автоматическое определение API URL в зависимости от среды
const getApiBaseUrl = () => {
  // В Docker окружении используем внутренний адрес
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
//  // Для разработки с локальным бэкендом
//  if (process.env.NODE_ENV === 'development') {
//    return 'http://localhost:8000/api';
//  }
  
  // Для продакшена или serveo
  return 'https://066ff06344c5a28599c72cdb57b1d625.serveo.net/api';
};

export const API_BASE_URL = getApiBaseUrl();
console.log('🔧 API Base URL:', API_BASE_URL);
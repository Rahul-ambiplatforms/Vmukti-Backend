const generateOTP = () => {
    // Generate a 6-digit numeric OTP
    return Math.floor(100000 + Math.random() * 900000).toString();
  };
  
  const getOTPExpirationTime = () => {
    // OTP expires in 10 minutes
    return new Date(Date.now() + 10 * 60 * 1000);
  };
  
  module.exports = { generateOTP, getOTPExpirationTime };
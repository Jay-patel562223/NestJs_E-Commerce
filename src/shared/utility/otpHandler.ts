import bcrypt from 'bcrypt';

export const generateHashOtp = async (otp: string) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(otp, salt);
};

export const compareOtp = async (otp?: string, hashOtp?: string | any) => {
  return await bcrypt.compare(otp, hashOtp);
};
